/* ============================================================
   LEVANTAMIENTO TÉCNICO — Vista del Ingeniero
   No muestra costos, precios, márgenes ni mano de obra.
   Solo registra datos técnicos para que el cotizador los use después.
   ============================================================ */

// Estado del levantamiento actual (en sessionStorage para sobrevivir cambios de pestaña)
const STORAGE_KEY = 'totem_levantamiento_actual';

const lev = {
  proyecto: {
    cliente: '',
    contacto: '',
    telefono: '',
    referencia: '',
    lugar: '',
    coords: '',
    problema: '',
  },
  items: [],          // equipos del catálogo con datos técnicos
  requerimientos: [], // {id_temp, adic_id, codigo, nombre, categoria, grupo, unidad, cantidad}
};

let nextLevId = 1;
let nextReqId = 1;
let modalEditId = null;       // si estamos editando un item existente
let modalProductoId = null;   // producto en edición/creación
let modalAltura = false;
let modalReqGrupo = null;     // grupo abierto en el modal de requerimientos

// ===== PERSISTENCIA =====

function guardarEnSesion() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ lev, nextLevId, nextReqId }));
  } catch (e) { /* sessionStorage puede fallar en modo incógnito */ }
}

function cargarDeSesion() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.lev) {
      Object.assign(lev.proyecto, data.lev.proyecto || {});
      lev.items = data.lev.items || [];
      lev.requerimientos = data.lev.requerimientos || [];
    }
    if (data.nextLevId) nextLevId = data.nextLevId;
    if (data.nextReqId) nextReqId = data.nextReqId;
  } catch (e) {}
}

function aplicarProyectoAUI() {
  document.getElementById('proy-cliente').value = lev.proyecto.cliente || '';
  document.getElementById('proy-contacto').value = lev.proyecto.contacto || '';
  document.getElementById('proy-telefono').value = lev.proyecto.telefono || '';
  document.getElementById('proy-referencia').value = lev.proyecto.referencia || '';
  document.getElementById('proy-lugar').value = lev.proyecto.lugar || '';
  document.getElementById('proy-coords').value = lev.proyecto.coords || '';
  document.getElementById('proy-problema').value = lev.proyecto.problema || '';
}

function bindProyectoInputs() {
  const map = {
    'proy-cliente': 'cliente',
    'proy-contacto': 'contacto',
    'proy-telefono': 'telefono',
    'proy-referencia': 'referencia',
    'proy-lugar': 'lugar',
    'proy-coords': 'coords',
    'proy-problema': 'problema',
  };
  Object.entries(map).forEach(([id, campo]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', e => {
      lev.proyecto[campo] = e.target.value;
      guardarEnSesion();
    });
  });
}

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
    results.innerHTML = `<div class="empty-state"><p>Sin coincidencias.</p></div>`;
    return;
  }
  // Sin precios — sólo datos técnicos
  results.innerHTML = items.slice(0, 30).map(p => `
    <div class="pos-result" data-id="${p.id}">
      <div>
        <div class="sku">${p.sku} · ${p.grupo}</div>
        <div class="name">${p.nombre}</div>
        <div class="meta">${p.marca} · ${p.modelo}</div>
      </div>
      <div class="price text-muted" style="font-family:var(--font-mono);font-size:11px;">click para agregar →</div>
    </div>
  `).join('');
  results.querySelectorAll('.pos-result').forEach(el => {
    el.addEventListener('click', () => abrirModalParaNuevo(el.dataset.id));
  });
}

// ===== MODAL FLOTANTE =====

function poblarSelectsModal() {
  const tubo = document.getElementById('m-tubo-tipo');
  tubo.innerHTML = Object.entries(RECETAS_TUBO).map(([k, v]) =>
    `<option value="${k}">${v.nombre}</option>`).join('');

  const instr = document.getElementById('m-cable-instr');
  instr.innerHTML = Object.entries(RECETAS_CABLE)
    .filter(([k, v]) => v.tipo === 'instrumentacion' || k === 'NINGUNO')
    .map(([k, v]) => `<option value="${k}">${v.nombre}</option>`).join('');

  const datos = document.getElementById('m-cable-datos');
  datos.innerHTML = Object.entries(RECETAS_CABLE)
    .filter(([k, v]) => v.tipo === 'datos' || k === 'NINGUNO')
    .map(([k, v]) => `<option value="${k}">${v.nombre}</option>`).join('');

  const elec = document.getElementById('m-cable-elec');
  elec.innerHTML = Object.entries(RECETAS_CABLE)
    .filter(([k, v]) => v.tipo === 'electrico' || k === 'NINGUNO')
    .map(([k, v]) => `<option value="${k}">${v.nombre}</option>`).join('');
}

