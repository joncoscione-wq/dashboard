# Plan v3 — CI RRHH Dashboard

## Resumen de cambios

### Secciones renombradas

| Nombre actual | Nombre v3 | Cambio |
|---|---|---|
| Dashboard | Resumen | Solo rename + contenido actualizado |
| Empleados | Legajo | Rename + integración con nuevas secciones |
| Calendario + Eventos | Eventos | Fusión: calendario mensual + eventos + vacaciones + licencias (sin presencialidad) |
| Flota | Flota de Celulares | Solo rename |

### Nuevas secciones

| Sección | Descripción |
|---|---|
| People | Resumen ejecutivo RRHH: notas, feedbacks y reuniones por empleado |
| Homeoffice | Grilla de presencialidad + política de modalidad por empleado |
| Licencias | Unifica vacaciones + ausencias + estudio en una tabla |
| Sueldos | Historial salarial con índice de inflación + integración calendar/mail |
| Beneficios | Catálogo general, particular y convenios corporativos |
| Inducción | Biblioteca de manuales con tracking de lectura + integración calendar/mail |

---

## Arquitectura de navegación v3

```
/                    → Resumen       (ex Dashboard)
/legajo              → Legajo        (ex Empleados)
/eventos             → Eventos       (ex Calendario + ex Eventos — fusionados)
/homeoffice          → Homeoffice    (ex grilla de presencialidad del Calendar)
/flota               → Flota de Celulares  (ex Flota — solo rename)
/licencias           → Licencias     (nueva — reemplaza vacaciones/ausencias/estudio)
/sueldos             → Sueldos       (nueva)
/beneficios          → Beneficios    (nueva)
/induccion           → Inducción     (nueva)
/people              → People        (nueva — notas, feedbacks y reuniones RRHH)
```

---

## SQL — Tablas nuevas y modificadas

### TABLA 1 — `licencias` (reemplaza vacaciones + ausencias + estudio)

```sql
create table if not exists licencias (
  id          bigserial primary key,
  emp_id      bigint      not null references empleados(id) on delete cascade,
  tipo        text        not null,
  -- Valores: 'Vacaciones' | 'Médica' | 'Estudio' | 'Personal'
  --          'Maternidad' | 'Paternidad' | 'Duelo' | 'Otro'
  desde       date        not null,
  hasta       date        not null,
  dias        int,
  certificado text        not null default 'No',  -- 'Sí' | 'No'
  estado      text        not null default 'Pendiente',
  -- Valores: 'Pendiente' | 'Aprobada' | 'Rechazada'
  notas       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_licencias_emp   on licencias (emp_id);
create index if not exists idx_licencias_desde on licencias (desde);
create index if not exists idx_licencias_tipo  on licencias (tipo);
```

> **Migración:** los datos existentes de `vacaciones`, `ausencias` y `estudio` se mapean a `licencias`
> con los tipos correspondientes. Las tablas originales quedan como backup hasta confirmar migración.

---

### TABLA 2 — `homeoffice_politica` (extiende presencialidad)

La tabla `presencialidad` existente (estados diarios Lu–Vi) se mantiene intacta.
Esta tabla nueva define la **política aprobada** de homeoffice por empleado.

```sql
create table if not exists homeoffice_politica (
  id              bigserial primary key,
  emp_id          bigint      not null references empleados(id) on delete cascade unique,
  dias_aprobados  text[]      not null default '{}',
  -- Ej: '{lun, mie}' — días de la semana autorizados para remoto
  max_dias_semana int         not null default 0,
  vigencia_desde  date,
  notas           text,
  updated_at      timestamptz not null default now()
);
```

> **Nota:** `empleados.modalidad` ya tiene `'Presencial' | 'Híbrido' | 'Remoto'`.
> `homeoffice_politica` agrega el detalle de qué días concretos aplica para los híbridos.
> La sección Homeoffice muestra tanto la política (esta tabla) como el estado real semanal (`presencialidad`).

---

### TABLA 3 — `sueldos`

```sql
create table if not exists sueldos (
  id          bigserial primary key,
  emp_id      bigint      not null references empleados(id) on delete cascade,
  periodo     date        not null,  -- primer día del mes: 2026-05-01
  neto        numeric     not null,
  fecha_pago  date,
  notas       text,
  created_at  timestamptz not null default now(),
  constraint sueldos_emp_periodo unique (emp_id, periodo)
);

create index if not exists idx_sueldos_emp     on sueldos (emp_id);
create index if not exists idx_sueldos_periodo on sueldos (periodo);
```

