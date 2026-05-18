import { useMemo, useRef, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { parseDate, toISODate, addDays, diffDays } from "@/components/crm/gantt-utils";

interface Fase { id: string; nome: string; data_inicio?: string | null; data_fim?: string | null }
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
  const inicialModo: "unico" | "periodo" =
    item && item.data_inicio && item.data_fim && item.data_inicio !== item.data_fim ? "periodo" : "unico";
  const [modo, setModo] = useState<"unico" | "periodo">(inicialModo);
  const [semCusto, setSemCusto] = useState(false);
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

  const faseSel = useMemo(() => fases.find((f) => f.id === form.fase_id) || null, [fases, form.fase_id]);
  const faseStart = parseDate(faseSel?.data_inicio ?? null);
  const faseEnd = parseDate(faseSel?.data_fim ?? null);
  const faseHasRange = !!(faseStart && faseEnd && faseEnd >= faseStart);

  // Clamp helper
  const clampISO = (iso: string): string => {
    if (!iso || !faseHasRange) return iso;
    const d = parseDate(iso);
    if (!d) return iso;
    if (d < faseStart!) return toISODate(faseStart!);
    if (d > faseEnd!) return toISODate(faseEnd!);
    return iso;
  };

  // Sync dates when fase or modo changes
  useEffect(() => {
    setForm((prev) => {
      let di = prev.data_inicio;
      let df = prev.data_fim;
      if (faseHasRange) {
        if (!di) di = toISODate(faseStart!);
        di = clampISO(di);
        if (modo === "unico") {
          df = di;
        } else {
          if (!df) df = di;
          df = clampISO(df);
          if (parseDate(df)! < parseDate(di)!) df = di;
        }
      } else if (modo === "unico") {
        df = di;
      }
      if (di === prev.data_inicio && df === prev.data_fim) return prev;
      return { ...prev, data_inicio: di, data_fim: df };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fase_id, modo, faseHasRange]);

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
        data_fim: (modo === "unico" ? form.data_inicio : form.data_fim) || null,
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
      if (canViewFinancial && !semCusto && form.custo_previsto !== "") {
        const { error } = await supabase
          .from("crm_item_custos")
          .upsert({ item_id: itemId, custo_previsto: parseBRL(form.custo_previsto) });
        if (error) throw error;
      }
      if (canViewFinancial && semCusto) {
        const { error } = await supabase
          .from("crm_item_custos")
          .upsert({ item_id: itemId, custo_previsto: 0 });
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
              <SelectTrigger><SelectValue placeholder="Avulso (sem fase)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Avulso (sem fase)</SelectItem>
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
          <div className="sm:col-span-2">
            <Label className="mb-2 block">Duração</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={modo === "unico" ? "default" : "outline"} onClick={() => setModo("unico")}>Dia único</Button>
              <Button type="button" size="sm" variant={modo === "periodo" ? "default" : "outline"} onClick={() => setModo("periodo")}>Período</Button>
            </div>
          </div>
          <div>
            <Label>{modo === "unico" ? "Data" : "Data início"}</Label>
            <Input
              type="date"
              min={faseHasRange ? toISODate(faseStart!) : undefined}
              max={faseHasRange ? toISODate(faseEnd!) : undefined}
              value={form.data_inicio}
              onChange={(e) => {
                const di = clampISO(e.target.value);
                setForm((p) => ({
                  ...p,
                  data_inicio: di,
                  data_fim: modo === "unico" ? di : (p.data_fim && parseDate(p.data_fim)! < parseDate(di)! ? di : p.data_fim),
                }));
              }}
            />
          </div>
          {modo === "periodo" && (
            <div>
              <Label>Data fim</Label>
              <Input
                type="date"
                min={form.data_inicio || (faseHasRange ? toISODate(faseStart!) : undefined)}
                max={faseHasRange ? toISODate(faseEnd!) : undefined}
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: clampISO(e.target.value) })}
              />
            </div>
          )}
          {faseHasRange && (
            <div className="sm:col-span-2">
              <Label className="mb-2 block text-xs text-muted-foreground">
                Posição na fase ({faseSel?.nome}) — arraste para ajustar
              </Label>
              <MiniFaseGantt
                faseStart={faseStart!}
                faseEnd={faseEnd!}
                modo={modo}
                dataInicio={form.data_inicio}
                dataFim={form.data_fim}
                onChange={(di, df) => setForm((p) => ({ ...p, data_inicio: di, data_fim: modo === "unico" ? di : df }))}
              />
            </div>
          )}
          {canViewFinancial && (
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <Label>Custo previsto (R$)</Label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={semCusto} onCheckedChange={(v) => setSemCusto(!!v)} />
                  Sem custo
                </label>
              </div>
              <Input
                inputMode="decimal"
                placeholder="R$ 0,00"
                disabled={semCusto}
                value={semCusto ? "" : form.custo_previsto}
                onChange={(e) => setForm({ ...form, custo_previsto: formatBRLInput(e.target.value) })}
              />
              {semCusto && <p className="text-xs text-muted-foreground mt-1">Este item não impacta o financeiro.</p>}
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

// ---------- helpers ----------
function formatBRLInput(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const n = Number(digits) / 100;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parseBRL(v: string): number {
  if (!v) return 0;
  const cleaned = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(cleaned) || 0;
}

// ---------- Mini Gantt da fase ----------
interface MiniProps {
  faseStart: Date;
  faseEnd: Date;
  modo: "unico" | "periodo";
  dataInicio: string;
  dataFim: string;
  onChange: (di: string, df: string) => void;
}
function MiniFaseGantt({ faseStart, faseEnd, modo, dataInicio, dataFim, onChange }: MiniProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const totalDays = Math.max(diffDays(faseStart, faseEnd), 1);
  const di = parseDate(dataInicio) || faseStart;
  const df = parseDate(dataFim) || di;
  const leftPct = (diffDays(faseStart, di) / totalDays) * 100;
  const rightPct = (diffDays(faseStart, df) / totalDays) * 100;
  const widthPct = Math.max(rightPct - leftPct, modo === "unico" ? 0 : 2);

  const dateFromX = (clientX: number): Date => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const d = addDays(faseStart, Math.round(ratio * totalDays));
    if (d < faseStart) return faseStart;
    if (d > faseEnd) return faseEnd;
    return d;
  };

  const startDrag = (mode: "move" | "left" | "right" | "set") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const origDi = di;
    const origDf = df;
    const origLen = diffDays(origDi, origDf);
    const startX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      const d = dateFromX(ev.clientX);
      if (mode === "set" || modo === "unico") {
        onChange(toISODate(d), toISODate(d));
      } else if (mode === "left") {
        const nd = d > origDf ? origDf : d;
        onChange(toISODate(nd), toISODate(origDf));
      } else if (mode === "right") {
        const nd = d < origDi ? origDi : d;
        onChange(toISODate(origDi), toISODate(nd));
      } else if (mode === "move") {
        const rect = trackRef.current!.getBoundingClientRect();
        const dxDays = Math.round(((ev.clientX - startX) / rect.width) * totalDays);
        let newDi = addDays(origDi, dxDays);
        let newDf = addDays(newDi, origLen);
        if (newDi < faseStart) { newDi = faseStart; newDf = addDays(newDi, origLen); }
        if (newDf > faseEnd) { newDf = faseEnd; newDi = addDays(newDf, -origLen); }
        onChange(toISODate(newDi), toISODate(newDf));
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="space-y-1 select-none">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{faseStart.toLocaleDateString("pt-BR")}</span>
        <span>{faseEnd.toLocaleDateString("pt-BR")}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-8 rounded-md bg-muted border border-border cursor-crosshair"
        onMouseDown={(e) => startDrag("set")(e)}
      >
        {modo === "unico" ? (
          <div
            className="absolute top-0 bottom-0 w-1.5 -ml-[3px] bg-primary rounded cursor-ew-resize"
            style={{ left: `${leftPct}%` }}
            onMouseDown={startDrag("move")}
            title={di.toLocaleDateString("pt-BR")}
          />
        ) : (
          <div
            className="absolute top-1 bottom-1 bg-primary/70 rounded flex items-center cursor-move"
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            onMouseDown={startDrag("move")}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l cursor-ew-resize"
              onMouseDown={startDrag("left")}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary rounded-r cursor-ew-resize"
              onMouseDown={startDrag("right")}
            />
          </div>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground text-center">
        {modo === "unico"
          ? di.toLocaleDateString("pt-BR")
          : `${di.toLocaleDateString("pt-BR")} → ${df.toLocaleDateString("pt-BR")}`}
      </div>
    </div>
  );
}