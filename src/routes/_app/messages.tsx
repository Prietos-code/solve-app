import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConversationCard } from "@/components/ConversationCard";
import { fetchConversations, type ConversationPreview } from "@/lib/conversations";

export const Route = createFileRoute("/_app/messages")({
  component: MessagesPage,
});

// Mock data for demo — remove when real data exists
const MOCK_CONVERSATIONS: ConversationPreview[] = [
  {
    task: {
      id: "mock-task-1",
      title: "Pasear perro Golden Retriever",
      status: "IN_PROGRESS",
    },
    otherUser: {
      id: "mock-user-1",
      name: "María García",
      avatar_url: "https://i.pravatar.cc/150?img=47",
    },
    lastMessage: {
      content: "Hola! Estoy disponible para pasear a Max este sábado por la mañana",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    },
  },
  {
    task: {
      id: "mock-task-2",
      title: "Clase de guitarra para principiantes",
      status: "ACCEPTED",
    },
    otherUser: {
      id: "mock-user-2",
      name: "Carlos Ruiz",
      avatar_url: "https://i.pravatar.cc/150?img=12",
    },
    lastMessage: {
      content: "Perfecto, nos vemos el jueves a las 5pm",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    },
  },
  {
    task: {
      id: "mock-task-3",
      title: "Ayuda mudanza piso en Chamberí",
      status: "IN_PROGRESS",
    },
    otherUser: {
      id: "mock-user-3",
      name: "Laura Martín",
      avatar_url: "https://i.pravatar.cc/150?img=23",
    },
    lastMessage: {
      content: "Sí, puedo ayudarte con los muebles pesados",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
  },
];

function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchConversations(user.id).then((data) => {
      if (!active) return;
      // For demo: combine real + mock data if no real conversations
      const allConversations = data.length > 0 ? data : MOCK_CONVERSATIONS;
      setConversations(allConversations);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">Mensajes</p>
        <h1 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-primary">
          Tus conversaciones
        </h1>
      </div>

      {loading && (
        <p className="text-sm text-oak-soft">Cargando...</p>
      )}

      {!loading && conversations.length === 0 && (
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

      {!loading && conversations.length > 0 && (
        <div className="space-y-3">
          {conversations.map((c) => (
            <ConversationCard key={c.task.id} conversation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
