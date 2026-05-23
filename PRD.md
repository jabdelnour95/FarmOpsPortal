# PRD: Portal Operativo de Tierramor

**Versión:** 1.0
**Fecha:** 23 de mayo de 2026
**Autor:** Javier Abdelnour (Farm Manager / Product Owner)
**Estado:** Borrador para revisión

## Descripción general del producto

### Resumen del documento

Este documento define los requerimientos de producto para el Portal Operativo de Tierramor (en adelante, "el portal"), el sistema de gestión (ERP) centralizado de la Finca Tierramor en Costa Rica. El portal reemplaza el seguimiento fragmentado que hoy ocurre en WhatsApp, Google Sheets y Google AppSheet, consolidando todas las operaciones de la finca en una única fuente de verdad.

El portal es el sistema de registro (system of record). Notion actúa como capa de visibilidad y reportería, recibiendo resúmenes periódicos de KPIs enviados desde el backend. La interfaz está completamente en español, dado que el equipo de campo no habla inglés.

### Resumen del producto

El portal es una aplicación web mobile-first accesible desde el navegador del teléfono. Permite a los colaboradores de campo registrar actividades diarias (labores, siembras, cosechas, mantenimiento, producción), gestionar inventarios en tiempo real y generar reportes internos, todo desde sus dispositivos móviles. Los administradores y managers tienen visibilidad completa de todas las áreas y pueden configurar catálogos, usuarios y permisos.

La Fase 1 cubre seis departamentos operativos: Limpieza, Mantenimiento, Proveduría y Transportes, Producción de Alimentos, Biofábrica y Vivero.

## Objetivos

### Objetivos de negocio

- Eliminar la pérdida de información operativa causada por el uso de WhatsApp y hojas de cálculo no estructuradas como herramientas de registro.
- Tener trazabilidad completa de todas las actividades productivas de la finca: quién hizo qué, cuándo y en qué área.
- Generar datos confiables para la toma de decisiones del Farm Manager y el equipo de gerencia.
- Conectar automáticamente flujos entre departamentos (por ejemplo, uso de bioinsumos de Biofábrica que descuenta inventario, o cosecha de Producción de Alimentos que alimenta disponibilidad para Cocina).
- Habilitar contabilidad interna con facturas generadas automáticamente de cosechas y salidas de productos.

### Objetivos de usuario

- Los colaboradores de campo pueden registrar sus actividades desde el celular de forma rápida, sin depender de conexión estable y sin necesidad de hablar inglés.
- El Farm Manager puede revisar el estado operativo de la finca en cualquier momento sin tener que perseguir información por WhatsApp.
- El equipo de Cocina puede ver la disponibilidad de cosecha semanal y hacer sus pedidos directamente en el portal.
- El equipo de Vivero puede generar cotizaciones profesionales para clientes externos sin depender de hojas de cálculo.
- Nicolás (Operations Manager) puede supervisar las áreas bajo su responsabilidad (Limpieza, Mantenimiento, Proveduría) con información actualizada.

### Fuera del alcance (non-goals)

- Los departamentos de Cocina, Experiences, F&B, Marketing y Finanzas no se desarrollan en Fase 1 (se tratan en Fase 2 con discovery propio).
- El departamento de Gallinas está diferido para la siguiente iteración del PRD.
- El sistema no maneja identificadores individuales de plantas en Vivero (se trabaja a nivel de lote).
- No hay sincronización en tiempo real con Notion — solo envíos periódicos (push) de resúmenes.
- Los clientes externos no tienen acceso al portal; solo reciben cotizaciones generadas por el equipo interno.
- El sistema no gestiona nómina, contrataciones ni cambios salariales.

## Personas de usuario

### Tipos de usuario clave

El portal define cuatro tipos de usuario con distintos niveles de acceso y contextos de uso.

### Persona 1 — Colaborador de campo

**Perfil:** Trabajador de la finca asignado a uno o más departamentos. Puede ser encargado de área o asistente. Usa el celular como único dispositivo. Conectividad intermitente en algunas zonas de la finca. No habla inglés. Puede tener bajo nivel de alfabetización digital.

**Necesidades:** Registrar actividades rápidamente, idealmente con voz cuando escribir es incómodo. Ver solo lo que le corresponde a su área. Que el formulario le diga qué campos llenar sin ambigüedad.

**Acceso:** Solo ve y opera los módulos de su(s) departamento(s) asignado(s).

### Persona 2 — Equipo de Cocina

**Perfil:** Personal de cocina que necesita planificar los menús en función de lo que hay disponible en producción. No hace trabajo de campo. Accede al portal desde cocina (teléfono o tablet).

**Necesidades:** Ver la lista de disponibilidad de cosecha publicada cada semana. Hacer pedidos de cosecha indicando qué cultivos y cantidades necesita.

**Acceso:** Solo lectura en módulo de Disponibilidad de Producción de Alimentos; escritura en módulo de Pedido de Cocina.

### Persona 3 — Nicolás (Operations Manager)

**Perfil:** Gerente de operaciones. Supervisa Limpieza, Mantenimiento, Proveduría y Transportes. Fue quien construyó el prototipo original del sistema. Alto nivel técnico. Accede desde computadora y celular.

**Necesidades:** Visibilidad total de los departamentos bajo su responsabilidad. Poder revisar checklists, reportes y solicitudes pendientes. Configurar catálogos y usuarios dentro de sus áreas.

**Acceso:** Administrador de Limpieza, Mantenimiento y Proveduría. Sin acceso de escritura en Producción de Alimentos, Biofábrica o Vivero (solo lectura si se requiere).

### Persona 4 — Javier Abdelnour (Farm Manager / Admin)

**Perfil:** Dueño del producto. Gestiona Producción de Alimentos, Biofábrica, Vivero y la visión global de la finca. Toma decisiones basadas en los datos del portal. Accede desde computadora y celular.

**Necesidades:** Dashboard global con el estado de todos los departamentos. Acceso completo a todos los módulos. Configurar usuarios, permisos y catálogos. Revisar facturas internas y métricas de producción.

**Acceso:** Superadmin — acceso completo a todo el sistema.

### Control de acceso basado en roles

| Rol | Limpieza | Mantenimiento | Proveduría | Prod. Alimentos | Biofábrica | Vivero | Configuración |
|---|---|---|---|---|---|---|---|
| Colaborador de campo | Solo su dpto. | Solo su dpto. | Solo su dpto. | Solo su dpto. | Solo su dpto. | Solo su dpto. | Sin acceso |
| Equipo de Cocina | Sin acceso | Sin acceso | Sin acceso | Lectura Disponibilidad + Pedidos | Sin acceso | Sin acceso | Sin acceso |
| Nicolás (Ops Manager) | Admin | Admin | Admin | Lectura | Lectura | Lectura | Admin de sus dptos. |
| Javier (Farm Manager) | Admin | Admin | Admin | Admin | Admin | Admin | Superadmin |

## Requerimientos funcionales

Todos los requerimientos funcionales se organizan por departamento. La prioridad se define como:
- **P1 — Crítico:** Necesario para el lanzamiento de Fase 1.
- **P2 — Importante:** Mejora significativa, entra en Fase 1 si el tiempo lo permite.
- **P3 — Deseable:** Se pospone a Fase 2 si es necesario.

### Módulo transversal — Autenticación y gestión de usuarios

| ID | Requerimiento | Prioridad |
|---|---|---|
| AUTH-001 | Login con email y contraseña. | P1 |
| AUTH-002 | Recuperación de contraseña por email. | P1 |
| AUTH-003 | Gestión de usuarios desde panel admin: crear, editar, desactivar. | P1 |
| AUTH-004 | Asignación de roles y departamentos por usuario. | P1 |
| AUTH-005 | Sesión persistente en móvil (no cerrar sesión al cambiar de pestaña). | P1 |
| AUTH-006 | Cierre de sesión manual. | P1 |

### Módulo transversal — Catálogos y datos de referencia

