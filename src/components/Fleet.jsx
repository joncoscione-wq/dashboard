import React, { useState, useEffect } from 'react'
import { Plus, Car, Edit, Trash2, Filter, Search, X, Fuel, Wrench, Users } from 'lucide-react'
import { api } from '../config/api'

const Fleet = () => {
  const [vehicles, setVehicles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    patente: '',
    ano: '',
    tipo: 'auto',
    kilometraje: '',
    estado: 'disponible',
    asignado_a: '',
    mantenimiento_ultimo: '',
    mantenimiento_proximo: '',
    seguro_vencimiento: '',
    combustible: 'nafta'
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const data = await api.fleet.getAll()
      setVehicles(data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async () => {
    try {
      await api.fleet.create(formData)
      setShowAddModal(false)
      resetForm()
      fetchVehicles()
    } catch (error) {
      console.error('Error adding vehicle:', error)
    }
  }

  const handleEditVehicle = async () => {
    try {
      await api.fleet.update(selectedVehicle.id, formData)
      setShowEditModal(false)
      setSelectedVehicle(null)
      resetForm()
      fetchVehicles()
    } catch (error) {
      console.error('Error updating vehicle:', error)
    }
  }

  const handleDeleteVehicle = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      try {
        await api.fleet.delete(id)
        fetchVehicles()
      } catch (error) {
        console.error('Error deleting vehicle:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      marca: '',
      modelo: '',
      patente: '',
      ano: '',
      tipo: 'auto',
      kilometraje: '',
      estado: 'disponible',
      asignado_a: '',
      mantenimiento_ultimo: '',
      mantenimiento_proximo: '',
      seguro_vencimiento: '',
      combustible: 'nafta'
    })
  }

  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle)
    setFormData(vehicle)
    setShowEditModal(true)
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.patente.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || vehicle.estado === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800'
      case 'asignado': return 'bg-blue-100 text-blue-800'
      case 'mantenimiento': return 'bg-yellow-100 text-yellow-800'
      case 'fuera_servicio': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMaintenanceStatus = (proxDate) => {
    if (!proxDate) return { color: 'text-gray-500', text: 'No programado' }
    
    const today = new Date()
    const maintenance = new Date(proxDate)
    const diffDays = Math.ceil((maintenance - today) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { color: 'text-red-600', text: 'Vencido' }
    if (diffDays <= 7) return { color: 'text-yellow-600', text: `${diffDays} días` }
    if (diffDays <= 30) return { color: 'text-amber-600', text: `${diffDays} días` }
    return { color: 'text-green-600', text: `${diffDays} días` }
  }

  const VehicleModal = ({ isOpen, onClose, title, onSubmit, isEdit = false }) => {
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
                  Marca
                </label>
                <input
                  type="text"
                  value={formData.marca}
                  onChange={(e) => setFormData({...formData, marca: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  value={formData.modelo}
                  onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Patente
                </label>
                <input
                  type="text"
                  value={formData.patente}
                  onChange={(e) => setFormData({...formData, patente: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Año
                </label>
                <input
                  type="number"
                  value={formData.ano}
                  onChange={(e) => setFormData({...formData, ano: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="input-field"
                >
                  <option value="auto">Auto</option>
                  <option value="suv">SUV</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="van">Van</option>
                  <option value="moto">Moto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Combustible
                </label>
                <select
                  value={formData.combustible}
                  onChange={(e) => setFormData({...formData, combustible: e.target.value})}
                  className="input-field"
                >
                  <option value="nafta">Nafta</option>
                  <option value="diesel">Diesel</option>
                  <option value="gnc">GNC</option>
                  <option value="electrico">Eléctrico</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Kilometraje
                </label>
                <input
                  type="number"
                  value={formData.kilometraje}
                  onChange={(e) => setFormData({...formData, kilometraje: e.target.value})}
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
                  <option value="disponible">Disponible</option>
                  <option value="asignado">Asignado</option>
                  <option value="mantenimiento">En Mantenimiento</option>
                  <option value="fuera_servicio">Fuera de Servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Asignado a
                </label>
                <input
                  type="text"
                  value={formData.asignado_a}
                  onChange={(e) => setFormData({...formData, asignado_a: e.target.value})}
                  className="input-field"
                  placeholder="Nombre del empleado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Último Mantenimiento
                </label>
                <input
                  type="date"
                  value={formData.mantenimiento_ultimo}
                  onChange={(e) => setFormData({...formData, mantenimiento_ultimo: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Próximo Mantenimiento
                </label>
                <input
                  type="date"
                  value={formData.mantenimiento_proximo}
                  onChange={(e) => setFormData({...formData, mantenimiento_proximo: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ci-text)] mb-1">
                  Vencimiento Seguro
                </label>
                <input
                  type="date"
                  value={formData.seguro_vencimiento}
                  onChange={(e) => setFormData({...formData, seguro_vencimiento: e.target.value})}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">
            Gestión de Flota
          </h1>
          <p className="text-[var(--ci-muted)] mt-2">
            Administra los vehículos de la empresa
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nuevo Vehículo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--ci-muted)]">Total Vehículos</p>
              <p className="text-2xl font-bold text-[var(--ci-text)]">{vehicles.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--ci-muted)]">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.estado === 'disponible').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--ci-muted)]">Asignados</p>
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter(v => v.estado === 'asignado').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--ci-muted)]">En Mantenimiento</p>
              <p className="text-2xl font-bold text-yellow-600">
                {vehicles.filter(v => v.estado === 'mantenimiento').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Wrench size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--ci-muted)]" size={20} />
            <input
              type="text"
              placeholder="Buscar vehículo..."
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
            <option value="disponible">Disponible</option>
            <option value="asignado">Asignado</option>
            <option value="mantenimiento">En Mantenimiento</option>
            <option value="fuera_servicio">Fuera de Servicio</option>
          </select>

          <div className="flex items-center justify-center">
            <Filter className="text-[var(--ci-muted)]" size={20} />
            <span className="ml-2 text-sm text-[var(--ci-muted)]">
              {filteredVehicles.length} resultados
            </span>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => {
          const maintenanceStatus = getMaintenanceStatus(vehicle.mantenimiento_proximo)
          
          return (
            <div key={vehicle.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[var(--accent-bg)] rounded-lg flex items-center justify-center">
                    <Car size={24} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--ci-text)]">
                      {vehicle.marca} {vehicle.modelo}
                    </h3>
                    <p className="text-sm text-[var(--ci-muted)]">{vehicle.patente}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(vehicle.estado)}`}>
                  {vehicle.estado}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--ci-muted)]">Año:</span>
                  <span className="font-medium">{vehicle.ano}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ci-muted)]">Tipo:</span>
                  <span className="font-medium capitalize">{vehicle.tipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ci-muted)]">Combustible:</span>
                  <span className="font-medium capitalize">{vehicle.combustible}</span>
                </div>
                {vehicle.kilometraje && (
                  <div className="flex justify-between">
                    <span className="text-[var(--ci-muted)]">Kilometraje:</span>
                    <span className="font-medium">{vehicle.kilometraje} km</span>
                  </div>
                )}
                {vehicle.asignado_a && (
                  <div className="flex justify-between">
                    <span className="text-[var(--ci-muted)]">Asignado a:</span>
                    <span className="font-medium">{vehicle.asignado_a}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--ci-muted)]">Mantenimiento:</span>
                  <span className={`font-medium ${maintenanceStatus.color}`}>
                    {maintenanceStatus.text}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-[var(--ci-border)]">
                <button
                  onClick={() => openEditModal(vehicle)}
                  className="p-2 text-[var(--ci-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteVehicle(vehicle.id)}
                  className="p-2 text-[var(--ci-muted)] hover:text-[var(--ci-red)] hover:bg-[var(--ci-red-bg)] rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Modal */}
      <VehicleModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Agregar Nuevo Vehículo"
        onSubmit={handleAddVehicle}
      />

      {/* Edit Modal */}
      <VehicleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedVehicle(null)
          resetForm()
        }}
        title="Editar Vehículo"
        onSubmit={handleEditVehicle}
        isEdit={true}
      />
    </div>
  )
}

export default Fleet