### TABLA 4 — `inflacion_ref`

Índice de referencia mensual para el reporte de evolución salarial real.

```sql
create table if not exists inflacion_ref (
  id                bigserial primary key,
  periodo           date        not null unique,  -- primer día del mes
  indice_acumulado  numeric     not null,  -- base 100 desde primer registro
  variacion_mensual numeric,               -- % variación vs mes anterior
  fuente            text,                  -- ej: 'INDEC', 'Manual'
  created_at        timestamptz not null default now()
);
```

> **Integración:** Sección Sueldos muestra gráfico de sueldo nominal vs sueldo ajustado por inflación.
> Genera evento en Google Calendar en `fecha_pago` y envía mail de notificación al empleado.

---

### TABLA 5 — `beneficios`

Catálogo de beneficios de la empresa.

```sql
create table if not exists beneficios (
  id          bigserial primary key,
  nombre      text        not null,
  tipo        text        not null default 'General',
  -- Valores: 'General' | 'Particular' | 'Convenio'
  descripcion text,
  proveedor   text,
  desde       date,
  hasta       date,
  estado      text        not null default 'Activo',  -- 'Activo' | 'Inactivo'
  created_at  timestamptz not null default now()
);
```

### TABLA 6 — `beneficios_empleados`

Asignaciones individuales (solo para tipo `'Particular'` o beneficios específicos).
Los de tipo `'General'` aplican a todos; no requieren fila por empleado.

```sql
create table if not exists beneficios_empleados (
  id           bigserial primary key,
  beneficio_id bigint      not null references beneficios(id) on delete cascade,
  emp_id       bigint      not null references empleados(id) on delete cascade,
  desde        date,
  hasta        date,
  notas        text,
  created_at   timestamptz not null default now(),
  constraint beneficios_emp_uq unique (beneficio_id, emp_id)
);

create index if not exists idx_benef_emp on beneficios_empleados (emp_id);
```

---

### TABLA 7 — `induccion_docs`

Biblioteca de documentos del bucket `induction-docs` en Supabase Storage.

```sql
create table if not exists induccion_docs (
  id          bigserial primary key,
  titulo      text        not null,
  descripcion text,
  categoria   text        not null default 'Manual',
  -- Valores: 'Manual' | 'Política' | 'Reglamento' | 'Procedimiento' | 'Otro'
  archivo_url text,        -- URL pública del bucket induction-docs
  obligatorio boolean     not null default false,
  created_at  timestamptz not null default now()
);
```

### TABLA 8 — `induccion_progreso`

Tracking de lectura/completado por empleado.

```sql
create table if not exists induccion_progreso (
  id               bigserial primary key,
  doc_id           bigint      not null references induccion_docs(id) on delete cascade,
  emp_id           bigint      not null references empleados(id) on delete cascade,
  completado       boolean     not null default false,
  fecha_completado date,
  notas            text,
  created_at       timestamptz not null default now(),
  constraint induccion_progreso_uq unique (doc_id, emp_id)
);

create index if not exists idx_induccion_progreso_emp on induccion_progreso (emp_id);
create index if not exists idx_induccion_progreso_doc on induccion_progreso (doc_id);
```

> **Storage:** bucket `induction-docs` en Supabase Storage (acceso público para lectura).
> **Integración:** al asignar un documento obligatorio a un empleado nuevo, genera evento en
> Google Calendar y envía mail con link al documento.

---

## Diagrama de relaciones actualizado

```
empleados (id) ◄──── licencias           (emp_id)   ← reemplaza vacaciones+ausencias+estudio
               ◄──── presencialidad      (emp_id)   ← sin cambios
               ◄──── homeoffice_politica (emp_id)   ← nueva, 1:1
               ◄──── sueldos             (emp_id)
               ◄──── notas_people        (emp_id)   ← ya existía, ahora tiene UI en People
               ◄──── reuniones           (emp_id, nullable)  ← nueva
               ◄──── eventos             (emp_id, nullable)
               ◄──── beneficios_empleados(emp_id)
               ◄──── induccion_progreso  (emp_id)

beneficios (id)     ◄─── beneficios_empleados (beneficio_id)
induccion_docs (id) ◄─── induccion_progreso   (doc_id)

inflacion_ref  → sin FK (tabla de referencia independiente)
flota          → sin FK (líneas móviles independientes)
```

