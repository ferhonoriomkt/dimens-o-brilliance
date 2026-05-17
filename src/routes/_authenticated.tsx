import { createFileRoute, Outlet, Navigate, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import logoHorizontal from "@/assets/logo-horizontal.png";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, isAdmin, loading, rolesLoading, signOut, user } = useAuth();
  const navigate = useNavigate();

  if (loading || (session && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login/membro" />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display font-bold text-2xl">Acesso negado</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta não possui permissão de membro.
          </p>
          <Button onClick={async () => { await signOut(); navigate({ to: "/login" }); }}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-deep text-deep-foreground border-b border-white/10">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <img src={logoHorizontal} alt="Dimensão" className="h-8 w-auto bg-white/95 px-2 py-1 rounded" />
            <span className="font-display font-bold uppercase tracking-wider text-sm hidden sm:inline">Painel</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/admin" className="text-sm font-display font-semibold hover:text-accent transition-colors">Início</Link>
            <Link to="/admin/portfolio" className="text-sm font-display font-semibold hover:text-accent transition-colors">Portfólio</Link>
            <Link to="/admin/usuarios" className="text-sm font-display font-semibold hover:text-accent transition-colors">Usuários</Link>
            <span className="text-xs text-white/60 hidden md:inline">{user?.email}</span>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 md:px-8 py-8"><Outlet /></main>
    </div>
  );
}