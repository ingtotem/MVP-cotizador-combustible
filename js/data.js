/* ============================================================
   DATOS — Carga desde Supabase
   ============================================================ */

if (!window.__TOTEM_DATA_INITIALIZED__) {
  window.__TOTEM_DATA_INITIALIZED__ = true;

  window.CATALOGO = [];
  window.RECETAS_TUBO = {};
  window.RECETAS_CABLE = {};
  window.RECETAS_MANO_OBRA = {};
  window.COSTOS_ADICIONALES = [];
  window.REQUERIMIENTOS_GRUPOS = {};
  window.PARAMETROS = {
    iva: 0.15,
    margen_default: 0.40,
    validez_dias: 15,
    plazo_renta_meses_default: 48,
  };
  window.DATOS_BASE_CARGADOS = false;

  window.cargarDatosBase = async function() {
    if (window.DATOS_BASE_CARGADOS) return true;
    if (!window.supabaseClient) {
      console.error('Supabase no inicializado');
      return false;
    }

    try {
      const sb = window.supabaseClient;
      const [productos, tubos, cables, mo, adic, grupos, params] = await Promise.all([
        sb.from('catalogo_productos').select('*').eq('activo', true).order('grupo, nombre'),
        sb.from('recetas_tubo').select('*').eq('activo', true),
        sb.from('recetas_cable').select('*').eq('activo', true),
        sb.from('recetas_mano_obra').select('*'),
        sb.from('costos_adicionales_catalogo').select('*').eq('activo', true).order('categoria, codigo'),
        sb.from('requerimientos_grupos').select('*').order('orden'),
        sb.from('parametros_globales').select('*'),
      ]);

      for (const r of [productos, tubos, cables, mo, adic, grupos, params]) {
        if (r.error) {
          console.error('Error cargando datos base:', r.error);
          return false;
        }
      }

      window.CATALOGO = productos.data.map(p => ({
        id: p.id, sku: p.sku, nombre: p.nombre,
        marca: p.marca || '', modelo: p.modelo || '',
        grupo: p.grupo, unidad: p.unidad,
        costo: Number(p.costo), pvp: Number(p.pvp),
      }));

      window.RECETAS_TUBO = {};
      tubos.data.forEach(t => {
        window.RECETAS_TUBO[t.codigo] = {
          nombre: t.nombre,
          costo_m: Number(t.costo_m),
          descripcion: t.descripcion || '',
        };
      });

      window.RECETAS_CABLE = {};
      cables.data.forEach(c => {
        window.RECETAS_CABLE[c.codigo] = {
          nombre: c.nombre, tipo: c.tipo,
          costo_m: Number(c.costo_m),
        };
      });

      window.RECETAS_MANO_OBRA = {};
      mo.data.forEach(r => {
        window.RECETAS_MANO_OBRA[r.categoria] = {
          horas_base: Number(r.horas_base),
          factor_altura: Number(r.factor_altura),
          costo_hora: Number(r.costo_hora),
        };
      });

      window.COSTOS_ADICIONALES = adic.data.map(a => ({
        id: a.id, codigo: a.codigo, nombre: a.nombre,
        categoria: a.categoria, unidad: a.unidad,
        costo: Number(a.costo),
      }));

      window.REQUERIMIENTOS_GRUPOS = {};
      grupos.data.forEach(g => {
        window.REQUERIMIENTOS_GRUPOS[g.codigo] = {
          nombre: g.nombre,
          descripcion: g.descripcion || '',
          icono: g.icono || '',
          categorias: g.categorias || [],
        };
      });

      const params_default = {
        iva: 0.15, margen_default: 0.40,
        validez_dias: 15, plazo_renta_meses_default: 48,
      };
      window.PARAMETROS = { ...params_default };
      params.data.forEach(p => {
        const v = Number(p.valor);
        window.PARAMETROS[p.clave] = isNaN(v) ? p.valor : v;
      });

      window.DATOS_BASE_CARGADOS = true;
      console.log('✅ Datos base cargados:', window.CATALOGO.length, 'productos');
      return true;
    } catch (err) {
      console.error('Error fatal cargando datos base:', err);
      return false;
    }
  };
}

// Aliases locales (compatibilidad con código existente)
var CATALOGO = window.CATALOGO;
var RECETAS_TUBO = window.RECETAS_TUBO;
var RECETAS_CABLE = window.RECETAS_CABLE;
var RECETAS_MANO_OBRA = window.RECETAS_MANO_OBRA;
var COSTOS_ADICIONALES = window.COSTOS_ADICIONALES;
var REQUERIMIENTOS_GRUPOS = window.REQUERIMIENTOS_GRUPOS;
var PARAMETROS = window.PARAMETROS;

// Función que actualiza los aliases después de cargar
async function cargarDatosBase() {
  const ok = await window.cargarDatosBase();
  // Reasignar aliases con los datos actualizados
  CATALOGO = window.CATALOGO;
  RECETAS_TUBO = window.RECETAS_TUBO;
  RECETAS_CABLE = window.RECETAS_CABLE;
  RECETAS_MANO_OBRA = window.RECETAS_MANO_OBRA;
  COSTOS_ADICIONALES = window.COSTOS_ADICIONALES;
  REQUERIMIENTOS_GRUPOS = window.REQUERIMIENTOS_GRUPOS;
  PARAMETROS = window.PARAMETROS;
  return ok;
}
