import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold font-display text-foreground">
          Área Administrativa
        </h1>
        <p className="text-sm text-muted-foreground">
          Sistema de gestão e CRM — Dimensão Coberturas
        </p>
        <div className="rounded-lg border border-border bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">
            Em desenvolvimento
          </p>
        </div>
        <a
          href="/"
          className="inline-block text-sm text-primary hover:underline"
        >
          Voltar para o site
        </a>
      </div>
    </div>
  );
}
