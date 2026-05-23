/* ============================================================
   COTIZADOR POS — Lógica de UI
   ============================================================ */

const state = {
  proyecto: {
    cliente: '',
    contacto: '',
    lugar_obra: '',
    referencia: '',
    en_ciudad: true,
  },
  lineas: [],     // equipos
  adicionales: [],// costos adicionales (logística, indirectos, etc.)
  opciones: {
    descuento_pct: 0,
    plazo_renta_meses: 48,
    margen_global: 0.40,
  },
};

let nextLineId = 1;
let nextAdicId = 1;

// ===== BUSCADOR =====

function renderBuscador(query = '') {
  const results = document.getElementById('pos-results');
  const q = query.trim().toLowerCase();

  let items = CATALOGO;
  if (q.length > 0) {
    items = CATALOGO.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.marca.toLowerCase().includes(q) ||
      p.modelo.toLowerCase().includes(q) ||
      p.grupo.toLowerCase().includes(q)
    );
  }

  if (items.length === 0) {
    results.innerHTML = `<div class="empty-state"><p>Sin coincidencias. Revisa el catálogo en Mantenimiento.</p></div>`;
    return;
  }

  results.innerHTML = items.slice(0, 30).map(p => `
    <div class="pos-result" data-id="${p.id}">
      <div>
        <div class="sku">${p.sku} · ${p.grupo}</div>
        <div class="name">${p.nombre}</div>
        <div class="meta">${p.marca} · ${p.modelo}</div>
      </div>
      <div class="price">${fmtMoney(p.pvp)}</div>
    </div>
  `).join('');

  results.querySelectorAll('.pos-result').forEach(el => {
    el.addEventListener('click', () => agregarLinea(el.dataset.id));
  });
}

// ===== AGREGAR LÍNEA =====

function agregarLinea(producto_id) {
  const linea = {
    id_temp: 'L' + (nextLineId++),
    producto_id,
    cantidad: 1,
    altura_mayor_3m: false,
    cable_instr: 'NINGUNO',
    m_cable_instr: 0,
    cable_datos: 'NINGUNO',
    m_cable_datos: 0,
    cable_elec: 'NINGUNO',
    m_cable_elec: 0,
    tipo_tubo: 'NINGUNO',
    m_tubo: 0,
    ubicacion: '',
    margen_pct: null,  // null = usar default
  };

  // Defaults inteligentes según tipo de producto
  const p = CATALOGO.find(x => x.id === producto_id);
  if (p) {
    if (p.grupo === 'SENSORES') {
      linea.cable_instr = 'INST_3X18';
      linea.m_cable_instr = 20;
      linea.tipo_tubo = 'EMT_3_4';
      linea.m_tubo = 20;
    } else if (p.grupo === 'CCTV' || p.grupo === 'REDES') {
      linea.cable_datos = 'UTP_CAT6';
      linea.m_cable_datos = 30;
      linea.tipo_tubo = 'EMT_1_2';
      linea.m_tubo = 30;
    } else if (p.grupo === 'CONTROLADORES' || p.grupo === 'COMUNICACION') {
      linea.cable_elec = 'ELEC_3X12';
      linea.m_cable_elec = 10;
      linea.tipo_tubo = 'EMT_3_4';
      linea.m_tubo = 10;
    }
  }

  linea.calculo = calcularLinea(linea);
  state.lineas.push(linea);
  renderCarrito();
  renderResumen();
}

// ===== CARRITO =====

