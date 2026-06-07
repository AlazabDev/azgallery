
-- Add timeline fields to project_images
ALTER TABLE public.project_images
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phase TEXT;

-- Backfill captured_at from created_at where null, spread sort_order across days for demo
UPDATE public.project_images
SET captured_at = COALESCE(captured_at, created_at - (sort_order || ' days')::interval * 7)
WHERE captured_at IS NULL;

-- Assign phases based on sort_order position within project
WITH ranked AS (
  SELECT id, project_id,
    NTILE(4) OVER (PARTITION BY project_id ORDER BY sort_order) AS bucket
  FROM public.project_images
)
UPDATE public.project_images pi
SET phase = CASE r.bucket
  WHEN 1 THEN 'البداية'
  WHEN 2 THEN 'التنفيذ'
  WHEN 3 THEN 'التشطيب'
  WHEN 4 THEN 'التسليم'
END
FROM ranked r
WHERE pi.id = r.id AND pi.phase IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_images_timeline
  ON public.project_images(project_id, captured_at NULLS LAST, sort_order);
