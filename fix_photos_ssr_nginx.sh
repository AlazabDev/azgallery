#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/azab-hub/azgallery"
DOMAIN="photos.alazab.com"
PORT="3033"
CLIENT_DIR="$APP_DIR/dist/client"
SERVER_FILE="$APP_DIR/dist/server/server.js"
SERVICE_NAME="azgallery"
NGINX_SITE="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"

cd "$APP_DIR"

echo "== 1) Check build output =="

if [ ! -f "$SERVER_FILE" ]; then
  echo "ERROR: Missing $SERVER_FILE"
  echo "Run: cd $APP_DIR && pnpm build"
  exit 1
fi

if [ ! -d "$CLIENT_DIR" ]; then
  echo "ERROR: Missing $CLIENT_DIR"
  echo "Run: cd $APP_DIR && pnpm build"
  exit 1
fi

echo "OK: server file exists: $SERVER_FILE"
echo "OK: client dir exists: $CLIENT_DIR"

echo "== 2) Check client files =="
find "$CLIENT_DIR" -maxdepth 2 -type f | sort | head -80

echo "== 3) Fix permissions =="
chmod o+x /opt || true
chmod o+x /opt/azab-hub || true
chmod o+x "$APP_DIR" || true

find "$CLIENT_DIR" -type d -exec chmod 755 {} \;
find "$CLIENT_DIR" -type f -exec chmod 644 {} \;

NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  echo "ERROR: node not found"
  exit 1
fi

echo "Node: $NODE_BIN"

echo "== 4) Create systemd service =="

cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<SERVICE
[Unit]
Description=AzGallery SSR App for ${DOMAIN}
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
Environment=HOST=127.0.0.1
ExecStart=${NODE_BIN} ${SERVER_FILE}
Restart=always
RestartSec=5
User=root
Group=root

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

sleep 2

echo "== 5) Check local Node server =="
systemctl --no-pager --full status "$SERVICE_NAME" || true

if curl -fsSI "http://127.0.0.1:${PORT}" >/dev/null; then
  echo "OK: SSR server responds on 127.0.0.1:${PORT}"
else
  echo "ERROR: SSR server not responding on 127.0.0.1:${PORT}"
  echo "Logs:"
  journalctl -u "$SERVICE_NAME" -n 80 --no-pager
  exit 1
fi

echo "== 6) Write Nginx config =="

if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" ]; then
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

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|webmanifest)$ {
        try_files \$uri =404;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        try_files \$uri @azgallery_ssr;
    }

    location @azgallery_ssr {
        proxy_pass http://127.0.0.1:${PORT};
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
else
cat > "$NGINX_SITE" <<NGINX
server {
    listen 80;
    listen [::]:80;

    server_name ${DOMAIN};

    root ${CLIENT_DIR};
    index index.html;

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log  /var/log/nginx/${DOMAIN}.error.log;

    client_max_body_size 50M;

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|webmanifest)$ {
        try_files \$uri =404;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        try_files \$uri @azgallery_ssr;
    }

    location @azgallery_ssr {
        proxy_pass http://127.0.0.1:${PORT};
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
fi

ln -sf "$NGINX_SITE" "$NGINX_ENABLED"

echo "== 7) Test and reload Nginx =="
nginx -t
systemctl reload nginx

echo "== 8) Final tests =="
echo "--- root ---"
curl -I "https://${DOMAIN}" || true

echo "--- public files ---"
curl -I "https://${DOMAIN}/azabot.gif" || true
curl -I "https://${DOMAIN}/download.html" || true
curl -I "https://${DOMAIN}/favicon.ico" || true
curl -I "https://${DOMAIN}/og-image.jpg" || true

echo "== DONE =="
