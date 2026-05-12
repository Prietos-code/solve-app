import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/components/UserAvatar";
import type { TaskStatus } from "@/lib/categories";

export type ConversationPreview = {
  task: {
    id: string;
    title: string;
    status: TaskStatus;
  };
  otherUser: Profile;
  lastMessage: {
    content: string;
    created_at: string;
  } | null;
};

export async function fetchConversations(userId: string): Promise<ConversationPreview[]> {
  // Get tasks where user is participant and has a collaborator (status != OPEN)
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `id, title, status,
       publisher:publisher_id ( id, name, avatar_url ),
       collaborator:collaborator_id ( id, name, avatar_url )`,
    )
    .or(`publisher_id.eq.${userId},collaborator_id.eq.${userId}`)
    .not("collaborator_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error || !tasks) return [];

  // Fetch last message for each task in parallel
  const withMessages = await Promise.all(
    tasks.map(async (t: any) => {
      const otherUser = t.publisher_id === userId ? t.collaborator : t.publisher;
      if (!otherUser) return null;

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("task_id", t.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        task: { id: t.id, title: t.title, status: t.status },
        otherUser: {
          id: otherUser.id,
          name: otherUser.name ?? "Usuario",
          avatar_url: otherUser.avatar_url ?? null,
        },
        lastMessage: lastMsg ?? null,
      };
    }),
  );

  return withMessages.filter((c): c is ConversationPreview => c !== null);
}
