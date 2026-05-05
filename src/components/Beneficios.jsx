import React, { useState, useEffect, useCallback } from 'react'
import { Gift, Plus, Pencil, Trash2, Users, Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { api } from '../config/api'
import { useToast } from './Toast'

const TIPOS = ['General', 'Particular', 'Convenio']
const ESTADOS = ['Activo', 'Inactivo']

const TIPO_COLORS = {
  General:    { bg: 'bg-[var(--accent-bg)]',      text: 'text-[var(--accent)]' },
  Particular: { bg: 'bg-[var(--ci-amber-bg)]',    text: 'text-[var(--ci-amber)]' },
  Convenio:   { bg: 'bg-[var(--ci-green-bg)]',    text: 'text-[var(--ci-green)]' },
}

const ESTADO_COLORS = {
  Activo:   { bg: 'bg-[var(--ci-green-bg)]',  text: 'text-[var(--ci-green)]' },
  Inactivo: { bg: 'bg-[var(--ci-red-bg)]',    text: 'text-[var(--ci-red)]' },
}

// ── helpers ──────────────────────────────────────────────────────────────────

const Badge = ({ label, colors }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
    {label}
  </span>
)

const emptyBeneficio = { nombre: '', tipo: 'General', descripcion: '', proveedor: '', desde: '', hasta: '', estado: 'Activo' }
const emptyAsig      = { beneficio_id: '', emp_id: '', desde: '', hasta: '', notas: '' }

// ── componente principal ──────────────────────────────────────────────────────

const Beneficios = ({ employees }) => {
  const { showToast } = useToast()
  const [beneficios,   setBeneficios]   = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [loading,      setLoading]      = useState(true)

  // vista activa: 'catalogo' | 'empleado'
  const [vista,        setVista]        = useState('catalogo')

  // filtros catálogo
  const [search,       setSearch]       = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  // filtro vista empleado
  const [filtroEmp,    setFiltroEmp]    = useState('')

  // modals
  const [modalBen,  setModalBen]  = useState(null)  // null | 'add' | beneficio obj
  const [modalAsig, setModalAsig] = useState(null)  // null | 'add' | asig obj
  const [expandedEmp, setExpandedEmp] = useState(null)

  // form states
  const [formBen,  setFormBen]  = useState(emptyBeneficio)
  const [formAsig, setFormAsig] = useState(emptyAsig)

  const activeEmps = employees.filter(e => e.estado === 'Activo')

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [b, a] = await Promise.all([api.beneficios.getAll(), api.beneficiosEmp.getAll()])
      setBeneficios(b)
      setAsignaciones(a)
    } catch (err) {
      console.error('Error fetching beneficios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── CRUD catálogo ──────────────────────────────────────────────────────────

  const openAddBen = () => { setFormBen(emptyBeneficio); setModalBen('add') }
  const openEditBen = (b) => { setFormBen({ ...b, desde: b.desde ?? '', hasta: b.hasta ?? '' }); setModalBen(b) }

  const handleSaveBen = async () => {
    const payload = {
      nombre:      formBen.nombre.trim(),
      tipo:        formBen.tipo,
      descripcion: formBen.descripcion.trim() || null,
      proveedor:   formBen.proveedor.trim()   || null,
      desde:       formBen.desde  || null,
      hasta:       formBen.hasta  || null,
      estado:      formBen.estado,
    }
    if (!payload.nombre) return
    try {
      if (modalBen === 'add') {
        const created = await api.beneficios.create(payload)
        setBeneficios(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        showToast('Beneficio agregado', async () => {
          await api.beneficios.delete(created.id)
          setBeneficios(prev => prev.filter(x => x.id !== created.id))
        })
      } else {
        const updated = await api.beneficios.update(modalBen.id, payload)
        setBeneficios(prev => prev.map(x => x.id === updated.id ? updated : x))
        showToast('Beneficio actualizado', null)
      }
      setModalBen(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteBen = async (b) => {
    const snap = [...beneficios]
    setBeneficios(prev => prev.filter(x => x.id !== b.id))
    showToast(`"${b.nombre}" eliminado`, async () => {
      await api.beneficios.create({ ...b, id: undefined })
      setBeneficios(snap)
    })
    try { await api.beneficios.delete(b.id) } catch (err) { setBeneficios(snap); console.error(err) }
  }

  // ── CRUD asignaciones ──────────────────────────────────────────────────────

  const openAddAsig = (empId = '') => {
    setFormAsig({ ...emptyAsig, emp_id: empId ? String(empId) : '' })
    setModalAsig('add')
  }

  const openEditAsig = (a) => {
    setFormAsig({
      beneficio_id: String(a.beneficio_id),
      emp_id:       String(a.emp_id),
      desde:        a.desde ?? '',
      hasta:        a.hasta ?? '',
      notas:        a.notas ?? '',
    })
    setModalAsig(a)
  }

  const handleSaveAsig = async () => {
    const payload = {
      beneficio_id: Number(formAsig.beneficio_id),
      emp_id:       Number(formAsig.emp_id),
      desde:        formAsig.desde || null,
      hasta:        formAsig.hasta || null,
      notas:        formAsig.notas.trim() || null,
    }
    if (!payload.beneficio_id || !payload.emp_id) return
    try {
      if (modalAsig === 'add') {
        const created = await api.beneficiosEmp.assign(payload)
        // re-fetch para traer el join beneficios(nombre,tipo)
        const fresh = await api.beneficiosEmp.getAll()
        setAsignaciones(fresh)
        showToast('Asignación registrada', async () => {
          await api.beneficiosEmp.remove(created.id)
          setAsignaciones(prev => prev.filter(x => x.id !== created.id))
        })
      } else {
        const updated = await api.beneficiosEmp.update(modalAsig.id, { desde: payload.desde, hasta: payload.hasta, notas: payload.notas })
        setAsignaciones(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
        showToast('Asignación actualizada', null)
      }
      setModalAsig(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAsig = async (a) => {
    const snap = [...asignaciones]
    setAsignaciones(prev => prev.filter(x => x.id !== a.id))
    const empName = employees.find(e => e.id === a.emp_id)?.nombre ?? ''
    showToast(`Asignación de "${a.beneficios?.nombre}" eliminada`, async () => {
      setAsignaciones(snap)
    })
    try { await api.beneficiosEmp.remove(a.id) } catch (err) { setAsignaciones(snap); console.error(err) }
  }

  // ── derivados / filtros ────────────────────────────────────────────────────

  const filteredBen = beneficios.filter(b => {
    const matchSearch = b.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        (b.proveedor ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTipo   = filtroTipo   === 'Todos' || b.tipo   === filtroTipo
    const matchEstado = filtroEstado === 'Todos' || b.estado === filtroEstado
    return matchSearch && matchTipo && matchEstado
  })

  // empleados activos que tienen al menos una asignación particular, o todos para mostrar General
  const empRows = activeEmps.filter(e =>
    filtroEmp ? String(e.id) === filtroEmp : true
  )

  const asigByEmp = (empId) => asignaciones.filter(a => a.emp_id === empId)

  const generalBens = beneficios.filter(b => b.tipo === 'General' && b.estado === 'Activo')

  // stats
  const statsTotal    = beneficios.filter(b => b.estado === 'Activo').length
  const statsGeneral  = beneficios.filter(b => b.tipo === 'General'    && b.estado === 'Activo').length
  const statsConvenio = beneficios.filter(b => b.tipo === 'Convenio'   && b.estado === 'Activo').length
  const statsAsig     = asignaciones.length

  // ── modals ─────────────────────────────────────────────────────────────────

  const ModalBeneficio = () => {
    if (!modalBen) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-6 border-b border-[var(--ci-border)]">
            <h3 className="text-lg font-semibold text-[var(--ci-text)]">
              {modalBen === 'add' ? 'Nuevo beneficio' : 'Editar beneficio'}
            </h3>
            <button onClick={() => setModalBen(null)} className="text-[var(--ci-muted)] hover:text-[var(--ci-text)]"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Nombre *</label>
              <input className="input-field w-full" value={formBen.nombre}
                onChange={e => setFormBen(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Tipo</label>
                <select className="input-field w-full" value={formBen.tipo}
                  onChange={e => setFormBen(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Estado</label>
                <select className="input-field w-full" value={formBen.estado}
                  onChange={e => setFormBen(p => ({ ...p, estado: e.target.value }))}>
                  {ESTADOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Descripción</label>
              <textarea className="input-field w-full" rows={2} value={formBen.descripcion}
                onChange={e => setFormBen(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Proveedor</label>
              <input className="input-field w-full" value={formBen.proveedor}
                onChange={e => setFormBen(p => ({ ...p, proveedor: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Vigencia desde</label>
                <input type="date" className="input-field w-full" value={formBen.desde}
                  onChange={e => setFormBen(p => ({ ...p, desde: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Vigencia hasta</label>
                <input type="date" className="input-field w-full" value={formBen.hasta}
                  onChange={e => setFormBen(p => ({ ...p, hasta: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 pt-0">
            <button className="btn-secondary" onClick={() => setModalBen(null)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveBen} disabled={!formBen.nombre.trim()}>
              {modalBen === 'add' ? 'Agregar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ModalAsignacion = () => {
    if (!modalAsig) return null
    const isAdd = modalAsig === 'add'
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-[var(--ci-border)]">
            <h3 className="text-lg font-semibold text-[var(--ci-text)]">
              {isAdd ? 'Asignar beneficio' : 'Editar asignación'}
            </h3>
            <button onClick={() => setModalAsig(null)} className="text-[var(--ci-muted)] hover:text-[var(--ci-text)]"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            {isAdd && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Empleado *</label>
                  <select className="input-field w-full" value={formAsig.emp_id}
                    onChange={e => setFormAsig(p => ({ ...p, emp_id: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {activeEmps.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Beneficio *</label>
                  <select className="input-field w-full" value={formAsig.beneficio_id}
                    onChange={e => setFormAsig(p => ({ ...p, beneficio_id: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {beneficios.filter(b => b.estado === 'Activo').map(b => (
                      <option key={b.id} value={b.id}>[{b.tipo}] {b.nombre}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {!isAdd && (
              <p className="text-sm text-[var(--ci-muted)]">
                <span className="font-medium text-[var(--ci-text)]">{modalAsig.beneficios?.nombre}</span>
                {' — '}{employees.find(e => e.id === modalAsig.emp_id)?.nombre}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Desde</label>
                <input type="date" className="input-field w-full" value={formAsig.desde}
                  onChange={e => setFormAsig(p => ({ ...p, desde: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Hasta</label>
                <input type="date" className="input-field w-full" value={formAsig.hasta}
                  onChange={e => setFormAsig(p => ({ ...p, hasta: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">Notas</label>
              <textarea className="input-field w-full" rows={2} value={formAsig.notas}
                onChange={e => setFormAsig(p => ({ ...p, notas: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 pt-0">
            <button className="btn-secondary" onClick={() => setModalAsig(null)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveAsig}
              disabled={isAdd && (!formAsig.beneficio_id || !formAsig.emp_id)}>
              {isAdd ? 'Asignar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">Beneficios</h1>
          <p className="text-[var(--ci-muted)] mt-1">Catálogo de beneficios y asignaciones por empleado</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddBen}>
          <Plus size={16} /> Nuevo beneficio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Beneficios activos', value: statsTotal,    color: 'var(--accent)' },
          { label: 'Generales',          value: statsGeneral,  color: 'var(--ci-green)' },
          { label: 'Convenios',          value: statsConvenio, color: 'var(--ci-amber)' },
          { label: 'Asignaciones indiv.', value: statsAsig,   color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderLeft: '3px solid ' + s.color }}>
            <p className="text-xs text-[var(--ci-muted)] uppercase font-poppins">{s.label}</p>
            <p className="text-3xl font-bold font-poppins mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--ci-border)]">
        {[
          { key: 'catalogo', label: 'Catálogo', icon: Gift },
          { key: 'empleado', label: 'Por empleado', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setVista(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              vista === key
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ci-muted)] hover:text-[var(--ci-text)]'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Vista: Catálogo ────────────────────────────────────────────────── */}
      {vista === 'catalogo' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ci-muted)]" />
              <input className="input-field w-full pl-9" placeholder="Buscar beneficio o proveedor..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input-field" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="Todos">Todos los tipos</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="input-field" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="Todos">Todos los estados</option>
              {ESTADOS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Tabla */}
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-[var(--ci-bg)] border-b border-[var(--ci-border)]">
                <tr>
                  {['Nombre', 'Tipo', 'Proveedor', 'Vigencia', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--ci-muted)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ci-border)]">
                {filteredBen.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-[var(--ci-muted)]">Sin resultados</td></tr>
                )}
                {filteredBen.map(b => (
                  <tr key={b.id} className="hover:bg-[var(--ci-bg)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--ci-text)]">{b.nombre}</p>
                      {b.descripcion && <p className="text-xs text-[var(--ci-muted)] mt-0.5 line-clamp-1">{b.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3"><Badge label={b.tipo} colors={TIPO_COLORS[b.tipo]} /></td>
                    <td className="px-4 py-3 text-[var(--ci-muted)]">{b.proveedor ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--ci-muted)] whitespace-nowrap">
                      {b.desde && b.hasta ? `${b.desde} → ${b.hasta}` : b.desde ? `desde ${b.desde}` : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge label={b.estado} colors={ESTADO_COLORS[b.estado]} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditBen(b)} className="p-1 text-[var(--ci-muted)] hover:text-[var(--accent)]"><Pencil size={15} /></button>
                        <button onClick={() => handleDeleteBen(b)} className="p-1 text-[var(--ci-muted)] hover:text-[var(--ci-red)]"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Vista: Por empleado ────────────────────────────────────────────── */}
      {vista === 'empleado' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <select className="input-field" value={filtroEmp} onChange={e => setFiltroEmp(e.target.value)}>
                <option value="">Todos los empleados</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <button className="btn-secondary flex items-center gap-2" onClick={() => openAddAsig()}>
              <Plus size={14} /> Asignar beneficio
            </button>
          </div>

          {/* Info generales */}
          {generalBens.length > 0 && (
            <div className="card bg-[var(--accent-bg)] border border-[var(--accent)]/20">
              <p className="text-xs font-semibold text-[var(--accent)] uppercase mb-2">
                Beneficios generales (aplican a todos los empleados activos)
              </p>
              <div className="flex flex-wrap gap-2">
                {generalBens.map(b => (
                  <span key={b.id} className="px-2.5 py-1 rounded-full text-xs bg-white text-[var(--accent)] border border-[var(--accent)]/30 font-medium">
                    {b.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Acordeón por empleado */}
          <div className="space-y-2">
            {empRows.map(emp => {
              const asigs = asigByEmp(emp.id)
              const isOpen = expandedEmp === emp.id
              return (
                <div key={emp.id} className="card p-0 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--ci-bg)] transition-colors"
                    onClick={() => setExpandedEmp(isOpen ? null : emp.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--accent-bg)] rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-[var(--accent)]">{emp.nombre.split(',')[0].charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[var(--ci-text)]">{emp.nombre}</p>
                        <p className="text-xs text-[var(--ci-muted)]">{emp.puesto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--ci-muted)]">
                        {asigs.length} particular{asigs.length !== 1 ? 'es' : ''}
                        {' · '}{generalBens.length} general{generalBens.length !== 1 ? 'es' : ''}
                      </span>
                      {isOpen ? <ChevronUp size={16} className="text-[var(--ci-muted)]" /> : <ChevronDown size={16} className="text-[var(--ci-muted)]" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[var(--ci-border)] px-4 py-3 space-y-2">
                      {asigs.length === 0 && (
                        <p className="text-sm text-[var(--ci-muted)] py-1">Sin asignaciones particulares.</p>
                      )}
                      {asigs.map(a => (
                        <div key={a.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[var(--ci-bg)]">
                          <div className="flex items-center gap-2">
                            <Badge label={a.beneficios?.tipo ?? '—'} colors={TIPO_COLORS[a.beneficios?.tipo] ?? TIPO_COLORS.Particular} />
                            <span className="text-sm text-[var(--ci-text)] font-medium">{a.beneficios?.nombre}</span>
                            {a.notas && <span className="text-xs text-[var(--ci-muted)]">· {a.notas}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            {(a.desde || a.hasta) && (
                              <span className="text-xs text-[var(--ci-muted)]">
                                {a.desde ?? '…'} → {a.hasta ?? '…'}
                              </span>
                            )}
                            <button onClick={() => openEditAsig(a)} className="p-1 text-[var(--ci-muted)] hover:text-[var(--accent)]"><Pencil size={13} /></button>
                            <button onClick={() => handleDeleteAsig(a)} className="p-1 text-[var(--ci-muted)] hover:text-[var(--ci-red)]"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                      <button
                        className="mt-1 text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                        onClick={() => openAddAsig(emp.id)}
                      >
                        <Plus size={12} /> Agregar asignación
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ModalBeneficio />
      <ModalAsignacion />
    </div>
  )
}

export default Beneficios
