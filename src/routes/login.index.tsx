import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserRound, ArrowLeft } from "lucide-react";
import logoHorizontal from "@/assets/logo-horizontal.png";

export const Route = createFileRoute("/login/")({
  head: () => ({ meta: [{ title: "Acessar — Dimensão Coberturas" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero text-deep-foreground px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-accent transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o site
      </Link>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <img
              src={logoHorizontal}
              alt="Dimensão Coberturas"
              className="h-14 w-auto mx-auto bg-white/95 px-4 py-2 rounded-md"
            />
            <h1 className="mt-8 font-display font-bold text-3xl md:text-4xl">
              Acessar Dimensão
            </h1>
            <p className="mt-3 text-white/70">
              Escolha como deseja entrar no sistema.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Link
              to="/login/membro"
              className="group rounded-xl border border-white/15 bg-white/5 backdrop-blur p-8 text-left transition-all hover:border-accent hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="h-12 w-12 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display font-bold text-xl">Sou Membro</h2>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                Acesso ao sistema.
              </p>
              <span className="mt-5 inline-block text-sm font-display font-semibold uppercase tracking-wider text-accent group-hover:underline">
                Entrar →
              </span>
            </Link>

            <Link
              to="/login/cliente"
              className="group rounded-xl border border-white/15 bg-white/5 backdrop-blur p-8 text-left transition-all hover:border-accent hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="h-12 w-12 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <UserRound className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display font-bold text-xl">Sou Cliente</h2>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                Acompanhe seus projetos, documentos e o andamento da sua obra.
              </p>
              <span className="mt-5 inline-block text-sm font-display font-semibold uppercase tracking-wider text-accent group-hover:underline">
                Entrar →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