| ID | Requerimiento | Prioridad |
|---|---|---|
| CAT-001 | Gestión de catálogo de colaboradores (nombre, rol, departamentos asignados). | P1 |
| CAT-002 | Gestión de áreas productivas (nombre, tipo: anual/agroforestal). | P1 |
| CAT-003 | Gestión de camas (ID único, área a la que pertenece). | P1 |
| CAT-004 | Gestión de catálogo de cultivos (nombre, unidad de cosecha, precio interno). | P1 |
| CAT-005 | Gestión de catálogo de materias primas de Biofábrica (nombre, unidad, stock mínimo, tipo: comprada/insumo de finca). | P1 |
| CAT-006 | Gestión de catálogo de productos terminados de Biofábrica (nombre, unidad, precio unitario interno). | P1 |
| CAT-007 | Gestión de catálogo de especies de Vivero (nombre, tipo, tiempo estimado de crecimiento). | P1 |
| CAT-008 | Gestión de categorías de precio de Vivero (especie + tamaño/edad → precio unitario). | P1 |
| CAT-009 | Gestión de catálogo de materias primas de Vivero (nombre, unidad, stock mínimo, tipo). | P1 |
| CAT-010 | Gestión de zonas de Limpieza (10 zonas con secciones e ítems de inspección). | P1 |
| CAT-011 | Gestión de clusters de Mantenimiento (6 clusters, ~40 áreas). | P1 |

### 1. Limpieza (Housekeeping)

#### 1.1 Reporte de labores

| ID | Requerimiento | Prioridad |
|---|---|---|
| LIM-001 | Crear reporte de labores diario con campos: fecha, turno (AM/PM), rol del colaborador, colaborador, áreas trabajadas (selección múltiple), duración, observaciones, foto opcional. | P1 |
| LIM-002 | Campo de dictado por voz en el campo "observaciones". | P1 |
| LIM-003 | Registro de dos campos de autoría: "quién hizo el trabajo" y "quién ingresó el dato". | P1 |
| LIM-004 | Listar, filtrar y buscar reportes de labores por fecha, turno, colaborador y área. | P1 |
| LIM-005 | Ver detalle de un reporte de labores. | P1 |

#### 1.2 Limpieza de áreas

| ID | Requerimiento | Prioridad |
|---|---|---|
| LIM-006 | Crear registro de limpieza de área con campos: fecha, turno, área, colaborador, duración, condición final, observaciones, foto opcional. | P1 |
| LIM-007 | Campo de dictado por voz en "observaciones". | P1 |
| LIM-008 | Registro de autoría dual (ejecutor + ingresador). | P1 |
| LIM-009 | Listar y filtrar registros por fecha, área y colaborador. | P1 |

#### 1.3 Checklists por área

| ID | Requerimiento | Prioridad |
|---|---|---|
| LIM-010 | Ver las 10 zonas de la finca con sus secciones e ítems de inspección configurados en el catálogo. | P1 |
| LIM-011 | Iniciar una sesión de checklist para una zona: marcar ítems como completados, agregar nota por ítem. | P1 |
| LIM-012 | Ver progreso del checklist por zona (porcentaje completado). | P1 |
| LIM-013 | Guardar y retomar un checklist en progreso. | P1 |
| LIM-014 | Historial de checklists completados por zona y fecha. | P2 |

#### 1.4 Inventario de ropa de cama

| ID | Requerimiento | Prioridad |
|---|---|---|
| LIM-015 | Ingresar conteo de inventario de 21 ítems de ropa de cama con cantidad por ítem. | P1 |
| LIM-016 | Ver historial de conteos anteriores. | P1 |
| LIM-017 | El formulario muestra los 21 ítems fijos configurados en el sistema. | P1 |

#### 1.5 Inventario de props de Wellness

| ID | Requerimiento | Prioridad |
|---|---|---|
| LIM-018 | Ingresar conteo de inventario de props de Wellness para Maloca y Movement Studio, por ítem y cantidad. | P1 |
| LIM-019 | Ver historial de conteos anteriores. | P1 |

### 2. Mantenimiento

#### 2.1 Reporte de trabajo

| ID | Requerimiento | Prioridad |
|---|---|---|
| MAN-001 | Crear reporte de trabajo con campos: fecha, cluster, área específica, colaborador, tipo de trabajo, descripción, duración, materiales usados, fotos opcionales, observaciones. | P1 |
| MAN-002 | Campo de dictado por voz en "descripción" y "observaciones". | P1 |
| MAN-003 | Registro de autoría dual (ejecutor + ingresador). | P1 |
| MAN-004 | Listar, filtrar y buscar reportes por fecha, cluster, área y colaborador. | P1 |
| MAN-005 | Ver detalle de un reporte de trabajo. | P1 |

#### 2.2 Reporte de avería

| ID | Requerimiento | Prioridad |
|---|---|---|
| MAN-006 | Crear reporte de avería (emergencia) con campos: fecha y hora, área, descripción del problema, colaborador que reporta, nivel de urgencia, fotos, estado (reportada/en atención/resuelta). | P1 |
| MAN-007 | Actualizar el estado de una avería desde "reportada" hasta "resuelta". | P1 |
| MAN-008 | Campo de dictado por voz en "descripción del problema". | P1 |
| MAN-009 | Registro de autoría dual. | P1 |
| MAN-010 | Listar averías activas (no resueltas) destacadas en la vista de Mantenimiento. | P1 |

#### 2.3 Solicitud de materiales

| ID | Requerimiento | Prioridad |
|---|---|---|
| MAN-011 | Crear solicitud de materiales con campos: fecha, área, colaborador solicitante, lista de materiales (descripción + cantidad + unidad), justificación, estado (pendiente/aprobada/rechazada/entregada). | P1 |
| MAN-012 | Actualizar el estado de una solicitud. | P1 |
| MAN-013 | Listar solicitudes pendientes de aprobación. | P1 |
| MAN-014 | Registro de autoría dual. | P1 |

#### 2.4 Checklists por cluster

| ID | Requerimiento | Prioridad |
|---|---|---|
| MAN-015 | Ver los 6 clusters con sus áreas e ítems de inspección configurados en el catálogo. | P1 |
| MAN-016 | Iniciar sesión de checklist por cluster: marcar ítems, agregar notas por ítem, subir foto opcional. | P1 |
| MAN-017 | Ver progreso del checklist por cluster. | P1 |
| MAN-018 | Guardar y retomar checklist en progreso. | P1 |
| MAN-019 | Historial de checklists por cluster y fecha. | P2 |

### 3. Proveduría y transportes

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROV-001 | Mostrar embed del Google Calendar de transportes dentro del portal, para consulta del equipo. | P1 |
| PROV-002 | Los flujos adicionales de Proveduría (solicitudes de compra, registro de proveedores, etc.) se definen en discovery de Fase 2. | P3 |

### 4. Producción de alimentos

#### 4.1 Datos de referencia (gestionados en catálogos)

Los flujos de este departamento dependen de que los catálogos de áreas productivas, camas y cultivos estén correctamente configurados por el administrador.

#### 4.2 Plan de siembra

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-001 | Crear y editar un plan de siembra estacional: por cama, asignar cultivo(s) planificados y fechas estimadas. | P1 |
| PROD-002 | Visualizar el plan de siembra en vista de tabla (camas vs. semanas). | P1 |
| PROD-003 | El plan migra datos desde Google Sheets existente (proceso manual de carga inicial). | P1 |

#### 4.3 Pedido de material de propagación

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-004 | Crear pedido semanal de material de propagación con campos: fecha, colaborador, lista de ítems (semillas/plántulas/esquejes, cantidad, unidad, cultivo destino), observaciones. | P1 |
| PROD-005 | Listar pedidos por semana. | P1 |
| PROD-006 | Registro de autoría dual. | P1 |

#### 4.4 Preparación de camas

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-007 | Crear registro de preparación de cama con campos: fecha, cama (ID), colaborador, insumos aplicados (selección desde catálogo Biofábrica, cantidad por insumo), observaciones, foto opcional. | P1 |
| PROD-008 | La aplicación de insumos de Biofábrica en este formulario dispara una salida de inventario en Biofábrica (integración automática). | P1 |
| PROD-009 | Registro de autoría dual. | P1 |
| PROD-010 | Listar registros de preparación por cama y fecha. | P1 |

#### 4.5 Siembra

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-011 | Crear registro de siembra por cama con campos: fecha, cama, cultivo, cantidad/densidad, colaborador, observaciones, foto opcional. | P1 |
| PROD-012 | Registro de autoría dual. | P1 |
| PROD-013 | Listar registros de siembra por cama, cultivo y fecha. | P1 |

#### 4.6 Aplicación de insumos

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-014 | Crear registro de aplicación de insumos a nivel de ÁREA (no cama) con campos: fecha, área productiva, colaborador, insumos aplicados (desde catálogo Biofábrica, cantidad por insumo), método de aplicación, observaciones, foto opcional. | P1 |
| PROD-015 | La aplicación de insumos dispara una salida automática del inventario de Biofábrica. | P1 |
| PROD-016 | Registro de autoría dual. | P1 |
| PROD-017 | Listar aplicaciones por área y fecha. | P1 |

