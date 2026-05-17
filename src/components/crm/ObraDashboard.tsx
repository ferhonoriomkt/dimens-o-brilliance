import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { fmtBRL, fmtDate, statusObraBadge, statusObraLabel } from "./crm-utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  obra: any;
  canViewFinancial: boolean;
}

export function ObraDashboard({ obra, canViewFinancial }: Props) {
  // Agregação a partir das queries já carregadas via cache da rota
  const { data: agg } = useQuery({
    queryKey: ["crm", "obra-agg", obra.id, canViewFinancial],
    queryFn: async () => {
      const { data: projetos } = await supabase.from("crm_projetos").select("id").eq("obra_id", obra.id);
      const projetoIds = (projetos ?? []).map((p) => p.id);
      const { count: fasesCount } = projetoIds.length
        ? await supabase.from("crm_fases").select("id", { head: true, count: "exact" }).in("projeto_id", projetoIds)
        : { count: 0 } as any;
      const { data: itens } = projetoIds.length
        ? await supabase
            .from("crm_planejamento_itens")
            .select("id,tipo,status,data_inicio,data_fim,completed_at")
            .in("projeto_id", projetoIds)
        : { data: [] as any[] } as any;
      const itensArr = (itens ?? []) as any[];
      const servicos = itensArr.filter((i) => i.tipo === "servico").length;
      const materias = itensArr.filter((i) => i.tipo === "materia_prima").length;
      const concluidos = itensArr.filter((i) => i.status === "concluido").length;
      const evolucao = itensArr.length ? Math.round((concluidos / itensArr.length) * 100) : 0;

      let custos: any[] = [];
      let recebiveis: any[] = [];
      if (canViewFinancial) {
        const itemIds = itensArr.map((i) => i.id);
        if (itemIds.length) {
          const { data } = await supabase
            .from("crm_item_custos")
            .select("item_id,custo_previsto,custo_real")
            .in("item_id", itemIds);
          custos = data ?? [];
        }
        const { data: rec } = await supabase
          .from("crm_recebiveis")
          .select("valor,data_prevista,data_recebimento,status")
          .eq("obra_id", obra.id);
        recebiveis = rec ?? [];
      }
      const custoMap = new Map(custos.map((c) => [c.item_id, c]));
      const custoPlanejado = custos.reduce((s, c) => s + Number(c.custo_previsto || 0), 0);
      const custoConcluido = itensArr
        .filter((i) => i.status === "concluido")
        .reduce((s, i) => s + Number(custoMap.get(i.id)?.custo_previsto || 0), 0);
      const recebivelPrevisto = recebiveis.reduce((s, r) => s + Number(r.valor || 0), 0);
      const recebivelRecebido = recebiveis
        .filter((r) => r.status === "recebido")
        .reduce((s, r) => s + Number(r.valor || 0), 0);

      // Curva: por mês até hoje + meses futuros baseados em data_fim
      const monthly = new Map<string, { fisica: number; financeira: number }>();
      itensArr.forEach((i) => {
        const key = (i.completed_at ?? i.data_fim ?? i.data_inicio ?? "").slice(0, 7);
        if (!key) return;
        const cur = monthly.get(key) ?? { fisica: 0, financeira: 0 };
        cur.fisica += 1;
        cur.financeira += Number(custoMap.get(i.id)?.custo_previsto || 0);
        monthly.set(key, cur);
      });
      const curva = Array.from(monthly.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce<any[]>((acc, [mes, v], idx) => {
          const prev = acc[idx - 1] ?? { fisicaAcum: 0, financeiraAcum: 0 };
          acc.push({
            mes,
            fisicaAcum: prev.fisicaAcum + v.fisica,
            financeiraAcum: prev.financeiraAcum + v.financeira,
          });
          return acc;
        }, []);

      return {
        projetos: projetoIds.length,
        fases: fasesCount ?? 0,
        servicos,
        materias,
        evolucao,
        totalItens: itensArr.length,
        concluidos,
        custoPlanejado,
        custoConcluido,
        recebivelPrevisto,
        recebivelRecebido,
        curva,
      };
    },
  });

  const stats = [
    { label: "Projetos", value: agg?.projetos ?? 0 },
    { label: "Fases", value: agg?.fases ?? 0 },
    { label: "Serviços", value: agg?.servicos ?? 0 },
    { label: "Matérias-primas", value: agg?.materias ?? 0 },
    { label: "Evolução física", value: `${agg?.evolucao ?? 0}%` },
    { label: "Itens concluídos", value: `${agg?.concluidos ?? 0}/${agg?.totalItens ?? 0}` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Obra</div>
          <div className="mt-1 font-display font-bold text-xl">{obra.nome}</div>
          <div className="mt-1 text-sm text-muted-foreground">{obra.cliente_nome ?? "Sem cliente"}</div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Badge variant="secondary" className={statusObraBadge[obra.status]}>{statusObraLabel[obra.status]}</Badge>
            <span className="text-muted-foreground">{fmtDate(obra.data_inicio_prevista)} → {fmtDate(obra.data_fim_prevista)}</span>
          </div>
          {obra.escopo && <p className="mt-3 text-sm text-muted-foreground">{obra.escopo}</p>}
        </div>
        {stats.slice(0, 2).map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-display font-bold text-3xl">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.slice(2).map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-display font-bold text-2xl">{s.value}</div>
          </div>
        ))}
      </div>

      {canViewFinancial && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Custo planejado</div>
            <div className="mt-1 font-display font-bold text-xl">{fmtBRL(agg?.custoPlanejado ?? 0)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Custo concluído</div>
            <div className="mt-1 font-display font-bold text-xl">{fmtBRL(agg?.custoConcluido ?? 0)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Recebíveis previstos</div>
            <div className="mt-1 font-display font-bold text-xl">{fmtBRL(agg?.recebivelPrevisto ?? 0)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Saldo a receber</div>
            <div className="mt-1 font-display font-bold text-xl">{fmtBRL((agg?.recebivelPrevisto ?? 0) - (agg?.recebivelRecebido ?? 0))}</div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display font-bold text-lg">Curva física {canViewFinancial && "e financeira"}</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={agg?.curva ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              {canViewFinancial && <YAxis yAxisId="right" orientation="right" />}
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="fisicaAcum" name="Itens (acum.)" stroke="hsl(var(--primary))" strokeWidth={2} />
              {canViewFinancial && (
                <Line yAxisId="right" type="monotone" dataKey="financeiraAcum" name="Custo (acum.)" stroke="hsl(var(--accent))" strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}