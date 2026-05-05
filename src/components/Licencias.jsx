import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, FileText } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const TIPOS = ['Vacaciones','Médica','Estudio','Personal','Maternidad','Paternidad','Duelo','Otro']
const ESTADOS = ['Pendiente','Aprobada','Rechazada']

const TIPO_COLORS = {
  Vacaciones: 'bg-amber-100 text-amber-800',
  Médica:     'bg-red-100 text-red-800',
  Estudio:    'bg-blue-100 text-blue-800',
  Personal:   'bg-purple-100 text-purple-800',
  Maternidad: 'bg-pink-100 text-pink-800',
  Paternidad: 'bg-indigo-100 text-indigo-800',
  Duelo:      'bg-gray-100 text-gray-700',
  Otro:       'bg-slate-100 text-slate-700',
}

const ESTADO_COLORS = {
  Pendiente:  'bg-[var(--ci-amber-bg)] text-[var(--ci-amber)]',
  Aprobada:   'bg-[var(--ci-green-bg)] text-[var(--ci-green)]',
  Rechazada:  'bg-[var(--ci-red-bg)] text-[var(--ci-red)]',
}

const emptyForm = { emp_id: '', tipo: 'Vacaciones', desde: '', hasta: '', dias: '', certificado: 'No', estado: 'Pendiente', notas: '' }

