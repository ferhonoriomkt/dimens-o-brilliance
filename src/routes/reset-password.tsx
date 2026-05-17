import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import logoHorizontal from "@/assets/logo-horizontal.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — Dimensão" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Supabase processa o hash de recovery automaticamente e cria uma sessão temporária.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error("Falha ao redefinir senha: " + error.message);
      return;
    }
    await supabase.auth.signOut();
    toast.success("Senha redefinida. Faça login novamente.");
    navigate({ to: "/login/membro" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero text-deep-foreground px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logoHorizontal}
            alt="Dimensão Coberturas"
            className="h-12 w-auto mx-auto bg-white/95 px-4 py-2 rounded-md"
          />
          <h1 className="mt-6 font-display font-bold text-2xl md:text-3xl">Redefinir senha</h1>
          <p className="mt-2 text-sm text-white/70">Defina uma nova senha para sua conta.</p>
        </div>

        {!ready ? (
          <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur p-6 text-center text-sm text-white/80 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Validando link de redefinição…
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/15 bg-white/5 backdrop-blur p-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Nova senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-white">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar nova senha
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}