# TDD: Portal Operativo de Tierramor — Fase 1

**Versión:** 1.0  
**Fecha:** 11 de junio de 2026  
**Basado en:** PRD v1.2  
**Autor:** Javier Abdelnour + Claude (co-autor técnico)

---

## 1. Alcance

Este documento define el diseño técnico completo para la Fase 1 del Portal Operativo de Tierramor. Cubre:

- Schema completo de la base de datos en Supabase (PostgreSQL)
- Triggers y lógica de negocio en la base de datos
- Row Level Security (RLS)
- API del Cloudflare Worker (rutas, autenticación, lógica de integración)
- Flujo de autenticación con Supabase Auth
- Almacenamiento de fotos en Google Drive

**Departamentos incluidos:** Producción de Alimentos, Biofábrica, Vivero.  
**Fuera de alcance:** Limpieza, Mantenimiento, Proveduría (portal separado de Nicolás Salas).

---

## 2. Arquitectura

```
[Browser / Mobile]
       │
       ▼
[Cloudflare Worker]  ← valida JWT, oculta service key, aplica rate limiting
       │
       ├── [Supabase Auth]     ← login, refresh, reset password
       ├── [Supabase PostgREST] ← CRUD sobre tablas y vistas
       ├── [Supabase Edge Fns] ← (si se necesita lógica compleja fuera de triggers)
       └── [Google Drive API]  ← subida de fotos
```

**Decisiones de arquitectura:**

| Preocupación | Dónde vive | Razón |
|---|---|---|
| Validación de JWT | Worker | Punto único de seguridad antes de llegar al backend |
| Descuento automático de inventario | Trigger PostgreSQL | Atomicidad — falla el insert y el descuento juntos o no pasa nada |
| Generación de IDs legibles (PROD-2026-0001) | Trigger PostgreSQL | Consistencia, sin depender del cliente |
| Creación automática de facturas | Trigger PostgreSQL | Mismo motivo — atomicidad con el registro que las origina |
| CRUD de catálogos | Supabase PostgREST (via Worker) | Estándar, sin lógica especial |
| Cálculo de inventarios | Vistas SQL | Se calculan en el backend, no en el cliente |

---

## 3. Schema de Supabase

### 3.1 Autenticación y perfiles de usuario

Supabase Auth gestiona `auth.users` (tabla interna). Extendemos con dos tablas propias:

```sql
-- Perfil de usuario extendido
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('admin', 'field_worker', 'kitchen')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Departamentos asignados a cada usuario (muchos-a-muchos)
CREATE TABLE public.profile_departments (
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department  text NOT NULL CHECK (department IN (
    'food_production', 'biofactory', 'nursery', 'kitchen'
  )),
  PRIMARY KEY (profile_id, department)
);
```

**Trigger para crear perfil automáticamente al crear un usuario en Supabase Auth:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'field_worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 3.2 Catálogos

Los catálogos son configurados por el admin. Todos tienen campo `active` para soft-delete — los registros desactivados no aparecen en formularios pero su historial se conserva.

```sql
-- Áreas productivas de la finca
CREATE TABLE public.productive_areas (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,
  type    text NOT NULL CHECK (type IN ('annual', 'agroforestry')),
  active  boolean NOT NULL DEFAULT true
);

-- Camas (dentro de un área)
CREATE TABLE public.beds (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code     text NOT NULL UNIQUE,   -- ID legible: "C-01", "C-02"
  area_id  uuid NOT NULL REFERENCES public.productive_areas(id),
  active   boolean NOT NULL DEFAULT true
);

-- Cultivos
CREATE TABLE public.crops (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  harvest_unit   text NOT NULL,             -- "kg", "unidades", "manojos"
  internal_price numeric(10,2) NOT NULL,   -- precio para factura interna
  active         boolean NOT NULL DEFAULT true
);

-- Materias primas de Biofábrica
CREATE TABLE public.bio_raw_materials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  unit       text NOT NULL,
  min_stock  numeric(12,3) NOT NULL DEFAULT 0,
  type       text NOT NULL CHECK (type IN ('purchased', 'farm_input')),
  active     boolean NOT NULL DEFAULT true
);

-- Productos terminados de Biofábrica
CREATE TABLE public.bio_finished_products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  unit           text NOT NULL,
  internal_price numeric(10,2) NOT NULL,
  active         boolean NOT NULL DEFAULT true
);

-- Especies del Vivero
CREATE TABLE public.nursery_species (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  type                  text NOT NULL,           -- "árbol", "arbusto", "palma", etc.
  estimated_growth_days integer,
  active                boolean NOT NULL DEFAULT true
);

-- Categorías de precio del Vivero (especie + tamaño/edad → precio unitario)
CREATE TABLE public.nursery_price_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id   uuid NOT NULL REFERENCES public.nursery_species(id),
  size_label   text NOT NULL,          -- "pequeño", "mediano", "grande", "15cm", etc.
  unit_price   numeric(10,2) NOT NULL,
  active       boolean NOT NULL DEFAULT true
);

-- Materias primas del Vivero
CREATE TABLE public.nursery_raw_materials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  unit       text NOT NULL,
  min_stock  numeric(12,3) NOT NULL DEFAULT 0,
  type       text NOT NULL CHECK (type IN ('purchased', 'farm_input', 'field')),
  active     boolean NOT NULL DEFAULT true
);

-- Tipos de sustrato del Vivero
-- El code es permanente (no cambia aunque se edite el nombre)
CREATE TABLE public.substrate_types (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code    text NOT NULL UNIQUE,   -- "ST-01", "ST-02" — nunca cambia
  name    text NOT NULL,
  active  boolean NOT NULL DEFAULT true
);

-- Fórmula de cada tipo de sustrato (qué materias primas lo componen)
CREATE TABLE public.substrate_type_components (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substrate_type_id   uuid NOT NULL REFERENCES public.substrate_types(id) ON DELETE CASCADE,
  raw_material_id     uuid NOT NULL REFERENCES public.nursery_raw_materials(id),
  proportion          numeric(5,4),  -- 0.3333 = 33.33%; informativo, no obligatorio
  notes               text
);

-- Tipos de contenedores del Vivero (bolsas, macetas)
CREATE TABLE public.container_types (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,
  size    text NOT NULL,   -- "1L", "3L", "5L", "25cm"
  unit    text NOT NULL DEFAULT 'unidad',
  active  boolean NOT NULL DEFAULT true
);
```

---

### 3.3 Producción de Alimentos

