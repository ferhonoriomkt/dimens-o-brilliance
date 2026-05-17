import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "coordenador" | "colaborador" | "cliente";

interface AuthState {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
  rolesLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      router.invalidate();
      queryClient.invalidateQueries();
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  useEffect(() => {
    if (!session?.user) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    let cancelled = false;
    setRolesLoading(true);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (!cancelled) {
        setRoles((data ?? []).map((r) => r.role as Role));
        setRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      setRolesLoading(false);
    };
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    roles,
    loading,
    rolesLoading,
    isAdmin: roles.includes("admin"),
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}