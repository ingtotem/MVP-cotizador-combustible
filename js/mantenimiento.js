/* ============================================================
   MANTENIMIENTO v6.1 — CRUD inline, robusto, con logs
   ============================================================ */

if (!window.__TOTEM_MANT_INITIALIZED__) {
  window.__TOTEM_MANT_INITIALIZED__ = true;

  const sb = () => window.supabaseClient;
  const $ = id => document.getElementById(id);

  // ========== TOAST ==========
  window.toast = function(msg, tipo) {
    const t = document.createElement('div');
    t.className = 'toast ' + (tipo || 'success');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  };

  function flashRow(tr) {
    if (!tr) return;
    tr.classList.remove('row-error');
    tr.classList.add('row-saved');
    setTimeout(() => tr.classList.remove('row-saved'), 1100);
  }
  function errorRow(tr, msg) {
    if (tr) tr.classList.add('row-error');
    toast(msg || 'Error al guardar', 'error');
  }

  // Wrapper genérico para que un error en una tabla NO rompa las demás
  function safeRender(name, fn) {
    try {
      fn();
    } catch (e) {
      console.error(`[Mantenimiento] Error en ${name}:`, e);
      toast(`Error renderizando ${name}: ${e.message}`, 'error');
    }
  }

  // Inputs reusables
  function inp(value, opts = {}) {
    const v = value === null || value === undefined ? '' : value;
    const cls = opts.cls || '';
    const type = opts.type || 'text';
    const ph = opts.placeholder || '';
    return `<input type="${type}" value="${escapeAttr(v)}" data-field="${opts.field}" class="${cls}" placeholder="${ph}" ${opts.step ? `step="${opts.step}"` : ''} ${opts.min !== undefined ? `min="${opts.min}"` : ''}>`;
  }
  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function esc(s) { return escapeAttr(s); }
  function escId(s) { return String(s).replace(/[^a-zA-Z0-9_]/g, '_'); }

  function sel(value, options, fieldName, opts = {}) {
    const v = value || '';
    const opciones = options.map(o => {
      const val = typeof o === 'string' ? o : o.value;
      const txt = typeof o === 'string' ? o : o.text;
      return `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(txt)}</option>`;
    }).join('');
    return `<select data-field="${fieldName}">${opts.allowEmpty ? '<option value=""></option>' : ''}${opciones}</select>`;
  }

  function leerCamposFila(tr) {
    const data = {};
    if (!tr) return data;
    tr.querySelectorAll('[data-field]').forEach(el => {
      let v = el.value;
      if (el.type === 'number') v = v === '' ? null : Number(v);
      else if (typeof v === 'string') v = v.trim();
      data[el.dataset.field] = v;
    });
    return data;
  }

  // ========== Búsqueda en catálogo ==========
  let busquedaCatalogo = '';
  document.addEventListener('DOMContentLoaded', () => {
    const search = $('cat-search');
    if (search) {
      search.addEventListener('input', e => {
        busquedaCatalogo = e.target.value.toLowerCase();
        safeRender('catalogo', renderCatalogo);
      });
    }
  });

  // ========== CATÁLOGO ==========
  window.renderCatalogo = function() {
    const tbody = $('tbody-catalogo');
    if (!tbody) { console.warn('tbody-catalogo no encontrado'); return; }

    const familiasOpts = (window.FAMILIAS || []).map(f => ({ value: f.codigo, text: f.nombre }));
    familiasOpts.unshift({ value: '', text: '— sin familia —' });
    const categoriasMO = Object.keys(window.RECETAS_MANO_OBRA || {});
    if (categoriasMO.length === 0) categoriasMO.push('OTROS');

    let productos = (window.CATALOGO || []).slice().sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
    if (busquedaCatalogo) {
      productos = productos.filter(p => {
        const t = [p.sku, p.nombre, p.marca, p.familia_nombre, p.caracteristica_label].join(' ').toLowerCase();
        return t.includes(busquedaCatalogo);
      });
    }

    if (productos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-muted" style="text-align:center;padding:32px;">Sin productos${busquedaCatalogo ? ' que coincidan' : '. Pulsa "+ Producto".'}.</td></tr>`;
      return;
    }

    tbody.innerHTML = productos.map(p => `
      <tr data-id="${p.id}" data-tipo="producto">
        <td>${inp(p.sku, { field: 'sku' })}</td>
        <td>${inp(p.nombre, { field: 'nombre' })}</td>
        <td>${sel(p.familia, familiasOpts, 'familia', { allowEmpty: false })}</td>
        <td>${inp(p.marca, { field: 'marca' })}</td>
        <td>
          ${inp(p.caracteristica, { field: 'caracteristica', placeholder: '1500' })}
          ${inp(p.caracteristica_label, { field: 'caracteristica_label', placeholder: '1500 mm' })}
        </td>
        <td>${sel(p.categoria_mo, categoriasMO, 'categoria_mo')}</td>
        <td>${inp(p.costo, { field: 'costo', type: 'number', step: '0.01', min: 0, cls: 'mono' })}</td>
        <td>${inp(p.pvp, { field: 'pvp', type: 'number', step: '0.01', min: 0, cls: 'mono' })}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="guardarProducto('${p.id}')">💾</button>
            <button class="btn btn-ghost btn-sm" onclick="confirmarDesactivarProducto('${p.id}')">⊘</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  window.guardarProducto = async function(id) {
    const tr = document.querySelector(`tr[data-id="${id}"][data-tipo="producto"]`);
    if (!tr) return;
    const d = leerCamposFila(tr);
    const fam = (window.FAMILIAS || []).find(f => f.codigo === d.familia);
    const payload = {
      sku: d.sku, nombre: d.nombre, marca: d.marca,
      familia: d.familia || null,
      familia_nombre: fam ? fam.nombre : null,
      icono: fam ? fam.icono : 'default',
      caracteristica: d.caracteristica,
      caracteristica_label: d.caracteristica_label,
      categoria_mo: d.categoria_mo,
      costo: Number(d.costo) || 0,
      pvp: Number(d.pvp) || 0,
      grupo: fam ? fam.grupo : null,
    };
    try {
      const { error } = await sb().from('catalogo_productos').update(payload).eq('id', id);
      if (error) { errorRow(tr, error.message); return; }
      const idx = window.CATALOGO.findIndex(p => p.id === id);
      if (idx >= 0) Object.assign(window.CATALOGO[idx], payload, { familia_nombre: payload.familia_nombre || '' });
      flashRow(tr);
      toast('Producto guardado: ' + d.sku);
    } catch (e) { errorRow(tr, e.message); }
  };

  window.agregarProductoNuevo = async function() {
    const sku = prompt('SKU del nuevo producto:');
    if (!sku) return;
    const nombre = prompt('Nombre:', sku);
    if (!nombre) return;
    const ids = (window.CATALOGO || []).map(p => p.id).filter(id => /^P\d+$/.test(id));
    const max = ids.reduce((m, id) => Math.max(m, parseInt(id.slice(1))), 0);
    const newId = 'P' + String(max + 1).padStart(3, '0');
    const payload = {
      id: newId, sku, nombre, marca: 'TOTEM GAS', modelo: '',
      grupo: 'SENSORES', unidad: 'UN', costo: 0, pvp: 0,
      categoria_mo: 'SENSORES', activo: true,
      familia: null, familia_nombre: null, caracteristica: '', caracteristica_label: '', icono: 'default',
    };
    try {
      const { error } = await sb().from('catalogo_productos').insert(payload);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.CATALOGO.push({ ...payload, costo: 0, pvp: 0 });
      $('kpi-productos').textContent = window.CATALOGO.length;
      safeRender('catalogo', renderCatalogo);
      toast('Producto creado');
    } catch (e) { toast(e.message, 'error'); }
  };

  window.confirmarDesactivarProducto = async function(id) {
    if (!confirm('¿Desactivar este producto?')) return;
    try {
      const { error } = await sb().from('catalogo_productos').update({ activo: false }).eq('id', id);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.CATALOGO = window.CATALOGO.filter(p => p.id !== id);
      $('kpi-productos').textContent = window.CATALOGO.length;
      safeRender('catalogo', renderCatalogo);
      toast('Desactivado');
    } catch (e) { toast(e.message, 'error'); }
  };

  // ========== RECETAS TUBO ==========
  window.renderTubos = function() {
    const tbody = $('tbody-tubos');
    if (!tbody) { console.warn('tbody-tubos no encontrado'); return; }
    const entradas = Object.entries(window.RECETAS_TUBO || {});
    if (entradas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center;padding:24px;">Sin recetas de tubo. Pulsa "+ Tubo" para agregar uno.</td></tr>`;
      return;
    }
    tbody.innerHTML = entradas.map(([codigo, t]) => {
      const safeId = escId(codigo);
      return `
        <tr data-id="${esc(codigo)}" data-safe="${safeId}" data-tipo="tubo">
          <td class="mono"><strong>${esc(codigo)}</strong></td>
          <td>${inp(t.nombre, { field: 'nombre' })}</td>
          <td>${inp(t.descripcion || '', { field: 'descripcion' })}</td>
          <td>${inp(t.costo_m, { field: 'costo_m', type: 'number', step: '0.01', min: 0, cls: 'mono' })}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-primary btn-sm" onclick="guardarTubo(this.closest('tr').dataset.id)">💾</button>
              <button class="btn btn-ghost btn-sm" onclick="eliminarTubo(this.closest('tr').dataset.id)">✕</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  };

  window.guardarTubo = async function(codigo) {
    const tr = document.querySelector(`tr[data-tipo="tubo"][data-id="${esc(codigo)}"]`);
    if (!tr) return;
    const d = leerCamposFila(tr);
    const payload = { nombre: d.nombre, descripcion: d.descripcion, costo_m: Number(d.costo_m) || 0 };
    try {
      const { error } = await sb().from('recetas_tubo').update(payload).eq('codigo', codigo);
      if (error) { errorRow(tr, error.message); return; }
      Object.assign(window.RECETAS_TUBO[codigo], payload);
      flashRow(tr);
      toast('Tubo guardado: ' + codigo);
    } catch (e) { errorRow(tr, e.message); }
  };

  window.agregarRecetaTubo = async function() {
    const codigo = prompt('Código del nuevo tubo (ej. EMT_1):');
    if (!codigo) return;
    const nombre = prompt('Nombre:', codigo);
    if (!nombre) return;
    const payload = { codigo, nombre, descripcion: '', costo_m: 0, activo: true };
    try {
      const { error } = await sb().from('recetas_tubo').insert(payload);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.RECETAS_TUBO[codigo] = { nombre, costo_m: 0, descripcion: '' };
      safeRender('tubos', renderTubos);
      toast('Agregado');
    } catch (e) { toast(e.message, 'error'); }
  };

  window.eliminarTubo = async function(codigo) {
    if (codigo === 'NINGUNO') { toast('No se puede eliminar NINGUNO', 'error'); return; }
    if (!confirm(`¿Eliminar el tubo ${codigo}?`)) return;
    try {
      const { error } = await sb().from('recetas_tubo').delete().eq('codigo', codigo);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      delete window.RECETAS_TUBO[codigo];
      safeRender('tubos', renderTubos);
      toast('Eliminado');
    } catch (e) { toast(e.message, 'error'); }
  };

  // ========== RECETAS CABLE ==========
  window.renderCables = function() {
    const tbody = $('tbody-cables');
    if (!tbody) { console.warn('tbody-cables no encontrado'); return; }
    const tipos = ['instrumentacion', 'datos', 'electrico'];
    const entradas = Object.entries(window.RECETAS_CABLE || {});
    if (entradas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center;padding:24px;">Sin recetas de cable.</td></tr>`;
      return;
    }
    tbody.innerHTML = entradas.map(([codigo, c]) => `
      <tr data-id="${esc(codigo)}" data-tipo="cable">
        <td class="mono"><strong>${esc(codigo)}</strong></td>
        <td>${inp(c.nombre, { field: 'nombre' })}</td>
        <td>${sel(c.tipo, tipos, 'tipo')}</td>
        <td>${inp(c.costo_m, { field: 'costo_m', type: 'number', step: '0.01', min: 0, cls: 'mono' })}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="guardarCable(this.closest('tr').dataset.id)">💾</button>
            <button class="btn btn-ghost btn-sm" onclick="eliminarCable(this.closest('tr').dataset.id)">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  window.guardarCable = async function(codigo) {
    const tr = document.querySelector(`tr[data-tipo="cable"][data-id="${esc(codigo)}"]`);
    if (!tr) return;
    const d = leerCamposFila(tr);
    const payload = { nombre: d.nombre, tipo: d.tipo, costo_m: Number(d.costo_m) || 0 };
    try {
      const { error } = await sb().from('recetas_cable').update(payload).eq('codigo', codigo);
      if (error) { errorRow(tr, error.message); return; }
      Object.assign(window.RECETAS_CABLE[codigo], payload);
      flashRow(tr);
      toast('Cable guardado: ' + codigo);
    } catch (e) { errorRow(tr, e.message); }
  };

  window.agregarRecetaCable = async function() {
    const codigo = prompt('Código del nuevo cable:');
    if (!codigo) return;
    const nombre = prompt('Nombre:', codigo);
    if (!nombre) return;
    const payload = { codigo, nombre, tipo: 'instrumentacion', costo_m: 0, activo: true };
    try {
      const { error } = await sb().from('recetas_cable').insert(payload);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.RECETAS_CABLE[codigo] = { nombre, tipo: 'instrumentacion', costo_m: 0 };
      safeRender('cables', renderCables);
      toast('Agregado');
    } catch (e) { toast(e.message, 'error'); }
  };

  window.eliminarCable = async function(codigo) {
    if (codigo === 'NINGUNO') { toast('No se puede eliminar NINGUNO', 'error'); return; }
    if (!confirm(`¿Eliminar el cable ${codigo}?`)) return;
    try {
      const { error } = await sb().from('recetas_cable').delete().eq('codigo', codigo);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      delete window.RECETAS_CABLE[codigo];
      safeRender('cables', renderCables);
      toast('Eliminado');
    } catch (e) { toast(e.message, 'error'); }
  };

  // ========== RECETAS MO ==========
  window.renderMO = function() {
    const tbody = $('tbody-mo');
    if (!tbody) { console.warn('tbody-mo no encontrado'); return; }
    const entradas = Object.entries(window.RECETAS_MANO_OBRA || {});
    if (entradas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center;padding:24px;">Sin categorías MO.</td></tr>`;
      return;
    }
    tbody.innerHTML = entradas.map(([cat, r]) => `
      <tr data-id="${esc(cat)}" data-tipo="mo">
        <td class="mono"><strong>${esc(cat)}</strong></td>
        <td>${inp(r.horas_base, { field: 'horas_base', type: 'number', step: '0.1', min: 0, cls: 'mono' })}</td>
        <td>${inp(r.factor_altura, { field: 'factor_altura', type: 'number', step: '0.1', min: 0, cls: 'mono' })}</td>
        <td>${inp(r.costo_hora, { field: 'costo_hora', type: 'number', step: '0.01', min: 0, cls: 'mono' })}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="guardarMO(this.closest('tr').dataset.id)">💾</button>
            <button class="btn btn-ghost btn-sm" onclick="eliminarMO(this.closest('tr').dataset.id)">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  window.guardarMO = async function(cat) {
    const tr = document.querySelector(`tr[data-tipo="mo"][data-id="${esc(cat)}"]`);
    if (!tr) return;
    const d = leerCamposFila(tr);
    const payload = {
      horas_base: Number(d.horas_base) || 0,
      factor_altura: Number(d.factor_altura) || 1,
      costo_hora: Number(d.costo_hora) || 0,
    };
    try {
      const { error } = await sb().from('recetas_mano_obra').update(payload).eq('categoria', cat);
      if (error) { errorRow(tr, error.message); return; }
      Object.assign(window.RECETAS_MANO_OBRA[cat], payload);
      flashRow(tr);
      toast('MO guardada: ' + cat);
    } catch (e) { errorRow(tr, e.message); }
  };

  window.agregarRecetaMO = async function() {
    const cat = prompt('Nombre de la categoría MO (ej. INSTALACION_CTRL):');
    if (!cat) return;
    const payload = { categoria: cat.toUpperCase().trim(), horas_base: 1, factor_altura: 1, costo_hora: 5.41 };
    try {
      const { error } = await sb().from('recetas_mano_obra').insert(payload);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.RECETAS_MANO_OBRA[payload.categoria] = { horas_base: 1, factor_altura: 1, costo_hora: 5.41 };
      safeRender('mo', renderMO);
      toast('Categoría MO agregada');
    } catch (e) { toast(e.message, 'error'); }
  };

  window.eliminarMO = async function(cat) {
    if (!confirm(`¿Eliminar la categoría ${cat}? Los productos con esta categoría dejarán de calcular MO.`)) return;
    try {
      const { error } = await sb().from('recetas_mano_obra').delete().eq('categoria', cat);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      delete window.RECETAS_MANO_OBRA[cat];
      safeRender('mo', renderMO);
      toast('Eliminada');
    } catch (e) { toast(e.message, 'error'); }
  };

  // ========== FAMILIAS ==========
  window.renderFamiliasMant = function() {
    const tbody = $('tbody-familias');
    if (!tbody) { console.warn('tbody-familias no encontrado'); return; }
    const iconosDisponibles = [
      'sensor-cap','sensor-mag','sensor-radar','wifi-up','pedestal','truck',
      'rfid','tag','valve','flow','switch','antenna','solar','battery',
      'cabinet','camera','license','server','box','wrench','default'
    ];
    const fams = (window.FAMILIAS || []).slice().sort((a,b) => (a.orden||0) - (b.orden||0));
    if (fams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">Sin familias.</td></tr>`;
      return;
    }
    tbody.innerHTML = fams.map(f => `
      <tr data-id="${esc(f.codigo)}" data-tipo="familia">
        <td class="mono"><strong>${esc(f.codigo)}</strong></td>
        <td>${inp(f.nombre, { field: 'nombre' })}</td>
        <td>${inp(f.grupo, { field: 'grupo' })}</td>
        <td>${sel(f.icono, iconosDisponibles, 'icono')}</td>
        <td>${inp(f.caracteristica_nombre, { field: 'caracteristica_nombre' })}</td>
        <td>${inp(f.caracteristica_unidad, { field: 'caracteristica_unidad' })}</td>
        <td>${inp(f.orden, { field: 'orden', type: 'number', min: 0, cls: 'mono' })}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="guardarFamilia(this.closest('tr').dataset.id)">💾</button>
            <button class="btn btn-ghost btn-sm" onclick="eliminarFamilia(this.closest('tr').dataset.id)">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  window.guardarFamilia = async function(codigo) {
    const tr = document.querySelector(`tr[data-tipo="familia"][data-id="${esc(codigo)}"]`);
    if (!tr) return;
    const d = leerCamposFila(tr);
    const payload = {
      nombre: d.nombre, grupo: d.grupo, icono: d.icono,
      caracteristica_nombre: d.caracteristica_nombre,
      caracteristica_unidad: d.caracteristica_unidad,
      orden: Number(d.orden) || 0,
    };
    try {
      const { error } = await sb().from('familias_productos').update(payload).eq('codigo', codigo);
      if (error) { errorRow(tr, error.message); return; }
      const idx = window.FAMILIAS.findIndex(f => f.codigo === codigo);
      if (idx >= 0) Object.assign(window.FAMILIAS[idx], payload);
      flashRow(tr);
      toast('Familia guardada');
    } catch (e) { errorRow(tr, e.message); }
  };

  window.agregarFamilia = async function() {
    const codigo = prompt('Código (mayúsculas, sin espacios):');
    if (!codigo) return;
    const nombre = prompt('Nombre:', codigo);
    if (!nombre) return;
    const payload = { codigo: codigo.toUpperCase().trim(), nombre, grupo: 'OTROS', icono: 'default', caracteristica_nombre: 'Característica', caracteristica_unidad: '', orden: 99, activo: true };
    try {
      const { error } = await sb().from('familias_productos').insert(payload);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.FAMILIAS.push(payload);
      $('kpi-familias').textContent = window.FAMILIAS.length;
      safeRender('familias', renderFamiliasMant);
      toast('Familia agregada');
    } catch (e) { toast(e.message, 'error'); }
  };

  window.eliminarFamilia = async function(codigo) {
    const usando = (window.CATALOGO || []).filter(p => p.familia === codigo).length;
    if (usando > 0 && !confirm(`Hay ${usando} productos con esta familia. ¿Continuar?`)) return;
    if (usando === 0 && !confirm(`¿Eliminar la familia ${codigo}?`)) return;
    try {
      const { error } = await sb().from('familias_productos').delete().eq('codigo', codigo);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.FAMILIAS = window.FAMILIAS.filter(f => f.codigo !== codigo);
      $('kpi-familias').textContent = window.FAMILIAS.length;
      safeRender('familias', renderFamiliasMant);
      toast('Familia eliminada');
    } catch (e) { toast(e.message, 'error'); }
  };

  // ========== ADICIONALES ==========
  window.renderAdicionales = function() {
    const tbody = $('tbody-adicionales');
    if (!tbody) { console.warn('tbody-adicionales no encontrado'); return; }
    if ((window.COSTOS_ADICIONALES || []).length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px;">Sin costos adicionales.</td></tr>`;
      return;
    }
    tbody.innerHTML = window.COSTOS_ADICIONALES.map(a => `
      <tr data-id="${a.id}" data-tipo="adicional">
        <td>${inp(a.codigo, { field: 'codigo', cls: 'mono' })}</td>
        <td>${inp(a.nombre, { field: 'nombre' })}</td>
        <td>${inp(a.categoria, { field: 'categoria' })}</td>
        <td>${inp(a.unidad, { field: 'unidad' })}</td>
        <td>${inp(a.costo, { field: 'costo', type: 'number', step: '0.01', min: 0, cls: 'mono' })}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="guardarAdicional('${a.id}')">💾</button>
            <button class="btn btn-ghost btn-sm" onclick="eliminarAdicional('${a.id}')">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  window.guardarAdicional = async function(id) {
    const tr = document.querySelector(`tr[data-tipo="adicional"][data-id="${id}"]`);
    if (!tr) return;
    const d = leerCamposFila(tr);
    const payload = {
      codigo: d.codigo, nombre: d.nombre, categoria: d.categoria,
      unidad: d.unidad, costo: Number(d.costo) || 0,
    };
    try {
      const { error } = await sb().from('costos_adicionales_catalogo').update(payload).eq('id', id);
      if (error) { errorRow(tr, error.message); return; }
      const idx = window.COSTOS_ADICIONALES.findIndex(a => a.id === id);
      if (idx >= 0) Object.assign(window.COSTOS_ADICIONALES[idx], payload);
      flashRow(tr);
      toast('Adicional guardado');
    } catch (e) { errorRow(tr, e.message); }
  };

  window.agregarAdicional = async function() {
    const codigo = prompt('Código:');
    if (!codigo) return;
    const nombre = prompt('Nombre:', codigo);
    if (!nombre) return;
    const categoria = prompt('Categoría:', 'LOGISTICA');
    if (!categoria) return;
    const payload = { codigo, nombre, categoria, unidad: 'UN', costo: 0, activo: true };
    try {
      const { data, error } = await sb().from('costos_adicionales_catalogo').insert(payload).select().single();
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.COSTOS_ADICIONALES.push({ ...data, costo: Number(data.costo) });
      $('kpi-adicionales').textContent = window.COSTOS_ADICIONALES.length;
      safeRender('adicionales', renderAdicionales);
      toast('Agregado');
    } catch (e) { toast(e.message, 'error'); }
  };

  window.eliminarAdicional = async function(id) {
    if (!confirm('¿Eliminar este concepto?')) return;
    try {
      const { error } = await sb().from('costos_adicionales_catalogo').delete().eq('id', id);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      window.COSTOS_ADICIONALES = window.COSTOS_ADICIONALES.filter(a => a.id !== id);
      $('kpi-adicionales').textContent = window.COSTOS_ADICIONALES.length;
      safeRender('adicionales', renderAdicionales);
      toast('Eliminado');
    } catch (e) { toast(e.message, 'error'); }
  };

  // ========== PARÁMETROS ==========
  window.PARAMS_LISTA = [];
  window.cargarParametros = async function() {
    try {
      const { data, error } = await sb().from('parametros_globales').select('*').order('clave');
      if (error) { toast('Error parámetros: ' + error.message, 'error'); return; }
      window.PARAMS_LISTA = data || [];
      safeRender('parametros', renderParametros);
    } catch (e) { toast(e.message, 'error'); }
  };

  window.renderParametros = function() {
    const tbody = $('tbody-parametros');
    if (!tbody) return;
    if (window.PARAMS_LISTA.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center;padding:24px;">Sin parámetros.</td></tr>`;
      return;
    }
    tbody.innerHTML = window.PARAMS_LISTA.map(p => `
      <tr data-id="${esc(p.clave)}" data-tipo="parametro">
        <td class="mono"><strong>${esc(p.clave)}</strong></td>
        <td>${inp(p.descripcion || '', { field: 'descripcion' })}</td>
        <td>${inp(p.valor, { field: 'valor', cls: 'mono' })}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="guardarParametro(this.closest('tr').dataset.id)">💾</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  window.guardarParametro = async function(clave) {
    const tr = document.querySelector(`tr[data-tipo="parametro"][data-id="${esc(clave)}"]`);
    if (!tr) return;
    const d = leerCamposFila(tr);
    const payload = { valor: d.valor, descripcion: d.descripcion };
    try {
      const { error } = await sb().from('parametros_globales').update(payload).eq('clave', clave);
      if (error) { errorRow(tr, error.message); return; }
      const idx = window.PARAMS_LISTA.findIndex(p => p.clave === clave);
      if (idx >= 0) Object.assign(window.PARAMS_LISTA[idx], payload);
      const v = Number(d.valor);
      window.PARAMETROS[clave] = isNaN(v) ? d.valor : v;
      flashRow(tr);
      toast('Parámetro guardado');
    } catch (e) { errorRow(tr, e.message); }
  };

  // ========== BACKUP ==========
  window.exportarBackup = function() {
    const data = {
      exportado_en: new Date().toISOString(),
      catalogo: window.CATALOGO,
      familias: window.FAMILIAS,
      recetas_tubo: window.RECETAS_TUBO,
      recetas_cable: window.RECETAS_CABLE,
      recetas_mano_obra: window.RECETAS_MANO_OBRA,
      costos_adicionales: window.COSTOS_ADICIONALES,
      parametros: window.PARAMETROS,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `totem-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup descargado');
  };

  // ========== INIT ==========
  window.iniciarMantenimiento = async function() {
    console.log('[Mantenimiento] Iniciando con:', {
      productos: (window.CATALOGO || []).length,
      familias: (window.FAMILIAS || []).length,
      tubos: Object.keys(window.RECETAS_TUBO || {}).length,
      cables: Object.keys(window.RECETAS_CABLE || {}).length,
      mo: Object.keys(window.RECETAS_MANO_OBRA || {}).length,
      adic: (window.COSTOS_ADICIONALES || []).length,
    });
    safeRender('catalogo', renderCatalogo);
    safeRender('tubos', renderTubos);
    safeRender('cables', renderCables);
    safeRender('mo', renderMO);
    safeRender('familias', renderFamiliasMant);
    safeRender('adicionales', renderAdicionales);
    await cargarParametros();
  };
}

var iniciarMantenimiento = window.iniciarMantenimiento;