```sql
-- ── Secuencias para IDs legibles ──────────────────────────────────────────────
CREATE SEQUENCE public.seq_planting_lot  START 1;

-- ── Plan de siembra ───────────────────────────────────────────────────────────
CREATE TABLE public.planting_plans (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id                  uuid NOT NULL REFERENCES public.beds(id),
  crop_id                 uuid NOT NULL REFERENCES public.crops(id),
  planned_date            date,
  estimated_harvest_date  date,
  notes                   text,
  created_by              uuid NOT NULL REFERENCES public.profiles(id),
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── Pedido de material de propagación ────────────────────────────────────────
CREATE TABLE public.propagation_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  week_ref      text NOT NULL,   -- "2026-W23"
  performed_by  uuid NOT NULL REFERENCES public.profiles(id),
  created_by    uuid NOT NULL REFERENCES public.profiles(id),
  observations  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.propagation_order_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public.propagation_orders(id) ON DELETE CASCADE,
  material_type  text NOT NULL CHECK (material_type IN ('seed', 'seedling', 'cutting')),
  crop_id        uuid NOT NULL REFERENCES public.crops(id),
  quantity       numeric(10,3) NOT NULL,
  unit           text NOT NULL
);

-- ── Preparación de camas ──────────────────────────────────────────────────────
CREATE TABLE public.bed_preparations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  bed_id        uuid NOT NULL REFERENCES public.beds(id),
  performed_by  uuid NOT NULL REFERENCES public.profiles(id),
  created_by    uuid NOT NULL REFERENCES public.profiles(id),
  observations  text,
  photo_urls    text[],
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Los insumos de Biofábrica usados en preparación de cama
-- TRIGGER en esta tabla dispara salida de inventario en Biofábrica (ver sección 3.7)
CREATE TABLE public.bed_preparation_inputs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id  uuid NOT NULL REFERENCES public.bed_preparations(id) ON DELETE CASCADE,
  bio_product_id  uuid NOT NULL REFERENCES public.bio_finished_products(id),
  quantity        numeric(10,3) NOT NULL
);

-- ── Siembras ──────────────────────────────────────────────────────────────────
-- lot_id es generado automáticamente por trigger (PROD-YYYY-NNNN)
CREATE TABLE public.plantings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id           text UNIQUE NOT NULL,   -- auto-generado: "PROD-2026-0001"
  date             date NOT NULL,
  bed_id           uuid NOT NULL REFERENCES public.beds(id),
  crop_id          uuid NOT NULL REFERENCES public.crops(id),
  material_type    text CHECK (material_type IN ('semilla','estaca','almácigo')),
  quantity_density numeric(10,2),           -- cantidad numérica; la unidad se infiere de material_type en el frontend
  performed_by     uuid NOT NULL REFERENCES public.profiles(id),
  created_by       uuid NOT NULL REFERENCES public.profiles(id),
  observations     text,
  photo_urls       text[],
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Aplicación de insumos a área ─────────────────────────────────────────────
-- total_liquid_quantity = volumen total de líquido aplicado en campo en ESTA aplicación
-- (activo + dilución de todos los insumos líquidos mezclados en la misma bomba), ej:
-- 3 bombas de 18L con 1L de Emulsión c/u → total_liquid_quantity=54. Vive acá (a nivel de
-- la aplicación) y no en input_application_items porque es un solo total por evento, no
-- por insumo — si dos bioles líquidos se aplican juntos, comparten el mismo total.
CREATE TABLE public.input_applications (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                   date NOT NULL,
  area_id                uuid NOT NULL REFERENCES public.productive_areas(id),
  method                 text,   -- "foliar", "al suelo", "fertiriego"
  total_liquid_quantity  numeric(10,3),
  performed_by           uuid NOT NULL REFERENCES public.profiles(id),
  created_by             uuid NOT NULL REFERENCES public.profiles(id),
  observations           text,
  photo_urls             text[],
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- TRIGGER: dispara salida de inventario en Biofábrica (ver sección 3.7)
-- quantity = ingrediente activo del producto biológico (lo que se descuenta del inventario).
CREATE TABLE public.input_application_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id         uuid NOT NULL REFERENCES public.input_applications(id) ON DELETE CASCADE,
  bio_product_id         uuid NOT NULL REFERENCES public.bio_finished_products(id),
  quantity               numeric(10,3) NOT NULL
);

-- ── Mantenimiento de área ─────────────────────────────────────────────────────
CREATE TABLE public.area_maintenance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                date NOT NULL,
  area_id             uuid NOT NULL REFERENCES public.productive_areas(id),
  maintenance_types   text[] NOT NULL,   -- ['weeding','mulch','pruning','clearing']
  performed_by        uuid NOT NULL REFERENCES public.profiles(id),
  created_by          uuid NOT NULL REFERENCES public.profiles(id),
  duration_minutes    integer,
  observations        text,
  photo_urls          text[],
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Disponibilidad semanal de cosecha ─────────────────────────────────────────
-- UNIQUE en week_ref garantiza 1 solo reporte activo por semana (requerimiento PROD-023)
CREATE TABLE public.weekly_availability (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_date  date NOT NULL,
  week_ref     text NOT NULL UNIQUE,   -- "2026-W23"
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  published_by uuid REFERENCES public.profiles(id),
  created_by   uuid NOT NULL REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.weekly_availability_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  availability_id     uuid NOT NULL REFERENCES public.weekly_availability(id) ON DELETE CASCADE,
  crop_id             uuid NOT NULL REFERENCES public.crops(id),
  area_id             uuid NOT NULL REFERENCES public.productive_areas(id),
  estimated_quantity  numeric(10,3) NOT NULL,
  unit                text NOT NULL,
  notes               text
);

-- ── Pedido de Cocina ──────────────────────────────────────────────────────────
-- Sin UNIQUE en availability_id: Cocina puede crear múltiples pedidos por semana
-- (ej. pedido base + pedido urgente). Producción ve todos los pedidos de la semana. (D-003)
CREATE TABLE public.kitchen_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  availability_id  uuid NOT NULL REFERENCES public.weekly_availability(id),
  week_ref         text NOT NULL,
  label            text,   -- opcional: "Pedido base", "Pedido urgente miércoles", etc.
  created_by       uuid NOT NULL REFERENCES public.profiles(id),
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kitchen_order_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid NOT NULL REFERENCES public.kitchen_orders(id) ON DELETE CASCADE,
  availability_item_id  uuid NOT NULL REFERENCES public.weekly_availability_items(id),
  requested_quantity    numeric(10,3) NOT NULL,
  confirmed_quantity    numeric(10,3),
  adjustment_note       text
);

-- ── Cosechas ──────────────────────────────────────────────────────────────────
-- D-006 (revisado): trazabilidad por área + cama, no por canasta — el manejo de
-- canastas es operativo en campo y no se registra en el app. Una fila por
-- combinación de cultivo + área + cama.
CREATE TABLE public.harvests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date             date NOT NULL,
  crop_id          uuid NOT NULL REFERENCES public.crops(id),
  area_id          uuid NOT NULL REFERENCES public.productive_areas(id),
  bed_id           uuid NOT NULL REFERENCES public.beds(id),
  planting_id      uuid REFERENCES public.plantings(id),   -- opcional, trazabilidad a siembra
  real_quantity    numeric(10,3) NOT NULL,
  unit             text NOT NULL,
  performed_by     uuid NOT NULL REFERENCES public.profiles(id),
  created_by       uuid NOT NULL REFERENCES public.profiles(id),
  observations     text,
  photo_urls       text[],
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Facturas internas de cosecha ──────────────────────────────────────────────
-- Solo lectura. Creadas automáticamente por trigger al insertar en harvests.
CREATE TABLE public.internal_invoices_food (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id    uuid NOT NULL UNIQUE REFERENCES public.harvests(id),
  crop_id       uuid NOT NULL REFERENCES public.crops(id),
  crop_name     text NOT NULL,           -- snapshot del nombre al momento de la cosecha
  quantity      numeric(10,3) NOT NULL,
  unit          text NOT NULL,
  unit_price    numeric(10,2) NOT NULL,  -- snapshot del precio al momento de la cosecha
  total_value   numeric(12,2) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

---

### 3.4 Biofábrica

```sql
-- ── Secuencias para IDs legibles ──────────────────────────────────────────────
CREATE SEQUENCE public.seq_bio_batch  START 1;

