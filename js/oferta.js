/* ============================================================
   COTIZACIÓN — Vista del Cotizador
   Toma el levantamiento técnico guardado por el ingeniero y le
   añade información comercial (margen, mano de obra, adicionales).
   ============================================================ */

const STORAGE_LEV = 'totem_levantamiento_actual';
const STORAGE_OFER = 'totem_oferta_actual';

// Estado de la oferta en construcción
const oferta = {
  proyecto: {},
  items: [],         // ítems del levantamiento + overrides comerciales (margen_pct, horas_mo_override)
  adicionales: [],
  opciones: {
    margen_global: 0.40,
    descuento_pct: 0,
    plazo_renta_meses: 48,
  },
};

let nextAdicId = 1;

// ===== CARGA DESDE LEVANTAMIENTO =====

function cargarDesdeLevantamiento() {
  let lev = null;
  try {
    const raw = sessionStorage.getItem(STORAGE_LEV);
    if (raw) lev = JSON.parse(raw);
  } catch (e) {}

  if (!lev || !lev.lev || !lev.lev.items || lev.lev.items.length === 0) {
    document.querySelector('main').innerHTML = `
      <div class="panel" style="margin-top:40px;">
        <div class="panel-body" style="text-align:center;padding:60px;">
          <div style="font-size:48px;opacity:0.4;margin-bottom:16px;">▱</div>
          <h2 style="margin-bottom:12px;">No hay levantamiento para cotizar</h2>
          <p class="text-secondary" style="margin-bottom:24px;">Primero el ingeniero debe registrar los equipos en el levantamiento técnico, y desde ahí enviar a cotizar.</p>
          <a href="levantamiento.html" class="btn btn-primary">Ir al Levantamiento</a>
        </div>
      </div>`;
    return false;
  }

  oferta.proyecto = { ...lev.lev.proyecto };

  // Cargar oferta previa si existe (para no perder cambios al recargar)
  let ofertaPrevia = null;
  try {
    const raw = sessionStorage.getItem(STORAGE_OFER);
    if (raw) ofertaPrevia = JSON.parse(raw);
  } catch (e) {}

  // Copiar ítems del levantamiento, manteniendo overrides comerciales si existen
  oferta.items = lev.lev.items.map(litem => {
    const prev = ofertaPrevia?.items?.find(x => x.id_temp === litem.id_temp);
    return {
      ...litem,
      margen_pct: prev?.margen_pct ?? null,
      horas_mo_override: prev?.horas_mo_override ?? null,
    };
  });

  // ───────────────────────────────────────────────────────────
  // CARGAR REQUERIMIENTOS DEL INGENIERO COMO ADICIONALES
  // El ingeniero ya definió qué necesita y cuánto. El cotizador
  // hereda esos requerimientos con el costo del catálogo, y los
  // puede ajustar si quiere.
  // ───────────────────────────────────────────────────────────
  const reqsIngeniero = lev.lev.requerimientos || [];
  const adicPrevios = ofertaPrevia?.adicionales || [];

  oferta.adicionales = reqsIngeniero.map(r => {
    // Si el cotizador ya había ajustado el costo de este requerimiento, mantenerlo
    const prev = adicPrevios.find(a => a.req_id_temp === r.id_temp);
    const defCatalogo = COSTOS_ADICIONALES.find(a => a.id === r.adic_id);
    const costoDefault = defCatalogo?.costo ?? 0;

    return {
      id_temp: prev?.id_temp || ('A' + (nextAdicId++)),
      req_id_temp: r.id_temp,        // referencia al req del ingeniero
      id: r.adic_id,
      codigo: r.codigo,
      nombre: r.nombre,
      categoria: r.categoria,
      unidad: r.unidad,
      cantidad: r.cantidad,
      costo_unitario: prev?.costo_unitario ?? costoDefault,
      from_ingeniero: true,          // marca que viene del levantamiento
    };
  });

  // Restaurar adicionales manuales que el cotizador haya agregado aparte
  if (ofertaPrevia?.adicionales) {
    adicPrevios.forEach(a => {
      if (!a.from_ingeniero) {
        oferta.adicionales.push(a);
      }
    });
  }

  // Restaurar opciones
  if (ofertaPrevia?.opciones) Object.assign(oferta.opciones, ofertaPrevia.opciones);
  if (ofertaPrevia?.nextAdicId && ofertaPrevia.nextAdicId > nextAdicId) {
    nextAdicId = ofertaPrevia.nextAdicId;
  }

  return true;
}

