# TOTEM · Cotizador de Control de Combustible — v6.2

Sistema web para gestionar levantamientos técnicos, revisiones, cotizaciones y propuestas comerciales de proyectos de control de combustible.

**Stack:** HTML + CSS + JavaScript puro · Supabase (DB + Auth) · GitHub Pages (hosting).

---

## 🎯 Flujo del sistema

```
1. Levantamiento  →  2. Revisión   →  3. Cotización  →  4. Oferta cliente
   (diseño)          (solo lectura)    (costos+PVP)      (versión final)
```

Cada paso tiene botones de **Aprobar** o **Regresar** para controlar el avance.

---

## 🚀 Instalación desde cero

### PASO 1 — Configurar la base de datos en Supabase

Tu proyecto Supabase ya existe en `https://uxfybevbuizliotihxsp.supabase.co`.

Si los SQL anteriores ya están aplicados, solo necesitas correr el `11`. Si vas desde cero, corre todos en orden:

1. SQL Editor → New query
2. Pega y ejecuta uno por uno (en este orden):
   - `supabase_01_schema.sql` (estructura: 17 tablas, RLS, triggers, vistas)
   - `supabase_02_datos_iniciales.sql` (32 productos, recetas)
   - `supabase_03_usuario_admin.sql` (solo si no tienes ningún usuario)
   - `supabase_09_familias.sql` (estructura de familias para el selector POS)
   - `supabase_10_editable.sql` (permisos de edición para admin)
   - `supabase_11_flujo.sql` (arreglo definitivo de Mano de Obra)

3. Al final del script 11 deberías ver:
   ```
   Productos con categoria_mo NULL:     0
   Categorías MO totales:               11+
   Productos activos con MO calculable: 32
   Productos activos sin MO:            0
   ```

### PASO 2 — Subir al GitHub Pages

1. Borra todo el contenido viejo del repo `MVP-cotizador-combustible`
2. Sube TODOS los archivos de esta carpeta a la raíz del repo
3. Espera ~30 segundos a que GitHub Pages despliegue
4. Abre <https://ingtotem.github.io/MVP-cotizador-combustible/>

### PASO 3 — Crear/verificar usuarios

En Supabase → Authentication → Users debe existir al menos un usuario con rol **admin**. Si necesitas crear más usuarios:

1. Authentication → Users → **Invite user** (con email real)
2. SQL Editor → asignar rol:
   ```sql
   UPDATE public.usuarios
   SET rol = 'admin'  -- o ingeniero, cotizador, revisor, lector
   WHERE email = 'nuevo@usuario.com';
   ```

---

## 🗂 Estructura del proyecto

```
cotizador-v62/
│
├── login.html              Pantalla de ingreso
├── index.html              Dashboard (KPIs y atajos)
│
├── levantamiento.html      [PASO 1] Diseño técnico con selector POS
├── revision.html           [PASO 2] Vista solo-lectura para revisar
├── cotizacion.html         [PASO 3] Costos, márgenes y PVP editables
├── oferta-cliente.html     [PASO 4] Versión final imprimible
│
├── oferta.html             (Redirige al paso correcto del flujo)
├── prospectos.html         Lista de oportunidades
├── mantenimiento.html      Catálogo + recetas + familias + adicionales (admin)
│
├── css/
│   └── styles.css          Sistema de diseño (tema claro/oscuro)
│
├── js/
│   ├── supabase-client.js  Conexión a Supabase
│   ├── auth.js             Login, logout, roles, permisos
│   ├── icons.js            Iconos SVG estilo Lucide
│   ├── theme.js            Toggle claro/oscuro
│   ├── data.js             Carga del catálogo + helpers
│   ├── calculo.js          Motor de recetas (tubo, cable, MO)
│   ├── levantamiento.js    Lógica del selector POS y carrito
│   └── mantenimiento.js    CRUD inline para todas las tablas
│
└── supabase_*.sql          Scripts SQL para configurar la base
```

---

## 👥 Roles del sistema

| Rol           | Levantamiento | Revisión | Cotización | Oferta | Prospectos | Mantenimiento |
|---------------|:-------------:|:--------:|:----------:|:------:|:----------:|:-------------:|
| **admin**     | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ingeniero** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **cotizador** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **revisor**   | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **lector**    | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## 🎨 Características v6.2