-- ── Entradas de materias primas ───────────────────────────────────────────────
CREATE TABLE public.bio_raw_material_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date             date NOT NULL,
  raw_material_id  uuid NOT NULL REFERENCES public.bio_raw_materials(id),
  quantity         numeric(12,3) NOT NULL,
  unit             text NOT NULL,
  type             text NOT NULL CHECK (type IN ('purchased', 'farm_input', 'organic_waste')),
  supplier         text,
  cost             numeric(10,2),
  performed_by     uuid NOT NULL REFERENCES public.profiles(id),
  created_by       uuid NOT NULL REFERENCES public.profiles(id),
  observations     text,
  receipt_photo_url text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Lotes de producción ───────────────────────────────────────────────────────
-- batch_code auto-generado por trigger: "BIO-2026-0001"
-- Las materias primas se descuentan del inventario SOLO al cerrar el lote (no al crear)
CREATE TABLE public.bio_production_batches (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code            text UNIQUE NOT NULL,   -- auto: "BIO-2026-0001"
  date_start            date NOT NULL,
  finished_product_id   uuid NOT NULL REFERENCES public.bio_finished_products(id),
  estimated_finish_date date,
  responsible_id        uuid NOT NULL REFERENCES public.profiles(id),
  created_by            uuid NOT NULL REFERENCES public.profiles(id),
  status                text NOT NULL DEFAULT 'in_progress'
                          CHECK (status IN ('in_progress', 'closed')),
  -- Campos de cierre (nulos mientras esté in_progress)
  date_finish           date,
  quantity_produced     numeric(12,3),
  closure_observations  text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Materias primas que consume el lote (se descuentan al cerrar)
CREATE TABLE public.bio_production_batch_inputs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         uuid NOT NULL REFERENCES public.bio_production_batches(id) ON DELETE CASCADE,
  raw_material_id  uuid NOT NULL REFERENCES public.bio_raw_materials(id),
  quantity         numeric(12,3) NOT NULL
);

-- ── Salidas de producto terminado ─────────────────────────────────────────────
-- Incluye tanto salidas manuales como las generadas automáticamente por Producción y Vivero.
-- TRIGGER: si output_type = 'external_sale' → crea bio_external_invoices
CREATE TABLE public.bio_finished_product_outputs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                date NOT NULL,
  finished_product_id uuid NOT NULL REFERENCES public.bio_finished_products(id),
  quantity            numeric(12,3) NOT NULL,
  output_type         text NOT NULL CHECK (output_type IN ('internal', 'external_sale')),
  department          text,         -- si internal: 'food_production', 'nursery', etc.
  client_name         text,         -- si external_sale
  unit_price          numeric(10,2),
  total_value         numeric(12,2),
  performed_by        uuid REFERENCES public.profiles(id),
  created_by          uuid REFERENCES public.profiles(id),
  -- Distingue salidas automáticas de manuales
  source              text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto')),
  source_ref_type     text,         -- 'bed_preparation', 'input_application', 'nursery_maintenance'
  source_ref_id       uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Facturas externas de Biofábrica ───────────────────────────────────────────
-- Solo lectura. Creadas automáticamente por trigger en bio_finished_product_outputs.
CREATE TABLE public.bio_external_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id       uuid NOT NULL UNIQUE REFERENCES public.bio_finished_product_outputs(id),
  product_id      uuid NOT NULL REFERENCES public.bio_finished_products(id),
  product_name    text NOT NULL,    -- snapshot
  quantity        numeric(12,3) NOT NULL,
  unit            text NOT NULL,    -- snapshot
  unit_price      numeric(10,2) NOT NULL,
  total_value     numeric(12,2) NOT NULL,
  client_name     text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

### 3.5 Vivero

