# CI RRHH Dashboard — Contexto Investments

Sistema interno de gestión de Recursos Humanos. Versión 1.0 en producción.

---

## Stack actual

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + React Router DOM |
| Estilos | Tailwind CSS + CSS Variables (design tokens) |
| Base de datos | Supabase (PostgreSQL) |
| Cliente DB | `@supabase/supabase-js` (llamadas directas desde el frontend) |
| Fotos | Supabase Storage — bucket `employee-photos` (pendiente de crear) |
| Íconos | Lucide React |
| Deploy | Vercel (producción) |
| CI/CD | GitHub → Vercel (push a `master` despliega automáticamente) |

### Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Dev server Vite → http://localhost:5173
npm run build        # Build de producción → dist/
npm run preview      # Preview del build local
npm run server       # Levantar Express legacy (solo referencia, no se usa en prod)
```

### Variables de entorno

```env
# .env.local (local) — mismas variables en Vercel dashboard
VITE_SUPABASE_URL=https://tkfutdokpfpahhxfkgcp.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

---

## Arquitectura

```
dashboard1.0/
├── src/
│   ├── main.jsx
│   ├── App.jsx                 ← Router principal + carga global de empleados
│   ├── index.css               ← Design tokens (CSS variables) + Tailwind
│   ├── lib/supabase.js         ← Cliente Supabase inicializado
│   ├── config/api.js           ← Capa de acceso a datos (Supabase)
│   └── components/
│       ├── Navbar.jsx
│       ├── Dashboard.jsx
│       ├── Employees.jsx
│       ├── Calendar.jsx
│       ├── Fleet.jsx
│       └── Events.jsx
├── data/                       ← JSONs originales (respaldo histórico, no se usan)
├── server.js                   ← Express legacy (no se usa en producción)
├── vercel.json                 ← SPA rewrite + outputDirectory
├── vite.config.js
└── SCHEMA.md                   ← Schema SQL completo de Supabase
```

---

## Auditoría de migración a Supabase

### Estado de tablas en producción

| Tabla | Filas | RLS | Estado |
|---|---|---|---|
| `empleados` | 15 | ❌ off | ✅ Con datos |
| `flota` | 7 | ❌ off | ✅ Con datos |
| `eventos` | 11 | ❌ off | ✅ Con datos |
| `estudio` | 5 | ❌ off | ✅ Con datos |
| `presencialidad` | 0 | ❌ off | ⬜ Vacía |
| `vacaciones` | 0 | ❌ off | ⬜ Vacía |
| `ausencias` | 0 | ❌ off | ⬜ Vacía |
| `notas_people` | 0 | ❌ off | ⬜ Vacía |

> RLS desactivado intencionalmente — dashboard de uso interno sin autenticación de usuarios.

### Cobertura: Tabla → API → UI

| Tabla | API (`api.js`) | Componente | Funcionalidad |
|---|---|---|---|
| `empleados` | ✅ getAll / create / update / delete | `Employees.jsx` | ✅ CRUD completo |
| `flota` | ✅ getAll / create / update / delete | `Fleet.jsx` | ✅ CRUD completo |
| `eventos` | ✅ getAll / create / update / delete | `Events.jsx` | ✅ CRUD completo |
| `presencialidad` | ✅ getAll / update (upsert) / setAll | `Calendar.jsx` | ✅ Lectura + edición por empleado |
| `vacaciones` | ✅ getAll / create / update / delete | `Calendar.jsx` | ⚠️ Solo lectura en calendario |
| `ausencias` | ✅ getAll / create / update / delete | `Dashboard.jsx` | ⚠️ Solo conteo mensual en KPI |
| `notas_people` | ✅ getAll / create / delete | — | ❌ Sin componente UI |
| `estudio` | ❌ Sin método en api.js | — | ❌ Sin API ni UI |
| Storage fotos | ✅ upload / delete en api.js | — | ❌ Bucket no creado, sin UI |

### Pendientes para v2

| # | Ítem | Descripción |
|---|---|---|
| 1 | UI vacaciones | CRUD completo desde Calendario o módulo propio |
| 2 | UI ausencias | CRUD completo — formulario con emp_id, tipo, rango de fechas |
| 3 | UI notas_people | Timeline de notas por empleado (módulo Legajos) |
| 4 | UI estudio | Licencias educativas con límite 10 días/año |
| 5 | Storage fotos | Crear bucket `employee-photos` + UI de upload en Employees |
| 6 | RLS | Habilitar Row Level Security cuando se implemente autenticación |