#### 4.7 Mantenimiento de área

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-018 | Crear registro de mantenimiento de área con campos: fecha, área, tipo de mantenimiento (deshierbe, mulch, poda, chapea — selección múltiple), colaborador, duración, observaciones, foto opcional. | P1 |
| PROD-019 | Registro de autoría dual. | P1 |
| PROD-020 | Listar registros por área y fecha. | P1 |

#### 4.8 Disponibilidad semanal de cosecha

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-021 | Crear reporte de disponibilidad semanal: fecha de recorrido, por cultivo y área, cantidad estimada disponible, unidad, notas. | P1 |
| PROD-022 | Publicar la disponibilidad para que el equipo de Cocina pueda verla. | P1 |
| PROD-023 | Solo puede haber un reporte de disponibilidad activo por semana. | P1 |
| PROD-024 | Migración desde AppSheet (carga inicial manual). | P1 |

#### 4.9 Pedido de cocina

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-025 | El equipo de Cocina puede crear un pedido de cosecha a partir de la lista de disponibilidad activa: seleccionar cultivos y cantidades deseadas. | P1 |
| PROD-026 | El pedido queda asociado a la semana de disponibilidad correspondiente. | P1 |
| PROD-027 | El equipo de Producción puede ver el pedido de Cocina y confirmarlo o ajustarlo. | P1 |
| PROD-028 | Migración desde AppSheet (carga inicial manual). | P1 |

#### 4.10 Cosecha

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-029 | Crear registro de cosecha con campos: fecha, cultivo, área, cantidad cosechada real, unidad, colaborador, observaciones, foto opcional. | P1 |
| PROD-030 | Registro de autoría dual. | P1 |
| PROD-031 | Listar cosechas por cultivo, área y semana. | P1 |
| PROD-032 | Migración desde AppSheet (carga inicial manual). | P1 |

#### 4.11 Factura interna

| ID | Requerimiento | Prioridad |
|---|---|---|
| PROD-033 | Generar factura interna automáticamente al confirmar una cosecha: cultivo, cantidad cosechada, precio unitario interno del catálogo, valor total. | P1 |
| PROD-034 | Las facturas internas son de solo lectura (no se editan manualmente). | P1 |
| PROD-035 | Listar facturas internas por período y cultivo. | P1 |
| PROD-036 | Exportar listado de facturas internas a CSV. | P2 |

### 5. Biofábrica

#### 5.1 Entradas de materias primas

| ID | Requerimiento | Prioridad |
|---|---|---|
| BIO-001 | Crear entrada de materia prima con campos: fecha, materia prima (del catálogo), cantidad, unidad, tipo (comprada o insumo de finca), proveedor si aplica, costo si es comprada, colaborador, observaciones, foto de recibo opcional. | P1 |
| BIO-002 | La entrada actualiza automáticamente el stock actual de la materia prima. | P1 |
| BIO-003 | Registro de autoría dual. | P1 |
| BIO-004 | Listar entradas por materia prima y período. | P1 |

#### 5.2 Lotes de producción

| ID | Requerimiento | Prioridad |
|---|---|---|
| BIO-005 | Crear lote de producción con campos: fecha de inicio, producto terminado a producir, materias primas consumidas (ítem + cantidad), fecha de finalización estimada, colaborador encargado. | P1 |
| BIO-006 | Al cerrar un lote, registrar: fecha real de finalización, cantidad de producto terminado obtenida, observaciones. | P1 |
| BIO-007 | El cierre de lote descuenta las materias primas consumidas del inventario y suma el producto terminado obtenido al inventario de productos terminados. | P1 |
| BIO-008 | Registro de autoría dual. | P1 |
| BIO-009 | Listar lotes por producto terminado, estado (en proceso/cerrado) y fecha. | P1 |

#### 5.3 Salidas de producto terminado

| ID | Requerimiento | Prioridad |
|---|---|---|
| BIO-010 | Crear salida de producto terminado con campos: fecha, producto, cantidad, tipo de salida (uso interno por departamento/área, o venta externa por cliente), precio unitario, valor total. | P1 |
| BIO-011 | La salida descuenta automáticamente el inventario de producto terminado. | P1 |
| BIO-012 | Las salidas originadas desde Producción de Alimentos (aplicación de insumos, preparación de camas) se registran automáticamente — no requieren entrada manual doble. | P1 |
| BIO-013 | Registro de autoría dual. | P1 |
| BIO-014 | Listar salidas por producto, tipo y período. | P1 |

#### 5.4 Inventarios calculados

| ID | Requerimiento | Prioridad |
|---|---|---|
| BIO-015 | Vista de inventario actual de materias primas: stock calculado en tiempo real (entradas menos consumos en lotes de producción). | P1 |
| BIO-016 | Alerta visual cuando el stock de una materia prima cae por debajo del mínimo configurado en el catálogo. | P1 |
| BIO-017 | Vista de inventario actual de productos terminados: stock calculado en tiempo real (lotes cerrados menos salidas). | P1 |
| BIO-018 | Historial de movimientos por materia prima y por producto terminado. | P1 |

### 6. Vivero

#### 6.1 Entradas de materias primas

| ID | Requerimiento | Prioridad |
|---|---|---|
| VIV-001 | Crear entrada de materia prima de Vivero con campos: fecha, materia prima (del catálogo de Vivero), cantidad, unidad, tipo (comprada/insumo de finca), costo si es comprada, colaborador, observaciones. | P1 |
| VIV-002 | La entrada actualiza el stock de materias primas de Vivero. | P1 |
| VIV-003 | Registro de autoría dual. | P1 |

#### 6.2 Creación de lote

| ID | Requerimiento | Prioridad |
|---|---|---|
| VIV-004 | Crear lote de plantas con campos: especie (del catálogo), origen (siembra propia o adquisición mayorista), fecha de inicio, cantidad inicial, responsable, notas. | P1 |
| VIV-005 | Los lotes son la unidad de tracking — no se manejan IDs individuales por planta. | P1 |
| VIV-006 | Listar lotes activos por especie y estado. | P1 |

#### 6.3 Mantenimiento de lote

| ID | Requerimiento | Prioridad |
|---|---|---|
| VIV-007 | Crear registro de mantenimiento de lote con campos: fecha, lote, tipo de mantenimiento (riego, abonado, repotting, poda, bioinsumos, retiro de mortalidad), colaborador, cantidad si aplica (ej. litros aplicados, plantas retiradas), observaciones, foto opcional. | P1 |
| VIV-008 | La aplicación de bioinsumos de Biofábrica en mantenimiento de lote dispara una salida de inventario en Biofábrica. | P1 |
| VIV-009 | El retiro de mortalidad actualiza la cantidad viva en el lote. | P1 |
| VIV-010 | Registro de autoría dual. | P1 |
| VIV-011 | Listar registros de mantenimiento por lote y fecha. | P1 |

#### 6.4 Graduación a "listo para venta"

| ID | Requerimiento | Prioridad |
|---|---|---|
| VIV-012 | Graduar un lote (o una parte de él): asignar categoría de precio, registrar cantidad lista, fecha. | P1 |
| VIV-013 | Las plantas graduadas entran al stock disponible para ventas e inventario. | P1 |
| VIV-014 | Un lote puede graduarse parcialmente en varias fechas. | P1 |

#### 6.5 Salidas de lote

| ID | Requerimiento | Prioridad |
|---|---|---|
| VIV-015 | Crear salida de plantas con campos: fecha, lote, cantidad, tipo de salida (venta externa o uso interno/siembra en Tierramor), precio unitario si es venta, valor total si es venta, destino. | P1 |
| VIV-016 | La salida actualiza el stock del lote. | P1 |
| VIV-017 | Las salidas para uso interno quedan trazadas hacia Producción de Alimentos si el destino es una siembra. | P2 |
| VIV-018 | Registro de autoría dual. | P1 |
| VIV-019 | Listar salidas por especie, tipo y período. | P1 |

#### 6.6 Cotizador

| ID | Requerimiento | Prioridad |
|---|---|---|
| VIV-020 | Crear una cotización: agregar líneas de ítem (especie + categoría de precio + cantidad), información del cliente (nombre, email, teléfono), notas adicionales, fecha de validez. | P1 |
| VIV-021 | El sistema calcula el total de la cotización automáticamente según las categorías de precio del catálogo. | P1 |
| VIV-022 | Generar una vista imprimible / PDF de la cotización con formato profesional. | P1 |
| VIV-023 | Registrar el estado de la cotización: pendiente, aceptada, rechazada. | P1 |
| VIV-024 | Listar cotizaciones por estado, cliente y período. | P1 |
| VIV-025 | Al aceptar una cotización, crear automáticamente la salida de inventario correspondiente (venta externa). | P2 |
| VIV-026 | Los clientes externos no tienen acceso al portal — la cotización se genera internamente y se comparte como PDF o enlace de solo lectura. | P1 |

