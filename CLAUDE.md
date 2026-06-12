# CLAUDE.md — Tierramor Ops Portal

## Tu rol

Sos el co-constructor técnico de este proyecto. Tu contraparte es Javier Abdelnour, Farm Manager de Tierramor y fundador de KATUK. Javier toma las decisiones de producto y negocio; vos ejecutás la arquitectura y el código.

Este proyecto también involucra a Nicolás, el Operations Manager de Tierramor, quien construyó la versión original del portal y lidera los equipos de Limpieza, Mantenimiento y Proveduría.

---

## Qué es este proyecto

Un **ERP operativo para la Finca de Tierramor** — el sistema de registro central para todas las operaciones de la finca. No es solo un formulario de recolección de datos: es la herramienta desde la cual cada departamento registra su trabajo, y desde la cual Javier tiene visibilidad de toda la operación.

**Notion** es la capa de visibilidad y planificación. Recibe resúmenes y KPIs desde este sistema, no datos crudos. El ERP es el sistema de registro; Notion es el portal de lectura.

---

## Repositorios

| Repo | URL | Estado |
|---|---|---|
| Original de Nicolás | https://github.com/TAops26/Ops-Portal | No tocar — referencia solamente |
| Fork de Javier (V2) | https://github.com/jabdelnour95/Ops-Portal-V2 | Activo — este directorio |

**Directorio local:** `C:\Users\jabde\OneDrive\Desktop\TIERRAMOR-OS\10_OPS_OS`

Para correr el app localmente: `python -m http.server 8080` desde este directorio, luego abrir `http://localhost:8080`.

---

## Infraestructura

| Servicio | Proyecto | Región | Estado |
|---|---|---|---|
| Supabase | `tierramor-portal` | South America (São Paulo) | ✅ Activo — schema instalado |
| Cloudflare Worker | `tierramor-api` | Auto | ✅ Desplegado — `https://tierramor-api.jabdelnour95.workers.dev` |
| GitHub Pages | `jabdelnour95/Ops-Portal-V2` | — | ⬜ Pendiente configurar |

**Credenciales:** guardadas en `Docs/Supabase env` (nunca commitear este archivo).

**Nota técnica — Supabase SQL Editor:** No soporta transacciones multi-statement (`BEGIN`/`ROLLBACK`). Cada statement se auto-commitea. Para limpiar datos de prueba, usar DELETEs en orden respetando FK constraints.

**Nota técnica — JWT:** Supabase proyectos nuevos emiten JWTs con algoritmo **ES256** (ECDSA P-256), no HS256. El Worker valida via JWKS (`/auth/v1/.well-known/jwks.json`). El payload del JWT incluye `role: "authenticated"` (rol de Supabase), no el rol de la app — el Worker fetchea el rol real de la tabla `profiles` en cada request autenticado.

---

## Arquitectura (decisiones confirmadas)

| Capa | Tecnología | Razón |
|---|---|---|
| Frontend | Vanilla JS, ES modules, HTML/CSS | Sin dependencias, corre en GitHub Pages |
| Base de datos | Supabase (PostgreSQL) | Soporta datos relacionales (Food Production, Biofactory) que Notion no puede modelar bien |
| Proxy / API layer | Cloudflare Workers | Oculta las keys de Supabase del frontend; punto único de cambio si se migra de backend |
| Fotos | Google Drive (vía Worker) | Ya integrado en flujo de trabajo del equipo |
| Reportes / KPIs | Notion (push periódico desde Supabase) | Notion es visibilidad y planificación, no base de datos |

**Por qué no Google Sheets:** Problemas de escritura concurrente, no soporta datos relacionales, capa extra entre el app y Notion.

**Por qué no Notion como DB:** No puede modelar Food Production (camas → siembras → cosechas) ni Biofactory (inventario transaccional). Funciona bien solo para registros planos.

---

## Estructura de archivos

