import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Users, Calendar, Car, CalendarDays, Menu, X, Building } from 'lucide-react'

const Navbar = ({ employees }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Building },
    { name: 'Empleados', href: '/empleados', icon: Users },
    { name: 'Calendario', href: '/calendario', icon: Calendar },
    { name: 'Flota', href: '/flota', icon: Car },
    { name: 'Eventos', href: '/eventos', icon: CalendarDays },
  ]

  const activeEmployees = employees.filter(emp => emp.estado === 'Activo').length
  const onVacation = employees.filter(emp => emp.estado === 'Vacaciones').length

  return (
    <nav className="bg-[var(--primary)] border-b-3 border-[var(--accent)] sticky top-0 z-50" style={{borderBottomWidth: '3px'}}>
      <div className="container mx-auto px-7">
        <div className="flex justify-between items-center h-19" style={{height: '76px'}}>
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CI</span>
              </div>
              <div className="border-l border-white/18 h-8 mx-3"></div>
              <div>
                <h1 className="text-2xl font-bold text-white font-poppins">
                  Contexto Investments
                </h1>
                <p className="text-xs text-white/60 uppercase tracking-wider font-dm-sans" style={{letterSpacing: '2.8px'}}>RECURSOS HUMANOS</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Tabs */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition-colors ${
                    isActive
                      ? 'text-white border-b-2 border-[var(--accent)]'
                      : 'text-white/42 hover:text-white/75'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Topbar Right */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-white/60 text-sm">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="bg-white/10 text-white/75 px-3 py-1 rounded-full text-sm">
              CI RRHH
            </div>
            <button className="bg-[var(--accent)] text-white px-3 py-1 rounded-lg hover:bg-[var(--primary-70)] transition-colors text-sm">
              ↓ Exportar
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-[var(--ci-muted)] hover:bg-[var(--taupe-bg)]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--ci-border)]">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                        : 'text-[var(--ci-muted)] hover:text-[var(--primary)] hover:bg-[var(--taupe-bg)]'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
              
              <div className="pt-4 mt-4 border-t border-[var(--ci-border)]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-[var(--ci-muted)]">Activos</p>
                    <p className="text-lg font-bold text-[var(--ci-green)]">{activeEmployees}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[var(--ci-muted)]">Vacaciones</p>
                    <p className="text-lg font-bold text-[var(--ci-amber)]">{onVacation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