```sql
-- ── Secuencias para IDs legibles ──────────────────────────────────────────────
CREATE SEQUENCE public.seq_nursery_group    START 1;
CREATE SEQUENCE public.seq_substrate_batch  START 1;
CREATE SEQUENCE public.seq_plant_lot        START 1;

-- ── Entradas de materias primas del Vivero ────────────────────────────────────
-- group_id auto-generado por trigger: "GRP-2026-0001"
CREATE TABLE public.nursery_raw_material_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         text UNIQUE NOT NULL,   -- auto: "GRP-2026-0001"
  date             date NOT NULL,
  raw_material_id  uuid NOT NULL REFERENCES public.nursery_raw_materials(id),
  quantity         numeric(12,3) NOT NULL,
  unit             text NOT NULL,
  type             text NOT NULL CHECK (type IN ('purchased', 'farm_input', 'field')),
  cost             numeric(10,2),
  performed_by     uuid NOT NULL REFERENCES public.profiles(id),
  created_by       uuid NOT NULL REFERENCES public.profiles(id),
  observations     text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Batches de sustrato ───────────────────────────────────────────────────────
-- batch_id auto-generado: "SUB-2026-0001"
CREATE TABLE public.substrate_batches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id            text UNIQUE NOT NULL,   -- auto: "SUB-2026-0001"
  substrate_type_id   uuid NOT NULL REFERENCES public.substrate_types(id),
  quantity_produced   numeric(12,3) NOT NULL,
  unit                text NOT NULL DEFAULT 'L',
  date                date NOT NULL,
  performed_by        uuid NOT NULL REFERENCES public.profiles(id),
  created_by          uuid NOT NULL REFERENCES public.profiles(id),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Componentes de un batch de sustrato (qué materias primas y de qué grupo se consumieron)
-- TRIGGER: al insertar en substrate_batches → descuenta nursery_raw_material_entries
CREATE TABLE public.substrate_batch_components (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id                uuid NOT NULL REFERENCES public.substrate_batches(id) ON DELETE CASCADE,
  raw_material_entry_id   uuid NOT NULL REFERENCES public.nursery_raw_material_entries(id),
  quantity                numeric(12,3) NOT NULL,
  unit                    text NOT NULL
);

-- ── Llenado de contenedores ───────────────────────────────────────────────────
-- TRIGGER: al insertar → descuenta sustrato, suma contenedores disponibles
CREATE TABLE public.container_fills (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                date NOT NULL,
  container_type_id   uuid NOT NULL REFERENCES public.container_types(id),
  substrate_batch_id  uuid NOT NULL REFERENCES public.substrate_batches(id),
  substrate_quantity  numeric(12,3) NOT NULL,
  substrate_unit      text NOT NULL,
  containers_filled   integer NOT NULL,
  performed_by        uuid NOT NULL REFERENCES public.profiles(id),
  created_by          uuid NOT NULL REFERENCES public.profiles(id),
  observations        text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Lotes de plantas ──────────────────────────────────────────────────────────
-- lot_id auto-generado: "VIV-2026-0001"
-- status inicial: 'germination' si origin IN ('own_seed','cuttings'), 'active' si no
CREATE TABLE public.plant_lots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id                  text UNIQUE NOT NULL,   -- auto: "VIV-2026-0001"
  species_id              uuid NOT NULL REFERENCES public.nursery_species(id),
  origin                  text NOT NULL CHECK (origin IN (
    'own_seed', 'cuttings', 'wholesale', 'repoting'
  )),
  repoting_from_lot_id    uuid REFERENCES public.plant_lots(id),
  date_start              date NOT NULL,
  initial_quantity        integer NOT NULL,
  container_type_id       uuid REFERENCES public.container_types(id),
  containers_assigned     integer,
  responsible_id          uuid NOT NULL REFERENCES public.profiles(id),
  created_by              uuid NOT NULL REFERENCES public.profiles(id),
  status                  text NOT NULL DEFAULT 'germination' CHECK (status IN (
    'germination', 'active', 'graduated', 'closed'
  )),
  current_live_count      integer,   -- actualizado por triggers
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── Seguimiento de germinación ────────────────────────────────────────────────
CREATE TABLE public.germination_tracking (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id                    uuid NOT NULL REFERENCES public.plant_lots(id),
  date                      date NOT NULL,
  observations              text,
  estimated_germination_rate numeric(5,2),   -- porcentaje: 0–100
  photo_url                 text,
  created_by                uuid NOT NULL REFERENCES public.profiles(id),
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- ── Conteo de establecimiento (cierra fase de germinación) ───────────────────
-- UNIQUE en lot_id: solo puede haber un conteo de establecimiento por lote
-- TRIGGER: → actualiza plant_lots.status = 'active', current_live_count = live_plants
--          → devuelve contenedores y sustrato de los fallidos al inventario
CREATE TABLE public.establishment_counts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id              uuid NOT NULL UNIQUE REFERENCES public.plant_lots(id),
  date                date NOT NULL,
  live_plants         integer NOT NULL,
  failed_plants       integer NOT NULL,
  containers_returned integer,
  substrate_returned  numeric(12,3),
  substrate_unit      text,
  performed_by        uuid NOT NULL REFERENCES public.profiles(id),
  created_by          uuid NOT NULL REFERENCES public.profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Mantenimiento de lote ─────────────────────────────────────────────────────
-- TRIGGER: si maintenance_type = 'bioinsumos' → crea salida en bio_finished_product_outputs
CREATE TABLE public.lot_maintenance (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id            uuid NOT NULL REFERENCES public.plant_lots(id),
  date              date NOT NULL,
  maintenance_type  text NOT NULL CHECK (maintenance_type IN (
    'irrigation', 'fertilization', 'repoting', 'pruning', 'bioinputs'
  )),
  bio_product_id    uuid REFERENCES public.bio_finished_products(id),   -- si bioinputs
  quantity          numeric(10,3),                                        -- cantidad aplicada
  quantity_unit     text,
  performed_by      uuid NOT NULL REFERENCES public.profiles(id),
  created_by        uuid NOT NULL REFERENCES public.profiles(id),
  observations      text,
  photo_url         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Conteos de plantas vivas ──────────────────────────────────────────────────
-- TRIGGER: → calcula mortality_calculated, actualiza plant_lots.current_live_count
CREATE TABLE public.plant_counts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id               uuid NOT NULL REFERENCES public.plant_lots(id),
  date                 date NOT NULL,
  live_count           integer NOT NULL,
  mortality_calculated integer,   -- auto: live_count_anterior - live_count_actual
  performed_by         uuid NOT NULL REFERENCES public.profiles(id),
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ── Graduaciones ──────────────────────────────────────────────────────────────
CREATE TABLE public.lot_graduations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id              uuid NOT NULL REFERENCES public.plant_lots(id),
  date                date NOT NULL,
  quantity            integer NOT NULL,
  price_category_id   uuid NOT NULL REFERENCES public.nursery_price_categories(id),
  notes               text,
  created_by          uuid NOT NULL REFERENCES public.profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Salidas de plantas ────────────────────────────────────────────────────────
-- TRIGGER: si internal_use → crea internal_invoices_nursery
--          actualiza plant_lots.current_live_count
CREATE TABLE public.plant_lot_outputs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date           date NOT NULL,
  lot_id         uuid NOT NULL REFERENCES public.plant_lots(id),
  graduation_id  uuid REFERENCES public.lot_graduations(id),
  quantity       integer NOT NULL,
  output_type    text NOT NULL CHECK (output_type IN ('external_sale', 'internal_use')),
  destination    text,
  unit_price     numeric(10,2),
  total_value    numeric(12,2),
  performed_by   uuid NOT NULL REFERENCES public.profiles(id),
  created_by     uuid NOT NULL REFERENCES public.profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Facturas internas del Vivero ──────────────────────────────────────────────
-- Solo lectura. Creadas automáticamente por trigger en plant_lot_outputs.
CREATE TABLE public.internal_invoices_nursery (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id     uuid NOT NULL UNIQUE REFERENCES public.plant_lot_outputs(id),
  lot_id        uuid NOT NULL REFERENCES public.plant_lots(id),
  lot_id_code   text NOT NULL,       -- snapshot: "VIV-2026-0001"
  species_name  text NOT NULL,       -- snapshot
  quantity      integer NOT NULL,
  unit_price    numeric(10,2) NOT NULL,
  total_value   numeric(12,2) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Cotizaciones ──────────────────────────────────────────────────────────────
CREATE TABLE public.quotations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name   text NOT NULL,
  client_email  text,
  client_phone  text,
  validity_date date NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected'
  )),
  notes         text,
  created_by    uuid NOT NULL REFERENCES public.profiles(id),
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quotation_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id        uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  species_id          uuid NOT NULL REFERENCES public.nursery_species(id),
  price_category_id   uuid NOT NULL REFERENCES public.nursery_price_categories(id),
  lot_id              uuid NOT NULL REFERENCES public.plant_lots(id),
  quantity            integer NOT NULL,
  base_unit_price     numeric(10,2) NOT NULL,   -- del catálogo al momento de crear la cotización
  adjusted_unit_price numeric(10,2) NOT NULL,   -- con descuento/premium del cliente
  subtotal            numeric(12,2) NOT NULL     -- adjusted_unit_price * quantity
);
```

---

### 3.6 Vistas calculadas de inventario

Las vistas calculan stock en tiempo real. No se almacenan valores de stock en tablas — siempre se derivan de los movimientos.

