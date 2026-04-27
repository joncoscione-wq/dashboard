# CI RRHH Dashboard — Contexto Investments

Sistema interno de gestión de Recursos Humanos para Contexto Investments.

---

## Stack actual (v1)

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + React Router DOM |
| Estilos | Tailwind CSS + CSS Variables (design tokens) |
| Backend | Node.js + Express |
| Base de datos | Archivos JSON en `/data` (file-based) |
| Fotos | Multer → `/public/uploads/photos/` |
| Íconos | Lucide React |

### Comandos para correr el proyecto

```bash
# Instalar dependencias
npm install

# Backend + Frontend en paralelo (recomendado)
npm run dev:full

# Por separado:
npm run dev      # Express backend  →  http://localhost:3001
npm run vite     # React frontend   →  http://localhost:5173

# Compilar CSS Tailwind (watcher)
npm run css
```

> El frontend corre en **:5173** con proxy a la API en **:3001**. Configurado en `vite.config.js`.

---

## Arquitectura actual

```
dashboard1.0/
├── server.js                   ← API REST Express (puerto 3001)
├── vite.config.js              ← Vite config (puerto 5173, proxy → 3001)
├── data/                       ← Base de datos JSON (8 archivos)
│   ├── empleados.json
│   ├── ausencias.json
│   ├── vacaciones.json
│   ├── presencialidad.json
│   ├── estudio.json
│   ├── eventos.json
│   ├── flota.json
│   ├── notas.json
│   └── ui_structure.json       ← Spec completo de diseño (referencia)
├── fotos/                      ← Fotos de empleados (iniciales del nombre)
│   └── *.jpg
├── public/
│   └── uploads/photos/         ← Fotos subidas via Multer
├── src/
│   ├── main.jsx
│   ├── App.jsx                 ← Router principal + carga global de empleados
│   ├── index.css               ← Design tokens (CSS variables) + Tailwind
│   ├── input.css               ← Entrada de Tailwind
│   ├── config/api.js           ← Base URL del backend
│   └── components/
│       ├── Navbar.jsx          ← Topbar con navegación
│       ├── Dashboard.jsx       ← Pantalla resumen con KPIs
│       ├── Employees.jsx       ← CRUD de empleados
│       ├── Calendar.jsx        ← Calendario + presencialidad
│       ├── Fleet.jsx           ← Gestión de flota móvil (UI de vehículos*)
│       └── Events.jsx          ← CRUD de eventos y cumpleaños
└── vanilla-dashboard/          ← Versión legacy vanilla JS (descartable en v2)
```

> **Nota:** El componente `Fleet.jsx` fue construido para vehículos (marca, modelo, patente) pero `data/flota.json` contiene líneas de celulares Movistar. Esto es un gap a resolver en la refactorización.

---

## API REST (server.js)

Todos los endpoints están en `http://localhost:3001/api/`.

### Endpoints CRUD estándar

Cada recurso soporta `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`.

| Recurso | Endpoint | Archivo JSON |
|---|---|---|
| Empleados | `/api/empleados` | `data/empleados.json` |
| Vacaciones | `/api/vacaciones` | `data/vacaciones.json` |
| Ausencias | `/api/ausencias` | `data/ausencias.json` |
| Estudio / Licencias | `/api/estudio` | `data/estudio.json` |
| Eventos | `/api/eventos` | `data/eventos.json` |
| Flota Móviles | `/api/flota` | `data/flota.json` |

### Endpoints especiales

```
GET    /api/notas?emp_id=:id      ← Notas filtradas por empleado
POST   /api/notas                 ← Nueva nota (agrega fecha automáticamente)
DELETE /api/notas/:id

GET    /api/presencialidad        ← Objeto { "empId_dia": "estado" }
PATCH  /api/presencialidad/:empId/:dia  ← Body: { estado: "presencial"|"remoto"|"ausente"|"libre" }
PUT    /api/presencialidad        ← Reemplaza objeto completo

POST   /api/photos/:empId         ← Subir foto (multipart/form-data, campo: "photo")
DELETE /api/photos/:empId         ← Eliminar foto

GET    /api/health                ← Health check
```

### Estructura de presencialidad

Es un objeto flat (no array), con claves `"empId_diaSemana"`:

```json
{
  "10_lun": "remoto",
  "10_mar": "presencial",
  "4_lun": "presencial"
}
```

Días válidos: `lun`, `mar`, `mie`, `jue`, `vie`.

