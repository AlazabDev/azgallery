
-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Images
CREATE TABLE public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_images_project_id ON public.project_images(project_id);

-- Image Comments (no auth required; visitor info)
CREATE TABLE public.image_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.project_images(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_session TEXT,
  comment_text TEXT NOT NULL,
  position_x NUMERIC(5,2),
  position_y NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_position CHECK (
    (position_x IS NULL AND position_y IS NULL) OR
    (position_x BETWEEN 0 AND 100 AND position_y BETWEEN 0 AND 100)
  ),
  CONSTRAINT chk_text_length CHECK (char_length(comment_text) BETWEEN 1 AND 2000),
  CONSTRAINT chk_name_length CHECK (char_length(visitor_name) BETWEEN 1 AND 100)
);

CREATE INDEX idx_image_comments_image_id ON public.image_comments(image_id);
CREATE INDEX idx_image_comments_project_id ON public.image_comments(project_id);

-- Grants (server uses service_role; we don't expose anon writes - all via server functions)
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.project_images TO anon, authenticated;
GRANT SELECT ON public.image_comments TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.project_images TO service_role;
GRANT ALL ON public.image_comments TO service_role;

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public projects are viewable" ON public.projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Images of public projects viewable" ON public.project_images
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true
  ));

CREATE POLICY "Comments of public projects viewable" ON public.image_comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true
  ));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
