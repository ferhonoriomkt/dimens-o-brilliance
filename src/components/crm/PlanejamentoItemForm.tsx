import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Fase { id: string; nome: string }
interface Props {
  trigger: React.ReactNode;
  projetoId: string;
  obraId: string;
  fases: Fase[];
  servicos?: { id: string; nome: string }[];
  canViewFinancial?: boolean;
  defaultFaseId?: string | null;
  item?: {
    id: string;
    fase_id: string | null;
    tipo: string;
    nome: string;
    descricao: string | null;
    unidade: string | null;
    quantidade: number;
    equipe: string | null;
    data_inicio: string | null;
    data_fim: string | null;
    servico_relacionado_id: string | null;
  };
}

export function PlanejamentoItemForm({ trigger, projetoId, obraId, fases, servicos = [], canViewFinancial, defaultFaseId, item }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: item?.tipo ?? "servico",
    nome: item?.nome ?? "",
    descricao: item?.descricao ?? "",
    unidade: item?.unidade ?? "",
    quantidade: item?.quantidade ?? 1,
    equipe: item?.equipe ?? "",
    data_inicio: item?.data_inicio ?? "",
    data_fim: item?.data_fim ?? "",
    fase_id: item?.fase_id ?? defaultFaseId ?? "",
    servico_relacionado_id: item?.servico_relacionado_id ?? "",
    custo_previsto: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        projeto_id: projetoId,
        fase_id: form.fase_id || null,
        tipo: form.tipo as any,
        nome: form.nome.trim(),
        descricao: form.descricao || null,
        unidade: form.unidade || null,
        quantidade: Number(form.quantidade) || 0,
        equipe: form.equipe || null,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        servico_relacionado_id:
          form.tipo === "materia_prima" && form.servico_relacionado_id ? form.servico_relacionado_id : null,
      };
      let itemId: string;
      if (item) {
        const { error } = await supabase.from("crm_planejamento_itens").update(payload).eq("id", item.id);
        if (error) throw error;
        itemId = item.id;
      } else {
        const { data, error } = await supabase
          .from("crm_planejamento_itens")
          .insert({ ...payload, created_by: user?.id })
          .select("id")
          .single();
        if (error) throw error;
        itemId = data.id as string;
      }
      if (canViewFinancial && form.custo_previsto !== "") {
        const { error } = await supabase
          .from("crm_item_custos")
          .upsert({ item_id: itemId, custo_previsto: Number(form.custo_previsto) || 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(item ? "Item atualizado" : "Item criado");
      qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item de planejamento"}</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="servico">Serviço</SelectItem>
                <SelectItem value="materia_prima">Matéria-prima</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fase</Label>
            <Select value={form.fase_id || "__none"} onValueChange={(v) => setForm({ ...form, fase_id: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Sem fase" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sem fase</SelectItem>
                {fases.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div>
            <Label>Quantidade</Label>
            <Input type="number" step="0.01" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Unidade</Label>
            <Input placeholder="ex.: m², kg, un" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
          </div>
          <div>
            <Label>Equipe</Label>
            <Input value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} />
          </div>
          {form.tipo === "materia_prima" && servicos.length > 0 && (
            <div>
              <Label>Serviço relacionado</Label>
              <Select
                value={form.servico_relacionado_id || "__none"}
                onValueChange={(v) => setForm({ ...form, servico_relacionado_id: v === "__none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Nenhum</SelectItem>
                  {servicos.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Data início</Label>
            <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
          </div>
          <div>
            <Label>Data fim</Label>
            <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
          </div>
          {canViewFinancial && !item && (
            <div className="sm:col-span-2">
              <Label>Custo previsto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.custo_previsto}
                onChange={(e) => setForm({ ...form, custo_previsto: e.target.value })}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!form.nome.trim() || save.isPending} onClick={() => save.mutate()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}