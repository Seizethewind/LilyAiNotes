import { Link } from "@remix-run/react";
import { useMemo, useState } from "react";

import { EndpointCatalogSidebar } from "~/components/docs/EndpointCatalogSidebar";
import { EndpointDetailView } from "~/components/docs/EndpointDetailView";
import { EndpointLiveTester } from "~/components/docs/EndpointLiveTester";
import { AppShell } from "~/components/layout/AppShell";
import { useSession } from "~/context/SessionContext";
import { ENDPOINT_DOCS_CATALOG, ENDPOINT_GROUPS, filterEndpointDocs } from "~/data/endpointDocsCatalog";

export default function DocsRoute() {
  const { user, token } = useSession();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [selectedId, setSelectedId] = useState(ENDPOINT_DOCS_CATALOG[0].id);

  const filteredEndpoints = useMemo(
    () => filterEndpointDocs(query, groupFilter),
    [query, groupFilter],
  );

  const activeEndpoint = useMemo(
    () =>
      filteredEndpoints.find((ep) => ep.id === selectedId) ||
      filteredEndpoints[0] ||
      ENDPOINT_DOCS_CATALOG[0],
    [filteredEndpoints, selectedId],
  );

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-app.pages.dev";

  return (
    <AppShell
      title="Endpoint Docs"
      breadcrumb="Developer API"
      primaryAction={
        <Link
          to="/settings"
          className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
        >
          Manage API Keys
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <EndpointCatalogSidebar
            endpoints={filteredEndpoints}
            groups={ENDPOINT_GROUPS}
            selectedId={activeEndpoint.id}
            query={query}
            groupFilter={groupFilter}
            onQueryChange={setQuery}
            onGroupChange={setGroupFilter}
            onSelect={setSelectedId}
            onResetFilters={() => {
              setQuery("");
              setGroupFilter("");
            }}
          />
        </div>

        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
          <EndpointDetailView endpoint={activeEndpoint} baseUrl={baseUrl} />
          <EndpointLiveTester
            endpoint={activeEndpoint}
            sessionToken={token}
            signedInEmail={user?.email || null}
          />
        </div>
      </div>
    </AppShell>
  );
}