---

## Módulos del dashboard

### 1. Dashboard (Resumen)
- **Ruta:** `/`
- **Componente:** `Dashboard.jsx`
- **KPIs:** Equipo activo · Ausencias este mes · Próximo cumpleaños
- **Cards:** Empleados recientes · Próximos eventos
- **Acciones rápidas:** Links a los 4 módulos principales

### 2. Empleados (Legajo)
- **Ruta:** `/empleados`
- **Componente:** `Employees.jsx`
- **Funcionalidad:** CRUD completo con modal (Agregar / Editar / Eliminar)
- **Filtros:** Búsqueda por texto · Filtro por estado · Filtro por área
- **Vista:** Grid de tarjetas con avatar (inicial del apellido), puesto, email, celular, área, fecha ingreso

### 3. Calendario
- **Ruta:** `/calendario`
- **Componente:** `Calendar.jsx`
- **Funcionalidad:** Calendario mensual navegable · Vista de eventos por día · Grid de presencialidad semanal
- **Modales:** Agregar evento desde celda del calendario · Editar presencialidad por empleado

### 4. Flota Móviles
- **Ruta:** `/flota`
- **Componente:** `Fleet.jsx`
- **Datos reales:** Líneas Movistar (número, rol, usuario asignado, equipo)
- **⚠ Gap:** La UI del componente está diseñada para vehículos. En la refactorización se debe realinear con los datos reales de `flota.json`.

### 5. Eventos y Cumpleaños
- **Ruta:** `/eventos`
- **Componente:** `Events.jsx`
- **Funcionalidad:** CRUD de eventos · Filtros por tipo y mes · Lista de próximos 5 eventos en sidebar
- **Tipos:** General · Feriado · Capacitación · Reunión · Cumpleaños · Evento Empresa

---

## Sistema de diseño

### Tipografía
- **Títulos:** Poppins (400, 500, 600, 700, 800, 900) — clase `font-poppins`
- **Cuerpo:** DM Sans (300, 400, 500, 600, 700) — default en `body`
- **Tamaño base:** 13px

### Tokens de color (CSS Variables — definidos en `src/index.css`)

```css
/* Paleta oficial CI */
--primary:     #0d4259   /* Azul oscuro principal */
--accent:      #186f8a   /* Azul medio, CTAs */
--primary-90:  #154e69
--primary-70:  #2a6884
--accent-bg:   #e4f2f7   /* Fondo accent claro */
--taupe:       #a5a08e
--taupe-bg:    #f5f2ed
--taupe-light: #ece9e3

/* Sistema UI */
--ci-bg:       #f3f4f6   /* Fondo de la app */
--ci-surface:  #ffffff   /* Cards */
--ci-border:   #dde1e8
--ci-border2:  #c6ccd6
--ci-text:     #0d2d3e   /* Texto principal */
--ci-text2:    #3d4f5c
--ci-muted:    #7a8899   /* Texto secundario */

/* Semánticos */
--ci-green:    #1a7a4a  --ci-green-bg:  #e5f5ec
--ci-red:      #b83228  --ci-red-bg:    #fceeed
--ci-amber:    #a34f00  --ci-amber-bg:  #fef2e0
```

### Clases utilitarias (definidas en `@layer components`)

| Clase | Uso |
|---|---|
| `.card` | Contenedor blanco, radius 12px, border, shadow |
| `.btn-primary` | Botón fondo `--primary` |
| `.btn-secondary` | Botón fondo `--accent` |
| `.input-field` | Input con focus ring `--accent` |
| `.badge-green/red/amber/primary` | Badges de estado |
| `.fade-in` | Animación fadeIn 0.3s |

---

## Datos actuales (data/*.json)

### `empleados.json` — 15 registros

```json
{
  "id": 10,
  "nombre": "COSCIONE, Jonathan",
  "puesto": "Office Manager",
  "area": "Administración",
  "ingreso": "2021-10-04",
  "nacimiento": "1991-04-23",
  "modalidad": "Híbrido",
  "email": "joncoscione@gmail.com",
  "direccion": "Valentin Vergara 1357 4to A Torre Norte (GBA Sur)",
  "dni": "35863977",
  "celular": "1140765354",
  "emergencia": "1136382429 Sabrina (Hermana)",
  "estado": "Activo"
}
```

Áreas presentes: `Dirección` · `Finanzas` · `Administración` · `Operaciones` · `Comercial`

