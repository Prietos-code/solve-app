import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, CheckCircle2, Wallet, LogOut } from "lucide-react";
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

  if (!profile) return <div className="p-6 text-sm text-oak-soft">Cargando perfil...</div>;

  return (
    <div className="pb-10">
      {/* Hero header — wood-deep with subtle ornament */}
      <div className="bg-primary px-5 pb-20 pt-10 text-primary-foreground">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/60">
            Tu perfil
          </p>
          <div className="ornament-rule mx-auto mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] !text-primary-foreground/50">
            HelpApp
          </div>
        </div>
      </div>

      <div className="-mt-14 px-5">
        <div className="flex flex-col items-center text-center">
          <label className="relative cursor-pointer">
            <div className="rounded-full ring-4 ring-background">
              <UserAvatar name={profile.name} url={profile.avatar_url} size={104} />
            </div>
            <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated ring-2 ring-background">
              <Pencil size={14} strokeWidth={2.5} />
            </span>
            <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
          </label>

          {!editing ? (
            <>
              <h1 className="mt-5 font-serif text-3xl font-semibold leading-tight">{profile.name}</h1>
              <p className="mt-1 text-xs text-oak-soft">{profile.email}</p>
              <div className="mt-3">
                <StarRating rating={profile.rating} count={profile.rating_count} size="md" />
              </div>
              {profile.bio && (
                <p className="mt-4 max-w-xs font-serif text-base italic leading-relaxed text-oak-soft">
                  “{profile.bio}”
                </p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-paper-warm"
              >
                <Pencil size={13} />
                Editar perfil
              </button>
            </>
          ) : (
            <div className="mt-5 w-full max-w-sm space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-input bg-paper-warm px-4 py-3 text-base outline-none focus:border-primary focus:bg-card"
                placeholder="Nombre"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Cuéntanos algo sobre ti..."
                className="w-full resize-none rounded-xl border border-input bg-paper-warm px-4 py-3 text-sm outline-none focus:border-primary focus:bg-card"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-oak-soft"
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
            tint="var(--cat-clases)"
          />
          <StatCard
            label="Ganado"
            value={formatPrice(stats.totalEarned)}
            Icon={Wallet}
            tint="var(--primary)"
          />
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-primary">Valoraciones</h2>
            <span className="eyebrow">Recibidas</span>
          </div>
          <ReviewsList userId={profile.id} />
        </div>

        <div className="mt-10">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5"
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: tint }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="mt-4 font-serif text-3xl font-semibold leading-none text-primary">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-oak-soft">
        {label}
      </div>
    </div>
  );
}
