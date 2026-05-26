-- ============================================================
-- TOTEM · Cotizador de Control de Combustible
-- Datos iniciales — Etapa 2.3
-- ============================================================
--
-- Cómo usar:
-- 1. Asegúrate de haber ejecutado primero supabase_01_schema.sql
-- 2. Abre el SQL Editor de Supabase
-- 3. Pega TODO este archivo
-- 4. Click "Run"
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PARÁMETROS GLOBALES
-- ────────────────────────────────────────────────────────────

INSERT INTO public.parametros_globales (clave, valor, descripcion) VALUES
  ('iva',                       '0.15',  'IVA Ecuador 15%'),
  ('margen_default',            '0.40',  'Margen por defecto 40%'),
  ('validez_dias',              '15',    'Validez de la propuesta en días'),
  ('plazo_renta_meses_default', '48',    'Plazo de renta por defecto (meses)'),
  ('garantia_anios',            '1',     'Garantía estándar de equipos (años)'),
  ('tiempo_entrega_dias',       '90',    'Tiempo de entrega estándar (días)'),
  ('forma_pago_default',        '50% anticipo / 50% contraentrega', 'Forma de pago por defecto')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

-- ────────────────────────────────────────────────────────────
-- 2. RECETAS DE TUBERÍA
-- ────────────────────────────────────────────────────────────

INSERT INTO public.recetas_tubo (codigo, nombre, costo_m, descripcion) VALUES
  ('EMT_1_2',   'Tubo EMT 1/2"',         1.575, 'Tubo + uniones + conectores + grapas + tornillos + tacos + cajas 4x4 + hojas sierra'),
  ('EMT_3_4',   'Tubo EMT 3/4"',         2.180, 'Tubo + accesorios ponderados'),
  ('EMT_1',     'Tubo EMT 1"',           2.960, 'Tubo + accesorios ponderados'),
  ('PVC_1_2',   'Tubo PVC 1/2"',         0.360, 'Tubo + conectores + grapas + tacos + cajas 4x4'),
  ('PVC_3_4',   'Tubo PVC 3/4"',         0.520, 'Tubo + accesorios ponderados'),
  ('FUNDA_3_4', 'Funda Sellada 3/4"',    1.850, 'Funda sellada con prensaestopas'),
  ('NINGUNO',   'Sin tubería',           0,     'No requiere tubería')
ON CONFLICT (codigo) DO UPDATE SET costo_m = EXCLUDED.costo_m, nombre = EXCLUDED.nombre;

-- ────────────────────────────────────────────────────────────
-- 3. RECETAS DE CABLE
-- ────────────────────────────────────────────────────────────

INSERT INTO public.recetas_cable (codigo, nombre, tipo, costo_m) VALUES
  ('INST_3X18', 'Cable Instrumentación 3x18 AWG', 'instrumentacion', 1.45),
  ('INST_4X18', 'Cable Instrumentación 4x18 AWG', 'instrumentacion', 1.90),
  ('UTP_CAT6',  'Cable UTP Cat 6',                'datos',           0.65),
  ('ELEC_3X12', 'Cable Eléctrico 3x12 AWG TW',    'electrico',       2.15),
  ('ELEC_3X10', 'Cable Eléctrico 3x10 AWG TW',    'electrico',       3.20),
  ('NINGUNO',   'Sin cable',                      'ninguno',         0)
ON CONFLICT (codigo) DO UPDATE SET costo_m = EXCLUDED.costo_m, nombre = EXCLUDED.nombre;

-- ────────────────────────────────────────────────────────────
-- 4. RECETAS DE MANO DE OBRA
-- ────────────────────────────────────────────────────────────

INSERT INTO public.recetas_mano_obra (categoria, horas_base, factor_altura, costo_hora) VALUES
  ('SENSORES',        1.0, 1.7, 5.4125),
  ('COMUNICACION',    1.3, 1.5, 5.4125),
  ('CONTROLADORES',   8.0, 1.0, 25.00),
  ('RFID',            2.0, 1.3, 5.4125),
  ('INSTRUMENTACION', 2.0, 1.0, 8.66),
  ('REDES',           1.0, 1.7, 5.4125),
  ('ENERGIA',         8.0, 1.0, 7.04),
  ('GABINETES',       1.5, 1.0, 5.4125),
  ('CCTV',            1.0, 1.7, 5.4125),
  ('ACCESORIOS',      0.5, 1.0, 5.4125),
  ('SERVICIOS',       0,   1.0, 0)
ON CONFLICT (categoria) DO UPDATE SET
  horas_base = EXCLUDED.horas_base,
  factor_altura = EXCLUDED.factor_altura,
  costo_hora = EXCLUDED.costo_hora;

