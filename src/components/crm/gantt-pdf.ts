import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Args {
  element: HTMLElement;
  title: string;
  projetos: any[];
  fases: any[];
  itens: any[];
  faseEffective: Map<string, { ini: string | null; fim: string | null }>;
  fasesByProjeto: Map<string, any[]>;
  itensByFase: Map<string | null, any[]>;
}

function fmt(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d + (d.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("pt-BR");
}

function buildMarkdown(a: Args): string {
  const lines: string[] = [];
  lines.push(`# ${a.title}`);
  lines.push("");
  a.projetos.forEach((p, i) => {
    lines.push(`## ${i + 1}. ${p.nome}`);
    if (p.descricao) lines.push(`${p.descricao}`);
    lines.push("");
    const pFases = a.fasesByProjeto.get(p.id) ?? [];
    pFases.forEach((f, fi) => {
      const eff = a.faseEffective.get(f.id) ?? { ini: f.data_inicio, fim: f.data_fim };
      lines.push(`### ${i + 1}.${fi + 1} ${f.nome}`);
      lines.push(`- Período: ${fmt(eff.ini)} → ${fmt(eff.fim)}`);
      const fItens = a.itensByFase.get(f.id) ?? [];
      if (fItens.length) {
        lines.push(`- Itens:`);
        fItens.forEach((it) => {
          lines.push(`  - **${it.nome}** — ${fmt(it.data_inicio)} → ${fmt(it.data_fim)}`);
        });
      }
      lines.push("");
    });
    const orphans = (a.itensByFase.get(null) ?? []).filter((it) => it.projeto_id === p.id);
    if (orphans.length) {
      lines.push(`### Itens sem fase`);
      orphans.forEach((it) => {
        lines.push(`- **${it.nome}** — ${fmt(it.data_inicio)} → ${fmt(it.data_fim)}`);
      });
      lines.push("");
    }
  });
  return lines.join("\n");
}

export async function exportGanttPDF(args: Args) {
  // Capture the gantt element at full size
  const canvas = await html2canvas(args.element, {
    backgroundColor: "#ffffff",
    scale: 2,
    windowWidth: args.element.scrollWidth,
    windowHeight: args.element.scrollHeight,
    width: args.element.scrollWidth,
    height: args.element.scrollHeight,
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(args.title, margin, margin + 4);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margin, margin + 20);

  // Fit image into page width
  const availW = pageW - margin * 2;
  const ratio = canvas.height / canvas.width;
  let imgW = availW;
  let imgH = imgW * ratio;
  const maxImgH = pageH - margin * 2 - 32;
  if (imgH > maxImgH) {
    imgH = maxImgH;
    imgW = imgH / ratio;
  }
  const imgX = margin + (availW - imgW) / 2;
  const imgY = margin + 30;
  pdf.addImage(imgData, "PNG", imgX, imgY, imgW, imgH);

  // Markdown report on subsequent pages
  const md = buildMarkdown(args);
  pdf.addPage();
  const textW = pageW - margin * 2;
  let y = margin;
  const lineH = 14;

  const writeBlock = (text: string, size: number, bold: boolean, indent = 0) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const wrapped = pdf.splitTextToSize(text, textW - indent);
    wrapped.forEach((ln: string) => {
      if (y > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(ln, margin + indent, y);
      y += lineH * (size / 11);
    });
    y += 4;
  };

  md.split("\n").forEach((raw) => {
    const line = raw.replace(/\*\*/g, "");
    if (!line.trim()) { y += 6; return; }
    if (line.startsWith("# ")) writeBlock(line.slice(2), 16, true);
    else if (line.startsWith("## ")) writeBlock(line.slice(3), 13, true);
    else if (line.startsWith("### ")) writeBlock(line.slice(4), 11, true, 8);
    else if (line.startsWith("  - ")) writeBlock("• " + line.slice(4), 10, false, 28);
    else if (line.startsWith("- ")) writeBlock("• " + line.slice(2), 10, false, 16);
    else writeBlock(line, 10, false);
  });

  const filename = `${args.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}