### Selector POS (Levantamiento)
- Cuadritos de **Familias** con iconos SVG
- Cuadritos de **Modelos** (Marca + Característica) con precio
- **Búsqueda transversal** filtra todo el catálogo
- **Auto-switch de marca** en el carrito (mantiene la medida)
- Modal flotante para configurar cantidad, ubicación, tubo, cables, observaciones

### Flujo con aprobaciones
- **Enviar a revisión** limpia el levantamiento (puedes empezar otro)
- **Revisión** es solo lectura, evita modificaciones accidentales
- **Cotización** muestra Costo + Margen% + PVP por línea, igual que tu Excel
- **Márgenes editables por categoría** (Equipos / Materiales / MO / Adicionales)
- **Descuento global** opcional
- **Margen efectivo** se calcula en tiempo real

### Oferta para cliente
- 2 modos: **Resumen** (4 conceptos) o **Detalle por ítem** (SKU + marca + cantidad + PVP)
- Botón **Imprimir/PDF** del navegador
- Diseño limpio sin colores corporativos en la impresión

### Mantenimiento (solo admin)
- 5 pestañas: **Catálogo · Recetas · Familias · Adicionales · Parámetros**
- Edición inline en tabla, guardado fila por fila con 💾
- Toast notifications (verde = guardado, rojo = error)
- Animaciones de confirmación
- **Exportar JSON** de todo el catálogo y recetas (backup)
- Manejo de errores defensivo: si una tabla falla, las demás siguen funcionando

### Diseño visual
- Estilo Stripe/Apple: blanco puro, sombras suaves, tipografía Inter
- **Paleta corporativa:** Azul profundo `#0F4C81` + grises neutros
- **Toggle claro/oscuro** con persistencia en navegador
- Responsive en móviles y tablets

---

## 🛠 Diagnóstico rápido

### Si la Mano de Obra no calcula

Pega esto en SQL Editor:
```sql
SELECT
  cp.sku, cp.nombre, cp.categoria_mo,
  CASE WHEN rmo.categoria IS NULL THEN '❌ FALTA RECETA'
       ELSE '✅ ' || rmo.horas_base || 'h × $' || rmo.costo_hora END AS estado
FROM catalogo_productos cp
LEFT JOIN recetas_mano_obra rmo ON rmo.categoria = cp.categoria_mo
WHERE cp.activo = true
ORDER BY estado, cp.sku;
```

Si aparece "❌ FALTA RECETA" en algún producto, ve a Mantenimiento → Recetas → MO y agrega la categoría que falta, o cambia la categoría MO del producto en Catálogo.

### Si una pestaña de Mantenimiento no carga

Abre el navegador → F12 → pestaña **Console**. Verás los errores específicos. Las funciones tienen `safeRender()` que aísla los errores: si una tabla falla, las otras siguen funcionando.

### Si el login no funciona

Verifica que el usuario exista en **Authentication → Users** de Supabase, que tenga la contraseña correcta, y que tenga un registro en la tabla `public.usuarios` con su `rol`.

---

## 📋 Próximos pasos sugeridos

- **Persistencia real:** guardar levantamientos y ofertas en Supabase (hoy se guardan en sessionStorage del navegador)
- **Versionamiento de ofertas:** v1, v2, v3 con función `clonar_version_oferta()` (ya existe en el SQL)
- **Pantalla de Usuarios** en Mantenimiento (para que admin cree cuentas desde la app)
- **Generación de PDF** con jsPDF (ahora se usa "Imprimir" del navegador)
- **Cargar los 422 productos reales** del Excel
- **Notificaciones por email** cuando una oferta se aprueba

---

## 🔒 Notas de seguridad

- La password `admin123` del setup inicial es débil — **cámbiala** en Supabase → Authentication → Users → Reset password
- Las credenciales en `js/supabase-client.js` son la **anon key** pública (segura para frontend); la seguridad real está en las policies RLS de la base de datos

---

© 2025 TOTEM Control de Combustible · Guayaquil, Ecuador · v6.2