---

### TABLA 9 — `reuniones`

Registro de reuniones 1:1 o grupales vinculadas a empleados.

```sql
create table if not exists reuniones (
  id            bigserial primary key,
  emp_id        bigint      references empleados(id) on delete set null,
  -- nullable: reunión grupal sin empleado específico
  titulo        text        not null,
  fecha         timestamptz not null,
  tipo          text        not null default 'General',
  -- Valores: 'General' | 'Feedback' | 'Performance' | 'Onboarding' | 'Disciplinaria' | 'Otro'
  participantes text[],     -- nombres o iniciales adicionales
  notas         text,
  acuerdos      text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_reuniones_emp   on reuniones (emp_id);
create index if not exists idx_reuniones_fecha on reuniones (fecha);
```

> **Nota:** La tabla `notas_people` ya existe en DB (categorías: General, Feedback, Advertencia,
> Reconocimiento, Administrativo, Otro). La sección People le da UI por primera vez y la combina
> con `reuniones` en una vista unificada por empleado.

---

## Fases de implementación

### Fase 0 — Renombrado y fusión de rutas (solo UI)
**Alcance:** cero cambios de DB. Solo cambios en `Navbar.jsx`, `App.jsx` y rutas.

- [x] Renombrar nav: Dashboard→Resumen, Empleados→Legajo, Flota→Flota de Celulares
- [x] Crear ruta `/eventos` que fusiona el Calendar actual + Events actual → `Eventos.jsx`
- [x] Crear ruta `/homeoffice` con grilla de presencialidad → `Homeoffice.jsx`
- [x] Actualizar rutas en `App.jsx` y links del `Dashboard.jsx`
- [x] Crear `CLAUDE.md` con contexto del proyecto

---

### Fase 1 — Licencias (DB + UI)
**Alcance:** nueva tabla `licencias`, migración de datos, componente nuevo.

- [x] Ejecutar SQL: crear tabla `licencias` + índices
- [x] Migrar datos de `estudio` → `licencias` (vacaciones y ausencias tenían 0 filas)
- [x] Agregar métodos a `api.js`: `api.licencias.*`
- [x] Crear `Licencias.jsx`: lista filtrable + modal CRUD
- [x] Mostrar licencias en el calendario de Eventos (punto verde + sidebar licencias activas)
- [x] KPI "Licencias activas" en Resumen (reemplaza "Ausencias este mes")

---

### Fase 2 — Homeoffice (DB + UI)
**Alcance:** nueva tabla `homeoffice_politica`, componente, widget en Resumen.

- [x] Ejecutar SQL: crear tabla `homeoffice_politica`
- [x] Agregar métodos a `api.js`: `api.homeoffice.*` (getAll/upsert/delete)
- [x] Actualizar `Homeoffice.jsx`:
  - Grilla semanal con columna de hoy resaltada
  - Panel "Política de Homeoffice": tabla con modalidad + días aprobados por empleado
  - Modal con toggle de días + max_dias_semana + vigencia + notas
- [x] Widget en Resumen: "Equipo hoy" con conteos presencial/remoto/ausente (solo días laborables)

---

### Fase 3 — Sueldos (DB + UI + integraciones)
**Alcance:** tablas `sueldos` + `inflacion_ref`, componente, calendar y mail.

- [x] Ejecutar SQL: tablas `sueldos` e `inflacion_ref`
- [x] Agregar métodos a `api.js`: `api.sueldos.*` + `api.inflacion.*`
- [x] Crear `Sueldos.jsx`:
  - Tabla de historial por empleado (período, neto, fecha de pago)
  - Modal CRUD: agregar/editar sueldo mensual
  - Gráfico de evolución: sueldo nominal vs ajustado por inflación
  - Carga manual del índice de inflación mensual (tabla `inflacion_ref`)
- [x] Integración Google Calendar/Gmail: vía asistente (info note en modal fecha_pago)

---

### Fase 4 — Beneficios (DB + UI)
**Alcance:** tablas `beneficios` + `beneficios_empleados`, componente.

