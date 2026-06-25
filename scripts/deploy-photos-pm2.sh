#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/azab-hub/azgallery"
DOMAIN="photos.alazab.com"
PORT="3033"
HOST="127.0.0.1"
APP_NAME="azgallery"
CLIENT_DIR="${APP_DIR}/dist/client"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

log() { printf '\n== %s ==\n' "$*"; }

log "Clean deploy ${DOMAIN} with PM2 + vite preview"
cd "$APP_DIR"

log "Preflight"
test -f package.json || { echo "ERROR: package.json missing"; exit 1; }
test -f index.html || { echo "ERROR: index.html missing at project root"; exit 1; }
test -d public || { echo "ERROR: public directory missing"; exit 1; }

log "Install dependencies"
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@latest --activate
fi
pnpm install

log "Build"
rm -rf dist .vite node_modules/.vite
pnpm build

test -d "$CLIENT_DIR" || { echo "ERROR: dist/client missing after build"; exit 1; }
test -f "$CLIENT_DIR/azabot.gif" || echo "WARN: azabot.gif not found in dist/client"
test -f "$CLIENT_DIR/download.html" || echo "WARN: download.html not found in dist/client"

log "PM2 setup"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pm2 delete "$APP_NAME" 2>/dev/null || true
HOST="$HOST" PORT="$PORT" NODE_ENV=production pm2 start ecosystem.config.cjs --update-env
pm2 save

sleep 3
pm2 list

log "Check local preview listener"
if ! ss -lntp | grep -q ":${PORT} "; then
  echo "ERROR: ${APP_NAME} is not listening on ${HOST}:${PORT}"
  pm2 logs "$APP_NAME" --lines 120 --nostream || true
  exit 1
fi

curl -fsSI "http://${HOST}:${PORT}" >/dev/null || {
  echo "ERROR: local preview did not answer http://${HOST}:${PORT}"
  pm2 logs "$APP_NAME" --lines 120 --nostream || true
  exit 1
}

log "Nginx config"
cat > "$NGINX_SITE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name ${DOMAIN};

    root ${CLIENT_DIR};

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log  /var/log/nginx/${DOMAIN}.error.log;

    client_max_body_size 50M;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location ~* \\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|webmanifest|html)$ {
        try_files \$uri @azgallery_pm2;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        proxy_pass http://${HOST}:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location @azgallery_pm2 {
        proxy_pass http://${HOST}:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ~ /\\. {
        deny all;
    }
}
NGINX

ln -sf "$NGINX_SITE" "$NGINX_ENABLED"

log "Permissions"
chmod o+x /opt || true
chmod o+x /opt/azab-hub || true
chmod o+x "$APP_DIR" || true
find "$CLIENT_DIR" -type d -exec chmod 755 {} \;
find "$CLIENT_DIR" -type f -exec chmod 644 {} \;

log "Close public access to ${PORT}; nginx uses localhost only"
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw delete allow "${PORT}/tcp" 2>/dev/null || true
  ufw reload || true
fi

log "Reload nginx"
nginx -t
systemctl reload nginx

log "Final tests"
curl -I "http://${HOST}:${PORT}" || true
curl -I "https://${DOMAIN}" || true
curl -I "https://${DOMAIN}/azabot.gif" || true
curl -I "https://${DOMAIN}/download.html" || true
curl -I "https://${DOMAIN}/manifest.webmanifest" || true

log "Done"
echo "PM2: pm2 status | pm2 logs ${APP_NAME} --lines 120"
