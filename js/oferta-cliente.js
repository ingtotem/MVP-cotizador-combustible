/* ============================================================
   VISTA CLIENTE — Oferta lista para imprimir
   Lee la oferta guardada y la presenta en formato cotización
   comercial similar al PDF de Langosmar.
   ============================================================ */

const STORAGE_OFER = 'totem_oferta_actual';

function calcularItemOferta(it, margen_global) {
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
    margen_pct: it.margen_pct != null ? it.margen_pct : margen_global,
  };
  const c = calcularLinea(linea);
  if (!c) return null;
  if (it.horas_mo_override != null) {
    const producto = CATALOGO.find(p => p.id === it.producto_id);
    const recetaMO = RECETAS_MANO_OBRA[producto.grupo] || RECETAS_MANO_OBRA.ACCESORIOS;
    const horas = Number(it.horas_mo_override);
    const costo_mo = horas * recetaMO.costo_hora;
    c.desglose.horas_mano_obra = horas;
    c.desglose.costo_mano_obra = costo_mo;
    c.desglose.costo_total = c.desglose.costo_equipo + c.desglose.costo_materiales + costo_mo;
    const margen = linea.margen_pct;
    c.pvp_total = c.desglose.costo_total / (1 - margen);
    c.pvp_unitario = c.pvp_total / it.cantidad;
  }
  return c;
}

function generarCodigo() {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const num = Math.floor(Math.random() * 900 + 100);
  return `GTT${yy}-${num}-1`;
}

function fmtFecha(d = new Date()) {
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function renderDoc() {
  let oferta = null;
  try {
    const raw = sessionStorage.getItem(STORAGE_OFER);
    if (raw) oferta = JSON.parse(raw);
  } catch (e) {}

  if (!oferta || !oferta.items || oferta.items.length === 0) {
    document.getElementById('doc').innerHTML = `
      <div style="text-align:center;padding:80px 24px;">
        <h2>No hay oferta para mostrar</h2>
        <p style="color:#6e7681;margin-top:12px;">Primero arma una cotización en la vista del Cotizador.</p>
        <a href="oferta.html" class="btn btn-primary" style="margin-top:24px;display:inline-block;">Ir a la Cotización</a>
      </div>`;
    return;
  }

  const margen_global = oferta.opciones?.margen_global ?? 0.40;
  const lineas = oferta.items.map(it => ({ ...it, calculo: calcularItemOferta(it, margen_global) }));
  const t = calcularTotalesCotizacion(lineas, oferta.adicionales || [], oferta.opciones || {});

  const codigo = oferta.codigo || generarCodigo();
  const p = oferta.proyecto || {};

  // Generar filas de la tabla con PVP unitario y total por ítem
  const filasItems = lineas.map((it, idx) => {
    const c = it.calculo;
    if (!c) return '';
    const prod = c.producto;
    // PVP unitario ya viene calculado
    return `
      <tr>
        <td class="num">${idx + 1}</td>
        <td>
          <div class="item-name">${prod.nombre}</div>
          ${it.observacion ? `<div class="item-desc">${it.observacion}</div>` : ''}
          ${it.ubicacion ? `<div class="item-desc">Ubicación: ${it.ubicacion}</div>` : ''}
        </td>
        <td class="cant">${it.cantidad}</td>
        <td class="money">${fmtMoney(c.pvp_unitario)}</td>
        <td class="money">${fmtMoney(c.pvp_total)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="doc-header">
      <div class="doc-logo">
        <div class="mark">T</div>
        <div class="name">TOTEM</div>
      </div>
      <div class="doc-meta">
        <div class="codigo">${codigo}</div>
        <div>COM-4.1.2.F02</div>
        <div>Rev: ${new Date().toLocaleDateString('es-EC')}</div>
      </div>
    </div>

    <div class="doc-title">COTIZACIÓN COMERCIAL</div>

    <dl class="doc-info">
      <dt>Fecha:</dt><dd>${fmtFecha()}</dd>
      <dt>Proyecto:</dt><dd>${p.cliente || '—'}</dd>
      <dt>Referencia:</dt><dd>${p.referencia || '—'}</dd>
      <dt>Atención:</dt><dd>${p.contacto || '—'}</dd>
      ${p.lugar ? `<dt>Lugar:</dt><dd>${p.lugar}</dd>` : ''}
    </dl>

    <table class="doc-table">
      <thead>
        <tr>
          <th class="center" style="width:40px;">Ítem</th>
          <th>Descripción</th>
          <th class="center" style="width:60px;">Cant.</th>
          <th class="right" style="width:110px;">PVP</th>
          <th class="right" style="width:110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr class="section"><td colspan="5">Equipos y Servicios</td></tr>
        ${filasItems}
      </tbody>
    </table>

    <div class="doc-totals">
      <div class="doc-condiciones">
        <h4>Condiciones de Negociación</h4>
        <div class="row"><span>Garantía:</span><span>1 año en equipos</span></div>
        <div class="row"><span>Tiempo de entrega:</span><span>90 días</span></div>
        <div class="row"><span>Forma de pago:</span><span>50% anticipo / 50% contraentrega</span></div>
        <div class="row"><span>Validez de la propuesta:</span><span>15 días</span></div>

        <div class="doc-renta">
          <div class="lbl">Opción Renta Mensual</div>
          <div class="val">${fmtMoney(t.renta_mensual)}</div>
          <div class="plazo">Plazo: ${t.plazo_meses} meses</div>
        </div>
      </div>

      <div>
        <table class="doc-totals-table">
          <tr><td>Subtotal Equipos</td><td class="money">${fmtMoney(t.cliente.equipos)}</td></tr>
          <tr><td>Materiales</td><td class="money">${fmtMoney(t.cliente.materiales)}</td></tr>
          <tr><td>Mano de Obra</td><td class="money">${fmtMoney(t.cliente.mano_obra)}</td></tr>
          <tr><td><strong>Subtotal</strong></td><td class="money"><strong>${fmtMoney(t.cliente.subtotal)}</strong></td></tr>
          ${t.monto_descuento > 0 ? `<tr><td>Descuento (${t.descuento_pct}%)</td><td class="money">- ${fmtMoney(t.monto_descuento)}</td></tr>` : ''}
          <tr><td>IVA 15%</td><td class="money">${fmtMoney(t.iva)}</td></tr>
          <tr class="total-row"><td>TOTAL</td><td class="money">${fmtMoney(t.total)}</td></tr>
        </table>
      </div>
    </div>

    <div class="doc-firma">
      <div class="firma-block">
        <strong>TOTEM</strong>
        <span>Atentamente</span>
      </div>
      <div class="firma-block">
        <strong>Aprobación Cliente</strong>
        <span>Nombre y Fecha</span>
      </div>
    </div>

    <div class="doc-foot">
      Documento generado por el cotizador TOTEM · ${new Date().toLocaleString('es-EC')}
    </div>
  `;

  document.getElementById('doc').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', renderDoc);
