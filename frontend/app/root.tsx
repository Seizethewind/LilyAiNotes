import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";

import { SessionProvider } from "~/context/SessionContext";
import stylesheet from "~/styles/app.css?url";

export const meta: MetaFunction = () => [
  { title: "LilyAiDataNotes — Knowledge Infrastructure" },
  {
    name: "description",
    content: "Persistent knowledge storage, versioned documents, and scoped agent access.",
  },
];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700&display=swap",
  },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <SessionProvider>
          <Outlet />
        </SessionProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
