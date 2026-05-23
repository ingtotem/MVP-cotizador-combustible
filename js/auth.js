/* ============================================================
   AUTH — Login, logout, gestión de sesión y roles
   ============================================================ */

// Estado global del usuario actual
const auth = {
  user: null,        // objeto de auth.users de Supabase
  profile: null,     // registro de public.usuarios (con username, nombre, rol)
  ready: false,      // true cuando ya verificamos la sesión inicial
};

// Permisos por rol y por pantalla
// Cada rol tiene una lista de páginas a las que puede entrar
const PERMISOS = {
  admin:      ['index', 'levantamiento', 'oferta', 'oferta-cliente', 'proyectos', 'mantenimiento'],
  ingeniero:  ['index', 'levantamiento', 'proyectos'],
  cotizador:  ['index', 'levantamiento', 'oferta', 'oferta-cliente', 'proyectos'],
  revisor:    ['index', 'levantamiento', 'oferta', 'oferta-cliente', 'proyectos'],
  lector:     ['index', 'oferta-cliente', 'proyectos'],
};

// ===== LOGIN =====

async function login(username, password) {
  const email = usernameToEmail(username);
  if (!email || !password) {
    return { ok: false, error: 'Ingresa usuario y contraseña.' };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Mensaje amigable
      const msg = error.message.includes('Invalid login credentials')
        ? 'Usuario o contraseña incorrectos.'
        : error.message;
      return { ok: false, error: msg };
    }
    // Cargar perfil después del login
    await cargarPerfil();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Error de conexión. Intenta de nuevo.' };
  }
}

// ===== LOGOUT =====

async function logout() {
  await supabase.auth.signOut();
  auth.user = null;
  auth.profile = null;
  // Limpiar también el storage local del cotizador
  try {
    sessionStorage.removeItem('totem_levantamiento_actual');
    sessionStorage.removeItem('totem_oferta_actual');
    sessionStorage.removeItem('totem_lev_enviado');
  } catch (e) {}
  window.location.href = 'login.html';
}

// ===== CARGAR PERFIL =====
// Lee de public.usuarios el registro del usuario autenticado

async function cargarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  auth.user = user;
  if (!user) {
    auth.profile = null;
    return null;
  }
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, username, email, nombre, rol, activo')
    .eq('id', user.id)
    .single();
  if (error) {
    console.error('Error cargando perfil:', error);
    auth.profile = null;
    return null;
  }
  if (!data.activo) {
    // Usuario desactivado: forzar logout
    alert('Tu cuenta está desactivada. Contacta al administrador.');
    await logout();
    return null;
  }
  auth.profile = data;
  return data;
}

// ===== VERIFICACIÓN DE SESIÓN (al cargar cada página) =====
// Llama esto al inicio de cada página protegida.
// Si no hay sesión válida, redirige al login.
// Si el rol no tiene acceso a la página, redirige al dashboard.

async function requireAuth(paginaActual) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return false;
  }
  if (!auth.profile) {
    await cargarPerfil();
  }
  if (!auth.profile) {
    window.location.href = 'login.html';
    return false;
  }
  // Verificar permiso de página
  if (paginaActual) {
    const rol = auth.profile.rol;
    const permitidas = PERMISOS[rol] || [];
    if (!permitidas.includes(paginaActual)) {
      alert('No tienes acceso a esta página.');
      window.location.href = 'index.html';
      return false;
    }
  }
  auth.ready = true;
  return true;
}

// ===== UTILIDADES =====

function tieneRol(...roles) {
  if (!auth.profile) return false;
  return roles.includes(auth.profile.rol);
}

function esAdmin() {
  return tieneRol('admin');
}

// Aplica el filtrado de navegación según el rol
// Oculta los links del nav a páginas que el usuario no puede ver
function aplicarPermisosNav() {
  if (!auth.profile) return;
  const rol = auth.profile.rol;
  const permitidas = PERMISOS[rol] || [];
  document.querySelectorAll('.nav-tabs a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const pagina = href.replace('.html', '');
    if (pagina && !permitidas.includes(pagina)) {
      a.style.display = 'none';
    }
  });
  // Actualizar el chip de usuario en el header
  const chip = document.querySelector('.user-chip');
  if (chip && auth.profile) {
    chip.innerHTML = `
      <span>${auth.profile.nombre}</span>
      <span class="role">${auth.profile.rol}</span>
      <button class="btn btn-ghost btn-sm" onclick="logout()" title="Cerrar sesión" style="margin-left:8px;padding:2px 8px;">↪ Salir</button>
    `;
  }
}
