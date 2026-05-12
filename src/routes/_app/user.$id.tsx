import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Star, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { StarRating } from "@/components/StarRating";
import { ReviewsList } from "@/components/ReviewsList";

export const Route = createFileRoute("/_app/user/$id")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const { id } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ completed: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, bio, avatar_url, rating, rating_count")
        .eq("id", id)
        .maybeSingle();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      if (currentUser) {
        const { data: followData } = await supabase
          .from("followers")
          .select("id")
.eq("follower_id", currentUser.id)
        .eq("following_id", id)
        .maybeSingle();
        setIsFollowing(!!followData?.length);
      }

      const [tasksResult, followersResult, followingResult] = await Promise.all([
        supabase
          .from("tasks")
          .select("id")
          .eq("publisher_id", id)
          .eq("status", "COMPLETED"),
        supabase.rpc("get_followers_count", { _user_id: id }),
        supabase.rpc("get_following_count", { _user_id: id }),
      ]);

      setStats({
        completed: tasksResult.data?.length ?? 0,
        followers: followersResult.data ?? 0,
        following: followingResult.data ?? 0,
      });

      setLoading(false);
    }

    loadProfile();
  }, [id, currentUser]);

  const toggleFollow = async () => {
    if (!currentUser || followingLoading) return;
    setFollowingLoading(true);

    if (isFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", id);
      setIsFollowing(false);
      setStats((s) => ({ ...s, followers: s.followers - 1 }));
    } else {
      await supabase
        .from("followers")
        .insert({ follower_id: currentUser.id, following_id: id });
      setIsFollowing(true);
      setStats((s) => ({ ...s, followers: s.followers + 1 }));
    }

    setFollowingLoading(false);
  };

  if (loading) {
    return <div className="p-6 text-sm text-oak-soft">Cargando perfil...</div>;
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-oak-soft">
        Este usuario no existe
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === id;

  return (
    <div className="pb-10">
      <div className="bg-primary px-5 pb-20 pt-10 text-primary-foreground">
        <Link
          to="/feed"
          className="fixed left-4 top-10 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/60">
            Perfil
          </p>
          <img src="/logo_sin_fondo.png" alt="SOLVE" className="mx-auto h-4 w-auto" />
        </div>
      </div>

      <div className="-mt-14 px-5">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full ring-4 ring-background">
            <UserAvatar name={profile.name} url={profile.avatar_url} size={104} />
          </div>

          <h1 className="mt-5 font-serif text-3xl font-semibold leading-tight text-primary">
            {profile.name}
          </h1>

          <div className="mt-3">
            <StarRating rating={profile.rating} count={profile.rating_count} size="md" />
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-xs font-serif text-base italic leading-relaxed text-oak-soft">
              "{profile.bio}"
            </p>
          )}

          {!isOwnProfile && currentUser && (
            <button
              onClick={toggleFollow}
              disabled={followingLoading}
              className={`mt-5 inline-flex items-center gap-1.5 rounded-xl border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                isFollowing
                  ? "border-border bg-card text-primary hover:bg-paper-warm"
                  : "border-transparent bg-primary-foreground text-primary"
              }`}
            >
              <Star size={13} fill={isFollowing ? "none" : "currentColor"} />
              {isFollowing ? "Siguiendo" : "Seguir"}
            </button>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <StatCard label="Tareas" value={String(stats.completed)} />
          <StatCard label="Seguidores" value={String(stats.followers)} />
          <StatCard label="Siguiendo" value={String(stats.following)} />
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-primary">Valoraciones</h2>
            <span className="eyebrow">Recibidas</span>
          </div>
          <ReviewsList userId={profile.id} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <div className="font-serif text-2xl font-semibold leading-none text-primary">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-oak-soft">
        {label}
      </div>
    </div>
  );
}