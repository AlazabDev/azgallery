import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const rateMap = new Map<string, { count: number; reset: number }>();
function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || entry.reset < now) {
    rateMap.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

function publicError(message: string, error: unknown): never {
  console.error(`[AzGallery] ${message}`, error);
  throw new Error(message);
}

const publicProjectSelect =
  "id, slug, name, description, location, cover_image_url, created_at" as const;

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select(publicProjectSelect)
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) publicError("Unable to load public projects.", error);

  const ids = (projects ?? []).map((p) => p.id);
  if (ids.length === 0) return { projects: [] };

  const { data: imgs, error: imgsError } = await supabaseAdmin
    .from("project_images")
    .select("project_id")
    .in("project_id", ids);
  if (imgsError) publicError("Unable to load image counts.", imgsError);

  const { data: comments, error: commentsError } = await supabaseAdmin
    .from("image_comments")
    .select("project_id, status")
    .in("project_id", ids)
    .eq("status", "open");
  if (commentsError) publicError("Unable to load comment counts.", commentsError);

  const imgCount = new Map<string, number>();
  imgs?.forEach((i) => imgCount.set(i.project_id, (imgCount.get(i.project_id) ?? 0) + 1));
  const commCount = new Map<string, number>();
  comments?.forEach((c) => commCount.set(c.project_id, (commCount.get(c.project_id) ?? 0) + 1));

  return {
    projects: (projects ?? []).map((p) => ({
      ...p,
      image_count: imgCount.get(p.id) ?? 0,
      open_comments: commCount.get(p.id) ?? 0,
    })),
  };
});

export const getProject = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select(publicProjectSelect)
      .eq("slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) publicError("Unable to load project.", error);
    if (!project) return { project: null, images: [], commentsByImage: {} as Record<string, number> };

    const { data: images, error: imagesError } = await supabaseAdmin
      .from("project_images")
      .select("id, image_url, caption, sort_order, captured_at, phase")
      .eq("project_id", project.id)
      .order("captured_at", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true });
    if (imagesError) publicError("Unable to load project images.", imagesError);

    const { data: comments, error: commentsError } = await supabaseAdmin
      .from("image_comments")
      .select("image_id")
      .eq("project_id", project.id)
      .eq("status", "open");
    if (commentsError) publicError("Unable to load project comment counts.", commentsError);

    const commentsByImage: Record<string, number> = {};
    comments?.forEach((c) => {
      commentsByImage[c.image_id] = (commentsByImage[c.image_id] ?? 0) + 1;
    });

    return { project, images: images ?? [], commentsByImage };
  });

export const getImageComments = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z.object({ imageId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify the image belongs to a public project before returning comments
    const { data: img, error: imgError } = await supabaseAdmin
      .from("project_images")
      .select("id, projects!inner(is_public)")
      .eq("id", data.imageId)
      .eq("projects.is_public", true)
      .maybeSingle();
    if (imgError) publicError("Unable to verify image.", imgError);
    if (!img) return { comments: [] };

    const { data: comments, error } = await supabaseAdmin
      .from("image_comments")
      .select("id, visitor_name, comment_text, position_x, position_y, status, created_at")
      .eq("image_id", data.imageId)
      .eq("status", "open")
      .order("created_at", { ascending: true });
    if (error) publicError("Unable to load image comments.", error);
    return { comments: comments ?? [] };
  });

const commentSchema = z.object({
  imageId: z.string().uuid(),
  projectId: z.string().uuid(),
  visitorName: z.string().trim().min(1).max(100),
  visitorPhone: z.string().trim().max(30).regex(/^[+\d\s().-]*$/).optional().nullable(),
  visitorSession: z.string().trim().regex(/^v_[a-z0-9]{10,40}$/i),
  commentText: z.string().trim().min(1).max(2000),
  positionX: z.number().min(0).max(100).nullable().optional(),
  positionY: z.number().min(0).max(100).nullable().optional(),
});

export const addComment = createServerFn({ method: "POST" })
  .validator((d: unknown) => commentSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit(`c:${data.visitorSession}`, 5, 60_000)) {
      throw new Error("Too many comments. Please try again later.");
    }

    const { data: img, error: imgError } = await supabaseAdmin
      .from("project_images")
      .select("id, project_id")
      .eq("id", data.imageId)
      .eq("project_id", data.projectId)
      .maybeSingle();
    if (imgError) publicError("Unable to verify image.", imgError);
    if (!img) throw new Error("Invalid image.");

    const { data: proj, error: projError } = await supabaseAdmin
      .from("projects")
      .select("is_public")
      .eq("id", data.projectId)
      .maybeSingle();
    if (projError) publicError("Unable to verify project.", projError);
    if (!proj?.is_public) throw new Error("Project is not available.");

    const hasPos =
      typeof data.positionX === "number" && typeof data.positionY === "number";

    const { data: inserted, error } = await supabaseAdmin
      .from("image_comments")
      .insert({
        image_id: data.imageId,
        project_id: data.projectId,
        visitor_name: data.visitorName,
        visitor_phone: data.visitorPhone || null,
        visitor_session: data.visitorSession,
        comment_text: data.commentText,
        position_x: hasPos ? data.positionX : null,
        position_y: hasPos ? data.positionY : null,
      })
      .select("id, visitor_name, comment_text, position_x, position_y, status, created_at")
      .single();
    if (error) publicError("Unable to save comment.", error);
    return { comment: inserted };
  });