### `flota.json` — 7 líneas Movistar

```json
{ "id": 301, "numero": "1123117902", "rol": "Asesoramiento 3", "usuario": "IH", "equipo": "Samsung Galaxy A04" }
```

### `estudio.json` — 5 registros de licencias educativas

```json
{ "id": 201, "emp_id": 12, "tipo": "Examen — Grado", "inst": "", "mat": "", "fecha": "2026-02-06", "dias": 2, "cert": "Sí" }
```

### `eventos.json` — 11 cumpleaños de empleados

```json
{ "id": 101, "tipo": "Cumpleaños", "nombre": "Cumpleaños de Mariano Bandieri", "fecha": "2026-03-13", "emp_id": 4, "notas": "" }
```

### Vacíos en v1 (pendientes de datos)
- `ausencias.json` → `[]`
- `vacaciones.json` → `[]`
- `notas.json` → `[]`
- `presencialidad.json` → `{}`

---

## Migración destino (v2) — Next.js + Supabase + Vercel

### Stack objetivo

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 App Router |
| Base de datos | Supabase (PostgreSQL) |
| ORM / Cliente | Supabase JS Client (`@supabase/supabase-js`) |
| Deploy | Vercel |
| Estilos | Tailwind + mismo `globals.css` (design tokens idénticos) |

### Esquemas SQL para Supabase

```sql
-- ─── 1. empleados ────────────────────────────────────────────────────────────
create table empleados (
  id          serial primary key,
  nombre      text not null,
  puesto      text,
  area        text,
  ingreso     date,
  nacimiento  date,
  modalidad   text default 'Presencial',  -- Presencial | Híbrido | Remoto
  email       text unique,
  direccion   text,
  dni         text,
  celular     text,
  emergencia  text,
  estado      text default 'Activo',      -- Activo | Inactivo
  foto_url    text,
  created_at  timestamptz default now()
);

-- ─── 2. vacaciones ───────────────────────────────────────────────────────────
create table vacaciones (
  id         serial primary key,
  emp_id     int references empleados(id) on delete cascade,
  desde      date not null,
  hasta      date not null,
  dias       int,
  notas      text,
  created_at timestamptz default now()
);

-- ─── 3. ausencias ────────────────────────────────────────────────────────────
create table ausencias (
  id          serial primary key,
  emp_id      int references empleados(id) on delete cascade,
  tipo        text,  -- Enfermedad | Licencia | Particular | Accidente | etc.
  desde       date not null,
  hasta       date not null,
  dias        int,
  certificado text default 'No',  -- Sí | No
  notas       text,
  created_at  timestamptz default now()
);

-- ─── 4. presencialidad ───────────────────────────────────────────────────────
-- Configuración permanente Lu–Vi por empleado (persiste hasta cambio manual)
create table presencialidad (
  id          serial primary key,
  emp_id      int references empleados(id) on delete cascade,
  dia_semana  text not null,  -- lun | mar | mie | jue | vie
  estado      text default 'libre',  -- presencial | remoto | ausente | libre
  updated_at  timestamptz default now(),
  unique (emp_id, dia_semana)
);

-- ─── 5. estudio (licencias educativas) ───────────────────────────────────────
-- Máximo 10 días por empleado por año calendario
create table estudio (
  id         serial primary key,
  emp_id     int references empleados(id) on delete cascade,
  tipo       text,  -- Examen — Grado | Examen — Posgrado | Curso | etc.
  inst       text,  -- institución
  mat        text,  -- materia
  fecha      date not null,
  dias       int default 1,
  cert       text default 'No',  -- Sí | No
  created_at timestamptz default now()
);

-- ─── 6. eventos ──────────────────────────────────────────────────────────────
create table eventos (
  id       serial primary key,
  tipo     text,  -- Cumpleaños | Corporativo | Feriado | Capacitación | Reunión | General
  nombre   text not null,
  fecha    date not null,
  emp_id   int references empleados(id) on delete set null,
  notas    text
);

-- ─── 7. flota (líneas móviles Movistar) ──────────────────────────────────────
create table flota (
  id      serial primary key,
  numero  text unique not null,
  rol     text,    -- Asesoramiento 1-5 | Compliance | etc.
  usuario text,    -- Iniciales del empleado o nombre
  equipo  text     -- Modelo del dispositivo
);

-- ─── 8. notas_people ─────────────────────────────────────────────────────────
-- Timeline de notas libres por empleado (módulo People · Legajos)
create table notas_people (
  id         serial primary key,
  emp_id     int references empleados(id) on delete cascade,
  categoria  text default 'General',  -- General | Feedback | Advertencia | Reconocimiento | Administrativo | Otro
  texto      text not null,
  created_at timestamptz default now()
);
```

