-- Messages table for task-scoped chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_task_created ON public.messages (task_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper: is user a participant of the task?
CREATE OR REPLACE FUNCTION public.is_task_participant(_task_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = _task_id
      AND t.status IN ('ACCEPTED','IN_PROGRESS','COMPLETED','DISPUTED')
      AND (t.publisher_id = _user_id OR t.collaborator_id = _user_id)
  );
$$;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_task_participant(task_id, auth.uid()));

CREATE POLICY "Participants can send messages as themselves"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_task_participant(task_id, auth.uid())
);

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;