```
10_OPS_OS/
├── index.html                  ← Shell del app (pantallas + estilos inline + <script type="module">)
├── css/
│   └── styles.css
├── worker/
│   ├── worker.js               ← Cloudflare Worker (proxy Supabase + Google Drive)
│   ├── wrangler.toml           ← Config de deploy
│   ├── .dev.vars.example       ← Template de variables de entorno
│   └── .gitignore              ← Excluye .dev.vars y .wrangler/
├── js/
│   ├── app.js                  ← Entry point: importa todo y expone al window
│   ├── data/
│   │   ├── users.js            ← Lista de colaboradores por equipo (referencia, no auth)
│   │   ├── departments.js      ← Config de departamentos Ops (DEPTS, CAL_IDS, CAL_LABELS)
│   │   ├── checklists-limpieza.js
│   │   └── checklists-manto.js
│   └── modules/
│       ├── state.js            ← Estado global: currentUser, accessToken, currentDept, deptParent
│       ├── auth.js             ← Login / logout / restoreSession (conectado al Worker)
│       ├── navigation.js       ← Navegación + renderHome + galería de departamentos
│       ├── inventory.js        ← Inventarios de Limpieza
│       ├── photos.js           ← Upload y preview de fotos
│       ├── audio.js            ← Dictado de voz (Web Speech API, es-CR)
│       ├── checklists.js       ← Lógica de checklists
│       ├── forms.js            ← Formularios de reportes Ops
│       ├── manuals.js          ← Manuales de Limpieza y Mantenimiento
│       ├── reports.js          ← Vista de reportes (Admin)
│       └── food.js             ← Módulo Producción de Alimentos — 6 formularios completos
```

---

## Estado actual

### Completado
- [x] Reestructuración del app original: 1 archivo monolítico (95KB) → módulos ES
- [x] App corriendo localmente sin errores
- [x] Repositorio fork configurado y código pusheado
- [x] Flujos de departamentos Phase 1 mapeados (Producción de Alimentos, Biofábrica, Vivero)
- [x] PRD Phase 1 escrito y commiteado (`PRD.md`) — 63 historias de usuario, 6 departamentos
- [x] **TDD escrito** — `Docs/TDD.md` — schema completo, API del Worker, auth, decisiones de diseño
- [x] **Proyecto Supabase creado** — región São Paulo, plan free, proyecto `tierramor-portal`
- [x] **Schema implementado en Supabase** — 47 tablas, 5 vistas, 13 triggers, 13 funciones
- [x] **Usuario admin creado** — jabdelnour95@gmail.com, rol admin
- [x] **Triggers verificados** — generación de IDs (PROD/BIO/VIV/GRP/SUB) y facturas automáticas funcionando
- [x] **Cloudflare Worker desplegado** — `https://tierramor-api.jabdelnour95.workers.dev` — todas las rutas del TDD, ES256 JWT, rol fetcheado de `profiles`; fotos pendiente Google Drive
- [x] **Secrets cargados en Cloudflare** — SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_JWT_SECRET
- [x] **Worker verificado en producción** — login, JWT validation, catálogos e inventario respondiendo con datos reales
- [x] **Supabase Auth en el frontend** — `auth.js` conectado al Worker, JWT en localStorage, `restoreSession()` al cargar
- [x] **Dashboard principal rediseñado** — galería de tiles por área (Finca, Operaciones, Cocina, Experiencias), visibilidad por rol y `profile.departments`
- [x] **Arquitectura de navegación por niveles** — home → sub-galería (finca-home / ops-home) → módulo; botón Atrás rastreado via `state.deptParent`
- [x] **Reportes movidos a cada sub-galería** — tile Admin-only dentro de Finca y Operaciones (no en el home principal)
- [x] **Módulo Producción de Alimentos construido** — `js/modules/food.js` — pantalla `#food-screen` con galería de 6 formularios activos
- [x] **Worker actualizado** — `CATALOG_ORDER` para ordenar camas por `code.asc`; handler especial para `POST /food/availability` con items en cascada; `POST /catalog/crops` permitido para no-admins; `GET /api/farm-workers` para dropdown de participantes — Version ID `69f598de-efca-48ef-98c8-adbeb52b206e`

