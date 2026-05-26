/* ============================================================
   AUTH — Login, logout, gestión de sesión y roles
   ============================================================ */

if (!window.__TOTEM_AUTH_INITIALIZED__) {
  window.__TOTEM_AUTH_INITIALIZED__ = true;

  // Estado global del usuario actual
  window.auth = {
    user: null,
    profile: null,
    ready: false,
  };

  // Permisos por rol y por pantalla
  window.PERMISOS = {
    admin:      ['dashboard', 'levantamiento', 'revision', 'cotizacion', 'oferta', 'prospectos', 'mantenimiento'],
    ingeniero:  ['dashboard', 'levantamiento', 'revision', 'prospectos'],
    cotizador:  ['dashboard', 'levantamiento', 'revision', 'cotizacion', 'oferta', 'prospectos'],
    revisor:    ['dashboard', 'levantamiento', 'revision', 'cotizacion', 'oferta', 'prospectos'],
    lector:     ['dashboard', 'oferta', 'prospectos'],
  };

  // Helper para login: verificar si hay sesión sin redirigir
  window.currentSession = async function() {
    if (!window.supabaseClient) return null;
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      return session;
    } catch (e) { return null; }
  };

  // ===== LOGIN =====
  window.login = async function(username, password) {
    const email = window.usernameToEmail(username);
    if (!email || !password) {
      return { ok: false, error: 'Ingresa usuario y contraseña.' };
    }
    if (!window.supabaseClient) {
      return { ok: false, error: 'Cliente Supabase no inicializado.' };
    }
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.includes('Invalid login credentials')
          ? 'Usuario o contraseña incorrectos.'
          : error.message;
        return { ok: false, error: msg };
      }
      await window.cargarPerfil();
      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Error de conexión. Intenta de nuevo.' };
    }
  };

  // ===== LOGOUT =====
  window.logout = async function() {
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
    window.auth.user = null;
    window.auth.profile = null;
    try {
      sessionStorage.removeItem('totem_levantamiento_actual');
      sessionStorage.removeItem('totem_oferta_actual');
      sessionStorage.removeItem('totem_lev_enviado');
    } catch (e) {}
    window.location.href = 'login.html';
  };

  // ===== CARGAR PERFIL =====
  window.cargarPerfil = async function() {
    if (!window.supabaseClient) return null;
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    window.auth.user = user;
    if (!user) {
      window.auth.profile = null;
      return null;
    }
    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .select('id, username, email, nombre, rol, activo')
      .eq('id', user.id)
      .single();
    if (error) {
      console.error('Error cargando perfil:', error);
      window.auth.profile = null;
      return null;
    }
    if (!data.activo) {
      alert('Tu cuenta está desactivada. Contacta al administrador.');
      await window.logout();
      return null;
    }
    window.auth.profile = data;
    return data;
  };

  // ===== VERIFICACIÓN DE SESIÓN =====
  window.requireAuth = async function(paginaActual) {
    if (!window.supabaseClient) {
      console.error('Supabase no inicializado, redirigiendo a login');
      window.location.href = 'login.html';
      return false;
    }
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return false;
    }
    if (!window.auth.profile) {
      await window.cargarPerfil();
    }
    if (!window.auth.profile) {
      window.location.href = 'login.html';
      return false;
    }
    if (paginaActual) {
      const rol = window.auth.profile.rol;
      const permitidas = window.PERMISOS[rol] || [];
      if (!permitidas.includes(paginaActual)) {
        alert('No tienes acceso a esta página.');
        window.location.href = 'index.html';
        return false;
      }
    }
    window.auth.ready = true;
    return true;
  };

  // ===== UTILIDADES =====
  window.tieneRol = function(...roles) {
    if (!window.auth.profile) return false;
    return roles.includes(window.auth.profile.rol);
  };

  window.esAdmin = function() {
    return window.tieneRol('admin');
  };

  window.aplicarPermisosNav = function() {
    if (!window.auth.profile) return;
    const rol = window.auth.profile.rol;
    const permitidas = window.PERMISOS[rol] || [];
    // Mapeo de archivo .html → permiso lógico
    const mapHref = {
      'index.html': 'dashboard',
      'levantamiento.html': 'levantamiento',
      'revision.html': 'revision',
      'cotizacion.html': 'cotizacion',
      'oferta.html': 'cotizacion',
      'oferta-cliente.html': 'oferta',
      'prospectos.html': 'prospectos',
      'mantenimiento.html': 'mantenimiento',
    };
    document.querySelectorAll('.nav-tabs a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const pagina = mapHref[href];
      if (pagina && !permitidas.includes(pagina)) {
        a.style.display = 'none';
      }
    });
    const chip = document.querySelector('.user-chip');
    if (chip && window.auth.profile) {
      chip.innerHTML = `
        <span>${window.auth.profile.nombre}</span>
        <span class="role">${window.auth.profile.rol}</span>
        <button class="btn btn-ghost btn-sm" onclick="logout()" title="Cerrar sesión" style="margin-left:8px;padding:2px 8px;">↪ Salir</button>
      `;
    }
  };
}

// Aliases locales (compatibilidad)
var auth = window.auth;
var PERMISOS = window.PERMISOS;
var login = window.login;
var logout = window.logout;
var cargarPerfil = window.cargarPerfil;
var requireAuth = window.requireAuth;
var tieneRol = window.tieneRol;
var esAdmin = window.esAdmin;
var aplicarPermisosNav = window.aplicarPermisosNav;
var currentSession = window.currentSession;
