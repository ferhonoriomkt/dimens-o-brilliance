import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileDown, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FaseForm } from "@/components/crm/FaseForm";
import { PlanejamentoItemForm } from "@/components/crm/PlanejamentoItemForm";
import { ProjetoForm } from "@/components/crm/ProjetoForm";
import {
  Scale, computeRange, generateColumns, dateToPx, parseDate, addDays,
  snapPxToDate, toISODate, diffDays,
} from "./gantt-utils";
import { exportGanttPDF } from "./gantt-pdf";

interface Props {
  obraId: string;
  projetos: any[];
  fases: any[];
  itens: any[];
  canEdit: boolean;
  canViewFinancial?: boolean;
  servicos?: { id: string; nome: string }[];
}

type BarKind = "fase" | "item";

interface BarData {
  id: string;
  kind: BarKind;
  nome: string;
  data_inicio: string | null;
  data_fim: string | null;
  completed?: boolean;
}

const LEFT_COL_W = 320;

export function GanttView({ obraId, projetos, fases, itens, canEdit, canViewFinancial, servicos = [] }: Props) {
  const qc = useQueryClient();
  const [scale, setScale] = useState<Scale>("week");
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dragPreview, setDragPreview] = useState<Record<string, { left: number; width: number }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const allDates = useMemo(() => {
    const arr: (string | null)[] = [];
    fases.forEach((f) => { arr.push(f.data_inicio); arr.push(f.data_fim); });
    itens.forEach((i) => { arr.push(i.data_inicio); arr.push(i.data_fim); });
    return arr;
  }, [fases, itens]);

  const range = useMemo(() => computeRange(allDates, scale, zoom), [allDates, scale, zoom]);
  const columns = useMemo(() => generateColumns(range, scale, zoom), [range, scale, zoom]);

  const fasesByProjeto = useMemo(() => {
    const m = new Map<string, any[]>();
    fases.forEach((f) => {
      const arr = m.get(f.projeto_id) ?? [];
      arr.push(f);
      m.set(f.projeto_id, arr);
    });
    return m;
  }, [fases]);

  const itensByFase = useMemo(() => {
    const m = new Map<string | null, any[]>();
    itens.forEach((i) => {
      const k = i.fase_id ?? null;
      const arr = m.get(k) ?? [];
      arr.push(i);
      m.set(k, arr);
    });
    return m;
  }, [itens]);

  // Effective dates: if fase missing dates, compute from its itens
  const faseEffective = useMemo(() => {
    const m = new Map<string, { ini: string | null; fim: string | null }>();
    fases.forEach((f) => {
      let ini = f.data_inicio;
      let fim = f.data_fim;
      if (!ini || !fim) {
        const fItens = itensByFase.get(f.id) ?? [];
        const inis = fItens.map((i) => i.data_inicio).filter(Boolean) as string[];
        const fims = fItens.map((i) => i.data_fim).filter(Boolean) as string[];
        if (!ini && inis.length) ini = inis.sort()[0];
        if (!fim && fims.length) fim = fims.sort()[fims.length - 1];
      }
      m.set(f.id, { ini, fim });
    });
    return m;
  }, [fases, itensByFase]);

  const updateDates = useMutation({
    mutationFn: async (args: { kind: BarKind; id: string; data_inicio: string; data_fim: string }) => {
      const table = args.kind === "fase" ? "crm_fases" : "crm_planejamento_itens";
      const { error } = await supabase.from(table)
        .update({ data_inicio: args.data_inicio, data_fim: args.data_fim })
        .eq("id", args.id);
      if (error) throw error;
    },
    onMutate: async (args) => {
      const key = ["crm", "obra", obraId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any>(key);
      if (prev) {
        const field = args.kind === "fase" ? "fases" : "itens";
        qc.setQueryData(key, {
          ...prev,
          [field]: (prev[field] ?? []).map((row: any) =>
            row.id === args.id
              ? { ...row, data_inicio: args.data_inicio, data_fim: args.data_fim }
              : row,
          ),
        });
      }
      return { prev };
    },
    onError: (e: Error, _args, ctx) => {
      if (ctx?.prev) qc.setQueryData(["crm", "obra", obraId], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] });
    },
  });

  const swapOrdem = useMutation({
    mutationFn: async (args: { a: { id: string; ordem: number }; b: { id: string; ordem: number } }) => {
      // Use a temporary value to avoid unique-conflict if (projeto_id, ordem) is unique
      const tmp = -Math.floor(Math.random() * 100000) - 1;
      const u1 = await supabase.from("crm_fases").update({ ordem: tmp }).eq("id", args.a.id);
      if (u1.error) throw u1.error;
      const u2 = await supabase.from("crm_fases").update({ ordem: args.a.ordem }).eq("id", args.b.id);
      if (u2.error) throw u2.error;
      const u3 = await supabase.from("crm_fases").update({ ordem: args.b.ordem }).eq("id", args.a.id);
      if (u3.error) throw u3.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", "obra", obraId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const onBarPointerDown = useCallback((
    e: React.PointerEvent,
    bar: BarData,
    mode: "move" | "resize-l" | "resize-r",
  ) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startIni = parseDate(bar.data_inicio) ?? new Date();
    const startFim = parseDate(bar.data_fim) ?? addDays(startIni, 1);
    const startX = e.clientX;
    const initialLeft = dateToPx(startIni, range.start, scale, zoom);
    const initialRight = dateToPx(startFim, range.start, scale, zoom);
    const initialWidth = Math.max(initialRight - initialLeft, 8);

    let finalIni = startIni;
    let finalFim = startFim;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      let newLeftPx = initialLeft;
      let newWidthPx = initialWidth;
      if (mode === "move") {
        newLeftPx = initialLeft + dx;
      } else if (mode === "resize-l") {
        newLeftPx = initialLeft + dx;
        newWidthPx = initialWidth - dx;
      } else {
        newWidthPx = initialWidth + dx;
      }
      if (newWidthPx < 8) newWidthPx = 8;

      const snappedIni = snapPxToDate(newLeftPx, range.start, scale, zoom);
      const snappedFim = snapPxToDate(newLeftPx + newWidthPx, range.start, scale, zoom);
      if (mode === "move") {
        const dur = diffDays(startIni, startFim);
        finalIni = snappedIni;
        finalFim = addDays(snappedIni, dur);
      } else if (mode === "resize-l") {
        finalIni = snappedIni;
        if (diffDays(finalIni, startFim) < 1) finalIni = addDays(startFim, -1);
        finalFim = startFim;
      } else {
        finalIni = startIni;
        finalFim = snappedFim;
        if (diffDays(finalIni, finalFim) < 1) finalFim = addDays(finalIni, 1);
      }

      const previewLeft = dateToPx(finalIni, range.start, scale, zoom);
      const previewWidth = Math.max(dateToPx(finalFim, range.start, scale, zoom) - previewLeft, 8);
      setDragPreview((p) => ({ ...p, [bar.id]: { left: previewLeft, width: previewWidth } }));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragPreview((p) => { const c = { ...p }; delete c[bar.id]; return c; });
      const newIni = toISODate(finalIni);
      const newFim = toISODate(finalFim);
      if (newIni !== bar.data_inicio || newFim !== bar.data_fim) {
        updateDates.mutate({ kind: bar.kind, id: bar.id, data_inicio: newIni, data_fim: newFim });
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [canEdit, range, scale, zoom, updateDates]);

  const renderBar = (bar: BarData, rowTop: number) => {
    const preview = dragPreview[bar.id];
    const ini = parseDate(bar.data_inicio);
    const fim = parseDate(bar.data_fim);
    if (!ini || !fim) {
      return (
        <div
          key={bar.id}
          className="absolute text-[10px] text-muted-foreground italic px-2"
          style={{ top: rowTop + 8, left: 8 }}
        >
          Sem datas
        </div>
      );
    }
    const left = preview?.left ?? dateToPx(ini, range.start, scale, zoom);
    const width = preview?.width ?? Math.max(dateToPx(fim, range.start, scale, zoom) - left, 8);
    const isFase = bar.kind === "fase";
    const baseColor = bar.completed
      ? "bg-emerald-500/80 border-emerald-600"
      : isFase
        ? "bg-primary border-primary/60"
        : "bg-primary/40 border-primary/50";
    return (
      <div
        key={bar.id}
        className={`absolute rounded-md border ${baseColor} flex items-center text-xs text-primary-foreground font-medium select-none ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{
          top: rowTop + 6,
          left,
          width,
          height: isFase ? 22 : 18,
        }}
        onPointerDown={(e) => onBarPointerDown(e, bar, "move")}
      >
        {canEdit && (
          <div
            className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize bg-black/20 rounded-l-md"
            onPointerDown={(e) => onBarPointerDown(e, bar, "resize-l")}
          />
        )}
        <span className="truncate px-2">{bar.nome}</span>
        {canEdit && (
          <div
            className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize bg-black/20 rounded-r-md"
            onPointerDown={(e) => onBarPointerDown(e, bar, "resize-r")}
          />
        )}
      </div>
    );
  };

  // Build rows
  type Row = {
    key: string;
    kind: "projeto" | "fase" | "item" | "add-fase" | "add-item" | "add-projeto";
    label: string;
    idx?: number;
    bar?: BarData;
    indent: number;
    projetoId?: string;
    faseId?: string;
    fase?: any;
    faseUp?: { id: string; ordem: number };
    faseDown?: { id: string; ordem: number };
    faseDates?: { ini: string | null; fim: string | null };
  };
  const rows: Row[] = [];
  projetos.forEach((p, pIdx) => {
    rows.push({ key: `p-${p.id}`, kind: "projeto", label: p.nome, idx: pIdx + 1, indent: 0, projetoId: p.id });
    const pFases = fasesByProjeto.get(p.id) ?? [];
    pFases.forEach((f, fIdx) => {
      const eff = faseEffective.get(f.id) ?? { ini: null, fim: null };
      const isExpanded = expanded[f.id] ?? true;
      rows.push({
        key: `f-${f.id}`,
        kind: "fase",
        label: f.nome,
        idx: fIdx + 1,
        indent: 1,
        bar: { id: f.id, kind: "fase", nome: f.nome, data_inicio: eff.ini, data_fim: eff.fim },
        projetoId: p.id,
        faseId: f.id,
        fase: f,
        faseUp: fIdx > 0 ? { id: pFases[fIdx - 1].id, ordem: pFases[fIdx - 1].ordem } : undefined,
        faseDown: fIdx < pFases.length - 1 ? { id: pFases[fIdx + 1].id, ordem: pFases[fIdx + 1].ordem } : undefined,
        faseDates: eff,
      });
      if (isExpanded) {
        const fItens = itensByFase.get(f.id) ?? [];
        fItens.forEach((i) => {
          rows.push({
            key: `i-${i.id}`,
            kind: "item",
            label: i.nome,
            indent: 2,
            bar: { id: i.id, kind: "item", nome: i.nome, data_inicio: i.data_inicio, data_fim: i.data_fim, completed: i.status === "concluido" },
          });
        });
        if (canEdit) {
          rows.push({
            key: `add-i-${f.id}`,
            kind: "add-item",
            label: "Adicionar item",
            indent: 2,
            projetoId: p.id,
            faseId: f.id,
            faseDates: eff,
          });
        }
      }
    });
    const orphans = (itensByFase.get(null) ?? []).filter((i) => i.projeto_id === p.id);
    if (orphans.length) {
      rows.push({ key: `o-${p.id}`, kind: "fase", label: "Sem fase", indent: 1 });
      orphans.forEach((i) => {
        rows.push({
          key: `i-${i.id}`,
          kind: "item",
          label: i.nome,
          indent: 2,
          bar: { id: i.id, kind: "item", nome: i.nome, data_inicio: i.data_inicio, data_fim: i.data_fim, completed: i.status === "concluido" },
        });
      });
    }
    if (canEdit) {
      rows.push({ key: `add-f-${p.id}`, kind: "add-fase", label: "Adicionar fase", indent: 1, projetoId: p.id });
    }
  });
  if (canEdit) {
    rows.push({ key: `add-p`, kind: "add-projeto", label: "Adicionar projeto", indent: 0 });
  }

  const ROW_H = 34;
  const HEADER_H = 56;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPx = today >= range.start && today <= range.end ? dateToPx(today, range.start, scale, zoom) : null;

  const fitZoom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const avail = container.clientWidth - LEFT_COL_W - 24;
    if (avail <= 0) return;
    const natural = range.totalPx / zoom; // total width at zoom=1
    const z = Math.max(0.15, Math.min(3, avail / natural));
    setZoom(z);
  }, [range.totalPx, zoom]);

  // Auto-fit once on mount/data change so the user sees the full project
  const didAutoFit = useRef(false);
  useEffect(() => {
    if (didAutoFit.current) return;
    if (!fases.length && !itens.length) return;
    didAutoFit.current = true;
    requestAnimationFrame(() => fitZoom());
  }, [fases.length, itens.length, fitZoom]);

  const handleExportPDF = useCallback(async () => {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      // Temporarily fit before capture so PDF gets full timeline
      const obraNome = projetos[0]?.obra_nome ?? "Planejamento";
      await exportGanttPDF({
        element: captureRef.current,
        title: "Planejamento da Obra",
        projetos,
        fases,
        itens,
        faseEffective,
        fasesByProjeto,
        itensByFase,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao exportar PDF");
    } finally {
      setExporting(false);
    }
  }, [projetos, fases, itens, faseEffective, fasesByProjeto, itensByFase]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-display font-bold">Gantt</h3>
        <div className="flex gap-1 items-center flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.15, z * 0.8))} title="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={fitZoom} title="Ajustar à tela">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(3, z * 1.25))} title="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="mx-2 h-5 w-px bg-border" />
          {(["day", "week", "month"] as Scale[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={scale === s ? "default" : "outline"}
              onClick={() => setScale(s)}
            >
              {s === "day" ? "Dia" : s === "week" ? "Semana" : "Mês"}
            </Button>
          ))}
          <div className="mx-2 h-5 w-px bg-border" />
          <Button size="sm" variant="default" onClick={handleExportPDF} disabled={exporting}>
            <FileDown className="h-4 w-4 mr-1" />
            {exporting ? "Exportando..." : "PDF"}
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: "70vh" }}>
        <div ref={captureRef} className="relative bg-card" style={{ width: LEFT_COL_W + range.totalPx + 24 }}>
          {/* Header */}
          <div className="sticky top-0 z-20 bg-card border-b border-border" style={{ height: HEADER_H }}>
            <div className="flex">
              <div
                className="sticky left-0 z-30 bg-card border-r border-border flex items-end px-3 pb-2 font-semibold text-xs uppercase text-muted-foreground"
                style={{ width: LEFT_COL_W, height: HEADER_H }}
              >
                Etapa / Descrição
              </div>
              <div className="relative" style={{ width: range.totalPx, height: HEADER_H }}>
                {columns.groups.map((g, i) => (
                  <div
                    key={`g-${i}`}
                    className="absolute top-0 h-7 border-r border-border bg-muted/40 flex items-center justify-center text-xs font-medium"
                    style={{ left: g.left, width: g.width }}
                  >
                    {g.label}
                  </div>
                ))}
                {columns.cells.map((c, i) => (
                  <div
                    key={`c-${i}`}
                    className="absolute top-7 h-7 border-r border-border flex items-center justify-center text-[11px] text-muted-foreground"
                    style={{ left: c.left, width: c.width }}
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="relative" style={{ height: rows.length * ROW_H }}>
            {/* Vertical column grid */}
            <div className="absolute inset-y-0" style={{ left: LEFT_COL_W, width: range.totalPx }}>
              {columns.cells.map((c, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-r border-border/40" style={{ left: c.left, width: c.width }} />
              ))}
              {todayPx !== null && (
                <div className="absolute top-0 bottom-0 w-px bg-destructive z-10" style={{ left: todayPx }} />
              )}
            </div>

            {rows.map((row, rIdx) => {
              const top = rIdx * ROW_H;
              if (row.kind === "add-projeto") {
                return (
                  <div key={row.key} className="absolute inset-x-0 border-b border-border/50" style={{ top, height: ROW_H }}>
                    <div className="sticky left-0 z-10 h-full bg-card border-r border-border flex items-center" style={{ width: LEFT_COL_W, paddingLeft: 12 }}>
                      <ProjetoForm
                        obraId={obraId}
                        trigger={
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Novo projeto
                          </Button>
                        }
                      />
                    </div>
                  </div>
                );
              }
              if (row.kind === "add-fase") {
                return (
                  <div key={row.key} className="absolute inset-x-0 border-b border-border/50" style={{ top, height: ROW_H }}>
                    <div className="sticky left-0 z-10 h-full bg-card border-r border-border flex items-center" style={{ width: LEFT_COL_W, paddingLeft: 12 + row.indent * 16 }}>
                      <FaseForm
                        obraId={obraId}
                        projetoId={row.projetoId!}
                        trigger={
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Nova fase
                          </Button>
                        }
                      />
                    </div>
                  </div>
                );
              }
              if (row.kind === "add-item") {
                const faseList = fases.filter((f: any) => f.projeto_id === row.projetoId);
                const ini = row.faseDates?.ini ? parseDate(row.faseDates.ini) : null;
                const fim = row.faseDates?.fim ? parseDate(row.faseDates.fim) : null;
                const left = ini ? dateToPx(ini, range.start, scale, zoom) : 0;
                const width = ini && fim ? Math.max(dateToPx(fim, range.start, scale, zoom) - left, 24) : 0;
                return (
                  <div key={row.key} className="absolute inset-x-0 border-b border-border/50 group" style={{ top, height: ROW_H }}>
                    <div className="sticky left-0 z-10 h-full bg-card border-r border-border flex items-center" style={{ width: LEFT_COL_W, paddingLeft: 12 + row.indent * 16 }}>
                      <PlanejamentoItemForm
                        obraId={obraId}
                        projetoId={row.projetoId!}
                        fases={faseList}
                        servicos={servicos}
                        canViewFinancial={canViewFinancial}
                        defaultFaseId={row.faseId}
                        trigger={
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar item
                          </Button>
                        }
                      />
                    </div>
                    {ini && fim && (
                      <div className="absolute top-0 h-full" style={{ left: LEFT_COL_W, width: range.totalPx }}>
                        <PlanejamentoItemForm
                          obraId={obraId}
                          projetoId={row.projetoId!}
                          fases={faseList}
                          servicos={servicos}
                          canViewFinancial={canViewFinancial}
                          defaultFaseId={row.faseId}
                          trigger={
                            <button
                              className="absolute rounded-md border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-medium"
                              style={{ top: 6, left, width, height: 22 }}
                              title="Adicionar item nesta fase"
                            >
                              <Plus className="h-3 w-3 mr-1" /> item
                            </button>
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div key={row.key} className="absolute inset-x-0 border-b border-border/50" style={{ top, height: ROW_H }}>
                  {/* left col */}
                  <div
                    className={`sticky left-0 z-10 h-full bg-card border-r border-border flex items-center gap-2 pr-2 text-sm ${row.kind === "projeto" ? "font-bold" : ""}`}
                    style={{ width: LEFT_COL_W, paddingLeft: 12 + row.indent * 16 }}
                  >
                    {row.kind === "fase" && row.bar && (
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setExpanded((p) => ({ ...p, [row.bar!.id]: !(p[row.bar!.id] ?? true) }))}
                      >
                        {(expanded[row.bar.id] ?? true) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {row.idx !== undefined && (
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{row.idx}</span>
                    )}
                    <span className="truncate flex-1">{row.label}</span>
                    {canEdit && row.kind === "fase" && row.fase && (
                      <div className="flex items-center gap-0.5">
                        <button
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={!row.faseUp || swapOrdem.isPending}
                          onClick={() => row.faseUp && swapOrdem.mutate({ a: { id: row.fase.id, ordem: row.fase.ordem }, b: row.faseUp })}
                          title="Mover para cima"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={!row.faseDown || swapOrdem.isPending}
                          onClick={() => row.faseDown && swapOrdem.mutate({ a: { id: row.fase.id, ordem: row.fase.ordem }, b: row.faseDown })}
                          title="Mover para baixo"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* bar area */}
                  <div className="absolute top-0 h-full" style={{ left: LEFT_COL_W, width: range.totalPx }}>
                    {row.bar && renderBar(row.bar, 0)}
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Nenhum projeto, fase ou item para exibir.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
