import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObraForm } from "@/components/crm/ObraForm";
import { fmtDate, statusObraBadge, statusObraLabel } from "@/components/crm/crm-utils";

export const Route = createFileRoute("/_authenticated/admin/crm")({
  component: CRMHome,
});

function CRMHome() {
  const { data: obras, isLoading } = useQuery({
    queryKey: ["crm", "obras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_obras")
          .select("id,nome,cliente_nome,status,data_inicio_prevista,data_fim_prevista,cover_image_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = {
    planejamento: obras?.filter((o) => o.status === "planejamento").length ?? 0,
    em_andamento: obras?.filter((o) => o.status === "em_andamento").length ?? 0,
    concluida: obras?.filter((o) => o.status === "concluida").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">CRM de Obras</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planejamento, produção e acompanhamento das obras da Dimensão Coberturas.
          </p>
        </div>
        <ObraForm trigger={<Button><Plus className="h-4 w-4" /> Nova obra</Button>} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Em planejamento", value: counts.planejamento },
          { label: "Em andamento", value: counts.em_andamento },
          { label: "Concluídas", value: counts.concluida },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</div>
            <div className="mt-1 font-display font-bold text-3xl">{m.value}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : !obras || obras.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="mt-3 font-display font-bold text-lg">Nenhuma obra cadastrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crie sua primeira obra para começar a planejar.</p>
          <div className="mt-4 inline-block">
            <ObraForm trigger={<Button><Plus className="h-4 w-4" /> Nova obra</Button>} />
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((o) => (
            <Link
              key={o.id}
              to="/admin/crm/obras/$obraId"
              params={{ obraId: o.id }}
              className="group rounded-xl border border-border bg-card shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
            >
              <div className="aspect-video w-full bg-muted overflow-hidden">
                {o.cover_image_url ? (
                  <img src={o.cover_image_url} alt={o.nome} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                    Sem imagem
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg truncate">{o.nome}</h3>
                  <p className="text-sm text-muted-foreground truncate">{o.cliente_nome ?? "Sem cliente"}</p>
                </div>
                <Badge variant="secondary" className={statusObraBadge[o.status]}>{statusObraLabel[o.status]}</Badge>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                {fmtDate(o.data_inicio_prevista)} → {fmtDate(o.data_fim_prevista)}
              </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}