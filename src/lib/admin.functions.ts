import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function fail(msg: string, err: unknown): never {
  console.error(`[AzGallery admin] ${msg}`, err);
  throw new Error(msg);
}

const keyInput = z.object({ adminKey: z.string().min(8) });

export const adminVerify = createServerFn({ method: "POST" })
  .validator((d: unknown) => keyInput.parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) {
      throw new Error("Invalid admin key.");
    }
    return { ok: true };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .validator((d: unknown) => keyInput.parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: projectCount }, { count: publicCount }, { count: imageCount }, { count: openComments }, { count: totalComments }] = await Promise.all([
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("is_public", true),
      supabaseAdmin.from("project_images").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("image_comments").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("image_comments").select("*", { count: "exact", head: true }),
    ]);
    return {
      projectCount: projectCount ?? 0,
      publicCount: publicCount ?? 0,
      privateCount: (projectCount ?? 0) - (publicCount ?? 0),
      imageCount: imageCount ?? 0,
      openComments: openComments ?? 0,
      totalComments: totalComments ?? 0,
    };
  });

export const adminListProjects = createServerFn({ method: "POST" })
  .validator((d: unknown) => keyInput.parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: projects, error } = await supabaseAdmin
      .from("projects")
      .select("id, slug, name, description, location, cover_image_url, is_public, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) fail("Unable to load projects.", error);

    const ids = (projects ?? []).map((p) => p.id);
    const counts: Record<string, { images: number; open: number }> = {};
    if (ids.length) {
      const [{ data: imgs }, { data: cmts }] = await Promise.all([
        supabaseAdmin.from("project_images").select("project_id").in("project_id", ids),
        supabaseAdmin.from("image_comments").select("project_id, status").in("project_id", ids),
      ]);
      imgs?.forEach((r) => {
        counts[r.project_id] = counts[r.project_id] ?? { images: 0, open: 0 };
        counts[r.project_id].images++;
      });
      cmts?.forEach((r) => {
        counts[r.project_id] = counts[r.project_id] ?? { images: 0, open: 0 };
        if (r.status === "open") counts[r.project_id].open++;
      });
    }
    return {
      projects: (projects ?? []).map((p) => ({
        ...p,
        image_count: counts[p.id]?.images ?? 0,
        open_comments: counts[p.id]?.open ?? 0,
      })),
    };
  });

const projectInput = z.object({
  adminKey: z.string().min(8),
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/i),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  cover_image_url: z.string().trim().max(1000).optional().nullable(),
  is_public: z.boolean(),
});

export const adminUpsertProject = createServerFn({ method: "POST" })
  .validator((d: unknown) => projectInput.parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      slug: data.slug,
      name: data.name,
      description: data.description || null,
      location: data.location || null,
      cover_image_url: data.cover_image_url || null,
      is_public: data.is_public,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { data: p, error } = await supabaseAdmin
        .from("projects").update(row).eq("id", data.id).select().single();
      if (error) fail("Unable to update project.", error);
      return { project: p };
    }
    const { data: p, error } = await supabaseAdmin
      .from("projects").insert(row).select().single();
    if (error) fail("Unable to create project.", error);
    return { project: p };
  });

export const adminDeleteProject = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ adminKey: z.string().min(8), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("image_comments").delete().eq("project_id", data.id);
    await supabaseAdmin.from("project_images").delete().eq("project_id", data.id);
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", data.id);
    if (error) fail("Unable to delete project.", error);
    return { ok: true };
  });

export const adminListImages = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ adminKey: z.string().min(8), projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: images, error } = await supabaseAdmin
      .from("project_images")
      .select("id, project_id, image_url, caption, sort_order, captured_at, phase, created_at")
      .eq("project_id", data.projectId)
      .order("sort_order", { ascending: true });
    if (error) fail("Unable to load images.", error);
    return { images: images ?? [] };
  });

const imageInput = z.object({
  adminKey: z.string().min(8),
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  image_url: z.string().trim().min(1).max(1000),
  caption: z.string().trim().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).max(99999).default(0),
  phase: z.enum(["start", "execution", "finishing", "delivery"]).optional().nullable(),
  captured_at: z.string().optional().nullable(),
});

export const adminUpsertImage = createServerFn({ method: "POST" })
  .validator((d: unknown) => imageInput.parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      project_id: data.project_id,
      image_url: data.image_url,
      caption: data.caption || null,
      sort_order: data.sort_order,
      phase: data.phase || null,
      captured_at: data.captured_at || null,
    };
    if (data.id) {
      const { data: img, error } = await supabaseAdmin
        .from("project_images").update(row).eq("id", data.id).select().single();
      if (error) fail("Unable to update image.", error);
      return { image: img };
    }
    const { data: img, error } = await supabaseAdmin
      .from("project_images").insert(row).select().single();
    if (error) fail("Unable to add image.", error);
    return { image: img };
  });

export const adminDeleteImage = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ adminKey: z.string().min(8), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("image_comments").delete().eq("image_id", data.id);
    const { error } = await supabaseAdmin.from("project_images").delete().eq("id", data.id);
    if (error) fail("Unable to delete image.", error);
    return { ok: true };
  });

export const adminBulkImportImages = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    adminKey: z.string().min(8),
    projectId: z.string().uuid(),
    urls: z.array(z.string().trim().min(1)).min(1).max(500),
    phase: z.enum(["start", "execution", "finishing", "delivery"]).optional().nullable(),
  }).parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("project_images").select("sort_order").eq("project_id", data.projectId)
      .order("sort_order", { ascending: false }).limit(1);
    const start = (existing?.[0]?.sort_order ?? -1) + 1;
    const rows = data.urls.map((url, i) => ({
      project_id: data.projectId,
      image_url: url,
      sort_order: start + i,
      phase: data.phase || null,
    }));
    const { error, count } = await supabaseAdmin.from("project_images").insert(rows, { count: "exact" });
    if (error) fail("Unable to bulk import.", error);
    return { inserted: count ?? rows.length };
  });

export const adminListComments = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    adminKey: z.string().min(8),
    status: z.enum(["open", "resolved", "all"]).default("all"),
  }).parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("image_comments")
      .select("id, image_id, project_id, visitor_name, visitor_phone, comment_text, position_x, position_y, status, created_at, projects!inner(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: comments, error } = await q;
    if (error) fail("Unable to load comments.", error);
    return { comments: comments ?? [] };
  });

export const adminSetCommentStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    adminKey: z.string().min(8),
    id: z.string().uuid(),
    status: z.enum(["open", "resolved"]),
  }).parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("image_comments").update({ status: data.status }).eq("id", data.id);
    if (error) fail("Unable to update comment.", error);
    return { ok: true };
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ adminKey: z.string().min(8), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    if (data.adminKey !== process.env.AZGALLERY_ADMIN_KEY) throw new Error("Unauthorized.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("image_comments").delete().eq("id", data.id);
    if (error) fail("Unable to delete comment.", error);
    return { ok: true };
  });
