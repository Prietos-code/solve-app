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
import { ConversationCard } from "@/components/ConversationCard";
import { fetchConversations, type ConversationPreview } from "@/lib/conversations";

export const Route = createFileRoute("/_app/my-tasks")({
  component: MyTasksPage,
});

type Tab = "published" | "accepted" | "conversations";

interface Row extends TaskCardData {
  status: TaskStatus;
}

function MyTasksPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("published");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

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

  useEffect(() => {
    if (tab !== "conversations" || !user) return;
    let active = true;
    setLoadingConversations(true);
    fetchConversations(user.id).then((data) => {
      if (!active) return;
      setConversations(data);
      setLoadingConversations(false);
    });
    return () => {
      active = false;
    };
  }, [user, tab]);

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="eyebrow">Tu actividad</p>
      <h1 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-primary">
        Mis tareas
      </h1>

      <div className="mt-6 grid grid-cols-3 rounded-xl border border-border bg-paper-warm p-1">
        <TabBtn active={tab === "published"} onClick={() => setTab("published")}>
          Como publicador
        </TabBtn>
        <TabBtn active={tab === "accepted"} onClick={() => setTab("accepted")}>
          Como colaborador
        </TabBtn>
        <TabBtn active={tab === "conversations"} onClick={() => setTab("conversations")}>
          Chat
        </TabBtn>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-oak-soft">Cargando...</p>}
        {!loading && rows.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-paper-warm text-oak-soft">
              <Inbox size={26} strokeWidth={1.8} />
            </div>
            <p className="font-serif text-xl text-primary">
              {tab === "published" ? "Sin publicaciones" : "Sin tareas aceptadas"}
            </p>
            <p className="mt-1 text-sm text-oak-soft">
              {tab === "published"
                ? "Publica tu primera tarea y deja que el barrio te ayude."
                : "Explora tareas cerca de ti y empieza a colaborar."}
            </p>
            {tab === "published" && (
              <Link
                to="/publish"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-elevated"
              >
                <Plus size={14} strokeWidth={2.5} />
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
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all hover:border-oak-soft/40 hover:shadow-card"
              >
                <Link to="/task/$id" params={{ id: t.id }} className="flex min-w-0 flex-1 items-center gap-3">
                  {t.image_url ? (
                    <img src={t.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-paper-warm text-oak-soft">
                      <ImageIcon size={22} strokeWidth={1.8} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <CategoryBadge category={t.category} />
                      <StatusBadge status={t.status} />
                    </div>
                    <h3 className="mt-1 line-clamp-1 font-serif text-base font-semibold text-primary">
                      {t.title}
                    </h3>
                    <div className="mt-0.5 flex items-center justify-between text-[11px] text-oak-soft">
                      <span>{timeAgo(t.created_at)}</span>
                      <span className="font-serif text-base font-semibold tabular-nums text-primary">
                        {formatPrice(t.price)}
                      </span>
                    </div>
                  </div>
                </Link>
                {chatActive && (
                  <Link
                    to="/chat/$id"
                    params={{ id: t.id }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated"
                    aria-label="Abrir chat"
                  >
                    <MessageCircle size={17} />
                  </Link>
                )}
              </div>
            );
          })}
      </div>

      {tab === "conversations" && (
        <div className="mt-6 space-y-3">
          {loadingConversations && <p className="text-sm text-oak-soft">Cargando...</p>}
          {!loadingConversations && conversations.length === 0 && (
            <div className="mt-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-paper-warm text-oak-soft">
                <MessageCircle size={26} strokeWidth={1.8} />
              </div>
              <p className="font-serif text-xl text-primary">Sin conversaciones</p>
              <p className="mt-1 text-sm text-oak-soft">
                Cuando aceptes o publiques una tarea, aparecerá aquí el chat.
              </p>
            </div>
          )}
          {!loadingConversations &&
            conversations.map((c) => (
              <ConversationCard key={c.task.id} conversation={c} />
            ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
        active ? "bg-primary text-primary-foreground shadow-sharp" : "text-oak-soft hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
