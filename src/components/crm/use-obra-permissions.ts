import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export interface ObraPermissions {
  isLoading: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isCoordenador: boolean;
  canViewFinancial: boolean;
  canEdit: boolean;
}

export function useObraPermissions(obraId: string | undefined): ObraPermissions {
  const { isAdmin, user, rolesLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["crm", "obra-membro", obraId, user?.id],
    enabled: !!obraId && !!user?.id && !isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_obra_membros")
        .select("papel, can_view_financial")
        .eq("obra_id", obraId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isAdmin) {
    return {
      isLoading: false,
      isAdmin: true,
      isMember: true,
      isCoordenador: true,
      canViewFinancial: true,
      canEdit: true,
    };
  }

  return {
    isLoading: rolesLoading || isLoading,
    isAdmin: false,
    isMember: !!data,
    isCoordenador: data?.papel === "coordenador",
    canViewFinancial: !!data?.can_view_financial,
    canEdit: data?.papel === "coordenador",
  };
}

/** Whether the current user can access the CRM module at all. */
export function useCanAccessCRM() {
  const { isAdmin, user, loading, rolesLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["crm", "any-membership", user?.id],
    enabled: !!user?.id && !isAdmin,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("crm_obra_membros")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });
  return {
    isLoading: loading || rolesLoading || isLoading,
    canAccess: isAdmin || !!data,
  };
}