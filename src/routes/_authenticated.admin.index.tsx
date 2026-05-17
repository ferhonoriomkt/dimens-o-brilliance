import { createFileRoute, Link } from "@tanstack/react-router";
import { Images, Briefcase, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-foreground">Painel Administrativo</h1>
      <p className="mt-2 text-muted-foreground">Gerencie o conteúdo da Dimensão Coberturas.</p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link to="/admin/portfolio" className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Images className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display font-bold text-lg group-hover:text-primary transition-colors">Portfólio</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastrar e editar projetos exibidos no site.</p>
        </Link>

        <Link to="/admin/usuarios" className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display font-bold text-lg group-hover:text-primary transition-colors">Usuários</h2>
          <p className="mt-1 text-sm text-muted-foreground">Promova ou rebaixe membros e clientes do sistema.</p>
        </Link>

        <Link to="/admin/crm" className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display font-bold text-lg group-hover:text-primary transition-colors">CRM de Obras</h2>
          <p className="mt-1 text-sm text-muted-foreground">Planeje obras, projetos, fases, serviços e matéria-prima.</p>
        </Link>
      </div>
    </div>
  );
}