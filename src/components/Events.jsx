import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Edit, Trash2, Search, Filter, X, MapPin, Clock, Users } from 'lucide-react'
import { api } from '../config/api'

const Events = () => {
  const [events, setEvents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterMonth, setFilterMonth] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    tipo: 'general',
    ubicacion: '',
    participantes: '',
    recordatorio: ''
  })

  const eventTypes = {
    general: { label: 'General', color: 'bg-blue-100 text-blue-800' },
    feriado: { label: 'Feriado', color: 'bg-red-100 text-red-800' },
    capacitacion: { label: 'Capacitación', color: 'bg-green-100 text-green-800' },
    reunion: { label: 'Reunión', color: 'bg-purple-100 text-purple-800' },
    cumpleaños: { label: 'Cumpleaños', color: 'bg-yellow-100 text-yellow-800' },
    evento_empresa: { label: 'Evento Empresa', color: 'bg-indigo-100 text-indigo-800' }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

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

  const handleAddEvent = async () => {
    try {
      await api.events.create(formData)
      setShowAddModal(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const handleEditEvent = async () => {
    try {
      await api.events.update(selectedEvent.id, formData)
      setShowEditModal(false)
      setSelectedEvent(null)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await api.events.delete(id)
        fetchEvents()
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      tipo: 'general',
      ubicacion: '',
      participantes: '',
      recordatorio: ''
    })
  }

  const openEditModal = (event) => {
    setSelectedEvent(event)
    setFormData(event)
    setShowEditModal(true)
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'todos' || event.tipo === filterType
    
    let matchesMonth = filterMonth === 'todos'
    if (filterMonth !== 'todos') {
      const eventMonth = new Date(event.fecha).getMonth()
      matchesMonth = eventMonth === parseInt(filterMonth)
    }
    
    return matchesSearch && matchesType && matchesMonth
  })

  const getUpcomingEvents = () => {
    const today = new Date()
    return events.filter(event => new Date(event.fecha) >= today).slice(0, 5)
  }

  const getMonthEvents = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    return events.filter(event => {
      const eventDate = new Date(event.fecha)
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
    })
  }

  const EventModal = ({ isOpen, onClose, title, onSubmit, isEdit = false }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--ci-text)]">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--ci-bg)] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Título del evento
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Tipo de evento
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="input-field"
                >
                  {Object.entries(eventTypes).map(([key, type]) => (
                    <option key={key} value={key}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({...formData, hora: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  className="input-field"
                  placeholder="Ej: Sala de reuniones, Oficina central, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Participantes
                </label>
                <input
                  type="text"
                  value={formData.participantes}
                  onChange={(e) => setFormData({...formData, participantes: e.target.value})}
                  className="input-field"
                  placeholder="Ej: Todos, Departamento RRHH, etc."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="input-field"
                  rows={4}
                  placeholder="Describe los detalles del evento..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Recordatorio
                </label>
                <select
                  value={formData.recordatorio}
                  onChange={(e) => setFormData({...formData, recordatorio: e.target.value})}
                  className="input-field"
                >
                  <option value="">Sin recordatorio</option>
                  <option value="1_dia">1 día antes</option>
                  <option value="2_dias">2 días antes</option>
                  <option value="1_semana">1 semana antes</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]"
              >
                Cancelar
              </button>
              <button
                onClick={onSubmit}
                className="btn-primary"
              >
                {isEdit ? 'Actualizar' : 'Agregar'}
              </button>
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

  const upcomingEvents = getUpcomingEvents()
  const monthEvents = getMonthEvents()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">
            Gestión de Eventos
          </h1>
          <p className="text-[var(--ci-muted)] mt-2">
            Administra el calendario de eventos de la empresa
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nuevo Evento</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--ci-muted)]">Total Eventos</p>
              <p className="text-2xl font-bold text-[var(--ci-text)]">{events.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--ci-muted)]">Este Mes</p>
              <p className="text-2xl font-bold text-green-600">{monthEvents.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--ci-muted)]">Próximos</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--ci-muted)]" size={20} />
            <input
              type="text"
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="todos">Todos los tipos</option>
            {Object.entries(eventTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input-field"
          >
            <option value="todos">Todos los meses</option>
            <option value="0">Enero</option>
            <option value="1">Febrero</option>
            <option value="2">Marzo</option>
            <option value="3">Abril</option>
            <option value="4">Mayo</option>
            <option value="5">Junio</option>
            <option value="6">Julio</option>
            <option value="7">Agosto</option>
            <option value="8">Septiembre</option>
            <option value="9">Octubre</option>
            <option value="10">Noviembre</option>
            <option value="11">Diciembre</option>
          </select>

          <div className="flex items-center justify-center">
            <Filter className="text-[var(--ci-muted)]" size={20} />
            <span className="ml-2 text-sm text-[var(--ci-muted)]">
              {filteredEvents.length} resultados
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const eventType = eventTypes[event.tipo] || eventTypes.general
              const eventDate = new Date(event.fecha)
              const isPast = eventDate < new Date()
              
              return (
                <div key={event.id} className={`card ${isPast ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-[var(--ci-text)]">{event.titulo}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${eventType.color}`}>
                          {eventType.label}
                        </span>
                        {isPast && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                            Finalizado
                          </span>
                        )}
                      </div>
                      
                      {event.descripcion && (
                        <p className="text-[var(--ci-muted)] mb-3">{event.descripcion}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--ci-muted)]">
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{event.fecha}</span>
                        </div>
                        {event.hora && (
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{event.hora}</span>
                          </div>
                        )}
                        {event.ubicacion && (
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span>{event.ubicacion}</span>
                          </div>
                        )}
                        {event.participantes && (
                          <div className="flex items-center space-x-1">
                            <Users size={14} />
                            <span>{event.participantes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {filteredEvents.length === 0 && (
              <div className="card text-center py-8">
                <Calendar size={48} className="mx-auto text-[var(--ci-muted)] mb-4" />
                <p className="text-[var(--ci-muted)]">No se encontraron eventos</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="card">
            <h3 className="text-lg font-semibold text-[var(--ci-text)] mb-4">Próximos Eventos</h3>
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const eventType = eventTypes[event.tipo] || eventTypes.general
                return (
                  <div key={event.id} className="p-3 bg-[var(--ci-bg)] rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${eventType.color}`}>
                        {eventType.label}
                      </span>
                    </div>
                    <p className="font-medium text-[var(--ci-text)]">{event.titulo}</p>
                    <p className="text-sm text-[var(--ci-muted)]">{event.fecha}</p>
                  </div>
                )
              })}
              {upcomingEvents.length === 0 && (
                <p className="text-[var(--ci-muted)] text-center py-4">No hay eventos próximos</p>
              )}
            </div>
          </div>

          {/* Events by Type */}
          <div className="card">
            <h3 className="text-lg font-semibold text-[var(--ci-text)] mb-4">Eventos por Tipo</h3>
            <div className="space-y-3">
              {Object.entries(eventTypes).map(([key, type]) => {
                const count = events.filter(e => e.tipo === key).length
                if (count === 0) return null
                
                return (
                  <div key={key} className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${type.color}`}>
                      {type.label}
                    </span>
                    <span className="text-sm font-medium text-[var(--ci-text)]">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <EventModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Agregar Nuevo Evento"
        onSubmit={handleAddEvent}
      />

      {/* Edit Modal */}
      <EventModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedEvent(null)
          resetForm()
        }}
        title="Editar Evento"
        onSubmit={handleEditEvent}
        isEdit={true}
      />
    </div>
  )
}

export default Events
