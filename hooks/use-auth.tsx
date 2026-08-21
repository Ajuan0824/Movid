"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser, onAuthStateChange, type User } from "../lib/firebase/auth";

export type AuthStatus = "loading" | "signed-out" | "signed-in";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  /** Firebase doesn't re-fire authStateChange on profile edits — call this after updateProfile/changePassword. */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({ status: "loading", user: null, refreshUser: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => onAuthStateChange((nextUser) => {
    setUser(nextUser);
    setStatus(nextUser ? "signed-in" : "signed-out");
  }), []);

  const refreshUser = useCallback(async () => {
    const nextUser = await getCurrentUser();
    setUser(nextUser);
  }, []);

  const value = useMemo(() => ({ status, user, refreshUser }), [status, user, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
