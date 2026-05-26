/* ============================================================
   MOTOR DE CÁLCULO — Aplica recetas a cada línea
   ============================================================ */

/**
 * Calcula el costo y PVP de una línea de cotización aplicando todas las recetas.
 * 
 * @param {Object} linea - Línea agregada por el ingeniero
 *   { producto_id, cantidad, altura_mayor_3m, m_cable_instr, m_cable_datos, 
 *     m_cable_elec, tipo_tubo, m_tubo, ubicacion, margen_pct (opcional override) }
 * @returns {Object} { costos detallados + pvp final }
 */
function calcularLinea(linea) {
  const producto = CATALOGO.find(p => p.id === linea.producto_id);
  if (!producto) return null;

  const cant = Number(linea.cantidad) || 1;

  // 1. COSTO DEL EQUIPO
  const costo_equipo = producto.costo * cant;

  // 2. COSTO DE CABLE (instrumentación, datos, eléctrico)
  const cable_instr = RECETAS_CABLE[linea.cable_instr || 'NINGUNO'] || RECETAS_CABLE.NINGUNO;
  const cable_datos = RECETAS_CABLE[linea.cable_datos || 'NINGUNO'] || RECETAS_CABLE.NINGUNO;
  const cable_elec  = RECETAS_CABLE[linea.cable_elec  || 'NINGUNO'] || RECETAS_CABLE.NINGUNO;

  const costo_cable_instr = cable_instr.costo_m * (Number(linea.m_cable_instr) || 0);
  const costo_cable_datos = cable_datos.costo_m * (Number(linea.m_cable_datos) || 0);
  const costo_cable_elec  = cable_elec.costo_m  * (Number(linea.m_cable_elec)  || 0);
  const costo_cables = costo_cable_instr + costo_cable_datos + costo_cable_elec;

  // 3. COSTO DE TUBERÍA (ponderado, incluye accesorios)
  const tubo = RECETAS_TUBO[linea.tipo_tubo || 'NINGUNO'] || RECETAS_TUBO.NINGUNO;
  const costo_tubo = tubo.costo_m * (Number(linea.m_tubo) || 0);

  // 4. MANO DE OBRA (según categoría del producto + altura)
  const recetaMO = RECETAS_MANO_OBRA[producto.grupo] || RECETAS_MANO_OBRA.ACCESORIOS;
  const factor_alt = linea.altura_mayor_3m ? recetaMO.factor_altura : 1;
  const horas = recetaMO.horas_base * factor_alt * cant;
  const costo_mano_obra = horas * recetaMO.costo_hora;

  // 5. SUBTOTALES
  const costo_materiales = costo_cables + costo_tubo;
  const costo_total = costo_equipo + costo_materiales + costo_mano_obra;

  // 6. PVP (aplica margen)
  const margen = linea.margen_pct != null ? Number(linea.margen_pct) : PARAMETROS.margen_default;
  const pvp_total = costo_total / (1 - margen);
  const pvp_unitario = pvp_total / cant;

  return {
    producto,
    cantidad: cant,
    altura_mayor_3m: !!linea.altura_mayor_3m,
    desglose: {
      costo_equipo,
      costo_cable_instr,
      costo_cable_datos,
      costo_cable_elec,
      costo_tubo,
      costo_materiales,
      horas_mano_obra: horas,
      costo_mano_obra,
      costo_total,
    },
    margen_aplicado: margen,
    pvp_unitario,
    pvp_total,
    // Para mostrar en cotización al cliente:
    descripcion_completa: producto.nombre,
    cable_instr_info: cable_instr.nombre,
    cable_datos_info: cable_datos.nombre,
    cable_elec_info: cable_elec.nombre,
    tubo_info: tubo.nombre,
  };
}

/**
 * Calcula los totales de una cotización completa.
 * 
 * @param {Array} lineas - Array de líneas ya calculadas con calcularLinea()
 * @param {Array} adicionales - Array de costos adicionales agregados:
 *                              [{ id, codigo, nombre, categoria, unidad, cantidad, costo_unitario }, ...]
 *                              Estos son INTERNOS (van al costo antes del margen, NO se muestran al cliente)
 * @param {Object} opciones - { descuento_pct, plazo_renta_meses, margen_global }
 */
