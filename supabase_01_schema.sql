-- ============================================================
-- TOTEM · Cotizador de Control de Combustible
-- Schema SQL completo para Supabase
-- Etapa 2.2 — Estructura de tablas, relaciones, RLS y triggers
-- ============================================================
--
-- Cómo usar:
-- 1. Abre el SQL Editor de Supabase
-- 2. Pega TODO este archivo
-- 3. Click "Run" (o Ctrl+Enter)
-- 4. Espera ~30 segundos
-- 5. Si no hay errores, ve a "Table Editor" para verificar
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- LIMPIEZA (por si ya ejecutaste antes y quieres empezar de cero)
-- Comenta estas líneas si NO quieres borrar nada previo
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.requerimientos_levantamiento CASCADE;
DROP TABLE IF EXISTS public.items_levantamiento CASCADE;
DROP TABLE IF EXISTS public.levantamientos CASCADE;
DROP TABLE IF EXISTS public.adicionales_oferta CASCADE;
DROP TABLE IF EXISTS public.items_oferta CASCADE;
DROP TABLE IF EXISTS public.versiones_oferta CASCADE;
DROP TABLE IF EXISTS public.ofertas CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.recetas_mano_obra CASCADE;
DROP TABLE IF EXISTS public.recetas_cable CASCADE;
DROP TABLE IF EXISTS public.recetas_tubo CASCADE;
DROP TABLE IF EXISTS public.costos_adicionales_catalogo CASCADE;
DROP TABLE IF EXISTS public.requerimientos_grupos CASCADE;
DROP TABLE IF EXISTS public.catalogo_productos CASCADE;
DROP TABLE IF EXISTS public.parametros_globales CASCADE;

-- ============================================================
-- 1. USUARIOS Y ROLES
-- ============================================================
-- Supabase ya trae auth.users (gestión de auth). Aquí guardamos
-- info adicional del usuario como su rol y nombre.

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,                -- 'juan.perez' (lo que el usuario escribe al loguearse)
  email TEXT UNIQUE NOT NULL,                   -- 'juan.perez@totem.local' (lo que Supabase Auth ve internamente)
  nombre TEXT NOT NULL,                         -- 'Juan Pérez' (display)
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'ingeniero', 'cotizador', 'revisor', 'lector')),
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.usuarios IS 'Perfil extendido de usuarios. El username es lo que escriben para loguearse; internamente se manda como username@totem.local a Supabase Auth.';

-- ============================================================
-- 2. CLIENTES
-- ============================================================

CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ruc TEXT,
  direccion TEXT,
  ciudad TEXT,
  contacto_principal TEXT,
  telefono TEXT,
  email TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_por UUID REFERENCES public.usuarios(id)
);

CREATE INDEX idx_clientes_nombre ON public.clientes(nombre);
CREATE INDEX idx_clientes_activo ON public.clientes(activo);

-- ============================================================
-- 3. PROYECTOS
-- ============================================================
-- Un proyecto agrupa todas las ofertas relacionadas con un cliente y sitio.

CREATE TABLE public.proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  lugar_obra TEXT,
  coordenadas TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado', 'archivado')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_por UUID REFERENCES public.usuarios(id)
);

CREATE INDEX idx_proyectos_cliente ON public.proyectos(cliente_id);
CREATE INDEX idx_proyectos_estado ON public.proyectos(estado);

-- ============================================================
-- 4. CATÁLOGO DE PRODUCTOS
-- ============================================================
-- Equipos vendibles (sensores, controladores, cables, etc.)

