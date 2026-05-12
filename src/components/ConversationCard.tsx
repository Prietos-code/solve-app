import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import type { ConversationPreview } from "@/lib/conversations";

function timeAgo(iso: string) {
  const now = Date.now();
  const d = new Date(iso).getTime();
  const diff = now - d;
  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function ConversationCard({ conversation }: { conversation: ConversationPreview }) {
  const { otherUser, lastMessage } = conversation;

  return (
    <Link
      to="/chat/$id"
      params={{ id: conversation.task.id }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-oak-soft/40 hover:shadow-card active:scale-[0.99]"
    >
      <UserAvatar name={otherUser.name} url={otherUser.avatar_url} size={48} />
      <div className="min-w-0 flex-1">
        <span className="truncate font-serif text-base font-semibold text-primary">{otherUser.name}</span>
        {lastMessage ? (
          <p className="mt-0.5 truncate text-sm text-oak-soft">{lastMessage.content}</p>
        ) : (
          <p className="mt-0.5 italic text-sm text-oak-soft/60">Sin mensajes aún</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <MessageCircle size={18} className="text-primary" />
        {lastMessage && (
          <span className="text-[10px] text-oak-soft">{timeAgo(lastMessage.created_at)}</span>
        )}
      </div>
    </Link>
  );
}
