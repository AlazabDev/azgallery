import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function anonClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_project_images",
  title: "List project images by phase",
  description:
    "List images for a public project, optionally filtered by construction phase. Useful for building a timeline view of a project's progress.",
  inputSchema: {
    slug: z.string().trim().min(1).max(120).describe("The project's URL slug."),
    phase: z
      .enum(["start", "execution", "finishing", "delivery"])
      .optional()
      .describe("Optional construction phase filter."),
    limit: z.number().int().min(1).max(200).optional().describe("Max images to return (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug, phase, limit }) => {
    const supabase = anonClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    if (!project) return { content: [{ type: "text", text: `No public project with slug "${slug}".` }], isError: true };

    let q = supabase
      .from("project_images")
      .select("id, image_url, caption, sort_order, captured_at, phase")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true })
      .limit(limit ?? 100);
    if (phase) q = q.eq("phase", phase);

    const { data: images, error: imgErr } = await q;
    if (imgErr) return { content: [{ type: "text", text: `Error: ${imgErr.message}` }], isError: true };

    const payload = { slug, phase: phase ?? null, images: images ?? [], count: images?.length ?? 0 };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
