import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { listUsers, setUserRole } from "@/lib/users.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: UsersAdmin,
});

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "coordenador", label: "Coordenador" },
  { value: "colaborador", label: "Colaborador" },
  { value: "cliente", label: "Cliente" },
  { value: "__none", label: "Sem papel" },
] as const;

function UsersAdmin() {
  const { user } = useAuth();
  const fetchUsers = useServerFn(listUsers);
  const mutate = useServerFn(setUserRole);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: string }) =>
      mutate({
        data: {
          userId: input.userId,
          role: input.role === "__none" ? null : (input.role as any),
        },
      }),
    onSuccess: () => {
      toast.success("Papel atualizado.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Promova ou rebaixe usuários entre admin, coordenador, colaborador e cliente.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {isLoading && (
          <div className="p-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando usuários…
          </div>
        )}
        {error && (
          <div className="p-6 text-sm text-destructive">
            Falha ao carregar usuários: {(error as Error).message}
          </div>
        )}
        {data && (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-display">Usuário</th>
                <th className="px-4 py-3 font-display">Papel atual</th>
                <th className="px-4 py-3 font-display">Último acesso</th>
                <th className="px-4 py-3 font-display text-right">Definir papel</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => {
                const currentRole = u.roles[0] ?? "__none";
                const isMe = u.id === user?.id;
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {u.display_name ?? u.email.split("@")[0]}
                            {isMe && <Badge variant="secondary" className="text-[10px]">você</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.roles.length > 0 ? (
                        <Badge variant={u.roles.includes("admin") ? "default" : "secondary"}>
                          {u.roles.join(", ")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem papel</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleString("pt-BR")
                        : "Nunca"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Select
                        value={currentRole}
                        onValueChange={(v) =>
                          roleMutation.mutate({ userId: u.id, role: v })
                        }
                        disabled={roleMutation.isPending}
                      >
                        <SelectTrigger className="w-44 ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
              {data.users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}