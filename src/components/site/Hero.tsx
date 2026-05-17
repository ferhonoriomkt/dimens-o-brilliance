import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-cobertura.jpg";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate min-h-[100svh] flex items-center overflow-hidden bg-deep text-deep-foreground"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, oklch(0.224 0.078 263 / 0.92) 0%, oklch(0.224 0.078 263 / 0.78) 45%, oklch(0.224 0.078 263 / 0.55) 100%)",
          }}
        />
        {/* Angular gold accent */}
        <div
          aria-hidden
          className="absolute -left-10 top-1/3 hidden lg:block"
          style={{
            width: 220,
            height: 220,
            background: "var(--gold)",
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            opacity: 0.18,
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-display font-semibold uppercase tracking-[0.2em] text-accent"
          >
            <span className="h-1.5 w-1.5 bg-accent" /> Mais de 20 anos no mercado
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-display font-extrabold uppercase leading-[0.95] tracking-tight text-balance"
            style={{ fontSize: "clamp(2.5rem, 6.5vw, 5.25rem)" }}
          >
            Do design à{" "}
            <span className="relative inline-block text-accent">
              proteção
              <span
                aria-hidden
                className="absolute -bottom-2 left-0 h-1 w-full bg-accent"
              />
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 max-w-2xl text-lg md:text-xl text-deep-foreground/80 leading-relaxed"
          >
            Cobertura para estacionamento, passarela e hall de entrada — com design e
            alta qualidade para agregar valor ao seu imóvel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Button
              asChild
              size="lg"
              className="font-display font-bold uppercase tracking-wider h-14 px-8 text-base shadow-elevated hover:-translate-y-0.5 transition-transform"
            >
              <a href="#contato">
                <MessageCircle className="mr-2 h-5 w-5" />
                Fale com especialista
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-display font-bold uppercase tracking-wider h-14 px-8 text-base border-accent text-accent bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <a href="#portfolio">
                Ver projetos <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Angular divider at the bottom */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-12 bg-background"
        style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}
      />
    </section>
  );
}