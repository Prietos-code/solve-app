import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import type { TaskStatus } from "@/lib/categories";

export const Route = createFileRoute("/_app/chat/$id")({
  component: ChatPage,
});

interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface TaskInfo {
  id: string;
  title: string;
  status: TaskStatus;
  publisher_id: string;
  collaborator_id: string | null;
  publisher: { id: string; name: string; avatar_url: string | null };
  collaborator: { id: string; name: string; avatar_url: string | null } | null;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function ChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load task + initial messages
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: t, error: tErr } = await supabase
        .from("tasks")
        .select(
          `id, title, status, publisher_id, collaborator_id,
           publisher:publisher_id ( id, name, avatar_url ),
           collaborator:collaborator_id ( id, name, avatar_url )`,
        )
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (tErr || !t) {
        setError("No se pudo cargar la conversación.");
        setLoading(false);
        return;
      }

      setTask(t as any);

      const { data: msgs, error: mErr } = await supabase
        .from("messages")
        .select("id, task_id, sender_id, content, created_at")
        .eq("task_id", id)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (mErr) setError(mErr.message);
      else setMessages((msgs ?? []) as Message[]);

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `task_id=eq.${id}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || !user || sending) return;
    setSending(true);
    setError(null);
    const { error } = await supabase
      .from("messages")
      .insert({ task_id: id, sender_id: user.id, content });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setText("");
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando conversación...</div>;
  }
  if (error || !task) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Link to="/my-tasks" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft size={14} /> Volver
        </Link>
      </div>
    );
  }

  const isParticipant = user?.id === task.publisher_id || user?.id === task.collaborator_id;
  const otherUser =
    user?.id === task.publisher_id
      ? task.collaborator
      : user?.id === task.collaborator_id
        ? task.publisher
        : null;

  if (!isParticipant) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">No formas parte de esta conversación.</p>
        <Link to="/my-tasks" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft size={14} /> Volver
        </Link>
      </div>
    );
  }

  const canSend = task.status === "ACCEPTED" || task.status === "IN_PROGRESS";

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/my-tasks" })}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <UserAvatar name={otherUser?.name} url={otherUser?.avatar_url} size={38} />
        <Link to="/task/$id" params={{ id: task.id }} className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{otherUser?.name ?? "Usuario"}</div>
          <div className="truncate text-xs text-muted-foreground">{task.title}</div>
        </Link>
        <StatusBadge status={task.status} />
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            Aún no hay mensajes. Saluda para empezar la conversación.
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m, i) => {
              const mine = m.sender_id === user?.id;
              const prev = messages[i - 1];
              const showTime = !prev || new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
              return (
                <div key={m.id}>
                  {showTime && (
                    <div className="my-3 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                      {formatTime(m.created_at)}
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug shadow-sm ${
                        mine
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-card text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && <div className="mb-2 text-xs text-destructive">{error}</div>}
        {!canSend ? (
          <div className="rounded-xl bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
            {task.status === "COMPLETED"
              ? "Esta tarea está completada. La conversación es solo de lectura."
              : "El chat se activará cuando la tarea sea aceptada."}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="max-h-32 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-primary"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground shadow-elevated transition-transform active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
              aria-label="Enviar"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