---

## Módulos del dashboard

### Dashboard (`/`)
- **KPIs:** Equipo activo · Ausencias este mes (desde Supabase) · Cumpleaños próximos 30 días
- **Cards:** Empleados recientes · Próximos eventos
- **Acciones rápidas:** Links a los 4 módulos principales

### Empleados (`/empleados`)
- CRUD completo con modal (Agregar / Editar / Eliminar)
- Filtros: búsqueda por texto · estado · área
- Vista en tarjetas con avatar inicial, puesto, email, celular, ingreso
- Estado válido: `Activo` / `Inactivo`

### Calendario (`/calendario`)
- Calendario mensual navegable con eventos y vacaciones superpuestos
- Sidebar: próximos eventos + vacaciones activas (con nombre de empleado resuelto)
- Grid de presencialidad semanal Lu–Vi por empleado activo
- Modal para editar presencialidad individual por día

### Flota Móvil (`/flota`)
- Tabla de líneas Movistar: número, rol, usuario, equipo
- CRUD completo (Nueva línea / Editar / Eliminar)
- Búsqueda por número, usuario o equipo
- Stats: total / asignadas / sin asignar

### Eventos (`/eventos`)
- CRUD completo
- Campos: nombre, fecha, tipo, notas
- Tipos: `General` · `Corporativo` · `Feriado` · `Capacitación` · `Reunión` · `Cumpleaños`
- Filtros por texto, tipo y mes
- Sidebar: próximos 5 eventos + conteo por tipo

---

## Sistema de diseño

### Tipografía
- **Títulos:** Poppins — clase `font-poppins`
- **Cuerpo:** DM Sans — default en `body`
- **Tamaño base:** 13px

### Tokens de color (CSS Variables en `src/index.css`)

```css
--primary:     #0d4259   /* Azul oscuro — navbar, botones primarios */
--accent:      #186f8a   /* Azul medio — CTAs, links activos */
--accent-bg:   #e4f2f7   /* Fondo suave accent */
--taupe:       #a5a08e
--taupe-bg:    #f5f2ed

--ci-bg:       #f3f4f6   /* Fondo global */
--ci-text:     #0d2d3e   /* Texto principal */
--ci-muted:    #7a8899   /* Texto secundario */
--ci-border:   #dde1e8

--ci-green:    #1a7a4a  / --ci-green-bg:  #e5f5ec
--ci-red:      #b83228  / --ci-red-bg:    #fceeed
--ci-amber:    #a34f00  / --ci-amber-bg:  #fef2e0
```

### Clases utilitarias

| Clase | Uso |
|---|---|
| `.card` | Contenedor blanco, radius 12px, border, shadow |
| `.btn-primary` | Botón fondo `--primary` |
| `.btn-secondary` | Botón borde `--accent` |
| `.input-field` | Input estándar con focus ring `--accent` |

---

## Schema de base de datos

Ver [`SCHEMA.md`](./SCHEMA.md) para el SQL completo con tablas, índices, seed data y diagrama de relaciones.

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

## Datos seed cargados

### empleados — 15 registros

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

### flota — 7 líneas Movistar

| ID | Número | Rol | Usuario | Equipo |
|---|---|---|---|---|
| 301 | 1123117902 | Asesoramiento 3 | IH | Samsung Galaxy A04 |
| 302 | 1123468236 | - (ex RE, Ni) | - | - |
| 303 | 1128535202 | Asesoramiento 2 | BS | Samsung Galaxy A01 Core |
| 304 | 1138592005 | Compliance | AR x Henris | Samsung Galaxy A01 Core |
| 305 | 1140358337 | Asesoramiento 1 | MB | Motorola E22 |
| 306 | 1155736143 | Asesoramiento 5 | FT | Samsung Galaxy A06 |
| 307 | 1158080025 | - | - | - |

### eventos — 11 cumpleaños de empleados (IDs 101–111)
### estudio — 5 licencias educativas (IDs 201–205)

---

## Historial de versiones

### v1.0 — Abril 2026
- Migración completa de JSON file-based a Supabase
- Deploy en Vercel con CI/CD vía GitHub
- CRUD funcional: empleados, flota, eventos
- Calendario con presencialidad y vacaciones (lectura)
- Responsivo tablet y mobile
- Datos seed cargados: 15 empleados, 7 líneas, 11 eventos, 5 licencias

### v0.1 — Inicial
- Express + JSON file system
- Dashboard estático con datos hardcodeados
