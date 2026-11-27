import { ApiClientError, getApiBaseUrl } from "~/services/api/apiClient";
import { downloadTextFile } from "~/utils/downloadTextFile";

export async function downloadWorkspaceExport(options: {
  format: "markdown" | "json";
  project?: string;
  token: string | null;
}): Promise<void> {
  const params = new URLSearchParams({ format: options.format });
  if (options.project) {
    params.set("project", options.project);
  }
  const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest" };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/exports?${params.toString()}`, {
      method: "GET",
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiClientError("network_unreachable", "Unable to reach export endpoint.", 0);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new ApiClientError("export_failed", `Export failed (${res.status}).`, res.status);
  }
  const ext = options.format === "markdown" ? "md" : "json";
  const slug = options.project ? `-${options.project.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "";
  const mime = options.format === "markdown" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8";
  downloadTextFile(`lilyaidatanotes${slug}.${ext}`, text, mime);
}
