import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Calendar, Filter, X } from 'lucide-react'
import { api } from '../config/api'

const Employees = ({ employees, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterArea, setFilterArea] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    puesto: '',
    area: '',
    ingreso: '',
    nacimiento: '',
    modalidad: 'Presencial',
    email: '',
    direccion: '',
    dni: '',
    celular: '',
    emergencia: '',
    estado: 'Activo'
  })

  const areas = [...new Set(employees.map(emp => emp.area).filter(Boolean))]

  const filteredEmployees = employees.filter(employee => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = (employee.nombre ?? '').toLowerCase().includes(search) ||
                          (employee.puesto ?? '').toLowerCase().includes(search) ||
                          (employee.email ?? '').toLowerCase().includes(search)
    const matchesStatus = filterStatus === 'todos' || employee.estado === filterStatus
    const matchesArea = filterArea === 'todos' || employee.area === filterArea
    return matchesSearch && matchesStatus && matchesArea
  })

  const handleAddEmployee = async () => {
    try {
      await api.employees.create(formData)
      setShowAddModal(false)
      setFormData({
        nombre: '',
        puesto: '',
        area: '',
        ingreso: '',
        nacimiento: '',
        modalidad: 'Presencial',
        email: '',
        direccion: '',
        dni: '',
        celular: '',
        emergencia: '',
        estado: 'Activo'
      })
      onUpdate()
    } catch (error) {
      console.error('Error adding employee:', error)
    }
  }

  const handleEditEmployee = async () => {
    try {
      await api.employees.update(selectedEmployee.id, formData)
      setShowEditModal(false)
      setSelectedEmployee(null)
      setFormData({
        nombre: '',
        puesto: '',
        area: '',
        ingreso: '',
        nacimiento: '',
        modalidad: 'Presencial',
        email: '',
        direccion: '',
        dni: '',
        celular: '',
        emergencia: '',
        estado: 'Activo'
      })
      onUpdate()
    } catch (error) {
      console.error('Error updating employee:', error)
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      try {
        await api.employees.delete(id)
        onUpdate()
      } catch (error) {
        console.error('Error deleting employee:', error)
      }
    }
  }

  const openEditModal = (employee) => {
    setSelectedEmployee(employee)
    setFormData(employee)
    setShowEditModal(true)
  }

  const EmployeeModal = ({ isOpen, onClose, title, onSubmit, isEdit = false }) => {
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
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Puesto
                </label>
                <input
                  type="text"
                  value={formData.puesto}
                  onChange={(e) => setFormData({...formData, puesto: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Área
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Fecha de ingreso
                </label>
                <input
                  type="date"
                  value={formData.ingreso}
                  onChange={(e) => setFormData({...formData, ingreso: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={formData.nacimiento}
                  onChange={(e) => setFormData({...formData, nacimiento: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Modalidad
                </label>
                <select
                  value={formData.modalidad}
                  onChange={(e) => setFormData({...formData, modalidad: e.target.value})}
                  className="input-field"
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({...formData, dni: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Contacto de emergencia
                </label>
                <input
                  type="text"
                  value={formData.emergencia}
                  onChange={(e) => setFormData({...formData, emergencia: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  className="input-field"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="input-field"
                />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">
            Gestión de Empleados
          </h1>
          <p className="text-[var(--ci-muted)] mt-1">
            Administra la información del personal
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={20} />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--ci-muted)]" size={20} />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="input-field"
          >
            <option value="todos">Todas las áreas</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <div className="flex items-center justify-center">
            <Filter className="text-[var(--ci-muted)]" size={20} />
            <span className="ml-2 text-sm text-[var(--ci-muted)]">
              {filteredEmployees.length} resultados
            </span>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[var(--accent-bg)] rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-[var(--accent)]">
                    {employee.nombre.split(',')[0].charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ci-text)]">{employee.nombre}</h3>
                  <p className="text-sm text-[var(--ci-muted)]">{employee.puesto}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                employee.estado === 'Activo' 
                  ? 'bg-[var(--ci-green-bg)] text-[var(--ci-green)]'
                  : employee.estado === 'Vacaciones'
                  ? 'bg-[var(--ci-amber-bg)] text-[var(--ci-amber)]'
                  : 'bg-[var(--ci-red-bg)] text-[var(--ci-red)]'
              }`}>
                {employee.estado}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-[var(--ci-muted)]">
                <Mail size={14} className="mr-2" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center text-[var(--ci-muted)]">
                <Phone size={14} className="mr-2" />
                <span>{employee.celular}</span>
              </div>
              <div className="flex items-center text-[var(--ci-muted)]">
                <MapPin size={14} className="mr-2" />
                <span className="truncate">{employee.area}</span>
              </div>
              <div className="flex items-center text-[var(--ci-muted)]">
                <Calendar size={14} className="mr-2" />
                <span>Ingreso: {employee.ingreso}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-[var(--ci-border)]">
              <button
                onClick={() => openEditModal(employee)}
                className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteEmployee(employee.id)}
                className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <EmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar Nuevo Empleado"
        onSubmit={handleAddEmployee}
      />

      {/* Edit Modal */}
      <EmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Empleado"
        onSubmit={handleEditEmployee}
        isEdit={true}
      />
    </div>
  )
}

export default Employees
