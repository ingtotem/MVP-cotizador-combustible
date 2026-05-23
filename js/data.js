/* ============================================================
   DATOS DE MUESTRA — CATÁLOGO Y RECETAS
   Estos datos viven en memoria ahora pero después migran a Supabase.
   Estructura idéntica a la que tendrán las tablas.
   ============================================================ */

// CATÁLOGO DE PRODUCTOS
// Extraído del análisis de los Excel y PDFs de cotización
// Estructura: { id, sku, nombre, marca, modelo, grupo, unidad, costo, pvp }
const CATALOGO = [
  // ─── SENSORES ───
  { id: 'P001', sku: 'TG-SEN-CAP-1500', nombre: 'Sensor Capacitivo 1500 mm', marca: 'TOTEM GAS', modelo: 'CAP-1500', grupo: 'SENSORES', unidad: 'UN', costo: 96.55, pvp: 160.91 },
  { id: 'P002', sku: 'TG-SEN-MAG-2250', nombre: 'Sensor Magnetostrictivo 2250 mm', marca: 'TOTEM GAS', modelo: 'MAG-2250', grupo: 'SENSORES', unidad: 'UN', costo: 320.85, pvp: 534.75 },
  { id: 'P003', sku: 'TG-SEN-MAG-2500', nombre: 'Sensor Magnetostrictivo 2500 mm', marca: 'TOTEM GAS', modelo: 'MAG-2500', grupo: 'SENSORES', unidad: 'UN', costo: 335.40, pvp: 559.00 },
  { id: 'P004', sku: 'TG-SEN-MAG-3250', nombre: 'Sensor Magnetostrictivo 3250 mm', marca: 'TOTEM GAS', modelo: 'MAG-3250', grupo: 'SENSORES', unidad: 'UN', costo: 348.85, pvp: 581.42 },
  { id: 'P005', sku: 'TG-SEN-RAD-GUI', nombre: 'Sensor de Radar Guiado para Diésel', marca: 'TOTEM GAS', modelo: 'RAD-GUI-01', grupo: 'SENSORES', unidad: 'UN', costo: 720.00, pvp: 1200.00 },

  // ─── UNIDADES DE COMUNICACIÓN ───
  { id: 'P010', sku: 'TG-UTN-CAP', nombre: 'Unidad de Transmisión a Nube p/ Sensor Capacitivo', marca: 'TOTEM GAS', modelo: 'UTN-CAP', grupo: 'COMUNICACION', unidad: 'UN', costo: 272.73, pvp: 454.55 },
  { id: 'P011', sku: 'TG-UTN-MAG', nombre: 'Unidad de Transmisión a Nube p/ Sensor Magnetostrictivo', marca: 'TOTEM GAS', modelo: 'UTN-MAG', grupo: 'COMUNICACION', unidad: 'UN', costo: 381.82, pvp: 636.36 },
  { id: 'P012', sku: 'TG-UTN-RAD', nombre: 'Unidad de Transmisión a Nube p/ Sensor Radar', marca: 'TOTEM GAS', modelo: 'UTN-RAD', grupo: 'COMUNICACION', unidad: 'UN', costo: 420.00, pvp: 700.00 },

  // ─── CONTROLADORES DE DESPACHO ───
  { id: 'P020', sku: 'TG-CTRL-PED-1M', nombre: 'Controlador de Suministro Pedestal 1 Manguera', marca: 'TOTEM GAS', modelo: 'PED-1M', grupo: 'CONTROLADORES', unidad: 'UN', costo: 2738.57, pvp: 4564.29 },
  { id: 'P021', sku: 'TG-CTRL-PED-2M', nombre: 'Controlador de Suministro Pedestal 2 Mangueras', marca: 'TOTEM GAS', modelo: 'PED-2M', grupo: 'CONTROLADORES', unidad: 'UN', costo: 3850.00, pvp: 6420.00 },
  { id: 'P022', sku: 'TG-CTRL-MOV', nombre: 'Controlador de Suministro Móvil', marca: 'TOTEM GAS', modelo: 'MOV-01', grupo: 'CONTROLADORES', unidad: 'UN', costo: 1881.43, pvp: 3135.71 },

  // ─── RFID / NOZZLE ───
  { id: 'P030', sku: 'TG-NOZ-RX', nombre: 'Receptor de Nozzle RFID', marca: 'TOTEM GAS', modelo: 'NOZ-RX', grupo: 'RFID', unidad: 'UN', costo: 511.05, pvp: 851.75 },
  { id: 'P031', sku: 'TG-NOZ-PIS', nombre: 'Lector de Pistola RFID', marca: 'TOTEM GAS', modelo: 'NOZ-PIS', grupo: 'RFID', unidad: 'UN', costo: 382.32, pvp: 637.20 },
  { id: 'P032', sku: 'TG-NOZ-TAG', nombre: 'Tag RFID Vehicular', marca: 'TOTEM GAS', modelo: 'TAG-V1', grupo: 'RFID', unidad: 'UN', costo: 9.00, pvp: 15.00 },

  // ─── VÁLVULAS Y MEDIDORES ───
  { id: 'P040', sku: 'PIUSI-VS-1-12VDC', nombre: 'Válvula Solenoide NC 1" 12VDC para Diésel', marca: 'PIUSI', modelo: 'VS-1-12VDC', grupo: 'INSTRUMENTACION', unidad: 'UN', costo: 573.38, pvp: 955.64 },
  { id: 'P041', sku: 'PIUSI-VS-1-110VAC', nombre: 'Válvula Solenoide NC 1" 110VAC para Diésel', marca: 'PIUSI', modelo: 'VS-1-110VAC', grupo: 'INSTRUMENTACION', unidad: 'UN', costo: 653.24, pvp: 1088.73 },
  { id: 'P042', sku: 'PIUSI-MDF-1-25GPM', nombre: 'Medidor de Flujo Diésel 1" 25 GPM con pulsos', marca: 'PIUSI', modelo: 'MDF-1-25', grupo: 'INSTRUMENTACION', unidad: 'UN', costo: 911.13, pvp: 1518.55 },

  // ─── REDES Y CONECTIVIDAD ───
  { id: 'P050', sku: 'RJ-SW-POE-4P', nombre: 'Switch PoE 4 Puertos', marca: 'RUIJIE', modelo: 'RG-ES205GC-P', grupo: 'REDES', unidad: 'UN', costo: 52.61, pvp: 87.69 },
  { id: 'P051', sku: 'RJ-SW-POE-8P', nombre: 'Switch PoE 8 Puertos', marca: 'RUIJIE', modelo: 'RG-ES209GC-P', grupo: 'REDES', unidad: 'UN', costo: 87.65, pvp: 146.08 },
  { id: 'P052', sku: 'UBQ-LBE-5AC', nombre: 'Antena Corto Alcance LiteBeam 5AC', marca: 'UBIQUITI', modelo: 'LBE-5AC-GEN2', grupo: 'REDES', unidad: 'UN', costo: 122.73, pvp: 204.55 },
  { id: 'P053', sku: 'UBQ-PBM-300', nombre: 'Antena Largo Alcance PowerBeam M2-300', marca: 'UBIQUITI', modelo: 'POWER-BEAM-M2-300', grupo: 'REDES', unidad: 'UN', costo: 168.00, pvp: 280.00 },
  { id: 'P054', sku: 'UBQ-OMNI-AMO', nombre: 'Antena Omnidireccional 360° AMO-2G13', marca: 'UBIQUITI', modelo: 'AMO-2G13', grupo: 'REDES', unidad: 'UN', costo: 165.00, pvp: 275.00 },

  // ─── ENERGÍA ───
  { id: 'P060', sku: 'KIT-SOL-1P', nombre: 'Kit Solar 1 Panel (1 panel, 2 bat, 1 ctrl, 1 inv, bases)', marca: 'TOTEM', modelo: 'KSOL-1P', grupo: 'ENERGIA', unidad: 'UN', costo: 1365.10, pvp: 2275.16 },
  { id: 'P061', sku: 'KIT-SOL-2P', nombre: 'Kit Solar 2 Paneles (2 paneles, 4 bat, 1 ctrl, 1 inv, bases)', marca: 'TOTEM', modelo: 'KSOL-2P', grupo: 'ENERGIA', unidad: 'UN', costo: 1754.50, pvp: 2924.16 },
  { id: 'P062', sku: 'UPS-1500VA', nombre: 'UPS 1500 VA Online', marca: 'APC', modelo: 'SMT1500', grupo: 'ENERGIA', unidad: 'UN', costo: 295.00, pvp: 491.67 },

  // ─── GABINETES / CAJAS ───
  { id: 'P070', sku: 'CAJA-MET-100X80', nombre: 'Caja Metálica Doble Fondo 100x80', marca: 'GENÉRICO', modelo: 'CMDF-100x80', grupo: 'GABINETES', unidad: 'UN', costo: 204.68, pvp: 341.14 },
  { id: 'P071', sku: 'CAJA-MET-60X40', nombre: 'Caja Metálica 60x40', marca: 'GENÉRICO', modelo: 'CM-60x40', grupo: 'GABINETES', unidad: 'UN', costo: 42.78, pvp: 71.30 },
  { id: 'P072', sku: 'CAJA-CONC-EXT', nombre: 'Gabinete Concentrador Exterior IP65', marca: 'GENÉRICO', modelo: 'GCE-IP65', grupo: 'GABINETES', unidad: 'UN', costo: 280.00, pvp: 466.67 },

  // ─── VIDEOVIGILANCIA ───
  { id: 'P080', sku: 'DAHUA-BALA-2MP', nombre: 'Cámara Bala Fija 2MP IP67 con audio', marca: 'DAHUA', modelo: 'DH-IPC-HFW1239TL1-A-IL', grupo: 'CCTV', unidad: 'UN', costo: 47.24, pvp: 78.74 },
  { id: 'P081', sku: 'LIC-CAM', nombre: 'Licencia para Cámara (servidor)', marca: 'TOTEM', modelo: 'LIC-CAM', grupo: 'CCTV', unidad: 'UN', costo: 70.91, pvp: 118.18 },
  { id: 'P082', sku: 'SRV-VIRT', nombre: 'Servidor Virtual', marca: 'TOTEM', modelo: 'SRV-V01', grupo: 'CCTV', unidad: 'UN', costo: 57.13, pvp: 95.22 },

  // ─── ACCESORIOS ELÉCTRICOS / INSTRUMENTACIÓN ───
  { id: 'P090', sku: 'CJ-UNI-INST', nombre: 'Caja de Uniones para Sensor', marca: 'GENÉRICO', modelo: 'CU-INST', grupo: 'ACCESORIOS', unidad: 'UN', costo: 171.21, pvp: 285.35 },
  { id: 'P091', sku: 'ADEC-SEN', nombre: 'Adecuación de Sensor (servicio)', marca: 'TOTEM', modelo: 'ADEC', grupo: 'SERVICIOS', unidad: 'UN', costo: 187.50, pvp: 312.50 },
];

