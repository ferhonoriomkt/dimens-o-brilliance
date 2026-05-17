import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import logoHorizontal from "@/assets/logo-horizontal.png";

export const Route = createFileRoute("/login/membro")({
  head: () => ({ meta: [{ title: "Acesso de Membro — Dimensão" }] }),
  component: MemberLogin,
});

function MemberLogin() {
  const navigate = useNavigate();
  const { session, isAdmin, loading, rolesLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!loading && !rolesLoading && session && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, rolesLoading, session, isAdmin, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error("Falha no login: " + error.message);
      return;
    }
    toast.success("Bem-vindo!");
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login/membro",
    });
    if (result.error) toast.error("Falha ao entrar com Google");
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setResetting(false);
    if (error) {
      toast.error("Falha ao enviar e-mail: " + error.message);
      return;
    }
    toast.success("Enviamos um link de redefinição para o seu e-mail.");
    setShowReset(false);
  };

  const sessionReady = !loading && !!session;
  const noRole = sessionReady && !rolesLoading && !isAdmin;
  const redirecting = sessionReady && (rolesLoading || isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero text-deep-foreground px-4 py-10">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-accent transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={logoHorizontal}
              alt="Dimensão Coberturas"
              className="h-12 w-auto mx-auto bg-white/95 px-4 py-2 rounded-md"
            />
            <h1 className="mt-6 font-display font-bold text-2xl md:text-3xl">
              Acesso de Membro
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Painel administrativo e CRM da Dimensão.
            </p>
          </div>

          {noRole && (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
              Você está autenticado mas não possui permissão de membro.
              Contate o administrador.
            </div>
          )}
          {redirecting && (
            <div className="mb-6 rounded-lg border border-white/20 bg-white/5 p-4 text-sm text-white/80 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Entrando…
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/15 bg-white/5 backdrop-blur p-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <button
              type="button"
              onClick={() => { setShowReset((v) => !v); setResetEmail(email); }}
              className="block w-full text-center text-xs text-white/70 hover:text-accent transition-colors"
            >
              Esqueci minha senha
            </button>

            {showReset && (
              <div className="rounded-lg border border-white/15 bg-white/5 p-4 space-y-3">
                <Label htmlFor="reset-email" className="text-white text-xs uppercase tracking-wider">
                  E-mail para redefinição
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting || !resetEmail}
                  variant="outline"
                  className="w-full bg-white text-foreground hover:bg-white/90"
                >
                  {resetting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar link de redefinição
                </Button>
              </div>
            )}

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-deep/0 px-2 text-white/60">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              className="w-full bg-white text-foreground hover:bg-white/90"
            >
              Entrar com Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}