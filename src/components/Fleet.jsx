import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, Smartphone } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const Fleet = () => {
  const [lines, setLines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLine, setSelectedLine] = useState(null)
  const [loading, setLoading] = useState(true)

  const { showToast } = useToast()

  const emptyForm = { numero: '', rol: '', usuario: '', equipo: '' }
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => { fetchLines() }, [])

  const fetchLines = async () => {
    try {
      const data = await api.fleet.getAll()
      setLines(data)
    } catch (error) {
      console.error('Error fetching fleet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const newLine = await api.fleet.create(formData)
      setShowAddModal(false)
      setFormData(emptyForm)
      fetchLines()
      showToast('Línea agregada', async () => { await api.fleet.delete(newLine.id); fetchLines() })
    } catch (error) {
      console.error('Error adding line:', error)
    }
  }

  const handleEdit = async () => {
    try {
      const previous = { ...selectedLine }
      await api.fleet.update(selectedLine.id, formData)
      setShowEditModal(false)
      setSelectedLine(null)
      setFormData(emptyForm)
      fetchLines()
      showToast('Línea actualizada', async () => {
        const { id: prevId, ...prevData } = previous
        await api.fleet.update(prevId, prevData)
        fetchLines()
      })
    } catch (error) {
      console.error('Error updating line:', error)
    }
  }

  const handleDelete = async (id) => {
    const previous = lines.find(l => l.id === id)
    try {
      await api.fleet.delete(id)
      fetchLines()
      if (previous) {
        const { id: _id, ...lineData } = previous
        showToast('Línea eliminada', async () => { await api.fleet.create(lineData); fetchLines() })
      }
    } catch (error) {
      console.error('Error deleting line:', error)
    }
  }

  const openEdit = (line) => {
    setSelectedLine(line)
    setFormData(line)
    setShowEditModal(true)
  }

  const filtered = lines.filter(l =>
    [l.numero, l.rol, l.usuario, l.equipo]
      .some(v => (v ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const LineModal = ({ isOpen, onClose, title, onSubmit }) => {
    if (!isOpen) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--ci-text)]">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Número</label>
                <input
                  type="tel"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="input-field"
                  placeholder="Ej: 1123117902"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Rol</label>
                <input
                  type="text"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Asesoramiento 1, Compliance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Usuario</label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  className="input-field"
                  placeholder="Iniciales o nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Equipo</label>
                <input
                  type="text"
                  value={formData.equipo}
                  onChange={(e) => setFormData({ ...formData, equipo: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Samsung Galaxy A04"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">
                Cancelar
              </button>
              <button onClick={onSubmit} className="btn-primary">Guardar</button>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Flota Móvil</h1>
          <p className="text-[var(--ci-muted)] mt-1">Líneas Movistar de la empresa</p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setShowAddModal(true) }}
          className="btn-primary flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={20} />
          <span>Nueva Línea</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-[var(--ci-muted)]">Total líneas</p>
          <p className="text-2xl font-bold text-[var(--ci-text)] mt-1">{lines.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--ci-muted)]">Asignadas</p>
          <p className="text-2xl font-bold text-[var(--ci-green)] mt-1">
            {lines.filter(l => l.usuario && l.usuario !== '-').length}
          </p>
        </div>
        <div className="card col-span-2 sm:col-span-1">
          <p className="text-sm text-[var(--ci-muted)]">Sin asignar</p>
          <p className="text-2xl font-bold text-[var(--ci-amber)] mt-1">
            {lines.filter(l => !l.usuario || l.usuario === '-').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" size={18} />
          <input
            type="text"
            placeholder="Buscar número, usuario, equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--ci-border)] bg-[var(--ci-bg)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--ci-muted)] uppercase text-xs tracking-wide">Número</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--ci-muted)] uppercase text-xs tracking-wide">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--ci-muted)] uppercase text-xs tracking-wide hidden sm:table-cell">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--ci-muted)] uppercase text-xs tracking-wide hidden md:table-cell">Equipo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((line) => (
                <tr key={line.id} className="border-b border-[var(--ci-border)] hover:bg-[var(--ci-bg)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-[var(--accent-bg)] rounded-lg flex items-center justify-center shrink-0">
                        <Smartphone size={14} className="text-[var(--accent)]" />
                      </div>
                      <span className="font-medium text-[var(--ci-text)]">{line.numero}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--ci-text)]">{line.rol || '—'}</td>
                  <td className="px-4 py-3 text-[var(--ci-text)] hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      line.usuario && line.usuario !== '-'
                        ? 'bg-[var(--ci-green-bg)] text-[var(--ci-green)]'
                        : 'bg-[var(--ci-border)] text-[var(--ci-muted)]'
                    }`}>
                      {line.usuario || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--ci-muted)] hidden md:table-cell">{line.equipo || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => openEdit(line)}
                        className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(line.id)}
                        className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--ci-muted)]">
                    No se encontraron líneas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LineModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nueva Línea" onSubmit={handleAdd} />
      <LineModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedLine(null) }} title="Editar Línea" onSubmit={handleEdit} />
    </div>
  )
}

export default Fleet
