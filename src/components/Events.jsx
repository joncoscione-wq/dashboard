import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Edit, Trash2, Search, Filter, X, Clock } from 'lucide-react'
import { api } from '../config/api'

const EVENT_TYPES = {
  General:       { label: 'General',       color: 'bg-blue-100 text-blue-800' },
  Corporativo:   { label: 'Corporativo',   color: 'bg-indigo-100 text-indigo-800' },
  Feriado:       { label: 'Feriado',       color: 'bg-red-100 text-red-800' },
  Capacitación:  { label: 'Capacitación',  color: 'bg-green-100 text-green-800' },
  Reunión:       { label: 'Reunión',       color: 'bg-purple-100 text-purple-800' },
  Cumpleaños:    { label: 'Cumpleaños',    color: 'bg-yellow-100 text-yellow-800' },
}

const emptyForm = { nombre: '', fecha: '', tipo: 'General', notas: '' }

const Events = () => {
  const [events, setEvents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterMonth, setFilterMonth] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    try {
      const data = await api.events.getAll()
      setEvents(data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      await api.events.create(formData)
      setShowAddModal(false)
      setFormData(emptyForm)
      fetchEvents()
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const handleEdit = async () => {
    try {
      await api.events.update(selectedEvent.id, formData)
      setShowEditModal(false)
      setSelectedEvent(null)
      setFormData(emptyForm)
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await api.events.delete(id)
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const openEdit = (event) => {
    setSelectedEvent(event)
    setFormData({ nombre: event.nombre, fecha: event.fecha, tipo: event.tipo, notas: event.notas ?? '' })
    setShowEditModal(true)
  }

  const filtered = events.filter(event => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = (event.nombre ?? '').toLowerCase().includes(search) ||
                          (event.notas ?? '').toLowerCase().includes(search)
    const matchesType = filterType === 'todos' || event.tipo === filterType
    let matchesMonth = filterMonth === 'todos'
    if (filterMonth !== 'todos') {
      matchesMonth = new Date(event.fecha).getMonth() === parseInt(filterMonth)
    }
    return matchesSearch && matchesType && matchesMonth
  })

  const upcomingEvents = events.filter(e => new Date(e.fecha) >= new Date()).slice(0, 5)
  const monthEvents = events.filter(e => {
    const d = new Date(e.fecha)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const EventModal = ({ isOpen, onClose, title, onSubmit }) => {
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
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="input-field"
                  >
                    {Object.keys(EVENT_TYPES).map(k => (
                      <option key={k} value={k}>{EVENT_TYPES[k].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="input-field"
                  rows={3}
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
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Eventos</h1>
          <p className="text-[var(--ci-muted)] mt-1">Calendario de eventos de la empresa</p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setShowAddModal(true) }}
          className="btn-primary flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={20} />
          <span>Nuevo Evento</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: events.length, color: 'text-[var(--ci-text)]' },
          { label: 'Este mes', value: monthEvents.length, color: 'text-[var(--ci-green)]' },
          { label: 'Próximos', value: upcomingEvents.length, color: 'text-[var(--accent)]' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-sm text-[var(--ci-muted)]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" size={18} />
            <input
              type="text"
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field">
            <option value="todos">Todos los tipos</option>
            {Object.keys(EVENT_TYPES).map(k => (
              <option key={k} value={k}>{EVENT_TYPES[k].label}</option>
            ))}
          </select>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input-field">
            <option value="todos">Todos los meses</option>
            {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-[var(--ci-muted)] mt-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events list */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((event) => {
            const typeInfo = EVENT_TYPES[event.tipo] ?? EVENT_TYPES.General
            const isPast = new Date(event.fecha) < new Date()
            return (
              <div key={event.id} className={`card ${isPast ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--ci-text)] truncate">{event.nombre}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${typeInfo.color}`}>{typeInfo.label}</span>
                      {isPast && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 shrink-0">Finalizado</span>}
                    </div>
                    {event.notas && <p className="text-sm text-[var(--ci-muted)] mb-2">{event.notas}</p>}
                    <div className="flex items-center space-x-1 text-sm text-[var(--ci-muted)]">
                      <Calendar size={13} />
                      <span>{event.fecha}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <button onClick={() => openEdit(event)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="card text-center py-10">
              <Calendar size={40} className="mx-auto text-[var(--ci-muted)] mb-3" />
              <p className="text-[var(--ci-muted)]">No se encontraron eventos</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-base font-semibold text-[var(--ci-text)] mb-3">Próximos</h3>
            <div className="space-y-2">
              {upcomingEvents.map(event => {
                const typeInfo = EVENT_TYPES[event.tipo] ?? EVENT_TYPES.General
                return (
                  <div key={event.id} className="p-3 bg-[var(--ci-bg)] rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                    </div>
                    <p className="font-medium text-[var(--ci-text)] text-sm">{event.nombre}</p>
                    <p className="text-xs text-[var(--ci-muted)] mt-0.5">{event.fecha}</p>
                  </div>
                )
              })}
              {upcomingEvents.length === 0 && <p className="text-[var(--ci-muted)] text-sm text-center py-3">Sin eventos próximos</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-[var(--ci-text)] mb-3">Por tipo</h3>
            <div className="space-y-2">
              {Object.entries(EVENT_TYPES).map(([key, type]) => {
                const count = events.filter(e => e.tipo === key).length
                if (count === 0) return null
                return (
                  <div key={key} className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${type.color}`}>{type.label}</span>
                    <span className="text-sm font-medium text-[var(--ci-text)]">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <EventModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nuevo Evento" onSubmit={handleAdd} />
      <EventModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedEvent(null) }} title="Editar Evento" onSubmit={handleEdit} />
    </div>
  )
}

export default Events
