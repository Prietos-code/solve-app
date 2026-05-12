-- Excluir tareas propias del feed: añadir parámetro exclude_user_id a tasks_nearby
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
