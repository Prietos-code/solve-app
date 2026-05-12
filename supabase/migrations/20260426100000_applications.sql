-- Applications table: allows multiple candidates to apply to a task (replacing direct accept model)
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id)
);

CREATE INDEX idx_applications_task ON public.applications (task_id);
CREATE INDEX idx_applications_user ON public.applications (user_id);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- View: publisher sees all applicants; applicant sees their own application
CREATE POLICY "Task participants can view applications"
  ON public.applications FOR SELECT
  USING (
    auth.uid() = (SELECT publisher_id FROM public.tasks WHERE id = task_id)
    OR auth.uid() = user_id
  );

-- Only authenticated users can insert (check they own the application)
CREATE POLICY "Users can create their own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own application status (to ACCEPTED/REJECTED)
CREATE POLICY "Task publisher can update application status"
  ON public.applications FOR UPDATE
  USING (
    auth.uid() = (SELECT publisher_id FROM public.tasks WHERE id = task_id)
  );

-- Helper: get application count for a task
CREATE OR REPLACE FUNCTION public.get_application_count(_task_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.applications WHERE task_id = _task_id AND status = 'PENDING';
$$;