```sql
-- Stock de materias primas de Biofábrica
CREATE VIEW public.v_bio_raw_material_stock AS
SELECT
  m.id,
  m.name,
  m.unit,
  m.min_stock,
  m.type,
  COALESCE(e.total_in, 0)                                           AS total_in,
  COALESCE(c.total_consumed, 0)                                     AS total_consumed,
  COALESCE(e.total_in, 0) - COALESCE(c.total_consumed, 0)          AS current_stock,
  (COALESCE(e.total_in, 0) - COALESCE(c.total_consumed, 0)) < m.min_stock AS below_minimum
FROM public.bio_raw_materials m
LEFT JOIN (
  SELECT raw_material_id, SUM(quantity) AS total_in
  FROM public.bio_raw_material_entries
  GROUP BY raw_material_id
) e ON e.raw_material_id = m.id
LEFT JOIN (
  SELECT i.raw_material_id, SUM(i.quantity) AS total_consumed
  FROM public.bio_production_batch_inputs i
  JOIN public.bio_production_batches b ON b.id = i.batch_id AND b.status = 'closed'
  GROUP BY i.raw_material_id
) c ON c.raw_material_id = m.id;

-- Stock de productos terminados de Biofábrica
CREATE VIEW public.v_bio_finished_product_stock AS
SELECT
  p.id,
  p.name,
  p.unit,
  COALESCE(prod.total_produced, 0)                                         AS total_produced,
  COALESCE(SUM(o.quantity), 0)                                             AS total_out,
  COALESCE(prod.total_produced, 0) - COALESCE(SUM(o.quantity), 0)         AS current_stock
FROM public.bio_finished_products p
LEFT JOIN (
  SELECT finished_product_id, SUM(quantity_produced) AS total_produced
  FROM public.bio_production_batches
  WHERE status = 'closed' AND quantity_produced IS NOT NULL
  GROUP BY finished_product_id
) prod ON prod.finished_product_id = p.id
LEFT JOIN public.bio_finished_product_outputs o ON o.finished_product_id = p.id
GROUP BY p.id, p.name, p.unit, prod.total_produced;

-- Stock de materias primas del Vivero
CREATE VIEW public.v_nursery_raw_material_stock AS
SELECT
  m.id,
  m.name,
  m.unit,
  m.min_stock,
  COALESCE(e.total_in, 0)                                           AS total_in,
  COALESCE(c.total_consumed, 0)                                     AS total_consumed,
  COALESCE(e.total_in, 0) - COALESCE(c.total_consumed, 0)          AS current_stock,
  (COALESCE(e.total_in, 0) - COALESCE(c.total_consumed, 0)) < m.min_stock AS below_minimum
FROM public.nursery_raw_materials m
LEFT JOIN (
  SELECT raw_material_id, SUM(quantity) AS total_in
  FROM public.nursery_raw_material_entries
  GROUP BY raw_material_id
) e ON e.raw_material_id = m.id
LEFT JOIN (
  SELECT nrme.raw_material_id, SUM(sbc.quantity) AS total_consumed
  FROM public.substrate_batch_components sbc
  JOIN public.nursery_raw_material_entries nrme ON nrme.id = sbc.raw_material_entry_id
  GROUP BY nrme.raw_material_id
) c ON c.raw_material_id = m.id;

-- Stock de sustratos del Vivero (por tipo)
CREATE VIEW public.v_nursery_substrate_stock AS
SELECT
  st.id,
  st.code,
  st.name,
  COALESCE(p.total_produced, 0)                                     AS total_produced,
  COALESCE(u.total_used, 0)                                         AS total_used,
  COALESCE(p.total_produced, 0) - COALESCE(u.total_used, 0)        AS available_stock
FROM public.substrate_types st
LEFT JOIN (
  SELECT substrate_type_id, SUM(quantity_produced) AS total_produced
  FROM public.substrate_batches
  GROUP BY substrate_type_id
) p ON p.substrate_type_id = st.id
LEFT JOIN (
  SELECT sb.substrate_type_id, SUM(cf.substrate_quantity) AS total_used
  FROM public.container_fills cf
  JOIN public.substrate_batches sb ON sb.id = cf.substrate_batch_id
  GROUP BY sb.substrate_type_id
) u ON u.substrate_type_id = st.id;

-- Stock de contenedores del Vivero (por tipo)
CREATE VIEW public.v_nursery_container_stock AS
SELECT
  ct.id,
  ct.name,
  ct.size,
  ct.unit,
  COALESCE(f.total_filled, 0)                                                        AS total_filled,
  COALESCE(u.total_used, 0)                                                          AS total_used_in_lots,
  COALESCE(r.total_returned, 0)                                                      AS total_returned,
  COALESCE(f.total_filled, 0) - COALESCE(u.total_used, 0) + COALESCE(r.total_returned, 0)
    AS available_stock
FROM public.container_types ct
LEFT JOIN (
  SELECT container_type_id, SUM(containers_filled) AS total_filled
  FROM public.container_fills
  GROUP BY container_type_id
) f ON f.container_type_id = ct.id
LEFT JOIN (
  SELECT container_type_id, SUM(containers_assigned) AS total_used
  FROM public.plant_lots
  WHERE containers_assigned IS NOT NULL
  GROUP BY container_type_id
) u ON u.container_type_id = ct.id
LEFT JOIN (
  SELECT pl.container_type_id, SUM(ec.containers_returned) AS total_returned
  FROM public.establishment_counts ec
  JOIN public.plant_lots pl ON pl.id = ec.lot_id
  WHERE ec.containers_returned IS NOT NULL
  GROUP BY pl.container_type_id
) r ON r.container_type_id = ct.id;
```

---

### 3.7 Triggers y lógica de negocio

#### 3.7.1 Generación de IDs legibles

```sql
-- Plantings: PROD-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.fn_generate_planting_lot_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.lot_id := 'PROD-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.seq_planting_lot')::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_planting_lot_id
  BEFORE INSERT ON public.plantings
  FOR EACH ROW EXECUTE FUNCTION public.fn_generate_planting_lot_id();

-- Bio batches: BIO-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.fn_generate_bio_batch_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.batch_code := 'BIO-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.seq_bio_batch')::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bio_batch_code
  BEFORE INSERT ON public.bio_production_batches
  FOR EACH ROW EXECUTE FUNCTION public.fn_generate_bio_batch_code();

-- Nursery raw material entries: GRP-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.fn_generate_nursery_group_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.group_id := 'GRP-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.seq_nursery_group')::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_nursery_group_id
  BEFORE INSERT ON public.nursery_raw_material_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_generate_nursery_group_id();

-- Substrate batches: SUB-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.fn_generate_substrate_batch_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.batch_id := 'SUB-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.seq_substrate_batch')::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_substrate_batch_id
  BEFORE INSERT ON public.substrate_batches
  FOR EACH ROW EXECUTE FUNCTION public.fn_generate_substrate_batch_id();

-- Plant lots: VIV-YYYY-NNNN
-- También setea status inicial según origin
CREATE OR REPLACE FUNCTION public.fn_init_plant_lot()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.lot_id := 'VIV-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.seq_plant_lot')::text, 4, '0');
  -- Lotes de semillas o esquejes comienzan en germinación; los demás van directo a activo
  IF NEW.origin IN ('own_seed', 'cuttings') THEN
    NEW.status := 'germination';
  ELSE
    NEW.status := 'active';
    NEW.current_live_count := NEW.initial_quantity;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_init_plant_lot
  BEFORE INSERT ON public.plant_lots
  FOR EACH ROW EXECUTE FUNCTION public.fn_init_plant_lot();
```

#### 3.7.2 Factura interna al cosechar

```sql
CREATE OR REPLACE FUNCTION public.fn_create_food_invoice()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_crop_name    text;
  v_unit_price   numeric(10,2);
BEGIN
  SELECT name, internal_price INTO v_crop_name, v_unit_price
  FROM public.crops WHERE id = NEW.crop_id;

  INSERT INTO public.internal_invoices_food
    (harvest_id, crop_id, crop_name, quantity, unit, unit_price, total_value)
  VALUES
    (NEW.id, NEW.crop_id, v_crop_name, NEW.real_quantity, NEW.unit,
     v_unit_price, NEW.real_quantity * v_unit_price);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_harvest_invoice
  AFTER INSERT ON public.harvests
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_food_invoice();
```

#### 3.7.3 Salida automática de Biofábrica (integración cross-departamento)

Esta función se reutiliza desde dos triggers distintos:

```sql
CREATE OR REPLACE FUNCTION public.fn_create_bio_output_from_item()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ref_type  text;
  v_ref_id    uuid;
  v_dept      text;
BEGIN
  IF TG_TABLE_NAME = 'bed_preparation_inputs' THEN
    v_ref_type := 'bed_preparation';
    v_ref_id   := NEW.preparation_id;
    v_dept     := 'food_production';
  ELSIF TG_TABLE_NAME = 'input_application_items' THEN
    v_ref_type := 'input_application';
    v_ref_id   := NEW.application_id;
    v_dept     := 'food_production';
  END IF;

  INSERT INTO public.bio_finished_product_outputs
    (date, finished_product_id, quantity, output_type, department,
     source, source_ref_type, source_ref_id)
  SELECT
    CURRENT_DATE,
    NEW.bio_product_id,
    NEW.quantity,
    'internal',
    v_dept,
    'auto',
    v_ref_type,
    v_ref_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bio_output_bed_prep
  AFTER INSERT ON public.bed_preparation_inputs
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_bio_output_from_item();

CREATE TRIGGER trg_bio_output_input_app
  AFTER INSERT ON public.input_application_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_bio_output_from_item();

-- Mantenimiento de lote (Vivero → Biofábrica)
CREATE OR REPLACE FUNCTION public.fn_create_bio_output_from_lot_maintenance()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.maintenance_type = 'bioinputs' AND NEW.bio_product_id IS NOT NULL THEN
    INSERT INTO public.bio_finished_product_outputs
      (date, finished_product_id, quantity, output_type, department,
       source, source_ref_type, source_ref_id)
    VALUES
      (NEW.date, NEW.bio_product_id, NEW.quantity,
       'internal', 'nursery', 'auto', 'nursery_maintenance', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bio_output_lot_maintenance
  AFTER INSERT ON public.lot_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_bio_output_from_lot_maintenance();
```

