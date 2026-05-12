import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import type { TaskStatus } from "@/lib/categories";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_app/chat/$id")({
  component: ChatPage,
});

// Mock data for demo — remove when real data exists
const MOCK_CHATS: Record<string, { task: TaskInfo; messages: Message[] }> = {
  "mock-task-1": {
    task: {
      id: "mock-task-1",
      title: "Pasear perro Golden Retriever",
      description: "Busco a alguien que pueda pasear a mi Golden Retriever Max los fines de semana. Son 2 horas cada día, preferiría por la mañana temprano.",
      category: "mascotas",
      status: "IN_PROGRESS",
      price: 25,
      address: "Calle Fuencarral 45, Madrid",
      image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
      publisher_id: "mock-user-1",
      collaborator_id: "current-user",
      publisher: { id: "mock-user-1", name: "María García", avatar_url: "https://i.pravatar.cc/150?img=47" },
      collaborator: { id: "current-user", name: "Tú", avatar_url: null },
    },
    messages: [
      { id: "m1", task_id: "mock-task-1", sender_id: "mock-user-1", content: "Hola! Vi tu solicitud para pasear a Max. ¿Estás disponible este sábado?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: "m2", task_id: "mock-task-1", sender_id: "current-user", content: "Hola María! Sí, estoy disponible. ¿A qué hora te vendría bien?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString() },
      { id: "m3", task_id: "mock-task-1", sender_id: "mock-user-1", content: "Perfecto! A las 9am sería ideal. Max es muy tranquilo, no suele dar problemas.", created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: "m4", task_id: "mock-task-1", sender_id: "mock-user-1", content: "Hola! Estoy disponible para pasear a Max este sábado por la mañana", created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    ],
  },
  "mock-task-2": {
    task: {
      id: "mock-task-2",
      title: "Clase de guitarra para principiantes",
      description: "Quiero aprender a tocar la guitarra desde cero. Busco a alguien paciente que pueda darme clases semanales.",
      category: "clases",
      status: "ACCEPTED",
      price: 30,
      address: "Plaza Mayor, Madrid",
      image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400",
      publisher_id: "mock-user-2",
      collaborator_id: "current-user",
      publisher: { id: "mock-user-2", name: "Carlos Ruiz", avatar_url: "https://i.pravatar.cc/150?img=12" },
      collaborator: { id: "current-user", name: "Tú", avatar_url: null },
    },
    messages: [
      { id: "m5", task_id: "mock-task-2", sender_id: "mock-user-2", content: "¡Hola! Tengo experiencia enseñando a principiantes. ¿Qué tipo de música te gusta?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { id: "m6", task_id: "mock-task-2", sender_id: "current-user", content: "Me gusta el rock clásico y algo de flamenco. ¿Cuántas horas crees que necesitaría para aprender lo básico?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
      { id: "m7", task_id: "mock-task-2", sender_id: "mock-user-2", content: "Perfecto, nos vemos el jueves a las 5pm", created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    ],
  },
  "mock-task-3": {
    task: {
      id: "mock-task-3",
      title: "Ayuda mudanza piso en Chamberí",
      description: "Me mudo el próximo fin de semana y necesito ayuda para mover cajas pesadas y muebles.",
      category: "mudanzas",
      status: "IN_PROGRESS",
      price: 80,
      address: "Calle Bretón de los Herreros, Madrid",
      image_url: "https://images.unsplash.com/photo-1549969733-3a3051a6fc8a?w=400",
      publisher_id: "mock-user-3",
      collaborator_id: "current-user",
      publisher: { id: "mock-user-3", name: "Laura Martín", avatar_url: "https://i.pravatar.cc/150?img=23" },
      collaborator: { id: "current-user", name: "Tú", avatar_url: null },
    },
    messages: [
      { id: "m8", task_id: "mock-task-3", sender_id: "mock-user-3", content: "¡Hola! Vi que te interesa ayudar con la mudanza. ¿Tienes experiencia moviendo muebles pesados?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
      { id: "m9", task_id: "mock-task-3", sender_id: "current-user", content: "Sí, puedo ayudarte con los muebles pesados", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ],
  },
};

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
  description: string;
  category: string;
  status: TaskStatus;
  price: number;
  address: string | null;
  image_url: string | null;
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
  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load task + initial messages
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Check mock data first
    if (id.startsWith("mock-task-")) {
      const mock = MOCK_CHATS[id];
      if (mock) {
        setTask(mock.task);
        setMessages(mock.messages);
        setLoading(false);
        return;
      }
    }

    (async () => {
      const { data: t, error: tErr } = await supabase
        .from("tasks")
        .select(
          `id, title, description, category, status, price, address, publisher_id, collaborator_id,
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
    if (!content || sending) return;
    setSending(true);
    setError(null);

    // For mock data, just add locally
    if (id.startsWith("mock-task-")) {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        task_id: id,
        sender_id: "current-user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setSending(false);
      setText("");
      return;
    }

    const { error } = await supabase
      .from("messages")
      .insert({ task_id: id, sender_id: user?.id, content });
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

  const isParticipant = user?.id === task.publisher_id || user?.id === task.collaborator_id || id.startsWith("mock-task-");
  const otherUser = id.startsWith("mock-task-")
    ? task.publisher
    : user?.id === task.publisher_id
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
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{otherUser?.name ?? "Usuario"}</div>
          <div className="truncate text-xs text-muted-foreground">{task.title}</div>
        </div>
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label={showDetails ? "Ocultar detalles" : "Ver detalles"}
        >
          {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <StatusBadge status={task.status} />
      </header>

      {/* Task details panel */}
      {showDetails && (
        <div className="border-b border-border bg-card px-4 py-4">
          <div className="flex items-start gap-3">
            {task.image_url && (
              <img src={task.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={task.category as any} />
                <span className="font-serif text-xl font-semibold text-primary">{formatPrice(task.price)}</span>
              </div>
              <p className="mt-1 text-sm text-oak-soft">{task.description}</p>
              {task.address && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  <span>{task.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            Aún no hay mensajes. Saluda para empezar la conversación.
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m, i) => {
              const mine = m.sender_id === user?.id || (id.startsWith("mock-task-") && m.sender_id === "current-user");
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
