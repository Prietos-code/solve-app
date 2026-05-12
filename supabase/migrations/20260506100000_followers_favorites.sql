-- Followers table: allows users to follow each other
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX idx_followers_follower ON public.followers (follower_id);
CREATE INDEX idx_followers_following ON public.followers (following_id);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Anyone can view followers/following
CREATE POLICY "Anyone can view followers"
  ON public.followers FOR SELECT
  USING (true);

-- Authenticated users can follow/unfollow
CREATE POLICY "Users can follow"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Helper: check if user follows another
CREATE OR REPLACE FUNCTION public.is_following(_follower_id UUID, _following_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.followers
    WHERE follower_id = _follower_id AND following_id = _following_id
  );
$$;

-- Helper: get followers count
CREATE OR REPLACE FUNCTION public.get_followers_count(_user_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.followers WHERE following_id = _user_id;
$$;

-- Helper: get following count
CREATE OR REPLACE FUNCTION public.get_following_count(_user_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.followers WHERE follower_id = _user_id;
$$;

-- Favorites table: allows users to save/bookmark tasks
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

CREATE INDEX idx_favorites_user ON public.favorites (user_id);
CREATE INDEX idx_favorites_task ON public.favorites (task_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Task participants and the user can view favorites
CREATE POLICY "Anyone can view favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can favorite tasks
CREATE POLICY "Users can favorite"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfavorite"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Helper: check if user favorited a task
CREATE OR REPLACE FUNCTION public.is_favorited(_user_id UUID, _task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.favorites
    WHERE user_id = _user_id AND task_id = _task_id
  );
$$;

-- Helper: get favorites count for a task
CREATE OR REPLACE FUNCTION public.get_favorites_count(_task_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.favorites WHERE task_id = _task_id;
$$;