- [ ] Ejecutar SQL: tablas `beneficios` + `beneficios_empleados`
- [ ] Agregar métodos a `api.js`: `api.beneficios.*`
- [ ] Crear `Beneficios.jsx`:
  - Lista de beneficios activos con tipo (General / Particular / Convenio)
  - Modal CRUD para el catálogo
  - Panel de asignaciones individuales: ver qué beneficios tiene cada empleado
  - Vista por empleado: desde Legajo, tab de beneficios asignados

---

### Fase 5 — People (DB + UI)
**Alcance:** nueva tabla `reuniones`, UI para `notas_people` (ya existe en DB), vista ejecutiva.

- [ ] Ejecutar SQL: tabla `reuniones` + índices
- [ ] Agregar métodos a `api.js`: `api.reuniones.*` (ya existe `api.notes.*` para notas_people)
- [ ] Crear `People.jsx`:
  - **Vista resumen ejecutivo:** tabla de todos los empleados con conteo de notas, feedbacks y reuniones pendientes
  - **Timeline por empleado:** historial de notas (`notas_people`) ordenadas por fecha con badges de categoría
  - **Reuniones:** lista + modal CRUD para registrar reuniones 1:1 o grupales
  - **Bloc de notas rápido:** agregar nota a un empleado sin salir de la vista
  - Filtros: por empleado, categoría, tipo de reunión, rango de fechas

---

### Fase 6 — Inducción (DB + Storage + UI + integraciones)
**Alcance:** bucket Supabase, tablas `induccion_docs` + `induccion_progreso`, componente.

- [ ] Crear bucket `induction-docs` en Supabase Storage (público)
- [ ] Ejecutar SQL: tablas `induccion_docs` + `induccion_progreso`
- [ ] Ampliar `api.js`: métodos upload/delete en bucket + CRUD de docs y progreso
- [ ] Crear `Induccion.jsx`:
  - Biblioteca de documentos: subir PDF/doc, categorizar, marcar obligatorio
  - Panel de tracking: tabla de empleados × documentos (completado / pendiente)
  - Asignación masiva: al agregar empleado nuevo, asignar todos los obligatorios
- [ ] Integración Google Calendar: crear evento de revisión para el empleado asignado
- [ ] Integración Gmail: enviar mail al empleado con link al documento y fecha límite

---

## Integraciones externas

| Integración | Usado en | Acción |
|---|---|---|
| Google Calendar | Sueldos, Inducción, People | Crear eventos de pago/revisión/reunión |
| Gmail | Sueldos, Inducción, People | Enviar notificaciones al empleado |
| Supabase Storage | Inducción | Bucket `induction-docs` para PDFs |

> Las integraciones usan los MCP tools ya configurados:
> `mcp__claude_ai_Google_Calendar__*` y `mcp__claude_ai_Gmail__*`

---

## Tablas a deprecar (post-migración)

| Tabla | Reemplazada por | Acción |
|---|---|---|
| `vacaciones` | `licencias` (tipo='Vacaciones') | Drop tras confirmar migración |
| `ausencias` | `licencias` (tipo='Médica'/'Personal'/etc.) | Drop tras confirmar migración |
| `estudio` | `licencias` (tipo='Estudio') | Drop tras confirmar migración |

---

## Estado de tablas v3 (objetivo final)

| Tabla | Nueva | Estado |
|---|---|---|
| `empleados` | No | Sin cambios |
| `presencialidad` | No | Sin cambios |
| `homeoffice_politica` | ✅ | Vacía |
| `licencias` | ✅ | Migrar datos de vacaciones/ausencias/estudio |
| `sueldos` | ✅ | Vacía |
| `inflacion_ref` | ✅ | Carga manual |
| `beneficios` | ✅ | Vacía |
| `beneficios_empleados` | ✅ | Vacía |
| `induccion_docs` | ✅ | Vacía |
| `induccion_progreso` | ✅ | Vacía |
| `flota` | No | Sin cambios |
| `eventos` | No | Sin cambios |
| `notas_people` | No | Sin cambios — UI implementada en People |
| `reuniones` | ✅ | Vacía |
| `vacaciones` | — | Deprecar post-migración |
| `ausencias` | — | Deprecar post-migración |
| `estudio` | — | Deprecar post-migración |
