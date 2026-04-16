export const API_BASE_URL = 'http://localhost:3001/api'

export const api = {
  // Generic CRUD operations
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  put: async (endpoint, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  delete: async (endpoint, id) => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  // Specific API methods
  employees: {
    getAll: () => api.get('empleados'),
    create: (data) => api.post('empleados', data),
    update: (id, data) => api.put('empleados', id, data),
    delete: (id) => api.delete('empleados', id)
  },

  vacations: {
    getAll: () => api.get('vacaciones'),
    create: (data) => api.post('vacaciones', data),
    update: (id, data) => api.put('vacaciones', id, data),
    delete: (id) => api.delete('vacaciones', id)
  },

  absences: {
    getAll: () => api.get('ausencias'),
    create: (data) => api.post('ausencias', data),
    update: (id, data) => api.put('ausencias', id, data),
    delete: (id) => api.delete('ausencias', id)
  },

  notes: {
    getAll: (empId) => api.get(`notas${empId ? `?emp_id=${empId}` : ''}`),
    create: (data) => api.post('notas', data),
    delete: (id) => api.delete('notas', id)
  },

  events: {
    getAll: () => api.get('eventos'),
    create: (data) => api.post('eventos', data),
    update: (id, data) => api.put('eventos', id, data),
    delete: (id) => api.delete('eventos', id)
  },

  fleet: {
    getAll: () => api.get('flota'),
    create: (data) => api.post('flota', data),
    update: (id, data) => api.put('flota', id, data),
    delete: (id) => api.delete('flota', id)
  },

  presence: {
    getAll: () => api.get('presencialidad'),
    update: (empId, day, estado) => {
      return fetch(`${API_BASE_URL}/presencialidad/${empId}/${day}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      }).then(res => res.json())
    },
    setAll: (data) => {
      return fetch(`${API_BASE_URL}/presencialidad`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json())
    }
  },

  photos: {
    upload: (empId, file) => {
      const formData = new FormData()
      formData.append('photo', file)
      return fetch(`${API_BASE_URL}/photos/${empId}`, {
        method: 'POST',
        body: formData
      }).then(res => res.json())
    },
    delete: (empId) => api.delete(`photos/${empId}`)
  }
}
