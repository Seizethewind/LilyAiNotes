import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { apiRequest } from "~/services/api/apiClient";
import type { AuthSessionResponse, UserProfile } from "~/types/api";

interface SessionContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  setAuthSession: (session: AuthSessionResponse) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<UserProfile>("/auth/me")
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setAuthSession = useCallback((session: AuthSessionResponse) => {
    setUser(session.user);
    setToken(session.session_token);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST", token });
    } catch {
      // Clear local memory session regardless of backend reachability.
    }
    setUser(null);
    setToken(null);
  }, [token]);

  return (
    <SessionContext.Provider value={{ user, token, loading, setAuthSession, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider.");
  }
  return ctx;
}
