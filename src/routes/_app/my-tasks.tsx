import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, Image as ImageIcon, Plus, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { type TaskCardData } from "@/components/TaskCard";
import { StatusBadge } from "@/components/StatusBadge";
import type { TaskStatus } from "@/lib/categories";
import { Link } from "@tanstack/react-router";
import { formatPrice, timeAgo } from "@/lib/format";
import { CategoryBadge } from "@/components/CategoryBadge";

export const Route = createFileRoute("/_app/my-tasks")({
  component: MyTasksPage,
});

type Tab = "published" | "accepted";

interface Row extends TaskCardData {
  status: TaskStatus;
}

function MyTasksPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("published");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const column = tab === "published" ? "publisher_id" : "collaborator_id";
    supabase
      .from("tasks")
      .select(
        `id, title, price, category, status, image_url, created_at,
         publisher:publisher_id ( name, avatar_url )`,
      )
      .eq(column, user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setRows([]);
        } else {
          setRows(
            data.map((t: any) => ({
              id: t.id,
              title: t.title,
              price: Number(t.price),
              category: t.category,
              status: t.status,
              image_url: t.image_url,
              publisher_name: t.publisher?.name ?? null,
              publisher_avatar: t.publisher?.avatar_url ?? null,
              created_at: t.created_at,
            })),
          );
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, tab]);

  return (
    <div className="px-5 pb-8 pt-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tu actividad</p>
      <h1 className="mt-0.5 text-[28px] leading-tight">Mis tareas</h1>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-card p-1 shadow-card">
        <TabBtn active={tab === "published"} onClick={() => setTab("published")}>
          Mis publicaciones
        </TabBtn>
        <TabBtn active={tab === "accepted"} onClick={() => setTab("accepted")}>
          Aceptadas
        </TabBtn>
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {!loading && rows.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox size={28} />
            </div>
            <p className="text-sm text-muted-foreground">
              {tab === "published" ? "Aún no has publicado tareas." : "Aún no has aceptado ninguna tarea."}
            </p>
            {tab === "published" && (
              <Link
                to="/publish"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevated"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Publicar primera tarea
              </Link>
            )}
          </div>
        )}
        {!loading &&
          rows.map((t) => {
            const chatActive = t.status === "ACCEPTED" || t.status === "IN_PROGRESS";
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card transition-transform active:scale-[0.99]"
              >
                <Link to="/task/$id" params={{ id: t.id }} className="flex min-w-0 flex-1 items-center gap-3">
                  {t.image_url ? (
                    <img src={t.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <CategoryBadge category={t.category} />
                      <StatusBadge status={t.status} />
                    </div>
                    <h3 className="mt-1 line-clamp-1 text-sm font-semibold">{t.title}</h3>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{timeAgo(t.created_at)}</span>
                      <span className="font-bold text-primary">{formatPrice(t.price)}</span>
                    </div>
                  </div>
                </Link>
                {chatActive && (
                  <Link
                    to="/chat/$id"
                    params={{ id: t.id }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-elevated"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                    aria-label="Abrir chat"
                  >
                    <MessageCircle size={18} />
                  </Link>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
