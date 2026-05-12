import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Introduce tu nombre.");
      return;
    }
    setLoading(true);
    const redirectUrl = `${window.location.origin}/feed`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name: name.trim() },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();
      
      if (!existingProfile) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          name: name.trim(),
          email: email,
          rating_avg: 0,
          rating_count: 0,
        });
        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }
    }
    navigate({ to: "/feed" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Logo size={42} tone="light" />
          </div>
          <p className="eyebrow mb-2">Únete al barrio</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight">Crea tu cuenta</h1>
          <p className="mt-3 text-sm text-oak-soft">
            Publica tareas o ayuda a quien lo necesita cerca.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="eyebrow mb-1.5 block">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:bg-card"
              placeholder="María"
              maxLength={60}
            />
          </div>
          <div>
            <label className="eyebrow mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3.5 text-base outline-none transition-all focus:border-primary focus:bg-card"
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
              minLength={6}
              autoComplete="new-password"
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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-oak-soft">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-serif text-base font-semibold text-primary underline underline-offset-4 decoration-stone">
            Entra
          </Link>
        </p>
      </div>
    </div>
  );
}
