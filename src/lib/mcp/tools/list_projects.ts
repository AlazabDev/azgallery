import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function anonClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_projects",
  title: "List public projects",
  description:
    "List all public projects in the AzGallery construction gallery. Returns slug, name, location, description, cover image URL, and creation date for each project.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = anonClient();
    const { data, error } = await supabase
      .from("projects")
      .select("slug, name, description, location, cover_image_url, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }

    const projects = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      structuredContent: { projects, count: projects.length },
    };
  },
});
