import { Link, useLocation } from "@remix-run/react";
import { BookOpen, Bot, FileText, LayoutDashboard, LogIn, LogOut, Menu, Settings } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { MobileNavDrawer } from "~/components/layout/MobileNavDrawer";
import { useSession } from "~/context/SessionContext";

interface AppShellProps {
  title: string;
  breadcrumb: string;
  primaryAction?: ReactNode;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/docs", label: "Endpoint Docs", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ title, breadcrumb, primaryAction, children }: AppShellProps) {
  const { pathname } = useLocation();
  const { user, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link
            to="/dashboard"
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            LilyAiDataNotes
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Primary">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {user ? (
            <div className="space-y-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{user.display_name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </aside>

      <MobileNavDrawer
        open={mobileOpen}
        items={NAV_ITEMS}
        user={user}
        onClose={() => setMobileOpen(false)}
        onSignOut={signOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:gap-8 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="hidden truncate text-xs font-medium text-slate-500 sm:inline">{breadcrumb}</span>
            <span aria-hidden="true" className="hidden text-slate-300 sm:inline">/</span>
            <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            {NAV_ITEMS.map(({ to, label }) => (
              <Link key={to} to={to} className="hover:text-slate-900 whitespace-nowrap shrink-0">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {primaryAction || (
              <Link
                to={user ? "/documents" : "/login"}
                className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                {user ? "Open Notes" : "Sign in"}
              </Link>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