function guardarOfertaEnSesion() {
  try {
    sessionStorage.setItem(STORAGE_OFER, JSON.stringify({ ...oferta, nextAdicId }));
  } catch (e) {}
}

// ===== CÁLCULO POR ÍTEM =====
// Reutiliza calcularLinea pero respeta el override de horas si existe

function calcularItemOferta(it) {
  const linea = {
    producto_id: it.producto_id,
    cantidad: it.cantidad,
    altura_mayor_3m: it.altura_mayor_3m,
    cable_instr: it.cable_instr,
    m_cable_instr: it.m_cable_instr,
    cable_datos: it.cable_datos,
    m_cable_datos: it.m_cable_datos,
    cable_elec: it.cable_elec,
    m_cable_elec: it.m_cable_elec,
    tipo_tubo: it.tipo_tubo,
    m_tubo: it.m_tubo,
    margen_pct: it.margen_pct != null ? it.margen_pct : oferta.opciones.margen_global,
  };

  const c = calcularLinea(linea);
  if (!c) return null;

  // Si hay override de horas MO, recalcular esa parte
  if (it.horas_mo_override != null) {
    const producto = CATALOGO.find(p => p.id === it.producto_id);
    const recetaMO = RECETAS_MANO_OBRA[producto.grupo] || RECETAS_MANO_OBRA.ACCESORIOS;
    const horas = Number(it.horas_mo_override);
    const costo_mo = horas * recetaMO.costo_hora;

    // Actualizar el desglose
    c.desglose.horas_mano_obra = horas;
    c.desglose.costo_mano_obra = costo_mo;
    c.desglose.costo_total = c.desglose.costo_equipo + c.desglose.costo_materiales + costo_mo;

    // Recalcular PVP
    const margen = linea.margen_pct;
    c.pvp_total = c.desglose.costo_total / (1 - margen);
    c.pvp_unitario = c.pvp_total / it.cantidad;
  }

  return c;
}

// ===== RENDER PROYECTO (read-only) =====

function renderProyecto() {
  const cont = document.getElementById('proy-readonly');
  const p = oferta.proyecto;
  const campos = [
    ['Cliente', p.cliente],
    ['Contacto', p.contacto],
    ['Teléfono / Email', p.telefono],
    ['Referencia', p.referencia],
    ['Lugar de Obra', p.lugar],
    ['Coordenadas', p.coords],
  ];
  cont.innerHTML = campos.map(([lbl, val]) => `
    <div>
      <label>${lbl}</label>
      <input type="text" value="${(val || '—').replace(/"/g,'&quot;')}" readonly style="opacity:0.85;">
    </div>
  `).join('');

  if (p.cliente) {
    document.getElementById('oferta-titulo').textContent = `Cotización · ${p.cliente}`;
  }
}

// ===== RENDER ÍTEMS DE OFERTA =====

