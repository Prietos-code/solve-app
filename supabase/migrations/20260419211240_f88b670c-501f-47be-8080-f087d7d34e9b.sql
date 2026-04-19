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

-- Cualquier autenticado ve tareas OPEN; publisher y collaborator ven todas las suyas
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

-- Publisher edita solo si está OPEN; collaborator puede actualizar cuando acepta/marca progreso
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

-- Solo se puede valorar si participaste en la tarea y está completada
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

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
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

-- ============ RECALCULATE RATING AVG ============
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

-- ============ HAVERSINE NEARBY FUNCTION ============
CREATE OR REPLACE FUNCTION public.tasks_nearby(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  filter_category public.task_category DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
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