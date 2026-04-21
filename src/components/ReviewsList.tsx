import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";
import { timeAgo } from "@/lib/format";

interface Review {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  rater: { id: string; name: string; avatar_url: string | null } | null;
}

export function ReviewsList({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    supabase
      .from("ratings")
      .select(
        `id, score, comment, created_at,
         rater:rater_id ( id, name, avatar_url )`,
      )
      .eq("rated_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setReviews((data as any) ?? []);
      });
  }, [userId]);

  if (reviews === null) {
    return <div className="text-sm text-muted-foreground">Cargando valoraciones...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center shadow-card">
        <MessageSquare size={28} className="text-muted-foreground/50" strokeWidth={1.6} />
        <p className="text-sm text-muted-foreground">Aún no tienes valoraciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <UserAvatar name={r.rater?.name ?? "?"} url={r.rater?.avatar_url ?? null} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{r.rater?.name ?? "Usuario"}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(r.created_at)}</span>
              </div>
              <div className="mt-0.5 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    strokeWidth={2}
                    className={i < r.score ? "fill-warning text-warning" : "text-muted-foreground/25"}
                  />
                ))}
              </div>
              {r.comment && <p className="mt-2 text-sm leading-relaxed text-foreground">{r.comment}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
