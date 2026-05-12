import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { CATEGORIES, type Category } from "@/lib/categories";
import { useLocation } from "@/hooks/useLocation";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { user } = useAuth();
  const { coords, loading: geoLoading, isFallback } = useLocation();
  const firstName =
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (geoLoading) return;
    let active = true;
    setLoading(true);
    supabase
      .rpc("tasks_nearby", {
        user_lat: coords.lat,
        user_lng: coords.lng,
        radius_km: 50,
        filter_category: category ?? undefined,
        page_size: 30,
        page_offset: 0,
      })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
          setTasks([]);
        } else {
          setError(null);
          setTasks(
            (data ?? []).map((t: any) => ({
              id: t.id,
              title: t.title,
              price: Number(t.price),
              category: t.category,
              image_url: t.image_url,
              publisher_id: t.publisher_id,
              publisher_name: t.publisher_name,
              publisher_avatar: t.publisher_avatar,
              created_at: t.created_at,
              distance_km: t.distance_km,
            })),
          );
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [coords.lat, coords.lng, geoLoading, category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, search]);

  return (
    <div>
      {/* Category filters - horizontal scroll */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-6">
        <button
          onClick={() => setCategory(null)}
          className={`shrink-0 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
            category === null
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border bg-card text-oak-soft hover:border-primary/40 hover:text-primary"
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                category === c.value
                  ? "border-transparent text-primary-foreground shadow-sm"
                  : "border-border bg-card text-oak-soft hover:border-primary/40 hover:text-primary"
              }`}
              style={category === c.value ? { backgroundColor: c.colorVar } : undefined}
            >
              <Icon size={11} strokeWidth={2.4} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Results header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-primary">
          {filtered.length} tareas disponibles
        </h2>
        {isFallback && (
          <div className="flex items-center gap-1.5 text-xs text-oak-soft/70">
            <MapPin size={12} strokeWidth={2.2} />
            <span className="font-medium">Madrid · </span>
            <button className="font-medium text-primary/70 underline underline-offset-2">Cambiar ubicación</button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-4 gap-6">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-card shadow-md">
              <div className="aspect-[4/3] bg-paper-warm" />
              <div className="p-4">
                <div className="h-3 w-16 rounded-full bg-paper-warm" />
                <div className="mt-3 h-5 w-3/4 rounded bg-paper-warm" />
                <div className="mt-2 h-4 w-1/2 rounded bg-paper-warm" />
                <div className="mt-4 flex items-center justify-between border-t border-paper-warm pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-paper-warm" />
                    <div className="h-3 w-16 rounded bg-paper-warm" />
                  </div>
                  <div className="h-7 w-16 rounded-full bg-paper-warm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-serif text-2xl text-primary">No hay tareas en tu zona</p>
          <p className="mt-2 text-sm text-oak-soft">Sé el primero en publicar una.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-4 gap-6">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}