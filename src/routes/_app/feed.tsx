import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Inbox } from "lucide-react";
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
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl safe-top">
        <div className="px-5 pb-3 pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tareas cerca
              </p>
              <h1 className="mt-0.5 text-[28px] leading-tight">Descubre y ayuda</h1>
            </div>
          </div>
          {isFallback && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning-foreground">
              <MapPin size={12} />
              Madrid centro · activa ubicación para tu zona
            </div>
          )}
          <div className="relative mt-4">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca paseos, recados, mudanzas..."
              className="w-full rounded-2xl border border-input bg-card py-3 pl-11 pr-4 text-sm shadow-card outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            Todas
          </FilterChip>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <FilterChip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
                color={c.colorVar}
              >
                <Icon size={13} strokeWidth={2.5} />
                {c.label}
              </FilterChip>
            );
          })}
        </div>
      </header>

      <main className="space-y-3 px-5 pt-2">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {loading && <FeedSkeleton />}
        {!loading && filtered.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox size={28} />
            </div>
            <p className="text-base font-semibold">No hay tareas en tu zona</p>
            <p className="mt-1 text-sm text-muted-foreground">Sé el primero en publicar una.</p>
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "border-transparent text-white shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40"
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
