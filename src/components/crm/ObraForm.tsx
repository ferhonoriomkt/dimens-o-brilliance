import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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
    cover_image_url?: string | null;
  };
  onSaved?: (id: string) => void;
}

export function ObraForm({ trigger, obra, onSaved }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nome: obra?.nome ?? "",
    cliente_nome: obra?.cliente_nome ?? "",
    cliente_email: obra?.cliente_email ?? "",
    escopo: obra?.escopo ?? "",
    endereco: obra?.endereco ?? "",
    data_inicio_prevista: obra?.data_inicio_prevista ?? "",
    data_fim_prevista: obra?.data_fim_prevista ?? "",
    cover_image_url: obra?.cover_image_url ?? "",
  });

  const onUpload = async (file: File) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("crm-obras").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("crm-obras").getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image_url: data.publicUrl }));
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        nome: form.nome.trim(),
        cliente_nome: form.cliente_nome || null,
        cliente_email: form.cliente_email || null,
        escopo: form.escopo || null,
        endereco: form.endereco || null,
        data_inicio_prevista: form.data_inicio_prevista || null,
        data_fim_prevista: form.data_fim_prevista || null,
        cover_image_url: form.cover_image_url || null,
      };
      if (obra) {
        const { error } = await supabase.from("crm_obras").update(payload).eq("id", obra.id);
        if (error) throw error;
        return obra.id;
      }
      const { data, error } = await supabase
        .from("crm_obras")
        .insert({ ...payload, status: "em_andamento", created_by: user?.id })
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar obra" : "Nova obra"}</DialogTitle>
          <DialogDescription>Dados principais da obra. Toda obra criada inicia como ativa.</DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Imagem de capa</Label>
            <div className="mt-2 flex items-center gap-4">
              {form.cover_image_url ? (
                <div className="relative">
                  <img src={form.cover_image_url} alt="Capa" className="h-24 w-40 object-cover rounded-md border border-border" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, cover_image_url: "" })}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-40 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  Sem imagem
                </div>
              )}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Carregar imagem"}
                </Button>
              </div>
            </div>
          </div>
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
          <Button disabled={!form.nome.trim() || save.isPending || uploading} onClick={() => save.mutate()}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
