# CI RRHH — Schema Supabase

Ejecutar en orden en el **SQL Editor** de Supabase.
Cada bloque está separado para poder correrlos individualmente si hace falta.

---

## Diagrama de relaciones

```
empleados (id) ◄──── vacaciones   (emp_id)
               ◄──── ausencias    (emp_id)
               ◄──── presencialidad (emp_id)
               ◄──── estudio      (emp_id)
               ◄──── eventos      (emp_id, nullable)
               ◄──── notas_people (emp_id)

flota  → sin FK (líneas móviles independientes)
```

---

## BLOQUE 1 — Crear tablas

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. empleados
-- Tabla core. Todas las demás referencian su id.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists empleados (
  id          bigserial primary key,
  nombre      text        not null,
  puesto      text,
  area        text,
  ingreso     date,
  nacimiento  date,
  modalidad   text        not null default 'Presencial',
  email       text        unique,
  direccion   text,
  dni         text,
  celular     text,
  emergencia  text,
  estado      text        not null default 'Activo',
  foto_url    text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. vacaciones
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists vacaciones (
  id         bigserial primary key,
  emp_id     bigint      not null references empleados(id) on delete cascade,
  desde      date        not null,
  hasta      date        not null,
  dias       int,
  notas      text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ausencias
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists ausencias (
  id          bigserial primary key,
  emp_id      bigint      not null references empleados(id) on delete cascade,
  tipo        text,
  desde       date        not null,
  hasta       date        not null,
  dias        int,
  certificado text        not null default 'No',
  notas       text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. presencialidad
-- Configuración permanente Lu–Vi por empleado.
-- unique (emp_id, dia_semana) garantiza un solo registro por combo.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists presencialidad (
  id          bigserial primary key,
  emp_id      bigint      not null references empleados(id) on delete cascade,
  dia_semana  text        not null,
  estado      text        not null default 'libre',
  updated_at  timestamptz not null default now(),
  constraint presencialidad_emp_dia unique (emp_id, dia_semana)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. estudio  (licencias educativas — máx 10 días/año por empleado)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists estudio (
  id         bigserial primary key,
  emp_id     bigint      not null references empleados(id) on delete cascade,
  tipo       text,
  inst       text,
  mat        text,
  fecha      date        not null,
  dias       int         not null default 1,
  cert       text        not null default 'No',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. eventos  (cumpleaños + eventos corporativos)
-- emp_id es nullable: hay eventos sin empleado vinculado.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists eventos (
  id     bigserial primary key,
  tipo   text        not null default 'General',
  nombre text        not null,
  fecha  date        not null,
  emp_id bigint      references empleados(id) on delete set null,
  notas  text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. flota  (líneas móviles Movistar — sin FK a empleados)
-- usuario guarda iniciales o nombre; se edita manualmente.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists flota (
  id      bigserial primary key,
  numero  text unique not null,
  rol     text,
  usuario text,
  equipo  text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. notas_people  (timeline de notas por empleado — módulo People / Legajos)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists notas_people (
  id         bigserial primary key,
  emp_id     bigint      not null references empleados(id) on delete cascade,
  categoria  text        not null default 'General',
  texto      text        not null,
  created_at timestamptz not null default now()
);
```

---

## BLOQUE 2 — Índices

```sql
-- Búsquedas frecuentes por emp_id
create index if not exists idx_vacaciones_emp    on vacaciones    (emp_id);
create index if not exists idx_ausencias_emp     on ausencias     (emp_id);
create index if not exists idx_presencialidad_emp on presencialidad (emp_id);
create index if not exists idx_estudio_emp       on estudio       (emp_id);
create index if not exists idx_eventos_emp       on eventos       (emp_id);
create index if not exists idx_notas_emp         on notas_people  (emp_id);

-- Búsqueda de eventos por fecha (calendario)
create index if not exists idx_eventos_fecha     on eventos       (fecha);

-- Búsqueda de ausencias / vacaciones por rango de fechas
create index if not exists idx_ausencias_desde   on ausencias     (desde);
create index if not exists idx_vacaciones_desde  on vacaciones    (desde);

-- Búsqueda de empleados por estado y área
create index if not exists idx_empleados_estado  on empleados     (estado);
create index if not exists idx_empleados_area    on empleados     (area);
```

---

## BLOQUE 3 — Seed: empleados (15 registros)

```sql
insert into empleados
  (id, nombre, puesto, area, ingreso, nacimiento, modalidad, email, direccion, dni, celular, emergencia, estado)
overriding system value
values
  (1,  'LIDERMAN, Stephanie',          'Office Assistant',                  'Dirección',      '2024-07-15', null,         'Presencial', 'sliderman@contextoinvestments.com.ar', 'Charcas 3480 1ero "B" (CABA)',                      '36527776', '1131531856', '1131535679 Sonia (Madre)',                                  'Activo'),
  (2,  'STRANO, Brian',                'Financial Advisor',                 'Finanzas',       '2023-01-09', null,         'Presencial', 'bstrano@contextoinvestments.com.ar',   'Fray Cayetano Rodriguez 970 1ro "D" (CABA)',        '38464406', '1167217873', '1167622650 Pablo (Padre)',                                  'Activo'),
  (3,  'CIRAVEGNA, Franco',            'Financial Advisor',                 'Finanzas',       '2025-09-15', null,         'Presencial', 'fciravegna@contextoinvestments.com.ar','Ricardo Fernandez 32 (GBA Norte)',                  '43101336', '1156967751', '1136892811 (Madre)',                                        'Activo'),
  (4,  'BANDIERI, Mariano',            'Sales Trader',                      'Finanzas',       '2020-12-09', '1995-03-13', 'Presencial', 'mbandieri@contextoinvestments.com.ar', 'Av. Congreso 2534 2ndo "A" (CABA)',                 '38890928', '1161293871', '1150208231 (Madre)',                                        'Activo'),
  (5,  'GUARDIOLA, Fernanda',          'Admin Analyst',                     'Administración', '2023-11-01', '1997-08-14', 'Presencial', 'fguardiola@contextoinvestments.com.ar','Saavedra 1241 2ndo "A" (CABA)',                     '40535877', '1167690026', '1154997398 Noelia (Hermana)',                               'Activo'),
  (6,  'TUBIO, Eliana',                'Middle Office Analyst',             'Operaciones',    '2025-10-01', '1997-02-17', 'Presencial', 'etubio@contextoinvestments.com.ar',    'Aguero 1105 (CABA)',                                '40006620', '1131416112', '1140671718 Angela (Madre)',                                 'Activo'),
  (7,  'ARRIOLA, Zahira',              'Office Assistant',                  'Administración', '2026-03-16', '2004-01-30', 'Presencial', 'zarriola@contextoinvestments.com.ar',  'Moreno 3369 Benavidez, Tigre',                     '45537629', '1124544120', '1134857056 Patricia (Madre) · 1168618977 Jerónimo (Novio)',   'Activo'),
  (8,  'COATZ, Diego',                 'Strategy Director',                 'Dirección',      null,         '1981-04-18', 'Presencial', 'dcoatz@gmail.com',                     'Mariscal Antonio José de Sucre 4444 4to "A" (CABA)','28802124', '1157677907', '1122658146 Marina (Pareja)',                                'Activo'),
  (9,  'VIENNI, Gabriel',              'Operations Director',               'Operaciones',    '2024-06-01', '1978-12-23', 'Presencial', 'gvienni@contextoinvestments.com.ar',   '25 De Mayo 1025 (GBA Norte)',                       '27084670', '1153270033', '1144135428 Enrique (Padre)',                                'Activo'),
  (10, 'COSCIONE, Jonathan',           'Office Manager',                    'Administración', '2021-10-04', '1991-04-23', 'Híbrido',    'joncoscione@gmail.com',                'Valentin Vergara 1357 4to "A" Torre Norte (GBA Sur)','35863977', '1140765354', '1136382429 Sabrina (Hermana)',                              'Activo'),
  (11, 'ROZEMBERG, Tomas',             'CEO',                               'Dirección',      null,         '1993-02-24', 'Presencial', 'trozemberg@gmail.com',                 'Beruti 4646 20mo "C" (CABA)',                       '37276783', '1169460644', '1150372584 Agustin (Hermano)',                              'Activo'),
  (12, 'HERNANDEZ, Ignacio',           'Financial Advisor',                 'Finanzas',       '2023-02-01', '1995-10-26', 'Presencial', 'ihernandez@contextoinvestments.com.ar','Carlos Calvo 2908 (CABA)',                          '38992941', '1131240060', '1153396211 (Madre)',                                        'Activo'),
  (13, 'FENOGLIO CARRIZO, Agustin',    'Team Leader – Financial Advisor',   'Finanzas',       null,         '1987-11-27', 'Presencial', 'afenoglio@contextoinvestments.com.ar', 'Av. Del Libertador 8560 4to "A" (CABA)',            '33443468', '1149488707', '1139456306 Laura (Madre)',                                  'Activo'),
  (14, 'GEMIO, Veronica',              'New Business Director',             'Comercial',      '2025-04-01', '1999-09-28', 'Presencial', 'vgemio@contextoinvestments.com.ar',    'Bacacay 2664 8vo 32 (CABA)',                        '42193425', '1165853798', '1169712837 Fanny (Madre)',                                  'Activo'),
  (15, 'LEALE, Santiago',              'Financial Advisor',                 'Finanzas',       '2026-04-01', null,         'Presencial', 'sleale@contextoinvestments.com.ar',    'Joaquín V. González 1044 (Burzaco)',                '46700556', '1167883141', '1159321866 Gustavo (Padre)',                                'Activo');

-- Resetear la secuencia para que el próximo INSERT auto-incremente desde 16
select setval('empleados_id_seq', (select max(id) from empleados));
```

---

## BLOQUE 4 — Seed: flota (7 líneas Movistar)

```sql
insert into flota (id, numero, rol, usuario, equipo)
overriding system value
values
  (301, '1123117902', 'Asesoramiento 3',  'IH',          'Samsung Galaxy A04'),
  (302, '1123468236', '- (ex RE, Ni)',    '-',           '-'),
  (303, '1128535202', 'Asesoramiento 2',  'BS',          'Samsung Galaxy A01 Core'),
  (304, '1138592005', 'Compliance',       'AR x Henris', 'Samsung Galaxy A01 Core'),
  (305, '1140358337', 'Asesoramiento 1',  'MB',          'Motorola E22'),
  (306, '1155736143', 'Asesoramiento 5',  'FT',          'Samsung Galaxy A06'),
  (307, '1158080025', '-',               '-',           '-');

select setval('flota_id_seq', (select max(id) from flota));
```

---

## BLOQUE 5 — Seed: estudio / licencias educativas (5 registros)

```sql
-- emp_id 3  = CIRAVEGNA, Franco
-- emp_id 4  = BANDIERI, Mariano
-- emp_id 6  = TUBIO, Eliana
-- emp_id 12 = HERNANDEZ, Ignacio

insert into estudio (id, emp_id, tipo, inst, mat, fecha, dias, cert)
overriding system value
values
  (201, 12, 'Examen — Grado', '', '', '2026-02-06', 2, 'Sí'),
  (202, 12, 'Examen — Grado', '', '', '2026-02-25', 2, 'Sí'),
  (203, 3,  'Examen — Grado', '', '', '2026-02-14', 2, 'Sí'),
  (204, 4,  'Examen — Grado', '', '', '2026-03-13', 2, 'Sí'),
  (205, 6,  'Examen — Grado', '', '', '2026-02-17', 2, 'Sí');

select setval('estudio_id_seq', (select max(id) from estudio));
```

---

## BLOQUE 6 — Seed: eventos / cumpleaños (11 registros)

```sql
-- Todos son cumpleaños de empleados.
-- Las fechas usan año 2026 (próxima ocurrencia al momento de la carga).

insert into eventos (id, tipo, nombre, fecha, emp_id, notas)
overriding system value
values
  (101, 'Cumpleaños', 'Cumpleaños de Mariano Bandieri',   '2026-03-13', 4,  ''),
  (102, 'Cumpleaños', 'Cumpleaños de Fernanda Guardiola', '2026-08-14', 5,  ''),
  (103, 'Cumpleaños', 'Cumpleaños de Eliana Tubio',       '2026-02-17', 6,  ''),
  (104, 'Cumpleaños', 'Cumpleaños de Zahira Arriola',     '2026-01-30', 7,  ''),
  (105, 'Cumpleaños', 'Cumpleaños de Diego Coatz',        '2026-04-18', 8,  ''),
  (106, 'Cumpleaños', 'Cumpleaños de Gabriel Vienni',     '2026-12-23', 9,  ''),
  (107, 'Cumpleaños', 'Cumpleaños de Jonathan Coscione',  '2026-04-23', 10, ''),
  (108, 'Cumpleaños', 'Cumpleaños de Tomas Rozemberg',    '2026-02-24', 11, ''),
  (109, 'Cumpleaños', 'Cumpleaños de Ignacio Hernandez',  '2026-10-26', 12, ''),
  (110, 'Cumpleaños', 'Cumpleaños de Agustin Fenoglio',   '2026-11-27', 13, ''),
  (111, 'Cumpleaños', 'Cumpleaños de Veronica Gemio',     '2026-09-28', 14, '');

select setval('eventos_id_seq', (select max(id) from eventos));
```

---

## BLOQUE 7 — Tablas vacías (sin seed)

```sql
-- vacaciones, ausencias, presencialidad, notas_people
-- No tienen datos en v1. Las secuencias arrancan desde 1 por defecto.
-- No se necesita correr nada extra.
```

---

## BLOQUE 8 — Verificación post-migración

```sql
-- Contar registros en cada tabla
select 'empleados'    as tabla, count(*) from empleados
union all
select 'flota',                  count(*) from flota
union all
select 'estudio',                count(*) from estudio
union all
select 'eventos',                count(*) from eventos
union all
select 'vacaciones',             count(*) from vacaciones
union all
select 'ausencias',              count(*) from ausencias
union all
select 'presencialidad',         count(*) from presencialidad
union all
select 'notas_people',           count(*) from notas_people;
```

Resultado esperado:

| tabla | count |
|---|---|
| empleados | 15 |
| flota | 7 |
| estudio | 5 |
| eventos | 11 |
| vacaciones | 0 |
| ausencias | 0 |
| presencialidad | 0 |
| notas_people | 0 |

---

## Valores permitidos por columna

### `empleados.modalidad`
`Presencial` · `Híbrido` · `Remoto`

### `empleados.estado`
`Activo` · `Inactivo`

### `empleados.area`
`Dirección` · `Finanzas` · `Administración` · `Operaciones` · `Comercial`

### `presencialidad.dia_semana`
`lun` · `mar` · `mie` · `jue` · `vie`

### `presencialidad.estado`
`presencial` · `remoto` · `ausente` · `libre`

### `ausencias.certificado` / `estudio.cert`
`Sí` · `No`

### `eventos.tipo`
`Cumpleaños` · `Corporativo` · `Feriado` · `Capacitación` · `Reunión` · `General`

### `notas_people.categoria`
`General` · `Feedback` · `Advertencia` · `Reconocimiento` · `Administrativo` · `Otro`

---

## Notas de migración

- **Fleet:** El componente `Fleet.jsx` actual está construido para vehículos. Los datos reales son líneas de celulares. El componente se reescribe en v2 alineado a la tabla `flota`.
- **Eventos:** El schema actual en los JSON usa `nombre`. El componente `Events.jsx` usa `titulo`. En Supabase se mantiene `nombre` y el componente se actualiza.
- **Presencialidad:** En v1 era un objeto flat `{ "empId_dia": "estado" }`. En Supabase es una tabla normalizada con `unique (emp_id, dia_semana)` y `upsert` para actualizar.
- **Fotos:** En v1 se guardaban en `/public/uploads/photos/`. En v2 usar **Supabase Storage** bucket `employee-photos`. El campo `foto_url` almacena la URL pública.
- **IDs:** Los IDs del seed se insertan con `overriding system value` para preservar las referencias cruzadas. Después se resetean las secuencias con `setval`.