#### 3.7.4 Descuento de materias primas al cerrar lote de Biofábrica

```sql
-- No hay trigger en bio_production_batch_inputs — el descuento ocurre al cerrar el lote
-- Se implementa como función que el Worker llama al hacer PATCH /batches/:id/close
-- (ver sección 5.2). Esto permite validar stock antes de cerrar y mostrar warning.

-- Alternativa con trigger (también válida):
CREATE OR REPLACE FUNCTION public.fn_batch_closure_deduct()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Solo actúa cuando el lote pasa a 'closed'
  IF OLD.status = 'in_progress' AND NEW.status = 'closed' THEN
    -- El descuento ya está modelado en la vista v_bio_raw_material_stock
    -- al filtrar batch_inputs de lotes cerrados. No se necesita registro adicional.
    -- El worker puede chequear stock antes de permitir el cierre.
    NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_batch_closure
  AFTER UPDATE ON public.bio_production_batches
  FOR EACH ROW EXECUTE FUNCTION public.fn_batch_closure_deduct();
```

> **Nota de diseño:** El stock de materias primas de Biofábrica se calcula como `SUM(entradas) - SUM(consumos de lotes cerrados)`. Al cerrar el lote, la vista automáticamente refleja el descuento sin necesitar una tabla de movimientos separada. El Worker valida stock antes de cerrar y puede mostrar un warning si hay insuficiencia.

#### 3.7.5 Factura externa de Biofábrica al registrar venta

```sql
CREATE OR REPLACE FUNCTION public.fn_create_bio_external_invoice()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_product_name  text;
  v_unit          text;
BEGIN
  IF NEW.output_type = 'external_sale' THEN
    SELECT name, unit INTO v_product_name, v_unit
    FROM public.bio_finished_products WHERE id = NEW.finished_product_id;

    INSERT INTO public.bio_external_invoices
      (output_id, product_id, product_name, quantity, unit, unit_price, total_value, client_name)
    VALUES
      (NEW.id, NEW.finished_product_id, v_product_name, NEW.quantity, v_unit,
       NEW.unit_price, NEW.total_value, NEW.client_name);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bio_external_invoice
  AFTER INSERT ON public.bio_finished_product_outputs
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_bio_external_invoice();
```

#### 3.7.6 Conteo de establecimiento (Vivero)

```sql
CREATE OR REPLACE FUNCTION public.fn_process_establishment_count()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_container_type_id uuid;
BEGIN
  -- Actualizar lote: pasar a 'active' con conteo de plantas vivas
  UPDATE public.plant_lots
  SET status = 'active', current_live_count = NEW.live_plants
  WHERE id = NEW.lot_id;

  -- No hay ajuste de inventario de sustratos/contenedores vía trigger aquí:
  -- La devolución de materiales de contenedores fallidos es informativa en este MVP.
  -- Se registra en el campo containers_returned / substrate_returned del conteo.
  -- El Worker puede procesarlo en Fase 2 si se quiere automatizar.

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_establishment_count
  AFTER INSERT ON public.establishment_counts
  FOR EACH ROW EXECUTE FUNCTION public.fn_process_establishment_count();
```

#### 3.7.7 Conteo de plantas vivas (calcula mortalidad)

```sql
CREATE OR REPLACE FUNCTION public.fn_process_plant_count()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_prev_count integer;
BEGIN
  -- Buscar el conteo inmediatamente anterior al actual
  SELECT live_count INTO v_prev_count
  FROM public.plant_counts
  WHERE lot_id = NEW.lot_id AND date < NEW.date
  ORDER BY date DESC, created_at DESC
  LIMIT 1;

  -- Si no hay conteo previo, usar el current_live_count del lote
  IF v_prev_count IS NULL THEN
    SELECT current_live_count INTO v_prev_count
    FROM public.plant_lots WHERE id = NEW.lot_id;
  END IF;

  NEW.mortality_calculated := GREATEST(0, COALESCE(v_prev_count, 0) - NEW.live_count);

  -- Actualizar el conteo actual del lote
  UPDATE public.plant_lots
  SET current_live_count = NEW.live_count
  WHERE id = NEW.lot_id;

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_plant_count
  BEFORE INSERT ON public.plant_counts
  FOR EACH ROW EXECUTE FUNCTION public.fn_process_plant_count();
```

#### 3.7.8 Factura interna del Vivero al salida de uso interno

```sql
CREATE OR REPLACE FUNCTION public.fn_create_nursery_internal_invoice()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_lot_id_code  text;
  v_species_name text;
  v_unit_price   numeric(10,2);
BEGIN
  IF NEW.output_type = 'internal_use' THEN
    SELECT pl.lot_id, ns.name INTO v_lot_id_code, v_species_name
    FROM public.plant_lots pl
    JOIN public.nursery_species ns ON ns.id = pl.species_id
    WHERE pl.id = NEW.lot_id;

    -- Precio del catálogo al momento de la salida (via graduation)
    SELECT npc.unit_price INTO v_unit_price
    FROM public.lot_graduations lg
    JOIN public.nursery_price_categories npc ON npc.id = lg.price_category_id
    WHERE lg.id = NEW.graduation_id;

    -- Fallback si no hay graduation_id
    IF v_unit_price IS NULL THEN
      v_unit_price := COALESCE(NEW.unit_price, 0);
    END IF;

    INSERT INTO public.internal_invoices_nursery
      (output_id, lot_id, lot_id_code, species_name, quantity, unit_price, total_value)
    VALUES
      (NEW.id, NEW.lot_id, v_lot_id_code, v_species_name, NEW.quantity,
       v_unit_price, NEW.quantity * v_unit_price);
  END IF;

  -- Actualizar stock del lote
  UPDATE public.plant_lots
  SET current_live_count = GREATEST(0, current_live_count - NEW.quantity)
  WHERE id = NEW.lot_id;

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_nursery_output
  AFTER INSERT ON public.plant_lot_outputs
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_nursery_internal_invoice();
```

---

## 4. Row Level Security (RLS)

Habilitar RLS en todas las tablas con datos sensibles. El Worker usa el JWT del usuario para las operaciones estándar (Supabase aplica RLS automáticamente). Para operaciones de admin, el Worker usa la service key con `SET LOCAL role = authenticated` + user ID.

