# TOTEM · Cotizador de Control de Combustible

Aplicación web para cotizar sistemas de control de combustible (despacho + inventario) con motor de recetas configurables, versionamiento de ofertas y multi-rol.

## Demo actual (Etapa 1 — sin base de datos)

Esta versión inicial funciona 100% en el navegador con datos de muestra en memoria. Sirve para validar la UX y la lógica del motor de recetas antes de conectar Supabase.

**Lo que ya funciona:**
- Dashboard con métricas de muestra
- Cotizador estilo POS: buscador → agregar al carrito → editar parámetros (cantidad, altura, tubería, cable, ubicación, margen) → cálculo en vivo
- **Panel de Costos Adicionales**: logística, indirectos, permisos, garantía, capacitación, obra civil, imprevistos — cada uno con cantidad × costo unitario. Son INTERNOS (afectan el costo y el margen, pero NO se muestran al cliente como línea separada)
- Motor de recetas: aplica costos ponderados de tubo, cable, mano de obra por categoría, factor altura, márgenes
- **Doble vista de resumen**: 
  - "Costos Internos" (lo que ves tú): equipos + materiales + MO + adicionales detallados por categoría
  - "Vista al Cliente": cómo se mostrará en la cotización final (formato PDF Langosmar: Equipos + Materiales + MO + IVA + Total + Renta mensual)
- Vista de proyectos con versionamiento simulado
- Vista de mantenimiento con catálogo, recetas Y catálogo de costos adicionales

**Lo que falta para producción (Etapa 2):**
- Conexión a Supabase para persistir datos
- Autenticación y roles reales (ingeniero / revisor / lector / admin)
- Versionamiento real (cada edición clona la última versión)
- Edición funcional del catálogo y recetas
- Generación de PDF de la oferta final
- Importación inicial del catálogo completo (5000+ productos del Excel)

## Estructura del proyecto

```
cotizador/
├── index.html              # Dashboard
├── cotizador.html          # Pantalla del cotizador POS
├── proyectos.html          # Listado de proyectos con versiones
├── mantenimiento.html      # Configuración: catálogo, recetas, parámetros
├── css/
│   └── styles.css          # Sistema de diseño industrial-refinado
└── js/
    ├── data.js             # Catálogo de muestra + recetas + parámetros
    ├── calculo.js          # Motor de recetas (calcularLinea, calcularTotales)
    └── cotizador.js        # Lógica de UI del POS
```

## Cómo probarlo localmente

Es HTML+CSS+JS puro, no requiere build. Abre `index.html` con un servidor estático:

```bash
# Opción 1: con Python
cd cotizador
python3 -m http.server 8000

# Opción 2: con Node
npx serve cotizador
```

Luego abre http://localhost:8000

## Pasos para subir a GitHub Pages

### 1. Crear repositorio
1. En GitHub, click **New repository**
2. Nombre: `cotizador-combustible`
3. **Public** (necesario para GitHub Pages gratis)
4. Marca **Add a README file**
5. **Create repository**

### 2. Subir los archivos
**Opción A — Por la web (más fácil):**
1. En el repo, click **Add file → Upload files**
2. Arrastra TODA la carpeta `cotizador/` (los HTMLs, css/, js/)
3. Commit changes

**Opción B — Por línea de comandos:**
```bash
git clone https://github.com/TU-USUARIO/cotizador-combustible.git
cd cotizador-combustible
# Copiar todos los archivos del cotizador aquí
git add .
git commit -m "Versión inicial del cotizador"
git push
```

### 3. Activar GitHub Pages
1. En tu repo: **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** · Folder: **/ (root)**
4. **Save**
5. En 1-2 minutos tu cotizador estará en:
   `https://TU-USUARIO.github.io/cotizador-combustible/`

## Etapa 2 — Conectar Supabase (próximo paso)

Cuando valides la Etapa 1, viene la integración con Supabase. Se cargará el **schema SQL** completo, autenticación y se reemplazarán los datos de muestra por consultas reales. Ya tengo armado el plan.

### Modelo de datos planificado
```
usuarios            (id, email, rol, nombre)
clientes            (id, nombre, ruc, direccion, contacto)
proyectos           (id, cliente_id, nombre, ubicacion, coordenadas)
ofertas             (id, proyecto_id, codigo, referencia, estado)
versiones_oferta    (id, oferta_id, numero, snapshot_json, creada_por, creada_en)
catalogo_productos  (id, sku, nombre, marca, modelo, grupo, unidad, costo, pvp)
recetas_tubo        (codigo, nombre, costo_m, descripcion)
recetas_cable       (codigo, nombre, tipo, costo_m)
recetas_mano_obra   (categoria, horas_base, factor_altura, costo_hora)
parametros          (clave, valor, descripcion)
```

### Lógica de versionamiento
Cada vez que se "edita" una oferta:
1. Se trae la última versión
2. Se clona como nueva versión (numero+1)
3. Los cambios se guardan en el clon
4. Las versiones anteriores quedan **inmutables** (nunca se borran)
5. El dashboard lee por defecto la última versión

## Recetas heredadas del Excel — entendidas

Del análisis del Excel original entendí cómo funcionan las recetas:

1. **Tubería ponderada por metro:** cada metro de tubo EMT/PVC no es solo el tubo, sino un costo que incluye proporcionalmente uniones (4 cada 5 tubos), conectores (1 cada 4), grapas (2 por tubo), tornillos, tacos fischer, cajas 4×4 y hojas de sierra.
2. **Cable por tipo:** instrumentación (3x18, 4x18), datos (UTP Cat 6), eléctrico (3x12, 3x10).
3. **Mano de obra por categoría:** cada tipo de equipo tiene horas-base y un factor que se multiplica si la altura de instalación supera los 3m.
4. **Margen aplicado:** PVP = Costo / (1 - margen).
5. **Renta mensual:** Total / plazo_meses × factor financiero (~10%).

Todas estas variables están en `js/data.js` y serán editables desde Mantenimiento cuando se integre Supabase.

## Catálogo

La demo tiene 32 productos representativos de las cotizaciones reales. El catálogo completo (5000+ ítems) se importará a Supabase desde el Excel del usuario en la Etapa 2.

Estructura: `{ id, sku, nombre, marca, modelo, grupo, unidad, costo, pvp }`

Grupos: SENSORES, COMUNICACION, CONTROLADORES, RFID, INSTRUMENTACION, REDES, ENERGIA, GABINETES, CCTV, ACCESORIOS, SERVICIOS.
