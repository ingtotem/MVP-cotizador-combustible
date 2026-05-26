/* ============================================================
   THEME — Sistema de tema claro/oscuro
   - Aplica el tema antes de pintar (sin flash)
   - Botón toggle en el header
   - Persiste preferencia en localStorage
   ============================================================ */

(function() {
  // Aplicar tema ANTES de DOMContentLoaded (evita flash)
  const saved = (function() {
    try { return localStorage.getItem('totem_theme'); } catch (e) { return null; }
  })();
  const theme = saved || 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();

if (!window.__TOTEM_THEME_INITIALIZED__) {
  window.__TOTEM_THEME_INITIALIZED__ = true;

  window.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('totem_theme', next); } catch (e) {}
    // Actualizar icono del botón
    const btn = document.querySelector('.theme-toggle');
    if (btn && window.getIcon) {
      btn.innerHTML = window.getIcon(next === 'light' ? 'moon' : 'sun', 16);
    }
  };

  // Función para inyectar el botón de toggle después que el header existe
  window.mountThemeToggle = function() {
    const headerActions = document.querySelector('.app-header');
    if (!headerActions) return;
    if (headerActions.querySelector('.theme-toggle')) return; // ya existe

    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.title = current === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';
    btn.innerHTML = window.getIcon ? window.getIcon(current === 'light' ? 'moon' : 'sun', 16) : '☾';
    btn.onclick = window.toggleTheme;

    // Insertar antes del user-chip
    const userChip = headerActions.querySelector('.user-chip');
    if (userChip) {
      headerActions.insertBefore(btn, userChip);
    } else {
      headerActions.appendChild(btn);
    }
  };
}

var toggleTheme = window.toggleTheme;
var mountThemeToggle = window.mountThemeToggle;
