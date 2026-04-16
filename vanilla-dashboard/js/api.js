/**
 * api.js — Capa centralizada de comunicación con el servidor Express.
 * Todas las llamadas fetch del dashboard pasan por aquí.
 */

const BASE = '/api'

// ─── Helper base ──────────────────────────────────────────────────────────────
async function request(method, url, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (body !== null) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + url, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

const get    = (url)         => request('GET',    url)
const post   = (url, body)   => request('POST',   url, body)
const put    = (url, body)   => request('PUT',    url, body)
const patch  = (url, body)   => request('PATCH',  url, body)
const del    = (url)         => request('DELETE', url)

// ─── Empleados ────────────────────────────────────────────────────────────────
export const empleados = {
  list:   ()         => get('/empleados'),
  create: (data)     => post('/empleados', data),
  update: (id, data) => put(`/empleados/${id}`, data),
  remove: (id)       => del(`/empleados/${id}`)
}

// ─── Vacaciones ───────────────────────────────────────────────────────────────
export const vacaciones = {
  list:   ()         => get('/vacaciones'),
  create: (data)     => post('/vacaciones', data),
  update: (id, data) => put(`/vacaciones/${id}`, data),
  remove: (id)       => del(`/vacaciones/${id}`)
}

// ─── Ausencias ────────────────────────────────────────────────────────────────
export const ausencias = {
  list:   ()         => get('/ausencias'),
  create: (data)     => post('/ausencias', data),
  update: (id, data) => put(`/ausencias/${id}`, data),
  remove: (id)       => del(`/ausencias/${id}`)
}

// ─── Estudio / Licencias ──────────────────────────────────────────────────────
export const estudio = {
  list:   ()         => get('/estudio'),
  create: (data)     => post('/estudio', data),
  update: (id, data) => put(`/estudio/${id}`, data),
  remove: (id)       => del(`/estudio/${id}`)
}

// ─── Eventos ──────────────────────────────────────────────────────────────────
export const eventos = {
  list:   ()         => get('/eventos'),
  create: (data)     => post('/eventos', data),
  update: (id, data) => put(`/eventos/${id}`, data),
  remove: (id)       => del(`/eventos/${id}`)
}

// ─── Flota ────────────────────────────────────────────────────────────────────
export const flota = {
  list:   ()         => get('/flota'),
  create: (data)     => post('/flota', data),
  update: (id, data) => put(`/flota/${id}`, data),
  remove: (id)       => del(`/flota/${id}`)
}

// ─── Notas (People) ───────────────────────────────────────────────────────────
export const notas = {
  listByEmp: (empId) => get(`/notas?emp_id=${empId}`),
  create:    (data)  => post('/notas', data),
  remove:    (id)    => del(`/notas/${id}`)
}

// ─── Presencialidad ───────────────────────────────────────────────────────────
export const presencialidad = {
  list:      ()                      => get('/presencialidad'),
  setCell:   (empId, dia, estado)    => patch(`/presencialidad/${empId}/${dia}`, { estado }),
  replaceAll: (data)                 => put('/presencialidad', data)   // (uso avanzado)
}

// ─── Fotos ────────────────────────────────────────────────────────────────────
export const photos = {
  upload: async (empId, file) => {
    const fd = new FormData()
    fd.append('photo', file)
    const res = await fetch(`${BASE}/photos/${empId}`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error((await res.json()).error || 'Error al subir foto')
    return res.json()
  },
  remove: (empId) => del(`/photos/${empId}`)
}
