
-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public projects readable by anyone" ON public.projects FOR SELECT USING (is_public = true);

-- Project images
CREATE TABLE public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  phase TEXT CHECK (phase IN ('start','execution','finishing','delivery')),
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_images_project ON public.project_images(project_id, sort_order);
GRANT SELECT ON public.project_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_images TO authenticated;
GRANT ALL ON public.project_images TO service_role;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images of public projects readable" ON public.project_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true));

-- Image comments
CREATE TABLE public.image_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.project_images(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  text TEXT NOT NULL,
  position_x NUMERIC,
  position_y NUMERIC,
  status TEXT NOT NULL DEFAULT 'open',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_image_comments_image ON public.image_comments(image_id);
CREATE INDEX idx_image_comments_project ON public.image_comments(project_id);
GRANT SELECT, INSERT ON public.image_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_comments TO authenticated;
GRANT ALL ON public.image_comments TO service_role;
ALTER TABLE public.image_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open comments visible on public projects" ON public.image_comments FOR SELECT
  USING (status = 'open' AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true));
CREATE POLICY "Anyone can post comments on public projects" ON public.image_comments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true));

-- Restrict visitor_phone from anon selects
REVOKE SELECT ON public.image_comments FROM anon;
GRANT SELECT (id, project_id, image_id, visitor_name, text, position_x, position_y, status, created_at) ON public.image_comments TO anon;

-- Seed the Cloudinary import project
INSERT INTO public.projects (id, slug, name, description, is_public)
VALUES (
  'c10ad000-0000-0000-0000-000000000001',
  'cloudinary-import',
  'استيراد Cloudinary',
  'استيراد مجمّع لكل الصور المتاحة من حساب Cloudinary (500 صورة).',
  true
);