## Requerimientos de experiencia de usuario

### Puntos de entrada

El portal se accede desde el navegador del celular o computadora. No requiere instalación de aplicación nativa. Los colaboradores inician sesión con email y contraseña. El sistema recuerda la sesión para no tener que ingresar credenciales en cada visita.

### Experiencia central

Tras el login, el usuario llega a un panel principal que muestra accesos directos a los módulos de su(s) departamento(s). Los formularios de registro están diseñados para flujos cortos: el usuario selecciona el formulario, completa los campos obligatorios y guarda. Los campos de texto admiten dictado por voz en español de Costa Rica (es-CR). Las fotos se suben directamente desde la cámara del celular.

### Características avanzadas

- Los administradores y managers tienen un dashboard con métricas resumidas por departamento.
- Las integraciones entre departamentos (Biofábrica → Producción, Biofábrica → Vivero, Vivero → Producción) son automáticas — no requieren acción manual del usuario.
- El cotizador de Vivero genera un documento con formato visual profesional compartible con clientes externos.

### Aspectos destacados de UI/UX

- **Idioma:** Toda la interfaz está en español. Sin elementos en inglés visibles para el usuario.
- **Mobile-first:** El diseño prioriza pantallas de 375px a 430px. Los botones de acción son suficientemente grandes para uso con el dedo. Los formularios son verticales y no requieren scroll horizontal.
- **Claridad en formularios:** Etiquetas claras, campos obligatorios marcados, mensajes de error descriptivos. Se evita el uso de íconos sin texto cuando el significado no es obvio.
- **Feedback inmediato:** El sistema confirma visualmente cada guardado. Los errores de validación se muestran en línea junto al campo correspondiente.
- **Checklists visuales:** El progreso de los checklists de Limpieza y Mantenimiento se muestra con barra de progreso y porcentaje.
- **Alertas de inventario:** En Biofábrica, los ítems bajo stock mínimo se destacan en rojo o con ícono de alerta.
- **Consistencia visual:** Se usa una paleta de colores y tipografía consistente en todos los módulos. Los módulos de cada departamento tienen un color de acento identificador.

## Narrativa del usuario

Es lunes por la mañana y Daniela, encargada del área de hortalizas, sale a hacer el recorrido de disponibilidad semanal. Abre el portal en su celular, entra a Producción de Alimentos y crea el reporte de Disponibilidad: para cada cultivo que encuentra listo, registra el área, la cantidad estimada y cualquier observación usando dictado por voz porque tiene las manos sucias de tierra. Al terminar, publica la disponibilidad. Minutos después, Sofía en la cocina abre el portal, ve la lista publicada y hace el Pedido de Cocina seleccionando lo que necesita para la semana. El miércoles, cuando el equipo cosecha, Daniela registra las cosechas reales; el sistema genera automáticamente las facturas internas valorando cada cosecha al precio del catálogo de cultivos. Javier, desde su computadora, puede ver ese mismo día el resumen de producción de la semana sin haber enviado un solo mensaje de WhatsApp.

## Métricas de éxito

### Métricas centradas en el usuario

- El 90% de los colaboradores de campo completan sus registros diarios directamente en el portal (sin depender de WhatsApp como intermediario) en las primeras 4 semanas post-lanzamiento.
- El tiempo promedio para completar un formulario de registro de actividad es menor a 3 minutos desde el celular.
- Tasa de abandono de formularios a mitad de llenado menor al 10%.
- El equipo de Cocina crea su pedido semanal directamente desde la lista de disponibilidad del portal sin necesidad de coordinación por WhatsApp.

### Métricas de negocio

- El 100% de las cosechas registradas genera una factura interna automática, eliminando el proceso manual de valorización.
- Los movimientos de inventario de Biofábrica tienen cero discrepancias manuales: entradas y salidas son consistentes con los registros de Producción de Alimentos y Vivero.
- El Farm Manager puede generar un reporte de producción semanal en menos de 5 minutos, sin necesidad de recopilar datos de múltiples fuentes.
- Las cotizaciones del Vivero se emiten en formato profesional consistente, reduciendo a cero el tiempo de formateo manual.

### Métricas técnicas

- El portal carga en menos de 3 segundos en conexión 3G en dispositivos de gama media.
- Disponibilidad del sistema mayor al 99% en horario operativo (5:00 AM – 9:00 PM hora de Costa Rica).
- Todos los registros incluyen los dos campos de autoría (ejecutor e ingresador) — validado por auditoría de base de datos.
- Las fotos subidas se almacenan correctamente en Google Drive con nomenclatura estructurada (departamento/fecha/tipo).
- Los resúmenes de KPI se envían a Notion correctamente al menos una vez por día en días laborables.

## Consideraciones técnicas

### Puntos de integración

- **Supabase (PostgreSQL):** Backend principal. Toda la lógica de inventario calculado, validaciones de negocio y relaciones entre entidades se gestiona aquí. La base de datos es la fuente de verdad.
- **Cloudflare Workers:** Proxy entre el frontend y Supabase. Maneja autenticación, rate limiting y lógica de transformación de datos cuando es necesario.
- **Google Drive:** Almacenamiento de fotos subidas desde formularios. Cada departamento tiene una carpeta estructurada. El frontend sube directamente usando la API de Drive autenticada.
- **Web Speech API (es-CR):** Dictado por voz en campos de texto. Se activa con un botón de micrófono junto al campo. No requiere backend — se procesa en el navegador. Es una mejora progresiva: si el navegador no soporta la API, el campo sigue funcionando como texto normal.
- **Notion API:** Recibe resúmenes periódicos de KPIs generados por un job programado en el backend. No es sincronización en tiempo real — es un push periódico.
- **Google Calendar (embed):** Integrado en el módulo de Proveduría como iframe para consulta del calendario de transportes.

### Almacenamiento de datos y privacidad

- Todos los datos operativos se almacenan en Supabase (PostgreSQL). Los datos son de la finca y no se comparten con terceros.
- Las fotos se almacenan en Google Drive bajo la cuenta corporativa de Tierramor.
- Las contraseñas de usuarios se gestionan a través del sistema de autenticación de Supabase (hashed, nunca en texto plano).
- Los datos de clientes en cotizaciones de Vivero (nombre, email, teléfono) se almacenan en la base de datos y solo son accesibles por usuarios con rol de Vivero o Admin.
- No se recopilan datos personales de los colaboradores más allá de nombre, email y rol operativo.

### Escalabilidad y desempeño

- El volumen esperado en Fase 1 es bajo: menos de 20 usuarios simultáneos, con picos en horas de apertura de turno (5:00–7:00 AM y 12:00–1:00 PM).
- Los inventarios calculados de Biofábrica y Vivero se computan en el backend (vistas o funciones de Supabase) para evitar cálculos en el cliente.
- Las fotos se comprimen en el cliente antes de subir para reducir tiempo de carga en conexiones lentas.
- El diseño de la base de datos debe contemplar la adición futura de nuevos departamentos sin migraciones disruptivas.

### Desafíos potenciales

- **Conectividad intermitente:** Algunas zonas de la finca tienen cobertura irregular. En Fase 1, el sistema requiere conexión para guardar. En Fase 2 se evalúa soporte offline con sincronización diferida.
- **Adopción del equipo de campo:** La transición desde WhatsApp puede generar resistencia. Se requiere capacitación práctica y formularios suficientemente simples para no frustrar a usuarios con bajo nivel digital.
- **Consistencia de catálogos:** La calidad de los datos depende de que los catálogos (cultivos, materias primas, especies) estén bien configurados antes del lanzamiento. Un catálogo incompleto genera fricciones en el uso diario.
- **Integraciones entre departamentos:** Las salidas automáticas de inventario de Biofábrica disparadas desde Producción de Alimentos y Vivero requieren validación rigurosa para evitar discrepancias de inventario.
- **Carga inicial de datos:** La migración desde Google Sheets (Plan de Siembra) y AppSheet (Disponibilidad, Pedido de Cocina, Cosecha) es manual. Se necesita definir un proceso de carga inicial antes del go-live.

## Hitos y secuenciación

### Estimación del proyecto

La Fase 1 cubre seis departamentos con flujos bien definidos. La complejidad es media-alta por las integraciones entre departamentos y la necesidad de un sistema de autenticación y catálogos robusto desde el inicio.

