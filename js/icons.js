/* ============================================================
   ICONOS SVG — Estilo Lucide/Heroicons
   Uso: getIcon('sensor-cap') → string con el <svg>
   ============================================================ */

if (!window.__TOTEM_ICONS_INITIALIZED__) {
  window.__TOTEM_ICONS_INITIALIZED__ = true;

  const ICONS = {
    // Sensores
    'sensor-cap': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="18" rx="1"/><path d="M10 7h4M10 11h4M10 15h4M10 19h4"/><circle cx="12" cy="3" r="1.5" fill="currentColor"/></svg>`,

    'sensor-mag': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="20" rx="0.5"/><circle cx="12" cy="6" r="0.8" fill="currentColor"/><circle cx="12" cy="10" r="0.8" fill="currentColor"/><circle cx="12" cy="14" r="0.8" fill="currentColor"/><circle cx="12" cy="18" r="0.8" fill="currentColor"/></svg>`,

    'sensor-radar': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,

    // Comunicación
    'wifi-up': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14 0M8.5 16.05a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/><path d="M12 8V3M9 6l3-3 3 3"/></svg>`,

    // Controladores
    'pedestal': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="14" rx="1"/><path d="M9 6h6M9 9h6M9 12h3"/><path d="M10 16v6M14 16v6M8 22h8"/></svg>`,

    'truck': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17h12V5H2v12zM14 11h4l3 3v3h-7"/><circle cx="6" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/></svg>`,

    // RFID
    'rfid': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12a7 7 0 0 1 14 0"/><path d="M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M3 18v3M21 18v3"/></svg>`,

    'tag': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12l-8 8-8-8 8-8h8z"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/></svg>`,

    // Instrumentación
    'valve': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M2 12h5M17 12h5M12 2v5M12 17v5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,

    'flow': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h6l2-5 2 10 2-5h6"/><circle cx="12" cy="20" r="1.5" fill="currentColor"/></svg>`,

    // Redes
    'switch': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="20" height="8" rx="1"/><circle cx="6" cy="12" r="0.5" fill="currentColor"/><circle cx="9" cy="12" r="0.5" fill="currentColor"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/><circle cx="15" cy="12" r="0.5" fill="currentColor"/><circle cx="18" cy="12" r="0.5" fill="currentColor"/></svg>`,

    'antenna': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 13v9M9 22h6"/></svg>`,

    // Energía
    'solar': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="11" rx="1"/><path d="M3 9h18M3 12h18M9 5v11M15 5v11"/><path d="M8 19h8M12 16v3"/></svg>`,

    'battery': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="18" height="10" rx="1"/><path d="M22 11v2"/><path d="M6 11v2M10 11v2M14 11v2"/></svg>`,

    // Gabinetes
    'cabinet': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 12h16"/><circle cx="9" cy="7" r="0.5" fill="currentColor"/><circle cx="9" cy="17" r="0.5" fill="currentColor"/></svg>`,

    // CCTV
    'camera': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h12v8H2z"/><path d="M14 11l8-4v10l-8-4"/><circle cx="6" cy="12" r="1.5"/></svg>`,

    'license': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h4M7 12h10M7 16h6"/><circle cx="16" cy="9" r="2"/></svg>`,

    'server': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/><circle cx="7" cy="6.5" r="0.5" fill="currentColor"/><circle cx="7" cy="17.5" r="0.5" fill="currentColor"/><path d="M11 6.5h7M11 17.5h7"/></svg>`,

    // Accesorios
    'box': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9 4-9-4 9-4 9 4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/></svg>`,

    'wrench': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-7 7a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l7-7a4 4 0 0 0 5.4-5.4l-2.5 2.5a1 1 0 0 1-1.4 0l-1.6-1.6a1 1 0 0 1 0-1.4l2.5-2.5z"/></svg>`,

    // Default
    'default': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>`,

    // Iconos de UI
    'sun': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
    'moon': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  };

  window.getIcon = function(name, sizePx) {
    const svg = ICONS[name] || ICONS['default'];
    if (sizePx) {
      return svg.replace('<svg', `<svg width="${sizePx}" height="${sizePx}"`);
    }
    return svg;
  };
}

// Aliases locales
var getIcon = window.getIcon;
