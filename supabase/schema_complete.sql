-- ==============================================
-- SOLVE APP - Complete Database Schema
-- ==============================================

-- ============ ENUMS ============
CREATE TYPE public.task_category AS ENUM ('RECADOS','MASCOTAS','MUDANZAS','CLASES','HOGAR','OTROS');
CREATE TYPE public.task_status AS ENUM ('OPEN','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED','DISPUTED');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  stripe_account_id TEXT,
  rating REAL NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 60),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 5 AND 300),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 5),
  category public.task_category NOT NULL,
  status public.task_status NOT NULL DEFAULT 'OPEN',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  image_url TEXT,
  publisher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_tasks_publisher ON public.tasks(publisher_id);
CREATE INDEX idx_tasks_collaborator ON public.tasks(collaborator_id);
CREATE INDEX idx_tasks_geo ON public.tasks(latitude, longitude);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View open tasks or own tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    status = 'OPEN'
    OR publisher_id = auth.uid()
    OR collaborator_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create tasks as themselves"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (publisher_id = auth.uid());

CREATE POLICY "Publisher can update own task"
  ON public.tasks FOR UPDATE TO authenticated
  USING (publisher_id = auth.uid())
  WITH CHECK (publisher_id = auth.uid());

CREATE POLICY "Collaborator can update accepted task"
  ON public.tasks FOR UPDATE TO authenticated
  USING (collaborator_id = auth.uid())
  WITH CHECK (collaborator_id = auth.uid());

CREATE POLICY "Publisher can delete own task while open"
  ON public.tasks FOR DELETE TO authenticated
  USING (publisher_id = auth.uid() AND status = 'OPEN');

-- ============ RATINGS ============
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 500),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, rater_id)
);

CREATE INDEX idx_ratings_rated ON public.ratings(rated_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by authenticated users"
  ON public.ratings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Participants can create ratings on completed tasks"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (
    rater_id = auth.uid()
    AND rater_id <> rated_id
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.status = 'COMPLETED'
        AND (
          (t.publisher_id = auth.uid() AND t.collaborator_id = rated_id)
          OR (t.collaborator_id = auth.uid() AND t.publisher_id = rated_id)
        )
    )
  );

-- ============ MESSAGES ============
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
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
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

-- Realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============ APPLICATIONS ============
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

CREATE POLICY "Task participants can view applications"
  ON public.applications FOR SELECT
  USING (
    auth.uid() = (SELECT publisher_id FROM public.tasks WHERE id = task_id)
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can create their own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Task publisher can update application status"
  ON public.applications FOR UPDATE
  USING (
    auth.uid() = (SELECT publisher_id FROM public.tasks WHERE id = task_id)
  );

CREATE OR REPLACE FUNCTION public.get_application_count(_task_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.applications WHERE task_id = _task_id AND status = 'PENDING';
$$;

-- ============ FOLLOWERS ============
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

CREATE POLICY "Anyone can view followers"
  ON public.followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

CREATE OR REPLACE FUNCTION public.get_followers_count(_user_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.followers WHERE following_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_following_count(_user_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.followers WHERE follower_id = _user_id;
$$;

-- ============ FAVORITES ============
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

CREATE POLICY "Anyone can view favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can favorite"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfavorite"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_favorites_count(_task_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM public.favorites WHERE task_id = _task_id;
$$;

-- ============ TRIGGERS ============
-- Timestamp trigger for updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recalculate rating on rating change
CREATE OR REPLACE FUNCTION public.recalc_user_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_id UUID := COALESCE(NEW.rated_id, OLD.rated_id);
  avg_score REAL;
  cnt INT;
BEGIN
  SELECT AVG(score)::REAL, COUNT(*) INTO avg_score, cnt
  FROM public.ratings WHERE rated_id = target_id;

  UPDATE public.profiles
  SET rating = COALESCE(avg_score, 0), rating_count = COALESCE(cnt, 0)
  WHERE id = target_id;

  RETURN NULL;
END; $$;

CREATE TRIGGER trg_ratings_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.recalc_user_rating();

-- ============ FUNCTIONS ============
-- Tasks nearby with haversine
CREATE OR REPLACE FUNCTION public.tasks_nearby(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  filter_category public.task_category DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  category public.task_category,
  status public.task_status,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  image_url TEXT,
  publisher_id UUID,
  publisher_name TEXT,
  publisher_avatar TEXT,
  publisher_rating REAL,
  created_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    t.id, t.title, t.description, t.price, t.category, t.status,
    t.latitude, t.longitude, t.address, t.image_url,
    t.publisher_id, p.name, p.avatar_url, p.rating,
    t.created_at,
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(t.latitude))
          * cos(radians(t.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(t.latitude))
        ))
      )
    ) AS distance_km
  FROM public.tasks t
  JOIN public.profiles p ON p.id = t.publisher_id
  WHERE t.status = 'OPEN'
    AND (exclude_user_id IS NULL OR t.publisher_id != exclude_user_id)
    AND (filter_category IS NULL OR t.category = filter_category)
    AND (min_price IS NULL OR t.price >= min_price)
    AND (max_price IS NULL OR t.price <= max_price)
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(t.latitude))
          * cos(radians(t.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(t.latitude))
        ))
      )
    ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT page_size OFFSET page_offset;
$$;

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('task-images','task-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Task images are publicly viewable"
  ON storage.objects FOR SELECT USING (bucket_id = 'task-images');
CREATE POLICY "Users upload own task images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-images' AND (storage.foldername(name))[1] = auth.uid()::text);