**Estimación total Fase 1:** 16 a 22 semanas de desarrollo con un equipo de 2 personas.

### Tamaño del equipo

- 1 desarrollador fullstack (frontend + backend + integraciones)
- 1 diseñador/UX (puede ser part-time, especialmente en Sprints 1 y 2)
- Javier y Nicolás como product owners disponibles para revisiones semanales

### Fases sugeridas

**Fase 1a — Fundación (semanas 1–4)**
- Sistema de autenticación y gestión de usuarios con roles.
- Estructura base de la base de datos.
- Gestión de catálogos: colaboradores, áreas, camas, cultivos, materias primas, productos terminados, especies, zonas, clusters.
- Diseño del sistema de UI (paleta, tipografía, componentes base).
- Módulo de Limpieza completo (Reporte de Labores, Limpieza de Áreas, Checklists, Inventarios).

**Fase 1b — Operaciones de campo (semanas 5–10)**
- Módulo de Mantenimiento completo (Reporte de Trabajo, Avería, Solicitud de Materiales, Checklists).
- Módulo de Proveduría (embed de Google Calendar).
- Módulo de Producción de Alimentos: todos los flujos semanales (Plan de Siembra, Pedido de Propagación, Preparación de Camas, Siembra, Mantenimiento de Área, Aplicación de Insumos, Disponibilidad, Pedido de Cocina, Cosecha, Factura Interna).
- Integración de dictado por voz en todos los campos de texto.
- Upload de fotos a Google Drive.

**Fase 1c — Inventarios y ventas (semanas 11–16)**
- Módulo de Biofábrica completo (entradas, lotes, salidas, inventarios calculados, alertas).
- Integración Biofábrica → Producción de Alimentos (descuento automático de inventario).
- Módulo de Vivero completo (entradas, lotes, mantenimiento, graduación, salidas, cotizador).
- Integración Biofábrica → Vivero.

**Fase 1d — Integración, QA y lanzamiento (semanas 17–22)**
- Integración con Notion (job periódico de push de KPIs).
- Pruebas de campo con usuarios reales (colaboradores, Cocina, Javier, Nicolás).
- Carga inicial de datos (migración desde Sheets y AppSheet).
- Capacitación del equipo.
- Go-live y soporte de adopción inicial.

## Historias de usuario

### Autenticación y acceso

**US-001 — Inicio de sesión**
Como colaborador de la finca, quiero iniciar sesión con mi email y contraseña para acceder al portal de forma segura.
Criterios de aceptación:
- El formulario de login tiene campos de email y contraseña en español.
- Al ingresar credenciales correctas, el sistema redirige al panel principal del usuario.
- Al ingresar credenciales incorrectas, muestra un mensaje de error descriptivo en español.
- La sesión persiste entre visitas para no tener que ingresar credenciales cada vez.

**US-002 — Recuperación de contraseña**
Como usuario que olvidó su contraseña, quiero recuperarla por email para volver a acceder al portal.
Criterios de aceptación:
- Hay un enlace de "¿Olvidaste tu contraseña?" en la pantalla de login.
- El usuario ingresa su email y recibe un correo con enlace para restablecer la contraseña.
- El enlace de recuperación expira después de 24 horas.
- El formulario de restablecimiento valida que la nueva contraseña cumpla requisitos mínimos de seguridad.

**US-003 — Cierre de sesión**
Como usuario autenticado, quiero cerrar sesión de forma manual para proteger mi cuenta en dispositivos compartidos.
Criterios de aceptación:
- Hay una opción de "Cerrar sesión" accesible desde el menú principal.
- Al cerrar sesión, el sistema redirige al login y borra la sesión local.

**US-004 — Acceso restringido por rol**
Como colaborador de campo, quiero ver solo los módulos de mis departamentos asignados para no confundirme con información de otras áreas.
Criterios de aceptación:
- El panel principal solo muestra los módulos del departamento o departamentos asignados al usuario.
- Intentar acceder a una URL de un módulo no autorizado devuelve una pantalla de acceso denegado.
- Los roles se definen en el panel de administración y se aplican en tiempo real.

### Gestión de usuarios y catálogos (administrador)

**US-005 — Crear usuario**
Como administrador, quiero crear nuevos usuarios en el sistema para dar acceso al portal a nuevos colaboradores.
Criterios de aceptación:
- El formulario de creación de usuario incluye: nombre, email, contraseña temporal, rol, departamentos asignados.
- El sistema envía un email de bienvenida al nuevo usuario con sus credenciales.
- El nuevo usuario aparece en la lista de usuarios activos.

**US-006 — Editar y desactivar usuario**
Como administrador, quiero editar los datos de un usuario o desactivarlo cuando ya no trabaja en la finca.
Criterios de aceptación:
- El administrador puede cambiar nombre, rol y departamentos de un usuario existente.
- Un usuario desactivado no puede iniciar sesión pero sus registros históricos se conservan.
- La desactivación es reversible.

**US-007 — Gestionar catálogo de cultivos**
Como administrador, quiero agregar, editar y desactivar cultivos en el catálogo para mantener actualizada la lista que usan los formularios.
Criterios de aceptación:
- El formulario incluye: nombre del cultivo, unidad de cosecha, precio interno por unidad.
- Los cultivos desactivados no aparecen en los formularios de registro pero su historial se conserva.
- Los cambios de precio no afectan retroactivamente a facturas internas ya generadas.

**US-008 — Gestionar catálogo de áreas y camas**
Como administrador, quiero gestionar las áreas productivas y las camas asociadas para mantener actualizada la estructura física de la finca.
Criterios de aceptación:
- Se puede crear un área con nombre y tipo (anual/agroforestal).
- Se puede crear una cama con ID único y asignarla a un área.
- Las camas y áreas desactivadas no aparecen en formularios pero su historial se conserva.

**US-009 — Gestionar catálogo de materias primas de Biofábrica**
Como administrador, quiero gestionar el catálogo de materias primas de Biofábrica con stock mínimo para poder activar alertas de inventario.
Criterios de aceptación:
- El formulario incluye: nombre, unidad, stock mínimo, tipo (comprada/insumo de finca).
- Al guardar, el ítem aparece disponible en los formularios de entradas y consumos de Biofábrica.

**US-010 — Gestionar catálogo de productos terminados de Biofábrica**
Como administrador, quiero gestionar el catálogo de productos terminados de Biofábrica para que los lotes de producción y las salidas los puedan referenciar.
Criterios de aceptación:
- El formulario incluye: nombre, unidad, precio unitario interno.
- Al guardar, el producto aparece disponible en lotes y salidas de Biofábrica.

**US-011 — Gestionar catálogo de especies de Vivero**
Como administrador, quiero gestionar el catálogo de especies de Vivero con sus categorías de precio para que el cotizador use precios correctos.
Criterios de aceptación:
- El formulario de especie incluye: nombre, tipo, tiempo estimado de crecimiento.
- Se pueden agregar categorías de precio por especie: tamaño/edad → precio unitario.
- Los precios del catálogo se usan automáticamente en el cotizador.

**US-012 — Gestionar zonas y checklists de Limpieza**
Como administrador, quiero configurar las 10 zonas de Limpieza con sus secciones e ítems para que los colaboradores puedan usarlos en campo.
Criterios de aceptación:
- Se pueden crear zonas con nombre y descripción.
- Dentro de cada zona se pueden agregar secciones y dentro de cada sección, ítems de inspección.
- Los cambios en la estructura se reflejan en los checklists activos.

**US-013 — Gestionar clusters de Mantenimiento**
Como administrador, quiero configurar los 6 clusters de Mantenimiento con sus áreas para que los checklists de campo estén correctamente estructurados.
Criterios de aceptación:
- Se pueden crear clusters con nombre y descripción.
- Dentro de cada cluster se pueden agregar áreas con sus ítems de inspección.
- Los cambios se reflejan inmediatamente en los formularios de checklist.

### Limpieza

**US-014 — Crear reporte de labores**
Como colaborador de Limpieza, quiero registrar el reporte de mis labores diarias para dejar trazabilidad de las áreas que trabajé en mi turno.
Criterios de aceptación:
- El formulario incluye: fecha (por defecto hoy), turno AM/PM, rol, colaborador ejecutor, áreas trabajadas (selección múltiple), duración en horas/minutos, observaciones, foto opcional.
- El campo de observaciones tiene botón de dictado por voz.
- Se registra automáticamente quién ingresó el dato (usuario en sesión).
- Al guardar, aparece en la lista de reportes del día.

