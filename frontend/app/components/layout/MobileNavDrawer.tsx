import { Link, useLocation } from "@remix-run/react";
import { LogIn, LogOut, X } from "lucide-react";
import type { ComponentType } from "react";

import type { UserProfile } from "~/types/api";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface MobileNavDrawerProps {
  open: boolean;
  items: NavItem[];
  user: UserProfile | null;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}

export function MobileNavDrawer({ open, items, user, onClose, onSignOut }: MobileNavDrawerProps) {
  const { pathname } = useLocation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40"
      />
      <div className="relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <span className="text-base font-bold tracking-tight text-slate-900">LilyAiDataNotes</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Mobile Primary">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                onClick={() => {
                  onClose();
                  void onSignOut();
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
