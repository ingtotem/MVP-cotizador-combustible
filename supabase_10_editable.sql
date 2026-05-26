-- ============================================================
-- TOTEM · Etapa 6 — Mantenimiento editable + categoria MO
-- ============================================================
-- Cómo usar:
-- 1. SQL Editor de Supabase → New query
-- 2. Pegar TODO → Run
-- ============================================================

-- ──────────────────────────────────────────────────────
-- 1. Agregar columna categoria_mo en catalogo_productos
-- ──────────────────────────────────────────────────────
ALTER TABLE public.catalogo_productos
  ADD COLUMN IF NOT EXISTS categoria_mo TEXT;

-- Por defecto, la categoría MO es el grupo (es lo que ya funciona en la DB demo)
UPDATE public.catalogo_productos
SET categoria_mo = grupo
WHERE categoria_mo IS NULL;

-- ──────────────────────────────────────────────────────
-- 2. Habilitar EDICIÓN para rol admin en todas las tablas relevantes
-- ──────────────────────────────────────────────────────
-- Lo importante: las policies de admin para INSERT/UPDATE/DELETE.
-- Las de SELECT (lectura) ya existen.

-- catalogo_productos
DROP POLICY IF EXISTS "Admin edita catalogo" ON public.catalogo_productos;
CREATE POLICY "Admin edita catalogo" ON public.catalogo_productos
  FOR ALL TO authenticated
  USING (public.rol_usuario_actual() = 'admin')
  WITH CHECK (public.rol_usuario_actual() = 'admin');

-- recetas_tubo
DROP POLICY IF EXISTS "Admin edita recetas_tubo" ON public.recetas_tubo;
CREATE POLICY "Admin edita recetas_tubo" ON public.recetas_tubo
  FOR ALL TO authenticated
  USING (public.rol_usuario_actual() = 'admin')
  WITH CHECK (public.rol_usuario_actual() = 'admin');

-- recetas_cable
DROP POLICY IF EXISTS "Admin edita recetas_cable" ON public.recetas_cable;
CREATE POLICY "Admin edita recetas_cable" ON public.recetas_cable
  FOR ALL TO authenticated
  USING (public.rol_usuario_actual() = 'admin')
  WITH CHECK (public.rol_usuario_actual() = 'admin');

-- recetas_mano_obra
DROP POLICY IF EXISTS "Admin edita recetas_mano_obra" ON public.recetas_mano_obra;
CREATE POLICY "Admin edita recetas_mano_obra" ON public.recetas_mano_obra
  FOR ALL TO authenticated
  USING (public.rol_usuario_actual() = 'admin')
  WITH CHECK (public.rol_usuario_actual() = 'admin');

-- costos_adicionales_catalogo
DROP POLICY IF EXISTS "Admin edita costos_adicionales" ON public.costos_adicionales_catalogo;
CREATE POLICY "Admin edita costos_adicionales" ON public.costos_adicionales_catalogo
  FOR ALL TO authenticated
  USING (public.rol_usuario_actual() = 'admin')
  WITH CHECK (public.rol_usuario_actual() = 'admin');

-- familias_productos (ya tiene policy pero la re-declaramos)
DROP POLICY IF EXISTS "Admin edita familias" ON public.familias_productos;
CREATE POLICY "Admin edita familias" ON public.familias_productos
  FOR ALL TO authenticated
  USING (public.rol_usuario_actual() = 'admin')
  WITH CHECK (public.rol_usuario_actual() = 'admin');

-- parametros_globales
DROP POLICY IF EXISTS "Admin edita parametros" ON public.parametros_globales;
CREATE POLICY "Admin edita parametros" ON public.parametros_globales
  FOR ALL TO authenticated
  USING (public.rol_usuario_actual() = 'admin')
  WITH CHECK (public.rol_usuario_actual() = 'admin');

-- ──────────────────────────────────────────────────────
-- 3. Verificación rápida
-- ──────────────────────────────────────────────────────
SELECT 'Productos con categoria_mo' AS info, COUNT(*)::TEXT AS valor
  FROM public.catalogo_productos WHERE categoria_mo IS NOT NULL
UNION ALL
SELECT 'Productos sin categoria_mo (revisar)', COUNT(*)::TEXT
  FROM public.catalogo_productos WHERE categoria_mo IS NULL AND activo = true
UNION ALL
SELECT 'Categorías MO definidas', COUNT(*)::TEXT
  FROM public.recetas_mano_obra
UNION ALL
SELECT 'Match (productos con categoria_mo que existe en recetas)', COUNT(*)::TEXT
  FROM public.catalogo_productos cp
  WHERE cp.categoria_mo IN (SELECT categoria FROM public.recetas_mano_obra)
UNION ALL
SELECT 'Sin match (no calculan MO, revisar)', COUNT(*)::TEXT
  FROM public.catalogo_productos cp
  WHERE cp.activo = true
    AND cp.categoria_mo NOT IN (SELECT categoria FROM public.recetas_mano_obra);
