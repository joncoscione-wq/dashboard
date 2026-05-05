import { supabase } from '../lib/supabase'

export const api = {
  employees: {
    getAll: async () => {
      const { data, error } = await supabase.from('empleados').select('*').order('nombre')
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('empleados').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('empleados').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('empleados').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  vacations: {
    getAll: async () => {
      const { data, error } = await supabase.from('vacaciones').select('*').order('desde')
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('vacaciones').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('vacaciones').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('vacaciones').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  absences: {
    getAll: async () => {
      const { data, error } = await supabase.from('ausencias').select('*').order('desde')
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('ausencias').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('ausencias').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('ausencias').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  notes: {
    // empId opcional — sin filtro devuelve todas las notas
    getAll: async (empId) => {
      let query = supabase.from('notas_people').select('*').order('created_at', { ascending: false })
      if (empId) query = query.eq('emp_id', empId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('notas_people').insert(payload).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('notas_people').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  events: {
    getAll: async () => {
      const { data, error } = await supabase.from('eventos').select('*').order('fecha')
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('eventos').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('eventos').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('eventos').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  homeoffice: {
    getAll: async () => {
      const { data, error } = await supabase.from('homeoffice_politica').select('*')
      if (error) throw error
      return data
    },
    upsert: async (empId, payload) => {
      const { data, error } = await supabase
        .from('homeoffice_politica')
        .upsert({ emp_id: Number(empId), ...payload }, { onConflict: 'emp_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    delete: async (empId) => {
      const { error } = await supabase.from('homeoffice_politica').delete().eq('emp_id', empId)
      if (error) throw error
      return { ok: true }
    }
  },

  licencias: {
    getAll: async () => {
      const { data, error } = await supabase.from('licencias').select('*').order('desde', { ascending: false })
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('licencias').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('licencias').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('licencias').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  sueldos: {
    getAll: async () => {
      const { data, error } = await supabase.from('sueldos').select('*').order('periodo', { ascending: false })
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('sueldos').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('sueldos').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('sueldos').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  inflacion: {
    getAll: async () => {
      const { data, error } = await supabase.from('inflacion_ref').select('*').order('periodo', { ascending: true })
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('inflacion_ref').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('inflacion_ref').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('inflacion_ref').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  fleet: {
    getAll: async () => {
      const { data, error } = await supabase.from('flota').select('*').order('numero')
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('flota').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('flota').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('flota').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  presence: {
    // Devuelve objeto plano { "empId_dia": "estado" } para compatibilidad con los componentes
    getAll: async () => {
      const { data, error } = await supabase.from('presencialidad').select('emp_id, dia_semana, estado')
      if (error) throw error
      return Object.fromEntries(data.map(r => [`${r.emp_id}_${r.dia_semana}`, r.estado]))
    },
    update: async (empId, day, estado) => {
      const { error } = await supabase
        .from('presencialidad')
        .upsert({ emp_id: Number(empId), dia_semana: day, estado }, { onConflict: 'emp_id,dia_semana' })
      if (error) throw error
      return { key: `${empId}_${day}`, estado }
    },
    setAll: async (flatObj) => {
      const rows = Object.entries(flatObj).map(([key, estado]) => {
        const [emp_id, dia_semana] = key.split('_')
        return { emp_id: Number(emp_id), dia_semana, estado }
      })
      const { error } = await supabase
        .from('presencialidad')
        .upsert(rows, { onConflict: 'emp_id,dia_semana' })
      if (error) throw error
      return flatObj
    }
  },

  beneficios: {
    getAll: async () => {
      const { data, error } = await supabase.from('beneficios').select('*').order('nombre')
      if (error) throw error
      return data
    },
    create: async (payload) => {
      const { data, error } = await supabase.from('beneficios').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('beneficios').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase.from('beneficios').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  beneficiosEmp: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('beneficios_empleados')
        .select('*, beneficios(nombre, tipo)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    assign: async (payload) => {
      const { data, error } = await supabase.from('beneficios_empleados').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from('beneficios_empleados').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    remove: async (id) => {
      const { error } = await supabase.from('beneficios_empleados').delete().eq('id', id)
      if (error) throw error
      return { ok: true }
    }
  },

  photos: {
    upload: async (empId, file) => {
      const ext = file.name.split('.').pop().toLowerCase()
      const filePath = `emp_${empId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('employee-photos').getPublicUrl(filePath)
      await supabase.from('empleados').update({ foto_url: data.publicUrl }).eq('id', empId)
      return { url: data.publicUrl }
    },
    delete: async (empId) => {
      const { data: emp } = await supabase.from('empleados').select('foto_url').eq('id', empId).single()
      if (emp?.foto_url) {
        const filename = emp.foto_url.split('/').pop()
        await supabase.storage.from('employee-photos').remove([filename])
        await supabase.from('empleados').update({ foto_url: null }).eq('id', empId)
      }
      return { ok: true }
    }
  }
}
