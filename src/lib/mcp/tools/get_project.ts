import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function anonClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_project",
  title: "Get project details",
  description:
    "Fetch a single public project by its slug, along with every image in the project. Images include URL, caption, capture date, and construction phase (start / execution / finishing / delivery).",
  inputSchema: {
    slug: z.string().trim().min(1).max(120).describe("The project's URL slug (as returned by list_projects)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const supabase = anonClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, slug, name, description, location, cover_image_url, created_at")
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    if (!project) return { content: [{ type: "text", text: `No public project with slug "${slug}".` }], isError: true };

    const { data: images, error: imgErr } = await supabase
      .from("project_images")
      .select("id, image_url, caption, sort_order, captured_at, phase")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    if (imgErr) return { content: [{ type: "text", text: `Error loading images: ${imgErr.message}` }], isError: true };

    const payload = { project, images: images ?? [], image_count: images?.length ?? 0 };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