function abrirModalParaNuevo(producto_id) {
  modalEditId = null;
  modalProductoId = producto_id;
  const p = CATALOGO.find(x => x.id === producto_id);
  if (!p) return;

  document.getElementById('modal-titulo').textContent = p.nombre;
  document.getElementById('modal-meta').textContent = `${p.sku} · ${p.marca} · ${p.modelo} · ${p.grupo}`;

  // Defaults según grupo (heurísticas razonables)
  let defaults = {
    cantidad: 1, ubicacion: '', altura: false,
    tubo: 'NINGUNO', m_tubo: 0,
    instr: 'NINGUNO', m_instr: 0,
    datos: 'NINGUNO', m_datos: 0,
    elec: 'NINGUNO', m_elec: 0,
    obs: ''
  };

  if (p.grupo === 'SENSORES') {
    defaults.tubo = 'EMT_3_4'; defaults.m_tubo = 20;
    defaults.instr = 'INST_3X18'; defaults.m_instr = 20;
  } else if (p.grupo === 'CCTV' || p.grupo === 'REDES') {
    defaults.tubo = 'EMT_1_2'; defaults.m_tubo = 30;
    defaults.datos = 'UTP_CAT6'; defaults.m_datos = 30;
  } else if (p.grupo === 'CONTROLADORES' || p.grupo === 'COMUNICACION') {
    defaults.tubo = 'EMT_3_4'; defaults.m_tubo = 10;
    defaults.elec = 'ELEC_3X12'; defaults.m_elec = 10;
  }

  aplicarValoresModal(defaults);
  document.getElementById('btn-guardar-item').textContent = 'Agregar al levantamiento';
  document.getElementById('modal-equipo').classList.add('open');
  document.getElementById('m-cantidad').focus();
}

function abrirModalParaEditar(id_temp) {
  const it = lev.items.find(x => x.id_temp === id_temp);
  if (!it) return;
  const p = CATALOGO.find(x => x.id === it.producto_id);
  if (!p) return;

  modalEditId = id_temp;
  modalProductoId = it.producto_id;

  document.getElementById('modal-titulo').textContent = p.nombre;
  document.getElementById('modal-meta').textContent = `${p.sku} · ${p.marca} · ${p.modelo} · ${p.grupo}`;

  aplicarValoresModal({
    cantidad: it.cantidad,
    ubicacion: it.ubicacion,
    altura: it.altura_mayor_3m,
    tubo: it.tipo_tubo,
    m_tubo: it.m_tubo,
    instr: it.cable_instr,
    m_instr: it.m_cable_instr,
    datos: it.cable_datos,
    m_datos: it.m_cable_datos,
    elec: it.cable_elec,
    m_elec: it.m_cable_elec,
    obs: it.observacion || '',
  });

  document.getElementById('btn-guardar-item').textContent = 'Actualizar ítem';
  document.getElementById('modal-equipo').classList.add('open');
}

function aplicarValoresModal(v) {
  document.getElementById('m-cantidad').value = v.cantidad;
  document.getElementById('m-ubicacion').value = v.ubicacion;
  modalAltura = !!v.altura;
  document.querySelectorAll('.radio-pill[data-altura]').forEach(p => {
    const isActive = (p.dataset.altura === '1') === modalAltura;
    p.classList.toggle('active', isActive);
  });
  document.getElementById('m-tubo-tipo').value = v.tubo;
  document.getElementById('m-tubo-m').value = v.m_tubo;
  document.getElementById('m-cable-instr').value = v.instr;
  document.getElementById('m-cable-instr-m').value = v.m_instr;
  document.getElementById('m-cable-datos').value = v.datos;
  document.getElementById('m-cable-datos-m').value = v.m_datos;
  document.getElementById('m-cable-elec').value = v.elec;
  document.getElementById('m-cable-elec-m').value = v.m_elec;
  document.getElementById('m-observacion').value = v.obs;
}

