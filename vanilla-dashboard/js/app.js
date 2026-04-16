// ─── Estado global ────────────────────────────────────────────────────────────
const STATE = {
  empleados:      [],
  vacaciones:     [],
  ausencias:      [],
  presencialidad: {},
  estudio:        [],
  eventos:        [],
  flota:          [],
  notas:          [],
  tabActual:      'dashboard'
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(method, url, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch('/api' + url, opts)
  if (!res.ok) throw new Error((await res.json()).error || res.statusText)
  return res.json()
}
const apiGet    = url        => apiFetch('GET',    url)
const apiPost   = (url, b)   => apiFetch('POST',   url, b)
const apiPut    = (url, b)   => apiFetch('PUT',    url, b)
const apiDelete = url        => apiFetch('DELETE', url)

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer
function toast(msg) {
  const el = document.getElementById('toast')
  document.getElementById('toast-msg').textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000)
}

// ─── Navegación de tabs ───────────────────────────────────────────────────────
function goTab(tab) {
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'))
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active')
  document.getElementById(`panel-${tab}`).classList.add('active')
  STATE.tabActual = tab
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nombreEmpleado(id) {
  const e = STATE.empleados.find(e => e.id == id)
  return e ? e.nombre : `ID ${id}`
}

function selectEmpleados(elId, valorActual = '') {
  const sel = document.getElementById(elId)
  if (!sel) return
  sel.innerHTML = '<option value="">— Seleccionar —</option>' +
    STATE.empleados
      .filter(e => e.estado === 'Activo')
      .map(e => `<option value="${e.id}" ${e.id == valorActual ? 'selected' : ''}>${e.nombre}</option>`)
      .join('')
}

function toggleForm(id) {
  const el = document.getElementById(id)
  el.classList.toggle('hidden')
}

function formatFecha(f) {
  if (!f) return '—'
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y}`
}

function diasHastaFecha(fechaStr) {
  if (!fechaStr) return null
  const hoy    = new Date(); hoy.setHours(0,0,0,0)
  const target = new Date(fechaStr + 'T00:00:00')
  // Ajustar al próximo año si ya pasó
  if (target < hoy) target.setFullYear(hoy.getFullYear() + 1)
  return Math.round((target - hoy) / 86400000)
}

// ─── Topbar fecha ─────────────────────────────────────────────────────────────
function renderFecha() {
  const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const hoy   = new Date()
  document.getElementById('topbar-date').textContent =
    `${dias[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`
}

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD — Resumen
// ══════════════════════════════════════════════════════════════════════════════
function renderDashboard() {
  const hoy     = new Date()
  const activos = STATE.empleados.filter(e => e.estado === 'Activo')

  // KPI: equipo activo
  document.getElementById('k-activos').textContent = activos.length

  // KPI: ausencias este mes
  const mesActual = hoy.getMonth() + 1
  const anioActual = hoy.getFullYear()
  const ausenciasEsteMes = STATE.ausencias
    .filter(a => {
      const f = new Date(a.desde)
      return f.getMonth() + 1 === mesActual && f.getFullYear() === anioActual
    })
    .reduce((sum, a) => sum + (Number(a.dias) || 0), 0)
  document.getElementById('k-ausmes').textContent = ausenciasEsteMes

  // KPI: próximo cumpleaños
  const cumples = STATE.eventos
    .filter(e => e.tipo === 'Cumpleaños')
    .map(e => ({ ...e, dias: diasHastaFecha(e.fecha) }))
    .filter(e => e.dias !== null)
    .sort((a, b) => a.dias - b.dias)
  if (cumples.length) {
    document.getElementById('k-proxcump').textContent = cumples[0].dias === 0 ? '🎂 HOY' : cumples[0].dias
    document.getElementById('k-proxcump-sub').textContent = cumples[0].dias === 0
      ? cumples[0].nombre
      : `días — ${cumples[0].nombre.replace('Cumpleaños de ', '')}`
  }

  // KPI: en vacaciones esta semana
  const lunes   = new Date(hoy); lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
  const viernes = new Date(lunes); viernes.setDate(lunes.getDate() + 4)
  const enVac = STATE.vacaciones.filter(v => {
    const d = new Date(v.desde), h = new Date(v.hasta)
    return d <= viernes && h >= lunes
  }).length
  document.getElementById('k-envac').textContent = enVac

  // Card: estado del equipo hoy
  const diaSemana = ['dom','lun','mar','mie','jue','vie','sab'][hoy.getDay()]
  const estadoHoy = activos.map(e => {
    const key    = `${e.id}_${diaSemana}`
    const estado = STATE.presencialidad[key] || 'libre'
    return { ...e, estado }
  })
  const iconos = { presencial: '🟢', remoto: '🔵', ausente: '🔴', libre: '⚪' }
  document.getElementById('dash-team-hoy').innerHTML =
    `<div style="display:flex;flex-wrap:wrap;gap:6px">` +
    estadoHoy.map(e =>
      `<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border:1.5px solid var(--border);border-radius:999px;font-size:11px;background:#fff">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif">
          ${e.nombre.split(',')[0].slice(0,2)}
        </span>
        ${e.nombre.split(',')[1]?.trim().split(' ')[0] || e.nombre.split(',')[0]} ${iconos[e.estado]}
      </span>`
    ).join('') +
    `</div>`

  // Card: próximos eventos
  const proximos = cumples.slice(0, 5)
  document.getElementById('dash-proximos').innerHTML = proximos.length
    ? proximos.map(e => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f0f3f6">
          <div style="background:var(--primary);color:#fff;border-radius:8px;width:40px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-family:'Poppins',sans-serif;font-size:15px;font-weight:800;line-height:1">${new Date(e.fecha + 'T00:00:00').getDate()}</span>
            <span style="font-size:8px;opacity:.7;text-transform:uppercase">${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][new Date(e.fecha + 'T00:00:00').getMonth()]}</span>
          </div>
          <div style="flex:1">
            <div style="font-weight:600;color:var(--primary);font-size:12px">${e.nombre}</div>
            <div style="font-size:11px;color:var(--muted)">${e.dias === 0 ? '¡Hoy!' : `en ${e.dias} días`}</div>
          </div>
        </div>`).join('')
    : '<p style="color:var(--muted);font-size:12px">Sin eventos próximos</p>'

  // Card: distribución por área
  const areas = {}
  activos.forEach(e => { areas[e.area] = (areas[e.area] || 0) + 1 })
  const total = activos.length
  document.getElementById('dash-areas').innerHTML = Object.entries(areas)
    .sort((a, b) => b[1] - a[1])
    .map(([area, n]) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="font-weight:600;color:var(--primary)">${area}</span>
          <span style="color:var(--muted)">${n} personas</span>
        </div>
        <div class="prog-bg"><div class="prog-fill" style="width:${Math.round(n/total*100)}%;background:var(--accent)"></div></div>
      </div>`).join('')

  // Subtítulo
  document.getElementById('dash-subtitle').textContent =
    `${activos.length} personas activas · ${new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}`
}

// ══════════════════════════════════════════════════════════════════════════════
//  LEGAJO — Empleados
// ══════════════════════════════════════════════════════════════════════════════
function renderEquipo() {
  const busq   = document.getElementById('eq-search')?.value.toLowerCase() || ''
  const area   = document.getElementById('eq-area')?.value || ''
  const estado = document.getElementById('eq-estado')?.value || ''

  const filtrados = STATE.empleados.filter(e =>
    (!busq   || e.nombre.toLowerCase().includes(busq) || (e.puesto||'').toLowerCase().includes(busq)) &&
    (!area   || e.area === area) &&
    (!estado || e.estado === estado)
  )

  document.getElementById('tbadge-equipo').textContent = STATE.empleados.filter(e => e.estado === 'Activo').length

  const tbody = document.getElementById('equipo-tbody')
  tbody.innerHTML = filtrados.map(e => `
    <tr class="tbl-tr">
      <td class="tbl-td" style="font-weight:600;color:var(--primary)">${e.nombre}</td>
      <td class="tbl-td" style="color:var(--muted);font-size:12px">${e.puesto || '—'}</td>
      <td class="tbl-td"><span class="badge badge-accent">${e.area || '—'}</span></td>
      <td class="tbl-td" style="color:var(--muted);font-size:12px">${formatFecha(e.ingreso)}</td>
      <td class="tbl-td"><span class="badge ${e.modalidad==='Presencial'?'badge-green':e.modalidad==='Híbrido'?'badge-amber':'badge-accent'}">${e.modalidad||'—'}</span></td>
      <td class="tbl-td"><span class="badge ${e.estado==='Activo'?'badge-green':'badge-gray'}">${e.estado||'—'}</span></td>
      <td class="tbl-td">
        <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado(${e.id})">✕</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Sin resultados</td></tr>`
}

async function guardarEmpleado() {
  const data = {
    nombre:     document.getElementById('fe-nombre').value.trim(),
    puesto:     document.getElementById('fe-puesto').value.trim(),
    area:       document.getElementById('fe-area').value,
    ingreso:    document.getElementById('fe-ingreso').value,
    nacimiento: document.getElementById('fe-nacimiento').value,
    modalidad:  document.getElementById('fe-modalidad').value,
    email:      document.getElementById('fe-email').value.trim(),
    dni:        document.getElementById('fe-dni').value.trim(),
    celular:    document.getElementById('fe-celular').value.trim(),
    emergencia: document.getElementById('fe-emergencia').value.trim(),
    direccion:  document.getElementById('fe-direccion').value.trim(),
    estado:     'Activo'
  }
  if (!data.nombre) return toast('El nombre es obligatorio')
  const nuevo = await apiPost('/empleados', data)
  STATE.empleados.push(nuevo)
  renderEquipo()
  toggleForm('form-equipo')
  toast(`✓ ${nuevo.nombre} agregado`)
}

async function eliminarEmpleado(id) {
  if (!confirm('¿Eliminar este empleado?')) return
  await apiDelete(`/empleados/${id}`)
  STATE.empleados = STATE.empleados.filter(e => e.id !== id)
  renderEquipo()
  toast('Empleado eliminado')
}

// ══════════════════════════════════════════════════════════════════════════════
//  FLOTA
// ══════════════════════════════════════════════════════════════════════════════
function renderFlota() {
  const items = STATE.flota
  document.getElementById('k-flota-total').textContent = items.length
  document.getElementById('k-flota-asig').textContent  = items.filter(f => f.usuario && f.usuario !== '-').length
  document.getElementById('k-flota-disp').textContent  = items.filter(f => !f.usuario || f.usuario === '-').length
  document.getElementById('k-flota-eq').textContent    = items.filter(f => f.equipo && f.equipo !== '-').length

  document.getElementById('flota-tbody').innerHTML = items.map((f, i) => `
    <tr class="tbl-tr">
      <td class="tbl-td" style="color:var(--muted)">${i + 1}</td>
      <td class="tbl-td" style="font-weight:700;font-family:'Poppins',sans-serif;letter-spacing:.3px">${f.numero}</td>
      <td class="tbl-td" style="color:var(--muted)">${f.rol || '—'}</td>
      <td class="tbl-td"><span class="badge ${f.usuario && f.usuario !== '-' ? 'badge-accent' : 'badge-gray'}">${f.usuario || '—'}</span></td>
      <td class="tbl-td" style="font-size:12px">${f.equipo || '—'}</td>
      <td class="tbl-td">
        <button class="btn btn-sm btn-danger" onclick="eliminarFlota(${f.id})">✕</button>
      </td>
    </tr>`).join('')
}

async function guardarFlota() {
  const data = {
    numero:  document.getElementById('ff-numero').value.trim(),
    rol:     document.getElementById('ff-rol').value.trim(),
    usuario: document.getElementById('ff-usuario').value.trim(),
    equipo:  document.getElementById('ff-equipo').value.trim()
  }
  if (!data.numero) return toast('El número es obligatorio')
  const nuevo = await apiPost('/flota', data)
  STATE.flota.push(nuevo)
  renderFlota()
  toggleForm('form-flota')
  toast('✓ Línea agregada')
}

async function eliminarFlota(id) {
  if (!confirm('¿Eliminar esta línea?')) return
  await apiDelete(`/flota/${id}`)
  STATE.flota = STATE.flota.filter(f => f.id !== id)
  renderFlota()
  toast('Línea eliminada')
}

// ══════════════════════════════════════════════════════════════════════════════
//  EVENTOS
// ══════════════════════════════════════════════════════════════════════════════
function renderEventos() {
  selectEmpleados('fev-emp')
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  const conDias = STATE.eventos.map(e => ({ ...e, dias: diasHastaFecha(e.fecha) }))
    .sort((a, b) => a.dias - b.dias)

  const proximos = conDias.filter(e => e.dias <= 90)

  const evCard = e => {
    const f = new Date(e.fecha + 'T00:00:00')
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0f3f6">
        <div style="background:var(--primary);color:#fff;border-radius:8px;width:46px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-family:'Poppins',sans-serif;font-size:17px;font-weight:800;line-height:1">${f.getDate()}</span>
          <span style="font-size:8px;opacity:.65;letter-spacing:1px;text-transform:uppercase">${MESES[f.getMonth()]}</span>
        </div>
        <div style="flex:1">
          <div style="font-weight:600;color:var(--primary);font-size:13px">${e.nombre}</div>
          <div style="font-size:11px;color:var(--muted)">${e.tipo}</div>
        </div>
        <div style="font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:var(--accent)">
          ${e.dias === 0 ? '🎂 Hoy' : `en ${e.dias}d`}
        </div>
        <button class="btn btn-sm btn-danger" onclick="eliminarEvento(${e.id})">✕</button>
      </div>`
  }

  document.getElementById('ev-proximos').innerHTML = proximos.length
    ? proximos.map(evCard).join('')
    : '<p style="color:var(--muted);font-size:12px">Sin eventos en los próximos 90 días</p>'

  document.getElementById('ev-todos').innerHTML = conDias.map(evCard).join('')
}

async function guardarEvento() {
  const data = {
    tipo:   document.getElementById('fev-tipo').value,
    nombre: document.getElementById('fev-nombre').value.trim(),
    emp_id: document.getElementById('fev-emp').value || null,
    fecha:  document.getElementById('fev-fecha').value,
    notas:  document.getElementById('fev-notas').value.trim()
  }
  if (!data.nombre || !data.fecha) return toast('Nombre y fecha son obligatorios')
  const nuevo = await apiPost('/eventos', data)
  STATE.eventos.push(nuevo)
  renderEventos()
  toggleForm('form-ev')
  toast('✓ Evento agregado')
}

async function eliminarEvento(id) {
  await apiDelete(`/eventos/${id}`)
  STATE.eventos = STATE.eventos.filter(e => e.id !== id)
  renderEventos()
  toast('Evento eliminado')
}

// ══════════════════════════════════════════════════════════════════════════════
//  EXPORTAR
// ══════════════════════════════════════════════════════════════════════════════
function exportarJSON() {
  const data = { ...STATE }
  delete data.tabActual
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `CI_RRHH_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  toast('↓ Exportando datos…')
}

// ══════════════════════════════════════════════════════════════════════════════
//  INIT — carga toda la data al iniciar
// ══════════════════════════════════════════════════════════════════════════════
async function init() {
  try {
    const [emp, vac, aus, pres, est, ev, flota] = await Promise.all([
      apiGet('/empleados'),
      apiGet('/vacaciones'),
      apiGet('/ausencias'),
      apiGet('/presencialidad'),
      apiGet('/estudio'),
      apiGet('/eventos'),
      apiGet('/flota')
    ])
    STATE.empleados      = emp
    STATE.vacaciones     = vac
    STATE.ausencias      = aus
    STATE.presencialidad = pres
    STATE.estudio        = est
    STATE.eventos        = ev
    STATE.flota          = flota

    renderFecha()
    renderDashboard()
    renderEquipo()
    renderFlota()
    renderEventos()

    toast('✓ Dashboard cargado')
  } catch (err) {
    console.error(err)
    toast('Error al cargar datos: ' + err.message)
  }
}

// Exponer funciones globales al HTML
window.goTab           = goTab
window.toggleForm      = toggleForm
window.renderEquipo    = renderEquipo
window.guardarEmpleado = guardarEmpleado
window.eliminarEmpleado= eliminarEmpleado
window.guardarFlota    = guardarFlota
window.eliminarFlota   = eliminarFlota
window.guardarEvento   = guardarEvento
window.eliminarEvento  = eliminarEvento
window.exportarJSON    = exportarJSON

init()
