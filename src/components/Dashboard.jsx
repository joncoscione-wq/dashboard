import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, Car, CalendarDays, Clock } from 'lucide-react'
import { api } from '../config/api'

const Dashboard = ({ employees }) => {
  const [events, setEvents] = useState([])
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, absencesData] = await Promise.all([
          api.events.getAll(),
          api.absences.getAll(),
        ])
        setEvents(eventsData)
        setAbsences(absencesData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeEmployees = employees.filter(emp => emp.estado === 'Activo').length
  const now = new Date()
  const absencesThisMonth = absences.filter(a => {
    const d = new Date(a.desde)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const upcomingBirthdays = events.filter(e => {
    const d = new Date(e.fecha)
    const diff = (d - now) / (1000 * 60 * 60 * 24)
    return e.tipo === 'Cumpleaños' && diff >= 0 && diff <= 30
  }).length
  const upcomingEvents = events.filter(e => new Date(e.fecha) >= now).slice(0, 3)

  const stats = [
    {
      title: 'Equipo activo',
      value: activeEmployees,
      icon: Users,
      color: 'bg-[var(--accent)]',
      unit: 'personas activas'
    },
    {
      title: 'Ausencias este mes',
      value: absencesThisMonth,
      icon: Clock,
      color: 'bg-[var(--ci-red)]',
      unit: 'registros'
    },
    {
      title: 'Cumpleaños próximos',
      value: upcomingBirthdays,
      icon: CalendarDays,
      color: 'bg-[var(--ci-green)]',
      unit: 'en los próximos 30 días'
    }
  ]

  const quickActions = [
    { title: 'Gestionar Empleados', href: '/empleados', icon: Users, color: 'bg-blue-500' },
    { title: 'Ver Calendario', href: '/calendario', icon: Calendar, color: 'bg-green-500' },
    { title: 'Gestionar Flota', href: '/flota', icon: Car, color: 'bg-purple-500' },
    { title: 'Eventos', href: '/eventos', icon: CalendarDays, color: 'bg-orange-500' }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--ci-text)] font-poppins">
          Dashboard RRHH
        </h1>
        <p className="text-[var(--ci-muted)] mt-2">
          Bienvenido al sistema de gestión de recursos humanos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card fade-in flex items-center" style={{borderLeft: '3px solid var(--accent)', minWidth: '130px', flex: '1'}}>
              <div className="flex items-center space-x-4">
                <div className={`w-5 h-5 ${stat.color} rounded flex items-center justify-center`}>
                  <Icon size={12} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-poppins uppercase text-[var(--ci-muted)]">{stat.title}</p>
                  <p className="text-3xl font-poppins font-bold text-[var(--primary)] mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--ci-muted)] mt-1">
                    {stat.unit}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--ci-text)] mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.href}
                className="card hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="font-medium text-[var(--ci-text)]">{action.title}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--ci-text)] mb-4">Empleados Recientes</h3>
          <div className="space-y-3">
            {employees.slice(0, 4).map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 bg-[var(--ci-bg)] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--accent-bg)] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--accent)]">
                      {employee.nombre.split(',')[0].charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--ci-text)]">{employee.nombre}</p>
                    <p className="text-sm text-[var(--ci-muted)]">{employee.puesto}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  employee.estado === 'Activo' 
                    ? 'bg-[var(--ci-green-bg)] text-[var(--ci-green)]'
                    : 'bg-[var(--ci-amber-bg)] text-[var(--ci-amber)]'
                }`}>
                  {employee.estado}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/empleados"
            className="mt-4 block text-center text-[var(--accent)] hover:text-[var(--primary)] font-medium"
          >
            Ver todos los empleados →
          </Link>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--ci-text)] mb-4">Próximos Eventos</h3>
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
              <div key={event.id} className="p-3 bg-[var(--ci-bg)] rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[var(--ci-text)]">{event.nombre}</p>
                    <p className="text-sm text-[var(--ci-muted)] mt-1">{event.tipo}</p>
                  </div>
                  <span className="text-sm text-[var(--accent)]">{event.fecha}</span>
                </div>
              </div>
            )) : (
              <p className="text-[var(--ci-muted)] text-center py-4">No hay eventos próximos</p>
            )}
          </div>
          <Link
            to="/eventos"
            className="mt-4 block text-center text-[var(--accent)] hover:text-[var(--primary)] font-medium"
          >
            Ver todos los eventos →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