const Licencias = ({ employees }) => {
  const [licencias, setLicencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLicencia, setSelectedLicencia] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const { showToast } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const data = await api.licencias.getAll()
      setLicencias(data)
    } catch (error) {
      console.error('Error fetching licencias:', error)
    } finally {
      setLoading(false)
    }
  }

  const empName = (id) => {
    const e = employees.find(e => e.id === Number(id))
    return e ? e.nombre : `Empleado #${id}`
  }

  const calcDias = (desde, hasta) => {
    if (!desde || !hasta) return ''
    const diff = Math.ceil((new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diff)
  }

  const handleDateChange = (field, value) => {
    const updated = { ...formData, [field]: value }
    updated.dias = calcDias(updated.desde, updated.hasta)
    setFormData(updated)
  }

  const handleAdd = async () => {
    try {
      const payload = { ...formData, emp_id: Number(formData.emp_id), dias: calcDias(formData.desde, formData.hasta) || null }
      const newLic = await api.licencias.create(payload)
      setShowAddModal(false)
      setFormData(emptyForm)
      fetchData()
      showToast('Licencia agregada', async () => { await api.licencias.delete(newLic.id); fetchData() })
    } catch (error) {
      console.error('Error adding licencia:', error)
    }
  }

  const handleEdit = async () => {
    try {
      const previous = { ...selectedLicencia }
      const payload = { ...formData, emp_id: Number(formData.emp_id), dias: calcDias(formData.desde, formData.hasta) || null }
      await api.licencias.update(selectedLicencia.id, payload)
      setShowEditModal(false)
      setSelectedLicencia(null)
      setFormData(emptyForm)
      fetchData()
      showToast('Licencia actualizada', async () => {
        const { id: prevId, ...prevData } = previous
        await api.licencias.update(prevId, prevData)
        fetchData()
      })
    } catch (error) {
      console.error('Error updating licencia:', error)
    }
  }

  const handleDelete = async (id) => {
    const previous = licencias.find(l => l.id === id)
    try {
      await api.licencias.delete(id)
      fetchData()
      if (previous) {
        const { id: _id, ...licData } = previous
        showToast('Licencia eliminada', async () => { await api.licencias.create(licData); fetchData() })
      }
    } catch (error) {
      console.error('Error deleting licencia:', error)
    }
  }

  const openEdit = (lic) => {
    setSelectedLicencia(lic)
    setFormData({
      emp_id: String(lic.emp_id),
      tipo: lic.tipo,
      desde: lic.desde,
      hasta: lic.hasta,
      dias: lic.dias ?? '',
      certificado: lic.certificado,
      estado: lic.estado,
      notas: lic.notas ?? '',
    })
    setShowEditModal(true)
  }

  const now = new Date()
  const activasHoy = licencias.filter(l =>
    l.estado === 'Aprobada' && new Date(l.desde) <= now && new Date(l.hasta) >= now
  )
  const pendientes = licencias.filter(l => l.estado === 'Pendiente')

  const filtered = licencias.filter(l => {
    const name = empName(l.emp_id).toLowerCase()
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
                          (l.notas ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo   = filterTipo === 'todos' || l.tipo === filterTipo
    const matchesEstado = filterEstado === 'todos' || l.estado === filterEstado
    return matchesSearch && matchesTipo && matchesEstado
  })

  const LicenciaModal = ({ isOpen, onClose, title, onSubmit }) => {
    if (!isOpen) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--ci-text)]">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Empleado</label>
                <select value={formData.emp_id} onChange={e => setFormData({ ...formData, emp_id: e.target.value })} className="input-field">
                  <option value="">Seleccionar empleado</option>
                  {employees.filter(e => e.estado === 'Activo').map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Tipo</label>
                  <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="input-field">
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className="input-field">
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Desde</label>
                  <input type="date" value={formData.desde} onChange={e => handleDateChange('desde', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Hasta</label>
                  <input type="date" value={formData.hasta} onChange={e => handleDateChange('hasta', e.target.value)} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Días</label>
                  <input type="number" value={formData.dias} onChange={e => setFormData({ ...formData, dias: e.target.value })} className="input-field" placeholder="Auto" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Certificado</label>
                  <select value={formData.certificado} onChange={e => setFormData({ ...formData, certificado: e.target.value })} className="input-field">
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Notas</label>
                <textarea value={formData.notas} onChange={e => setFormData({ ...formData, notas: e.target.value })} className="input-field" rows={2} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">Cancelar</button>
              <button onClick={onSubmit} className="btn-primary" disabled={!formData.emp_id || !formData.desde || !formData.hasta}>Guardar</button>
            </div>
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Licencias</h1>
          <p className="text-[var(--ci-muted)] mt-1">Vacaciones, ausencias y licencias especiales</p>
        </div>
        <button onClick={() => { setFormData(emptyForm); setShowAddModal(true) }} className="btn-primary flex items-center space-x-2 self-start sm:self-auto">
          <Plus size={20} />
          <span>Nueva Licencia</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total',        value: licencias.length,   color: 'text-[var(--ci-text)]' },
          { label: 'Activas hoy',  value: activasHoy.length,  color: 'text-[var(--ci-green)]' },
          { label: 'Pendientes',   value: pendientes.length,  color: 'text-[var(--ci-amber)]' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-sm text-[var(--ci-muted)]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" size={16} />
            <input type="text" placeholder="Buscar empleado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9" />
          </div>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="input-field">
            <option value="todos">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input-field">
            <option value="todos">Todos los estados</option>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <p className="text-sm text-[var(--ci-muted)] mt-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {filtered.map(lic => (
          <div key={lic.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--ci-text)]">{empName(lic.emp_id)}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${TIPO_COLORS[lic.tipo] ?? 'bg-gray-100 text-gray-700'}`}>{lic.tipo}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${ESTADO_COLORS[lic.estado]}`}>{lic.estado}</span>
                  {lic.certificado === 'Sí' && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--accent-bg)] text-[var(--accent)] shrink-0">Certificado</span>
                  )}
                </div>
                <p className="text-sm text-[var(--ci-muted)]">
                  {lic.desde} → {lic.hasta}
                  {lic.dias ? ` · ${lic.dias} día${lic.dias !== 1 ? 's' : ''}` : ''}
                </p>
                {lic.notas && <p className="text-sm text-[var(--ci-muted)] mt-1 truncate">{lic.notas}</p>}
              </div>
              <div className="flex space-x-1 shrink-0">
                <button onClick={() => openEdit(lic)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors">
                  <Edit size={15} />
                </button>
                <button onClick={() => handleDelete(lic.id)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <FileText size={40} className="mx-auto text-[var(--ci-muted)] mb-3" />
            <p className="text-[var(--ci-muted)]">No se encontraron licencias</p>
          </div>
        )}
      </div>

      <LicenciaModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nueva Licencia" onSubmit={handleAdd} />
      <LicenciaModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedLicencia(null) }} title="Editar Licencia" onSubmit={handleEdit} />
    </div>
  )
}

export default Licencias
