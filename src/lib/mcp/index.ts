import { defineMcp } from "@lovable.dev/mcp-js";
import listProjectsTool from "./tools/list_projects";
import getProjectTool from "./tools/get_project";
import listProjectImagesTool from "./tools/list_project_images";

export default defineMcp({
  name: "azgallery-mcp",
  title: "AzGallery — Alazab Construction Projects",
  version: "0.1.0",
  instructions:
    "Public read-only tools for the AzGallery construction project gallery by Alazab. Use `list_projects` to browse published projects, `get_project` to load a single project with all its images, and `list_project_images` to filter images by construction phase (start / execution / finishing / delivery).",
  tools: [listProjectsTool, getProjectTool, listProjectImagesTool],
});
