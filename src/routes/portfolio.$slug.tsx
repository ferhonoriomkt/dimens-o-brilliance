import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, Tag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AnimatedSection } from "@/components/site/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portfolio/$slug")({
  component: ProjectDetail,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Portfólio Dimensão Coberturas` },
    ],
  }),
});

function ProjectDetail() {
  const { slug } = Route.useParams();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["portfolio", "project", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: images } = useQuery({
    queryKey: ["portfolio", "images", project?.id],
    enabled: !!project?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_images")
        .select("*")
        .eq("project_id", project!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 text-sm font-display font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o portfólio
          </Link>

          {isLoading ? (
            <div className="mt-8 space-y-6">
              <div className="h-12 w-2/3 rounded bg-muted animate-pulse" />
              <div className="aspect-[16/9] rounded-lg bg-muted animate-pulse" />
            </div>
          ) : error || !project ? (
            <p className="mt-8 text-muted-foreground">Projeto não encontrado.</p>
          ) : (
            <>
              <AnimatedSection className="mt-8 max-w-3xl">
                {project.category && (
                  <span className="text-xs font-display font-bold uppercase tracking-[0.3em] text-accent">
                    {project.category}
                  </span>
                )}
                <h1 className="mt-3 font-display font-bold text-3xl md:text-5xl text-foreground">
                  {project.title}
                </h1>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {project.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-accent" /> {project.location}
                    </span>
                  )}
                  {project.year && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-accent" /> {project.year}
                    </span>
                  )}
                  {project.category && (
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-accent" /> {project.category}
                    </span>
                  )}
                </div>
              </AnimatedSection>

              {project.cover_image_url && (
                <AnimatedSection delay={0.1} className="mt-10">
                  <div className="aspect-[16/9] overflow-hidden rounded-lg bg-muted shadow-elevated">
                    <img
                      src={project.cover_image_url}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </AnimatedSection>
              )}

              {project.description && (
                <AnimatedSection delay={0.15} className="mt-10 max-w-3xl">
                  <h2 className="font-display font-bold text-xl text-foreground">
                    Sobre o projeto
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                    {project.description}
                  </p>
                </AnimatedSection>
              )}

              {images && images.length > 0 && (
                <AnimatedSection delay={0.2} className="mt-14">
                  <h2 className="font-display font-bold text-xl text-foreground mb-6">
                    Galeria
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <figure
                        key={img.id}
                        className="overflow-hidden rounded-lg bg-muted shadow-card"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={img.image_url}
                            alt={img.caption || project.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                        {img.caption && (
                          <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                            {img.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                </AnimatedSection>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}