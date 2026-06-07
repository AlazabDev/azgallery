import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Simple in-memory rate limit per session+ip (best-effort; worker may recycle)
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

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("id, slug, name, description, location, cover_image_url, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (projects ?? []).map((p) => p.id);
  if (ids.length === 0) return { projects: [] };

  const { data: imgs } = await supabaseAdmin
    .from("project_images")
    .select("project_id")
    .in("project_id", ids);
  const { data: comments } = await supabaseAdmin
    .from("image_comments")
    .select("project_id, status")
    .in("project_id", ids)
    .eq("status", "open");

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
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) return { project: null, images: [], commentsByImage: {} as Record<string, number> };

    const { data: images } = await supabaseAdmin
      .from("project_images")
      .select("id, image_url, caption, sort_order")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    const { data: comments } = await supabaseAdmin
      .from("image_comments")
      .select("image_id")
      .eq("project_id", project.id);

    const commentsByImage: Record<string, number> = {};
    comments?.forEach((c) => {
      commentsByImage[c.image_id] = (commentsByImage[c.image_id] ?? 0) + 1;
    });

    return { project, images: images ?? [], commentsByImage };
  });

export const getImageComments = createServerFn({ method: "GET" })
  .inputValidator((d: { imageId: string }) =>
    z.object({ imageId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: comments, error } = await supabaseAdmin
      .from("image_comments")
      .select("id, visitor_name, comment_text, position_x, position_y, status, created_at")
      .eq("image_id", data.imageId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { comments: comments ?? [] };
  });

const commentSchema = z.object({
  imageId: z.string().uuid(),
  projectId: z.string().uuid(),
  visitorName: z.string().trim().min(1).max(100),
  visitorPhone: z.string().trim().max(30).optional().nullable(),
  visitorSession: z.string().trim().min(1).max(80),
  commentText: z.string().trim().min(1).max(2000),
  positionX: z.number().min(0).max(100).nullable().optional(),
  positionY: z.number().min(0).max(100).nullable().optional(),
});

export const addComment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => commentSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate limit: 5 comments / minute per session
    if (!rateLimit(`c:${data.visitorSession}`, 5, 60_000)) {
      throw new Error("لقد أرسلت تعليقات كثيرة، يرجى الانتظار قليلًا.");
    }

    // Verify image belongs to project & public
    const { data: img } = await supabaseAdmin
      .from("project_images")
      .select("id, project_id")
      .eq("id", data.imageId)
      .eq("project_id", data.projectId)
      .maybeSingle();
    if (!img) throw new Error("صورة غير صالحة");
    const { data: proj } = await supabaseAdmin
      .from("projects")
      .select("is_public")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!proj?.is_public) throw new Error("المشروع غير متاح");

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
    if (error) throw new Error(error.message);
    return { comment: inserted };
  });
