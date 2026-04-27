import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react'
import { api } from '../config/api'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_HEADER = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const WEEK_DAYS = ['lun','mar','mie','jue','vie']

const PRESENCE_STATES = {
  presencial: { color: 'bg-[var(--ci-green)]',   label: 'Presencial' },
  remoto:     { color: 'bg-[var(--accent)]',      label: 'Remoto' },
  ausente:    { color: 'bg-[var(--ci-red)]',      label: 'Ausente' },
  libre:      { color: 'bg-gray-300',             label: 'Libre' },
}

const Calendar = ({ employees }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [vacations, setVacations] = useState([])
  const [presence, setPresence] = useState({})
  const [showPresenceModal, setShowPresenceModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [presenceForm, setPresenceForm] = useState({ dia: '', estado: 'presencial' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [eventsData, vacationsData, presenceData] = await Promise.all([
        api.events.getAll(),
        api.vacations.getAll(),
        api.presence.getAll(),
      ])
      setEvents(eventsData)
      setVacations(vacationsData)
      setPresence(presenceData)
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    }
  }

  const fmt = (date) => date.toISOString().split('T')[0]

  const getEventsForDate = (day) => {
    const dateStr = fmt(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    return events.filter(e => e.fecha === dateStr)
  }

  const getVacationsForDate = (day) => {
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return vacations.filter(v => {
      return current >= new Date(v.desde) && current <= new Date(v.hasta)
    })
  }

  const getPresenceForDay = (employeeId, weekday) => {
    return presence[`${employeeId}_${weekday}`]
  }

  const handleUpdatePresence = async () => {
    try {
      await api.presence.update(selectedEmployee.id, presenceForm.dia, presenceForm.estado)
      setShowPresenceModal(false)
      setSelectedEmployee(null)
      setPresenceForm({ dia: '', estado: 'presencial' })
      fetchData()
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const renderDays = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="h-14 sm:h-20 border border-[var(--ci-border)] bg-[var(--ci-bg)]" />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day)
      const dayVacs = getVacationsForDate(day)
      const isToday = fmt(new Date()) === fmt(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
      cells.push(
        <div
          key={day}
          className={`h-14 sm:h-20 border border-[var(--ci-border)] p-1 sm:p-2 ${isToday ? 'bg-[var(--accent-bg)]' : 'bg-white'}`}
        >
          <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-[var(--accent)]' : 'text-[var(--ci-text)]'}`}>
            {day}
          </span>
          <div className="hidden sm:block mt-1 space-y-0.5">
            {dayEvents.slice(0, 2).map((ev, i) => (
              <div key={i} className="text-xs bg-[var(--primary)] text-white px-1 py-0.5 rounded truncate">
                {ev.nombre}
              </div>
            ))}
            {dayVacs.length > 0 && (
              <div className="text-xs bg-[var(--ci-amber)] text-white px-1 py-0.5 rounded">
                {dayVacs.length} vac.
              </div>
            )}
          </div>
          {/* Mobile: solo dots */}
          <div className="sm:hidden flex gap-0.5 mt-1 flex-wrap">
            {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
            {dayVacs.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--ci-amber)]" />}
          </div>
        </div>
      )
    }
    return cells
  }

  const activeVacations = vacations.filter(v => {
    const now = new Date()
    return now >= new Date(v.desde) && now <= new Date(v.hasta)
  })

  const upcomingEvents = events
    .filter(e => new Date(e.fecha) >= new Date())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Calendario RRHH</h1>
        <p className="text-[var(--ci-muted)] mt-1">Eventos, vacaciones y presencialidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-[var(--ci-bg)] rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-[var(--ci-text)]">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-[var(--ci-bg)] rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_HEADER.map(d => (
              <div key={d} className="text-center text-xs font-medium text-[var(--ci-muted)] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">{renderDays()}</div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[var(--ci-border)]">
            <span className="flex items-center gap-1 text-xs text-[var(--ci-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block" /> Evento
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--ci-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--ci-amber)] inline-block" /> Vacaciones
            </span>
          </div>
        </div>

        {/* Sidebar */}
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
            <h3 className="text-base font-semibold text-[var(--ci-text)] mb-3">Vacaciones activas</h3>
            <div className="space-y-2">
              {activeVacations.map(v => {
                const emp = employees.find(e => e.id === v.emp_id)
                return (
                  <div key={v.id} className="p-2 bg-[var(--ci-amber-bg)] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[var(--ci-amber)] shrink-0" />
                      <span className="font-medium text-[var(--ci-text)] text-sm truncate">
                        {emp ? emp.nombre : `Emp #${v.emp_id}`}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ci-muted)] mt-0.5">{v.desde} → {v.hasta}</p>
                  </div>
                )
              })}
              {activeVacations.length === 0 && <p className="text-[var(--ci-muted)] text-sm text-center py-3">Sin vacaciones activas</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Presence Grid */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-[var(--ci-text)]">Presencialidad semanal</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(PRESENCE_STATES).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1 text-xs text-[var(--ci-muted)]">
                <span className={`w-2 h-2 rounded-full ${v.color} inline-block`} />{v.label}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b border-[var(--ci-border)]">
                <th className="text-left py-2 pr-4 font-medium text-[var(--ci-muted)] min-w-[140px]">Empleado</th>
                {WEEK_DAYS.map(d => (
                  <th key={d} className="text-center py-2 px-2 font-medium text-[var(--ci-muted)] capitalize w-12">{d}</th>
                ))}
                <th className="py-2 pl-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {employees.filter(e => e.estado === 'Activo').map(emp => (
                <tr key={emp.id} className="border-b border-[var(--ci-border)] hover:bg-[var(--ci-bg)]">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-[var(--accent)]">
                          {emp.nombre.split(',')[0].charAt(0)}
                        </span>
                      </div>
                      <span className="truncate max-w-[120px] text-[var(--ci-text)]">{emp.nombre}</span>
                    </div>
                  </td>
                  {WEEK_DAYS.map(day => {
                    const state = getPresenceForDay(emp.id, day)
                    const info = state ? PRESENCE_STATES[state] : null
                    return (
                      <td key={day} className="text-center py-2 px-2">
                        {info
                          ? <div className={`w-3 h-3 ${info.color} rounded-full mx-auto`} title={info.label} />
                          : <div className="w-3 h-3 rounded-full mx-auto bg-gray-100 border border-gray-200" />
                        }
                      </td>
                    )
                  })}
                  <td className="py-2 pl-4">
                    <button
                      onClick={() => { setSelectedEmployee(emp); setShowPresenceModal(true) }}
                      className="text-xs text-[var(--accent)] hover:underline"
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

      {/* Presence Modal */}
      {showPresenceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[var(--ci-text)] mb-4">
                Presencialidad — {selectedEmployee.nombre.split(',')[0]}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Día</label>
                  <select
                    value={presenceForm.dia}
                    onChange={(e) => setPresenceForm({ ...presenceForm, dia: e.target.value })}
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
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Estado</label>
                  <select
                    value={presenceForm.estado}
                    onChange={(e) => setPresenceForm({ ...presenceForm, estado: e.target.value })}
                    className="input-field"
                  >
                    {Object.entries(PRESENCE_STATES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => { setShowPresenceModal(false); setSelectedEmployee(null) }}
                  className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]"
                >
                  Cancelar
                </button>
                <button onClick={handleUpdatePresence} className="btn-primary" disabled={!presenceForm.dia}>
                  Guardar
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
