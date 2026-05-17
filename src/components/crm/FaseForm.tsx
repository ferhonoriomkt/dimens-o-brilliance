import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  trigger: React.ReactNode;
  projetoId: string;
  obraId: string;
  fase?: { id: string; nome: string; descricao: string | null; ordem: number };
}

export function FaseForm({ trigger, projetoId, obraId, fase }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: fase?.nome ?? "",
    descricao: fase?.descricao ?? "",
    ordem: fase?.ordem ?? 0,
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome.trim(), descricao: form.descricao || null, ordem: Number(form.ordem) || 0 };
      if (fase) {
        const { error } = await supabase.from("crm_fases").update(payload).eq("id", fase.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_fases").insert({ ...payload, projeto_id: projetoId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Fase salva");
      qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{fase ? "Editar fase" : "Nova fase"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!form.nome.trim() || save.isPending} onClick={() => save.mutate()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}