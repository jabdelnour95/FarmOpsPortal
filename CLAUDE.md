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
├── index.html                  ← Shell del app (solo pantallas y un <script type="module">)
├── css/
│   └── styles.css
├── js/
│   ├── app.js                  ← Entry point: importa todo y expone al window
│   ├── data/
│   │   ├── users.js            ← Usuarios y colaboradores (temporales — reemplazar con Supabase Auth)
│   │   ├── departments.js      ← Config de departamentos, calendarios
│   │   ├── checklists-limpieza.js
│   │   └── checklists-manto.js
│   └── modules/
│       ├── state.js            ← Estado global de la sesión
│       ├── auth.js             ← Login / logout
│       ├── navigation.js       ← Navegación entre pantallas
│       ├── calendar.js         ← (pendiente extraer de navigation.js)
│       ├── inventory.js        ← Inventarios de Limpieza
│       ├── photos.js           ← Upload y preview de fotos
│       ├── audio.js            ← Dictado de voz (Web Speech API, es-CR)
│       ├── checklists.js       ← Lógica de checklists
│       ├── forms.js            ← Formularios de reportes
│       ├── manuals.js          ← Manuales de Limpieza y Mantenimiento
│       └── reports.js          ← Vista de reportes (Admin)
```

---

## Estado actual

### Completado
- [x] Reestructuración del app original: 1 archivo monolítico (95KB) → 17 módulos ES
- [x] App corriendo localmente sin errores
- [x] Repositorio fork configurado y código pusheado

### Pendiente (próximos pasos en orden)
- [ ] Mapear flujos de datos de departamentos Phase 1 (Javier los conoce parcialmente)
- [ ] Diseñar schema de Supabase para Phase 1
- [ ] Crear cuenta de Cloudflare
- [ ] Crear proyecto Supabase
- [ ] Construir Cloudflare Worker (proxy)
- [ ] Conectar formularios y checklists a Supabase
- [ ] Reemplazar usuarios hardcodeados con Supabase Auth
- [ ] Agregar departamentos nuevos (Food Production, Biofactory, etc.)

---

## Departamentos

### Phase 1 — En construcción
| Departamento | Estado en portal | Schema Supabase |
|---|---|---|
| Limpieza (HK) | ✅ Funcional | Pendiente diseño |
| Mantenimiento | ✅ Funcional | Pendiente diseño |
| Proveduría y Transportes | ✅ Parcial (solo calendario) | Pendiente diseño |
| Producción Agrícola | ❌ No iniciado | Pendiente mapeo de flujos |
| Biofábrica | ❌ No iniciado | Pendiente mapeo de flujos |

### Phase 2 — Requiere discovery con jefes de área
Kitchen, Experiences, F&B, Marketing, Finanzas (y otros que se identifiquen).

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
