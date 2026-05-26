# TOTEM · Cotizador de Control de Combustible — v6

Sistema web para gestionar levantamientos técnicos y cotizaciones de proyectos de control de combustible.

**Stack:** HTML + CSS + JavaScript puro · Supabase (DB + Auth) · GitHub Pages (hosting).

---

## 🎨 Novedades de la versión 6

- **Rediseño visual completo** estilo Stripe/Apple: blanco puro, sombras suaves, tipografía limpia.
- **Tema claro/oscuro** con toggle en el header (la preferencia se guarda en el navegador).
- **Paleta corporativa:** Azul profundo `#0F4C81` + grises neutros.
- **Selector POS** para agregar equipos en el levantamiento:
  - Paso 1: cuadritos de **Familias** (Sensor Capacitivo, Controlador Pedestal, etc.) con iconos SVG.
  - Paso 2: cuadritos de **Modelos** (Marca + Característica) con precio visible.
  - Búsqueda transversal que filtra todo el catálogo.
- **Auto-switch de marca**: en el carrito puedes cambiar la marca de un equipo manteniendo la medida — busca automáticamente el equivalente en otra marca.
- **Iconos SVG simples** estilo Lucide/Heroicons (sensor, válvula, switch, cámara, etc.)
- **Login renovado** con el nuevo tema.

---

## 🚀 Cómo poner v6 en producción

### 1. Aplicar el SQL nuevo en Supabase

Solo necesitas correr **un script nuevo**: el `09` que agrega las familias. Los anteriores ya están en la base de datos.

1. Abre tu proyecto Supabase: <https://uxfybevbuizliotihxsp.supabase.co>
2. Ve a **SQL Editor** → **+ New query**
3. Pega TODO el contenido de `supabase_09_familias.sql`
4. Click **Run**
5. Deberías ver:
   ```
   Familias creadas       | 26
   Productos con familia  | 32
   Productos sin familia  | 0
   ```

### 2. Subir los archivos a GitHub Pages

1. Borra los archivos viejos de tu repo y sube todos los de la carpeta `cotizador-v6/`.
2. Recuerda subir: las carpetas `css/` y `js/`, todos los `.html` y los SQL.
3. La URL sigue siendo: <https://ingtotem.github.io/MVP-cotizador-combustible/>

### 3. Probar

- Abre `login.html` y entra con tu usuario.
- Ve a **Levantamiento** y prueba el selector POS:
  - Click en cualquier familia (ej. "Sensor Magnetostrictivo")
  - Verás los modelos disponibles (TotemGas 2250mm, TotemGas 2500mm, etc.)
  - Click en uno para configurarlo
  - En la lista, **cambia el dropdown de marca** y verás el auto-switch
- Toggle de tema arriba a la derecha (botón ☾ / ☀)

---

## 🗂 Estructura

```
cotizador-v6/
├── index.html              Dashboard (KPIs y atajos)
├── login.html              Pantalla de ingreso
├── levantamiento.html      Levantamiento con selector POS
├── oferta.html             Vista interna de la cotización
├── oferta-cliente.html     Vista para enviar al cliente (imprimible)
├── proyectos.html          Lista de ofertas
├── mantenimiento.html      Catálogo (solo admin)
│
├── css/
│   └── styles.css          Sistema de diseño completo (tema claro/oscuro)
│
├── js/
│   ├── supabase-client.js  Conexión a Supabase
│   ├── auth.js             Login, logout, roles, permisos
│   ├── icons.js            Iconos SVG estilo Lucide
│   ├── theme.js            Toggle de tema claro/oscuro
│   ├── data.js             Carga del catálogo + helpers de familias
│   ├── calculo.js          Motor de recetas (tubo, cable, mano de obra)
│   └── levantamiento.js    Lógica del selector POS y carrito
│
├── supabase_01_schema.sql        17 tablas, RLS, triggers, vistas (ya aplicado)
├── supabase_02_datos_iniciales.sql  32 productos, recetas (ya aplicado)
├── supabase_03_usuario_admin.sql    Usuario admin (ya aplicado)
└── supabase_09_familias.sql         *** EJECUTAR ESTE EN v6 ***
```

---

## 👥 Roles del sistema

| Rol         | Acceso |
|-------------|--------|
| **admin**   | Todo, incluyendo Mantenimiento |
| **ingeniero** | Solo Levantamiento (no ve precios) |
| **cotizador** | Cotización completa + Levantamiento |
| **revisor** | Cotización + Levantamiento (lectura/aprobación) |
| **lector** | Solo oferta-cliente y proyectos |

Para crear usuarios nuevos: Supabase → **Authentication** → **Users** → **Invite user** (con email real).

---

## 🛠 Próximos pasos sugeridos

- **Persistencia real:** guardar levantamientos y ofertas en Supabase (hoy se guardan en sessionStorage).
- **Versionamiento:** usar la función `clonar_version_oferta()` para crear v2, v3 de una oferta.
- **Pantalla de Usuarios:** que el admin pueda crear usuarios desde la app.
- **Edición del catálogo:** que el admin pueda agregar productos desde Mantenimiento.
- **PDF real:** integrar una librería para descargar la oferta como PDF.
- **Catálogo completo:** cargar los ~422 productos reales del Excel.

---

## 🔒 Notas de seguridad

- La contraseña del usuario admin que estaba en chat (`admin123`) es débil y debe cambiarse desde **Supabase → Authentication → Users → Reset password**.
- Las credenciales de Supabase en `js/supabase-client.js` son la **anon key** pública (segura para usar en frontend); las políticas de seguridad están en la base de datos (RLS).

---

© 2025 TOTEM Control de Combustible · Guayaquil, Ecuador
