import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message);
      return;
    }
    navigate({ to: "/feed" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Logo size={42} tone="light" />
          </div>
          <p className="eyebrow mb-2">Marketplace de barrio</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight">HelpApp</h1>
          <div className="ornament-rule mx-auto mt-4 text-[10px] font-semibold uppercase tracking-[0.2em]">
            Bienvenido
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="eyebrow mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:bg-card"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="eyebrow mb-1.5 block">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:bg-card"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold tracking-wide text-primary-foreground shadow-elevated transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-oak-soft">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-serif text-base font-semibold text-primary underline underline-offset-4 decoration-stone">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
