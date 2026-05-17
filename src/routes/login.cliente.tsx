import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Construction } from "lucide-react";
import logoHorizontal from "@/assets/logo-horizontal.png";

export const Route = createFileRoute("/login/cliente")({
  head: () => ({ meta: [{ title: "Acesso de Cliente — Dimensão" }] }),
  component: ClientLogin,
});

function ClientLogin() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero text-deep-foreground px-4 py-10">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-accent transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <img src={logoHorizontal} alt="Dimensão Coberturas" className="h-12 w-auto mx-auto bg-white/95 px-4 py-2 rounded-md" />
          <div className="mt-8 rounded-xl border border-white/15 bg-white/5 backdrop-blur p-8">
            <div className="h-14 w-14 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto">
              <Construction className="h-7 w-7" />
            </div>
            <h1 className="mt-6 font-display font-bold text-2xl">Área do Cliente</h1>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              Estamos preparando uma área exclusiva para você acompanhar projetos,
              documentos e o andamento das obras. Em breve.
            </p>
            <Link to="/" className="mt-6 inline-block text-sm font-display font-semibold uppercase tracking-wider text-accent hover:underline">
              Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}