function selectAltura(btnEl, esMayor3m) {
  modalAltura = esMayor3m;
  document.querySelectorAll('.radio-pill[data-altura]').forEach(p => p.classList.remove('active'));
  btnEl.classList.add('active');
}

function cerrarModal() {
  document.getElementById('modal-equipo').classList.remove('open');
  modalEditId = null;
  modalProductoId = null;
}

function guardarItemModal() {
  if (!modalProductoId) return;
  const data = {
    producto_id: modalProductoId,
    cantidad: Number(document.getElementById('m-cantidad').value) || 1,
    ubicacion: document.getElementById('m-ubicacion').value.trim(),
    altura_mayor_3m: modalAltura,
    tipo_tubo: document.getElementById('m-tubo-tipo').value,
    m_tubo: Number(document.getElementById('m-tubo-m').value) || 0,
    cable_instr: document.getElementById('m-cable-instr').value,
    m_cable_instr: Number(document.getElementById('m-cable-instr-m').value) || 0,
    cable_datos: document.getElementById('m-cable-datos').value,
    m_cable_datos: Number(document.getElementById('m-cable-datos-m').value) || 0,
    cable_elec: document.getElementById('m-cable-elec').value,
    m_cable_elec: Number(document.getElementById('m-cable-elec-m').value) || 0,
    observacion: document.getElementById('m-observacion').value.trim(),
  };

  if (modalEditId) {
    const idx = lev.items.findIndex(x => x.id_temp === modalEditId);
    if (idx >= 0) lev.items[idx] = { ...lev.items[idx], ...data };
  } else {
    lev.items.push({ id_temp: 'L' + (nextLevId++), ...data });
  }

  guardarEnSesion();
  cerrarModal();
  renderLista();
}

// ===== LISTA DEL LEVANTAMIENTO =====

