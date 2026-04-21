-- ============================================================
-- DEMO SEED: usuarios falsos + tareas + chat + valoraciones
-- Pensado para que los 3 usuarios reales vean contenido rico
-- ============================================================

DO $$
DECLARE
  -- Usuarios falsos (UUIDs fijos para idempotencia)
  laura_id   UUID := '11111111-1111-1111-1111-111111111111';
  marcos_id  UUID := '22222222-2222-2222-2222-222222222222';
  sofia_id   UUID := '33333333-3333-3333-3333-333333333333';
  carlos_id  UUID := '44444444-4444-4444-4444-444444444444';
  ana_id     UUID := '55555555-5555-5555-5555-555555555555';

  -- Usuarios reales
  jorge_main UUID := 'dd64daab-6a90-442f-8cec-093768c0493d'; -- soldedlimited
  jorge_ic   UUID := '86a97186-fbf0-4ba1-9006-a2176c9107d6'; -- icloud
  jorge_gm   UUID := '6ed1841f-45bd-479f-a692-3a468b099d9f'; -- gmail

  -- IDs de tareas demo
  task_open_1 UUID := 'aaaaaaa1-0000-0000-0000-000000000001';
  task_open_2 UUID := 'aaaaaaa1-0000-0000-0000-000000000002';
  task_open_3 UUID := 'aaaaaaa1-0000-0000-0000-000000000003';
  task_open_4 UUID := 'aaaaaaa1-0000-0000-0000-000000000004';
  task_open_5 UUID := 'aaaaaaa1-0000-0000-0000-000000000005';
  task_chat_1 UUID := 'bbbbbbb1-0000-0000-0000-000000000001'; -- jorge_main publisher, laura colabora (ACCEPTED, chat activo)
  task_chat_2 UUID := 'bbbbbbb1-0000-0000-0000-000000000002'; -- marcos publisher, jorge_main colabora (IN_PROGRESS, chat activo)
  task_done_1 UUID := 'ccccccc1-0000-0000-0000-000000000001'; -- jorge_main publisher, sofia colabora (COMPLETED, valorable)
  task_done_2 UUID := 'ccccccc1-0000-0000-0000-000000000002'; -- carlos publisher, jorge_main colabora (COMPLETED, ya valorada en ambas direcciones)
