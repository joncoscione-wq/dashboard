# CLAUDE.md — CI RRHH Dashboard

## Proyecto
Dashboard interno de RRHH para Contexto Investments. React 19 + Vite + Supabase + Vercel.
Plan de v3 documentado en `planv3.md` (checklist de fases con estado).

## Comandos
```bash
npm run dev     # http://localhost:5173
npm run build   # dist/
```

## Archivos clave
- `src/config/api.js` — única capa de acceso a datos (todas las llamadas Supabase van aquí)
- `src/lib/supabase.js` — cliente Supabase inicializado
- `src/index.css` — design tokens (CSS variables)
- `src/App.jsx` — router + estado global de empleados (prop drilling a componentes)

## Design tokens
```
--primary: #0d4259       --accent: #186f8a      --accent-bg: #e4f2f7
--ci-bg: #f3f4f6         --ci-text: #0d2d3e     --ci-muted: #7a8899
--ci-border: #dde1e8
--ci-green: #1a7a4a      --ci-green-bg: #e5f5ec
--ci-red: #b83228        --ci-red-bg: #fceeed
--ci-amber: #a34f00      --ci-amber-bg: #fef2e0
```

## Clases utilitarias
`.card` · `.btn-primary` · `.btn-secondary` · `.input-field`
Tipografía: títulos `font-poppins`, cuerpo DM Sans, base 13px.

## Convención de componentes
1. Estado: `useState` para list, loading, modals, formData
2. `fetchData()` en `useEffect()`
3. Handlers: `handleAdd / handleEdit / handleDelete` con `showToast(msg, undoFn)`
4. Modal como sub-componente inline: `const Modal = ({ isOpen }) => { if (!isOpen) return null ... }`
5. Lazy-loaded desde App.jsx con `React.lazy` + `<Suspense fallback={<PageLoader />}>`

## Toast + Undo
```js
showToast('Mensaje', async () => { /* undo */ })  // undoFn es opcional (pasar null si no aplica)
```

## Rutas v3
| Ruta | Componente | Fase |
|---|---|---|
| `/` | Dashboard.jsx (Resumen) | ✅ |
| `/legajo` | Employees.jsx (Legajo) | ✅ F0 |
| `/eventos` | Eventos.jsx (fusión calendario+eventos) | ✅ F0 |
| `/homeoffice` | Homeoffice.jsx (presencialidad) | ✅ F0 |
| `/flota` | Fleet.jsx (Flota de Celulares) | ✅ |
| `/licencias` | Licencias.jsx | ⏳ F1 |
| `/sueldos` | Sueldos.jsx | ⏳ F3 |
| `/beneficios` | Beneficios.jsx | ⏳ F4 |
| `/people` | People.jsx | ⏳ F5 |
| `/induccion` | Induccion.jsx | ⏳ F6 |

## Schema DB (resumen)
```
empleados   — core, todas las FK apuntan aquí
presencialidad(emp_id, dia_semana, estado) — upsert unique(emp_id, dia_semana)
notas_people(emp_id, categoria, texto) — ya existe, UI en F5 (People)
eventos, flota — sin cambios
--- Nuevas en v3 ---
licencias(emp_id, tipo, desde, hasta, dias, certificado, estado)
homeoffice_politica(emp_id unique, dias_aprobados[], max_dias_semana)
sueldos(emp_id, periodo date, neto) — unique(emp_id, periodo)
inflacion_ref(periodo date, indice_acumulado, variacion_mensual)
beneficios + beneficios_empleados(beneficio_id, emp_id)
reuniones(emp_id nullable, titulo, fecha, tipo)
induccion_docs + induccion_progreso(doc_id, emp_id)
--- Deprecar post-F1 ---
vacaciones, ausencias, estudio → migrar a licencias
```

## Integraciones externas (F3+)
- Google Calendar: `mcp__claude_ai_Google_Calendar__*`
- Gmail: `mcp__claude_ai_Gmail__*`
- Supabase MCP: `mcp__supabase__*`