**US-015 — Crear registro de limpieza de área**
Como colaborador de Limpieza, quiero registrar la limpieza de un área específica con su condición final para dejar constancia del trabajo realizado.
Criterios de aceptación:
- El formulario incluye: fecha, turno, área, colaborador ejecutor, duración, condición final (selección: excelente/buena/regular/mala), observaciones con dictado por voz, foto opcional.
- Autoría dual registrada.
- Al guardar, aparece en el historial de esa área.

**US-016 — Completar checklist de zona**
Como colaborador de Limpieza, quiero completar el checklist de una zona marcando los ítems inspeccionados para evidenciar que revisé toda el área.
Criterios de aceptación:
- El usuario selecciona la zona y ve la lista de secciones e ítems.
- Puede marcar cada ítem como completado y agregar una nota opcional por ítem.
- Se muestra una barra de progreso con porcentaje completado.
- Puede guardar un checklist incompleto y retomarlo después.
- Al completar el 100%, el sistema marca el checklist como finalizado con fecha y hora.

**US-017 — Ver historial de checklists de Limpieza**
Como supervisor de Limpieza, quiero ver el historial de checklists completados por zona para verificar la frecuencia y calidad de las inspecciones.
Criterios de aceptación:
- Se puede filtrar el historial por zona y rango de fechas.
- Cada entrada muestra: zona, fecha, colaborador, porcentaje de completitud.
- Se puede abrir el detalle de un checklist para ver el estado de cada ítem.

**US-018 — Registrar inventario de ropa de cama**
Como colaborador de Limpieza, quiero ingresar el conteo de los 21 ítems de ropa de cama para mantener un registro actualizado del inventario.
Criterios de aceptación:
- El formulario muestra los 21 ítems fijos con campo numérico de cantidad por ítem.
- Se registra la fecha del conteo y el colaborador que lo realizó.
- Al guardar, el conteo aparece en el historial con fecha.
- Se puede ver el historial de conteos anteriores.

**US-019 — Registrar inventario de props de Wellness**
Como colaborador de Limpieza, quiero ingresar el conteo de props de Wellness para Maloca y Movement Studio para mantener el inventario actualizado.
Criterios de aceptación:
- El formulario muestra los ítems de props organizados por espacio (Maloca / Movement Studio).
- Se registra fecha y colaborador.
- Historial de conteos accesible.

### Mantenimiento

**US-020 — Crear reporte de trabajo de Mantenimiento**
Como colaborador de Mantenimiento, quiero registrar el trabajo realizado en un área para dejar trazabilidad de las intervenciones y su duración.
Criterios de aceptación:
- El formulario incluye: fecha, cluster, área específica, colaborador ejecutor, tipo de trabajo, descripción con dictado por voz, duración, materiales usados, fotos opcionales, observaciones con dictado por voz.
- Autoría dual registrada.
- Al guardar, aparece en la lista de trabajos del día filtrable por cluster y área.

**US-021 — Reportar una avería**
Como colaborador de Mantenimiento, quiero reportar una avería de emergencia con foto y nivel de urgencia para que el equipo de gestión pueda atenderla rápidamente.
Criterios de aceptación:
- El formulario incluye: fecha y hora (automáticas), área, descripción con dictado por voz, colaborador que reporta, nivel de urgencia (alta/media/baja), fotos, estado inicial = "reportada".
- La avería aparece inmediatamente en la lista de averías activas destacada visualmente.
- Autoría dual registrada.

**US-022 — Actualizar estado de avería**
Como supervisor de Mantenimiento, quiero actualizar el estado de una avería de "reportada" a "en atención" o "resuelta" para mantener al equipo informado sobre el progreso.
Criterios de aceptación:
- Desde el detalle de la avería, el supervisor puede cambiar el estado.
- Al marcar como "resuelta", se registra la fecha y hora de resolución.
- Las averías resueltas desaparecen de la lista de averías activas.

**US-023 — Crear solicitud de materiales**
Como colaborador de Mantenimiento, quiero crear una solicitud de materiales con lista de ítems para que el equipo de gestión la apruebe y provea los materiales necesarios.
Criterios de aceptación:
- El formulario incluye: fecha, área, colaborador solicitante, lista de ítems (descripción + cantidad + unidad, con opción de agregar múltiples líneas), justificación, estado inicial = "pendiente".
- Autoría dual registrada.
- Al guardar, aparece en la lista de solicitudes pendientes.

**US-024 — Aprobar o rechazar solicitud de materiales**
Como supervisor de Mantenimiento, quiero aprobar o rechazar solicitudes de materiales para gestionar los recursos de mantenimiento.
Criterios de aceptación:
- El supervisor puede cambiar el estado de una solicitud a "aprobada" o "rechazada" con una nota.
- Al aprobar, el estado puede avanzar a "entregada" cuando los materiales son provistos.
- El colaborador solicitante ve el estado actualizado de su solicitud.

**US-025 — Completar checklist de cluster**
Como colaborador de Mantenimiento, quiero completar el checklist de un cluster para evidenciar que revisé todas las áreas del sector.
Criterios de aceptación:
- Se selecciona el cluster y se muestran las áreas e ítems configurados.
- Se puede marcar cada ítem como completado, agregar nota y subir foto opcional por ítem.
- Barra de progreso con porcentaje completado por cluster.
- Se puede guardar incompleto y retomar.
- Historial de checklists por cluster y fecha accesible para supervisores.

### Proveduría y transportes

**US-026 — Ver calendario de transportes**
Como colaborador con acceso a Proveduría, quiero ver el calendario de transportes embebido en el portal para consultar los viajes programados sin salir del sistema.
Criterios de aceptación:
- El módulo de Proveduría muestra el Google Calendar de transportes como iframe.
- El calendario es de solo visualización dentro del portal.
- La vista es legible en móvil.

### Producción de alimentos

**US-027 — Gestionar plan de siembra**
Como encargado de Producción de Alimentos, quiero crear y editar el plan de siembra estacional por cama para tener una guía de qué cultivar en cada área.
Criterios de aceptación:
- Se puede seleccionar una cama y asignarle cultivo(s) planificados con fechas estimadas de siembra y cosecha.
- Se puede visualizar el plan en tabla (camas × semanas).
- Se puede editar el plan sin perder el historial.

**US-028 — Crear pedido de material de propagación**
Como encargado de Producción de Alimentos, quiero crear el pedido semanal de semillas, plántulas y esquejes para asegurar que el material llegue a tiempo.
Criterios de aceptación:
- El formulario incluye: fecha, colaborador, lista de ítems (tipo de material + cultivo destino + cantidad + unidad, con múltiples líneas), observaciones.
- Autoría dual registrada.
- El pedido aparece en el historial por semana.

**US-029 — Registrar preparación de cama**
Como colaborador de Producción de Alimentos, quiero registrar los insumos aplicados durante la preparación de una cama para tener trazabilidad de los insumos usados y actualizar el inventario de Biofábrica.
Criterios de aceptación:
- El formulario incluye: fecha, cama (selección por ID), colaborador ejecutor, insumos aplicados (selección desde catálogo Biofábrica con cantidad por ítem), observaciones con dictado por voz, foto opcional.
- Al guardar, el sistema genera automáticamente salidas en el inventario de Biofábrica por los insumos seleccionados.
- Autoría dual registrada.

**US-030 — Registrar siembra**
Como colaborador de Producción de Alimentos, quiero registrar una siembra en una cama con el cultivo y la densidad para mantener el historial productivo de la cama.
Criterios de aceptación:
- El formulario incluye: fecha, cama, cultivo (del catálogo), cantidad/densidad, colaborador ejecutor, observaciones con dictado por voz, foto opcional.
- Autoría dual registrada.
- El registro aparece en el historial de la cama.

**US-031 — Registrar aplicación de insumos a área**
Como colaborador de Producción de Alimentos, quiero registrar la aplicación de insumos de Biofábrica a un área productiva para actualizar el inventario automáticamente y tener trazabilidad.
Criterios de aceptación:
- El formulario es a nivel de ÁREA (no cama): fecha, área productiva, colaborador ejecutor, insumos (del catálogo Biofábrica + cantidad + método de aplicación), observaciones con dictado por voz, foto opcional.
- Al guardar, el sistema crea automáticamente salidas de inventario en Biofábrica.
- Autoría dual registrada.

**US-032 — Registrar mantenimiento de área**
Como colaborador de Producción de Alimentos, quiero registrar las actividades de mantenimiento realizadas en un área para tener historial de deshierbes, mulches, podas y chapeas.
Criterios de aceptación:
- El formulario incluye: fecha, área, tipo(s) de mantenimiento (selección múltiple: deshierbe, mulch, poda, chapea), colaborador ejecutor, duración, observaciones con dictado por voz, foto opcional.
- Autoría dual registrada.
- El registro aparece filtrable por área y tipo de mantenimiento.

