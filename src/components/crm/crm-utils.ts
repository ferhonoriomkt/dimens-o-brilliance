export const fmtBRL = (n: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(dt);
};

export const statusObraLabel: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  pausada: "Pausada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const statusItemLabel: Record<string, string> = {
  definido: "Definido",
  planejado: "Planejado",
  concluido: "Concluído",
};

export const statusItemBadge: Record<string, string> = {
  definido: "bg-muted text-muted-foreground",
  planejado: "bg-primary/10 text-primary",
  concluido: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export const statusObraBadge: Record<string, string> = {
  planejamento: "bg-muted text-muted-foreground",
  em_andamento: "bg-primary/10 text-primary",
  pausada: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelada: "bg-destructive/10 text-destructive",
};

export const tipoItemLabel: Record<string, string> = {
  servico: "Serviço",
  materia_prima: "Matéria-prima",
};