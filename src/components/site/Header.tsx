import { useEffect, useState } from "react";
import { Menu, LogIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import logoHorizontal from "@/assets/logo-horizontal.png";
import logoHorizontalInvertido from "@/assets/logo-horizontal-invertido.png";

const links = [
  { href: "#sobre", label: "Sobre Nós" },
  { href: "#servicos", label: "Serviços" },
  { href: "#depoimentos", label: "Depoimentos" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        <a href="#top" className="flex items-center" aria-label="Dimensão Coberturas — Início">
          <img
            src={scrolled ? logoHorizontal : logoHorizontalInvertido}
            alt="Dimensão Coberturas"
            className="h-10 md:h-12 w-auto"
            width={240}
            height={64}
          />
        </a>

        <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`font-display font-semibold text-sm uppercase tracking-wider transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full hover:text-accent ${
                scrolled ? "text-foreground/80" : "text-white/90"
              }`}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/portfolio"
            className={`font-display font-semibold text-sm uppercase tracking-wider transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full hover:text-accent ${
              scrolled ? "text-foreground/80" : "text-white/90"
            }`}
          >
            Portfólio
          </Link>
        </nav>

        <div className="hidden md:flex items-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`font-display font-semibold uppercase tracking-wider text-xs hover:bg-transparent ${
              scrolled ? "text-foreground/70 hover:text-primary" : "text-white/80 hover:text-accent"
            }`}
          >
            <Link to="/login">
              <LogIn className="h-3.5 w-3.5 mr-1.5" />
              Login
            </Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-deep text-deep-foreground border-deep">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex flex-col gap-6 pt-8">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display font-semibold text-lg uppercase tracking-wider hover:text-accent transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/portfolio"
                onClick={() => setOpen(false)}
                className="font-display font-semibold text-lg uppercase tracking-wider hover:text-accent transition-colors"
              >
                Portfólio
              </Link>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-display font-semibold uppercase tracking-wider mt-4 justify-start text-white/80 hover:text-accent hover:bg-transparent"
              >
                <Link to="/login" onClick={() => setOpen(false)}>
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Login
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}