-- ────────────────────────────────────────────────────────────
-- 5. CATÁLOGO DE PRODUCTOS (los 32 de muestra)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.catalogo_productos (id, sku, nombre, marca, modelo, grupo, unidad, costo, pvp) VALUES
  -- SENSORES
  ('P001', 'TG-SEN-CAP-1500',   'Sensor Capacitivo 1500 mm',                 'TOTEM GAS', 'CAP-1500',  'SENSORES',        'UN',  96.55,  160.91),
  ('P002', 'TG-SEN-MAG-2250',   'Sensor Magnetostrictivo 2250 mm',           'TOTEM GAS', 'MAG-2250',  'SENSORES',        'UN', 320.85,  534.75),
  ('P003', 'TG-SEN-MAG-2500',   'Sensor Magnetostrictivo 2500 mm',           'TOTEM GAS', 'MAG-2500',  'SENSORES',        'UN', 335.40,  559.00),
  ('P004', 'TG-SEN-MAG-3250',   'Sensor Magnetostrictivo 3250 mm',           'TOTEM GAS', 'MAG-3250',  'SENSORES',        'UN', 348.85,  581.42),
  ('P005', 'TG-SEN-RAD-GUI',    'Sensor de Radar Guiado para Diésel',        'TOTEM GAS', 'RAD-GUI-01','SENSORES',        'UN', 720.00, 1200.00),

  -- COMUNICACION
  ('P010', 'TG-UTN-CAP',        'Unidad de Transmisión a Nube p/ Sensor Capacitivo',        'TOTEM GAS', 'UTN-CAP',   'COMUNICACION', 'UN', 272.73, 454.55),
  ('P011', 'TG-UTN-MAG',        'Unidad de Transmisión a Nube p/ Sensor Magnetostrictivo',  'TOTEM GAS', 'UTN-MAG',   'COMUNICACION', 'UN', 381.82, 636.36),
  ('P012', 'TG-UTN-RAD',        'Unidad de Transmisión a Nube p/ Sensor Radar',             'TOTEM GAS', 'UTN-RAD',   'COMUNICACION', 'UN', 420.00, 700.00),

  -- CONTROLADORES
  ('P020', 'TG-CTRL-PED-1M',    'Controlador de Suministro Pedestal 1 Manguera',  'TOTEM GAS', 'PED-1M', 'CONTROLADORES', 'UN', 2738.57, 4564.29),
  ('P021', 'TG-CTRL-PED-2M',    'Controlador de Suministro Pedestal 2 Mangueras', 'TOTEM GAS', 'PED-2M', 'CONTROLADORES', 'UN', 3850.00, 6420.00),
  ('P022', 'TG-CTRL-MOV',       'Controlador de Suministro Móvil',                'TOTEM GAS', 'MOV-01', 'CONTROLADORES', 'UN', 1881.43, 3135.71),

  -- RFID
  ('P030', 'TG-NOZ-RX',         'Receptor de Nozzle RFID',                'TOTEM GAS', 'NOZ-RX',  'RFID', 'UN', 511.05, 851.75),
  ('P031', 'TG-NOZ-PIS',        'Lector de Pistola RFID',                 'TOTEM GAS', 'NOZ-PIS', 'RFID', 'UN', 382.32, 637.20),
  ('P032', 'TG-NOZ-TAG',        'Tag RFID Vehicular',                     'TOTEM GAS', 'TAG-V1',  'RFID', 'UN',   9.00,  15.00),

  -- INSTRUMENTACION
  ('P040', 'PIUSI-VS-1-12VDC',  'Válvula Solenoide NC 1" 12VDC para Diésel',    'PIUSI', 'VS-1-12VDC',   'INSTRUMENTACION', 'UN', 573.38,  955.64),
  ('P041', 'PIUSI-VS-1-110VAC', 'Válvula Solenoide NC 1" 110VAC para Diésel',   'PIUSI', 'VS-1-110VAC',  'INSTRUMENTACION', 'UN', 653.24, 1088.73),
  ('P042', 'PIUSI-MDF-1-25GPM', 'Medidor de Flujo Diésel 1" 25 GPM con pulsos', 'PIUSI', 'MDF-1-25',     'INSTRUMENTACION', 'UN', 911.13, 1518.55),

  -- REDES
  ('P050', 'RJ-SW-POE-4P',      'Switch PoE 4 Puertos',                       'RUIJIE',   'RG-ES205GC-P',       'REDES', 'UN',  52.61,  87.69),
  ('P051', 'RJ-SW-POE-8P',      'Switch PoE 8 Puertos',                       'RUIJIE',   'RG-ES209GC-P',       'REDES', 'UN',  87.65, 146.08),
  ('P052', 'UBQ-LBE-5AC',       'Antena Corto Alcance LiteBeam 5AC',          'UBIQUITI', 'LBE-5AC-GEN2',       'REDES', 'UN', 122.73, 204.55),
  ('P053', 'UBQ-PBM-300',       'Antena Largo Alcance PowerBeam M2-300',      'UBIQUITI', 'POWER-BEAM-M2-300',  'REDES', 'UN', 168.00, 280.00),
  ('P054', 'UBQ-OMNI-AMO',      'Antena Omnidireccional 360° AMO-2G13',       'UBIQUITI', 'AMO-2G13',           'REDES', 'UN', 165.00, 275.00),

  -- ENERGIA
  ('P060', 'KIT-SOL-1P',        'Kit Solar 1 Panel (1 panel, 2 bat, 1 ctrl, 1 inv, bases)',     'TOTEM', 'KSOL-1P',  'ENERGIA', 'UN', 1365.10, 2275.16),
  ('P061', 'KIT-SOL-2P',        'Kit Solar 2 Paneles (2 paneles, 4 bat, 1 ctrl, 1 inv, bases)', 'TOTEM', 'KSOL-2P',  'ENERGIA', 'UN', 1754.50, 2924.16),
  ('P062', 'UPS-1500VA',        'UPS 1500 VA Online',                                            'APC',   'SMT1500',  'ENERGIA', 'UN',  295.00,  491.67),

  -- GABINETES
  ('P070', 'CAJA-MET-100X80',   'Caja Metálica Doble Fondo 100x80',           'GENÉRICO', 'CMDF-100x80', 'GABINETES', 'UN', 204.68, 341.14),
  ('P071', 'CAJA-MET-60X40',    'Caja Metálica 60x40',                        'GENÉRICO', 'CM-60x40',    'GABINETES', 'UN',  42.78,  71.30),
  ('P072', 'CAJA-CONC-EXT',     'Gabinete Concentrador Exterior IP65',        'GENÉRICO', 'GCE-IP65',    'GABINETES', 'UN', 280.00, 466.67),

  -- CCTV
  ('P080', 'DAHUA-BALA-2MP',    'Cámara Bala Fija 2MP IP67 con audio',  'DAHUA', 'DH-IPC-HFW1239TL1-A-IL', 'CCTV', 'UN', 47.24,  78.74),
  ('P081', 'LIC-CAM',           'Licencia para Cámara (servidor)',      'TOTEM', 'LIC-CAM',                'CCTV', 'UN', 70.91, 118.18),
  ('P082', 'SRV-VIRT',          'Servidor Virtual',                     'TOTEM', 'SRV-V01',                'CCTV', 'UN', 57.13,  95.22),

  -- ACCESORIOS / SERVICIOS
  ('P090', 'CJ-UNI-INST',       'Caja de Uniones para Sensor',          'GENÉRICO', 'CU-INST', 'ACCESORIOS', 'UN', 171.21, 285.35),
  ('P091', 'ADEC-SEN',          'Adecuación de Sensor (servicio)',      'TOTEM',    'ADEC',    'SERVICIOS',  'UN', 187.50, 312.50)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, marca = EXCLUDED.marca, modelo = EXCLUDED.modelo,
  grupo = EXCLUDED.grupo, costo = EXCLUDED.costo, pvp = EXCLUDED.pvp,
  actualizado_en = now();