function renderItems() {
  const cont = document.getElementById('items-list');
  document.getElementById('items-count').textContent = oferta.items.length;

  if (oferta.items.length === 0) {
    cont.innerHTML = `<div class="empty-state"><p>El levantamiento no trae equipos.</p></div>`;
    return;
  }

  cont.innerHTML = oferta.items.map(it => {
    const c = calcularItemOferta(it);
    if (!c) return '';
    const p = c.producto;
    const tubo = RECETAS_TUBO[it.tipo_tubo];
    const inst = RECETAS_CABLE[it.cable_instr];
    const dat = RECETAS_CABLE[it.cable_datos];
    const ele = RECETAS_CABLE[it.cable_elec];

    const tecnicas = [];
    if (it.ubicacion) tecnicas.push(`<span>📍 ${it.ubicacion}</span>`);
    tecnicas.push(`<span>Altura ${it.altura_mayor_3m ? '>3m' : '<3m'}</span>`);
    if (tubo && it.tipo_tubo !== 'NINGUNO' && it.m_tubo > 0) tecnicas.push(`<span>${tubo.nombre}: ${it.m_tubo}m</span>`);
    if (inst && it.cable_instr !== 'NINGUNO' && it.m_cable_instr > 0) tecnicas.push(`<span>${inst.nombre}: ${it.m_cable_instr}m</span>`);
    if (dat && it.cable_datos !== 'NINGUNO' && it.m_cable_datos > 0) tecnicas.push(`<span>${dat.nombre}: ${it.m_cable_datos}m</span>`);
    if (ele && it.cable_elec !== 'NINGUNO' && it.m_cable_elec > 0) tecnicas.push(`<span>${ele.nombre}: ${it.m_cable_elec}m</span>`);

    const margenActual = it.margen_pct != null ? it.margen_pct * 100 : oferta.opciones.margen_global * 100;
    const horasActual = it.horas_mo_override != null ? it.horas_mo_override : c.desglose.horas_mano_obra;

    return `
      <div class="cot-item">
        <div class="cot-head">
          <div>
            <div class="cot-sku">${p.sku} · ${p.grupo}</div>
            <div class="cot-name">×${it.cantidad} · ${p.nombre}</div>
            ${it.observacion ? `<div class="text-muted" style="font-size:11px;margin-top:4px;font-style:italic;">"${it.observacion}"</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div class="cot-cost">costo · ${fmtMoney(c.desglose.costo_total)}</div>
            <div class="cot-pvp">${fmtMoney(c.pvp_total)}</div>
          </div>
        </div>

        <div class="cot-grid">
          <div class="cot-field">
            <label>Margen % ${it.margen_pct == null ? '(global)' : '(override)'}</label>
            <input type="number" min="0" max="80" step="0.5" value="${margenActual.toFixed(1)}"
                   onchange="updItemMargen('${it.id_temp}', this.value)">
          </div>
          <div class="cot-field">
            <label>Horas mano de obra ${it.horas_mo_override == null ? '(receta)' : '(override)'}</label>
            <input type="number" min="0" step="0.25" value="${horasActual.toFixed(2)}"
                   onchange="updItemHoras('${it.id_temp}', this.value)">
          </div>
          <div class="cot-field">
            <label>Desglose costo</label>
            <input type="text" class="mono" readonly value="Eq ${fmtMoney(c.desglose.costo_equipo)} · Mat ${fmtMoney(c.desglose.costo_materiales)} · MO ${fmtMoney(c.desglose.costo_mano_obra)}">
          </div>
        </div>

        <div class="cot-tech">${tecnicas.join('')}</div>
      </div>
    `;
  }).join('');
}

function updItemMargen(id_temp, valor) {
  const it = oferta.items.find(x => x.id_temp === id_temp);
  if (!it) return;
  const v = Number(valor);
  // Si el valor coincide con el global, marcar null (sin override)
  if (isNaN(v)) {
    it.margen_pct = null;
  } else if (Math.abs(v / 100 - oferta.opciones.margen_global) < 0.001) {
    it.margen_pct = null;
  } else {
    it.margen_pct = v / 100;
  }
  guardarOfertaEnSesion();
  renderItems();
  renderResumen();
}

function updItemHoras(id_temp, valor) {
  const it = oferta.items.find(x => x.id_temp === id_temp);
  if (!it) return;
  const v = Number(valor);
  it.horas_mo_override = isNaN(v) ? null : v;
  guardarOfertaEnSesion();
  renderItems();
  renderResumen();
}

// ===== ADICIONALES =====

function renderAdicionalesSelector() {
  const sel = document.getElementById('adic-select');
  if (!sel) return;
  const grupos = {};
  COSTOS_ADICIONALES.forEach(a => {
    if (!grupos[a.categoria]) grupos[a.categoria] = [];
    grupos[a.categoria].push(a);
  });
  sel.innerHTML = '<option value="">— Seleccionar concepto —</option>' +
    Object.entries(grupos).map(([cat, items]) => `
      <optgroup label="${cat}">
        ${items.map(a => `<option value="${a.id}">${a.codigo} · ${a.nombre} (${a.unidad})</option>`).join('')}
      </optgroup>
    `).join('');
}

function agregarAdicional() {
  const sel = document.getElementById('adic-select');
  if (!sel || !sel.value) return;
  const def = COSTOS_ADICIONALES.find(a => a.id === sel.value);
  if (!def) return;
  oferta.adicionales.push({
    id_temp: 'A' + (nextAdicId++),
    id: def.id, codigo: def.codigo, nombre: def.nombre,
    categoria: def.categoria, unidad: def.unidad,
    cantidad: 1, costo_unitario: def.costo,
  });
  sel.value = '';
  guardarOfertaEnSesion();
  renderAdicionales();
  renderResumen();
}

function renderAdicionales() {
  const cont = document.getElementById('adic-list');
  document.getElementById('sum-adic-count').textContent = oferta.adicionales.length;
  if (oferta.adicionales.length === 0) {
    cont.innerHTML = `<div class="empty-state" style="padding:24px;"><p>No hay costos adicionales. Los requerimientos que registre el ingeniero aparecerán aquí automáticamente con los costos del catálogo.</p></div>`;
    return;
  }
  cont.innerHTML = oferta.adicionales.map(a => {
    const total = (Number(a.cantidad) || 0) * (Number(a.costo_unitario) || 0);
    const fromEng = a.from_ingeniero;
    return `
      <div class="cart-line" data-id="${a.id_temp}" style="grid-template-columns: 1fr auto auto;">
        <div>
          <div class="line-sku">
            ${a.codigo} · ${a.categoria}
            ${fromEng ? `<span style="background:rgba(57,197,207,0.15);color:var(--accent-cool);padding:1px 6px;border-radius:3px;margin-left:6px;font-size:9px;">↘ del ingeniero</span>` : ''}
          </div>
          <div class="line-name">${a.nombre}</div>
          <div class="line-params" style="grid-template-columns: 1fr 1fr 1fr; margin-top:8px;">
            <div class="param">
              <label>Cant. (${a.unidad})${fromEng ? ' 🔒' : ''}</label>
              <input type="number" min="0" step="0.5" value="${a.cantidad}" ${fromEng ? 'readonly title="Cantidad definida por el ingeniero. Para cambiarla, vuelve al levantamiento."' : ''} onchange="updAdicional('${a.id_temp}','cantidad',this.value)">
            </div>
            <div class="param"><label>Costo unitario</label><input type="number" min="0" step="0.01" value="${a.costo_unitario}" onchange="updAdicional('${a.id_temp}','costo_unitario',this.value)"></div>
            <div class="param"><label>Total</label><input type="text" value="${fmtMoney(total)}" readonly class="mono"></div>
          </div>
        </div>
        <div class="line-totals">
          <div class="pvp">${fmtMoney(total)}</div>
          <div class="cost">costo interno</div>
        </div>
        <div>${fromEng ? '' : `<button class="btn btn-ghost btn-icon" onclick="quitarAdicional('${a.id_temp}')">✕</button>`}</div>
      </div>`;
  }).join('');
}

function updAdicional(id_temp, campo, valor) {
  const a = oferta.adicionales.find(x => x.id_temp === id_temp);
  if (!a) return;
  a[campo] = Number(valor) || 0;
  guardarOfertaEnSesion();
  renderAdicionales();
  renderResumen();
}

function quitarAdicional(id_temp) {
  oferta.adicionales = oferta.adicionales.filter(a => a.id_temp !== id_temp);
  guardarOfertaEnSesion();
  renderAdicionales();
  renderResumen();
}

// ===== RESUMEN =====

function renderResumen() {
  // Adaptar items con sus cálculos
  const lineas = oferta.items.map(it => ({ ...it, calculo: calcularItemOferta(it) }));
  const t = calcularTotalesCotizacion(lineas, oferta.adicionales, oferta.opciones);

  document.getElementById('sum-equipos').textContent = fmtMoney(t.subtotal_equipos);
  document.getElementById('sum-materiales').textContent = fmtMoney(t.subtotal_materiales);
  document.getElementById('sum-mano-obra').textContent = fmtMoney(t.subtotal_mano_obra);
  document.getElementById('sum-adicionales').textContent = fmtMoney(t.costo_adicionales_total);
  document.getElementById('sum-costo-total').textContent = fmtMoney(t.costo_total);

  const desgEl = document.getElementById('sum-adic-desglose');
  if (desgEl) {
    const cats = Object.entries(t.adicionales_por_cat || {});
    desgEl.innerHTML = cats.length === 0 ? '' :
      cats.map(([cat, info]) =>
        `<div class="summary-row" style="font-size:11px;color:var(--text-muted);"><span class="lbl">↳ ${cat}</span><span class="val mono">${fmtMoney(info.total)}</span></div>`
      ).join('');
  }

  document.getElementById('sum-cli-equipos').textContent = fmtMoney(t.cliente.equipos);
  document.getElementById('sum-cli-materiales').textContent = fmtMoney(t.cliente.materiales);
  document.getElementById('sum-cli-mano-obra').textContent = fmtMoney(t.cliente.mano_obra);
  document.getElementById('sum-cli-subtotal').textContent = fmtMoney(t.cliente.subtotal);
  document.getElementById('sum-descuento').textContent = '- ' + fmtMoney(t.monto_descuento);
  document.getElementById('sum-iva').textContent = fmtMoney(t.iva);
  document.getElementById('sum-total').textContent = fmtMoney(t.total);
  document.getElementById('sum-margen').textContent = fmtPct(t.margen_efectivo);
  document.getElementById('sum-renta').textContent = fmtMoney(t.renta_mensual);
  document.getElementById('sum-plazo-meses').textContent = oferta.opciones.plazo_renta_meses;
}

// ===== ACCIONES =====

function guardarOferta() {
  guardarOfertaEnSesion();
  alert(`Oferta guardada como v1.\n\nCuando se conecte la base de datos (Supabase), esta versión quedará en la nube y podrás versionarla.`);
}

function abrirVistaPrevia() {
  guardarOfertaEnSesion();
  window.location.href = 'oferta-cliente.html';
}

function enviarARevision() {
  guardarOfertaEnSesion();
  alert('Oferta enviada al Revisor para aprobación.\n\n(Funcionalidad real disponible cuando se conecte la base de datos.)');
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
  if (!cargarDesdeLevantamiento()) return;

  renderProyecto();
  renderAdicionalesSelector();
  renderItems();
  renderAdicionales();

  // Aplicar opciones a los inputs
  document.getElementById('inp-margen-global').value = (oferta.opciones.margen_global * 100).toFixed(1);
  document.getElementById('inp-descuento').value = oferta.opciones.descuento_pct;
  document.getElementById('inp-plazo').value = oferta.opciones.plazo_renta_meses;

  // Bind controles globales
  document.getElementById('inp-margen-global').addEventListener('input', e => {
    oferta.opciones.margen_global = (Number(e.target.value) || 40) / 100;
    guardarOfertaEnSesion();
    renderItems();
    renderResumen();
  });
  document.getElementById('inp-descuento').addEventListener('input', e => {
    oferta.opciones.descuento_pct = Number(e.target.value) || 0;
    guardarOfertaEnSesion();
    renderResumen();
  });
  document.getElementById('inp-plazo').addEventListener('input', e => {
    oferta.opciones.plazo_renta_meses = Number(e.target.value) || 48;
    guardarOfertaEnSesion();
    renderResumen();
  });

  renderResumen();
});
