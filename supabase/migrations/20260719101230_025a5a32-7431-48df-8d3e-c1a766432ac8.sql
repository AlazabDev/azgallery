
CREATE TABLE public.gallery_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  comments_enabled BOOLEAN NOT NULL DEFAULT true,
  positional_comments_enabled BOOLEAN NOT NULL DEFAULT true,
  require_visitor_phone BOOLEAN NOT NULL DEFAULT false,
  default_grid_columns INTEGER NOT NULL DEFAULT 4 CHECK (default_grid_columns BETWEEN 1 AND 8),
  lightbox_autoplay BOOLEAN NOT NULL DEFAULT false,
  lightbox_show_thumbnails BOOLEAN NOT NULL DEFAULT true,
  show_phase_badges BOOLEAN NOT NULL DEFAULT true,
  show_capture_date BOOLEAN NOT NULL DEFAULT true,
  gallery_intro TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (id = 'default')
);

GRANT SELECT ON public.gallery_settings TO anon, authenticated;
GRANT ALL ON public.gallery_settings TO service_role;

ALTER TABLE public.gallery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read gallery settings"
  ON public.gallery_settings FOR SELECT
  USING (true);

INSERT INTO public.gallery_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
