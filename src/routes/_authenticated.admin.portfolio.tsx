import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/portfolio")({
  component: AdminPortfolio,
});

function AdminPortfolio() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug, category, location, year, published, sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const togglePublish = useMutation({
    mutationFn: async (p: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("projects")
        .update({ published: !p.published })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Projeto excluído");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Portfólio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre, edite e publique projetos.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/portfolio/$id" params={{ id: "new" }}>
            <Plus className="h-4 w-4" /> Novo projeto
          </Link>
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-sm text-muted-foreground">Carregando...</div>
        ) : !data || data.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum projeto cadastrado ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Título</th>
                <th className="text-left p-3 hidden md:table-cell">Categoria</th>
                <th className="text-left p-3 hidden md:table-cell">Local</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{p.category || "—"}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{p.location || "—"}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${p.published ? "bg-green-500/10 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {p.published ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => togglePublish.mutate({ id: p.id, published: p.published })}>
                        {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/admin/portfolio/$id" params={{ id: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Excluir "${p.title}"?`)) remove.mutate(p.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}