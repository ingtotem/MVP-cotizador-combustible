/* ============================================================
   SUPABASE CLIENT — Conexión a la base de datos
   ============================================================ */

// Guard: evita errores si este script se carga dos veces
if (!window.__TOTEM_SUPABASE_INITIALIZED__) {
  window.__TOTEM_SUPABASE_INITIALIZED__ = true;

  // ⚠️ CREDENCIALES DE SUPABASE
  window.SUPABASE_URL = 'https://uxfybevbuizliotihxsp.supabase.co';
  window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZnliZXZidWl6bGlvdGloeHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTA4MTMsImV4cCI6MjA5NTA4NjgxM30.Xm-C8UJ8Cw5-3jTD9uhfL4Gf1kCzzFz8ie2mP1OQ6qU';

  // Dominio interno usado para convertir username → email (no se ve por usuarios)
  window.INTERNAL_EMAIL_DOMAIN = '@totem.local';

  // Verificar que la librería de Supabase esté cargada
  if (!window.supabase || !window.supabase.createClient) {
    console.error('❌ La librería de Supabase no está cargada. Verifica que el CDN esté incluido ANTES de este script.');
  } else {
    // Inicializa el cliente Supabase
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    console.log('✅ Supabase conectado a', window.SUPABASE_URL);
  }

  // Convierte username → email
  // - Si el usuario escribe un email completo (con @), lo deja igual
  // - Si escribe solo un username sin @, le añade @totem.local
  window.usernameToEmail = function(username) {
    const u = String(username || '').trim().toLowerCase();
    if (!u) return '';
    if (u.includes('@')) return u;
    return u + window.INTERNAL_EMAIL_DOMAIN;
  };

  // Convierte email interno "juan.perez@totem.local" → username "juan.perez"
  window.emailToUsername = function(email) {
    return String(email || '').split('@')[0];
  };
}

// Alias local (mantiene compatibilidad con el código existente)
// Esto es seguro porque usa "var" que se puede redeclarar
var supabase = window.supabaseClient;
var SUPABASE_URL = window.SUPABASE_URL;
var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
var INTERNAL_EMAIL_DOMAIN = window.INTERNAL_EMAIL_DOMAIN;
var usernameToEmail = window.usernameToEmail;
var emailToUsername = window.emailToUsername;