CREATE TABLE public.catalogo_productos (
  id TEXT PRIMARY KEY,            -- 'P001', 'P002', etc. (mantiene el formato del frontend actual)
  sku TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  grupo TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'UN',
  costo NUMERIC(12,4) NOT NULL DEFAULT 0,
  pvp NUMERIC(12,4) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalogo_grupo ON public.catalogo_productos(grupo);
CREATE INDEX idx_catalogo_activo ON public.catalogo_productos(activo);
-- Búsqueda case-insensitive para el buscador del frontend
CREATE INDEX idx_catalogo_nombre_lower ON public.catalogo_productos(lower(nombre));
CREATE INDEX idx_catalogo_sku_lower ON public.catalogo_productos(lower(sku));

-- ============================================================
-- 5. RECETAS — TUBERÍA
-- ============================================================

CREATE TABLE public.recetas_tubo (
  codigo TEXT PRIMARY KEY,              -- 'EMT_1_2', 'PVC_3_4', etc.
  nombre TEXT NOT NULL,
  costo_m NUMERIC(10,4) NOT NULL DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. RECETAS — CABLE
-- ============================================================

CREATE TABLE public.recetas_cable (
  codigo TEXT PRIMARY KEY,              -- 'INST_3X18', 'UTP_CAT6', etc.
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('instrumentacion', 'datos', 'electrico', 'ninguno')),
  costo_m NUMERIC(10,4) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recetas_cable_tipo ON public.recetas_cable(tipo);

-- ============================================================
-- 7. RECETAS — MANO DE OBRA
-- ============================================================

CREATE TABLE public.recetas_mano_obra (
  categoria TEXT PRIMARY KEY,           -- 'SENSORES', 'CONTROLADORES', etc.
  horas_base NUMERIC(8,4) NOT NULL DEFAULT 0,
  factor_altura NUMERIC(8,4) NOT NULL DEFAULT 1,
  costo_hora NUMERIC(10,4) NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. CATÁLOGO DE COSTOS ADICIONALES (Requerimientos)
-- ============================================================
-- Logística, indirectos, obra civil, permisos, etc.

CREATE TABLE public.costos_adicionales_catalogo (
  id TEXT PRIMARY KEY,                  -- 'A001', 'A002', etc.
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,              -- 'LOGISTICA', 'INDIRECTOS', 'OBRA_CIVIL', 'PERMISOS', 'GARANTIA', 'CAPACITACION', 'IMPREVISTOS'
  unidad TEXT NOT NULL,
  costo NUMERIC(12,4) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_costos_adic_categoria ON public.costos_adicionales_catalogo(categoria);

-- ============================================================
-- 9. GRUPOS DE REQUERIMIENTOS (para los 3 botones del ingeniero)
-- ============================================================

CREATE TABLE public.requerimientos_grupos (
  codigo TEXT PRIMARY KEY,              -- 'LOGISTICA', 'OBRA_CIVIL', 'ESPECIALES'
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  categorias TEXT[] NOT NULL,           -- array de categorías que incluye
  orden INT NOT NULL DEFAULT 0
);

-- ============================================================
-- 10. PARÁMETROS GLOBALES
-- ============================================================

CREATE TABLE public.parametros_globales (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. LEVANTAMIENTOS
-- ============================================================
-- Captura del ingeniero. Un levantamiento puede generar una o más ofertas.

CREATE TABLE public.levantamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES public.proyectos(id),
  cliente_nombre TEXT,                  -- snapshot, para no perder data si el cliente cambia
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  referencia TEXT,
  lugar_obra TEXT,
  coordenadas TEXT,
  problema TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado_a_cotizar', 'cotizado', 'archivado')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_por UUID REFERENCES public.usuarios(id),
  enviado_en TIMESTAMPTZ,
  enviado_por UUID REFERENCES public.usuarios(id)
);

CREATE INDEX idx_levantamientos_proyecto ON public.levantamientos(proyecto_id);
CREATE INDEX idx_levantamientos_estado ON public.levantamientos(estado);
CREATE INDEX idx_levantamientos_creador ON public.levantamientos(creado_por);

-- ============================================================
-- 12. ITEMS DEL LEVANTAMIENTO
-- ============================================================

CREATE TABLE public.items_levantamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  levantamiento_id UUID NOT NULL REFERENCES public.levantamientos(id) ON DELETE CASCADE,
  orden INT NOT NULL DEFAULT 0,
  producto_id TEXT NOT NULL REFERENCES public.catalogo_productos(id),
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  ubicacion TEXT,
  altura_mayor_3m BOOLEAN NOT NULL DEFAULT false,
  tipo_tubo TEXT,                       -- código de receta_tubo o 'NINGUNO'
  m_tubo NUMERIC(10,2) NOT NULL DEFAULT 0,
  cable_instr TEXT,
  m_cable_instr NUMERIC(10,2) NOT NULL DEFAULT 0,
  cable_datos TEXT,
  m_cable_datos NUMERIC(10,2) NOT NULL DEFAULT 0,
  cable_elec TEXT,
  m_cable_elec NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacion TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_lev_lev ON public.items_levantamiento(levantamiento_id);

-- ============================================================
-- 13. REQUERIMIENTOS DEL LEVANTAMIENTO
-- ============================================================
-- Lo que el ingeniero registra con los 3 botones (logística, obra civil, especiales)

CREATE TABLE public.requerimientos_levantamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  levantamiento_id UUID NOT NULL REFERENCES public.levantamientos(id) ON DELETE CASCADE,
  adic_id TEXT NOT NULL REFERENCES public.costos_adicionales_catalogo(id),
  grupo TEXT NOT NULL REFERENCES public.requerimientos_grupos(codigo),
  cantidad NUMERIC(10,2) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_req_lev_lev ON public.requerimientos_levantamiento(levantamiento_id);

-- ============================================================
-- 14. OFERTAS
-- ============================================================
-- Una oferta es una propuesta comercial generada a partir de un levantamiento.
-- Una misma oferta puede tener varias versiones.

CREATE TABLE public.ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.proyectos(id),
  levantamiento_id UUID REFERENCES public.levantamientos(id),
  codigo TEXT UNIQUE NOT NULL,          -- 'GTT26-059-1' (auto-generado)
  referencia TEXT,
  version_actual INT NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_revision', 'aprobada', 'enviada', 'rechazada', 'archivada')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_por UUID REFERENCES public.usuarios(id)
);

CREATE INDEX idx_ofertas_proyecto ON public.ofertas(proyecto_id);
CREATE INDEX idx_ofertas_estado ON public.ofertas(estado);
CREATE INDEX idx_ofertas_codigo ON public.ofertas(codigo);

-- ============================================================
-- 15. VERSIONES DE OFERTA (HISTÓRICO INMUTABLE)
-- ============================================================
-- Cada edición de la oferta crea una nueva versión. Las anteriores NUNCA se borran ni modifican.

CREATE TABLE public.versiones_oferta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  numero_version INT NOT NULL,
  margen_global NUMERIC(5,4) NOT NULL DEFAULT 0.40,
  descuento_pct NUMERIC(5,4) NOT NULL DEFAULT 0,
  plazo_renta_meses INT NOT NULL DEFAULT 48,
  -- Snapshots de cálculo (para no recalcular siempre)
  costo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  pvp_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  renta_mensual NUMERIC(12,2) NOT NULL DEFAULT 0,
  margen_efectivo NUMERIC(5,4) NOT NULL DEFAULT 0,
  -- Metadatos
  comentario_version TEXT,              -- ej: "Ajuste margen sensores", "Aprobado por revisor"
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creada_por UUID REFERENCES public.usuarios(id),
  UNIQUE(oferta_id, numero_version)
);

CREATE INDEX idx_versiones_oferta ON public.versiones_oferta(oferta_id);
CREATE INDEX idx_versiones_actual ON public.versiones_oferta(oferta_id, numero_version DESC);

-- ============================================================
-- 16. ITEMS DE LA OFERTA (POR VERSIÓN)
-- ============================================================
-- Cada versión tiene su propia lista de items con sus overrides comerciales.

CREATE TABLE public.items_oferta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.versiones_oferta(id) ON DELETE CASCADE,
  orden INT NOT NULL DEFAULT 0,
  -- Datos heredados del levantamiento
  producto_id TEXT NOT NULL REFERENCES public.catalogo_productos(id),
  cantidad NUMERIC(10,2) NOT NULL,
  ubicacion TEXT,
  altura_mayor_3m BOOLEAN NOT NULL DEFAULT false,
  tipo_tubo TEXT,
  m_tubo NUMERIC(10,2) NOT NULL DEFAULT 0,
  cable_instr TEXT,
  m_cable_instr NUMERIC(10,2) NOT NULL DEFAULT 0,
  cable_datos TEXT,
  m_cable_datos NUMERIC(10,2) NOT NULL DEFAULT 0,
  cable_elec TEXT,
  m_cable_elec NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacion TEXT,
  -- Overrides comerciales (lo nuevo en la oferta)
  margen_pct NUMERIC(5,4),              -- NULL = usar margen global
  horas_mo_override NUMERIC(8,4)        -- NULL = usar receta
);

CREATE INDEX idx_items_oferta_version ON public.items_oferta(version_id);

-- ============================================================
-- 17. ADICIONALES DE LA OFERTA (POR VERSIÓN)
-- ============================================================

CREATE TABLE public.adicionales_oferta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.versiones_oferta(id) ON DELETE CASCADE,
  adic_id TEXT NOT NULL REFERENCES public.costos_adicionales_catalogo(id),
  cantidad NUMERIC(10,2) NOT NULL,
  costo_unitario NUMERIC(12,4) NOT NULL,
  from_ingeniero BOOLEAN NOT NULL DEFAULT false  -- true = vino del levantamiento, false = agregado por cotizador
);