```sql
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_departments ENABLE ROW LEVEL SECURITY;
-- ... (idem para todas las tablas)

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Cada usuario ve su propio perfil; admin ve todos
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR
         EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR
         EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Catálogos ─────────────────────────────────────────────────────────────────
-- Todos los usuarios autenticados pueden leer; solo admin puede escribir
CREATE POLICY "catalogs_select" ON public.productive_areas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "catalogs_write"  ON public.productive_areas FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- (Idem para beds, crops, bio_raw_materials, bio_finished_products,
--  nursery_species, nursery_price_categories, nursery_raw_materials,
--  substrate_types, substrate_type_components, container_types)

-- ── Producción de Alimentos ───────────────────────────────────────────────────
-- Usuarios de food_production pueden leer y escribir
-- Usuarios de kitchen pueden leer weekly_availability (published) y escribir kitchen_orders
CREATE POLICY "food_read" ON public.harvests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profile_departments
            WHERE profile_id = auth.uid() AND department IN ('food_production'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "availability_kitchen_read" ON public.weekly_availability FOR SELECT
  USING (
    status = 'published' OR
    EXISTS (SELECT 1 FROM public.profile_departments
            WHERE profile_id = auth.uid() AND department = 'food_production') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Biofábrica ────────────────────────────────────────────────────────────────
-- Usuarios de biofactory pueden leer y escribir
-- Usuarios de food_production y nursery pueden leer bio_finished_products (para formularios)
CREATE POLICY "bio_finished_products_read" ON public.bio_finished_products FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── Vivero ────────────────────────────────────────────────────────────────────
-- Usuarios de nursery pueden leer y escribir
-- Admin puede leer todo (incluye quotations con datos de clientes)

-- ── Facturas ──────────────────────────────────────────────────────────────────
-- Solo admin puede leer facturas
CREATE POLICY "invoices_admin_only" ON public.internal_invoices_food FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

> **Nota práctica:** Las políticas de RLS son un segundo escudo de seguridad. El Worker valida JWT y role antes de llegar a Supabase. Las políticas RLS son el escudo por si alguien intenta conectarse directo al PostgREST sin pasar por el Worker.

---

## 5. Cloudflare Worker API

### 5.1 Estructura del Worker

El Worker es un único `worker.js` desplegado en Cloudflare. Recibe todas las peticiones del frontend en `https://tierramor-api.workers.dev`.

**Variables de entorno del Worker (secrets en Cloudflare):**
- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_SERVICE_KEY` — service role key (nunca llega al cliente)
- `SUPABASE_JWT_SECRET` — para validar JWTs sin llamar a Supabase
- `GOOGLE_DRIVE_SERVICE_ACCOUNT` — credenciales JSON de service account para fotos

**Flujo estándar de cada request:**

```
1. Recibir request
2. Verificar CORS (solo orígenes permitidos)
3. Extraer JWT del header Authorization: Bearer <token>
4. Validar JWT (firma + expiración)
5. Extraer user_id del JWT
6. Routear al handler correspondiente
7. Handler llama a Supabase con service key + header apikey
8. Responder al cliente
```

### 5.2 Rutas de la API

#### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Email + password → access_token + refresh_token |
| POST | `/api/auth/refresh` | refresh_token → nuevo access_token |
| POST | `/api/auth/logout` | Invalida sesión en Supabase |
| POST | `/api/auth/reset-password` | Envía email de recuperación |

**POST /api/auth/login — Request:**
```json
{ "email": "daniel@tierramor.cr", "password": "..." }
```

**POST /api/auth/login — Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "...",
    "profile": {
      "full_name": "Daniela García",
      "role": "field_worker",
      "departments": ["food_production"]
    }
  }
}
```

#### Perfiles y usuarios (solo admin)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Listar usuarios con perfil y departamentos |
| POST | `/api/users` | Crear usuario (Supabase Auth + perfil) |
| PATCH | `/api/users/:id` | Editar nombre, rol, departamentos, estado |

#### Catálogos

Todos siguen el mismo patrón: `GET /api/catalogs/:resource`, `POST /api/catalogs/:resource`, `PATCH /api/catalogs/:resource/:id`.

| `:resource` | Tabla |
|---|---|
| `areas` | `productive_areas` |
| `beds` | `beds` |
| `crops` | `crops` |
| `bio-raw-materials` | `bio_raw_materials` |
| `bio-finished-products` | `bio_finished_products` |
| `nursery-species` | `nursery_species` |
| `nursery-price-categories` | `nursery_price_categories` |
| `nursery-raw-materials` | `nursery_raw_materials` |
| `substrate-types` | `substrate_types` |
| `container-types` | `container_types` |

#### Producción de Alimentos

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/food/planting-plans` | Plan de siembra |
| GET/POST | `/api/food/propagation-orders` | Pedidos de propagación |
| GET/POST | `/api/food/bed-preparations` | Preparación de camas (incluye inputs) |
| GET/POST | `/api/food/plantings` | Siembras (lot_id auto-generado en DB) |
| GET/POST | `/api/food/input-applications` | Aplicación de insumos (incluye items) |
| GET/POST | `/api/food/area-maintenance` | Mantenimiento de áreas |
| GET/POST | `/api/food/availability` | Disponibilidad semanal |
| PATCH | `/api/food/availability/:id/publish` | Publicar disponibilidad |
| GET/POST | `/api/food/kitchen-orders` | Pedidos de cocina (múltiples por semana permitidos) |
| PATCH | `/api/food/kitchen-orders/:id/confirm` | Confirmar pedido individual |
| GET/POST | `/api/food/harvests` | Cosechas (factura se crea automáticamente) |
| GET | `/api/food/invoices` | Listar facturas internas de cosecha |

**POST /api/food/bed-preparations — Request:**
```json
{
  "date": "2026-06-11",
  "bed_id": "uuid-de-la-cama",
  "performed_by": "uuid-del-colaborador",
  "observations": "...",
  "photo_urls": [],
  "inputs": [
    { "bio_product_id": "uuid-producto-bio", "quantity": 5 }
  ]
}
```

El Worker inserta en `bed_preparations` y luego en `bed_preparation_inputs` en la misma transacción. Los triggers PostgreSQL se encargan de las salidas en Biofábrica.

**POST /api/food/availability/:week_ref/check — Verifica si ya existe disponibilidad para esa semana:**
```json
{ "exists": true, "id": "uuid", "status": "draft" }
```

#### Biofábrica

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/bio/raw-material-entries` | Entradas de materias primas |
| GET/POST | `/api/bio/batches` | Lotes de producción |
| PATCH | `/api/bio/batches/:id/close` | Cerrar lote (valida stock antes) |
| GET/POST | `/api/bio/outputs` | Salidas de producto terminado |
| GET | `/api/bio/invoices` | Facturas externas |
| GET | `/api/inventory/bio-raw` | Vista `v_bio_raw_material_stock` |
| GET | `/api/inventory/bio-finished` | Vista `v_bio_finished_product_stock` |

**PATCH /api/bio/batches/:id/close — Request:**
```json
{
  "date_finish": "2026-06-15",
  "quantity_produced": 20,
  "closure_observations": "..."
}
```

**PATCH /api/bio/batches/:id/close — Lógica en el Worker antes de actualizar:**
1. Obtener los `bio_production_batch_inputs` del lote
2. Consultar `v_bio_raw_material_stock` para cada materia prima consumida
3. Si alguna tiene stock insuficiente: devolver `{ "warning": true, "items": [...] }` pero permitir continuar (no bloquear)
4. Actualizar `bio_production_batches` con `status = 'closed'`

