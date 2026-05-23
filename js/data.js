/* ============================================================
   DATOS — Carga desde Supabase
   
   Estas variables se llenan al cargar la página llamando a
   cargarDatosBase(). Cuando ya están cargadas, el resto del
   código las usa exactamente igual que antes (arrays/objetos
   con la misma estructura que tenían hardcoded).
   ============================================================ */

let CATALOGO = [];                // [{ id, sku, nombre, marca, modelo, grupo, unidad, costo, pvp }, ...]
let RECETAS_TUBO = {};            // { 'EMT_1_2': { nombre, costo_m, descripcion }, ... }
let RECETAS_CABLE = {};           // { 'INST_3X18': { nombre, tipo, costo_m }, ... }
let RECETAS_MANO_OBRA = {};       // { 'SENSORES': { horas_base, factor_altura, costo_hora }, ... }
let COSTOS_ADICIONALES = [];      // [{ id, codigo, nombre, categoria, unidad, costo }, ...]
let REQUERIMIENTOS_GRUPOS = {};   // { 'LOGISTICA': { nombre, descripcion, icono, categorias }, ... }
let PARAMETROS = {                // valores por defecto antes de cargar
  iva: 0.15,
  margen_default: 0.40,
  validez_dias: 15,
  plazo_renta_meses_default: 48,
};

let DATOS_BASE_CARGADOS = false;

/**
 * Carga todos los datos base desde Supabase.
 * Se llama una sola vez al cargar cada página.
 * Returns: true si todo cargó bien, false si hubo error.
 */
async function cargarDatosBase() {
  if (DATOS_BASE_CARGADOS) return true;

  try {
    // Paralelo: todas las tablas pequeñas a la vez
    const [productos, tubos, cables, mo, adic, grupos, params] = await Promise.all([
      supabase.from('catalogo_productos').select('*').eq('activo', true).order('grupo, nombre'),
      supabase.from('recetas_tubo').select('*').eq('activo', true),
      supabase.from('recetas_cable').select('*').eq('activo', true),
      supabase.from('recetas_mano_obra').select('*'),
      supabase.from('costos_adicionales_catalogo').select('*').eq('activo', true).order('categoria, codigo'),
      supabase.from('requerimientos_grupos').select('*').order('orden'),
      supabase.from('parametros_globales').select('*'),
    ]);

    // Verificar errores
    for (const r of [productos, tubos, cables, mo, adic, grupos, params]) {
      if (r.error) {
        console.error('Error cargando datos base:', r.error);
        return false;
      }
    }

    // CATÁLOGO
    CATALOGO = productos.data.map(p => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      marca: p.marca || '',
      modelo: p.modelo || '',
      grupo: p.grupo,
      unidad: p.unidad,
      costo: Number(p.costo),
      pvp: Number(p.pvp),
    }));

    // RECETAS TUBO (array → objeto por código)
    RECETAS_TUBO = {};
    tubos.data.forEach(t => {
      RECETAS_TUBO[t.codigo] = {
        nombre: t.nombre,
        costo_m: Number(t.costo_m),
        descripcion: t.descripcion || '',
      };
    });

    // RECETAS CABLE
    RECETAS_CABLE = {};
    cables.data.forEach(c => {
      RECETAS_CABLE[c.codigo] = {
        nombre: c.nombre,
        tipo: c.tipo,
        costo_m: Number(c.costo_m),
      };
    });

    // RECETAS MANO DE OBRA
    RECETAS_MANO_OBRA = {};
    mo.data.forEach(r => {
      RECETAS_MANO_OBRA[r.categoria] = {
        horas_base: Number(r.horas_base),
        factor_altura: Number(r.factor_altura),
        costo_hora: Number(r.costo_hora),
      };
    });

    // COSTOS ADICIONALES
    COSTOS_ADICIONALES = adic.data.map(a => ({
      id: a.id,
      codigo: a.codigo,
      nombre: a.nombre,
      categoria: a.categoria,
      unidad: a.unidad,
      costo: Number(a.costo),
    }));

    // GRUPOS DE REQUERIMIENTOS
    REQUERIMIENTOS_GRUPOS = {};
    grupos.data.forEach(g => {
      REQUERIMIENTOS_GRUPOS[g.codigo] = {
        nombre: g.nombre,
        descripcion: g.descripcion || '',
        icono: g.icono || '',
        categorias: g.categorias || [],
      };
    });

    // PARÁMETROS GLOBALES
    PARAMETROS = {
      iva: 0.15,
      margen_default: 0.40,
      validez_dias: 15,
      plazo_renta_meses_default: 48,
    };
    params.data.forEach(p => {
      const v = Number(p.valor);
      if (!isNaN(v)) PARAMETROS[p.clave] = v;
      else PARAMETROS[p.clave] = p.valor; // si no es numérico, dejarlo como string
    });

    DATOS_BASE_CARGADOS = true;
    return true;
  } catch (err) {
    console.error('Error fatal cargando datos base:', err);
    return false;
  }
}
