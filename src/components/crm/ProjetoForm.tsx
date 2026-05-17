import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  trigger: React.ReactNode;
  obraId: string;
  projeto?: { id: string; nome: string; escopo: string | null; descricao: string | null };
}

export function ProjetoForm({ trigger, obraId, projeto }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: projeto?.nome ?? "",
    escopo: projeto?.escopo ?? "",
    descricao: projeto?.descricao ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome.trim(), escopo: form.escopo || null, descricao: form.descricao || null };
      if (projeto) {
        const { error } = await supabase.from("crm_projetos").update(payload).eq("id", projeto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_projetos").insert({ ...payload, obra_id: obraId, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(projeto ? "Projeto atualizado" : "Projeto criado");
      qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{projeto ? "Editar projeto" : "Novo projeto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Escopo</Label><Input value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!form.nome.trim() || save.isPending} onClick={() => save.mutate()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}