function renderLista() {
  const cont = document.getElementById('lev-list');
  const counter = document.getElementById('lev-count');
  counter.textContent = lev.items.length;

  if (lev.items.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="icon">▱</div>
        <p>Sin equipos registrados. Busca arriba en el catálogo y haz click en un equipo para agregarlo con su detalle técnico.</p>
      </div>`;
    return;
  }

  cont.innerHTML = lev.items.map(it => {
    const p = CATALOGO.find(x => x.id === it.producto_id);
    if (!p) return '';
    const tubo = RECETAS_TUBO[it.tipo_tubo];
    const inst = RECETAS_CABLE[it.cable_instr];
    const dat = RECETAS_CABLE[it.cable_datos];
    const ele = RECETAS_CABLE[it.cable_elec];

    const detalles = [];
    if (it.ubicacion) detalles.push(`<span>📍 ${it.ubicacion}</span>`);
    detalles.push(`<span>Altura: ${it.altura_mayor_3m ? '>3m' : '<3m'}</span>`);
    if (tubo && it.tipo_tubo !== 'NINGUNO' && it.m_tubo > 0) detalles.push(`<span>${tubo.nombre}: ${it.m_tubo}m</span>`);
    if (inst && it.cable_instr !== 'NINGUNO' && it.m_cable_instr > 0) detalles.push(`<span>${inst.nombre}: ${it.m_cable_instr}m</span>`);
    if (dat && it.cable_datos !== 'NINGUNO' && it.m_cable_datos > 0) detalles.push(`<span>${dat.nombre}: ${it.m_cable_datos}m</span>`);
    if (ele && it.cable_elec !== 'NINGUNO' && it.m_cable_elec > 0) detalles.push(`<span>${ele.nombre}: ${it.m_cable_elec}m</span>`);

    return `
      <div class="lev-item">
        <div>
          <div class="lev-head">
            <span class="lev-cant">×${it.cantidad}</span>
            <span class="lev-name">${p.nombre}</span>
            <span class="text-muted mono" style="font-size:10px;">${p.sku}</span>
          </div>
          <div class="lev-detail">
            ${detalles.join('')}
          </div>
          ${it.observacion ? `<div class="text-muted" style="font-size:12px;margin-top:8px;font-style:italic;">"${it.observacion}"</div>` : ''}
        </div>
        <div class="lev-actions">
          <button class="btn btn-ghost btn-sm" onclick="abrirModalParaEditar('${it.id_temp}')" title="Editar">✎</button>
          <button class="btn btn-ghost btn-sm" onclick="quitarItem('${it.id_temp}')" title="Quitar">✕</button>
        </div>
      </div>`;
  }).join('');
}

function quitarItem(id_temp) {
  lev.items = lev.items.filter(x => x.id_temp !== id_temp);
  guardarEnSesion();
  renderLista();
}

// ===== REQUERIMIENTOS ADICIONALES (modal por grupo) =====

function abrirModalReq(grupo_key) {
  modalReqGrupo = grupo_key;
  const grupo = REQUERIMIENTOS_GRUPOS[grupo_key];
  if (!grupo) return;

  document.getElementById('modal-req-eyebrow').textContent = 'Requerimientos · ' + grupo.nombre;
  document.getElementById('modal-req-titulo').innerHTML = grupo.icono + ' ' + grupo.nombre;
  document.getElementById('modal-req-desc').textContent = grupo.descripcion;

  // Filtrar todos los conceptos que pertenecen a este grupo
  const conceptos = COSTOS_ADICIONALES.filter(a => grupo.categorias.includes(a.categoria));

  // Para cada concepto, ver si ya está registrado en lev.requerimientos
  const filas = conceptos.map(c => {
    const existente = lev.requerimientos.find(r => r.adic_id === c.id);
    const checked = !!existente;
    const cantidad = existente ? existente.cantidad : '';
    return `
      <tr class="${checked ? 'active' : ''}" data-id="${c.id}">
        <td class="req-check">
          <input type="checkbox" id="chk-${c.id}" ${checked ? 'checked' : ''} onchange="toggleReqRow('${c.id}')">
        </td>
        <td class="req-desc-cell">
          <span class="req-codigo">${c.codigo}</span>
          <label for="chk-${c.id}" style="cursor:pointer;display:inline;font-family:var(--font-body);font-size:13px;text-transform:none;letter-spacing:0;color:var(--text-primary);margin:0;">${c.nombre}</label>
        </td>
        <td class="req-cant">
          <input type="number" id="cant-${c.id}" min="0" step="0.5" value="${cantidad}" placeholder="0" onfocus="document.getElementById('chk-${c.id}').checked=true;toggleReqRow('${c.id}')">
        </td>
        <td class="req-unit">${c.unidad}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('modal-req-items').innerHTML = `
    <table class="req-modal-table">
      <thead>
        <tr>
          <th class="center" style="width:32px;"></th>
          <th>Concepto</th>
          <th class="right" style="width:90px;">Cantidad</th>
          <th style="width:80px;">Unidad</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <p class="text-muted" style="font-size:11px;margin-top:12px;">Marca los conceptos aplicables y registra la cantidad estimada. Los costos los define el equipo comercial.</p>
  `;

  document.getElementById('modal-req').classList.add('open');
}

function toggleReqRow(adic_id) {
  const row = document.querySelector(`#modal-req-items tr[data-id="${adic_id}"]`);
  const chk = document.getElementById('chk-' + adic_id);
  if (row && chk) {
    row.classList.toggle('active', chk.checked);
  }
}

function cerrarModalReq() {
  document.getElementById('modal-req').classList.remove('open');
  modalReqGrupo = null;
}

function guardarReqModal() {
  if (!modalReqGrupo) return;
  const grupo = REQUERIMIENTOS_GRUPOS[modalReqGrupo];
  if (!grupo) return;

  // Sacar los IDs de los conceptos de este grupo
  const conceptos = COSTOS_ADICIONALES.filter(a => grupo.categorias.includes(a.categoria));

  // Quitar primero todos los requerimientos previos de este grupo
  lev.requerimientos = lev.requerimientos.filter(r => r.grupo !== modalReqGrupo);

  // Agregar los que están marcados con cantidad > 0
  conceptos.forEach(c => {
    const chk = document.getElementById('chk-' + c.id);
    const cant = document.getElementById('cant-' + c.id);
    if (chk && chk.checked) {
      const cantidad = Number(cant?.value);
      if (cantidad > 0) {
        lev.requerimientos.push({
          id_temp: 'R' + (nextReqId++),
          adic_id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          categoria: c.categoria,
          grupo: modalReqGrupo,
          unidad: c.unidad,
          cantidad: cantidad,
        });
      }
    }
  });

  guardarEnSesion();
  cerrarModalReq();
  renderRequerimientos();
}

function renderRequerimientos() {
  const cont = document.getElementById('req-list');
  const counter = document.getElementById('req-count');
  counter.textContent = lev.requerimientos.length;

  if (lev.requerimientos.length === 0) {
    cont.innerHTML = `<div class="empty-state" style="padding:24px;"><p style="font-size:12px;">Sin requerimientos adicionales registrados. Si en la inspección detectaste que se necesita movilización, obra civil o algún trabajo especial, agrégalo con los botones de arriba.</p></div>`;
    return;
  }

  // Agrupar por grupo
  const porGrupo = {};
  lev.requerimientos.forEach(r => {
    if (!porGrupo[r.grupo]) porGrupo[r.grupo] = [];
    porGrupo[r.grupo].push(r);
  });

  cont.innerHTML = Object.entries(porGrupo).map(([gKey, items]) => {
    const g = REQUERIMIENTOS_GRUPOS[gKey];
    return items.map(r => `
      <div class="req-item">
        <div class="req-item-icon">${g.icono}</div>
        <div class="req-item-body">
          <div class="req-item-name">${r.nombre}</div>
          <div class="req-item-meta">
            <span class="req-grupo">${g.nombre.toUpperCase()}</span>
            ${r.cantidad} ${r.unidad}
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" onclick="quitarRequerimiento('${r.id_temp}')" title="Quitar">✕</button>
      </div>
    `).join('');
  }).join('');
}

function quitarRequerimiento(id_temp) {
  lev.requerimientos = lev.requerimientos.filter(r => r.id_temp !== id_temp);
  guardarEnSesion();
  renderRequerimientos();
}

// ===== ACCIONES FINALES =====

function guardarBorrador() {
  guardarEnSesion();
  if (!lev.proyecto.cliente) {
    alert('Falta ingresar el nombre del cliente.');
    return;
  }
  alert(`Borrador guardado.\n\nProyecto: ${lev.proyecto.cliente}\nEquipos registrados: ${lev.items.length}\n\nCuando se conecte la base de datos (Supabase), este borrador quedará en la nube.`);
}

function enviarACotizar() {
  if (!lev.proyecto.cliente) {
    alert('Falta ingresar el nombre del cliente antes de enviar a cotizar.');
    return;
  }
  if (lev.items.length === 0) {
    alert('No has registrado ningún equipo. Agrega al menos uno antes de enviar a cotizar.');
    return;
  }
  // Guardar y redirigir a vista del cotizador
  guardarEnSesion();
  // Marcar el levantamiento como "enviado"
  sessionStorage.setItem('totem_lev_enviado', '1');
  window.location.href = 'oferta.html';
}

// ===== INIT =====

// ===== INIT =====

function iniciarLevantamiento() {
  cargarDeSesion();
  document.getElementById('catalog-count').textContent = CATALOGO.length;
  poblarSelectsModal();
  aplicarProyectoAUI();
  bindProyectoInputs();
  renderBuscador('');
  renderLista();
  renderRequerimientos();

  const search = document.getElementById('pos-search-input');
  if (search) search.addEventListener('input', e => renderBuscador(e.target.value));

  // Cerrar modal con ESC o click en overlay
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      cerrarModal();
      cerrarModalReq();
    }
  });
  const modalEq = document.getElementById('modal-equipo');
  if (modalEq) modalEq.addEventListener('click', e => {
    if (e.target.id === 'modal-equipo') cerrarModal();
  });
  const modalRq = document.getElementById('modal-req');
  if (modalRq) modalRq.addEventListener('click', e => {
    if (e.target.id === 'modal-req') cerrarModalReq();
  });
}
window.iniciarLevantamiento = iniciarLevantamiento;