### Próximos pasos (en orden)
- [x] **Tabla `farm_workers` creada en Supabase** — activa con datos del equipo.
- [x] **Participantes: multi-select dropdown implementado** — Worker con `GET /api/farm-workers`; `_workersField()` en food.js; `_getParticipants()` para el submit; los nombres van al campo `observations` como "Participantes: Ana, Carlos"
- [ ] **Verificar nombres de tablas en Worker** — el Worker usa `food_production_lots` / `harvest_records`; el TDD define `plantings` / `harvests`. Confirmar nombres reales en Supabase antes de testear submit.
- [ ] **Módulo Biofábrica** — pantalla + formularios; requiere sesión de discovery
- [ ] **Módulo Vivero** — pantalla + formularios; requiere sesión de discovery
- [ ] **Implementar RLS policies en Supabase** — control de acceso por rol y departamento (antes del go-live)
- [ ] **Crear usuarios de Supabase para el equipo** — justo antes del go-live, cuando los módulos estén listos
- [ ] **Implementar upload de fotos** — Google Drive via service account (ver TODO en `worker/worker.js:handlePhotos`)
- [ ] **Configurar GitHub Pages** — para deploy del frontend

---

## Departamentos

### Farm Portal — Fase 1 (este proyecto)
| Departamento | Estado en portal | Flujo mapeado | Schema Supabase |
|---|---|---|---|
| Producción de Alimentos | ✅ Activo — 6 formularios en `#food-screen` | ✅ | ✅ En Supabase |
| Biofábrica | 🔄 Tile placeholder en finca-home | ✅ | ✅ En Supabase |
| Vivero | 🔄 Tile placeholder en finca-home | ✅ | ✅ En Supabase |

### Ops Portal — Proyecto separado (Nicolás Salas)
Limpieza, Mantenimiento y Proveduría. Stack independiente (Google Sheets como backend).
Integración con Farm Portal diferida a Fase 2.

### Fase 2 — Pendiente
Integración Farm Portal ↔ Ops Portal + departamentos nuevos (Cocina, Experiences, F&B, Marketing, Finanzas, Gallinas).
Cada departamento nuevo requiere una sesión de discovery de 20–30 min antes de diseñar su módulo.

---

## Arquitectura de navegación (frontend)

### Pantallas y flujo

```
#ls (login)
  └─→ #home (galería principal)
        ├─→ #finca-home (sub-galería Finca)
        │     ├─→ #food-screen (Producción de Alimentos) ← openFood() directo en onclick
        │     │     ├─→ form: prep-cama
        │     │     ├─→ form: siembra
        │     │     ├─→ form: aplic-insumos
        │     │     ├─→ form: mantenimiento
        │     │     ├─→ form: disponibilidad
        │     │     └─→ form: cosecha
        │     ├─→ Biofábrica               [placeholder → #con-screen]
        │     ├─→ Vivero                   [placeholder → #con-screen]
        │     └─→ Reportes (admin)         [placeholder → #con-screen]
        ├─→ #ops-home (sub-galería Operaciones)
        │     ├─→ #dept (Limpieza)
        │     ├─→ #dept (Mantenimiento)
        │     ├─→ #dept (Proveduría)
        │     └─→ #rep-screen (Reportes, admin)
        ├─→ Cocina       [tile deshabilitado — Próximamente]
        └─→ Experiencias [tile deshabilitado — Próximamente]
```

**Nota:** El tile de Producción de Alimentos en `finca-home` llama `openFood()` directamente (no `openFincaModule('produccion')`). Esto evita una dependencia circular entre `navigation.js` y `food.js`.

### Visibilidad de tiles por rol

La función `renderHome()` en `navigation.js` filtra los tiles del home usando `canSeeTile()`:
- `profile.role === 'admin'` → ve todo
- Otros roles → ve solo los tiles donde `profile.departments[]` contiene al menos un `deptKey` del tile

