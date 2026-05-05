import React, { useState, useEffect } from 'react'
import { Edit, X } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const WEEK_DAYS = ['lun','mar','mie','jue','vie']
const WEEK_DAYS_LABEL = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes' }
const WEEK_DAYS_SHORT = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie' }
const TODAY_KEY = ['dom','lun','mar','mie','jue','vie','sab'][new Date().getDay()]

const PRESENCE_STATES = {
  presencial: { color: 'bg-[var(--ci-green)]',  label: 'Presencial' },
  remoto:     { color: 'bg-[var(--accent)]',     label: 'Remoto' },
  ausente:    { color: 'bg-[var(--ci-red)]',     label: 'Ausente' },
  libre:      { color: 'bg-gray-300',            label: 'Libre' },
}

const emptyPolicyForm = { dias_aprobados: [], max_dias_semana: 0, vigencia_desde: '', notas: '' }

const Homeoffice = ({ employees }) => {
  const [presence, setPresence] = useState({})
  const [policies, setPolicies] = useState({})
  const [showPresenceModal, setShowPresenceModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [presenceForm, setPresenceForm] = useState({ dia: '', estado: 'presencial' })
  const [policyForm, setPolicyForm] = useState(emptyPolicyForm)
  const { showToast } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [presenceData, policiesData] = await Promise.all([
        api.presence.getAll(),
        api.homeoffice.getAll(),
      ])
      setPresence(presenceData)
      const map = {}
      policiesData.forEach(p => { map[p.emp_id] = p })
      setPolicies(map)
    } catch (error) {
      console.error('Error fetching homeoffice data:', error)
    }
  }

  const getState = (empId, day) => presence[`${empId}_${day}`]

  const handleSavePresence = async () => {
    try {
      const prev = getState(selectedEmployee.id, presenceForm.dia)
      const capturedId  = selectedEmployee.id
      const capturedDay = presenceForm.dia
      await api.presence.update(selectedEmployee.id, presenceForm.dia, presenceForm.estado)
      setShowPresenceModal(false)
      setSelectedEmployee(null)
      setPresenceForm({ dia: '', estado: 'presencial' })
      fetchData()
      showToast(
        'Presencia actualizada',
        prev != null ? async () => { await api.presence.update(capturedId, capturedDay, prev); fetchData() } : null
      )
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

  const handleSavePolicy = async () => {
    try {
      await api.homeoffice.upsert(selectedEmployee.id, {
        dias_aprobados:  policyForm.dias_aprobados,
        max_dias_semana: Number(policyForm.max_dias_semana),
        vigencia_desde:  policyForm.vigencia_desde || null,
        notas:           policyForm.notas || null,
        updated_at:      new Date().toISOString(),
      })
      setShowPolicyModal(false)
      setSelectedEmployee(null)
      setPolicyForm(emptyPolicyForm)
      fetchData()
      showToast('Política actualizada', null)
    } catch (error) {
      console.error('Error saving policy:', error)
    }
  }

  const openPolicyModal = (emp) => {
    setSelectedEmployee(emp)
    const existing = policies[emp.id]
    setPolicyForm(existing ? {
      dias_aprobados:  existing.dias_aprobados ?? [],
      max_dias_semana: existing.max_dias_semana ?? 0,
      vigencia_desde:  existing.vigencia_desde ?? '',
      notas:           existing.notas ?? '',
    } : emptyPolicyForm)
    setShowPolicyModal(true)
  }

  const toggleDay = (day) => {
    const days = policyForm.dias_aprobados
    setPolicyForm({
      ...policyForm,
      dias_aprobados: days.includes(day) ? days.filter(d => d !== day) : [...days, day],
    })
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
        <p className="text-[var(--ci-muted)] mt-1">Presencialidad y política de trabajo del equipo</p>
      </div>

      {/* Stats hoy */}
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
                    const info  = state ? PRESENCE_STATES[state] : null
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
                      onClick={() => { setSelectedEmployee(emp); setPresenceForm({ dia: '', estado: 'presencial' }); setShowPresenceModal(true) }}
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

      {/* Política de Homeoffice */}
      <div className="card">
        <h3 className="text-base font-semibold text-[var(--ci-text)] mb-4">Política de Homeoffice</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-[var(--ci-border)]">
                <th className="text-left py-2 pr-4 font-medium text-[var(--ci-muted)] min-w-[150px]">Empleado</th>
                <th className="text-left py-2 px-2 font-medium text-[var(--ci-muted)] w-28">Modalidad</th>
                <th className="text-left py-2 px-2 font-medium text-[var(--ci-muted)]">Días aprobados</th>
                <th className="text-center py-2 px-2 font-medium text-[var(--ci-muted)] w-24">Máx / sem</th>
                <th className="py-2 pl-4 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map(emp => {
                const pol = policies[emp.id]
                return (
                  <tr key={emp.id} className="border-b border-[var(--ci-border)] hover:bg-[var(--ci-bg)]">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-[var(--accent)]">{emp.nombre.split(',')[0].charAt(0)}</span>
                        </div>
                        <span className="truncate max-w-[130px] text-[var(--ci-text)]">{emp.nombre}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        emp.modalidad === 'Remoto'   ? 'bg-[var(--accent-bg)] text-[var(--accent)]' :
                        emp.modalidad === 'Híbrido'  ? 'bg-[var(--ci-amber-bg)] text-[var(--ci-amber)]' :
                                                       'bg-[var(--ci-green-bg)] text-[var(--ci-green)]'
                      }`}>
                        {emp.modalidad}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {pol?.dias_aprobados?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pol.dias_aprobados.map(d => (
                            <span key={d} className="px-1.5 py-0.5 text-xs bg-[var(--accent-bg)] text-[var(--accent)] rounded">
                              {WEEK_DAYS_SHORT[d] ?? d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--ci-muted)]">Sin política</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center text-[var(--ci-text)]">
                      {pol ? pol.max_dias_semana : '—'}
                    </td>
                    <td className="py-2 pl-4">
                      <button onClick={() => openPolicyModal(emp)} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                        <Edit size={12} /> Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal presencia */}
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
                  <select value={presenceForm.dia} onChange={e => setPresenceForm({ ...presenceForm, dia: e.target.value })} className="input-field">
                    <option value="">Seleccionar día</option>
                    {WEEK_DAYS.map(d => <option key={d} value={d}>{WEEK_DAYS_LABEL[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Estado</label>
                  <select value={presenceForm.estado} onChange={e => setPresenceForm({ ...presenceForm, estado: e.target.value })} className="input-field">
                    {Object.entries(PRESENCE_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => { setShowPresenceModal(false); setSelectedEmployee(null) }} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">Cancelar</button>
                <button onClick={handleSavePresence} className="btn-primary" disabled={!presenceForm.dia}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal política */}
      {showPolicyModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--ci-text)]">
                  Política — {selectedEmployee.nombre.split(',')[0]}
                </h3>
                <button onClick={() => { setShowPolicyModal(false); setSelectedEmployee(null) }} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-2">Días aprobados para remoto</label>
                  <div className="flex gap-2">
                    {WEEK_DAYS.map(d => (
                      <button
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          policyForm.dias_aprobados.includes(d)
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--ci-bg)] text-[var(--ci-muted)] hover:bg-[var(--accent-bg)]'
                        }`}
                      >
                        {WEEK_DAYS_SHORT[d]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Máximo días remotos por semana</label>
                  <input type="number" value={policyForm.max_dias_semana} onChange={e => setPolicyForm({ ...policyForm, max_dias_semana: e.target.value })} className="input-field" min="0" max="5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Vigente desde</label>
                  <input type="date" value={policyForm.vigencia_desde} onChange={e => setPolicyForm({ ...policyForm, vigencia_desde: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Notas</label>
                  <textarea value={policyForm.notas} onChange={e => setPolicyForm({ ...policyForm, notas: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => { setShowPolicyModal(false); setSelectedEmployee(null) }} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">Cancelar</button>
                <button onClick={handleSavePolicy} className="btn-primary">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Homeoffice
