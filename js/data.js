/* ============================================================
   DATOS — Carga desde Supabase
   Incluye nueva estructura de familias para selector POS
   ============================================================ */

if (!window.__TOTEM_DATA_INITIALIZED__) {
  window.__TOTEM_DATA_INITIALIZED__ = true;

  window.CATALOGO = [];
  window.FAMILIAS = [];                // Nuevo: catálogo de familias
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
      const [productos, familias, tubos, cables, mo, adic, grupos, params] = await Promise.all([
        sb.from('catalogo_productos').select('*').eq('activo', true).order('familia, marca, caracteristica'),
        sb.from('familias_productos').select('*').eq('activo', true).order('orden'),
        sb.from('recetas_tubo').select('*').eq('activo', true),
        sb.from('recetas_cable').select('*').eq('activo', true),
        sb.from('recetas_mano_obra').select('*'),
        sb.from('costos_adicionales_catalogo').select('*').eq('activo', true).order('categoria, codigo'),
        sb.from('requerimientos_grupos').select('*').order('orden'),
        sb.from('parametros_globales').select('*'),
      ]);

      for (const r of [productos, familias, tubos, cables, mo, adic, grupos, params]) {
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
        // Nuevos campos
        familia: p.familia || null,
        familia_nombre: p.familia_nombre || '',
        caracteristica: p.caracteristica || '',
        caracteristica_label: p.caracteristica_label || '',
        icono: p.icono || 'default',
      }));

      window.FAMILIAS = (familias.data || []).map(f => ({
        codigo: f.codigo,
        nombre: f.nombre,
        grupo: f.grupo,
        icono: f.icono || 'default',
        caracteristica_nombre: f.caracteristica_nombre || '',
        caracteristica_unidad: f.caracteristica_unidad || '',
        descripcion: f.descripcion || '',
        orden: f.orden || 0,
      }));

      window.RECETAS_TUBO = {};
      tubos.data.forEach(t => {
        window.RECETAS_TUBO[t.codigo] = { nombre: t.nombre, costo_m: Number(t.costo_m), descripcion: t.descripcion || '' };
      });

      window.RECETAS_CABLE = {};
      cables.data.forEach(c => {
        window.RECETAS_CABLE[c.codigo] = { nombre: c.nombre, tipo: c.tipo, costo_m: Number(c.costo_m) };
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
        categoria: a.categoria, unidad: a.unidad, costo: Number(a.costo),
      }));

      window.REQUERIMIENTOS_GRUPOS = {};
      grupos.data.forEach(g => {
        window.REQUERIMIENTOS_GRUPOS[g.codigo] = {
          nombre: g.nombre, descripcion: g.descripcion || '',
          icono: g.icono || '', categorias: g.categorias || [],
        };
      });

      window.PARAMETROS = { iva: 0.15, margen_default: 0.40, validez_dias: 15, plazo_renta_meses_default: 48 };
      params.data.forEach(p => {
        const v = Number(p.valor);
        window.PARAMETROS[p.clave] = isNaN(v) ? p.valor : v;
      });

      window.DATOS_BASE_CARGADOS = true;
      console.log('✅ Datos cargados:', window.CATALOGO.length, 'productos,', window.FAMILIAS.length, 'familias');
      return true;
    } catch (err) {
      console.error('Error fatal cargando datos base:', err);
      return false;
    }
  };

  // Helper: productos de una familia
  window.getProductosDeFamilia = function(familiaCodigo) {
    return window.CATALOGO.filter(p => p.familia === familiaCodigo);
  };

  // Helper: marcas únicas de una familia
  window.getMarcasDeFamilia = function(familiaCodigo) {
    const productos = window.getProductosDeFamilia(familiaCodigo);
    return [...new Set(productos.map(p => p.marca))].filter(Boolean).sort();
  };

  // Helper: características únicas de una familia (medidas, GPM, etc.)
  window.getCaracteristicasDeFamilia = function(familiaCodigo) {
    const productos = window.getProductosDeFamilia(familiaCodigo);
    return [...new Set(productos.map(p => p.caracteristica))].filter(Boolean);
  };

  // Helper: buscar producto equivalente con otra marca pero misma característica
  window.getProductoEquivalente = function(producto, nuevaMarca) {
    return window.CATALOGO.find(p =>
      p.familia === producto.familia &&
      p.caracteristica === producto.caracteristica &&
      p.marca === nuevaMarca
    );
  };

  // Helper: contar productos en cada familia (para el badge)
  window.getCantidadEnFamilia = function(familiaCodigo) {
    return window.getProductosDeFamilia(familiaCodigo).length;
  };
}

// Aliases
var CATALOGO = window.CATALOGO;
var FAMILIAS = window.FAMILIAS;
var RECETAS_TUBO = window.RECETAS_TUBO;
var RECETAS_CABLE = window.RECETAS_CABLE;
var RECETAS_MANO_OBRA = window.RECETAS_MANO_OBRA;
var COSTOS_ADICIONALES = window.COSTOS_ADICIONALES;
var REQUERIMIENTOS_GRUPOS = window.REQUERIMIENTOS_GRUPOS;
var PARAMETROS = window.PARAMETROS;

async function cargarDatosBase() {
  const ok = await window.cargarDatosBase();
  CATALOGO = window.CATALOGO;
  FAMILIAS = window.FAMILIAS;
  RECETAS_TUBO = window.RECETAS_TUBO;
  RECETAS_CABLE = window.RECETAS_CABLE;
  RECETAS_MANO_OBRA = window.RECETAS_MANO_OBRA;
  COSTOS_ADICIONALES = window.COSTOS_ADICIONALES;
  REQUERIMIENTOS_GRUPOS = window.REQUERIMIENTOS_GRUPOS;
  PARAMETROS = window.PARAMETROS;
  return ok;
}
