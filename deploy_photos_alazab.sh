#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/azab-hub/azgallery"
DOMAIN="photos.alazab.com"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"
WEB_ROOT="${APP_DIR}/dist/client"

echo "========================================"
echo "Deploy ${DOMAIN}"
echo "APP_DIR: ${APP_DIR}"
echo "WEB_ROOT: ${WEB_ROOT}"
echo "========================================"

cd "$APP_DIR"

echo "1) Checking project files..."

if [ ! -f "${APP_DIR}/index.html" ]; then
  echo "ERROR: Missing ${APP_DIR}/index.html"
  exit 1
fi

if [ ! -d "${APP_DIR}/public" ]; then
  echo "ERROR: Missing ${APP_DIR}/public"
  exit 1
fi

if [ ! -f "${APP_DIR}/package.json" ]; then
  echo "ERROR: Missing package.json"
  exit 1
fi

echo "OK: root index.html exists"
echo "OK: public directory exists"

echo "2) Checking public assets..."
find "${APP_DIR}/public" -maxdepth 2 -type f | sort | sed 's#^#  - #'

echo "3) Installing dependencies..."
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Trying corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi

pnpm install

echo "4) Building app..."
rm -rf "${APP_DIR}/dist" "${APP_DIR}/.vite" "${APP_DIR}/node_modules/.vite"
pnpm build

echo "5) Verifying build output..."

if [ ! -f "${WEB_ROOT}/index.html" ]; then
  echo "ERROR: Build did not create ${WEB_ROOT}/index.html"
  echo "Current dist tree:"
  find "${APP_DIR}/dist" -maxdepth 4 -type f | sort | head -120
  exit 1
fi

echo "OK: ${WEB_ROOT}/index.html exists"

echo "6) Verifying public files copied to build output..."

for file in favicon.ico favicon.png apple-touch-icon.png og-image.jpg og-image.png manifest.webmanifest robots.txt sitemap.xml azabot.gif download.html; do
  if [ -f "${WEB_ROOT}/${file}" ]; then
    echo "OK: /${file}"
  else
    echo "WARN: Missing /${file} in ${WEB_ROOT}"
  fi
done

echo "7) Writing Nginx config..."

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

    root ${WEB_ROOT};
    index index.html;

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log  /var/log/nginx/${DOMAIN}.error.log;

    client_max_body_size 50M;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|webmanifest)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files \$uri =404;
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

    root ${WEB_ROOT};
    index index.html;

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log  /var/log/nginx/${DOMAIN}.error.log;

    client_max_body_size 50M;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|xml|txt|webmanifest)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files \$uri =404;
    }

    location ~ /\. {
        deny all;
    }
}
NGINX
fi

ln -sf "$NGINX_SITE" "$NGINX_ENABLED"

echo "8) Fixing permissions..."

chmod o+x /opt || true
chmod o+x /opt/azab-hub || true
chmod o+x "$APP_DIR" || true

find "$WEB_ROOT" -type d -exec chmod 755 {} \;
find "$WEB_ROOT" -type f -exec chmod 644 {} \;

if sudo -u www-data test -r "${WEB_ROOT}/index.html"; then
  echo "OK: www-data can read index.html"
else
  echo "ERROR: www-data cannot read ${WEB_ROOT}/index.html"
  namei -l "${WEB_ROOT}/index.html"
  exit 1
fi

echo "9) Testing and reloading Nginx..."

nginx -t
systemctl reload nginx

echo "10) HTTP tests..."

echo "--- HTTPS index ---"
curl -I "https://${DOMAIN}" || true

echo "--- Public assets ---"
curl -I "https://${DOMAIN}/favicon.ico" || true
curl -I "https://${DOMAIN}/og-image.jpg" || true
curl -I "https://${DOMAIN}/azabot.gif" || true
curl -I "https://${DOMAIN}/download.html" || true
curl -I "https://${DOMAIN}/manifest.webmanifest" || true

echo "========================================"
echo "DONE"
echo "Expected:"
echo "  https://${DOMAIN} => HTTP/2 200"
echo "  public assets => 200"
echo "========================================"
