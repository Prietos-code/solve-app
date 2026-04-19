import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    const { error } = await supabase.auth.signUp({
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
    navigate({ to: "/feed" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-elevated">
            🤝
          </div>
          <h1 className="text-3xl">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Empieza a publicar y aceptar tareas</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              placeholder="María"
              maxLength={60}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground shadow-elevated disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Entra
          </Link>
        </p>
      </div>
    </div>
  );
}
