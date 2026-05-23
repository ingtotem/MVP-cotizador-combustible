# TOTEM · Cotizador de Control de Combustible

Aplicación web para cotizar sistemas de control de combustible (despacho + inventario) con motor de recetas configurables, versionamiento de ofertas y multi-rol.

## Flujo del sistema

El cotizador implementa un flujo de 4 etapas con responsabilidades separadas por rol:

```
   Ingeniero          Cotizador         Revisor         Cliente
       │                  │                │                │
       ▼                  ▼                ▼                ▼
 LEVANTAMIENTO   →   COTIZACIÓN   →   APROBACIÓN   →   ENVÍO
 (sin precios)      (precios y         (firma)        (PDF final)
                     márgenes)
```

## Vistas del sistema

### 1. Levantamiento Técnico (levantamiento.html)
**Rol: Ingeniero**

- NO ve costos, NO ve precios, NO ve márgenes
- Registra equipos desde un catálogo buscable
- Cada equipo se agrega con un MODAL FLOTANTE que captura datos técnicos:
  - Cantidad y ubicación
  - Altura de instalación (<3m o >3m)
  - Tipo y metros de tubería
  - Tipo y metros de cables (instrumentación / datos / eléctrico)
  - Observaciones técnicas
- Al terminar, envía el levantamiento al cotizador con un click

### 2. Cotización (oferta.html)
**Rol: Cotizador / Comercial**

- Lee el levantamiento del ingeniero
- Ve TODO el detalle comercial: costo equipos, materiales, MO, PVP, márgenes
- Puede modificar:
  - Margen global (afecta todos los ítems sin override)
  - Margen individual por ítem
  - Horas de mano de obra por ítem
  - Costos adicionales (logística, viáticos, permisos, obra civil)
  - Descuento comercial y plazo de renta

### 3. Vista Cliente (oferta-cliente.html)
**Rol: Lector / Cliente**

- Formato cotización profesional (estilo PDF Langosmar)
- Lista de ítems con PVP unitario y total
- Subtotales, IVA, total, opción renta mensual
- Botón de imprimir / guardar PDF
- Sin ver costos internos ni márgenes

## Estructura

```
cotizador/
├── index.html              Dashboard
├── levantamiento.html      Vista Ingeniero (con modal)
├── oferta.html             Vista Cotizador
├── oferta-cliente.html     Vista Cliente (imprimir/PDF)
├── proyectos.html          Listado con versionamiento
├── mantenimiento.html      Catálogo y recetas
├── css/styles.css
└── js/
    ├── data.js             Catálogo + recetas + adicionales
    ├── calculo.js          Motor de recetas
    ├── levantamiento.js    Lógica del ingeniero
    ├── oferta.js           Lógica del cotizador
    └── oferta-cliente.js   Renderiza vista cliente
```

## Paso de datos entre vistas

Los datos se persisten en sessionStorage del navegador. Cuando se conecte Supabase (Etapa 2), será reemplazado por consultas reales.

```
[Ingeniero] guarda levantamiento → sessionStorage
                ↓
[Cotizador] lee y arma oferta → sessionStorage  
                ↓
[Vista Cliente] lee oferta y presenta formateada
```

## Etapa 2 (próximo paso): Supabase

- Conexión a base de datos real
- Autenticación con roles (Ingeniero / Cotizador / Revisor / Admin)
- Versionamiento real (cada edición = nueva versión inmutable)
- Múltiples cotizaciones por usuario
- Edición del catálogo desde Mantenimiento
- Generación de PDF real
- Importación del catálogo completo (5000+ ítems)
