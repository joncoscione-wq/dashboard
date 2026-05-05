import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, Plus, Upload, Trash2, Edit, CheckCircle, XCircle, Clock, Users, Search, X, FileText, AlertCircle } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const CATEGORIAS = ['Manual', 'Política', 'Reglamento', 'Procedimiento', 'Otro']

const CATEGORIA_COLORS = {
  Manual:       'bg-blue-100 text-blue-800',
  Política:     'bg-purple-100 text-purple-800',
  Reglamento:   'bg-amber-100 text-amber-800',
  Procedimiento: 'bg-green-100 text-green-800',
  Otro:         'bg-gray-100 text-gray-700',
}

const emptyDoc = { titulo: '', descripcion: '', categoria: 'Manual', archivo_url: '', obligatorio: false }

const Induccion = ({ employees }) => {
  const { showToast } = useToast()
  const [docs, setDocs] = useState([])
  const [progreso, setProgreso] = useState([])
  const [loading, setLoading] = useState(true)

  // Vista: 'biblioteca' | 'tracking'
  const [vista, setVista] = useState('biblioteca')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [filterEmp, setFilterEmp] = useState('')

  // Modals
  const [showDocModal, setShowDocModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [docForm, setDocForm] = useState(emptyDoc)

  const activeEmps = employees.filter(e => e.estado === 'Activo')

  const fetchData = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([api.induccionDocs.getAll(), api.induccionProgreso.getAll()])
      setDocs(d)
      setProgreso(p)
    } catch (err) {
      console.error('Error fetching induccion data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const empName = (id) => {
    const e = employees.find(e => e.id === Number(id))
    return e ? e.nombre : `Empleado #${id}`
  }

  // CRUD Documentos
  const openAddDoc = () => {
    setDocForm(emptyDoc)
    setEditingDoc(null)
    setShowDocModal(true)
  }

  const openEditDoc = (doc) => {
    setDocForm({
      titulo: doc.titulo,
      descripcion: doc.descripcion ?? '',
      categoria: doc.categoria,
      archivo_url: doc.archivo_url ?? '',
      obligatorio: doc.obligatorio
    })
    setEditingDoc(doc)
    setShowDocModal(true)
  }

  const handleSaveDoc = async () => {
    try {
      const payload = {
        titulo: docForm.titulo.trim(),
        descripcion: docForm.descripcion.trim() || null,
        categoria: docForm.categoria,
        archivo_url: docForm.archivo_url.trim() || null,
        obligatorio: docForm.obligatorio
      }
      if (!payload.titulo) return

      if (editingDoc) {
        await api.induccionDocs.update(editingDoc.id, payload)
        showToast('Documento actualizado', null)
      } else {
        const created = await api.induccionDocs.create(payload)
        showToast('Documento agregado', async () => {
          await api.induccionDocs.delete(created.id)
          setDocs(prev => prev.filter(d => d.id !== created.id))
        })
      }
      setShowDocModal(false)
      setDocForm(emptyDoc)
      setEditingDoc(null)
      fetchData()
    } catch (err) {
      console.error('Error saving doc:', err)
    }
  }

  const handleDeleteDoc = async (doc) => {
    const snap = [...docs]
    setDocs(prev => prev.filter(d => d.id !== doc.id))
    showToast(`"${doc.titulo}" eliminado`, async () => {
      await api.induccionDocs.create({ ...doc, id: undefined })
      setDocs(snap)
    })
    try { await api.induccionDocs.delete(doc.id) } catch (err) { setDocs(snap); console.error(err) }
  }

  // Asignar documento a empleado
  const handleAssignToEmp = async (docId, empId) => {
    try {
      await api.induccionProgreso.assign({ doc_id: docId, emp_id: Number(empId) })
      fetchData()
      showToast('Documento asignado', null)
    } catch (err) {
      console.error('Error assigning doc:', err)
    }
  }

  // Marcar como completado
  const handleToggleComplete = async (progId, completed) => {
    try {
      await api.induccionProgreso.update(progId, {
        completado: completed,
        fecha_completado: completed ? new Date().toISOString().split('T')[0] : null
      })
      fetchData()
      showToast(completed ? 'Marcado como completado' : 'Marcado como pendiente', null)
    } catch (err) {
      console.error('Error updating progreso:', err)
    }
  }

  // Asignación masiva de obligatorios a empleado nuevo
  const handleAssignAllObligatory = async (empId) => {
    try {
      const obligatorios = docs.filter(d => d.obligatorio)
      for (const doc of obligatorios) {
        await api.induccionProgreso.assign({ doc_id: doc.id, emp_id: Number(empId) })
      }
      fetchData()
      showToast(`${obligatorios.length} documentos obligatorios asignados`, null)
    } catch (err) {
      console.error('Error assigning all:', err)
    }
  }

  // Filtros
  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = filterCategoria === 'todos' || d.categoria === filterCategoria
    return matchesSearch && matchesCategoria
  })

  const filteredEmps = activeEmps.filter(e => {
    if (filterEmp && String(e.id) !== filterEmp) return false
    return true
  })

  // Matriz de progreso
  const getProgresoFor = (docId, empId) => {
    return progreso.find(p => p.doc_id === docId && p.emp_id === empId)
  }

  // Stats
  const totalDocs = docs.length
  const obligatorios = docs.filter(d => d.obligatorio).length
  const totalAsignaciones = progreso.length
  const completados = progreso.filter(p => p.completado).length

  // Modal Documento
  const DocModal = () => {
    if (!showDocModal) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-[var(--ci-border)]">
            <h2 className="text-lg font-semibold text-[var(--ci-text)]">{editingDoc ? 'Editar Documento' : 'Nuevo Documento'}</h2>
            <button onClick={() => setShowDocModal(false)} className="text-[var(--ci-muted)] hover:text-[var(--ci-text)]"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Título *</label>
              <input type="text" value={docForm.titulo} onChange={e => setDocForm({ ...docForm, titulo: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Categoría</label>
              <select value={docForm.categoria} onChange={e => setDocForm({ ...docForm, categoria: e.target.value })} className="input-field">
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Descripción</label>
              <textarea value={docForm.descripcion} onChange={e => setDocForm({ ...docForm, descripcion: e.target.value })} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">URL del archivo (bucket induction-docs)</label>
              <input type="text" value={docForm.archivo_url} onChange={e => setDocForm({ ...docForm, archivo_url: e.target.value })} className="input-field" placeholder="https://..." />
              <p className="text-xs text-[var(--ci-muted)] mt-1">Sube el archivo al bucket "induction-docs" en Supabase Storage y pega la URL pública aquí.</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="obligatorio" checked={docForm.obligatorio} onChange={e => setDocForm({ ...docForm, obligatorio: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="obligatorio" className="text-sm text-[var(--ci-text)]">Documento obligatorio para nuevos empleados</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 pt-0">
            <button onClick={() => setShowDocModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSaveDoc} className="btn-primary" disabled={!docForm.titulo.trim()}>Guardar</button>
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
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Inducción</h1>
          <p className="text-[var(--ci-muted)] mt-1">Biblioteca de documentos y tracking de lectura</p>
        </div>
        <button onClick={openAddDoc} className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>Nuevo Documento</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Documentos', value: totalDocs, icon: BookOpen, color: 'var(--accent)' },
          { label: 'Obligatorios', value: obligatorios, icon: AlertCircle, color: 'var(--ci-amber)' },
          { label: 'Asignaciones', value: totalAsignaciones, icon: Users, color: 'var(--primary)' },
          { label: 'Completados', value: completados, icon: CheckCircle, color: 'var(--ci-green)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderLeft: '3px solid ' + s.color }}>
            <div className="flex items-center gap-2">
              <s.icon size={16} style={{ color: s.color }} />
              <p className="text-xs text-[var(--ci-muted)] uppercase font-poppins">{s.label}</p>
            </div>
            <p className="text-3xl font-bold font-poppins mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--ci-border)]">
        {[
          { key: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
          { key: 'tracking', label: 'Tracking', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setVista(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              vista === key
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ci-muted)] hover:text-[var(--ci-text)]'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Vista: Biblioteca ───────────────────────────────────────────────────── */}
      {vista === 'biblioteca' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" />
                <input className="input-field w-full pl-9" placeholder="Buscar documento..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <select className="input-field" value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}>
                <option value="todos">Todas las categorías</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredDocs.length === 0 && (
              <div className="card text-center py-10">
                <FileText size={40} className="mx-auto text-[var(--ci-muted)] mb-3" />
                <p className="text-[var(--ci-muted)]">No se encontraron documentos</p>
              </div>
            )}
            {filteredDocs.map(doc => (
              <div key={doc.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-semibold text-[var(--ci-text)]">{doc.titulo}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORIA_COLORS[doc.categoria] ?? 'bg-gray-100 text-gray-700'}`}>{doc.categoria}</span>
                      {doc.obligatorio && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--ci-amber-bg)] text-[var(--ci-amber)]">Obligatorio</span>
                      )}
                    </div>
                    {doc.descripcion && <p className="text-sm text-[var(--ci-muted)] mb-1">{doc.descripcion}</p>}
                    {doc.archivo_url && (
                      <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1">
                        <FileText size={14} /> Ver documento
                      </a>
                    )}
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <button onClick={() => openEditDoc(doc)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDeleteDoc(doc)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vista: Tracking ─────────────────────────────────────────────────────── */}
      {vista === 'tracking' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-wrap">
                <select className="input-field" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
                  <option value="">Todos los empleados</option>
                  {activeEmps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)})
                </select>
              </div>
              <div className="text-sm text-[var(--ci-muted)]">
                {filteredEmps.length} empleado{filteredEmps.length !== 1 ? 's' : ''} · {docs.length} documento{docs.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-[var(--ci-bg)] border-b border-[var(--ci-border)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide sticky left-0 bg-[var(--ci-bg)]">Empleado</th>
                  {docs.map(doc => (
                    <th key={doc.id} className="text-center px-3 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="truncate max-w-[100px]">{doc.titulo}</span>
                        {doc.obligatorio && <span className="text-[10px] text-[var(--ci-amber)]">(Oblig)</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ci-border)]">
                {filteredEmps.map(emp => (
                  <tr key={emp.id} className="hover:bg-[var(--ci-bg)] transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-[var(--ci-bg)] transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[var(--accent-bg)] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[var(--accent)]">{emp.nombre.split(',')[0].charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--ci-text)] truncate">{emp.nombre}</p>
                          <p className="text-xs text-[var(--ci-muted)]">{emp.puesto}</p>
                        </div>
                      </div>
                    </td>
                    {docs.map(doc => {
                      const prog = getProgresoFor(doc.id, emp.id)
                      return (
                        <td key={doc.id} className="px-3 py-3 text-center">
                          {prog ? (
                            <button
                              onClick={() => handleToggleComplete(prog.id, !prog.completado)}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                prog.completado
                                  ? 'bg-[var(--ci-green-bg)] text-[var(--ci-green)]'
                                  : 'bg-[var(--ci-amber-bg)] text-[var(--ci-amber)]'
                              }`}
                              title={prog.completado ? 'Completado' : 'Pendiente'}
                            >
                              {prog.completado ? <CheckCircle size={16} /> : <Clock size={16} />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignToEmp(doc.id, emp.id)}
                              className="text-[var(--ci-muted)] hover:text-[var(--accent)] transition-colors"
                              title="Asignar documento"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {filteredEmps.length === 0 && (
                  <tr><td colSpan={docs.length + 1} className="text-center py-8 text-[var(--ci-muted)]">No se encontraron empleados</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Asignación masiva */}
          <div className="card bg-[var(--accent-bg)] border border-[var(--accent)]/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--accent)]">Asignación masiva</p>
                <p className="text-xs text-[var(--accent)]/80">Asignar todos los documentos obligatorios a un empleado nuevo</p>
              </div>
              <div className="flex gap-2">
                <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} className="input-field">
                  <option value="">Seleccionar empleado...</option>
                  {activeEmps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)})
                </select>
                <button
                  onClick={() => filterEmp && handleAssignAllObligatory(filterEmp)}
                  disabled={!filterEmp}
                  className="btn-primary flex items-center gap-2"
                >
                  <Upload size={14} /> Asignar todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DocModal />
    </div>
  )
}

export default Induccion