CREATE INDEX idx_adic_oferta_version ON public.adicionales_oferta(version_id);

-- ============================================================
-- TRIGGER: Generar código de oferta automáticamente
-- Formato: GTT{YY}-{NNN}-1 (ej: GTT26-059-1)
-- ============================================================

CREATE OR REPLACE FUNCTION public.generar_codigo_oferta()
RETURNS TRIGGER AS $$
DECLARE
  v_anio TEXT;
  v_numero INT;
  v_codigo TEXT;
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    v_anio := to_char(now(), 'YY');
    -- Contar ofertas creadas este año + 1
    SELECT COALESCE(MAX(
      CASE WHEN codigo LIKE 'GTT' || v_anio || '-%'
        THEN CAST(split_part(split_part(codigo, '-', 2), '-', 1) AS INT)
        ELSE 0
      END
    ), 0) + 1 INTO v_numero
    FROM public.ofertas;
    v_codigo := 'GTT' || v_anio || '-' || LPAD(v_numero::TEXT, 3, '0') || '-1';
    NEW.codigo := v_codigo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_codigo_oferta
BEFORE INSERT ON public.ofertas
FOR EACH ROW EXECUTE FUNCTION public.generar_codigo_oferta();

-- ============================================================
-- TRIGGER: Actualizar version_actual de la oferta
-- Cada vez que se inserta una versión nueva, actualiza el campo
-- "version_actual" de la oferta padre.
-- ============================================================

