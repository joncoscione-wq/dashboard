import React, { useState, useEffect, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/Toast'
import { api } from './config/api'

const Dashboard   = React.lazy(() => import('./components/Dashboard'))
const Employees   = React.lazy(() => import('./components/Employees'))
const Eventos     = React.lazy(() => import('./components/Eventos'))
const Homeoffice  = React.lazy(() => import('./components/Homeoffice'))
const Fleet       = React.lazy(() => import('./components/Fleet'))
const Licencias   = React.lazy(() => import('./components/Licencias'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
  </div>
)

function App() {
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    api.employees.getAll()
      .then(setEmployees)
      .catch(err => console.error('Error fetching employees:', err))
  }, [])

  const fetchEmployees = () => {
    api.employees.getAll()
      .then(setEmployees)
      .catch(err => console.error('Error fetching employees:', err))
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--ci-bg)]">
        <Navbar employees={employees} />
        <main className="container mx-auto px-4 py-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"            element={<Dashboard   employees={employees} />} />
              <Route path="/legajo"      element={<Employees   employees={employees} onUpdate={fetchEmployees} />} />
              <Route path="/eventos"     element={<Eventos     employees={employees} />} />
              <Route path="/homeoffice"  element={<Homeoffice  employees={employees} />} />
              <Route path="/flota"       element={<Fleet />} />
              <Route path="/licencias"   element={<Licencias   employees={employees} />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </ToastProvider>
  )
}

export default App
