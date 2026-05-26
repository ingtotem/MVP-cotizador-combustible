/* LEVANTAMIENTO v6 — Selector POS con auto-switch */

if (!window.__TOTEM_LEV_INITIALIZED__) {
  window.__TOTEM_LEV_INITIALIZED__ = true;
  const STORAGE_KEY = 'totem_levantamiento_actual';

  window.lev = {
    proyecto: { cliente:'', contacto:'', telefono:'', referencia:'', lugar:'', coords:'', problema:'' },
    items: [], requerimientos: [],
  };
  window.nextLevId = 1;
  window.nextReqId = 1;
  window.familiaSeleccionada = null;
  window.busquedaActual = '';
  window.modalEditId = null;
  window.modalProductoId = null;
  window.modalReqGrupo = null;

  window.guardarEnSesion = function() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        lev: window.lev, nextLevId: window.nextLevId, nextReqId: window.nextReqId,
      }));
    } catch (e) {}
  };

  window.cargarDeSesion = function() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.lev) {
        Object.assign(window.lev.proyecto, data.lev.proyecto || {});
        window.lev.items = data.lev.items || [];
        window.lev.requerimientos = data.lev.requerimientos || [];
      }
      if (data.nextLevId) window.nextLevId = data.nextLevId;
      if (data.nextReqId) window.nextReqId = data.nextReqId;
    } catch (e) {}
  };

  window.bindProyectoInputs = function() {
    ['cliente','contacto','telefono','referencia','lugar','coords','problema'].forEach(f => {
      const el = document.getElementById('lev-' + f);
      if (!el) return;
      el.addEventListener('input', e => { window.lev.proyecto[f] = e.target.value; window.guardarEnSesion(); });
    });
  };

  window.aplicarProyectoAUI = function() {
    Object.entries(window.lev.proyecto).forEach(([k,v]) => {
      const el = document.getElementById('lev-' + k);
      if (el) el.value = v || '';
    });
  };

  window.renderFamilias = function() {
    const cont = document.getElementById('familias-grid');
    if (!cont) return;
    const busq = window.busquedaActual.trim().toLowerCase();
    let familias = window.FAMILIAS;

    if (busq) {
      const matched = new Set();
      window.CATALOGO.forEach(p => {
        const t = [p.sku,p.nombre,p.marca,p.modelo,p.familia_nombre,p.caracteristica_label].join(' ').toLowerCase();
        if (t.includes(busq)) matched.add(p.familia);
      });
      familias = familias.filter(f => matched.has(f.codigo));
    }

    if (familias.length === 0) {
      cont.innerHTML = `<div class="empty-models">Sin resultados</div>`;
      return;
    }

    cont.innerHTML = familias.map(f => {
      const count = window.getCantidadEnFamilia(f.codigo);
      const isActive = window.familiaSeleccionada === f.codigo;
      return `
        <div class="familia-card ${isActive?'active':''}" onclick="seleccionarFamilia('${f.codigo}')">
          <div class="icon-wrap">${window.getIcon(f.icono, 24)}</div>
          <div class="nombre">${f.nombre}</div>
          <div class="count-badge">${count} ${count===1?'modelo':'modelos'}</div>
        </div>`;
    }).join('');
  };

  window.seleccionarFamilia = function(codigo) {
    window.familiaSeleccionada = window.familiaSeleccionada === codigo ? null : codigo;
    window.renderFamilias();
    window.renderModelos();
  };

  window.renderModelos = function() {
    const cont = document.getElementById('modelos-grid');
    const title = document.getElementById('modelos-title');
    if (!cont) return;
    const busq = window.busquedaActual.trim().toLowerCase();
    let productos = [];

    if (window.familiaSeleccionada) {
      productos = window.getProductosDeFamilia(window.familiaSeleccionada);
      if (title) {
        const fam = window.FAMILIAS.find(f => f.codigo === window.familiaSeleccionada);
        title.innerHTML = `Modelos disponibles <span class="count">${fam?.nombre || ''}</span>`;
      }
    } else if (busq) {
      productos = window.CATALOGO.filter(p => {
        const t = [p.sku,p.nombre,p.marca,p.modelo,p.familia_nombre,p.caracteristica_label].join(' ').toLowerCase();
        return t.includes(busq);
      }).slice(0, 12);
      if (title) title.innerHTML = `Resultados de búsqueda <span class="count">${productos.length}</span>`;
    } else {
      if (title) title.innerHTML = `<span style="opacity:0.5">Selecciona una familia para ver modelos</span>`;
      cont.innerHTML = '';
      return;
    }

    if (busq && window.familiaSeleccionada) {
      productos = productos.filter(p => {
        const t = [p.sku,p.nombre,p.marca,p.caracteristica_label].join(' ').toLowerCase();
        return t.includes(busq);
      });
    }

    if (productos.length === 0) {
      cont.innerHTML = `<div class="empty-models">No hay modelos en esta familia${busq?' que coincidan con la búsqueda':''}.</div>`;
      return;
    }

    cont.innerHTML = productos.map(p => `
      <div class="modelo-card" onclick="abrirModalParaNuevo('${p.id}')">
        <div class="add-icon">＋</div>
        <div class="marca">${p.marca || '—'}</div>
        <div class="caracteristica">${p.caracteristica_label || p.nombre}</div>
        <div class="sku">${p.sku}</div>
        <div class="precio">
          <span class="label">PVP</span>
          $${p.pvp.toFixed(2)}
        </div>
      </div>`).join('');
  };

  window.poblarSelectsModal = function() {
    const tubo = document.getElementById('modal-tipo-tubo');
    if (tubo) tubo.innerHTML = Object.entries(window.RECETAS_TUBO).map(([k,v]) => `<option value="${k}">${v.nombre}</option>`).join('');
    const fillCable = (sel, tipoFiltro) => {
      if (!sel) return;
      sel.innerHTML = Object.entries(window.RECETAS_CABLE).filter(([k,v]) => v.tipo===tipoFiltro || k==='NINGUNO').map(([k,v]) => `<option value="${k}">${v.nombre}</option>`).join('');
    };
    fillCable(document.getElementById('modal-cable-instr'), 'instrumentacion');
    fillCable(document.getElementById('modal-cable-datos'), 'datos');
    fillCable(document.getElementById('modal-cable-elec'), 'electrico');
  };

  window.abrirModalParaNuevo = function(producto_id) {
    window.modalEditId = null;
    window.modalProductoId = producto_id;
    const prod = window.CATALOGO.find(p => p.id === producto_id);
    if (!prod) return;
    document.getElementById('modal-titulo').textContent = prod.nombre;
    document.getElementById('modal-sku').textContent = prod.sku + ' · ' + (prod.marca || '');
    document.getElementById('modal-cantidad').value = 1;
    document.getElementById('modal-ubicacion').value = '';
    document.getElementById('modal-altura').checked = false;
    document.getElementById('modal-tipo-tubo').value = 'NINGUNO';
    document.getElementById('modal-m-tubo').value = 0;
    document.getElementById('modal-cable-instr').value = 'NINGUNO';
    document.getElementById('modal-m-cable-instr').value = 0;
    document.getElementById('modal-cable-datos').value = 'NINGUNO';
    document.getElementById('modal-m-cable-datos').value = 0;
    document.getElementById('modal-cable-elec').value = 'NINGUNO';
    document.getElementById('modal-m-cable-elec').value = 0;
    document.getElementById('modal-observacion').value = '';
    document.getElementById('modal-equipo').classList.add('open');
  };

  window.abrirModalParaEditar = function(id_temp) {
    const item = window.lev.items.find(x => x.id_temp === id_temp);
    if (!item) return;
    window.modalEditId = id_temp;
    window.modalProductoId = item.producto_id;
    const prod = window.CATALOGO.find(p => p.id === item.producto_id);
    if (!prod) return;
    document.getElementById('modal-titulo').textContent = prod.nombre;
    document.getElementById('modal-sku').textContent = prod.sku + ' · ' + (prod.marca || '');
    document.getElementById('modal-cantidad').value = item.cantidad;
    document.getElementById('modal-ubicacion').value = item.ubicacion || '';
    document.getElementById('modal-altura').checked = !!item.altura_mayor_3m;
    document.getElementById('modal-tipo-tubo').value = item.tipo_tubo || 'NINGUNO';
    document.getElementById('modal-m-tubo').value = item.m_tubo || 0;
    document.getElementById('modal-cable-instr').value = item.cable_instr || 'NINGUNO';
    document.getElementById('modal-m-cable-instr').value = item.m_cable_instr || 0;
    document.getElementById('modal-cable-datos').value = item.cable_datos || 'NINGUNO';
    document.getElementById('modal-m-cable-datos').value = item.m_cable_datos || 0;
    document.getElementById('modal-cable-elec').value = item.cable_elec || 'NINGUNO';
    document.getElementById('modal-m-cable-elec').value = item.m_cable_elec || 0;
    document.getElementById('modal-observacion').value = item.observacion || '';
    document.getElementById('modal-equipo').classList.add('open');
  };

  window.cerrarModal = function() {
    document.getElementById('modal-equipo').classList.remove('open');
    window.modalEditId = null;
    window.modalProductoId = null;
  };

  window.guardarItemModal = function() {
    if (!window.modalProductoId) return;
    const data = {
      producto_id: window.modalProductoId,
      cantidad: Number(document.getElementById('modal-cantidad').value) || 1,
      ubicacion: document.getElementById('modal-ubicacion').value.trim(),
      altura_mayor_3m: document.getElementById('modal-altura').checked,
      tipo_tubo: document.getElementById('modal-tipo-tubo').value,
      m_tubo: Number(document.getElementById('modal-m-tubo').value) || 0,
      cable_instr: document.getElementById('modal-cable-instr').value,
      m_cable_instr: Number(document.getElementById('modal-m-cable-instr').value) || 0,
      cable_datos: document.getElementById('modal-cable-datos').value,
      m_cable_datos: Number(document.getElementById('modal-m-cable-datos').value) || 0,
      cable_elec: document.getElementById('modal-cable-elec').value,
      m_cable_elec: Number(document.getElementById('modal-m-cable-elec').value) || 0,
      observacion: document.getElementById('modal-observacion').value.trim(),
    };
    if (window.modalEditId) {
      const idx = window.lev.items.findIndex(x => x.id_temp === window.modalEditId);
      if (idx >= 0) window.lev.items[idx] = { ...window.lev.items[idx], ...data };
    } else {
      window.lev.items.push({ id_temp: 'L' + (window.nextLevId++), ...data });
    }
    window.guardarEnSesion();
    window.cerrarModal();
    window.renderLista();
  };

  window.quitarItem = function(id_temp) {
    window.lev.items = window.lev.items.filter(x => x.id_temp !== id_temp);
    window.guardarEnSesion();
    window.renderLista();
  };

  window.cambiarMarcaItem = function(id_temp, nuevaMarca) {
    const item = window.lev.items.find(x => x.id_temp === id_temp);
    if (!item) return;
    const prodActual = window.CATALOGO.find(p => p.id === item.producto_id);
    if (!prodActual) return;
    const prodNuevo = window.getProductoEquivalente(prodActual, nuevaMarca);
    if (!prodNuevo) {
      alert(`No existe equivalente de ${prodActual.caracteristica_label} en marca ${nuevaMarca}.`);
      window.renderLista();
      return;
    }
    item.producto_id = prodNuevo.id;
    window.guardarEnSesion();
    window.renderLista();
  };

  window.renderLista = function() {
    const cont = document.getElementById('lev-list');
    const count = document.getElementById('lev-count');
    if (!cont || !count) return;
    count.textContent = window.lev.items.length;

    if (window.lev.items.length === 0) {
      cont.innerHTML = `<div class="empty-state" style="padding:32px;"><p>Sin equipos registrados. Selecciona una familia y haz click en un modelo.</p></div>`;
      return;
    }

    cont.innerHTML = window.lev.items.map(it => {
      const p = window.CATALOGO.find(x => x.id === it.producto_id);
      if (!p) return '';
      const marcas = p.familia ? window.getMarcasDeFamilia(p.familia) : [];
      const tieneAlt = marcas.length > 1;

      return `
        <div class="cart-line">
          <div>
            <div class="line-sku">${p.sku}</div>
            <div class="line-name">${p.nombre}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
              ${tieneAlt ? `
                <span class="marca-switcher" title="Cambiar marca">
                  <select onchange="cambiarMarcaItem('${it.id_temp}', this.value)">
                    ${marcas.map(m => `<option value="${m}" ${m===p.marca?'selected':''}>${m}</option>`).join('')}
                  </select>
                </span>
              ` : `<span class="badge badge-v">${p.marca}</span>`}
              <span style="margin-left:8px;color:var(--text-primary);font-weight:600;">${p.caracteristica_label || ''}</span>
              ${it.altura_mayor_3m ? '<span class="badge badge-v" style="margin-left:8px;">altura &gt;3m</span>' : ''}
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;font-size:12px;">
              <div><label style="font-size:10px;">Cantidad</label><div class="mono" style="font-weight:600;font-size:14px;">${it.cantidad}</div></div>
              <div><label style="font-size:10px;">Ubicación</label><div style="font-size:13px;">${it.ubicacion || '—'}</div></div>
              <div><label style="font-size:10px;">Tubo / Cable</label><div class="mono" style="font-size:11px;">${it.tipo_tubo !== 'NINGUNO' ? it.tipo_tubo+' '+it.m_tubo+'m' : 'Sin tubo'}</div></div>
            </div>
            ${it.observacion ? `<div style="font-size:11px;color:var(--text-muted);margin-top:6px;font-style:italic;">${it.observacion}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-self:flex-start;">
            <button class="btn btn-ghost btn-icon" onclick="abrirModalParaEditar('${it.id_temp}')" title="Editar">✎</button>
            <button class="btn btn-ghost btn-icon" onclick="quitarItem('${it.id_temp}')" title="Quitar">✕</button>
          </div>
        </div>`;
    }).join('');
  };

  // REQUERIMIENTOS
  window.abrirModalReq = function(grupo_key) {
    window.modalReqGrupo = grupo_key;
    const grupo = window.REQUERIMIENTOS_GRUPOS[grupo_key];
    if (!grupo) return;
    document.getElementById('modal-req-eyebrow').textContent = 'Requerimientos · ' + grupo.nombre;
    document.getElementById('modal-req-titulo').innerHTML = (grupo.icono || '') + ' ' + grupo.nombre;
    document.getElementById('modal-req-desc').textContent = grupo.descripcion;
    const conceptos = window.COSTOS_ADICIONALES.filter(a => grupo.categorias.includes(a.categoria));
    const filas = conceptos.map(c => {
      const ex = window.lev.requerimientos.find(r => r.adic_id === c.id);
      const checked = !!ex;
      const cant = ex ? ex.cantidad : '';
      return `<tr class="${checked?'active':''}" data-id="${c.id}">
        <td class="req-check"><input type="checkbox" id="chk-${c.id}" ${checked?'checked':''} onchange="toggleReqRow('${c.id}')"></td>
        <td><span class="req-codigo">${c.codigo}</span><label for="chk-${c.id}" style="cursor:pointer;display:inline;font-size:13px;text-transform:none;letter-spacing:0;color:var(--text-primary);margin:0;">${c.nombre}</label></td>
        <td class="req-cant"><input type="number" id="cant-${c.id}" min="0" step="0.5" value="${cant}" placeholder="0" onfocus="document.getElementById('chk-${c.id}').checked=true;toggleReqRow('${c.id}')"></td>
        <td class="req-unit">${c.unidad}</td>
      </tr>`;
    }).join('');
    document.getElementById('modal-req-items').innerHTML = `
      <table class="req-modal-table">
        <thead><tr><th class="center" style="width:32px;"></th><th>Concepto</th><th class="right" style="width:90px;">Cantidad</th><th style="width:80px;">Unidad</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <p class="text-muted" style="font-size:11px;margin-top:12px;">Marca los conceptos aplicables y registra la cantidad estimada.</p>`;
    document.getElementById('modal-req').classList.add('open');
  };

  window.toggleReqRow = function(adic_id) {
    const row = document.querySelector(`#modal-req-items tr[data-id="${adic_id}"]`);
    const chk = document.getElementById('chk-' + adic_id);
    if (row && chk) row.classList.toggle('active', chk.checked);
  };

  window.cerrarModalReq = function() {
    document.getElementById('modal-req').classList.remove('open');
    window.modalReqGrupo = null;
  };

  window.guardarReqModal = function() {
    if (!window.modalReqGrupo) return;
    const grupo = window.REQUERIMIENTOS_GRUPOS[window.modalReqGrupo];
    if (!grupo) return;
    const conceptos = window.COSTOS_ADICIONALES.filter(a => grupo.categorias.includes(a.categoria));
    window.lev.requerimientos = window.lev.requerimientos.filter(r => r.grupo !== window.modalReqGrupo);
    conceptos.forEach(c => {
      const chk = document.getElementById('chk-' + c.id);
      const cant = document.getElementById('cant-' + c.id);
      if (chk && chk.checked) {
        const cantidad = Number(cant?.value);
        if (cantidad > 0) {
          window.lev.requerimientos.push({
            id_temp: 'R' + (window.nextReqId++),
            adic_id: c.id, codigo: c.codigo, nombre: c.nombre,
            categoria: c.categoria, grupo: window.modalReqGrupo,
            unidad: c.unidad, cantidad,
          });
        }
      }
    });
    window.guardarEnSesion();
    window.cerrarModalReq();
    window.renderRequerimientos();
  };

  window.renderRequerimientos = function() {
    const cont = document.getElementById('req-list');
    const counter = document.getElementById('req-count');
    if (!cont || !counter) return;
    counter.textContent = window.lev.requerimientos.length;
    if (window.lev.requerimientos.length === 0) {
      cont.innerHTML = `<div class="empty-state" style="padding:24px;"><p style="font-size:12px;">Sin requerimientos adicionales.</p></div>`;
      return;
    }
    const porGrupo = {};
    window.lev.requerimientos.forEach(r => { (porGrupo[r.grupo] = porGrupo[r.grupo] || []).push(r); });
    cont.innerHTML = Object.entries(porGrupo).map(([gKey, items]) => {
      const g = window.REQUERIMIENTOS_GRUPOS[gKey] || { nombre: gKey, icono: '·' };
      return items.map(r => `
        <div class="req-item">
          <div class="req-item-icon">${g.icono}</div>
          <div class="req-item-body">
            <div class="req-item-name">${r.nombre}</div>
            <div class="req-item-meta"><span class="req-grupo">${g.nombre.toUpperCase()}</span>${r.cantidad} ${r.unidad}</div>
          </div>
          <button class="btn btn-ghost btn-icon" onclick="quitarRequerimiento('${r.id_temp}')" title="Quitar">✕</button>
        </div>`).join('');
    }).join('');
  };

  window.quitarRequerimiento = function(id_temp) {
    window.lev.requerimientos = window.lev.requerimientos.filter(r => r.id_temp !== id_temp);
    window.guardarEnSesion();
    window.renderRequerimientos();
  };

  window.guardarBorrador = function() {
    window.guardarEnSesion();
    alert('Borrador guardado.');
  };

  window.enviarACotizar = function() {
    if (!window.lev.proyecto.cliente || !window.lev.proyecto.cliente.trim()) {
      alert('Falta el cliente.'); return;
    }
    if (window.lev.items.length === 0) {
      alert('No has agregado equipos.'); return;
    }
    sessionStorage.setItem('totem_lev_enviado', JSON.stringify({
      lev: window.lev, enviado_en: new Date().toISOString(),
    }));
    window.location.href = 'oferta.html';
  };

  window.iniciarLevantamiento = function() {
    window.cargarDeSesion();
    window.poblarSelectsModal();
    window.aplicarProyectoAUI();
    window.bindProyectoInputs();
    window.renderFamilias();
    window.renderModelos();
    window.renderLista();
    window.renderRequerimientos();

    const search = document.getElementById('pos-search-input');
    if (search) {
      search.addEventListener('input', e => {
        window.busquedaActual = e.target.value;
        window.renderFamilias();
        window.renderModelos();
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { window.cerrarModal(); window.cerrarModalReq(); }
    });
    const me = document.getElementById('modal-equipo');
    if (me) me.addEventListener('click', e => { if (e.target.id === 'modal-equipo') window.cerrarModal(); });
    const mr = document.getElementById('modal-req');
    if (mr) mr.addEventListener('click', e => { if (e.target.id === 'modal-req') window.cerrarModalReq(); });
  };
}

var lev = window.lev;
var iniciarLevantamiento = window.iniciarLevantamiento;
var seleccionarFamilia = window.seleccionarFamilia;
var abrirModalParaNuevo = window.abrirModalParaNuevo;
var abrirModalParaEditar = window.abrirModalParaEditar;
var cerrarModal = window.cerrarModal;
var guardarItemModal = window.guardarItemModal;
var quitarItem = window.quitarItem;
var cambiarMarcaItem = window.cambiarMarcaItem;
var abrirModalReq = window.abrirModalReq;
var toggleReqRow = window.toggleReqRow;
var cerrarModalReq = window.cerrarModalReq;
var guardarReqModal = window.guardarReqModal;
var quitarRequerimiento = window.quitarRequerimiento;
var guardarBorrador = window.guardarBorrador;
var enviarACotizar = window.enviarACotizar;
