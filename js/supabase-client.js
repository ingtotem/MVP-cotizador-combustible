/* ============================================================
   SUPABASE CLIENT — Conexión a la base de datos
   
   IMPORTANTE: Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con tus
   credenciales reales de Supabase.
   
   Ubicación en Supabase:
   Settings → API → Project URL  ──→  SUPABASE_URL
   Settings → API → anon public  ──→  SUPABASE_ANON_KEY
   ============================================================ */

// ⚠️ CREDENCIALES DE SUPABASE
// Estas son las claves de tu proyecto. La anon key es PÚBLICA por diseño
// (puede verse desde el navegador). Las reglas de Row Level Security en
// la base de datos son las que realmente protegen los datos.
const SUPABASE_URL = 'https://uxfybevbuizliotihxsp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZnliZXZidWl6bGlvdGloeHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTA4MTMsImV4cCI6MjA5NTA4NjgxM30.Xm-C8UJ8Cw5-3jTD9uhfL4Gf1kCzzFz8ie2mP1OQ6qU';

// Dominio interno usado para convertir username → email (no se ve por usuarios)
const INTERNAL_EMAIL_DOMAIN = '@totem.local';

// Inicializa el cliente Supabase (usa la librería cargada desde CDN)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,         // mantiene sesión entre tabs/cierres
    autoRefreshToken: true,       // refresca tokens automáticamente
    detectSessionInUrl: false,    // no necesitamos detectar redirects de OAuth
  },
});

// Convierte username "juan.perez" → email interno "juan.perez@totem.local"
function usernameToEmail(username) {
  const u = String(username || '').trim().toLowerCase();
  if (!u) return '';
  // Si ya viene con dominio, lo dejamos
  if (u.includes('@')) return u;
  return u + INTERNAL_EMAIL_DOMAIN;
}

// Convierte email interno "juan.perez@totem.local" → username "juan.perez"
function emailToUsername(email) {
  return String(email || '').split('@')[0];
}

// Inicialización lista
console.log('Supabase client conectado a', SUPABASE_URL);
