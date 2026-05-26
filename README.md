# TOTEM · Cotizador de Control de Combustible — v6.1

Sistema web para gestionar levantamientos técnicos y cotizaciones de proyectos de control de combustible.

**Stack:** HTML + CSS + JavaScript puro · Supabase (DB + Auth) · GitHub Pages (hosting).

---

## 🎨 Novedades de la versión 6.1

✅ **Mantenimiento totalmente editable** — el admin puede agregar, modificar y eliminar:
- Productos del catálogo (incluyendo familia, marca, categoría MO, costo, PVP)
- Recetas de tubería, cable y mano de obra
- Familias de productos
- Costos adicionales (logística, obra civil, especiales)
- Parámetros globales (IVA, márgenes, etc.)

✅ **Cálculo de mano de obra arreglado** — ahora cada producto tiene una columna `categoria_mo` editable que apunta a una receta de MO. Por defecto coincide con el grupo del producto.

✅ **Vista cliente con 2 modos:**
- **Resumen:** 4 conceptos grandes (Equipos, Materiales, MO, Adicionales)
- **Detalle por ítem:** cada SKU con marca, cantidad, PVP unitario y subtotal — incluyendo materiales por metro y MO por categoría

✅ **Toast notifications** y **animaciones de guardado** en Mantenimiento (verde = guardado, rojo = error).

✅ **Exportar backup JSON** de todo el catálogo y recetas.

---

## 🚀 Cómo actualizar a v6.1

### 1. Ejecutar 1 SQL nuevo en Supabase

Solo necesitas correr `supabase_10_editable.sql`:

1. SQL Editor → New query → pega el contenido → Run
2. Verifica que veas:
   ```
   Productos con categoria_mo:      32
   Productos sin categoria_mo:       0
   Categorías MO definidas:         11
   Match (productos con MO):        32
   Sin match (revisar):              0
   ```

### 2. Subir los archivos a GitHub

Reemplaza el contenido de tu repo con esta versión.

### 3. Probar

**Probar mano de obra:**
1. Ve a Levantamiento, agrega cualquier equipo (ej. Sensor Magneto)
2. Click "Enviar a cotización"
3. En la sección "04 Mano de obra estimada" deberías ver las horas y el costo calculados

**Probar mantenimiento:**
1. Login con el usuario admin
2. Ve a **Mantenimiento** (solo admin lo ve)
3. Pestaña **Catálogo**: cambia un PVP de cualquier producto → click 💾 → verás un toast verde
4. Pestaña **Recetas**: edita el costo por metro de un tubo → 💾
5. Pestaña **Familias**: agrega una familia nueva
6. Pestaña **Adicionales**: agrega un concepto nuevo
7. Pestaña **Parámetros**: cambia el IVA (recuerda: 0.15 no 15)

**Probar oferta cliente:**
1. Ve a Cotización → Ver versión cliente
2. Botones arriba: "📄 Modo resumen" y "📋 Modo detalle"
3. Click en cada uno para alternar
4. "🖨 Imprimir / PDF" exporta el modo activo

---

## 🗂 Estructura

```
cotizador-v6/
├── login.html
├── index.html              Dashboard
├── levantamiento.html      Selector POS + carrito
├── oferta.html             Vista interna del cotizador
├── oferta-cliente.html     Vista cliente (2 modos)
├── proyectos.html          Lista de ofertas
├── mantenimiento.html      *** AMPLIADO: 5 pestañas con CRUD ***
│
├── css/styles.css
├── js/
│   ├── supabase-client.js
│   ├── auth.js
│   ├── icons.js
│   ├── theme.js
│   ├── data.js             ahora incluye categoria_mo
│   ├── calculo.js
│   ├── levantamiento.js
│   └── mantenimiento.js    *** NUEVO ***
│
├── supabase_01_schema.sql       ya aplicado
├── supabase_02_datos_iniciales.sql  ya aplicado
├── supabase_03_usuario_admin.sql    ya aplicado
├── supabase_09_familias.sql         ya aplicado en v6
└── supabase_10_editable.sql         *** EJECUTAR ESTE EN v6.1 ***
```

---

## 👥 Roles del sistema

| Rol         | Catálogo | Mantenimiento |
|-------------|----------|---------------|
| **admin**   | ✅ ve | ✅ edita TODO |
| **ingeniero** | ✅ ve | ❌ |
| **cotizador** | ✅ ve | ❌ |
| **revisor** | ✅ ve | ❌ |
| **lector** | ✅ ve | ❌ |

---

## 🛠 Próximos pasos sugeridos

- **Persistencia real:** guardar levantamientos y ofertas en Supabase (hoy se guardan en sessionStorage)
- **Versionamiento:** v1/v2/v3 de una oferta con función `clonar_version_oferta()`
- **Pantalla de Usuarios** en Mantenimiento (para crear cuentas desde la app)
- **PDF real:** integración con jsPDF o similar
- **Catálogo completo:** cargar ~422 productos reales del Excel
- **Auditoría de cambios:** quién modificó qué y cuándo

---

© 2025 TOTEM Control de Combustible · Guayaquil, Ecuador
