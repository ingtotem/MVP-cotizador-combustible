# TOTEM · Cotizador de Control de Combustible — v5 (Supabase)

Aplicación web conectada a Supabase. Login real, roles, catálogo en la nube.

## ⚡ Inicio rápido

### 1. Ejecuta el SQL de configuración del admin

Antes de subir el código, abre el SQL Editor de Supabase y ejecuta el archivo
`supabase_03_usuario_admin.sql` (incluido en este zip).

Este script:
- Crea (o actualiza si ya existe) el usuario `admin@totem.local`
- Le pone la contraseña `admin123`
- Le asigna el rol `admin` en `public.usuarios`

Al final verás un mensaje confirmando que quedó configurado.

### 2. Sube todo a GitHub

Las credenciales de Supabase ya están configuradas en `js/supabase-client.js`.
No tienes que editar nada — solo sube los archivos al repo.

### 3. Login

- URL: tu sitio en GitHub Pages (ej: https://ingtotem.github.io/MVP-cotizador-combustible/)
- Te redirige automáticamente a `login.html`
- Usuario: **admin**
- Contraseña: **admin123**

## ⚠️ Seguridad

La contraseña `admin123` es DÉBIL y está visible en el chat de configuración.
**Antes de usar el sistema con datos reales de clientes, cámbiala:**

1. Loguéate como admin
2. (Próximamente) desde Mantenimiento → Usuarios podrás cambiarla
3. Por ahora puedes cambiarla desde Supabase: Authentication → Users → click en admin → Reset password

## Cómo funciona el login

- Los usuarios escriben solo "usuario" (ej: `admin`, `juan.perez`)
- Internamente se manda a Supabase como `admin@totem.local`
- El usuario NUNCA ve el `@totem.local`
- Solo el admin puede crear cuentas (registro abierto deshabilitado en Supabase Auth)

## Estructura del proyecto

```
cotizador/
├── login.html              ← Inicio de sesión
├── index.html              ← Dashboard (métricas reales)
├── levantamiento.html      ← Ingeniero (registra equipos sin ver precios)
├── oferta.html             ← Cotizador (arma oferta con costos y márgenes)
├── oferta-cliente.html     ← Vista PDF para imprimir
├── proyectos.html          ← Histórico con versionamiento
├── mantenimiento.html      ← Catálogo y recetas (admin)
├── cotizador.html          ← (redirección a levantamiento)
├── css/styles.css
└── js/
    ├── supabase-client.js  ← Credenciales (ya configuradas)
    ├── auth.js             ← Login, logout, control de roles
    ├── data.js             ← Carga catálogo y recetas desde Supabase
    ├── calculo.js          ← Motor de recetas
    ├── levantamiento.js    ← Lógica del ingeniero
    ├── oferta.js           ← Lógica del cotizador
    └── oferta-cliente.js   ← Renderiza vista cliente
```

## Roles del sistema

| Rol | Páginas que puede ver |
|---|---|
| admin | Todo + Mantenimiento + (próximamente) gestión de Usuarios |
| ingeniero | Dashboard + Levantamiento + Proyectos |
| cotizador | Dashboard + Levantamiento (solo lectura) + Cotización + Proyectos |
| revisor | Dashboard + Levantamiento + Cotización + Aprobar + Proyectos |
| lector | Dashboard + Oferta-Cliente + Proyectos |

## Estado de la integración

✅ Conexión a Supabase configurada  
✅ Login con usuario+contraseña (sin email visible)  
✅ Sesión persistente entre cierres de navegador  
✅ Logout funcional  
✅ Control de acceso por rol (RLS + nav filtrado)  
✅ Catálogo de 32 productos cargado en Supabase  
✅ Recetas de tubo, cable y mano de obra desde Supabase  
✅ 24 conceptos de costos adicionales  
✅ Parámetros globales (IVA, márgenes, etc.)  
✅ Dashboard con métricas reales  
✅ Mantenimiento muestra todo el catálogo en vivo  
✅ Proyectos lista las ofertas reales  

## Pendiente (Entrega 2.4-B — la siguiente)

⏳ Guardar levantamientos en Supabase (ahora usan sessionStorage local)  
⏳ Guardar ofertas con versionamiento real (función `clonar_version_oferta`)  
⏳ Pantalla "Usuarios" en Mantenimiento para crear usuarios desde la app  
⏳ Edición del catálogo y recetas desde Mantenimiento  
⏳ Generación de PDF real
