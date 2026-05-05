import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Users, CalendarDays, Smartphone, Laptop, Menu, X, Building } from 'lucide-react'

const Navbar = ({ employees }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Resumen',           href: '/',           icon: Building },
    { name: 'Legajo',            href: '/legajo',      icon: Users },
    { name: 'Eventos',           href: '/eventos',     icon: CalendarDays },
    { name: 'Homeoffice',        href: '/homeoffice',  icon: Laptop },
    { name: 'Flota de Celulares',href: '/flota',       icon: Smartphone },
  ]

  const activeEmployees = employees.filter(emp => emp.estado === 'Activo').length

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
                      : 'text-white/65 hover:text-white'
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
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
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
                <div className="text-center">
                    <p className="text-sm text-[var(--ci-muted)]">Equipo activo</p>
                    <p className="text-lg font-bold text-[var(--ci-green)]">{activeEmployees}</p>
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