-- ────────────────────────────────────────────────────────────
-- 6. CATÁLOGO DE COSTOS ADICIONALES (Requerimientos)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.costos_adicionales_catalogo (id, codigo, nombre, categoria, unidad, costo) VALUES
  -- LOGÍSTICA
  ('A001', 'LOG-MOV',     'Movilización personal (transporte técnicos)', 'LOGISTICA',   'viaje',       10.00),
  ('A002', 'LOG-CAMION',  'Alquiler camioneta',                          'LOGISTICA',   'día',         60.00),
  ('A003', 'LOG-FLETE',   'Flete (envío de equipos)',                    'LOGISTICA',   'viaje',      120.00),
  ('A004', 'LOG-COMB',    'Combustible / peajes',                        'LOGISTICA',   'viaje',       30.00),

  -- INDIRECTOS
  ('A010', 'IND-ALIM',    'Alimentación técnico',                        'INDIRECTOS',  'pers-día',    10.00),
  ('A011', 'IND-HOSP',    'Hospedaje técnico',                           'INDIRECTOS',  'pers-noche',  20.00),
  ('A012', 'IND-VIAT',    'Viáticos adicionales',                        'INDIRECTOS',  'pers-día',    15.00),

  -- PERMISOS
  ('A020', 'PER-MUNI',    'Permiso municipal / trámite',                 'PERMISOS',    'trámite',     80.00),
  ('A021', 'PER-AMB',     'Permiso ambiental',                           'PERMISOS',    'trámite',    150.00),
  ('A022', 'PER-BOMB',    'Permiso bomberos',                            'PERMISOS',    'trámite',     60.00),

  -- GARANTÍA Y CAPACITACIÓN
  ('A030', 'GAR-EXT',     'Garantía extendida (por año adicional)',      'GARANTIA',     'año',       250.00),
  ('A031', 'CAP-CLI',     'Capacitación al cliente',                     'CAPACITACION', 'sesión',    180.00),
  ('A032', 'CAP-MANUAL',  'Manuales y documentación impresa',            'CAPACITACION', 'set',        45.00),

  -- OBRA CIVIL
  ('A040', 'OC-RES-GYP',  'Corte y resane de gypsum (incluye materiales)',  'OBRA_CIVIL', 'unid', 42.90),
  ('A041', 'OC-RES-ASF',  'Corte y resane de asfalto (incluye materiales)', 'OBRA_CIVIL', 'mL',    8.85),
  ('A042', 'OC-RES-CEM',  'Corte y resane de cemento (incluye materiales)', 'OBRA_CIVIL', 'mL',    7.12),
  ('A043', 'OC-EXC',      'Excavación tierra/cascajo (incluye materiales)', 'OBRA_CIVIL', 'mL',   13.77),
  ('A044', 'OC-ADOQ',     'Levantamiento de adoquín (incluye materiales)',  'OBRA_CIVIL', 'm²',   12.53),
  ('A045', 'OC-PARED',    'Corte y resane de pared (incluye materiales)',   'OBRA_CIVIL', 'mL',    6.27),
  ('A046', 'OC-SOLD',     'Trabajos de soldadura',                          'OBRA_CIVIL', 'día', 117.00),

  -- IMPREVISTOS
  ('A050', 'IMP-TANQ',    'Imprevistos por tanque (materiales+MO)',         'IMPREVISTOS', 'tanque', 200.00),
  ('A051', 'IMP-AFORO',   'Aforo de tanque',                                'IMPREVISTOS', 'tanque', 250.00),
  ('A052', 'IMP-OTRO',    'Otros imprevistos (editable)',                   'IMPREVISTOS', 'unid',     0)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria,
  unidad = EXCLUDED.unidad, costo = EXCLUDED.costo,
  actualizado_en = now();