function calcularTotalesCotizacion(lineas, adicionales = [], opciones = {}) {
  const calculadas = lineas.map(l => l.calculo || calcularLinea(l));

  // === COSTOS BASE (de las líneas) ===
  const subtotal_equipos    = calculadas.reduce((s, c) => s + c.desglose.costo_equipo, 0);
  const subtotal_materiales = calculadas.reduce((s, c) => s + c.desglose.costo_materiales, 0);
  const subtotal_mano_obra  = calculadas.reduce((s, c) => s + c.desglose.costo_mano_obra, 0);

  // === COSTOS ADICIONALES (logística, indirectos, permisos, obra civil, imprevistos) ===
  // Agrupados por categoría para visualización interna
  const adicionales_por_cat = {};
  let costo_adicionales_total = 0;

  adicionales.forEach(a => {
    const cant = Number(a.cantidad) || 0;
    const cu = Number(a.costo_unitario) || 0;
    const total = cant * cu;
    costo_adicionales_total += total;

    if (!adicionales_por_cat[a.categoria]) {
      adicionales_por_cat[a.categoria] = { total: 0, items: [] };
    }
    adicionales_por_cat[a.categoria].total += total;
    adicionales_por_cat[a.categoria].items.push({ ...a, cantidad: cant, costo_unitario: cu, total });
  });

  // Costo total INTERNO (incluye todo: equipos, mat, MO, logística, indirectos, especiales)
  const costo_total = subtotal_equipos + subtotal_materiales + subtotal_mano_obra + costo_adicionales_total;

  // === PVP (aplica margen sobre el costo total interno) ===
  // PVP = Costo / (1 - margen)
  // Cada línea ya tiene su margen aplicado individualmente.
  // Los adicionales heredan el margen global del proyecto.
  const margen_global = opciones.margen_global != null ? Number(opciones.margen_global) : PARAMETROS.margen_default;
  const pvp_lineas = calculadas.reduce((s, c) => s + c.pvp_total, 0);
  const pvp_adicionales = costo_adicionales_total > 0 ? costo_adicionales_total / (1 - margen_global) : 0;

  const pvp_subtotal = pvp_lineas + pvp_adicionales;

  // === DESCUENTO COMERCIAL ===
  const descuento_pct = Number(opciones.descuento_pct) || 0;
  const monto_descuento = pvp_subtotal * (descuento_pct / 100);
  const pvp_con_descuento = pvp_subtotal - monto_descuento;

  // === LO QUE VE EL CLIENTE (formato PDF Langosmar) ===
  // En la cotización al cliente se descompone como Equipos / Materiales / MO,
  // donde Materiales y MO ya tienen los costos adicionales prorrateados internamente.
  // Esto es solo visualización: el cliente ve un total limpio sin ver logística/viáticos.
  const cliente_equipos    = subtotal_equipos    / (1 - margen_global);
  // Los adicionales se reparten proporcionalmente entre Materiales y MO según su origen lógico
  const adic_a_materiales = (adicionales_por_cat['LOGISTICA']?.total || 0) +
                            (adicionales_por_cat['OBRA_CIVIL']?.total || 0) * 0.5 +
                            (adicionales_por_cat['IMPREVISTOS']?.total || 0) * 0.5 +
                            (adicionales_por_cat['PERMISOS']?.total || 0);
  const adic_a_mano_obra  = (adicionales_por_cat['INDIRECTOS']?.total || 0) +
                            (adicionales_por_cat['OBRA_CIVIL']?.total || 0) * 0.5 +
                            (adicionales_por_cat['IMPREVISTOS']?.total || 0) * 0.5 +
                            (adicionales_por_cat['GARANTIA']?.total || 0) +
                            (adicionales_por_cat['CAPACITACION']?.total || 0);

  const cliente_materiales = (subtotal_materiales + adic_a_materiales) / (1 - margen_global);
  const cliente_mano_obra  = (subtotal_mano_obra  + adic_a_mano_obra)  / (1 - margen_global);

  // === IMPUESTOS Y TOTAL ===
  const iva = pvp_con_descuento * PARAMETROS.iva;
  const total = pvp_con_descuento + iva;

  // === RENTA MENSUAL (si se ofrece como renta) ===
  const plazo_meses = Number(opciones.plazo_renta_meses) || PARAMETROS.plazo_renta_meses_default;
  const renta_mensual = (total / plazo_meses) * 1.10;

  return {
    // Costos internos
    subtotal_equipos,
    subtotal_materiales,
    subtotal_mano_obra,
    costo_adicionales_total,
    adicionales_por_cat,
    costo_total,
    margen_global,

    // Precios de venta
    pvp_lineas,
    pvp_adicionales,
    pvp_subtotal,
    descuento_pct,
    monto_descuento,
    pvp_con_descuento,

    // Vista cliente (descompuesta como en el PDF)
    cliente: {
      equipos: cliente_equipos,
      materiales: cliente_materiales,
      mano_obra: cliente_mano_obra,
      subtotal: cliente_equipos + cliente_materiales + cliente_mano_obra,
    },

    // Final
    iva_pct: PARAMETROS.iva,
    iva,
    total,
    renta_mensual,
    plazo_meses,
    margen_efectivo: costo_total > 0 ? (1 - costo_total / pvp_con_descuento) : 0,
  };
}

/**
 * Formato de moneda en USD.
 */
function fmtMoney(n) {
  if (n == null || isNaN(n)) return '$0,00';
  return '$' + Number(n).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  if (n == null || isNaN(n)) return '0%';
  return (Number(n) * 100).toFixed(1) + '%';
}