// ============================================================
// RECETA DE CABLE Y TUBO PONDERADO (de la pestaña Excel)
// Costo por metro lineal incluyendo todos los accesorios proporcionales
// Estos costos son CONFIGURABLES desde mantenimiento
// ============================================================

const RECETAS_TUBO = {
  'EMT_1_2':   { nombre: 'Tubo EMT 1/2"',   costo_m: 1.575, descripcion: 'Tubo + uniones + conectores + grapas + tornillos + tacos + cajas 4x4 + hojas sierra' },
  'EMT_3_4':   { nombre: 'Tubo EMT 3/4"',   costo_m: 2.180, descripcion: 'Tubo + accesorios ponderados' },
  'EMT_1':     { nombre: 'Tubo EMT 1"',     costo_m: 2.960, descripcion: 'Tubo + accesorios ponderados' },
  'PVC_1_2':   { nombre: 'Tubo PVC 1/2"',   costo_m: 0.360, descripcion: 'Tubo + conectores + grapas + tacos + cajas 4x4' },
  'PVC_3_4':   { nombre: 'Tubo PVC 3/4"',   costo_m: 0.520, descripcion: 'Tubo + accesorios ponderados' },
  'FUNDA_3_4': { nombre: 'Funda Sellada 3/4"', costo_m: 1.850, descripcion: 'Funda sellada con prensaestopas' },
  'NINGUNO':   { nombre: 'Sin tubería',     costo_m: 0,     descripcion: 'No requiere tubería' },
};

