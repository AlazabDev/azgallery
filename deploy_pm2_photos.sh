#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/azab-hub/azgallery"
DOMAIN="photos.alazab.com"
APP_NAME="azgallery"
PORT="3033"
HOST="127.0.0.1"
CLIENT_DIR="${APP_DIR}/dist/client"
SERVER_FILE="${APP_DIR}/dist/server/server.js"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

echo "===================================="
echo "Deploy ${DOMAIN} with PM2"
echo "APP_DIR=${APP_DIR}"
echo "PORT=${PORT}"
echo "===================================="

cd "$APP_DIR"

echo "1) Remove old systemd service if exists..."
systemctl disable --now "$APP_NAME" 2>/dev/null || true
rm -f "/etc/systemd/system/${APP_NAME}.service"
systemctl daemon-reload || true

echo "2) Check project files..."
test -f package.json || { echo "ERROR: package.json missing"; exit 1; }
test -f index.html || { echo "ERROR: root index.html missing"; exit 1; }
test -d public || { echo "ERROR: public directory missing"; exit 1; }

echo "3) Install PM2 if missing..."
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "PM2:"
pm2 -v

echo "4) Install dependencies..."
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@latest --activate
fi

pnpm install

echo "5) Build app..."
rm -rf dist .vite node_modules/.vite
pnpm build

echo "6) Verify build output..."
if [ ! -f "$SERVER_FILE" ]; then
  echo "ERROR: Missing SSR server file: $SERVER_FILE"
  find dist -maxdepth 4 -type f | sort | head -120 || true
  exit 1
fi

if [ ! -f "${CLIENT_DIR}/index.html" ]; then
  echo "ERROR: Missing client index: ${CLIENT_DIR}/index.html"
  find dist -maxdepth 4 -type f | sort | head -120 || true
  exit 1
fi

echo "OK: $SERVER_FILE"
echo "OK: ${CLIENT_DIR}/index.html"

echo "7) Fix permissions..."
chmod o+x /opt || true
chmod o+x /opt/azab-hub || true
chmod o+x "$APP_DIR" || true

find "$CLIENT_DIR" -type d -exec chmod 755 {} \;
find "$CLIENT_DIR" -type f -exec chmod 644 {} \;

echo "8) Start app with PM2..."
pm2 delete "$APP_NAME" 2>/dev/null || true

NODE_ENV=production \
HOST="$HOST" \
PORT="$PORT" \
pm2 start "$SERVER_FILE" \
  --name "$APP_NAME" \
  --cwd "$APP_DIR" \
  --interpreter "$(command -v node)" \
  --time \
  --update-env

pm2 save

echo "9) Test local PM2 app..."
sleep 2
pm2 status "$APP_NAME"

if curl -fsSI "http://${HOST}:${PORT}" >/dev/null; then
  echo "OK: PM2 app responds on http://${HOST}:${PORT}"
else
  echo "ERROR: PM2 app not responding on http://${HOST}:${PORT}"
  pm2 logs "$APP_NAME" --lines 100 --nostream
  exit 1
fi

echo "10) Write Nginx config..."

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
    index index.html;

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log  /var/log/nginx/${DOMAIN}.error.log;

    client_max_body_size 50M;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|webmanifest|html)$ {
        try_files \$uri @azgallery_pm2;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        try_files \$uri \$uri/ @azgallery_pm2;
    }

    location @azgallery_pm2 {
        proxy_pass http://${HOST}:${PORT};
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location ~ /\. {
        deny all;
    }
}
NGINX

ln -sf "$NGINX_SITE" "$NGINX_ENABLED"

echo "11) Test and reload Nginx..."
nginx -t
systemctl reload nginx

echo "12) Final tests..."
curl -I "https://${DOMAIN}" || true
curl -I "https://${DOMAIN}/azabot.gif" || true
curl -I "https://${DOMAIN}/download.html" || true
curl -I "https://${DOMAIN}/favicon.ico" || true
curl -I "https://${DOMAIN}/og-image.jpg" || true

echo "===================================="
echo "DONE"
echo "PM2 commands:"
echo "  pm2 status"
echo "  pm2 logs ${APP_NAME}"
echo "  pm2 restart ${APP_NAME} --update-env"
echo "===================================="
