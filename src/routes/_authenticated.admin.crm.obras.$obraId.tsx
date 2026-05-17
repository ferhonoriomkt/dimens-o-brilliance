import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Check, Trash2, Pencil, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ObraForm } from "@/components/crm/ObraForm";
import { ProjetoForm } from "@/components/crm/ProjetoForm";
import { FaseForm } from "@/components/crm/FaseForm";
import { PlanejamentoItemForm } from "@/components/crm/PlanejamentoItemForm";
import { ObraDashboard } from "@/components/crm/ObraDashboard";
import { useObraPermissions } from "@/components/crm/use-obra-permissions";
import {
  fmtBRL, fmtDate, statusItemBadge, statusItemLabel, statusObraBadge, statusObraLabel, tipoItemLabel,
} from "@/components/crm/crm-utils";

export const Route = createFileRoute("/_authenticated/admin/crm/obras/$obraId")({
  component: ObraDetail,
});

function ObraDetail() {
  const { obraId } = Route.useParams();
  const qc = useQueryClient();
  const perms = useObraPermissions(obraId);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["crm", "obra", obraId],
    queryFn: async () => {
      const [{ data: obra, error: oErr }, { data: projetos }, { data: fases }, { data: itens }] = await Promise.all([
        supabase.from("crm_obras").select("*").eq("id", obraId).maybeSingle(),
        supabase.from("crm_projetos").select("*").eq("obra_id", obraId).order("ordem"),
        supabase.from("crm_fases").select("*, crm_projetos!inner(obra_id)").eq("crm_projetos.obra_id", obraId).order("ordem"),
        supabase
          .from("crm_planejamento_itens")
          .select("*, crm_projetos!inner(obra_id)")
          .eq("crm_projetos.obra_id", obraId)
          .order("ordem"),
      ]);
      if (oErr) throw oErr;
      return { obra, projetos: projetos ?? [], fases: fases ?? [], itens: itens ?? [] };
    },
  });

  const markDone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_planejamento_itens")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item concluído");
      qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reopenItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_planejamento_itens")
        .update({ completed_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_planejamento_itens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item excluído");
      qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleObraStatus = useMutation({
    mutationFn: async (newStatus: "concluida" | "em_andamento") => {
      const { error } = await supabase.from("crm_obras").update({ status: newStatus }).eq("id", obraId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v === "concluida" ? "Obra concluída" : "Obra reaberta");
      qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] });
      qc.invalidateQueries({ queryKey: ["crm", "obras"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteObra = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_obras").delete().eq("id", obraId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Obra excluída");
      qc.invalidateQueries({ queryKey: ["crm", "obras"] });
      navigate({ to: "/admin/crm" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  if (!data?.obra) return (
    <div className="p-6 text-sm text-muted-foreground">
      Obra não encontrada. <Link to="/admin/crm" className="text-primary underline">Voltar</Link>
    </div>
  );

  const obra = data.obra;
  const fasesByProjeto = new Map<string, any[]>();
  data.fases.forEach((f: any) => {
    const arr = fasesByProjeto.get(f.projeto_id) ?? [];
    arr.push(f); fasesByProjeto.set(f.projeto_id, arr);
  });
  const itensByProjeto = new Map<string, any[]>();
  data.itens.forEach((i: any) => {
    const arr = itensByProjeto.get(i.projeto_id) ?? [];
    arr.push(i); itensByProjeto.set(i.projeto_id, arr);
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        {obra.cover_image_url && (
          <div className="aspect-[21/6] w-full bg-muted">
            <img src={obra.cover_image_url} alt={obra.nome} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/crm"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
            </Button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-2xl truncate">{obra.nome}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={statusObraBadge[obra.status]}>{statusObraLabel[obra.status]}</Badge>
                {obra.cliente_nome && <span className="text-sm text-muted-foreground truncate">{obra.cliente_nome}</span>}
              </div>
            </div>
          </div>
          {perms.canEdit && (
            <div className="flex gap-2 flex-wrap">
              <ObraForm
                trigger={<Button variant="outline" size="sm"><Pencil className="h-4 w-4" /> Editar</Button>}
                obra={obra}
              />
              {obra.status === "concluida" ? (
                <Button variant="outline" size="sm" onClick={() => toggleObraStatus.mutate("em_andamento")}>
                  <RotateCcw className="h-4 w-4" /> Reabrir obra
                </Button>
              ) : (
                <Button size="sm" onClick={() => { if (confirm("Marcar esta obra como concluída?")) toggleObraStatus.mutate("concluida"); }}>
                  <CheckCircle2 className="h-4 w-4" /> Concluir obra
                </Button>
              )}
              {perms.isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Excluir definitivamente a obra "${obra.nome}"? Esta ação não pode ser desfeita.`)) {
                      deleteObra.mutate();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Excluir obra
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="visao">
        <TabsList className="flex-wrap">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="projetos">Projetos e cronograma</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-6">
          <ObraDashboard obra={obra} canViewFinancial={perms.canViewFinancial} />
        </TabsContent>

        <TabsContent value="projetos" className="mt-6 space-y-6">
          {perms.canEdit && (
            <ProjetoForm
              obraId={obraId}
              trigger={<Button><Plus className="h-4 w-4" /> Novo projeto</Button>}
            />
          )}
          {data.projetos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              Nenhum projeto ainda. Crie o primeiro para adicionar fases e itens.
            </div>
          ) : data.projetos.map((p: any) => {
            const fases = fasesByProjeto.get(p.id) ?? [];
            const itens = itensByProjeto.get(p.id) ?? [];
            const servicos = itens.filter((i) => i.tipo === "servico").map((i) => ({ id: i.id, nome: i.nome }));
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-display font-bold text-lg">{p.nome}</h3>
                    {p.escopo && <p className="text-sm text-muted-foreground">{p.escopo}</p>}
                  </div>
                  {perms.canEdit && (
                    <div className="flex gap-2 flex-wrap">
                      <FaseForm obraId={obraId} projetoId={p.id} trigger={<Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /> Fase</Button>} />
                      <PlanejamentoItemForm
                        obraId={obraId}
                        projetoId={p.id}
                        fases={fases}
                        servicos={servicos}
                        canViewFinancial={perms.canViewFinancial}
                        trigger={<Button size="sm"><Plus className="h-3.5 w-3.5" /> Item</Button>}
                      />
                    </div>
                  )}
                </div>

                {fases.length === 0 && itens.filter((i) => !i.fase_id).length === 0 ? (
                  <div className="mt-4 text-sm text-muted-foreground">Sem fases ou itens.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {fases.map((f: any) => {
                      const fItens = itens.filter((i) => i.fase_id === f.id);
                      return (
                        <div key={f.id} className="rounded-lg border border-border p-3">
                          <div className="font-display font-semibold text-sm">{f.nome}</div>
                          {fItens.length === 0 ? (
                            <div className="text-xs text-muted-foreground mt-1">Sem itens nesta fase.</div>
                          ) : (
                            <ul className="mt-2 space-y-1.5">
                              {fItens.map((i) => <ItemRow key={i.id} item={i} canEdit={perms.canEdit} onDone={() => markDone.mutate(i.id)} onReopen={() => reopenItem.mutate(i.id)} onDelete={() => deleteItem.mutate(i.id)} />)}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                    {itens.filter((i) => !i.fase_id).length > 0 && (
                      <div className="rounded-lg border border-dashed border-border p-3">
                        <div className="font-display font-semibold text-sm text-muted-foreground">Sem fase</div>
                        <ul className="mt-2 space-y-1.5">
                          {itens.filter((i) => !i.fase_id).map((i) => <ItemRow key={i.id} item={i} canEdit={perms.canEdit} onDone={() => markDone.mutate(i.id)} onReopen={() => reopenItem.mutate(i.id)} onDelete={() => deleteItem.mutate(i.id)} />)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {(["definido", "planejado", "concluido"] as const).map((col) => {
              const colItens = data.itens.filter((i: any) => i.status === col);
              return (
                <div key={col} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold">{statusItemLabel[col]}</h3>
                    <Badge variant="secondary">{colItens.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colItens.length === 0 && <div className="text-xs text-muted-foreground">Nenhum item.</div>}
                    {colItens.map((i: any) => (
                      <div key={i.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                        <div className="font-medium">{i.nome}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{tipoItemLabel[i.tipo]}</div>
                        {(i.data_inicio || i.data_fim) && (
                          <div className="text-xs text-muted-foreground mt-1">{fmtDate(i.data_inicio)} → {fmtDate(i.data_fim)}</div>
                        )}
                        {perms.canEdit && col !== "concluido" && (
                          <Button size="sm" variant="outline" className="mt-2 h-7" onClick={() => markDone.mutate(i.id)}>
                            <Check className="h-3.5 w-3.5" /> Marcar concluído
                          </Button>
                        )}
                        {perms.canEdit && col === "concluido" && (
                          <Button size="sm" variant="ghost" className="mt-2 h-7" onClick={() => reopenItem.mutate(i.id)}>Reabrir</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6">
          <FinanceiroTab obraId={obraId} canView={perms.canViewFinancial} />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <ExportTab obra={obra} projetos={data.projetos} fases={data.fases} itens={data.itens} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ItemRow({ item, canEdit, onDone, onReopen, onDelete }: any) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <div className="min-w-0 flex items-center gap-2">
        <Badge variant="secondary" className={statusItemBadge[item.status]}>{statusItemLabel[item.status]}</Badge>
        <span className="truncate">{item.nome}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">· {tipoItemLabel[item.tipo]}</span>
        {(item.data_inicio || item.data_fim) && (
          <span className="text-xs text-muted-foreground hidden md:inline">· {fmtDate(item.data_inicio)} → {fmtDate(item.data_fim)}</span>
        )}
      </div>
      {canEdit && (
        <div className="flex items-center gap-1">
          {item.status !== "concluido" ? (
            <Button size="sm" variant="ghost" className="h-7" onClick={onDone}><Check className="h-3.5 w-3.5" /></Button>
          ) : (
            <Button size="sm" variant="ghost" className="h-7" onClick={onReopen}>Reabrir</Button>
          )}
          <Button size="sm" variant="ghost" className="h-7" onClick={() => { if (confirm(`Excluir "${item.nome}"?`)) onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      )}
    </li>
  );
}

function FinanceiroTab({ obraId, canView }: { obraId: string; canView: boolean }) {
  const qc = useQueryClient();
  const [novo, setNovo] = useState({ descricao: "", valor: "", data_prevista: "" });

  const { data: fin } = useQuery({
    queryKey: ["crm", "obra-fin", obraId],
    enabled: canView,
    queryFn: async () => {
      const [{ data: financeiro }, { data: recebiveis }] = await Promise.all([
        supabase.from("crm_obra_financeiro").select("*").eq("obra_id", obraId).maybeSingle(),
        supabase.from("crm_recebiveis").select("*").eq("obra_id", obraId).order("data_prevista"),
      ]);
      return { financeiro, recebiveis: recebiveis ?? [] };
    },
  });

  const upsertFinanceiro = useMutation({
    mutationFn: async (valor_contrato: number) => {
      const { error } = await supabase
        .from("crm_obra_financeiro")
        .upsert({ obra_id: obraId, valor_contrato });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Salvo");
      qc.invalidateQueries({ queryKey: ["crm", "obra-fin", obraId] });
      qc.invalidateQueries({ queryKey: ["crm", "obra-agg", obraId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addRecebivel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_recebiveis").insert({
        obra_id: obraId,
        descricao: novo.descricao,
        valor: Number(novo.valor) || 0,
        data_prevista: novo.data_prevista || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recebível criado");
      setNovo({ descricao: "", valor: "", data_prevista: "" });
      qc.invalidateQueries({ queryKey: ["crm", "obra-fin", obraId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!canView) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <h3 className="font-display font-bold text-lg">Acesso restrito</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Você não possui permissão para visualizar dados financeiros desta obra.
        </p>
      </div>
    );
  }

  const totalRecebido = (fin?.recebiveis ?? []).filter((r: any) => r.status === "recebido").reduce((s: number, r: any) => s + Number(r.valor), 0);
  const totalPrevisto = (fin?.recebiveis ?? []).reduce((s: number, r: any) => s + Number(r.valor), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display font-bold text-lg">Contrato</h3>
        <div className="mt-3 flex items-end gap-3 flex-wrap">
          <div className="min-w-[200px]">
            <Label>Valor do contrato (R$)</Label>
            <Input
              type="number"
              step="0.01"
              defaultValue={fin?.financeiro?.valor_contrato ?? 0}
              onBlur={(e) => upsertFinanceiro.mutate(Number(e.target.value) || 0)}
            />
          </div>
          <div className="text-sm text-muted-foreground">Atual: {fmtBRL(fin?.financeiro?.valor_contrato ?? 0)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h3 className="font-display font-bold text-lg">Recebíveis</h3>
          <div className="text-sm text-muted-foreground">
            Previsto: <strong>{fmtBRL(totalPrevisto)}</strong> · Recebido: <strong>{fmtBRL(totalRecebido)}</strong> · Saldo: <strong>{fmtBRL(totalPrevisto - totalRecebido)}</strong>
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-2 mb-4">
          <Input placeholder="Descrição" value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
          <Input type="number" step="0.01" placeholder="Valor" value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />
          <Input type="date" value={novo.data_prevista} onChange={(e) => setNovo({ ...novo, data_prevista: e.target.value })} />
          <Button disabled={!novo.descricao || !novo.valor || addRecebivel.isPending} onClick={() => addRecebivel.mutate()}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
        {(fin?.recebiveis ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum recebível cadastrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-2">Descrição</th><th className="text-left p-2">Previsto</th><th className="text-left p-2">Recebido</th><th className="text-left p-2">Status</th><th className="text-right p-2">Valor</th></tr>
            </thead>
            <tbody>
              {(fin!.recebiveis as any[]).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2">{r.descricao}</td>
                  <td className="p-2 text-muted-foreground">{fmtDate(r.data_prevista)}</td>
                  <td className="p-2 text-muted-foreground">{fmtDate(r.data_recebimento)}</td>
                  <td className="p-2"><Badge variant="secondary">{r.status}</Badge></td>
                  <td className="p-2 text-right font-medium">{fmtBRL(r.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ExportTab({ obra, projetos, fases, itens }: any) {
  const exportCSV = () => {
    const projMap = new Map(projetos.map((p: any) => [p.id, p.nome]));
    const faseMap = new Map(fases.map((f: any) => [f.id, f.nome]));
    const rows = [
      ["Obra", "Projeto", "Fase", "Tipo", "Item", "Quantidade", "Unidade", "Início", "Fim", "Status"],
      ...itens.map((i: any) => [
        obra.nome,
        projMap.get(i.projeto_id) ?? "",
        i.fase_id ? faseMap.get(i.fase_id) ?? "" : "",
        tipoItemLabel[i.tipo],
        i.nome,
        i.quantidade,
        i.unidade ?? "",
        i.data_inicio ?? "",
        i.data_fim ?? "",
        statusItemLabel[i.status],
      ]),
    ];
    const csv = rows.map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${obra.nome}-planejamento.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
      <h3 className="font-display font-bold text-lg">Exportar planejamento</h3>
      <p className="text-sm text-muted-foreground">
        Exporte os itens da obra em CSV (compatível com Excel) ou imprima como PDF.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={exportCSV}>Exportar CSV/XLSX</Button>
        <Button variant="outline" onClick={() => window.print()}>Imprimir / PDF</Button>
      </div>
    </div>
  );
}