### Estructura de carpetas Next.js

```
ci-rrhh-next/
├── app/
│   ├── layout.tsx           ← Shell global: Navbar + estilos globales
│   ├── page.tsx             ← Redirect → /dashboard
│   ├── dashboard/page.tsx
│   ├── empleados/page.tsx
│   ├── calendario/page.tsx
│   ├── flota/page.tsx
│   ├── eventos/page.tsx
│   └── api/                 ← Route Handlers (reemplazan Express)
│       ├── empleados/route.ts
│       ├── vacaciones/route.ts
│       ├── ausencias/route.ts
│       ├── presencialidad/route.ts
│       ├── estudio/route.ts
│       ├── eventos/route.ts
│       ├── flota/route.ts
│       └── notas/route.ts
├── components/
│   ├── Navbar.tsx
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── Calendar.tsx
│   ├── Fleet.tsx
│   └── Events.tsx
├── lib/
│   └── supabase.ts          ← Cliente Supabase
├── app/globals.css          ← Mismo contenido que src/index.css
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

### Cambios de código al migrar componentes

Los componentes React son casi idénticos. Solo cambian imports de routing:

```diff
- import { Link, useLocation } from 'react-router-dom'
+ import Link from 'next/link'
+ import { usePathname } from 'next/navigation'

- const location = useLocation()
+ const pathname = usePathname()

- const isActive = location.pathname === item.href
+ const isActive = pathname === item.href
```

Y los fetches pasan de `api.employees.getAll()` a llamadas al cliente Supabase:

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// En el componente
const { data } = await supabase.from('empleados').select('*')
```

---

## Gaps conocidos a resolver en v2

| # | Gap | Descripción |
|---|---|---|
| 1 | Fleet UI vs datos reales | `Fleet.jsx` está diseñado para vehículos pero `flota.json` tiene líneas de celulares. Hay que reescribir el componente alineado a los datos reales (numero, rol, usuario, equipo). |
| 2 | Events schema | `Events.jsx` usa `titulo/hora/ubicacion/participantes` pero `eventos.json` usa `nombre/emp_id`. Alinear schema en Supabase. |
| 3 | Calendar vacaciones | `Calendar.jsx` referencia `v.fecha_inicio` / `v.fecha_fin` pero el schema real usa `desde` / `hasta`. |
| 4 | Presencialidad en Calendar | La lógica de `getPresenceForDate()` en `Calendar.jsx` tiene un bug (usa `day=1` hardcoded). Reescribir para usar fecha real. |
| 5 | Datos vacíos | `ausencias`, `vacaciones`, `notas`, `presencialidad` están vacíos. Migrar con datos reales al pasar a Supabase. |

---

## Variables de entorno (v2 con Supabase)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Datos de referencia de empleados activos (Abril 2026)

| ID | Nombre | Puesto | Área |
|---|---|---|---|
| 1 | LIDERMAN, Stephanie | Office Assistant | Dirección |
| 2 | STRANO, Brian | Financial Advisor | Finanzas |
| 3 | CIRAVEGNA, Franco | Financial Advisor | Finanzas |
| 4 | BANDIERI, Mariano | Sales Trader | Finanzas |
| 5 | GUARDIOLA, Fernanda | Admin Analyst | Administración |
| 6 | TUBIO, Eliana | Middle Office Analyst | Operaciones |
| 7 | ARRIOLA, Zahira | Office Assistant | Administración |
| 8 | COATZ, Diego | Strategy Director | Dirección |
| 9 | VIENNI, Gabriel | Operations Director | Operaciones |
| 10 | COSCIONE, Jonathan | Office Manager | Administración |
| 11 | ROZEMBERG, Tomas | CEO | Dirección |
| 12 | HERNANDEZ, Ignacio | Financial Advisor | Finanzas |
| 13 | FENOGLIO CARRIZO, Agustin | Team Leader – Financial Advisor | Finanzas |
| 14 | GEMIO, Veronica | New Business Director | Comercial |
| 15 | LEALE, Santiago | Financial Advisor | Finanzas |