**US-033 — Crear reporte de disponibilidad semanal**
Como encargado de Producción de Alimentos, quiero crear el reporte de disponibilidad semanal tras el recorrido de campo para informar a Cocina qué hay disponible para cosechar.
Criterios de aceptación:
- El formulario incluye: fecha de recorrido, semana de referencia, filas de disponibilidad (cultivo + área + cantidad estimada + unidad + notas), con opción de agregar múltiples filas.
- Los campos de notas admiten dictado por voz.
- Solo puede haber un reporte de disponibilidad activo por semana — si ya existe uno, el sistema lo señala.
- Al publicar, el reporte es visible para el equipo de Cocina.

**US-034 — Ver disponibilidad semanal (Cocina)**
Como integrante del equipo de Cocina, quiero ver la lista de disponibilidad publicada para saber qué productos agrícolas puedo usar en los menús de la semana.
Criterios de aceptación:
- Al entrar al portal, el equipo de Cocina ve directamente el reporte de disponibilidad activo.
- La lista muestra: cultivo, área, cantidad estimada, unidad, notas.
- Si no hay disponibilidad publicada aún, se muestra un mensaje explicativo.

**US-035 — Crear pedido de Cocina**
Como integrante del equipo de Cocina, quiero crear mi pedido semanal seleccionando cultivos de la lista de disponibilidad para que el equipo de campo sepa qué cosechar.
Criterios de aceptación:
- El formulario carga automáticamente los cultivos de la disponibilidad activa.
- El usuario de Cocina indica la cantidad que solicita por cultivo.
- El pedido queda asociado a la semana de disponibilidad correspondiente.
- El equipo de Producción puede ver y confirmar o ajustar el pedido.

**US-036 — Confirmar o ajustar pedido de Cocina**
Como encargado de Producción de Alimentos, quiero revisar el pedido de Cocina y confirmarlo o ajustar cantidades antes de la cosecha para alinear expectativas.
Criterios de aceptación:
- El encargado ve el pedido de Cocina con las cantidades solicitadas.
- Puede confirmar cada ítem o ajustar la cantidad con una nota de justificación.
- El equipo de Cocina puede ver el estado actualizado del pedido.

**US-037 — Registrar cosecha**
Como colaborador de Producción de Alimentos, quiero registrar las cantidades cosechadas reales por cultivo y área para tener el historial de producción y activar la factura interna.
Criterios de aceptación:
- El formulario incluye: fecha, cultivo, área, cantidad cosechada real, unidad, colaborador ejecutor, observaciones con dictado por voz, foto opcional.
- Autoría dual registrada.
- Al guardar, el sistema genera automáticamente una factura interna.

**US-038 — Ver factura interna generada**
Como Farm Manager, quiero ver las facturas internas generadas por cada cosecha para llevar la contabilidad interna del valor de producción.
Criterios de aceptación:
- Cada cosecha genera una factura interna con: cultivo, cantidad, precio unitario (del catálogo al momento de la cosecha), valor total.
- Las facturas son de solo lectura — no se pueden editar manualmente.
- Se pueden listar y filtrar por período y cultivo.
- Se puede exportar la lista a CSV.

### Biofábrica

**US-039 — Registrar entrada de materia prima**
Como colaborador de Biofábrica, quiero registrar la entrada de una materia prima para actualizar el inventario y tener trazabilidad del origen del material.
Criterios de aceptación:
- El formulario incluye: fecha, materia prima (del catálogo), cantidad, unidad, tipo (comprada/insumo de finca), proveedor y costo si es comprada, colaborador ejecutor, observaciones, foto de recibo si aplica.
- Al guardar, el stock de la materia prima se actualiza automáticamente.
- Autoría dual registrada.

**US-040 — Crear lote de producción**
Como colaborador de Biofábrica, quiero iniciar un lote de producción indicando qué materias primas se consumen y qué producto se producirá para tener trazabilidad del proceso productivo.
Criterios de aceptación:
- El formulario incluye: fecha de inicio, producto terminado a producir, materias primas consumidas (ítems + cantidades, múltiples líneas), fecha estimada de finalización, colaborador encargado.
- Al iniciar el lote, el stock de materias primas no se descuenta aún (se descuenta al cerrar el lote).
- El lote queda en estado "en proceso".
- Autoría dual registrada.

**US-041 — Cerrar lote de producción**
Como colaborador de Biofábrica, quiero cerrar un lote de producción registrando la cantidad final obtenida para actualizar los inventarios de materias primas y producto terminado.
Criterios de aceptación:
- Al cerrar, se registra: fecha real de finalización, cantidad de producto terminado obtenida, observaciones.
- El sistema descuenta las materias primas consumidas del inventario.
- El sistema agrega la cantidad de producto terminado al inventario.
- El lote pasa a estado "cerrado".

**US-042 — Registrar salida de producto terminado**
Como colaborador de Biofábrica, quiero registrar la salida de un producto terminado indicando si es uso interno o venta externa para actualizar el inventario y tener trazabilidad financiera.
Criterios de aceptación:
- El formulario incluye: fecha, producto, cantidad, tipo de salida (uso interno por departamento/área, o venta externa por cliente), precio unitario, valor total calculado automáticamente.
- Al guardar, el stock del producto terminado se descuenta.
- Las salidas generadas automáticamente por Producción de Alimentos y Vivero se distinguen visualmente de las manuales.
- Autoría dual registrada.

**US-043 — Ver inventario de materias primas con alertas**
Como encargado de Biofábrica, quiero ver el inventario actual de materias primas con alertas para los ítems bajo stock mínimo, para planificar compras a tiempo.
Criterios de aceptación:
- La vista muestra: nombre de materia prima, unidad, stock actual calculado, stock mínimo, estado (OK/alerta).
- Los ítems bajo stock mínimo aparecen destacados visualmente (rojo o ícono de alerta).
- El stock se calcula en tiempo real: entradas menos consumos en lotes cerrados.

**US-044 — Ver inventario de productos terminados**
Como encargado de Biofábrica, quiero ver el inventario actual de productos terminados para conocer la disponibilidad de bioinsumos para los departamentos.
Criterios de aceptación:
- La vista muestra: nombre del producto, unidad, stock actual calculado.
- El stock se calcula en tiempo real: lotes cerrados menos salidas.
- Se puede ver el historial de movimientos (entradas y salidas) por producto.

### Vivero

**US-045 — Registrar entrada de materia prima de Vivero**
Como colaborador de Vivero, quiero registrar la entrada de materias primas del vivero para actualizar el stock disponible.
Criterios de aceptación:
- El formulario incluye: fecha, materia prima (del catálogo de Vivero), cantidad, unidad, tipo, costo si es comprada, colaborador ejecutor, observaciones.
- Al guardar, el stock de la materia prima de Vivero se actualiza.
- Autoría dual registrada.

**US-046 — Crear lote de plantas**
Como colaborador de Vivero, quiero registrar la creación de un nuevo lote de plantas para iniciar su seguimiento productivo.
Criterios de aceptación:
- El formulario incluye: especie (del catálogo), origen (siembra propia/adquisición mayorista), fecha de inicio, cantidad inicial, responsable, notas.
- Al guardar, el lote aparece en la lista de lotes activos.
- Autoría dual registrada.

**US-047 — Registrar mantenimiento de lote**
Como colaborador de Vivero, quiero registrar las actividades de mantenimiento realizadas en un lote para tener trazabilidad del cuidado de las plantas y actualizar el inventario de Biofábrica si se usaron bioinsumos.
Criterios de aceptación:
- El formulario incluye: fecha, lote, tipo de mantenimiento (riego, abonado, repotting, poda, bioinsumos, retiro de mortalidad), colaborador ejecutor, cantidad si aplica (litros, plantas retiradas), observaciones con dictado por voz, foto opcional.
- Si se registra uso de bioinsumos de Biofábrica, el sistema genera una salida automática en Biofábrica.
- Si se registra retiro de mortalidad, la cantidad viva del lote se actualiza.
- Autoría dual registrada.

**US-048 — Graduar lote a "listo para venta"**
Como encargado de Vivero, quiero graduar plantas de un lote asignando una categoría de precio para que entren al stock disponible y puedan venderse o usarse internamente.
Criterios de aceptación:
- Se selecciona el lote, la cantidad de plantas a graduar y la categoría de precio del catálogo.
- Se registra la fecha de graduación.
- Un lote puede graduarse parcialmente en múltiples fechas.
- Las plantas graduadas aparecen en el inventario disponible de Vivero.

