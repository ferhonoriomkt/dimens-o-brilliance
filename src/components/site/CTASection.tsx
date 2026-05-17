import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "./AnimatedSection";

export function CTASection() {
  return (
    <AnimatedSection
      id="contato"
      className="relative overflow-hidden bg-deep text-deep-foreground py-20 md:py-28"
    >
      <div
        aria-hidden
        className="absolute -right-16 -top-16 hidden md:block"
        style={{
          width: 280,
          height: 280,
          background: "var(--gold)",
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
          opacity: 0.15,
        }}
      />
      <div className="container mx-auto px-4 md:px-8 relative">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-display font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-1.5 w-1.5 bg-accent" /> Próximo passo
          </span>
          <h2
            className="mt-6 font-display font-extrabold uppercase leading-[1] tracking-tight text-balance"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Pronto para proteger{" "}
            <span className="text-accent">seu empreendimento</span>?
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-deep-foreground/80 leading-relaxed">
            Receba uma proposta técnica personalizada com prazos, materiais e
            garantia. Atendimento consultivo em até 24h.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="font-display font-bold uppercase tracking-wider h-14 px-8 text-base shadow-elevated hover:-translate-y-0.5 transition-transform"
            >
              <a href="mailto:contato@dimensaocoberturas.com.br">
                <MessageCircle className="mr-2 h-5 w-5" />
                Solicite orçamento
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-display font-bold uppercase tracking-wider h-14 px-8 text-base border-accent text-accent bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <a href="#servicos">
                Conheça os serviços <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}