import { Quote } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const clients = [
  "Residencial América Latina",
  "Residencial Ilha das Flores",
  "Residencial Castro Alves",
  "Atmosphera",
  "Tons de Ipanema",
];

const testimonials = [
  {
    quote:
      "Estrutura resistente e materiais de primeira qualidade. Design moderno. O resultado final me surpreendeu.",
    name: "Adriana Coraini",
    role: "Residencial Ilha das Flores",
  },
  {
    quote:
      "A equipe é extremamente profissional, contando com arquiteta, engenheiro e setor financeiro. Tudo muito bem coordenado.",
    name: "Cássia da S. Leal",
    role: "Cond. Reserva do Japi",
  },
  {
    quote:
      "Excelente trabalho que realizam com respeito aos seus clientes, proporcionando satisfação e realização.",
    name: "Cristiane Krajuskinas",
    role: "Residencial América Latina",
  },
];

export function Testimonials() {
  return (
    <AnimatedSection id="depoimentos" className="bg-background py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        {/* Clients */}
        <div id="portfolio" className="text-center">
          <span className="inline-block font-display font-semibold uppercase tracking-[0.25em] text-sm text-primary">
            Clientes que confiam
          </span>
          <h2 className="mt-4 font-display font-bold text-4xl md:text-5xl text-deep">
            Parcerias que <span className="text-primary">constroem</span>.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {clients.map((c) => (
            <div
              key={c}
              className="group relative flex items-center justify-center text-center min-h-[96px] px-4 py-6 bg-card border border-border rounded-md hover:border-primary hover:shadow-card transition-all"
            >
              <span className="font-display font-semibold text-sm uppercase tracking-wider text-foreground/70 group-hover:text-primary transition-colors">
                {c}
              </span>
              <div
                aria-hidden
                className="absolute bottom-0 left-0 right-0 mx-auto h-0.5 w-0 bg-accent group-hover:w-2/3 transition-all"
              />
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-24">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block font-display font-semibold uppercase tracking-[0.25em] text-sm text-primary">
              Depoimentos
            </span>
            <h3 className="mt-4 font-display font-bold text-3xl md:text-4xl text-deep">
              O que dizem os nossos clientes.
            </h3>
          </div>

          <div className="mt-12 max-w-4xl mx-auto">
            <Carousel opts={{ loop: true, align: "start" }}>
              <CarouselContent>
                {testimonials.map((t) => (
                  <CarouselItem key={t.name} className="md:basis-full">
                    <article className="relative bg-card border border-border rounded-xl p-8 md:p-12 shadow-card">
                      <Quote
                        aria-hidden
                        className="absolute -top-5 left-8 h-12 w-12 text-accent bg-background p-2"
                      />
                      <blockquote className="font-display font-medium text-xl md:text-2xl text-deep leading-relaxed">
                        “{t.quote}”
                      </blockquote>
                      <footer className="mt-8 flex items-center gap-4">
                        <div
                          aria-hidden
                          className="h-12 w-12 rounded-full bg-gradient-hero text-deep-foreground flex items-center justify-center font-display font-bold text-lg"
                        >
                          {t.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="font-display font-bold text-deep">{t.name}</div>
                          <div className="text-sm text-accent font-semibold">{t.role}</div>
                        </div>
                      </footer>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-8 flex justify-center gap-2">
                <CarouselPrevious className="static translate-y-0 h-11 w-11" />
                <CarouselNext className="static translate-y-0 h-11 w-11" />
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}