#### Vivero

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/nursery/raw-material-entries` | Entradas de MP del vivero |
| GET/POST | `/api/nursery/substrate-batches` | Batches de sustrato (incluye components) |
| GET/POST | `/api/nursery/container-fills` | Llenado de contenedores |
| GET/POST | `/api/nursery/lots` | Lotes de plantas |
| GET | `/api/nursery/lots/:id` | Detalle de lote + historial completo |
| POST | `/api/nursery/lots/:id/germination-tracking` | Seguimiento de germinación |
| POST | `/api/nursery/lots/:id/establishment-count` | Conteo de establecimiento |
| POST | `/api/nursery/lots/:id/maintenance` | Mantenimiento de lote |
| POST | `/api/nursery/lots/:id/plant-counts` | Conteo de plantas vivas |
| POST | `/api/nursery/lots/:id/graduations` | Graduar plantas |
| POST | `/api/nursery/lots/:id/outputs` | Salida de plantas |
| GET/POST | `/api/nursery/quotations` | Cotizaciones |
| PATCH | `/api/nursery/quotations/:id/status` | Actualizar estado de cotización |
| GET | `/api/inventory/substrates` | Vista `v_nursery_substrate_stock` |
| GET | `/api/inventory/containers` | Vista `v_nursery_container_stock` |
| GET | `/api/inventory/nursery-raw` | Vista `v_nursery_raw_material_stock` |

**GET /api/nursery/lots/:id — Response:**
```json
{
  "lot": { "lot_id": "VIV-2026-0001", "species": {...}, "status": "active", "current_live_count": 45, ... },
  "germination_tracking": [...],
  "establishment_count": {...},
  "maintenance": [...],
  "plant_counts": [...],
  "graduations": [...],
  "outputs": [...]
}
```

#### Fotos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/photos/upload` | Sube foto a Google Drive, devuelve URL |

**POST /api/photos/upload — Request:** `multipart/form-data` con campo `file` y metadata:
```json
{
  "department": "food_production",
  "record_type": "harvest",
  "record_date": "2026-06-11"
}
```

**Lógica del Worker para upload de fotos:**
1. Recibir archivo (máx. 5MB — el cliente debe comprimir antes)
2. Generar nombre: `{department}/{YYYY-MM-DD}/{record_type}-{timestamp}.jpg`
3. Autenticar con Google Drive API usando service account
4. Subir a la carpeta correspondiente en Drive
5. Devolver `{ "url": "https://drive.google.com/..." }`

### 5.3 Formato de errores

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token expirado. Por favor, iniciá sesión nuevamente.",
    "details": null
  }
}
```

Códigos de error estándar:
- `UNAUTHORIZED` — JWT inválido o expirado
- `FORBIDDEN` — usuario no tiene rol/departamento para este recurso
- `NOT_FOUND` — recurso no existe
- `VALIDATION_ERROR` — campos requeridos faltantes o inválidos
- `CONFLICT` — violación de constraint (ej. semana de disponibilidad ya existe)
- `STOCK_WARNING` — stock insuficiente (no bloquea, solo avisa)

### 5.4 CORS

El Worker solo acepta requests de los orígenes del frontend:
- `https://jabdelnour95.github.io` (GitHub Pages — producción)
- `http://localhost:8080` (desarrollo local)

---

## 6. Autenticación con Supabase Auth

### Flujo de login

```
Frontend                Worker              Supabase Auth
   │                      │                      │
   │── POST /auth/login ──▶│                      │
   │                      │── signInWithPassword ─▶│
   │                      │◀── access_token ───────│
   │                      │── GET /profiles/:id ──▶│ (fetch perfil)
   │◀─ { token, profile }─│                      │
   │                      │                      │
   │ (guarda en localStorage)                    │
   │                      │                      │
   │── POST /api/food/... │                      │
   │   Authorization: Bearer <token>             │
   │                      │                      │
   │                      │ (valida JWT localmente│
   │                      │  con SUPABASE_JWT_SECRET)
   │                      │── SELECT * FROM ... ─▶│
   │◀─ datos ─────────────│                      │
```

### Sesión persistente en móvil

El frontend almacena `access_token` y `refresh_token` en `localStorage`. Antes de cada request verifica si el `access_token` está próximo a vencer (< 60 segundos) y llama a `/api/auth/refresh` automáticamente.

### Creación de usuarios (admin flow)

El admin llama a `POST /api/users` con `{ email, full_name, role, departments, temp_password }`. El Worker:
1. Crea el usuario en Supabase Auth via Admin API (con `temp_password`)
2. El trigger `on_auth_user_created` crea el perfil automáticamente
3. El Worker actualiza `profile_departments` con los departamentos asignados
4. Supabase Auth envía email de confirmación/bienvenida

---

## 7. Variables de entorno y configuración

### Worker (Cloudflare Secrets)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  (nunca en el cliente)
SUPABASE_JWT_SECRET=...
GOOGLE_DRIVE_SA_CREDENTIALS={"type":"service_account",...}
GOOGLE_DRIVE_ROOT_FOLDER_ID=...  (carpeta raíz "Tierramor Portal" en Drive)
ALLOWED_ORIGINS=https://jabdelnour95.github.io,http://localhost:8080
```

### Frontend (constante pública en `js/config.js`)

```js
export const API_BASE_URL = 'https://tierramor-api.workers.dev';
```

Solo la URL del Worker. El cliente nunca ve keys de Supabase ni de Drive.

---

## 8. Secuencia de implementación

Alineada con las fases del PRD:

**Fase 1a — Fundación:**
1. Crear proyecto en Supabase
2. Ejecutar schema (sección 3) en el editor SQL de Supabase
3. Configurar Supabase Auth (email + password, desactivar confirmación de email para MVP)
4. Crear cuenta Cloudflare, configurar Worker con variables de entorno
5. Implementar rutas de auth y catálogos en el Worker
6. Implementar módulo de admin de usuarios en el frontend
7. Implementar CRUD de todos los catálogos en el frontend

**Fase 1b — Producción de Alimentos:**
1. Implementar rutas de Producción de Alimentos en el Worker
2. Implementar módulos del frontend: plan de siembra, propagación, preparación de camas, siembra, aplicación de insumos, mantenimiento, disponibilidad, pedido de cocina, cosecha, facturas

**Fase 1c — Biofábrica y Vivero:**
1. Implementar rutas de Biofábrica y sus inventarios calculados
2. Implementar rutas de Vivero y sus inventarios calculados
3. Verificar integración cross-departamento con datos reales

**Fase 1d — QA y lanzamiento:**
1. Implementar job de envío a Notion (Supabase Edge Function con cron)
2. Integrar Google Drive para fotos
3. Carga inicial de datos (script de migración desde Sheets/AppSheet)
4. Testing en campo con usuarios reales

---

## 9. Decisiones de diseño confirmadas (2026-06-11)

| # | Decisión | Resolución | Impacto en el código |
|---|---|---|---|
| D-001 | Stock insuficiente al cerrar lote de Biofábrica | **Solo advertir, no bloquear.** El Worker valida stock antes de cerrar y devuelve `{ "warning": true, "items": [...] }` si hay insuficiencia, pero permite continuar. | Worker: validación pre-cierre no bloqueante. UI: mostrar items en rojo con aviso. |
| D-002 | Upload de fotos a Google Drive | **Via Cloudflare Worker.** El cliente envía la foto al Worker; el Worker la sube con service account. La credencial de Drive nunca llega al cliente. | Worker: ruta `POST /api/photos/upload` maneja la subida. Service account key en Cloudflare secrets. |
| D-003 | Pedidos de cocina por semana | **Múltiples pedidos por semana.** Cocina puede crear pedidos adicionales durante la semana (ej. pedido urgente). Producción ve todos los pedidos de la semana activa. | `kitchen_orders` sin UNIQUE constraint en `availability_id`. La UI de Producción lista todos los pedidos de la semana con su estado individual. |
| D-004 | Granularidad de inventario de contenedores | **Por tipo de contenedor.** El sistema trackea cuántos contenedores de cada tipo (1L, 3L, 5L) están disponibles. No distingue de qué batch de llenado vienen. | Vista `v_nursery_container_stock` agrupa por `container_type_id`. Sin complejidad adicional de trazabilidad por batch. |
