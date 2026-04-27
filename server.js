const express = require('express')
const fs      = require('fs')
const path    = require('path')
const multer  = require('multer')

const app  = express()
const PORT = 3001

// ─── Paths ────────────────────────────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, 'data')
const PHOTOS_DIR = path.join(__dirname, 'public', 'uploads', 'photos')

// Garantizar que existan las carpetas necesarias
;[PHOTOS_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }))

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json())

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Servir archivos estáticos del dashboard React
app.use(express.static(path.join(__dirname, 'public')))

// Servir archivos estáticos del dashboard vanilla en /vanilla
app.use('/vanilla', express.static(path.join(__dirname, 'vanilla-dashboard')))

// ─── Multer (fotos de empleados) ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PHOTOS_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `emp_${req.params.empId}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) return cb(null, true)
    cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'))
  }
})

// ─── Helpers JSON ─────────────────────────────────────────────────────────────
function readJSON(file) {
  const fp = path.join(DATA_DIR, file)
  if (!fs.existsSync(fp)) return null
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')) } catch { return null }
}

function writeJSON(file, data) {
  fs.writeFileSync(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2),
    'utf8'
  )
}

function nextId(items) {
  if (!items.length) return 1
  return Math.max(...items.map(i => Number(i.id) || 0)) + 1
}

// ─── Factory CRUD ─────────────────────────────────────────────────────────────
// Genera las 4 rutas estándar para cualquier colección JSON (array).
function crudRouter(file) {
  const router = express.Router()

  // GET /api/:recurso
  router.get('/', (req, res) => {
    const data = readJSON(file)
    if (data === null) return res.status(500).json({ error: `No se pudo leer ${file}` })
    res.json(data)
  })

  // POST /api/:recurso
  router.post('/', (req, res) => {
    const items  = readJSON(file) || []
    const newItem = { id: nextId(items), ...req.body }
    items.push(newItem)
    writeJSON(file, items)
    res.status(201).json(newItem)
  })

  // PUT /api/:recurso/:id
  router.put('/:id', (req, res) => {
    const items = readJSON(file) || []
    const idx   = items.findIndex(i => String(i.id) === String(req.params.id))
    if (idx === -1) return res.status(404).json({ error: 'Registro no encontrado' })
    items[idx] = { ...items[idx], ...req.body, id: items[idx].id }
    writeJSON(file, items)
    res.json(items[idx])
  })

  // DELETE /api/:recurso/:id
  router.delete('/:id', (req, res) => {
    let items = readJSON(file) || []
    const before = items.length
    items = items.filter(i => String(i.id) !== String(req.params.id))
    if (items.length === before) return res.status(404).json({ error: 'Registro no encontrado' })
    writeJSON(file, items)
    res.json({ ok: true })
  })

  return router
}

// ─── Rutas estándar ───────────────────────────────────────────────────────────
app.use('/api/empleados',    crudRouter('empleados.json'))
app.use('/api/vacaciones',   crudRouter('vacaciones.json'))
app.use('/api/ausencias',    crudRouter('ausencias.json'))
app.use('/api/estudio',      crudRouter('estudio.json'))
app.use('/api/eventos',      crudRouter('eventos.json'))
app.use('/api/flota',        crudRouter('flota.json'))

// ─── Notas (filtro por emp_id) ────────────────────────────────────────────────
const notasRouter = express.Router()

notasRouter.get('/', (req, res) => {
  let notas = readJSON('notas.json') || []
  if (req.query.emp_id) notas = notas.filter(n => String(n.emp_id) === String(req.query.emp_id))
  res.json(notas)
})

notasRouter.post('/', (req, res) => {
  const notas   = readJSON('notas.json') || []
  const newNota = {
    id:     nextId(notas),
    fecha:  new Date().toISOString().slice(0, 10),
    ...req.body
  }
  notas.push(newNota)
  writeJSON('notas.json', notas)
  res.status(201).json(newNota)
})

notasRouter.delete('/:id', (req, res) => {
  let notas = readJSON('notas.json') || []
  notas = notas.filter(n => String(n.id) !== String(req.params.id))
  writeJSON('notas.json', notas)
  res.json({ ok: true })
})

app.use('/api/notas', notasRouter)

// ─── Presencialidad (objeto, no array) ────────────────────────────────────────
// Estructura: { "empId_diaSemana": "presencial"|"remoto"|"ausente"|"libre" }
// Ej: { "10_lun": "remoto", "10_mar": "presencial" }

app.get('/api/presencialidad', (req, res) => {
  res.json(readJSON('presencialidad.json') || {})
})

app.patch('/api/presencialidad/:empId/:dia', (req, res) => {
  const pres  = readJSON('presencialidad.json') || {}
  const key   = `${req.params.empId}_${req.params.dia}`
  const valid = ['presencial', 'remoto', 'ausente', 'libre']
  if (!valid.includes(req.body.estado)) {
    return res.status(400).json({ error: `Estado inválido. Valores: ${valid.join(', ')}` })
  }
  pres[key] = req.body.estado
  writeJSON('presencialidad.json', pres)
  res.json({ key, estado: pres[key] })
})

app.put('/api/presencialidad', (req, res) => {
  writeJSON('presencialidad.json', req.body)
  res.json(req.body)
})

// ─── Fotos de empleados ───────────────────────────────────────────────────────
app.post('/api/photos/:empId', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

  // Actualizar el campo foto en empleados.json
  const empleados = readJSON('empleados.json') || []
  const idx = empleados.findIndex(e => String(e.id) === String(req.params.empId))
  if (idx !== -1) {
    empleados[idx].foto = req.file.filename
    writeJSON('empleados.json', empleados)
  }

  res.json({ filename: req.file.filename, url: `/uploads/photos/${req.file.filename}` })
})

app.delete('/api/photos/:empId', (req, res) => {
  const empleados = readJSON('empleados.json') || []
  const idx = empleados.findIndex(e => String(e.id) === String(req.params.empId))
  if (idx === -1) return res.status(404).json({ error: 'Empleado no encontrado' })

  const filename = empleados[idx].foto
  if (filename) {
    const filepath = path.join(PHOTOS_DIR, filename)
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    empleados[idx].foto = ''
    writeJSON('empleados.json', empleados)
  }

  res.json({ ok: true })
})

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 404 para rutas /api no encontradas ──────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' })
})

// ─── Ruta específica para dashboard vanilla ───────────────────────────────────
app.get('/vanilla', (req, res) => {
  res.sendFile(path.join(__dirname, 'vanilla-dashboard', 'index.html'))
})

// ─── Catch-all → index.html (React SPA fallback) ───────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message })
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  CI RRHH Dashboard`)
  console.log(`  ─────────────────────────────`)
  console.log(`  Local:   http://localhost:${PORT}`)
  console.log(`  API:     http://localhost:${PORT}/api`)
  console.log(`  Data:    ${DATA_DIR}`)
  console.log(`  Fotos:   ${PHOTOS_DIR}\n`)
})
