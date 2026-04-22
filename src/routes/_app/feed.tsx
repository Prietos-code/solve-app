import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Inbox } from "lucide-react";
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
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl safe-top">
        <div className="px-5 pb-4 pt-7">
          <p className="eyebrow">Próximo a ti</p>
          <h1 className="mt-1 font-serif text-[34px] font-semibold leading-[1.05] tracking-tight text-primary">
            {firstName ? `Buenos días,` : "Bienvenido,"}{" "}
            <span className="italic text-oak-soft">{firstName || "vecino"}</span>
          </h1>

          <div className="mt-3 flex items-center gap-2 text-xs text-oak-soft">
            <MapPin size={13} strokeWidth={2.2} />
            <span className="font-medium">
              {isFallback ? "Madrid · activa la ubicación" : "Tu ubicación"}
            </span>
            <span className="size-1 rounded-full bg-stone" />
            <button className="underline underline-offset-4 decoration-stone">Cambiar</button>
          </div>

          <div className="relative mt-5">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-oak-soft/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="¿En qué podemos ayudarte hoy?"
              className="w-full rounded-xl border border-input bg-paper-warm py-3.5 pl-11 pr-4 text-sm text-primary placeholder:text-oak-soft/60 outline-none transition-all focus:border-primary focus:bg-card"
            />
          </div>
        </div>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-5 pb-4">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            Todos
          </FilterChip>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <FilterChip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
              >
                <Icon size={12} strokeWidth={2.4} />
                {c.label}
              </FilterChip>
            );
          })}
        </div>
      </header>

      <main className="space-y-4 px-5 pb-6 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold text-primary">
            Tareas recientes
          </h2>
          <span className="eyebrow">{filtered.length} cerca</span>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading && <FeedSkeleton />}
        {!loading && filtered.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-paper-warm text-oak-soft">
              <Inbox size={26} strokeWidth={1.8} />
            </div>
            <p className="font-serif text-xl text-primary">No hay tareas en tu zona</p>
            <p className="mt-1 text-sm text-oak-soft">Sé el primero en publicar una.</p>
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
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-sharp"
          : "border-border bg-paper-warm text-oak-soft hover:border-oak-soft/40 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function FeedSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-5">
          <div className="h-3 w-20 rounded bg-paper-warm" />
          <div className="mt-3 h-5 w-3/4 rounded bg-paper-warm" />
          <div className="mt-2 h-4 w-1/2 rounded bg-paper-warm" />
          <div className="mt-5 h-8 rounded bg-paper-warm" />
        </div>
      ))}
    </>
  );
}