const RECETAS_CABLE = {
  'INST_3X18': { nombre: 'Cable Instrumentación 3x18 AWG',  costo_m: 1.45, tipo: 'instrumentacion' },
  'INST_4X18': { nombre: 'Cable Instrumentación 4x18 AWG',  costo_m: 1.90, tipo: 'instrumentacion' },
  'UTP_CAT6':  { nombre: 'Cable UTP Cat 6',                 costo_m: 0.65, tipo: 'datos' },
  'ELEC_3X12': { nombre: 'Cable Eléctrico 3x12 AWG TW',     costo_m: 2.15, tipo: 'electrico' },
  'ELEC_3X10': { nombre: 'Cable Eléctrico 3x10 AWG TW',     costo_m: 3.20, tipo: 'electrico' },
  'NINGUNO':   { nombre: 'Sin cable',                       costo_m: 0,    tipo: 'ninguno' },
};

// ============================================================
// RECETA DE MANO DE OBRA POR TIPO DE EQUIPO
// Define cuántas horas-hombre toma instalar cada tipo + factor altura
// ============================================================

const RECETAS_MANO_OBRA = {
  // Categoría: { horas_base, factor_altura_mayor_3m }
  'SENSORES':       { horas_base: 1.0, factor_altura: 1.7, costo_hora: 5.4125 },
  'COMUNICACION':   { horas_base: 1.3, factor_altura: 1.5, costo_hora: 5.4125 },
  'CONTROLADORES':  { horas_base: 8.0, factor_altura: 1.0, costo_hora: 25.00 },
  'RFID':           { horas_base: 2.0, factor_altura: 1.3, costo_hora: 5.4125 },
  'INSTRUMENTACION':{ horas_base: 2.0, factor_altura: 1.0, costo_hora: 8.66 },
  'REDES':          { horas_base: 1.0, factor_altura: 1.7, costo_hora: 5.4125 },
  'ENERGIA':        { horas_base: 8.0, factor_altura: 1.0, costo_hora: 7.04 },
  'GABINETES':      { horas_base: 1.5, factor_altura: 1.0, costo_hora: 5.4125 },
  'CCTV':           { horas_base: 1.0, factor_altura: 1.7, costo_hora: 5.4125 },
  'ACCESORIOS':     { horas_base: 0.5, factor_altura: 1.0, costo_hora: 5.4125 },
  'SERVICIOS':      { horas_base: 0,   factor_altura: 1.0, costo_hora: 0     },
};

