import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { CATEGORIES, type Category } from "@/lib/categories";
import { useLocation } from "@/hooks/useLocation";

export const Route = createFileRoute("/_app/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { coords, loading: geoLoading, isFallback } = useLocation();
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
        filter_category: category,
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
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur safe-top">
        <div className="px-5 pb-3 pt-4">
          <h1 className="text-2xl">Tareas cerca</h1>
          {isFallback && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Mostrando Madrid centro · activa ubicación para ver tareas a tu alrededor
            </p>
          )}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca paseos, recados, mudanzas..."
            className="mt-3 w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            Todas
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              active={category === c.value}
              onClick={() => setCategory(c.value)}
              color={c.colorVar}
            >
              {c.emoji} {c.label}
            </FilterChip>
          ))}
        </div>
      </header>

      <main className="space-y-3 px-5 pt-2">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {loading && <FeedSkeleton />}
        {!loading && filtered.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-3 text-5xl">🔍</div>
            <p className="text-base font-semibold">No hay tareas en tu zona</p>
            <p className="mt-1 text-sm text-muted-foreground">¡Sé el primero en publicar una!</p>
          </div>
        )}
        {!loading && filtered.map((t) => <TaskCard key={t.id} task={t} />)}
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground"
      }`}
      style={active && color ? { backgroundColor: color, borderColor: "transparent" } : undefined}
    >
      {children}
    </button>
  );
}

function FeedSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-card p-4 shadow-card">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </>
  );
}
