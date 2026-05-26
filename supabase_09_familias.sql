-- ============================================================
-- TOTEM · Reestructuración del catálogo para selector POS
-- Etapa 2.5 — Familias + característica intercambiable
-- ============================================================
--
-- Cómo usar:
-- 1. Abre el SQL Editor de Supabase
-- 2. Pega TODO este archivo
-- 3. Click "Run"
-- ============================================================

-- 1. Agregar columnas nuevas si no existen
ALTER TABLE public.catalogo_productos
  ADD COLUMN IF NOT EXISTS familia TEXT,
  ADD COLUMN IF NOT EXISTS familia_nombre TEXT,
  ADD COLUMN IF NOT EXISTS caracteristica TEXT,
  ADD COLUMN IF NOT EXISTS caracteristica_label TEXT,
  ADD COLUMN IF NOT EXISTS icono TEXT;

-- 2. Tabla nueva para familias (catálogo de tipos de equipos)
CREATE TABLE IF NOT EXISTS public.familias_productos (
  codigo TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  grupo TEXT NOT NULL,                    -- a qué grupo pertenece (SENSORES, CONTROLADORES, etc.)
  icono TEXT NOT NULL,                    -- nombre del ícono SVG (sensor, controller, valve, etc.)
  caracteristica_nombre TEXT,             -- "Medida", "GPM", "Puertos", etc.
  caracteristica_unidad TEXT,             -- "mm", "GPM", "puertos", etc.
  descripcion TEXT,
  orden INT DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- RLS abierta para lectura
ALTER TABLE public.familias_productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos leen familias" ON public.familias_productos;
CREATE POLICY "Todos leen familias" ON public.familias_productos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin edita familias" ON public.familias_productos;
CREATE POLICY "Admin edita familias" ON public.familias_productos FOR ALL TO authenticated USING (public.rol_usuario_actual() = 'admin');

-- 3. Cargar familias (los 32 productos están agrupados así)
INSERT INTO public.familias_productos (codigo, nombre, grupo, icono, caracteristica_nombre, caracteristica_unidad, descripcion, orden) VALUES
  -- SENSORES
  ('SENSOR_CAPACITIVO',   'Sensor Capacitivo',         'SENSORES',        'sensor-cap',     'Medida',  'mm',     'Para tanques ≤ 1.50m de altura',           1),
  ('SENSOR_MAGNETO',      'Sensor Magnetostrictivo',   'SENSORES',        'sensor-mag',     'Medida',  'mm',     'Para tanques de 1.50m a 3m',               2),
  ('SENSOR_RADAR',        'Sensor Radar Guiado',       'SENSORES',        'sensor-radar',   'Tipo',    '',       'Para tanques > 3m o combustibles densos',  3),

  -- COMUNICACIÓN
  ('UTN_CAP',             'Unidad TX Capacitivo',      'COMUNICACION',    'wifi-up',        'Tipo',    '',       'Transmisión a la nube para sensores capacitivos', 4),
  ('UTN_MAG',             'Unidad TX Magneto',         'COMUNICACION',    'wifi-up',        'Tipo',    '',       'Transmisión a la nube para sensores magnetos',    5),
  ('UTN_RAD',             'Unidad TX Radar',           'COMUNICACION',    'wifi-up',        'Tipo',    '',       'Transmisión a la nube para sensores radar',       6),

  -- CONTROLADORES
  ('CTRL_PEDESTAL',       'Controlador Pedestal',      'CONTROLADORES',   'pedestal',       'Mangueras', 'M',    'Estación fija de despacho con pedestal', 10),
  ('CTRL_MOVIL',          'Controlador Móvil',         'CONTROLADORES',   'truck',          'Tipo',    '',       'Despacho desde vehículo',                11),

  -- RFID
  ('RFID_NOZZLE',         'Nozzle RFID',               'RFID',            'rfid',           'Tipo',    '',       'Receptor de nozzle RFID',                15),
  ('RFID_PISTOLA',        'Lector de Pistola',         'RFID',            'rfid',           'Tipo',    '',       'Lector RFID en pistola',                 16),
  ('RFID_TAG',            'Tag Vehicular',             'RFID',            'tag',            'Tipo',    '',       'Etiqueta RFID para vehículos',           17),

  -- INSTRUMENTACIÓN
  ('VALVULA',             'Válvula Solenoide',         'INSTRUMENTACION', 'valve',          'Voltaje', '',       'Válvula de corte para diésel',           20),
  ('MEDIDOR_FLUJO',       'Medidor de Flujo',          'INSTRUMENTACION', 'flow',           'Capacidad', 'GPM',  'Medidor PIUSI con pulsos para diésel',   21),

  -- REDES
  ('SWITCH_POE',          'Switch PoE',                'REDES',           'switch',         'Puertos', 'P',      'Switch con alimentación PoE',            25),
  ('ANTENA_CORTA',        'Antena Corto Alcance',      'REDES',           'antenna',        'Tipo',    '',       'Antena para enlaces cortos (≤200m)',     26),
  ('ANTENA_LARGA',        'Antena Largo Alcance',      'REDES',           'antenna',        'Tipo',    '',       'Antena para enlaces largos (>500m)',     27),
  ('ANTENA_OMNI',         'Antena Omnidireccional',    'REDES',           'antenna',        'Tipo',    '',       'Antena 360°',                            28),

  -- ENERGÍA
  ('KIT_SOLAR',           'Kit Solar',                 'ENERGIA',         'solar',          'Paneles', 'P',      'Sistema fotovoltaico autónomo',          30),
  ('UPS',                 'UPS Online',                'ENERGIA',         'battery',        'Capacidad', 'VA',   'Sistema de alimentación ininterrumpida', 31),

  -- GABINETES
  ('GABINETE_INT',        'Caja Metálica',             'GABINETES',       'cabinet',        'Tamaño',  '',       'Caja para interior',                     35),
  ('GABINETE_EXT',        'Gabinete Exterior',         'GABINETES',       'cabinet',        'Tipo',    '',       'Gabinete IP65 para intemperie',          36),

  -- CCTV
  ('CAMARA',              'Cámara IP',                 'CCTV',            'camera',         'Tipo',    '',       'Cámara de videovigilancia',              40),
  ('LIC_CAMARA',          'Licencia Cámara',           'CCTV',            'license',        'Tipo',    '',       'Licencia para canal de cámara',          41),
  ('SERVIDOR',            'Servidor Virtual',          'CCTV',            'server',         'Tipo',    '',       'Servidor para grabación',                42),

  -- ACCESORIOS
  ('CAJA_UNIONES',        'Caja de Uniones',           'ACCESORIOS',      'box',            'Tipo',    '',       'Caja para empalmes de sensores',         50),
  ('ADECUACION',          'Adecuación de Sensor',      'SERVICIOS',       'wrench',         'Servicio', '',      'Servicio de ajuste/calibración',         51)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre, grupo = EXCLUDED.grupo, icono = EXCLUDED.icono,
  caracteristica_nombre = EXCLUDED.caracteristica_nombre, caracteristica_unidad = EXCLUDED.caracteristica_unidad,
  descripcion = EXCLUDED.descripcion, orden = EXCLUDED.orden;

-- 4. Asignar familia y característica a cada producto del catálogo
-- Sensores
UPDATE public.catalogo_productos SET familia='SENSOR_CAPACITIVO', familia_nombre='Sensor Capacitivo', caracteristica='1500',     caracteristica_label='1500 mm', icono='sensor-cap'   WHERE id='P001';
UPDATE public.catalogo_productos SET familia='SENSOR_MAGNETO',    familia_nombre='Sensor Magneto',    caracteristica='2250',     caracteristica_label='2250 mm', icono='sensor-mag'   WHERE id='P002';
UPDATE public.catalogo_productos SET familia='SENSOR_MAGNETO',    familia_nombre='Sensor Magneto',    caracteristica='2500',     caracteristica_label='2500 mm', icono='sensor-mag'   WHERE id='P003';
UPDATE public.catalogo_productos SET familia='SENSOR_MAGNETO',    familia_nombre='Sensor Magneto',    caracteristica='3250',     caracteristica_label='3250 mm', icono='sensor-mag'   WHERE id='P004';
UPDATE public.catalogo_productos SET familia='SENSOR_RADAR',      familia_nombre='Sensor Radar',      caracteristica='DIESEL',   caracteristica_label='Diésel',  icono='sensor-radar' WHERE id='P005';

-- Comunicación
UPDATE public.catalogo_productos SET familia='UTN_CAP', familia_nombre='Unidad TX Capacitivo', caracteristica='STD', caracteristica_label='Estándar', icono='wifi-up' WHERE id='P010';
UPDATE public.catalogo_productos SET familia='UTN_MAG', familia_nombre='Unidad TX Magneto',    caracteristica='STD', caracteristica_label='Estándar', icono='wifi-up' WHERE id='P011';
UPDATE public.catalogo_productos SET familia='UTN_RAD', familia_nombre='Unidad TX Radar',      caracteristica='STD', caracteristica_label='Estándar', icono='wifi-up' WHERE id='P012';

-- Controladores
UPDATE public.catalogo_productos SET familia='CTRL_PEDESTAL', familia_nombre='Controlador Pedestal', caracteristica='1M', caracteristica_label='1 manguera',  icono='pedestal' WHERE id='P020';
UPDATE public.catalogo_productos SET familia='CTRL_PEDESTAL', familia_nombre='Controlador Pedestal', caracteristica='2M', caracteristica_label='2 mangueras', icono='pedestal' WHERE id='P021';
UPDATE public.catalogo_productos SET familia='CTRL_MOVIL',    familia_nombre='Controlador Móvil',    caracteristica='STD', caracteristica_label='Estándar',  icono='truck'    WHERE id='P022';

-- RFID
UPDATE public.catalogo_productos SET familia='RFID_NOZZLE',  familia_nombre='Nozzle RFID',       caracteristica='RX',  caracteristica_label='Receptor', icono='rfid' WHERE id='P030';
UPDATE public.catalogo_productos SET familia='RFID_PISTOLA', familia_nombre='Lector de Pistola', caracteristica='PIS', caracteristica_label='Pistola',  icono='rfid' WHERE id='P031';
UPDATE public.catalogo_productos SET familia='RFID_TAG',     familia_nombre='Tag Vehicular',     caracteristica='STD', caracteristica_label='Estándar', icono='tag'  WHERE id='P032';

-- Instrumentación
UPDATE public.catalogo_productos SET familia='VALVULA',       familia_nombre='Válvula Solenoide', caracteristica='12VDC',  caracteristica_label='12 VDC',  icono='valve' WHERE id='P040';
UPDATE public.catalogo_productos SET familia='VALVULA',       familia_nombre='Válvula Solenoide', caracteristica='110VAC', caracteristica_label='110 VAC', icono='valve' WHERE id='P041';
UPDATE public.catalogo_productos SET familia='MEDIDOR_FLUJO', familia_nombre='Medidor de Flujo',  caracteristica='25',     caracteristica_label='25 GPM',  icono='flow'  WHERE id='P042';

-- Redes
UPDATE public.catalogo_productos SET familia='SWITCH_POE',   familia_nombre='Switch PoE',           caracteristica='4',  caracteristica_label='4 puertos', icono='switch'  WHERE id='P050';
UPDATE public.catalogo_productos SET familia='SWITCH_POE',   familia_nombre='Switch PoE',           caracteristica='8',  caracteristica_label='8 puertos', icono='switch'  WHERE id='P051';
UPDATE public.catalogo_productos SET familia='ANTENA_CORTA', familia_nombre='Antena Corto Alcance', caracteristica='LBE',caracteristica_label='LiteBeam',  icono='antenna' WHERE id='P052';
UPDATE public.catalogo_productos SET familia='ANTENA_LARGA', familia_nombre='Antena Largo Alcance', caracteristica='PBM',caracteristica_label='PowerBeam', icono='antenna' WHERE id='P053';
UPDATE public.catalogo_productos SET familia='ANTENA_OMNI',  familia_nombre='Antena Omni',          caracteristica='AMO',caracteristica_label='AMO 360°',  icono='antenna' WHERE id='P054';

-- Energía
UPDATE public.catalogo_productos SET familia='KIT_SOLAR', familia_nombre='Kit Solar', caracteristica='1', caracteristica_label='1 panel',  icono='solar'   WHERE id='P060';
UPDATE public.catalogo_productos SET familia='KIT_SOLAR', familia_nombre='Kit Solar', caracteristica='2', caracteristica_label='2 paneles', icono='solar'  WHERE id='P061';
UPDATE public.catalogo_productos SET familia='UPS',       familia_nombre='UPS',       caracteristica='1500', caracteristica_label='1500 VA', icono='battery' WHERE id='P062';

-- Gabinetes
UPDATE public.catalogo_productos SET familia='GABINETE_INT', familia_nombre='Caja Metálica',       caracteristica='100X80', caracteristica_label='100×80 cm', icono='cabinet' WHERE id='P070';
UPDATE public.catalogo_productos SET familia='GABINETE_INT', familia_nombre='Caja Metálica',       caracteristica='60X40',  caracteristica_label='60×40 cm',  icono='cabinet' WHERE id='P071';
UPDATE public.catalogo_productos SET familia='GABINETE_EXT', familia_nombre='Gabinete Exterior',   caracteristica='IP65',   caracteristica_label='IP65',      icono='cabinet' WHERE id='P072';

-- CCTV
UPDATE public.catalogo_productos SET familia='CAMARA',     familia_nombre='Cámara IP',       caracteristica='2MP', caracteristica_label='2 MP Bala',  icono='camera'  WHERE id='P080';
UPDATE public.catalogo_productos SET familia='LIC_CAMARA', familia_nombre='Licencia Cámara', caracteristica='STD', caracteristica_label='Por canal',  icono='license' WHERE id='P081';
UPDATE public.catalogo_productos SET familia='SERVIDOR',   familia_nombre='Servidor Virtual',caracteristica='STD', caracteristica_label='Estándar',   icono='server'  WHERE id='P082';

-- Accesorios
UPDATE public.catalogo_productos SET familia='CAJA_UNIONES', familia_nombre='Caja de Uniones',     caracteristica='STD', caracteristica_label='Estándar', icono='box'    WHERE id='P090';
UPDATE public.catalogo_productos SET familia='ADECUACION',   familia_nombre='Adecuación de Sensor',caracteristica='STD', caracteristica_label='Servicio', icono='wrench' WHERE id='P091';

-- 5. Verificación
SELECT 'Familias creadas' AS info, COUNT(*)::TEXT FROM public.familias_productos
UNION ALL
SELECT 'Productos con familia asignada', COUNT(*)::TEXT FROM public.catalogo_productos WHERE familia IS NOT NULL
UNION ALL
SELECT 'Productos sin familia (error)', COUNT(*)::TEXT FROM public.catalogo_productos WHERE familia IS NULL AND activo = true;
