import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AnimatedSection } from "@/components/site/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólio — Dimensão Coberturas" },
      {
        name: "description",
        content:
          "Conheça os projetos de coberturas executados pela Dimensão Coberturas: estacionamentos, passarelas, halls e mais.",
      },
      { property: "og:title", content: "Portfólio — Dimensão Coberturas" },
      {
        property: "og:description",
        content:
          "Projetos de coberturas com design diferenciado, resistência e segurança.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug, description, location, category, year, cover_image_url")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <section className="container mx-auto px-4 md:px-8">
          <AnimatedSection className="max-w-3xl">
            <span className="inline-block text-xs font-display font-bold uppercase tracking-[0.3em] text-accent">
              Portfólio
            </span>
            <h1 className="mt-4 font-display font-bold text-4xl md:text-5xl text-foreground">
              Projetos que entregamos
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              Uma seleção de coberturas projetadas e executadas pela Dimensão —
              estacionamentos, passarelas, halls de entrada e estruturas
              industriais com design diferenciado e alta durabilidade.
            </p>
          </AnimatedSection>

          <div className="mt-14">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : !data || data.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">
                  Em breve novos projetos serão publicados aqui.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((p, idx) => (
                  <AnimatedSection
                    key={p.id}
                    as="article"
                    delay={idx * 0.05}
                    className="group"
                  >
                    <Link
                      to="/portfolio/$slug"
                      params={{ slug: p.slug }}
                      className="block overflow-hidden rounded-lg bg-card shadow-card border border-border transition-all hover:shadow-elevated hover:-translate-y-1"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        {p.cover_image_url ? (
                          <img
                            src={p.cover_image_url}
                            alt={p.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-hero" />
                        )}
                      </div>
                      <div className="p-5">
                        {p.category && (
                          <span className="text-xs font-display font-bold uppercase tracking-widest text-accent">
                            {p.category}
                          </span>
                        )}
                        <h2 className="mt-2 font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                          {p.title}
                        </h2>
                        {p.location && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {p.location}
                            {p.year ? ` · ${p.year}` : ""}
                          </p>
                        )}
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-display font-semibold text-primary">
                          Ver projeto
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}