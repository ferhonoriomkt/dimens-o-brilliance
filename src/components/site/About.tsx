import { Ruler, Users, Car } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { CountUp } from "./CountUp";

const stats = [
  { icon: Ruler, end: 347526, suffix: " m²", label: "de coberturas instaladas" },
  { icon: Users, end: 80207, prefix: "+ ", label: "pessoas impactadas diretamente" },
  { icon: Car, end: 29111, label: "vagas de garagem instaladas" },
];

export function About() {
  return (
    <AnimatedSection id="sobre" className="relative bg-background py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <span className="inline-block font-display font-semibold uppercase tracking-[0.25em] text-sm text-primary">
              Sobre a Dimensão
            </span>
            <h2 className="mt-4 font-display font-bold text-4xl md:text-5xl lg:text-6xl text-deep leading-[1.05]">
              Mais de <span className="text-primary">20 anos</span>
              <br />
              de experiência.
            </h2>
            <div
              aria-hidden
              className="mt-6 h-1 w-20 bg-accent"
              style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)" }}
            />
            <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
              A <strong className="text-foreground">Dimensão Coberturas®</strong> é reconhecida no
              mercado por desenvolver projetos com design diferenciado, aliando estética,
              resistência, durabilidade e segurança.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Cuidamos de todo o processo, desde a modelagem 3D e aprovação nos órgãos
              competentes, até a execução dos alicerces e montagem final.
            </p>
          </div>

          <div className="grid gap-5">
            {stats.map((s, i) => (
              <AnimatedSection
                key={s.label}
                as="div"
                delay={i * 0.1}
                className="group relative overflow-hidden bg-card border border-border rounded-lg p-6 md:p-8 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-3xl md:text-4xl text-deep">
                      <CountUp end={s.end} prefix={s.prefix} suffix={s.suffix} />
                    </div>
                    <p className="mt-1 text-muted-foreground">{s.label}</p>
                  </div>
                </div>
                <div
                  aria-hidden
                  className="absolute right-0 top-0 h-full w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top"
                />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}