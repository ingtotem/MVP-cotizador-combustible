-- ============================================================
-- TOTEM · Etapa 7 — Arreglar MO definitivamente + flujo aprobaciones
-- ============================================================
-- Cómo usar:
-- 1. SQL Editor de Supabase → New query
-- 2. Pegar TODO → Run
-- ============================================================

-- ──────────────────────────────────────────────────────
-- 1. Forzar que categoria_mo NUNCA quede NULL
-- ──────────────────────────────────────────────────────
ALTER TABLE public.catalogo_productos
  ADD COLUMN IF NOT EXISTS categoria_mo TEXT;

-- Si está NULL, copiar del grupo
UPDATE public.catalogo_productos
SET categoria_mo = grupo
WHERE categoria_mo IS NULL OR categoria_mo = '';

-- Limpiar espacios en categoria_mo y grupo (por si acaso)
UPDATE public.catalogo_productos
SET categoria_mo = TRIM(UPPER(categoria_mo))
WHERE categoria_mo IS NOT NULL;

UPDATE public.recetas_mano_obra
SET categoria = TRIM(UPPER(categoria));

-- ──────────────────────────────────────────────────────
-- 2. Asegurar que TODAS las categorías de productos tengan receta MO
-- ──────────────────────────────────────────────────────
-- Insertar recetas faltantes con valores razonables (admin las puede ajustar después)
INSERT INTO public.recetas_mano_obra (categoria, horas_base, factor_altura, costo_hora)
SELECT DISTINCT cp.categoria_mo, 1.0, 1.0, 5.41
FROM public.catalogo_productos cp
WHERE cp.categoria_mo IS NOT NULL
  AND cp.categoria_mo NOT IN (SELECT categoria FROM public.recetas_mano_obra)
ON CONFLICT (categoria) DO NOTHING;

-- ──────────────────────────────────────────────────────
-- 3. Agregar campos para el flujo de aprobación y estado
-- ──────────────────────────────────────────────────────
-- Estos campos preparan la base para guardar borradores con estado
ALTER TABLE public.ofertas
  ADD COLUMN IF NOT EXISTS estado_flujo TEXT DEFAULT 'LEVANTAMIENTO';
-- Estados posibles: LEVANTAMIENTO, REVISION, COTIZACION, APROBADO

-- Tabla simple de prospectos (renombre conceptual de proyectos)
-- No alteramos la tabla 'ofertas' actual, solo agregamos un alias visible
COMMENT ON TABLE public.ofertas IS 'Prospectos / oportunidades comerciales';

-- ──────────────────────────────────────────────────────
-- 4. Diagnóstico al final
-- ──────────────────────────────────────────────────────
SELECT '=== Diagnóstico final ===' AS info, '' AS valor
UNION ALL
SELECT 'Productos con categoria_mo NULL', COUNT(*)::TEXT
  FROM public.catalogo_productos WHERE categoria_mo IS NULL AND activo = true
UNION ALL
SELECT 'Categorías MO totales', COUNT(*)::TEXT FROM public.recetas_mano_obra
UNION ALL
SELECT 'Productos activos con MO calculable', COUNT(*)::TEXT
  FROM public.catalogo_productos cp
  WHERE cp.activo = true
    AND cp.categoria_mo IN (SELECT categoria FROM public.recetas_mano_obra)
UNION ALL
SELECT 'Productos activos sin MO (revisar)', COUNT(*)::TEXT
  FROM public.catalogo_productos cp
  WHERE cp.activo = true
    AND (cp.categoria_mo IS NULL OR cp.categoria_mo NOT IN (SELECT categoria FROM public.recetas_mano_obra));

-- Mostrar las categorías MO disponibles
SELECT 'Categorías MO disponibles:' AS info, '' AS valor
UNION ALL
SELECT '· ' || categoria || ' (h=' || horas_base || ', factor=' || factor_altura || ', $/h=' || costo_hora || ')', ''
FROM public.recetas_mano_obra
ORDER BY 1;
