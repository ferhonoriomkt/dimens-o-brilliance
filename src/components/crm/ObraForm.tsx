import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { statusObraLabel } from "./crm-utils";

interface Props {
  trigger: React.ReactNode;
  obra?: {
    id: string;
    nome: string;
    cliente_nome: string | null;
    cliente_email: string | null;
    escopo: string | null;
    endereco: string | null;
    status: string;
    data_inicio_prevista: string | null;
    data_fim_prevista: string | null;
  };
  onSaved?: (id: string) => void;
}

export function ObraForm({ trigger, obra, onSaved }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: obra?.nome ?? "",
    cliente_nome: obra?.cliente_nome ?? "",
    cliente_email: obra?.cliente_email ?? "",
    escopo: obra?.escopo ?? "",
    endereco: obra?.endereco ?? "",
    status: obra?.status ?? "planejamento",
    data_inicio_prevista: obra?.data_inicio_prevista ?? "",
    data_fim_prevista: obra?.data_fim_prevista ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome.trim(),
        cliente_nome: form.cliente_nome || null,
        cliente_email: form.cliente_email || null,
        escopo: form.escopo || null,
        endereco: form.endereco || null,
        status: form.status as any,
        data_inicio_prevista: form.data_inicio_prevista || null,
        data_fim_prevista: form.data_fim_prevista || null,
      };
      if (obra) {
        const { error } = await supabase.from("crm_obras").update(payload).eq("id", obra.id);
        if (error) throw error;
        return obra.id;
      }
      const { data, error } = await supabase
        .from("crm_obras")
        .insert({ ...payload, created_by: user?.id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success(obra ? "Obra atualizada" : "Obra criada");
      qc.invalidateQueries({ queryKey: ["crm", "obras"] });
      qc.invalidateQueries({ queryKey: ["crm", "obra", id] });
      setOpen(false);
      onSaved?.(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar obra" : "Nova obra"}</DialogTitle>
          <DialogDescription>Dados principais da obra. O financeiro é gerenciado em outra aba.</DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Nome da obra *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <Label>Cliente</Label>
            <Input value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} />
          </div>
          <div>
            <Label>E-mail do cliente</Label>
            <Input type="email" value={form.cliente_email} onChange={(e) => setForm({ ...form, cliente_email: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Escopo</Label>
            <Textarea rows={3} value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusObraLabel).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div />
          <div>
            <Label>Início previsto</Label>
            <Input type="date" value={form.data_inicio_prevista} onChange={(e) => setForm({ ...form, data_inicio_prevista: e.target.value })} />
          </div>
          <div>
            <Label>Fim previsto</Label>
            <Input type="date" value={form.data_fim_prevista} onChange={(e) => setForm({ ...form, data_fim_prevista: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!form.nome.trim() || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}