import React, { useState, useEffect } from 'react'
import { api } from '../config/api'
import { useToast } from './Toast'

const WEEK_DAYS = ['lun','mar','mie','jue','vie']
const WEEK_DAYS_LABEL = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes' }
const TODAY_KEY = ['dom','lun','mar','mie','jue','vie','sab'][new Date().getDay()]

const PRESENCE_STATES = {
  presencial: { color: 'bg-[var(--ci-green)]',  label: 'Presencial' },
  remoto:     { color: 'bg-[var(--accent)]',     label: 'Remoto' },
  ausente:    { color: 'bg-[var(--ci-red)]',     label: 'Ausente' },
  libre:      { color: 'bg-gray-300',            label: 'Libre' },
}

const Homeoffice = ({ employees }) => {
  const [presence, setPresence] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [form, setForm] = useState({ dia: '', estado: 'presencial' })
  const { showToast } = useToast()

  useEffect(() => { fetchPresence() }, [])

  const fetchPresence = async () => {
    try {
      const data = await api.presence.getAll()
      setPresence(data)
    } catch (error) {
      console.error('Error fetching presence:', error)
    }
  }

  const getState = (empId, day) => presence[`${empId}_${day}`]

  const handleSave = async () => {
    try {
      const prev = getState(selectedEmployee.id, form.dia)
      const capturedId = selectedEmployee.id
      const capturedDay = form.dia
      await api.presence.update(selectedEmployee.id, form.dia, form.estado)
      setShowModal(false)
      setSelectedEmployee(null)
      setForm({ dia: '', estado: 'presencial' })
      fetchPresence()
      showToast(
        'Presencia actualizada',
        prev != null ? async () => { await api.presence.update(capturedId, capturedDay, prev); fetchPresence() } : null
      )
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

  const activeEmployees = employees.filter(e => e.estado === 'Activo')

  const todayStats = WEEK_DAYS.includes(TODAY_KEY)
    ? activeEmployees.reduce((acc, emp) => {
        const s = getState(emp.id, TODAY_KEY) ?? 'libre'
        acc[s] = (acc[s] ?? 0) + 1
        return acc
      }, {})
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Homeoffice</h1>
        <p className="text-[var(--ci-muted)] mt-1">Presencialidad semanal del equipo</p>
      </div>

      {/* Stats de hoy (solo días laborables) */}
      {todayStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(PRESENCE_STATES).map(([key, info]) => (
            <div key={key} className="card flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${info.color} shrink-0`} />
              <div>
                <p className="text-xs text-[var(--ci-muted)]">{info.label}</p>
                <p className="text-2xl font-bold text-[var(--ci-text)]">{todayStats[key] ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grilla semanal */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-[var(--ci-text)]">Grilla semanal</h3>
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
                  <th key={d} className={`text-center py-2 px-2 font-medium capitalize w-12 ${d === TODAY_KEY ? 'text-[var(--accent)]' : 'text-[var(--ci-muted)]'}`}>
                    {d}
                  </th>
                ))}
                <th className="py-2 pl-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map(emp => (
                <tr key={emp.id} className="border-b border-[var(--ci-border)] hover:bg-[var(--ci-bg)]">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-[var(--accent)]">{emp.nombre.split(',')[0].charAt(0)}</span>
                      </div>
                      <span className="truncate max-w-[120px] text-[var(--ci-text)]">{emp.nombre}</span>
                    </div>
                  </td>
                  {WEEK_DAYS.map(day => {
                    const state = getState(emp.id, day)
                    const info = state ? PRESENCE_STATES[state] : null
                    return (
                      <td key={day} className={`text-center py-2 px-2 ${day === TODAY_KEY ? 'bg-[var(--accent-bg)]/30' : ''}`}>
                        {info
                          ? <div className={`w-3 h-3 ${info.color} rounded-full mx-auto`} title={info.label} />
                          : <div className="w-3 h-3 rounded-full mx-auto bg-gray-100 border border-gray-200" />
                        }
                      </td>
                    )
                  })}
                  <td className="py-2 pl-4">
                    <button
                      onClick={() => { setSelectedEmployee(emp); setShowModal(true) }}
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

      {/* Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[var(--ci-text)] mb-4">
                Presencialidad — {selectedEmployee.nombre.split(',')[0]}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Día</label>
                  <select value={form.dia} onChange={e => setForm({ ...form, dia: e.target.value })} className="input-field">
                    <option value="">Seleccionar día</option>
                    {WEEK_DAYS.map(d => <option key={d} value={d}>{WEEK_DAYS_LABEL[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Estado</label>
                  <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="input-field">
                    {Object.entries(PRESENCE_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => { setShowModal(false); setSelectedEmployee(null) }} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">
                  Cancelar
                </button>
                <button onClick={handleSave} className="btn-primary" disabled={!form.dia}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Homeoffice
