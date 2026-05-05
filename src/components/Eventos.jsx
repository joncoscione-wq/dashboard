import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Search, Calendar, Users, X, FileText } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const LICENCIA_COLORS = {
  Vacaciones: 'bg-[var(--ci-amber)]',
  Médica:     'bg-[var(--ci-red)]',
  Estudio:    'bg-blue-500',
  Personal:   'bg-purple-500',
  Maternidad: 'bg-pink-500',
  Paternidad: 'bg-indigo-500',
  Duelo:      'bg-gray-500',
  Otro:       'bg-slate-500',
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_HEADER = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const EVENT_TYPES = {
  General:      { label: 'General',      color: 'bg-blue-100 text-blue-800' },
  Corporativo:  { label: 'Corporativo',  color: 'bg-indigo-100 text-indigo-800' },
  Feriado:      { label: 'Feriado',      color: 'bg-red-100 text-red-800' },
  Capacitación: { label: 'Capacitación', color: 'bg-green-100 text-green-800' },
  Reunión:      { label: 'Reunión',      color: 'bg-purple-100 text-purple-800' },
  Cumpleaños:   { label: 'Cumpleaños',   color: 'bg-yellow-100 text-yellow-800' },
}

const emptyForm = { nombre: '', fecha: '', tipo: 'General', notas: '' }

const Eventos = ({ employees }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [vacations, setVacations] = useState([])
  const [licencias, setLicencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterMonth, setFilterMonth] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const { showToast } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [eventsData, vacationsData, licenciasData] = await Promise.all([
        api.events.getAll(),
        api.vacations.getAll(),
        api.licencias.getAll(),
      ])
      setEvents(eventsData.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))
      setVacations(vacationsData)
      setLicencias(licenciasData)
    } catch (error) {
      console.error('Error fetching events data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (date) => date.toISOString().split('T')[0]

  const getEventsForDate = (day) => {
    const dateStr = fmt(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    return events.filter(e => e.fecha === dateStr)
  }

  const getVacationsForDate = (day) => {
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return vacations.filter(v => current >= new Date(v.desde) && current <= new Date(v.hasta))
  }

  const getLicenciasForDate = (day) => {
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return licencias.filter(l =>
      l.estado === 'Aprobada' && current >= new Date(l.desde) && current <= new Date(l.hasta)
    )
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const renderDays = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="h-14 sm:h-20 border border-[var(--ci-border)] bg-[var(--ci-bg)]" />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents   = getEventsForDate(day)
      const dayVacs     = getVacationsForDate(day)
      const dayLics     = getLicenciasForDate(day)
      const isToday     = fmt(new Date()) === fmt(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
      cells.push(
        <div key={day} className={`h-14 sm:h-20 border border-[var(--ci-border)] p-1 sm:p-2 ${isToday ? 'bg-[var(--accent-bg)]' : 'bg-white'}`}>
          <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-[var(--accent)]' : 'text-[var(--ci-text)]'}`}>{day}</span>
          <div className="hidden sm:block mt-1 space-y-0.5">
            {dayEvents.slice(0, 1).map((ev, i) => (
              <div key={i} className="text-xs bg-[var(--primary)] text-white px-1 py-0.5 rounded truncate">{ev.nombre}</div>
            ))}
            {dayVacs.length > 0 && (
              <div className="text-xs bg-[var(--ci-amber)] text-white px-1 py-0.5 rounded">{dayVacs.length} vac.</div>
            )}
            {dayLics.length > 0 && (
              <div className="text-xs bg-[var(--ci-green)] text-white px-1 py-0.5 rounded">{dayLics.length} lic.</div>
            )}
          </div>
          <div className="sm:hidden flex gap-0.5 mt-1 flex-wrap">
            {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
            {dayVacs.length > 0  && <div className="w-1.5 h-1.5 rounded-full bg-[var(--ci-amber)]" />}
            {dayLics.length > 0  && <div className="w-1.5 h-1.5 rounded-full bg-[var(--ci-green)]" />}
          </div>
        </div>
      )
    }
    return cells
  }

  const now = new Date()
  const activeVacations = vacations.filter(v => now >= new Date(v.desde) && now <= new Date(v.hasta))
  const activeLicencias = licencias.filter(l =>
    l.estado === 'Aprobada' && now >= new Date(l.desde) && now <= new Date(l.hasta)
  )
  const upcomingEvents = events.filter(e => new Date(e.fecha) >= new Date()).slice(0, 5)

  const handleAdd = async () => {
    try {
      const newEvent = await api.events.create(formData)
      setShowAddModal(false)
      setFormData(emptyForm)
      fetchData()
      showToast('Evento agregado', async () => { await api.events.delete(newEvent.id); fetchData() })
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const handleEdit = async () => {
    try {
      const previous = { ...selectedEvent }
      await api.events.update(selectedEvent.id, formData)
      setShowEditModal(false)
      setSelectedEvent(null)
      setFormData(emptyForm)
      fetchData()
      showToast('Evento actualizado', async () => {
        const { id: prevId, ...prevData } = previous
        await api.events.update(prevId, prevData)
        fetchData()
      })
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDelete = async (id) => {
    const previous = events.find(e => e.id === id)
    try {
      await api.events.delete(id)
      fetchData()
      if (previous) {
        const { id: _id, ...evData } = previous
        showToast('Evento eliminado', async () => { await api.events.create(evData); fetchData() })
      }
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
    if (filterMonth !== 'todos') matchesMonth = new Date(event.fecha).getMonth() === parseInt(filterMonth)
    return matchesSearch && matchesType && matchesMonth
  })

  const EventModal = ({ isOpen, onClose, title, onSubmit }) => {
    if (!isOpen) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--ci-text)]">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Nombre</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Fecha</label>
                  <input type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Tipo</label>
                  <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="input-field">
                    {Object.keys(EVENT_TYPES).map(k => <option key={k} value={k}>{EVENT_TYPES[k].label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Notas</label>
                <textarea value={formData.notas} onChange={e => setFormData({ ...formData, notas: e.target.value })} className="input-field" rows={3} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">Cancelar</button>
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
          <p className="text-[var(--ci-muted)] mt-1">Calendario, eventos y vacaciones del equipo</p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setShowAddModal(true) }}
          className="btn-primary flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={20} />
          <span>Nuevo Evento</span>
        </button>
      </div>

      {/* Calendar + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-[var(--ci-text)]">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS_HEADER.map(d => <div key={d} className="text-center text-xs font-medium text-[var(--ci-muted)] py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">{renderDays()}</div>
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[var(--ci-border)]">
            <span className="flex items-center gap-1 text-xs text-[var(--ci-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block" /> Evento
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--ci-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--ci-amber)] inline-block" /> Vacaciones
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--ci-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--ci-green)] inline-block" /> Licencia
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-base font-semibold text-[var(--ci-text)] mb-3">Próximos eventos</h3>
            <div className="space-y-2">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="p-2 bg-[var(--ci-bg)] rounded-lg">
                  <p className="font-medium text-[var(--ci-text)] text-sm">{ev.nombre}</p>
                  <p className="text-xs text-[var(--ci-muted)] mt-0.5">{ev.fecha}</p>
                </div>
              ))}
              {upcomingEvents.length === 0 && <p className="text-[var(--ci-muted)] text-sm text-center py-3">Sin eventos próximos</p>}
            </div>
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-[var(--ci-text)] mb-3">Licencias activas</h3>
            <div className="space-y-2">
              {activeLicencias.map(l => {
                const emp = employees.find(e => e.id === l.emp_id)
                return (
                  <div key={l.id} className="p-2 bg-[var(--ci-green-bg)] rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[var(--ci-green)] shrink-0" />
                      <span className="font-medium text-[var(--ci-text)] text-sm truncate">
                        {emp ? emp.nombre.split(',')[0] : `Emp #${l.emp_id}`}
                      </span>
                      <span className="text-xs text-[var(--ci-muted)] shrink-0">{l.tipo}</span>
                    </div>
                    <p className="text-xs text-[var(--ci-muted)] mt-0.5">{l.desde} → {l.hasta}</p>
                  </div>
                )
              })}
              {activeVacations.map(v => {
                const emp = employees.find(e => e.id === v.emp_id)
                return (
                  <div key={v.id} className="p-2 bg-[var(--ci-amber-bg)] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[var(--ci-amber)] shrink-0" />
                      <span className="font-medium text-[var(--ci-text)] text-sm truncate">
                        {emp ? emp.nombre.split(',')[0] : `Emp #${v.emp_id}`}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ci-muted)] mt-0.5">{v.desde} → {v.hasta}</p>
                  </div>
                )
              })}
              {activeLicencias.length === 0 && activeVacations.length === 0 && (
                <p className="text-[var(--ci-muted)] text-sm text-center py-3">Sin licencias activas</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events List + Filters */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-[var(--ci-text)]">Lista de Eventos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" size={16} />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field">
              <option value="todos">Todos los tipos</option>
              {Object.keys(EVENT_TYPES).map(k => <option key={k} value={k}>{EVENT_TYPES[k].label}</option>)}
            </select>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="input-field">
              <option value="todos">Todos los meses</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>
        <p className="text-sm text-[var(--ci-muted)] mb-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>

        <div className="space-y-3">
          {filtered.map(event => {
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
                    <div className="flex items-center gap-1 text-sm text-[var(--ci-muted)]">
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
      </div>

      <EventModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nuevo Evento" onSubmit={handleAdd} />
      <EventModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedEvent(null) }} title="Editar Evento" onSubmit={handleEdit} />
    </div>
  )
}

export default Eventos