CREATE OR REPLACE FUNCTION public.actualizar_version_actual()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ofertas
  SET version_actual = NEW.numero_version
  WHERE id = NEW.oferta_id
    AND NEW.numero_version > version_actual;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_version_actual
AFTER INSERT ON public.versiones_oferta
FOR EACH ROW EXECUTE FUNCTION public.actualizar_version_actual();

-- ============================================================
-- FUNCIÓN: Crear nueva versión clonando la última
-- Esta es la magia del versionamiento. Cuando el cotizador "edita"
-- una oferta, se llama a esta función que clona la última versión
-- en una nueva (numero+1) y devuelve el id de la nueva.
-- ============================================================

CREATE OR REPLACE FUNCTION public.clonar_version_oferta(
  p_oferta_id UUID,
  p_usuario_id UUID,
  p_comentario TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_origen RECORD;
  v_nuevo_numero INT;
  v_nueva_version_id UUID;
BEGIN
  -- Obtener la última versión
  SELECT * INTO v_version_origen
  FROM public.versiones_oferta
  WHERE oferta_id = p_oferta_id
  ORDER BY numero_version DESC
  LIMIT 1;

  IF v_version_origen IS NULL THEN
    RAISE EXCEPTION 'No existe versión previa para la oferta %', p_oferta_id;
  END IF;

  v_nuevo_numero := v_version_origen.numero_version + 1;

  -- Crear nueva versión copiando los datos
  INSERT INTO public.versiones_oferta (
    oferta_id, numero_version, margen_global, descuento_pct, plazo_renta_meses,
    costo_total, pvp_subtotal, iva, total, renta_mensual, margen_efectivo,
    comentario_version, creada_por
  ) VALUES (
    p_oferta_id, v_nuevo_numero, v_version_origen.margen_global, v_version_origen.descuento_pct, v_version_origen.plazo_renta_meses,
    v_version_origen.costo_total, v_version_origen.pvp_subtotal, v_version_origen.iva, v_version_origen.total, v_version_origen.renta_mensual, v_version_origen.margen_efectivo,
    COALESCE(p_comentario, 'Nueva versión'), p_usuario_id
  ) RETURNING id INTO v_nueva_version_id;

  -- Clonar items
  INSERT INTO public.items_oferta (
    version_id, orden, producto_id, cantidad, ubicacion, altura_mayor_3m,
    tipo_tubo, m_tubo, cable_instr, m_cable_instr, cable_datos, m_cable_datos,
    cable_elec, m_cable_elec, observacion, margen_pct, horas_mo_override
  )
  SELECT
    v_nueva_version_id, orden, producto_id, cantidad, ubicacion, altura_mayor_3m,
    tipo_tubo, m_tubo, cable_instr, m_cable_instr, cable_datos, m_cable_datos,
    cable_elec, m_cable_elec, observacion, margen_pct, horas_mo_override
  FROM public.items_oferta
  WHERE version_id = v_version_origen.id;

  -- Clonar adicionales
  INSERT INTO public.adicionales_oferta (
    version_id, adic_id, cantidad, costo_unitario, from_ingeniero
  )
  SELECT
    v_nueva_version_id, adic_id, cantidad, costo_unitario, from_ingeniero
  FROM public.adicionales_oferta
  WHERE version_id = v_version_origen.id;

  RETURN v_nueva_version_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Crear usuario en public.usuarios cuando se registra en auth
-- Extrae el username del email (parte antes del @)
-- Ejemplo: 'juan.perez@totem.local' → username = 'juan.perez'
-- ============================================================

CREATE OR REPLACE FUNCTION public.crear_usuario_perfil()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := split_part(NEW.email, '@', 1);
  INSERT INTO public.usuarios (id, username, email, nombre, rol)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', v_username),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'lector')   -- por defecto 'lector', un admin debe cambiarlo
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_crear_usuario_perfil ON auth.users;
CREATE TRIGGER trg_crear_usuario_perfil
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.crear_usuario_perfil();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Habilitamos RLS en todas las tablas. Las políticas controlan
-- qué puede ver/editar cada rol.

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_tubo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_cable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_mano_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costos_adicionales_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requerimientos_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_globales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levantamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_levantamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requerimientos_levantamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versiones_oferta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_oferta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adicionales_oferta ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.rol_usuario_actual()
RETURNS TEXT AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: Catálogos y recetas
-- Todos los usuarios autenticados pueden LEER, solo admin puede EDITAR
-- ────────────────────────────────────────────────────────────

-- Catálogo de productos
CREATE POLICY "Todos leen catalogo" ON public.catalogo_productos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admin edita catalogo" ON public.catalogo_productos
  FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');

-- Recetas
CREATE POLICY "Todos leen tubo" ON public.recetas_tubo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edita tubo" ON public.recetas_tubo FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');
CREATE POLICY "Todos leen cable" ON public.recetas_cable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edita cable" ON public.recetas_cable FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');
CREATE POLICY "Todos leen mo" ON public.recetas_mano_obra FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edita mo" ON public.recetas_mano_obra FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');
CREATE POLICY "Todos leen adic" ON public.costos_adicionales_catalogo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edita adic" ON public.costos_adicionales_catalogo FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');
CREATE POLICY "Todos leen grupos" ON public.requerimientos_grupos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edita grupos" ON public.requerimientos_grupos FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');
CREATE POLICY "Todos leen params" ON public.parametros_globales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edita params" ON public.parametros_globales FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: Usuarios
-- Todos ven la lista. Solo admin edita roles. Cada uno edita su perfil.
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Todos leen usuarios" ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edita usuarios" ON public.usuarios FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');
CREATE POLICY "Cada uno edita su perfil" ON public.usuarios FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: Clientes, Proyectos
-- Todos los autenticados (excepto lector puro) pueden leer y crear.
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Autenticados leen clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo edita clientes" ON public.clientes FOR ALL TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor', 'ingeniero'));

CREATE POLICY "Autenticados leen proyectos" ON public.proyectos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo edita proyectos" ON public.proyectos FOR ALL TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor', 'ingeniero'));

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: Levantamientos
-- Ingeniero crea y edita los suyos. Cotizador/revisor/admin ven todos.
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Equipo lee levantamientos" ON public.levantamientos FOR SELECT TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor', 'ingeniero', 'lector'));

CREATE POLICY "Ingeniero crea sus levantamientos" ON public.levantamientos FOR INSERT TO authenticated
  WITH CHECK (
    public.rol_usuario_actual() IN ('admin', 'ingeniero')
    AND creado_por = auth.uid()
  );

CREATE POLICY "Ingeniero edita sus levantamientos en borrador" ON public.levantamientos FOR UPDATE TO authenticated
  USING (
    (public.rol_usuario_actual() = 'ingeniero' AND creado_por = auth.uid() AND estado = 'borrador')
    OR public.rol_usuario_actual() = 'admin'
  );

CREATE POLICY "Cotizador marca como cotizado" ON public.levantamientos FOR UPDATE TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'cotizador'))
  WITH CHECK (public.rol_usuario_actual() IN ('admin', 'cotizador'));

