import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, TrendingUp, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const MONTHS_LONG  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const periodoLabel = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}
const periodoShort = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}
const fmtPesos = (n) => `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

const emptyForm      = { emp_id: '', periodo: '', neto: '', fecha_pago: '', notas: '' }
const emptyInflForm  = { periodo: '', indice_acumulado: '', variacion_mensual: '', fuente: 'INDEC' }

const Sueldos = ({ employees }) => {
  const [sueldos,    setSueldos]    = useState([])
  const [inflacion,  setInflacion]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterEmp,  setFilterEmp]  = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [showInflModal, setShowInflModal] = useState(false)
  const [showInflSection, setShowInflSection] = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [selInfl,    setSelInfl]    = useState(null)
  const [form,       setForm]       = useState(emptyForm)
  const [inflForm,   setInflForm]   = useState(emptyInflForm)
  const { showToast } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [s, i] = await Promise.all([api.sueldos.getAll(), api.inflacion.getAll()])
      setSueldos(s)
      setInflacion(i)
    } catch (e) {
      console.error('Error fetching sueldos:', e)
    } finally {
      setLoading(false)
    }
  }

  const empName  = (id) => employees.find(e => e.id === Number(id))?.nombre ?? `#${id}`
  const empEmail = (id) => employees.find(e => e.id === Number(id))?.email ?? null

  // inflacion map: "YYYY-MM" → indice_acumulado
  const inflMap = {}
  inflacion.forEach(i => { inflMap[i.periodo.substring(0, 7)] = Number(i.indice_acumulado) })
  const latestIdx = inflacion.length ? Number(inflacion[inflacion.length - 1].indice_acumulado) : null

  const adjusted = (neto, periodoStr) => {
    if (!latestIdx || !periodoStr) return null
    const key = periodoStr.substring(0, 7)
    const idx  = inflMap[key]
    if (!idx) return null
    return Math.round(Number(neto) * (latestIdx / idx))
  }

  // ── CRUD sueldos ──────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const payload = {
        emp_id:     Number(form.emp_id),
        periodo:    form.periodo + '-01',
        neto:       Number(form.neto),
        fecha_pago: form.fecha_pago || null,
        notas:      form.notas || null,
      }
      if (selected) {
        const prev = { ...selected }
        await api.sueldos.update(selected.id, payload)
        setSelected(null)
        showToast('Sueldo actualizado', async () => { await api.sueldos.update(prev.id, { emp_id: prev.emp_id, periodo: prev.periodo, neto: prev.neto, fecha_pago: prev.fecha_pago, notas: prev.notas }); fetchData() })
      } else {
        const newS = await api.sueldos.create(payload)
        showToast('Sueldo registrado', async () => { await api.sueldos.delete(newS.id); fetchData() })
      }
      setShowModal(false)
      setForm(emptyForm)
      fetchData()
    } catch (e) {
      console.error('Error saving sueldo:', e)
    }
  }

  const handleDelete = async (id) => {
    const prev = sueldos.find(s => s.id === id)
    try {
      await api.sueldos.delete(id)
      fetchData()
      if (prev) {
        const { id: _id, created_at: _c, ...d } = prev
        showToast('Sueldo eliminado', async () => { await api.sueldos.create(d); fetchData() })
      }
    } catch (e) {
      console.error('Error deleting sueldo:', e)
    }
  }

  const openEdit = (s) => {
    setSelected(s)
    setForm({ emp_id: String(s.emp_id), periodo: s.periodo.substring(0, 7), neto: String(s.neto), fecha_pago: s.fecha_pago ?? '', notas: s.notas ?? '' })
    setShowModal(true)
  }

  // ── CRUD inflación ────────────────────────────────────────────
  const handleSaveInfl = async () => {
    try {
      const payload = {
        periodo:           inflForm.periodo + '-01',
        indice_acumulado:  Number(inflForm.indice_acumulado),
        variacion_mensual: inflForm.variacion_mensual ? Number(inflForm.variacion_mensual) : null,
        fuente:            inflForm.fuente || 'INDEC',
      }
      if (selInfl) {
        await api.inflacion.update(selInfl.id, payload)
        showToast('Índice actualizado', null)
      } else {
        await api.inflacion.create(payload)
        showToast('Índice agregado', null)
      }
      setShowInflModal(false)
      setSelInfl(null)
      setInflForm(emptyInflForm)
      fetchData()
    } catch (e) {
      console.error('Error saving inflacion:', e)
    }
  }

  const openEditInfl = (i) => {
    setSelInfl(i)
    setInflForm({ periodo: i.periodo.substring(0, 7), indice_acumulado: String(i.indice_acumulado), variacion_mensual: i.variacion_mensual ? String(i.variacion_mensual) : '', fuente: i.fuente ?? 'INDEC' })
    setShowInflModal(true)
  }

  // ── Filtros y stats ───────────────────────────────────────────
  const filtered = sueldos.filter(s => {
    const name = empName(s.emp_id).toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || periodoLabel(s.periodo).toLowerCase().includes(search.toLowerCase())
    const matchEmp    = !filterEmp || s.emp_id === Number(filterEmp)
    return matchSearch && matchEmp
  })

  const empHistory = filterEmp ? [...filtered].sort((a, b) => a.periodo < b.periodo ? -1 : 1) : []

  // ── Gráfico de evolución ──────────────────────────────────────
  const ChartBars = ({ records }) => {
    if (records.length < 2) return null
    const vals = records.flatMap(r => {
      const adj = adjusted(r.neto, r.periodo)
      return adj ? [Number(r.neto), adj] : [Number(r.neto)]
    })
    const maxVal = Math.max(...vals) * 1.05
    return (
      <div>
        <div className="flex items-end gap-1 h-36 mt-2">
          {records.map(r => {
            const adj = adjusted(r.neto, r.periodo)
            const nomH = `${(Number(r.neto) / maxVal) * 100}%`
            const adjH = adj ? `${(adj / maxVal) * 100}%` : null
            return (
              <div key={r.id} className="flex-1 flex items-end gap-px min-w-0">
                <div style={{ height: nomH }} className="flex-1 bg-[var(--accent)] rounded-t-sm min-h-[3px]" title={`Nominal ${periodoLabel(r.periodo)}: ${fmtPesos(r.neto)}`} />
                {adjH && <div style={{ height: adjH }} className="flex-1 bg-[var(--ci-green)] rounded-t-sm min-h-[3px] opacity-70" title={`Ajustado: ${fmtPesos(adj)}`} />}
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 mt-1 overflow-hidden">
          {records.map(r => (
            <div key={r.id} className="flex-1 text-center text-[10px] text-[var(--ci-muted)] truncate">{periodoShort(r.periodo)}</div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-[var(--ci-muted)]"><span className="w-2 h-2 rounded-sm bg-[var(--accent)] inline-block" /> Nominal</span>
          {latestIdx && <span className="flex items-center gap-1 text-xs text-[var(--ci-muted)]"><span className="w-2 h-2 rounded-sm bg-[var(--ci-green)] inline-block opacity-70" /> Ajustado por inflación</span>}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Sueldos</h1>
          <p className="text-[var(--ci-muted)] mt-1">Historial salarial y evolución real del equipo</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setSelected(null); setShowModal(true) }} className="btn-primary flex items-center space-x-2 self-start sm:self-auto">
          <Plus size={20} /><span>Registrar Sueldo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Registros',         value: sueldos.length,                                     color: 'text-[var(--ci-text)]' },
          { label: 'Empleados cargados', value: new Set(sueldos.map(s => s.emp_id)).size,           color: 'text-[var(--accent)]' },
          { label: 'Períodos',          value: new Set(sueldos.map(s => s.periodo.substring(0,7))).size, color: 'text-[var(--ci-green)]' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-sm text-[var(--ci-muted)]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" size={16} />
            <input type="text" placeholder="Buscar empleado o período..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} className="input-field">
            <option value="">Todos los empleados</option>
            {employees.filter(e => e.estado === 'Activo').map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <p className="text-sm text-[var(--ci-muted)] mt-3">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Evolución chart — solo cuando hay empleado seleccionado */}
      {filterEmp && empHistory.length >= 2 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-[var(--accent)]" />
            <h3 className="text-base font-semibold text-[var(--ci-text)]">
              Evolución — {empName(filterEmp)}
            </h3>
            {!latestIdx && (
              <span className="ml-auto flex items-center gap-1 text-xs text-[var(--ci-muted)]">
                <Info size={12} /> Cargá el índice de inflación para ver el valor ajustado
              </span>
            )}
          </div>
          <ChartBars records={empHistory} />
        </div>
      )}

      {/* Tabla */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-[var(--ci-border)]">
              <th className="text-left py-2 pr-4 font-medium text-[var(--ci-muted)] min-w-[150px]">Empleado</th>
              <th className="text-left py-2 px-2 font-medium text-[var(--ci-muted)] w-28">Período</th>
              <th className="text-right py-2 px-2 font-medium text-[var(--ci-muted)] w-32">Neto</th>
              <th className="text-right py-2 px-2 font-medium text-[var(--ci-muted)] w-32 hidden sm:table-cell">Ajustado</th>
              <th className="text-left py-2 px-2 font-medium text-[var(--ci-muted)] w-28 hidden sm:table-cell">Fecha pago</th>
              <th className="py-2 pl-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const adj = adjusted(s.neto, s.periodo)
              return (
                <tr key={s.id} className="border-b border-[var(--ci-border)] hover:bg-[var(--ci-bg)]">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-[var(--accent)]">{empName(s.emp_id).split(',')[0].charAt(0)}</span>
                      </div>
                      <span className="truncate max-w-[120px] text-[var(--ci-text)]">{empName(s.emp_id)}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-[var(--ci-muted)]">{periodoLabel(s.periodo)}</td>
                  <td className="py-2 px-2 text-right font-medium text-[var(--ci-text)]">{fmtPesos(s.neto)}</td>
                  <td className="py-2 px-2 text-right text-[var(--ci-green)] hidden sm:table-cell">{adj ? fmtPesos(adj) : '—'}</td>
                  <td className="py-2 px-2 text-[var(--ci-muted)] hidden sm:table-cell">{s.fecha_pago ?? '—'}</td>
                  <td className="py-2 pl-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded transition-colors"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-[var(--ci-muted)]">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Índice de inflación (expandible) */}
      <div className="card">
        <button
          onClick={() => setShowInflSection(v => !v)}
          className="w-full flex justify-between items-center"
        >
          <h3 className="text-base font-semibold text-[var(--ci-text)]">Índice de Inflación</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ci-muted)]">{inflacion.length} período{inflacion.length !== 1 ? 's' : ''} cargado{inflacion.length !== 1 ? 's' : ''}</span>
            {showInflSection ? <ChevronUp size={16} className="text-[var(--ci-muted)]" /> : <ChevronDown size={16} className="text-[var(--ci-muted)]" />}
          </div>
        </button>

        {showInflSection && (
          <div className="mt-4 space-y-3">
            <button onClick={() => { setInflForm(emptyInflForm); setSelInfl(null); setShowInflModal(true) }} className="btn-secondary flex items-center gap-2 text-sm">
              <Plus size={16} /> Agregar período
            </button>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="border-b border-[var(--ci-border)]">
                    <th className="text-left py-2 pr-4 font-medium text-[var(--ci-muted)]">Período</th>
                    <th className="text-right py-2 px-2 font-medium text-[var(--ci-muted)]">Var. mensual</th>
                    <th className="text-right py-2 px-2 font-medium text-[var(--ci-muted)]">Índice acum.</th>
                    <th className="text-left py-2 px-2 font-medium text-[var(--ci-muted)]">Fuente</th>
                    <th className="py-2 pl-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...inflacion].reverse().map(i => (
                    <tr key={i.id} className="border-b border-[var(--ci-border)] hover:bg-[var(--ci-bg)]">
                      <td className="py-2 pr-4 text-[var(--ci-text)]">{periodoLabel(i.periodo)}</td>
                      <td className="py-2 px-2 text-right text-[var(--ci-amber)]">{i.variacion_mensual != null ? `${i.variacion_mensual}%` : '—'}</td>
                      <td className="py-2 px-2 text-right font-medium text-[var(--ci-text)]">{Number(i.indice_acumulado).toFixed(2)}</td>
                      <td className="py-2 px-2 text-[var(--ci-muted)]">{i.fuente}</td>
                      <td className="py-2 pl-2">
                        <div className="flex gap-1">
                          <button onClick={() => openEditInfl(i)} className="p-1.5 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded transition-colors"><Edit size={14} /></button>
                          <button onClick={async () => { await api.inflacion.delete(i.id); fetchData() }} className="p-1.5 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {inflacion.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-[var(--ci-muted)]">Sin datos de inflación cargados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal sueldo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-[var(--ci-text)]">{selected ? 'Editar Sueldo' : 'Registrar Sueldo'}</h2>
                <button onClick={() => { setShowModal(false); setSelected(null) }} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Empleado</label>
                  <select value={form.emp_id} onChange={e => setForm({ ...form, emp_id: e.target.value })} className="input-field">
                    <option value="">Seleccionar</option>
                    {employees.filter(e => e.estado === 'Activo').map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Período</label>
                    <input type="month" value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Neto ($)</label>
                    <input type="number" value={form.neto} onChange={e => setForm({ ...form, neto: e.target.value })} className="input-field" min="0" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Fecha de pago</label>
                  <input type="date" value={form.fecha_pago} onChange={e => setForm({ ...form, fecha_pago: e.target.value })} className="input-field" />
                  <p className="text-xs text-[var(--ci-muted)] mt-1 flex items-center gap-1">
                    <Info size={11} /> Pedile al asistente que cree el recordatorio en Google Calendar o envíe el aviso por email.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Notas</label>
                  <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowModal(false); setSelected(null) }} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">Cancelar</button>
                <button onClick={handleSave} className="btn-primary" disabled={!form.emp_id || !form.periodo || !form.neto}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal inflación */}
      {showInflModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-[var(--ci-text)]">{selInfl ? 'Editar índice' : 'Agregar período'}</h2>
                <button onClick={() => { setShowInflModal(false); setSelInfl(null) }} className="p-2 hover:bg-[var(--ci-bg)] rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Período</label>
                  <input type="month" value={inflForm.periodo} onChange={e => setInflForm({ ...inflForm, periodo: e.target.value })} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Var. mensual (%)</label>
                    <input type="number" value={inflForm.variacion_mensual} onChange={e => setInflForm({ ...inflForm, variacion_mensual: e.target.value })} className="input-field" placeholder="3.5" step="0.1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Índice acumulado</label>
                    <input type="number" value={inflForm.indice_acumulado} onChange={e => setInflForm({ ...inflForm, indice_acumulado: e.target.value })} className="input-field" placeholder="100" step="0.01" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Fuente</label>
                  <input type="text" value={inflForm.fuente} onChange={e => setInflForm({ ...inflForm, fuente: e.target.value })} className="input-field" placeholder="INDEC" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowInflModal(false); setSelInfl(null) }} className="px-4 py-2 border border-[var(--ci-border)] rounded-lg hover:bg-[var(--ci-bg)]">Cancelar</button>
                <button onClick={handleSaveInfl} className="btn-primary" disabled={!inflForm.periodo || !inflForm.indice_acumulado}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sueldos