El Worker retorna en el login: `user.profile.{ full_name, role, departments[] }`.

Tiles de Reportes dentro de sub-galerías: visibilidad admin-only gestionada por `_toggleAdminTiles(screenId)`, llamada automáticamente desde `show()` al mostrar `finca-home` u `ops-home`.

### Navegación de botón Atrás

`state.deptParent` registra desde dónde se abrió `#dept`. `navBackDept()` lo usa para volver al screen correcto (siempre `ops-home` en la arquitectura actual). Esto evita hardcodear `nav('home')` en el back button del dept screen.

---

## Decisiones de diseño confirmadas

Documentadas en detalle en `Docs/TDD.md` sección 9. Resumen:

| # | Decisión | Resolución |
|---|---|---|
| D-001 | Stock insuficiente al cerrar lote de Biofábrica | Solo advertir, no bloquear |
| D-002 | Upload de fotos a Google Drive | Via Cloudflare Worker (service account oculta) |
| D-003 | Pedidos de cocina por semana | Múltiples permitidos (campo `label` opcional) |
| D-004 | Inventario de contenedores del Vivero | Por tipo de contenedor, no por batch |
| D-005 | Participantes en formularios de Producción | Multi-select dropdown desde tabla `farm_workers`; temporalmente texto libre en `observations` |
| D-006 | Cosecha: trazabilidad por canasta | Una fila por canasta (crop + área + cama + kg). Un registro en `harvest_records` por fila. |
| D-007 | Preparar Cama con múltiples camas | Filas dinámicas; un `bed_preparations` record por cama via `Promise.all()` |
| D-008 | Scope de Aplicar Insumos / Mantenimiento | Toggle "área completa" vs "camas específicas" — cambia la UI sin cambiar el schema |
| D-009 | Ordenamiento de camas en catálogo | `code.asc` (no `name.asc`) — corregido en Worker via `CATALOG_ORDER` map |

### Patrones de `food.js`

- **Estado de módulo:** `_cats` (catálogos cacheados), `_plantings`, filas dinámicas por formulario (`_prepBedRows`, `_harvestRows`, etc.), `_applyScope` / `_maintScope` para toggles.
- **`_loadCats()`:** Fetcha `beds`, `crops`, `areas`, `bio` en paralelo con `Promise.all()`. Se cachea en `_cats` para el resto de la sesión.
- **`_bedOptsByArea(areaId)`:** Filtra `_cats.beds` client-side. No hace llamadas al Worker — las camas ya están en caché.
- **Window bindings:** `_fic` / `_fac` (add/remove input rows), `_fpb` / `_fab` (prep/apply bed rows), `_fhr` (harvest rows), `_foodFilterBeds`, `_foodApplyScope`, `_foodMaintScope`, `_foodNewCropToggle`, `_foodHarvestUnit`, `_foodAvailUnit`, `_foodApplyScopeAreaChanged`.
- **Submit multi-registro:** `Promise.all(rows.map(row => _api(...)))` — una llamada al Worker por fila.

---

## Convenciones del proyecto

- **Idioma del UI:** Español latino. Todo lo que ve el usuario va en español.
- **Idioma del código:** Inglés (variables, funciones, comentarios).
- **Sin frameworks:** Vanilla JS únicamente. Sin React, Vue, ni bundlers.
- **Sin comentarios obvios:** Solo comentar el "por qué", nunca el "qué".
- **ES modules:** Toda función nueva va en su módulo correspondiente, exportada e importada en `app.js`.
- **Un módulo por responsabilidad:** No mezclar lógica de UI con lógica de datos.
- **TODO comments:** Usar `// TODO: [descripción]` para marcar integraciones pendientes con el backend.

---

## Credenciales de prueba (temporales)

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | tierramor2024 | Administrador |
| rol1 | rol1pass | Limpieza |
| manto1 | manto123 | Mantenimiento |

⚠️ Estas credenciales son temporales y serán reemplazadas por Supabase Auth.