-- Items y requerimientos del levantamiento (heredan permisos por levantamiento padre)
CREATE POLICY "Equipo lee items lev" ON public.items_levantamiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo edita items lev" ON public.items_levantamiento FOR ALL TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'ingeniero'));

CREATE POLICY "Equipo lee req lev" ON public.requerimientos_levantamiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo edita req lev" ON public.requerimientos_levantamiento FOR ALL TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'ingeniero'));

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: Ofertas y versiones
-- Cotizador/revisor/admin crean y editan. Lector solo lee aprobadas.
-- ────────────────────────────────────────────────────────────

CREATE POLICY "Lector ve ofertas aprobadas" ON public.ofertas FOR SELECT TO authenticated
  USING (
    public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor', 'ingeniero')
    OR (public.rol_usuario_actual() = 'lector' AND estado IN ('aprobada', 'enviada'))
  );

CREATE POLICY "Cotizador crea ofertas" ON public.ofertas FOR INSERT TO authenticated
  WITH CHECK (public.rol_usuario_actual() IN ('admin', 'cotizador'));

CREATE POLICY "Cotizador edita ofertas" ON public.ofertas FOR UPDATE TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor'));

-- Versiones
CREATE POLICY "Equipo lee versiones" ON public.versiones_oferta FOR SELECT TO authenticated
  USING (
    public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor', 'ingeniero')
    OR public.rol_usuario_actual() = 'lector'
  );

