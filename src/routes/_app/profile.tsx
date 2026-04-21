import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, CheckCircle2, Wallet, LogOut, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { StarRating } from "@/components/StarRating";
import { ReviewsList } from "@/components/ReviewsList";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

interface ProfileData {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  rating: number;
  rating_count: number;
}

interface Stats {
  completed: number;
  totalEarned: number;
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [stats, setStats] = useState<Stats>({ completed: 0, totalEarned: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, name, email, bio, avatar_url, rating, rating_count")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setName(data.name);
          setBio(data.bio ?? "");
        }
      });

    supabase
      .from("tasks")
      .select("price, status")
      .eq("collaborator_id", user.id)
      .eq("status", "COMPLETED")
      .then(({ data }) => {
        if (data) {
          const total = data.reduce((acc, t: any) => acc + Number(t.price) * 0.88, 0);
          setStats({ completed: data.length, totalEarned: total });
        }
      });
  }, [user]);

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    const ext = f.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, f, { contentType: f.type, upsert: true });
    if (upErr) return;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setProfile((p) => (p ? { ...p, avatar_url: url } : p));
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ name: name.trim(), bio: bio.trim() || null })
      .eq("id", user.id);
    setProfile((p) => (p ? { ...p, name: name.trim(), bio: bio.trim() || null } : p));
    setEditing(false);
    setSaving(false);
  };

  const onLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (!profile) return <div className="p-6 text-sm text-muted-foreground">Cargando perfil...</div>;

  return (
    <div className="pb-10">
      {/* Hero gradient header */}
      <div
        className="px-5 pb-16 pt-10"
        style={{
          background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
        }}
      >
        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70">
          Tu perfil
        </p>
      </div>

      <div className="-mt-12 px-5">
        <div className="flex flex-col items-center text-center">
          <label className="relative cursor-pointer">
            <div className="rounded-full ring-4 ring-background">
              <UserAvatar name={profile.name} url={profile.avatar_url} size={96} />
            </div>
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated">
              <Pencil size={14} strokeWidth={2.5} />
            </span>
            <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
          </label>

          {!editing ? (
            <>
              <h1 className="mt-4 text-2xl">{profile.name}</h1>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              <div className="mt-2">
                <StarRating rating={profile.rating} count={profile.rating_count} size="md" />
              </div>
              {profile.bio && <p className="mt-3 max-w-xs text-sm text-muted-foreground">{profile.bio}</p>}
              <button
                onClick={() => setEditing(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                <Pencil size={14} />
                Editar perfil
              </button>
            </>
          ) : (
            <div className="mt-4 w-full max-w-sm space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                placeholder="Nombre"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Cuéntanos algo sobre ti..."
                className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <StatCard
            label="Tareas completadas"
            value={String(stats.completed)}
            Icon={CheckCircle2}
            tint="var(--success)"
          />
          <StatCard
            label="Ganado"
            value={formatPrice(stats.totalEarned)}
            Icon={Wallet}
            tint="var(--primary)"
          />
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Valoraciones recibidas
          </h2>
          <ReviewsList userId={profile.id} />
        </div>

        <div className="mt-8 space-y-2">
          <button
            disabled
            className="flex w-full items-center justify-between rounded-xl bg-card p-4 text-sm shadow-card disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard size={18} />
              </span>
              <span className="font-semibold">Configurar cuenta de cobros</span>
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Fase 3
            </span>
          </button>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-sm font-semibold text-destructive shadow-card transition-colors hover:bg-destructive/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut size={18} />
            </span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  tint,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  tint: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: tint }}
      >
        <Icon size={18} strokeWidth={2.4} />
      </div>
      <div className="mt-3 text-xl font-bold text-primary-dark">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
