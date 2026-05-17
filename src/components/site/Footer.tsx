import { MapPin, Phone, ArrowUpRight } from "lucide-react";
import logoHorizontal from "@/assets/logo-horizontal.png";

export function Footer() {
  return (
    <footer id="contato" className="relative bg-graphite text-graphite-foreground">
      {/* Angular accent divider */}
      <div
        aria-hidden
        className="h-3 bg-accent"
        style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 80px) 100%, 0 100%)" }}
      />

      <div className="container mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <div className="bg-white/95 inline-block px-4 py-3 rounded-md">
              <img
                src={logoHorizontal}
                alt="Dimensão Coberturas"
                className="h-10 w-auto"
                width={200}
                height={56}
                loading="lazy"
              />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-graphite-foreground/70 max-w-xs">
              Coberturas que protegem. Parcerias que constroem. Força, confiança e
              inovação em cada detalhe.
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-[0.2em] text-accent">
              Endereço
            </h3>
            <div className="mt-5 flex gap-3 text-sm text-graphite-foreground/80 leading-relaxed">
              <MapPin className="h-5 w-5 shrink-0 text-accent mt-0.5" />
              <p>
                Via Waldomiro Bertassi, 1250
                <br />
                Rio Abaixo, Itupeva — SP
                <br />
                CEP 13209-566
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-[0.2em] text-accent">
              Contato
            </h3>
            <a
              href="tel:+5511989577805"
              className="mt-5 flex items-center gap-3 text-base font-display font-semibold hover:text-accent transition-colors"
            >
              <Phone className="h-5 w-5 text-accent" />
              (11) 98957-7805
            </a>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-[0.2em] text-accent">
              Links
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                { href: "#contato", label: "Trabalhe Conosco" },
                { href: "#contato", label: "Solicite orçamento" },
                { href: "#sobre", label: "Sobre nós" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="group inline-flex items-center gap-2 text-sm text-graphite-foreground/80 hover:text-accent transition-colors"
                  >
                    {l.label}
                    <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-graphite-foreground/60">
            © 2024 Dimensão Coberturas. Todos os direitos reservados.
          </p>
          <p className="text-xs font-display uppercase tracking-[0.2em] text-accent/80">
            Coberturas que protegem · Parcerias que constroem
          </p>
        </div>
      </div>
    </footer>
  );
}