-- ────────────────────────────────────────────────────────────
-- 7. GRUPOS DE REQUERIMIENTOS (los 3 botones del ingeniero)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.requerimientos_grupos (codigo, nombre, descripcion, icono, categorias, orden) VALUES
  ('LOGISTICA',  'Logística',                  'Movilización de personal, alquiler de transporte, viáticos, hospedaje', '🚚', ARRAY['LOGISTICA', 'INDIRECTOS'], 1),
  ('OBRA_CIVIL', 'Obra Civil',                 'Resane, excavación, soldadura, trabajos civiles necesarios para la instalación', '🧱', ARRAY['OBRA_CIVIL'], 2),
  ('ESPECIALES', 'Requerimientos Especiales',  'Permisos, garantías, capacitación, imprevistos por tanque, aforos', '⚙', ARRAY['PERMISOS', 'GARANTIA', 'CAPACITACION', 'IMPREVISTOS'], 3)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion,
  icono = EXCLUDED.icono, categorias = EXCLUDED.categorias,
  orden = EXCLUDED.orden;

-- ────────────────────────────────────────────────────────────
-- VERIFICACIÓN: contar registros insertados
-- ────────────────────────────────────────────────────────────

SELECT 'Parámetros globales' AS tabla, COUNT(*)::TEXT AS registros FROM public.parametros_globales
UNION ALL SELECT 'Recetas de tubo',         COUNT(*)::TEXT FROM public.recetas_tubo
UNION ALL SELECT 'Recetas de cable',        COUNT(*)::TEXT FROM public.recetas_cable
UNION ALL SELECT 'Recetas de mano de obra', COUNT(*)::TEXT FROM public.recetas_mano_obra
UNION ALL SELECT 'Catálogo de productos',   COUNT(*)::TEXT FROM public.catalogo_productos
UNION ALL SELECT 'Costos adicionales',      COUNT(*)::TEXT FROM public.costos_adicionales_catalogo
UNION ALL SELECT 'Grupos requerimientos',   COUNT(*)::TEXT FROM public.requerimientos_grupos;

-- Resultado esperado:
-- Parámetros globales:     7
-- Recetas de tubo:         7
-- Recetas de cable:        6
-- Recetas de mano de obra: 11
-- Catálogo de productos:   32
-- Costos adicionales:      24
-- Grupos requerimientos:   3
