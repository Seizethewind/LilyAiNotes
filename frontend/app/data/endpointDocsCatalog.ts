import { CORE_ENDPOINT_DOCS } from "~/data/endpointCatalogCore";
import { NOTES_ENDPOINT_DOCS } from "~/data/endpointCatalogNotes";
import type { EndpointDocItem } from "~/types/docs";

export const ENDPOINT_DOCS_CATALOG: EndpointDocItem[] = [
  ...CORE_ENDPOINT_DOCS,
  ...NOTES_ENDPOINT_DOCS,
];

export const ENDPOINT_GROUPS: string[] = Array.from(
  new Set(ENDPOINT_DOCS_CATALOG.map((item) => item.group)),
);

export function filterEndpointDocs(query: string, group: string): EndpointDocItem[] {
  const normalized = query.trim().toLowerCase();
  return ENDPOINT_DOCS_CATALOG.filter((item) => {
    if (group && item.group !== group) return false;
    if (!normalized) return true;
    return (
      item.path.toLowerCase().includes(normalized) ||
      item.title.toLowerCase().includes(normalized) ||
      item.summary.toLowerCase().includes(normalized) ||
      item.method.toLowerCase().includes(normalized)
    );
  });
}
