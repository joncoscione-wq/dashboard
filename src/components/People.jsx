import React, { useState, useEffect, useCallback } from 'react'
import { Users, MessageSquare, Calendar, Plus, Edit, Trash2, Search, X, Filter, Clock, User, FileText } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const CATEGORIAS_NOTA = ['General', 'Feedback', 'Advertencia', 'Reconocimiento', 'Administrativo', 'Otro']
const TIPOS_REUNION = ['General', 'Feedback', 'Performance', 'Onboarding', 'Disciplinaria', 'Otro']

const CATEGORIA_COLORS = {
  General:        'bg-gray-100 text-gray-700',
  Feedback:       'bg-blue-100 text-blue-800',
  Advertencia:    'bg-red-100 text-red-800',
  Reconocimiento: 'bg-green-100 text-green-800',
  Administrativo: 'bg-amber-100 text-amber-800',
  Otro:           'bg-slate-100 text-slate-700',
}

const TIPO_REUNION_COLORS = {
  General:       'bg-gray-100 text-gray-700',
  Feedback:      'bg-blue-100 text-blue-800',
  Performance:   'bg-purple-100 text-purple-800',
  Onboarding:    'bg-green-100 text-green-800',
  Disciplinaria: 'bg-red-100 text-red-800',
  Otro:          'bg-slate-100 text-slate-700',
}

const emptyNota = { emp_id: '', categoria: 'General', contenido: '' }
const emptyReunion = { emp_id: '', titulo: '', fecha: '', tipo: 'General', participantes: '', notas: '', acuerdos: '' }

