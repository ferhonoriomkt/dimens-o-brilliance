import { Anchor, Construction, LayoutPanelTop, Lightbulb } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const services = [
  {
    icon: Anchor,
    title: "Fundação Segura",
    description: "Blocos de concreto armado e chumbadores metálicos para máxima estabilidade estrutural.",
  },
  {
    icon: Construction,
    title: "Estrutura Robusta",
    description: "Aço com solda tipo MIG e tratamento anticorrosivo, garantindo durabilidade por décadas.",
  },
  {
    icon: LayoutPanelTop,
    title: "Cobertura Personalizada",
    description: "Telhas termoacústicas, Galvalume TP40 ou sistema de placas fotovoltaicas sob medida.",
  },
  {
    icon: Lightbulb,
    title: "Acabamentos Premium",
    description: "Calhas para escoamento eficiente e iluminação LED tubular de 18W integrada.",
  },
];

export function Services() {
  return (
    <AnimatedSection id="servicos" className="relative bg-graphite text-graphite-foreground py-24 md:py-32 overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-96 w-96 bg-primary/20 blur-3xl rounded-full"
      />
      <div className="container mx-auto px-4 md:px-8 relative">
        <div className="max-w-2xl">
          <span className="inline-block font-display font-semibold uppercase tracking-[0.25em] text-sm text-accent">
            Aspectos Técnicos
          </span>
          <h2 className="mt-4 font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Precisão em cada{" "}
            <span className="text-accent">material</span>.
          </h2>
          <p className="mt-6 text-lg text-graphite-foreground/75 leading-relaxed">
            Cada projeto da Dimensão é executado com componentes selecionados para entregar
            performance, segurança e estética em qualquer escala.
          </p>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s, i) => (
            <AnimatedSection
              key={s.title}
              as="div"
              delay={i * 0.08}
              className="group relative bg-deep/40 backdrop-blur border border-white/5 rounded-lg p-7 hover:border-accent hover:-translate-y-1.5 hover:bg-deep/70 transition-all"
            >
              <div
                aria-hidden
                className="absolute top-0 left-0 h-1 w-12 bg-accent group-hover:w-full transition-all duration-500"
              />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-md bg-accent/15 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display font-bold text-xl md:text-2xl leading-tight">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-graphite-foreground/70">
                {s.description}
              </p>
              <div className="mt-6 font-display font-semibold text-xs uppercase tracking-widest text-accent/0 group-hover:text-accent transition-colors">
                0{i + 1} / 04
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}