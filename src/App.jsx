import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Employees from './components/Employees'
import Calendar from './components/Calendar'
import Fleet from './components/Fleet'
import Events from './components/Events'
import { api } from './config/api'

function App() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const data = await api.employees.getAll()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ci-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--ci-muted)]">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--ci-bg)]">
      <Navbar employees={employees} />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard employees={employees} />} />
          <Route path="/empleados" element={<Employees employees={employees} onUpdate={fetchEmployees} />} />
          <Route path="/calendario" element={<Calendar employees={employees} />} />
          <Route path="/flota" element={<Fleet />} />
          <Route path="/eventos" element={<Events />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
