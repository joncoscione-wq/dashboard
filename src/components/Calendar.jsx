import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, MapPin, Clock } from 'lucide-react'
import { api } from '../config/api'

const Calendar = ({ employees }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [vacations, setVacations] = useState([])
  const [presence, setPresence] = useState({})
  const [showEventModal, setShowEventModal] = useState(false)
  const [showPresenceModal, setShowPresenceModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [viewMode, setViewMode] = useState('month') // month, week, day

  const [eventForm, setEventForm] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    tipo: 'general'
  })

  const [presenceForm, setPresenceForm] = useState({
    emp_id: '',
    dia: '',
    estado: 'presencial'
  })

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const presenceStates = {
    presencial: { color: 'bg-green-500', label: 'Presencial' },
    remoto: { color: 'bg-blue-500', label: 'Remoto' },
    ausente: { color: 'bg-red-500', label: 'Ausente' },
    libre: { color: 'bg-gray-500', label: 'Libre' }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [eventsData, vacationsData, presenceData] = await Promise.all([
        api.events.getAll(),
        api.vacations.getAll(),
        api.presence.getAll()
      ])
      setEvents(eventsData)
      setVacations(vacationsData)
      setPresence(presenceData)
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
    setEventForm({ ...eventForm, fecha: formatDate(clickedDate) })
    setShowEventModal(true)
  }

  const handleAddEvent = async () => {
    try {
      await api.events.create(eventForm)
      setShowEventModal(false)
      setEventForm({ titulo: '', descripcion: '', fecha: '', tipo: 'general' })
      fetchData()
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const handleUpdatePresence = async () => {
    try {
      await api.presence.update(presenceForm.emp_id, presenceForm.dia, presenceForm.estado)
      setShowPresenceModal(false)
      setPresenceForm({ emp_id: '', dia: '', estado: 'presencial' })
      fetchData()
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

  const getEventsForDate = (day) => {
    const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    return events.filter(event => event.fecha === dateStr)
  }

  const getVacationsForDate = (day) => {
    const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    return vacations.filter(vacation => {
      const start = new Date(vacacion.fecha_inicio)
      const end = new Date(vacacion.fecha_fin)
      const current = new Date(dateStr)
      return current >= start && current <= end
    })
  }

  const getPresenceForDate = (day, employeeId) => {
    const dayOfWeek = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay()]
    const key = `${employeeId}_${dayOfWeek}`
    return presence[key]
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-[var(--ci-border)]"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day)
      const dayVacations = getVacationsForDate(day)
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-24 border border-[var(--ci-border)] p-2 cursor-pointer hover:bg-[var(--accent-bg)] transition-colors ${
            isToday ? 'bg-[var(--accent-bg)]' : 'bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isToday ? 'text-[var(--accent)]' : 'text-[var(--ci-text)]'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <div className="w-2 h-2 bg-[var(--accent)] rounded-full"></div>
            )}
          </div>
          
          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, 2).map((event, idx) => (
              <div key={idx} className="text-xs bg-[var(--primary)] text-white px-1 py-0.5 rounded truncate">
                {event.titulo}
              </div>
            ))}
            {dayVacations.length > 0 && (
              <div className="text-xs bg-[var(--ci-amber)] text-white px-1 py-0.5 rounded">
                {dayVacations.length} vacaciones
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  const EventModal = () => {
    if (!showEventModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-bold text-[var(--ci-text)] mb-4">Nuevo Evento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={eventForm.titulo}
                  onChange={(e) => setEventForm({...eventForm, titulo: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Descripción
                </label>
                <textarea
                  value={eventForm.descripcion}
                  onChange={(e) => setEventForm({...eventForm, descripcion: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={eventForm.fecha}
                  onChange={(e) => setEventForm({...eventForm, fecha: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Tipo
                </label>
                <select
                  value={eventForm.tipo}
                  onChange={(e) => setEventForm({...eventForm, tipo: e.target.value})}
                  className="input-field"
                >
                  <option value="general">General</option>
                  <option value="feriado">Feriado</option>
                  <option value="capacitacion">Capacitación</option>
                  <option value="reunion">Reunión</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvent}
                className="btn-primary"
              >
                Agregar Evento
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const PresenceGrid = () => {
    const daysOfWeek = ['lun', 'mar', 'mie', 'jue', 'vie']
    
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--ci-text)] mb-4">Presencialidad Semanal</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--ci-border)]">
                <th className="text-left p-2">Empleado</th>
                {daysOfWeek.map(day => (
                  <th key={day} className="text-center p-2 capitalize">{day}</th>
                ))}
                <th className="text-center p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 10).map(employee => (
                <tr key={employee.id} className="border-b border-[var(--ci-border)]">
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-[var(--accent)]">
                          {employee.nombre.split(',')[0].charAt(0)}
                        </span>
                      </div>
                      <span className="truncate max-w-[150px]">{employee.nombre}</span>
                    </div>
                  </td>
                  {daysOfWeek.map(day => {
                    const state = getPresenceForDate(1, employee.id) // Using day 1 as reference
                    const stateInfo = state ? presenceStates[state] : null
                    return (
                      <td key={day} className="text-center p-2">
                        {stateInfo && (
                          <div className={`w-3 h-3 ${stateInfo.color} rounded-full mx-auto`} title={stateInfo.label}></div>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-center p-2">
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee)
                        setShowPresenceModal(true)
                      }}
                      className="text-[var(--accent)] hover:text-[var(--primary)] text-xs"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">
            Calendario RRHH
          </h1>
          <p className="text-[var(--ci-muted)] mt-2">
            Gestiona eventos, vacaciones y presencialidad
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowEventModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <CalendarIcon size={20} />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-[var(--ci-bg)] rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h2 className="text-xl font-semibold text-[var(--ci-text)]">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-[var(--ci-bg)] rounded-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center text-sm font-medium text-[var(--ci-muted)] p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0">
              {renderCalendarDays()}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="card">
            <h3 className="text-lg font-semibold text-[var(--ci-text)] mb-4">Próximos Eventos</h3>
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="p-3 bg-[var(--ci-bg)] rounded-lg">
                  <p className="font-medium text-[var(--ci-text)]">{event.titulo}</p>
                  <p className="text-sm text-[var(--ci-muted)] mt-1">{event.descripcion}</p>
                  <div className="flex items-center text-xs text-[var(--ci-muted)] mt-2">
                    <CalendarIcon size={12} className="mr-1" />
                    {event.fecha}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-[var(--ci-muted)] text-center py-4">No hay eventos próximos</p>
              )}
            </div>
          </div>

          {/* Current Vacations */}
          <div className="card">
            <h3 className="text-lg font-semibold text-[var(--ci-text)] mb-4">Vacaciones Activas</h3>
            <div className="space-y-3">
              {vacations.filter(v => {
                const now = new Date()
                const start = new Date(v.fecha_inicio)
                const end = new Date(v.fecha_fin)
                return now >= start && now <= end
              }).map(vacation => (
                <div key={vacation.id} className="p-3 bg-[var(--ci-amber-bg)] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-[var(--ci-amber)]" />
                    <span className="font-medium text-[var(--ci-text)]">{vacation.empleado}</span>
                  </div>
                  <p className="text-sm text-[var(--ci-muted)] mt-1">
                    {vacation.fecha_inicio} - {vacation.fecha_fin}
                  </p>
                </div>
              ))}
              {vacations.filter(v => {
                const now = new Date()
                const start = new Date(v.fecha_inicio)
                const end = new Date(v.fecha_fin)
                return now >= start && now <= end
              }).length === 0 && (
                <p className="text-[var(--ci-muted)] text-center py-4">No hay vacaciones activas</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Presence Grid */}
      <PresenceGrid />

      {/* Event Modal */}
      <EventModal />

      {/* Presence Modal */}
      {showPresenceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[var(--ci-text)] mb-4">
                Editar Presencialidad - {selectedEmployee.nombre}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                    Día de la semana
                  </label>
                  <select
                    value={presenceForm.dia}
                    onChange={(e) => setPresenceForm({...presenceForm, dia: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Seleccionar día</option>
                    <option value="lun">Lunes</option>
                    <option value="mar">Martes</option>
                    <option value="mie">Miércoles</option>
                    <option value="jue">Jueves</option>
                    <option value="vie">Viernes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                    Estado
                  </label>
                  <select
                    value={presenceForm.estado}
                    onChange={(e) => setPresenceForm({...presenceForm, estado: e.target.value})}
                    className="input-field"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="ausente">Ausente</option>
                    <option value="libre">Libre</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPresenceModal(false)
                    setSelectedEmployee(null)
                    setPresenceForm({ emp_id: '', dia: '', estado: 'presencial' })
                  }}
                  className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleUpdatePresence()
                    setPresenceForm({ ...presenceForm, emp_id: selectedEmployee.id })
                  }}
                  className="btn-primary"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