function renderCarrito() {
  const cont = document.getElementById('cart');
  if (state.lineas.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="icon">▱</div>
        <p>Aún no se han agregado equipos. Usa el buscador de arriba para sumar ítems al levantamiento.</p>
      </div>`;
    return;
  }

  cont.innerHTML = state.lineas.map((l, idx) => {
    const c = l.calculo;
    const p = c.producto;
    return `
      <div class="cart-line" data-id="${l.id_temp}">
        <div>
          <div class="line-head">
            <div>
              <div class="line-sku">${p.sku}</div>
              <div class="line-name">${p.nombre}</div>
              <div class="meta text-muted" style="font-size:11px;margin-top:4px;">
                MO: ${c.desglose.horas_mano_obra.toFixed(1)}h ·
                Mat: ${fmtMoney(c.desglose.costo_materiales)} ·
                Margen: ${fmtPct(c.margen_aplicado)}
              </div>
            </div>
            <button class="btn btn-ghost btn-icon" onclick="quitarLinea('${l.id_temp}')" title="Quitar">✕</button>
          </div>
          <div class="line-params">
            <div class="param">
              <label>Cant.</label>
              <input type="number" min="1" value="${l.cantidad}" onchange="updLinea('${l.id_temp}','cantidad',this.value)">
            </div>
            <div class="param">
              <label>Ubicación</label>
              <input type="text" value="${l.ubicacion || ''}" placeholder="ej: Tanque 1" onchange="updLinea('${l.id_temp}','ubicacion',this.value)">
            </div>
            <div class="param">
              <label>Altura</label>
              <select onchange="updLinea('${l.id_temp}','altura_mayor_3m',this.value==='1')">
                <option value="0" ${!l.altura_mayor_3m?'selected':''}>&lt; 3m</option>
                <option value="1" ${l.altura_mayor_3m?'selected':''}>&gt; 3m</option>
              </select>
            </div>
            <div class="param">
              <label>Margen %</label>
              <input type="number" min="0" max="90" step="1" value="${l.margen_pct != null ? (l.margen_pct*100) : (PARAMETROS.margen_default*100)}" onchange="updMargen('${l.id_temp}',this.value)">
            </div>
            <div class="param">
              <label>Tubería</label>
              <select onchange="updLinea('${l.id_temp}','tipo_tubo',this.value)">
                ${Object.entries(RECETAS_TUBO).map(([k,v]) => `<option value="${k}" ${l.tipo_tubo===k?'selected':''}>${v.nombre}</option>`).join('')}
              </select>
            </div>
            <div class="param">
              <label>m Tubo</label>
              <input type="number" min="0" step="1" value="${l.m_tubo}" onchange="updLinea('${l.id_temp}','m_tubo',this.value)">
            </div>
            <div class="param">
              <label>Cable Instr.</label>
              <select onchange="updLinea('${l.id_temp}','cable_instr',this.value)">
                ${Object.entries(RECETAS_CABLE).filter(([k,v])=>v.tipo==='instrumentacion'||k==='NINGUNO').map(([k,v]) => `<option value="${k}" ${l.cable_instr===k?'selected':''}>${v.nombre}</option>`).join('')}
              </select>
            </div>
            <div class="param">
              <label>m Instr.</label>
              <input type="number" min="0" step="1" value="${l.m_cable_instr}" onchange="updLinea('${l.id_temp}','m_cable_instr',this.value)">
            </div>
            <div class="param">
              <label>Cable Datos</label>
              <select onchange="updLinea('${l.id_temp}','cable_datos',this.value)">
                ${Object.entries(RECETAS_CABLE).filter(([k,v])=>v.tipo==='datos'||k==='NINGUNO').map(([k,v]) => `<option value="${k}" ${l.cable_datos===k?'selected':''}>${v.nombre}</option>`).join('')}
              </select>
            </div>
            <div class="param">
              <label>m Datos</label>
              <input type="number" min="0" step="1" value="${l.m_cable_datos}" onchange="updLinea('${l.id_temp}','m_cable_datos',this.value)">
            </div>
            <div class="param">
              <label>Cable Eléc.</label>
              <select onchange="updLinea('${l.id_temp}','cable_elec',this.value)">
                ${Object.entries(RECETAS_CABLE).filter(([k,v])=>v.tipo==='electrico'||k==='NINGUNO').map(([k,v]) => `<option value="${k}" ${l.cable_elec===k?'selected':''}>${v.nombre}</option>`).join('')}
              </select>
            </div>
            <div class="param">
              <label>m Eléc.</label>
              <input type="number" min="0" step="1" value="${l.m_cable_elec}" onchange="updLinea('${l.id_temp}','m_cable_elec',this.value)">
            </div>
          </div>
        </div>
        <div class="line-totals">
          <div class="cost">costo · ${fmtMoney(c.desglose.costo_total)}</div>
          <div class="pvp">${fmtMoney(c.pvp_total)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function updLinea(id_temp, campo, valor) {
  const l = state.lineas.find(x => x.id_temp === id_temp);
  if (!l) return;
  if (campo === 'cantidad' || campo === 'm_tubo' || campo.startsWith('m_cable')) {
    l[campo] = Number(valor) || 0;
  } else {
    l[campo] = valor;
  }
  l.calculo = calcularLinea(l);
  renderCarrito();
  renderResumen();
}

function updMargen(id_temp, valor_pct) {
  const l = state.lineas.find(x => x.id_temp === id_temp);
  if (!l) return;
  const v = Number(valor_pct);
  l.margen_pct = isNaN(v) ? null : v / 100;
  l.calculo = calcularLinea(l);
  renderCarrito();
  renderResumen();
}

function quitarLinea(id_temp) {
  state.lineas = state.lineas.filter(l => l.id_temp !== id_temp);
  renderCarrito();
  renderResumen();
}

// ===== COSTOS ADICIONALES =====

function renderAdicionalesSelector() {
  const sel = document.getElementById('adic-select');
  if (!sel) return;

  // Agrupar por categoría
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
  state.adicionales.push({
    id_temp: 'A' + (nextAdicId++),
    id: def.id,
    codigo: def.codigo,
    nombre: def.nombre,
    categoria: def.categoria,
    unidad: def.unidad,
    cantidad: 1,
    costo_unitario: def.costo,
  });
  sel.value = '';
  renderAdicionales();
  renderResumen();
}

function renderAdicionales() {
  const cont = document.getElementById('adic-list');
  if (!cont) return;
  if (state.adicionales.length === 0) {
    cont.innerHTML = `<div class="empty-state" style="padding:24px;"><p>No hay costos adicionales agregados. Estos son costos INTERNOS (logística, viáticos, permisos, obra civil, imprevistos…) que se suman al costo total pero no se desglosan en la cotización al cliente.</p></div>`;
    return;
  }
  cont.innerHTML = state.adicionales.map(a => {
    const total = (Number(a.cantidad) || 0) * (Number(a.costo_unitario) || 0);
    return `
      <div class="cart-line" data-id="${a.id_temp}" style="grid-template-columns: 1fr auto auto;">
        <div>
          <div class="line-sku">${a.codigo} · ${a.categoria}</div>
          <div class="line-name">${a.nombre}</div>
          <div class="line-params" style="grid-template-columns: 1fr 1fr 1fr; margin-top:8px;">
            <div class="param">
              <label>Cantidad (${a.unidad})</label>
              <input type="number" min="0" step="0.5" value="${a.cantidad}" onchange="updAdicional('${a.id_temp}','cantidad',this.value)">
            </div>
            <div class="param">
              <label>Costo unitario</label>
              <input type="number" min="0" step="0.01" value="${a.costo_unitario}" onchange="updAdicional('${a.id_temp}','costo_unitario',this.value)">
            </div>
            <div class="param">
              <label>Total</label>
              <input type="text" value="${fmtMoney(total)}" readonly class="mono">
            </div>
          </div>
        </div>
        <div class="line-totals">
          <div class="pvp">${fmtMoney(total)}</div>
          <div class="cost">costo interno</div>
        </div>
        <div><button class="btn btn-ghost btn-icon" onclick="quitarAdicional('${a.id_temp}')">✕</button></div>
      </div>
    `;
  }).join('');
}

function updAdicional(id_temp, campo, valor) {
  const a = state.adicionales.find(x => x.id_temp === id_temp);
  if (!a) return;
  a[campo] = Number(valor) || 0;
  renderAdicionales();
  renderResumen();
}

function quitarAdicional(id_temp) {
  state.adicionales = state.adicionales.filter(a => a.id_temp !== id_temp);
  renderAdicionales();
  renderResumen();
}

// ===== RESUMEN =====

function renderResumen() {
  const t = calcularTotalesCotizacion(state.lineas, state.adicionales, state.opciones);

  // Costos internos
  document.getElementById('sum-equipos').textContent = fmtMoney(t.subtotal_equipos);
  document.getElementById('sum-materiales').textContent = fmtMoney(t.subtotal_materiales);
  document.getElementById('sum-mano-obra').textContent = fmtMoney(t.subtotal_mano_obra);
  document.getElementById('sum-adicionales').textContent = fmtMoney(t.costo_adicionales_total);
  document.getElementById('sum-costo-total').textContent = fmtMoney(t.costo_total);

  // Desglose de adicionales por categoría (solo si hay)
  const desgEl = document.getElementById('sum-adic-desglose');
  if (desgEl) {
    const cats = Object.entries(t.adicionales_por_cat || {});
    if (cats.length === 0) {
      desgEl.innerHTML = '';
    } else {
      desgEl.innerHTML = cats.map(([cat, info]) =>
        `<div class="summary-row" style="font-size:11px;color:var(--text-muted);"><span class="lbl">↳ ${cat}</span><span class="val mono">${fmtMoney(info.total)}</span></div>`
      ).join('');
    }
  }

  // Vista cliente
  document.getElementById('sum-cli-equipos').textContent = fmtMoney(t.cliente.equipos);
  document.getElementById('sum-cli-materiales').textContent = fmtMoney(t.cliente.materiales);
  document.getElementById('sum-cli-mano-obra').textContent = fmtMoney(t.cliente.mano_obra);
  document.getElementById('sum-cli-subtotal').textContent = fmtMoney(t.cliente.subtotal);

  // Descuento e IVA
  document.getElementById('sum-descuento').textContent = '- ' + fmtMoney(t.monto_descuento);
  document.getElementById('sum-iva').textContent = fmtMoney(t.iva);
  document.getElementById('sum-total').textContent = fmtMoney(t.total);
  document.getElementById('sum-margen').textContent = fmtPct(t.margen_efectivo);
  document.getElementById('sum-renta').textContent = fmtMoney(t.renta_mensual);
  document.getElementById('sum-count').textContent = state.lineas.length;
  const adicCount = document.getElementById('sum-adic-count');
  if (adicCount) adicCount.textContent = state.adicionales.length;
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('pos-search-input');
  if (search) {
    search.addEventListener('input', (e) => renderBuscador(e.target.value));
    renderBuscador('');
  }

  const descuento = document.getElementById('inp-descuento');
  if (descuento) {
    descuento.addEventListener('input', (e) => {
      state.opciones.descuento_pct = Number(e.target.value) || 0;
      renderResumen();
    });
  }

  const plazo = document.getElementById('inp-plazo');
  if (plazo) {
    plazo.addEventListener('input', (e) => {
      state.opciones.plazo_renta_meses = Number(e.target.value) || 48;
      renderResumen();
    });
  }

  renderAdicionalesSelector();
  renderCarrito();
  renderAdicionales();
  renderResumen();
});
