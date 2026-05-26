-- ============================================================
-- TOTEM · Configurar usuario admin con contraseña conocida
-- Etapa 2.4 — Sub-paso de configuración
-- ============================================================
--
-- Este script:
-- 1. Verifica si existe el usuario admin@totem.local
-- 2. Si NO existe, lo crea con la contraseña admin123
-- 3. Si SÍ existe, le actualiza la contraseña a admin123
-- 4. Garantiza que tenga rol 'admin' en public.usuarios
--
-- Cómo usar:
-- 1. Abre el SQL Editor de Supabase
-- 2. Pega TODO este archivo
-- 3. Click "Run"
-- 4. Verifica al final que diga "Usuario admin configurado"
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@totem.local';
  v_password TEXT := 'admin123';
BEGIN
  -- 1. Verificar si el usuario ya existe en auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    -- No existe: crearlo
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, aud, role
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),       -- email confirmado de una vez
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Administrador TOTEM"}'::jsonb,
      'authenticated',
      'authenticated'
    );

    -- Crear la identidad necesaria para login con email
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Usuario % CREADO con id %', v_email, v_user_id;
  ELSE
    -- Ya existe: actualizar contraseña
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Usuario % ya existía, contraseña actualizada', v_email;
  END IF;

  -- 2. Asegurar que tenga perfil en public.usuarios con rol admin
  -- El trigger crear_usuario_perfil ya debería haberlo creado, pero por si acaso:
  INSERT INTO public.usuarios (id, username, email, nombre, rol, activo)
  VALUES (v_user_id, 'admin', v_email, 'Administrador TOTEM', 'admin', true)
  ON CONFLICT (id) DO UPDATE
    SET rol = 'admin',
        nombre = 'Administrador TOTEM',
        username = 'admin',
        activo = true;

  RAISE NOTICE '✅ Usuario admin configurado correctamente';
  RAISE NOTICE 'Usuario: admin';
  RAISE NOTICE 'Contraseña: admin123';
END $$;

-- Verificación final
SELECT
  u.username,
  u.nombre,
  u.rol,
  u.activo,
  au.email AS email_interno,
  au.email_confirmed_at IS NOT NULL AS email_confirmado
FROM public.usuarios u
INNER JOIN auth.users au ON au.id = u.id
WHERE u.username = 'admin';