CREATE POLICY "Cotizador crea versiones" ON public.versiones_oferta FOR INSERT TO authenticated
  WITH CHECK (public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor'));

-- IMPORTANTE: Las versiones NO se editan ni borran. Son inmutables.
-- No definimos políticas de UPDATE/DELETE para versiones_oferta.

-- Items y adicionales de oferta
CREATE POLICY "Equipo lee items oferta" ON public.items_oferta FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cotizador edita items oferta" ON public.items_oferta FOR ALL TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor'));

CREATE POLICY "Equipo lee adic oferta" ON public.adicionales_oferta FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cotizador edita adic oferta" ON public.adicionales_oferta FOR ALL TO authenticated
  USING (public.rol_usuario_actual() IN ('admin', 'cotizador', 'revisor'));

-- ============================================================
-- VISTA: Dashboard — métricas resumidas
-- ============================================================

CREATE OR REPLACE VIEW public.dashboard_metricas AS
SELECT
  (SELECT COUNT(*) FROM public.proyectos WHERE estado = 'activo') AS proyectos_activos,
  (SELECT COUNT(*) FROM public.ofertas WHERE estado IN ('borrador', 'en_revision')) AS ofertas_en_proceso,
  (SELECT COUNT(*) FROM public.ofertas WHERE estado IN ('aprobada', 'enviada')) AS ofertas_cerradas,
  (SELECT COUNT(*) FROM public.versiones_oferta) AS total_versiones,
  (SELECT COALESCE(SUM(v.total), 0)
   FROM public.versiones_oferta v
   INNER JOIN public.ofertas o ON o.id = v.oferta_id
   WHERE v.numero_version = o.version_actual
     AND o.estado IN ('aprobada', 'enviada')
  ) AS valor_total_aprobado,
  (SELECT COALESCE(AVG(v.margen_efectivo), 0)
   FROM public.versiones_oferta v
   INNER JOIN public.ofertas o ON o.id = v.oferta_id
   WHERE v.numero_version = o.version_actual
  ) AS margen_promedio;

-- ============================================================
-- VISTA: Última versión de cada oferta (la "actual")
-- ============================================================

CREATE OR REPLACE VIEW public.ofertas_con_version_actual AS
SELECT
  o.id AS oferta_id,
  o.codigo,
  o.referencia,
  o.estado AS oferta_estado,
  o.version_actual,
  o.creado_en AS oferta_creada_en,
  p.id AS proyecto_id,
  p.nombre AS proyecto_nombre,
  c.id AS cliente_id,
  c.nombre AS cliente_nombre,
  v.id AS version_id,
  v.total,
  v.costo_total,
  v.margen_efectivo,
  v.renta_mensual,
  v.creada_en AS version_creada_en,
  (SELECT COUNT(*) FROM public.versiones_oferta vo WHERE vo.oferta_id = o.id) AS total_versiones
FROM public.ofertas o
INNER JOIN public.proyectos p ON p.id = o.proyecto_id
INNER JOIN public.clientes c ON c.id = p.cliente_id
LEFT JOIN public.versiones_oferta v ON v.oferta_id = o.id AND v.numero_version = o.version_actual;

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
--
-- Para verificar que todo se creó bien, ejecuta:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
--
-- Deberías ver 17 tablas + 2 vistas.
-- ============================================================