**US-049 — Registrar salida de plantas**
Como colaborador de Vivero, quiero registrar la salida de plantas de un lote (venta o uso interno) para actualizar el stock y tener registro financiero si es venta.
Criterios de aceptación:
- El formulario incluye: fecha, lote, cantidad, tipo de salida (venta externa/uso interno), precio unitario y valor total si es venta, destino.
- Al guardar, el stock del lote se actualiza.
- Autoría dual registrada.

**US-050 — Crear cotización para cliente externo**
Como encargado de Vivero, quiero crear una cotización para un cliente externo seleccionando especies y categorías de precio para presentarle una oferta profesional.
Criterios de aceptación:
- El formulario incluye: información del cliente (nombre, email, teléfono), fecha de validez, líneas de ítem (especie + categoría de precio + cantidad), notas adicionales.
- El total se calcula automáticamente según el catálogo de precios.
- Se puede agregar y eliminar líneas de ítem libremente.
- Al guardar, la cotización queda en estado "pendiente".

**US-051 — Generar documento de cotización**
Como encargado de Vivero, quiero generar una versión imprimible o PDF de la cotización para compartirla con el cliente externo.
Criterios de aceptación:
- El sistema genera una vista de impresión limpia con: logo/nombre de la finca, información del cliente, tabla de ítems (especie, categoría, cantidad, precio unitario, subtotal), total general, fecha de validez, notas.
- El documento es exportable como PDF desde el navegador.
- El cliente no necesita acceder al portal para ver la cotización.

**US-052 — Actualizar estado de cotización**
Como encargado de Vivero, quiero actualizar el estado de una cotización a "aceptada" o "rechazada" para mantener el historial de ventas y activar el proceso siguiente si se acepta.
Criterios de aceptación:
- El encargado puede cambiar el estado de "pendiente" a "aceptada" o "rechazada".
- Al aceptar, se registra la fecha de aceptación.
- El historial de cotizaciones es filtrable por estado, cliente y período.

**US-053 — Ver lista de lotes activos de Vivero**
Como encargado de Vivero, quiero ver todos los lotes activos con su especie, cantidad actual y estado para tener visibilidad del stock del vivero.
Criterios de aceptación:
- La vista muestra: especie, origen, fecha de inicio, cantidad actual viva, cantidad graduada disponible, estado del lote.
- Se puede filtrar por especie y estado.
- Se puede abrir el detalle de un lote para ver su historial de mantenimiento y graduaciones.

### Requerimientos transversales

**US-054 — Dictado por voz en campos de texto**
Como colaborador de campo, quiero usar el micrófono para dictar texto en los campos de observaciones y descripción para agilizar el registro cuando tengo las manos ocupadas.
Criterios de aceptación:
- Los campos de texto extenso tienen un botón de micrófono junto a ellos.
- Al presionar el botón, se activa el reconocimiento de voz en español de Costa Rica (es-CR).
- El texto dictado se inserta en el campo y puede editarse manualmente.
- Si el navegador no soporta la Web Speech API, el botón no aparece y el campo funciona como texto normal.

**US-055 — Subir foto desde formulario**
Como colaborador de campo, quiero subir una foto desde la cámara de mi celular en los formularios que lo permiten para documentar el trabajo realizado con evidencia visual.
Criterios de aceptación:
- Los formularios con campo de foto muestran un botón de cámara que abre el selector de archivos/cámara del dispositivo.
- La foto se sube a Google Drive en la carpeta estructurada correspondiente al departamento y fecha.
- La foto se comprime en el cliente antes de subir para reducir el tiempo de carga.
- Se pueden subir hasta 3 fotos por formulario (o definir el máximo por tipo de formulario).
- Si la subida falla, el sistema notifica al usuario y permite reintentar.

**US-056 — Registro de autoría dual**
Como administrador, quiero que todos los registros del portal capturen tanto al ejecutor del trabajo como al ingresador del dato para tener trazabilidad completa en la auditoría.
Criterios de aceptación:
- Todos los formularios de registro incluyen un campo "Realizado por" (colaborador ejecutor, selección de lista) y registran automáticamente el usuario en sesión como "Ingresado por".
- Ambos campos son visibles en el detalle de cada registro.
- No se puede guardar un registro sin el campo "Realizado por" completado.

**US-057 — Navegación entre módulos**
Como usuario del portal, quiero navegar entre los módulos de mi departamento de forma clara desde el menú principal para acceder rápidamente a cualquier flujo.
Criterios de aceptación:
- El menú principal muestra accesos directos a los módulos del departamento del usuario.
- La navegación funciona correctamente en móvil con tap (sin hover).
- El usuario siempre puede volver al menú principal desde cualquier pantalla.
- La navegación no requiere recargar la página completa (experiencia SPA).

**US-058 — Mensajes de confirmación y error**
Como usuario del portal, quiero recibir confirmación visual cuando guardo un registro y mensajes de error claros cuando algo falla para saber si mis datos fueron registrados correctamente.
Criterios de aceptación:
- Al guardar exitosamente, se muestra un mensaje de confirmación en español ("Registro guardado correctamente").
- Si hay campos obligatorios sin completar, el sistema los resalta en rojo y muestra un mensaje descriptivo junto a cada campo.
- Si falla la conexión al guardar, el sistema muestra un mensaje de error y permite reintentar.
- Los mensajes de error no usan tecnicismos — son comprensibles para usuarios sin experiencia técnica.

**US-059 — Filtros y búsqueda en listados**
Como supervisor o manager, quiero filtrar y buscar registros en los listados por fecha, colaborador y área para encontrar información específica sin revisar toda la lista.
Criterios de aceptación:
- Los listados principales de cada módulo tienen filtros por fecha (rango) y por colaborador.
- Los módulos relevantes tienen filtro adicional por área o cultivo.
- Los filtros se pueden combinar.
- El listado se actualiza sin recargar la página al aplicar filtros.

**US-060 — Dashboard del administrador**
Como Farm Manager o Administrador, quiero tener un panel de control con un resumen del estado de todos los departamentos para tener visibilidad operativa sin entrar a cada módulo individualmente.
Criterios de aceptación:
- El dashboard muestra: actividad reciente por departamento (últimos registros del día), alertas activas (averías sin resolver, stocks bajo mínimo), pedidos pendientes (Cocina, materiales).
- Solo los usuarios con rol de Admin o Manager ven el dashboard.
- El dashboard carga en menos de 3 segundos.

**US-061 — Integración automática Biofábrica → Producción de Alimentos**
Como sistema, debo descontar automáticamente del inventario de Biofábrica cuando se registra una aplicación de insumos o preparación de cama en Producción de Alimentos para mantener la consistencia entre departamentos.
Criterios de aceptación:
- Al guardar una preparación de cama con insumos de Biofábrica, el sistema crea automáticamente las salidas correspondientes en el inventario de Biofábrica.
- Al guardar una aplicación de insumos de área con productos de Biofábrica, ocurre lo mismo.
- Si el stock de Biofábrica es insuficiente para la cantidad solicitada, el sistema muestra una advertencia (pero no bloquea el guardado).
- Las salidas automáticas son visibles en el historial de Biofábrica con referencia al registro que las originó.

**US-062 — Integración automática Biofábrica → Vivero**
Como sistema, debo descontar automáticamente del inventario de Biofábrica cuando se registra uso de bioinsumos en el mantenimiento de un lote de Vivero.
Criterios de aceptación:
- Al guardar un registro de mantenimiento de lote con tipo "bioinsumos", el sistema solicita seleccionar el producto de Biofábrica y la cantidad.
- Al guardar, se crea automáticamente la salida en Biofábrica con referencia al lote de Vivero.
- Advertencia si el stock es insuficiente (sin bloquear).
- La salida aparece en el historial de Biofábrica con referencia al lote.

**US-063 — Envío periódico de KPIs a Notion**
Como Farm Manager, quiero que el portal envíe resúmenes periódicos de KPIs a Notion para tener visibilidad ejecutiva en la herramienta de reportería sin depender del portal para la consulta diaria.
Criterios de aceptación:
- Un job programado en el backend envía resúmenes de KPIs a Notion al menos una vez por día en días laborables.
- El resumen incluye métricas clave por departamento: actividad del día, inventarios críticos, cosechas de la semana, cotizaciones pendientes.
- Si el envío falla, el sistema registra el error y reintenta en el siguiente ciclo.
- El contenido enviado a Notion es de solo lectura — Notion no escribe de vuelta al portal.
