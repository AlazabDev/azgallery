# AzGallery

AzGallery is an open client-facing project gallery for Alazab projects. Clients can review public projects, open project images, add text comments, and optionally pin comments to a specific point on the image without authentication.

## Production runtime

The production server should run behind Nginx with PM2:

```bash
pnpm build
pm2 start ecosystem.config.cjs --update-env
```

The app is intentionally bound to localhost (`127.0.0.1:3033`) and exposed publicly only through Nginx.

## Required environment variables

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Optional comment notification variables

When a client submits a comment, the server saves it first. Then it sends a best-effort webhook notification if configured:

```bash
AZGALLERY_PUBLIC_BASE_URL=https://photos.alazab.com
AZGALLERY_COMMENT_WEBHOOK_URL=
AZGALLERY_COMMENT_WEBHOOK_TOKEN=
```

If `AZGALLERY_COMMENT_WEBHOOK_URL` is not set or the webhook fails, the comment still remains saved and the visitor experience succeeds.

## Client workflow

1. Client opens a public project.
2. Client opens/reviews project images.
3. Client writes a text comment.
4. Client can optionally click a position on the image so the comment is pinned to that location.
5. The comment is stored in `image_comments`.
6. A notification webhook is sent after save when configured.

Authentication is intentionally not required for this public review workflow.