BEGIN
  -- 1) Insertar en auth.users (requiere campos mínimos)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES
    (laura_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'laura.demo@example.com',  crypt('demo-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Laura Méndez"}',     '', '', '', ''),
    (marcos_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcos.demo@example.com', crypt('demo-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Marcos Ruiz"}',      '', '', '', ''),
    (sofia_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia.demo@example.com',  crypt('demo-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Sofía García"}',     '', '', '', ''),
    (carlos_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlos.demo@example.com', crypt('demo-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos Navarro"}',   '', '', '', ''),
    (ana_id,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana.demo@example.com',    crypt('demo-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ana López"}',        '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- 2) Asegurar perfiles (el trigger handle_new_user los crea, pero forzamos coherencia)
  INSERT INTO public.profiles (id, name, email, bio, avatar_url, rating, rating_count) VALUES
    (laura_id,  'Laura Méndez',    'laura.demo@example.com',  'Estudiante de veterinaria, encantada de cuidar mascotas y hacer recados los fines de semana.', NULL, 4.8, 12),
    (marcos_id, 'Marcos Ruiz',     'marcos.demo@example.com', 'Manitas para arreglos del hogar. 10 años montando muebles y reparando pequeñas averías.',     NULL, 4.6, 28),
    (sofia_id,  'Sofía García',    'sofia.demo@example.com',  'Profesora de inglés y matemáticas. Clases para primaria y secundaria.',                       NULL, 5.0, 9),
    (carlos_id, 'Carlos Navarro',  'carlos.demo@example.com', 'Transportista con furgoneta propia. Mudanzas pequeñas y traslados.',                          NULL, 4.7, 41),
    (ana_id,    'Ana López',       'ana.demo@example.com',    'Hago recados, compras y trámites en el centro de Madrid.',                                   NULL, 4.9, 17)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, bio = EXCLUDED.bio, rating = EXCLUDED.rating, rating_count = EXCLUDED.rating_count;

  -- 3) Tareas OPEN cerca de Madrid centro (40.4168, -3.7038), publicadas por usuarios falsos
  INSERT INTO public.tasks (id, publisher_id, title, description, price, category, status, latitude, longitude, address, image_url, created_at) VALUES
    (task_open_1, laura_id,  'Pasear a mi perro 1 hora',          'Busco alguien que pasee a Toby (labrador, muy bueno) por las tardes. Vivo cerca del Retiro.', 12.00, 'MASCOTAS', 'OPEN', 40.4153, -3.6844, 'Calle de Alcalá 120, Madrid', NULL, now() - interval '2 hours'),
    (task_open_2, marcos_id, 'Montar estantería de Ikea',         'Tengo una Kallax 4x4 sin abrir. Necesito que la monten esta semana, traigo herramientas.',     35.00, 'HOGAR',    'OPEN', 40.4250, -3.7100, 'Calle de Fuencarral 80, Madrid', NULL, now() - interval '5 hours'),
    (task_open_3, sofia_id,  'Clases de matemáticas 2º ESO',      'Mi hijo necesita 2 horas semanales de apoyo. Preferible en mi casa, zona Chamberí.',           20.00, 'CLASES',   'OPEN', 40.4330, -3.7050, 'Calle de Sagasta 15, Madrid',  NULL, now() - interval '1 day'),
    (task_open_4, carlos_id, 'Mudanza pequeña: 8 cajas + sofá',   'Traslado de un piso a otro a 3 km. Solo cargar, transportar y descargar. Ascensor en ambos.',  60.00, 'MUDANZAS', 'OPEN', 40.4090, -3.7020, 'Calle de Embajadores 30, Madrid', NULL, now() - interval '3 hours'),
    (task_open_5, ana_id,    'Recoger paquete en oficina Correos','Recoger un paquete y entregarlo en mi domicilio. Necesito DNI prestado para apoderado.',       8.00,  'RECADOS',  'OPEN', 40.4180, -3.7030, 'Gran Vía 28, Madrid',          NULL, now() - interval '30 minutes')
  ON CONFLICT (id) DO NOTHING;

  -- 4) Tarea ACCEPTED con chat activo: publisher = jorge_main, colaborador = laura
  INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, created_at) VALUES
    (task_chat_1, jorge_main, laura_id, 'Cuidar mi gato este sábado', 'Necesito que pasen a darle de comer y cambiar arena. Es muy tranquilo.', 18.00, 'MASCOTAS', 'ACCEPTED', 40.4200, -3.7000, 'Calle Mayor 50, Madrid', now() - interval '40 minutes', now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- 5) Tarea IN_PROGRESS: publisher = marcos, colaborador = jorge_main (chat activo desde su lado)
  INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, created_at) VALUES
    (task_chat_2, marcos_id, jorge_main, 'Ayuda montando una mesa', 'Es una mesa extensible. Necesito un par de manos extra durante 1 hora.', 25.00, 'HOGAR', 'IN_PROGRESS', 40.4250, -3.7100, 'Calle de Fuencarral 80, Madrid', now() - interval '2 hours', now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- 6) Tarea COMPLETED valorable por jorge_main: publisher = jorge_main, colaborador = sofia
  INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, completed_at, created_at) VALUES
    (task_done_1, jorge_main, sofia_id, 'Clase de inglés conversacional 1h', 'Sesión de conversación nivel B2.', 22.00, 'CLASES', 'COMPLETED', 40.4330, -3.7050, 'Calle de Sagasta 15, Madrid', now() - interval '3 days', now() - interval '2 days', now() - interval '4 days')
  ON CONFLICT (id) DO NOTHING;

  -- 7) Tarea COMPLETED ya con valoraciones de ejemplo en ambos sentidos: publisher = carlos, colaborador = jorge_main
  INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, completed_at, created_at) VALUES
    (task_done_2, carlos_id, jorge_main, 'Recoger compra del super', 'Recoger pedido en Mercadona y subirlo a casa.', 10.00, 'RECADOS', 'COMPLETED', 40.4180, -3.7030, 'Gran Vía 28, Madrid', now() - interval '6 days', now() - interval '5 days', now() - interval '7 days')
  ON CONFLICT (id) DO NOTHING;

  -- 8) Mensajes en el chat de task_chat_1 (jorge_main <-> laura)
  INSERT INTO public.messages (task_id, sender_id, content, created_at) VALUES
    (task_chat_1, laura_id,   '¡Hola! Acabo de aceptar tu tarea. ¿A qué hora prefieres que pase?', now() - interval '38 minutes'),
    (task_chat_1, jorge_main, 'Hola Laura, perfecto. ¿Te viene bien sobre las 18:00?',             now() - interval '36 minutes'),
    (task_chat_1, laura_id,   'Sí, sin problema. ¿Necesito traer algo o tienes todo en casa?',     now() - interval '34 minutes'),
    (task_chat_1, jorge_main, 'Tengo todo: comida, arena y el bebedero limpio. Solo cariño 🙂',     now() - interval '32 minutes'),
    (task_chat_1, laura_id,   'Genial. Te confirmo cuando llegue al portal.',                      now() - interval '30 minutes')
  ON CONFLICT DO NOTHING;

  -- 9) Mensajes en el chat de task_chat_2 (marcos <-> jorge_main)
  INSERT INTO public.messages (task_id, sender_id, content, created_at) VALUES
    (task_chat_2, marcos_id,  'Buenas, gracias por aceptar. ¿Vienes con destornillador eléctrico?', now() - interval '110 minutes'),
    (task_chat_2, jorge_main, 'Sí, llevo el mío. Llego en 20 minutos.',                              now() - interval '105 minutes'),
    (task_chat_2, marcos_id,  'Perfecto, te espero abajo.',                                          now() - interval '100 minutes')
  ON CONFLICT DO NOTHING;

  -- 10) Valoraciones ya existentes en task_done_2 (entre carlos y jorge_main)
  INSERT INTO public.ratings (task_id, rater_id, rated_id, score, comment, created_at) VALUES
    (task_done_2, carlos_id,  jorge_main, 5, 'Súper rápido y atento. Repetiré sin duda.',                       now() - interval '5 days'),
    (task_done_2, jorge_main, carlos_id,  5, 'Muy buena comunicación, todo claro desde el principio.',          now() - interval '5 days')
  ON CONFLICT DO NOTHING;

  -- 11) Algunas valoraciones extra para los perfiles falsos (sin tareas asociadas no se pueden por RLS, pero el trigger ya los inicializó arriba)
END $$;