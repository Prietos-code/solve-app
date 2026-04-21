DO $$
DECLARE
  laura_id   UUID := '11111111-1111-1111-1111-111111111111';
  marcos_id  UUID := '22222222-2222-2222-2222-222222222222';
  sofia_id   UUID := '33333333-3333-3333-3333-333333333333';
  carlos_id  UUID := '44444444-4444-4444-4444-444444444444';
  ana_id     UUID := '55555555-5555-5555-5555-555555555555';

  real_users UUID[] := ARRAY[
    '86a97186-fbf0-4ba1-9006-a2176c9107d6'::uuid, -- icloud
    '6ed1841f-45bd-479f-a692-3a468b099d9f'::uuid  -- gmail
  ];
  u UUID;
  task_chat_a UUID;
  task_chat_b UUID;
  task_done_a UUID;
  task_done_b UUID;
BEGIN
  FOREACH u IN ARRAY real_users LOOP
    -- Generar IDs deterministas por usuario (idempotente)
    task_chat_a := md5('chat_a' || u::text)::uuid;
    task_chat_b := md5('chat_b' || u::text)::uuid;
    task_done_a := md5('done_a' || u::text)::uuid;
    task_done_b := md5('done_b' || u::text)::uuid;

    -- 1) Chat activo (publisher = usuario real, colaborador = laura)
    INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, created_at) VALUES
      (task_chat_a, u, laura_id, 'Cuidar mi gato este sábado', 'Necesito que pasen a darle de comer y cambiar arena. Es muy tranquilo.', 18.00, 'MASCOTAS', 'ACCEPTED', 40.4200, -3.7000, 'Calle Mayor 50, Madrid', now() - interval '40 minutes', now() - interval '1 day')
    ON CONFLICT (id) DO NOTHING;

    -- 2) Chat in_progress (publisher = marcos, colaborador = usuario real)
    INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, created_at) VALUES
      (task_chat_b, marcos_id, u, 'Ayuda montando una mesa', 'Es una mesa extensible. Necesito un par de manos extra durante 1 hora.', 25.00, 'HOGAR', 'IN_PROGRESS', 40.4250, -3.7100, 'Calle de Fuencarral 80, Madrid', now() - interval '2 hours', now() - interval '1 day')
    ON CONFLICT (id) DO NOTHING;

    -- 3) Completada valorable (publisher = usuario real, colaborador = sofia)
    INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, completed_at, created_at) VALUES
      (task_done_a, u, sofia_id, 'Clase de inglés conversacional 1h', 'Sesión de conversación nivel B2.', 22.00, 'CLASES', 'COMPLETED', 40.4330, -3.7050, 'Calle de Sagasta 15, Madrid', now() - interval '3 days', now() - interval '2 days', now() - interval '4 days')
    ON CONFLICT (id) DO NOTHING;

    -- 4) Completada con valoraciones cruzadas (publisher = carlos, colaborador = usuario real)
    INSERT INTO public.tasks (id, publisher_id, collaborator_id, title, description, price, category, status, latitude, longitude, address, accepted_at, completed_at, created_at) VALUES
      (task_done_b, carlos_id, u, 'Recoger compra del super', 'Recoger pedido en Mercadona y subirlo a casa.', 10.00, 'RECADOS', 'COMPLETED', 40.4180, -3.7030, 'Gran Vía 28, Madrid', now() - interval '6 days', now() - interval '5 days', now() - interval '7 days')
    ON CONFLICT (id) DO NOTHING;

    -- 5) Mensajes en task_chat_a
    INSERT INTO public.messages (task_id, sender_id, content, created_at) VALUES
      (task_chat_a, laura_id, '¡Hola! Acabo de aceptar tu tarea. ¿A qué hora prefieres que pase?', now() - interval '38 minutes'),
      (task_chat_a, u,        'Hola Laura, perfecto. ¿Te viene bien sobre las 18:00?',             now() - interval '36 minutes'),
      (task_chat_a, laura_id, 'Sí, sin problema. ¿Necesito traer algo o tienes todo en casa?',     now() - interval '34 minutes'),
      (task_chat_a, u,        'Tengo todo: comida, arena y el bebedero limpio. Solo cariño.',      now() - interval '32 minutes'),
      (task_chat_a, laura_id, 'Genial. Te confirmo cuando llegue al portal.',                      now() - interval '30 minutes');

    -- 6) Mensajes en task_chat_b
    INSERT INTO public.messages (task_id, sender_id, content, created_at) VALUES
      (task_chat_b, marcos_id, 'Buenas, gracias por aceptar. ¿Vienes con destornillador eléctrico?', now() - interval '110 minutes'),
      (task_chat_b, u,         'Sí, llevo el mío. Llego en 20 minutos.',                              now() - interval '105 minutes'),
      (task_chat_b, marcos_id, 'Perfecto, te espero abajo.',                                          now() - interval '100 minutes');

    -- 7) Valoraciones cruzadas en task_done_b
    INSERT INTO public.ratings (task_id, rater_id, rated_id, score, comment, created_at) VALUES
      (task_done_b, carlos_id, u,         5, 'Súper rápido y atento. Repetiré sin duda.',                       now() - interval '5 days'),
      (task_done_b, u,         carlos_id, 5, 'Muy buena comunicación, todo claro desde el principio.',          now() - interval '5 days');
  END LOOP;
END $$;