// ============================================================
// PARÁMETROS GLOBALES (también configurables en mantenimiento)
// ============================================================

const PARAMETROS = {
  iva: 0.15,                    // 15% IVA Ecuador
  margen_default: 0.40,         // 40% margen por defecto
  validez_dias: 15,
  plazo_renta_meses_default: 48,
};

// ============================================================
// CATÁLOGO DE COSTOS ADICIONALES (Logística, Indirectos, Especiales)
// Cada ítem se cotiza con CANTIDAD × COSTO_UNITARIO
// Son INTERNOS: van al COSTO antes del margen. El cliente NO los ve por separado.
// Estructura: { id, codigo, nombre, categoria, unidad, costo_unitario_default }
// ============================================================

const COSTOS_ADICIONALES = [
  // ─── LOGÍSTICA ───
  { id: 'A001', codigo: 'LOG-MOV',     nombre: 'Movilización personal (transporte técnicos)', categoria: 'LOGISTICA',   unidad: 'viaje',     costo: 10.00 },
  { id: 'A002', codigo: 'LOG-CAMION',  nombre: 'Alquiler camioneta',                          categoria: 'LOGISTICA',   unidad: 'día',       costo: 60.00 },
  { id: 'A003', codigo: 'LOG-FLETE',   nombre: 'Flete (envío de equipos)',                    categoria: 'LOGISTICA',   unidad: 'viaje',     costo: 120.00 },
  { id: 'A004', codigo: 'LOG-COMB',    nombre: 'Combustible / peajes',                        categoria: 'LOGISTICA',   unidad: 'viaje',     costo: 30.00 },

  // ─── INDIRECTOS (viáticos del personal en obra) ───
  { id: 'A010', codigo: 'IND-ALIM',    nombre: 'Alimentación técnico',                        categoria: 'INDIRECTOS',  unidad: 'pers-día',  costo: 10.00 },
  { id: 'A011', codigo: 'IND-HOSP',    nombre: 'Hospedaje técnico',                           categoria: 'INDIRECTOS',  unidad: 'pers-noche',costo: 20.00 },
  { id: 'A012', codigo: 'IND-VIAT',    nombre: 'Viáticos adicionales',                        categoria: 'INDIRECTOS',  unidad: 'pers-día',  costo: 15.00 },

  // ─── PERMISOS Y TRÁMITES ───
  { id: 'A020', codigo: 'PER-MUNI',    nombre: 'Permiso municipal / trámite',                 categoria: 'PERMISOS',    unidad: 'trámite',   costo: 80.00 },
  { id: 'A021', codigo: 'PER-AMB',     nombre: 'Permiso ambiental',                           categoria: 'PERMISOS',    unidad: 'trámite',   costo: 150.00 },
  { id: 'A022', codigo: 'PER-BOMB',    nombre: 'Permiso bomberos',                            categoria: 'PERMISOS',    unidad: 'trámite',   costo: 60.00 },

  // ─── GARANTÍA Y CAPACITACIÓN ───
  { id: 'A030', codigo: 'GAR-EXT',     nombre: 'Garantía extendida (por año adicional)',      categoria: 'GARANTIA',    unidad: 'año',       costo: 250.00 },
  { id: 'A031', codigo: 'CAP-CLI',     nombre: 'Capacitación al cliente',                     categoria: 'CAPACITACION',unidad: 'sesión',    costo: 180.00 },
  { id: 'A032', codigo: 'CAP-MANUAL',  nombre: 'Manuales y documentación impresa',            categoria: 'CAPACITACION',unidad: 'set',       costo: 45.00 },

  // ─── OBRA CIVIL (de la pestaña Trabajos Especiales del Excel) ───
  { id: 'A040', codigo: 'OC-RES-GYP',  nombre: 'Corte y resane de gypsum (incluye materiales)',  categoria: 'OBRA_CIVIL', unidad: 'unid',  costo: 42.90 },
  { id: 'A041', codigo: 'OC-RES-ASF',  nombre: 'Corte y resane de asfalto (incluye materiales)', categoria: 'OBRA_CIVIL', unidad: 'mL',    costo: 8.85 },
  { id: 'A042', codigo: 'OC-RES-CEM',  nombre: 'Corte y resane de cemento (incluye materiales)', categoria: 'OBRA_CIVIL', unidad: 'mL',    costo: 7.12 },
  { id: 'A043', codigo: 'OC-EXC',      nombre: 'Excavación tierra/cascajo (incluye materiales)', categoria: 'OBRA_CIVIL', unidad: 'mL',    costo: 13.77 },
  { id: 'A044', codigo: 'OC-ADOQ',     nombre: 'Levantamiento de adoquín (incluye materiales)',  categoria: 'OBRA_CIVIL', unidad: 'm²',    costo: 12.53 },
  { id: 'A045', codigo: 'OC-PARED',    nombre: 'Corte y resane de pared (incluye materiales)',   categoria: 'OBRA_CIVIL', unidad: 'mL',    costo: 6.27 },
  { id: 'A046', codigo: 'OC-SOLD',     nombre: 'Trabajos de soldadura',                          categoria: 'OBRA_CIVIL', unidad: 'día',   costo: 117.00 },

  // ─── IMPREVISTOS Y OTROS ───
  { id: 'A050', codigo: 'IMP-TANQ',    nombre: 'Imprevistos por tanque (materiales+MO)',         categoria: 'IMPREVISTOS', unidad: 'tanque', costo: 200.00 },
  { id: 'A051', codigo: 'IMP-AFORO',   nombre: 'Aforo de tanque',                                categoria: 'IMPREVISTOS', unidad: 'tanque', costo: 250.00 },
  { id: 'A052', codigo: 'IMP-OTRO',    nombre: 'Otros imprevistos (editable)',                   categoria: 'IMPREVISTOS', unidad: 'unid',   costo: 0 },
];