const People = ({ employees }) => {
  const { showToast } = useToast()
  const [notas, setNotas] = useState([])
  const [reuniones, setReuniones] = useState([])
  const [loading, setLoading] = useState(true)

  // Vista: 'executive' | 'timeline' | 'reuniones'
  const [vista, setVista] = useState('executive')
  const [selectedEmp, setSelectedEmp] = useState(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [filterTipoReunion, setFilterTipoReunion] = useState('todos')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')

  // Modals
  const [showNotaModal, setShowNotaModal] = useState(false)
  const [showReunionModal, setShowReunionModal] = useState(false)
  const [editingReunion, setEditingReunion] = useState(null)

  // Forms
  const [notaForm, setNotaForm] = useState(emptyNota)
  const [reunionForm, setReunionForm] = useState(emptyReunion)

  const activeEmps = employees.filter(e => e.estado === 'Activo')

  const fetchData = useCallback(async () => {
    try {
      const [n, r] = await Promise.all([api.notes.getAll(), api.reuniones.getAll()])
      setNotas(n)
      setReuniones(r)
    } catch (err) {
      console.error('Error fetching people data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const empName = (id) => {
    const e = employees.find(e => e.id === Number(id))
    return e ? e.nombre : `Empleado #${id}`
  }

  // Stats por empleado
  const getEmpStats = (empId) => {
    const empNotas = notas.filter(n => n.emp_id === empId)
    const empReuniones = reuniones.filter(r => r.emp_id === empId)
    const feedbacks = empNotas.filter(n => n.categoria === 'Feedback').length
    return {
      notas: empNotas.length,
      reuniones: empReuniones.length,
      feedbacks
    }
  }

  // Handlers Notas
  const handleAddNota = async () => {
    try {
      const payload = { ...notaForm, emp_id: Number(notaForm.emp_id), contenido: notaForm.contenido.trim() }
      if (!payload.emp_id || !payload.contenido) return
      const newNota = await api.notes.create(payload)
      setShowNotaModal(false)
      setNotaForm(emptyNota)
      fetchData()
      showToast('Nota agregada', async () => { await api.notes.delete(newNota.id); fetchData() })
    } catch (err) {
      console.error('Error adding nota:', err)
    }
  }

  // Handlers Reuniones
  const openAddReunion = (empId = '') => {
    setReunionForm({ ...emptyReunion, emp_id: empId ? String(empId) : '', fecha: new Date().toISOString().slice(0, 16) })
    setEditingReunion(null)
    setShowReunionModal(true)
  }

  const openEditReunion = (r) => {
    setReunionForm({
      emp_id: r.emp_id ? String(r.emp_id) : '',
      titulo: r.titulo,
      fecha: r.fecha.slice(0, 16),
      tipo: r.tipo,
      participantes: r.participantes?.join(', ') ?? '',
      notas: r.notas ?? '',
      acuerdos: r.acuerdos ?? ''
    })
    setEditingReunion(r)
    setShowReunionModal(true)
  }

  const handleSaveReunion = async () => {
    try {
      const payload = {
        emp_id: reunionForm.emp_id ? Number(reunionForm.emp_id) : null,
        titulo: reunionForm.titulo.trim(),
        fecha: new Date(reunionForm.fecha).toISOString(),
        tipo: reunionForm.tipo,
        participantes: reunionForm.participantes ? reunionForm.participantes.split(',').map(p => p.trim()).filter(Boolean) : [],
        notas: reunionForm.notas.trim() || null,
        acuerdos: reunionForm.acuerdos.trim() || null
      }
      if (!payload.titulo || !payload.fecha) return

      if (editingReunion) {
        await api.reuniones.update(editingReunion.id, payload)
        showToast('Reunión actualizada', null)
      } else {
        const created = await api.reuniones.create(payload)
        showToast('Reunión registrada', async () => { await api.reuniones.delete(created.id); fetchData() })
      }
      setShowReunionModal(false)
      setReunionForm(emptyReunion)
      setEditingReunion(null)
      fetchData()
    } catch (err) {
      console.error('Error saving reunion:', err)
    }
  }

  const handleDeleteReunion = async (id) => {
    const previous = reuniones.find(r => r.id === id)
    try {
      await api.reuniones.delete(id)
      fetchData()
      if (previous) {
        const { id: _id, ...rData } = previous
        showToast('Reunión eliminada', async () => { await api.reuniones.create(rData); fetchData() })
      }
    } catch (err) {
      console.error('Error deleting reunion:', err)
    }
  }

  // Filtros
  const filteredEmps = activeEmps.filter(e => {
    const matchesSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredNotas = notas.filter(n => {
    const matchesEmp = !selectedEmp || n.emp_id === selectedEmp
    const matchesCategoria = filterCategoria === 'todos' || n.categoria === filterCategoria
    return matchesEmp && matchesCategoria
  })

  const filteredReuniones = reuniones.filter(r => {
    const matchesEmp = !selectedEmp || r.emp_id === selectedEmp
    const matchesTipo = filterTipoReunion === 'todos' || r.tipo === filterTipoReunion
    const matchesDesde = !filterFechaDesde || new Date(r.fecha) >= new Date(filterFechaDesde)
    const matchesHasta = !filterFechaHasta || new Date(r.fecha) <= new Date(filterFechaHasta)
    return matchesEmp && matchesTipo && matchesDesde && matchesHasta
  })

  // Modals
  const NotaModal = () => {
    if (!showNotaModal) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-[var(--ci-border)]">
            <h2 className="text-lg font-semibold text-[var(--ci-text)]">Nueva Nota</h2>
            <button onClick={() => setShowNotaModal(false)} className="text-[var(--ci-muted)] hover:text-[var(--ci-text)]"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Empleado *</label>
              <select value={notaForm.emp_id} onChange={e => setNotaForm({ ...notaForm, emp_id: e.target.value })} className="input-field">
                <option value="">Seleccionar empleado</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Categoría</label>
              <select value={notaForm.categoria} onChange={e => setNotaForm({ ...notaForm, categoria: e.target.value })} className="input-field">
                {CATEGORIAS_NOTA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Contenido *</label>
              <textarea value={notaForm.contenido} onChange={e => setNotaForm({ ...notaForm, contenido: e.target.value })} className="input-field" rows={4} />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 pt-0">
            <button onClick={() => setShowNotaModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleAddNota} className="btn-primary" disabled={!notaForm.emp_id || !notaForm.contenido.trim()}>Guardar</button>
          </div>
        </div>
      </div>
    )
  }

  const ReunionModal = () => {
    if (!showReunionModal) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-[var(--ci-border)]">
            <h2 className="text-lg font-semibold text-[var(--ci-text)]">{editingReunion ? 'Editar Reunión' : 'Nueva Reunión'}</h2>
            <button onClick={() => setShowReunionModal(false)} className="text-[var(--ci-muted)] hover:text-[var(--ci-text)]"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Empleado (opcional)</label>
              <select value={reunionForm.emp_id} onChange={e => setReunionForm({ ...reunionForm, emp_id: e.target.value })} className="input-field">
                <option value="">Reunión grupal (sin empleado específico)</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Título *</label>
              <input type="text" value={reunionForm.titulo} onChange={e => setReunionForm({ ...reunionForm, titulo: e.target.value })} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Fecha y hora *</label>
                <input type="datetime-local" value={reunionForm.fecha} onChange={e => setReunionForm({ ...reunionForm, fecha: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Tipo</label>
                <select value={reunionForm.tipo} onChange={e => setReunionForm({ ...reunionForm, tipo: e.target.value })} className="input-field">
                  {TIPOS_REUNION.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Participantes adicionales (separados por coma)</label>
              <input type="text" value={reunionForm.participantes} onChange={e => setReunionForm({ ...reunionForm, participantes: e.target.value })} className="input-field" placeholder="Ej: Juan, María, Gerente" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Notas</label>
              <textarea value={reunionForm.notas} onChange={e => setReunionForm({ ...reunionForm, notas: e.target.value })} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Acuerdos</label>
              <textarea value={reunionForm.acuerdos} onChange={e => setReunionForm({ ...reunionForm, acuerdos: e.target.value })} className="input-field" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 pt-0">
            <button onClick={() => setShowReunionModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSaveReunion} className="btn-primary" disabled={!reunionForm.titulo.trim() || !reunionForm.fecha}>Guardar</button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">People</h1>
          <p className="text-[var(--ci-muted)] mt-1">Notas, feedbacks y reuniones por empleado</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setNotaForm(emptyNota); setShowNotaModal(true) }} className="btn-secondary flex items-center space-x-2">
            <MessageSquare size={16} />
            <span>Nueva Nota</span>
          </button>
          <button onClick={() => openAddReunion()} className="btn-primary flex items-center space-x-2">
            <Calendar size={16} />
            <span>Nueva Reunión</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--ci-border)]">
        {[
          { key: 'executive', label: 'Resumen Ejecutivo', icon: Users },
          { key: 'timeline', label: 'Timeline', icon: Clock },
          { key: 'reuniones', label: 'Reuniones', icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setVista(key); setSelectedEmp(null) }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              vista === key
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ci-muted)] hover:text-[var(--ci-text)]'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Vista: Resumen Ejecutivo ────────────────────────────────────────────── */}
      {vista === 'executive' && (
        <div className="space-y-4">
          <div className="card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" size={16} />
              <input type="text" placeholder="Buscar empleado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9" />
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-[var(--ci-bg)] border-b border-[var(--ci-border)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide">Empleado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide">Notas</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide">Feedbacks</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide">Reuniones</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ci-border)]">
                {filteredEmps.map(emp => {
                  const stats = getEmpStats(emp.id)
                  return (
                    <tr key={emp.id} className="hover:bg-[var(--ci-bg)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[var(--accent-bg)] rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-[var(--accent)]">{emp.nombre.split(',')[0].charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--ci-text)]">{emp.nombre}</p>
                            <p className="text-xs text-[var(--ci-muted)]">{emp.puesto}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${stats.notas > 0 ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'bg-gray-100 text-gray-400'}`}>
                          {stats.notas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${stats.feedbacks > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                          {stats.feedbacks}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${stats.reuniones > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-400'}`}>
                          {stats.reuniones}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelectedEmp(emp.id); setVista('timeline') }} className="text-[var(--accent)] hover:underline text-sm font-medium">
                          Ver timeline
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredEmps.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[var(--ci-muted)]">No se encontraron empleados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Vista: Timeline ──────────────────────────────────────────────────────── */}
      {vista === 'timeline' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <select value={selectedEmp || ''} onChange={e => setSelectedEmp(e.target.value ? Number(e.target.value) : null)} className="input-field">
                <option value="">Todos los empleados</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="input-field">
                <option value="todos">Todas las categorías</option>
                {CATEGORIAS_NOTA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={() => { setNotaForm({ ...emptyNota, emp_id: selectedEmp ? String(selectedEmp) : '' }); setShowNotaModal(true) }} className="btn-secondary flex items-center gap-2">
              <Plus size={14} /> Agregar nota
            </button>
          </div>

          <div className="space-y-3">
            {filteredNotas.length === 0 && (
              <div className="card text-center py-10">
                <FileText size={40} className="mx-auto text-[var(--ci-muted)] mb-3" />
                <p className="text-[var(--ci-muted)]">No se encontraron notas</p>
              </div>
            )}
            {filteredNotas.map(nota => (
              <div key={nota.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-semibold text-[var(--ci-text)]">{empName(nota.emp_id)}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORIA_COLORS[nota.categoria] ?? 'bg-gray-100 text-gray-700'}`}>{nota.categoria}</span>
                      <span className="text-xs text-[var(--ci-muted)]">
                        {new Date(nota.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--ci-text)] whitespace-pre-wrap">{nota.contenido}</p>
                  </div>
                  <button onClick={() => api.notes.delete(nota.id).then(fetchData)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vista: Reuniones ─────────────────────────────────────────────────────── */}
      {vista === 'reuniones' && (
        <div className="space-y-4">
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" size={16} />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9" />
              </div>
              <select value={selectedEmp || ''} onChange={e => setSelectedEmp(e.target.value ? Number(e.target.value) : null)} className="input-field">
                <option value="">Todos los empleados</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <select value={filterTipoReunion} onChange={e => setFilterTipoReunion(e.target.value)} className="input-field">
                <option value="todos">Todos los tipos</option>
                {TIPOS_REUNION.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)} className="input-field" placeholder="Desde" />
                <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)} className="input-field" placeholder="Hasta" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredReuniones.length === 0 && (
              <div className="card text-center py-10">
                <Calendar size={40} className="mx-auto text-[var(--ci-muted)] mb-3" />
                <p className="text-[var(--ci-muted)]">No se encontraron reuniones</p>
              </div>
            )}
            {filteredReuniones.map(reunion => (
              <div key={reunion.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-semibold text-[var(--ci-text)]">{reunion.titulo}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${TIPO_REUNION_COLORS[reunion.tipo] ?? 'bg-gray-100 text-gray-700'}`}>{reunion.tipo}</span>
                      {reunion.emp_id && (
                        <span className="text-xs text-[var(--ci-muted)]">· {empName(reunion.emp_id)}</span>
                      )}
                      <span className="text-xs text-[var(--ci-muted)]">
                        {new Date(reunion.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {reunion.participantes && reunion.participantes.length > 0 && (
                      <p className="text-sm text-[var(--ci-muted)] mb-1">
                        <span className="font-medium">Participantes:</span> {reunion.participantes.join(', ')}
                      </p>
                    )}
                    {reunion.notas && <p className="text-sm text-[var(--ci-text)] mb-1">{reunion.notas}</p>}
                    {reunion.acuerdos && (
                      <p className="text-sm text-[var(--ci-green)]">
                        <span className="font-medium">Acuerdos:</span> {reunion.acuerdos}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <button onClick={() => openEditReunion(reunion)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDeleteReunion(reunion.id)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NotaModal />
      <ReunionModal />
    </div>
  )
}

export default People
