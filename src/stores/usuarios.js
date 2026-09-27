import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { esAdministrador } from '@/utils/usuario'
import { fetchAllPaginated } from '@/utils/apiPagination'

export const useUsuariosStore = defineStore('usuarios', () => {

  const usuarios = ref([])
  const loading  = ref(false)
  const error    = ref(null)

  const total = computed(() => usuarios.value.length)

  async function fetchUsuarios() {
    loading.value = true
    error.value   = null
    try {
      const { items } = await fetchAllPaginated((params) => api.get('/admin/usuarios', { params }))
      usuarios.value = items
    } catch (e) {
      if (e.response?.status === 403) {
        error.value = 'No tienes permiso para ver usuarios. Solo los administradores pueden acceder a este módulo.'
      } else {
        error.value = e.response?.data?.message || 'Error al cargar usuarios.'
      }
    } finally {
      loading.value = false
    }
  }

  async function crear(form) {
    loading.value = true
    error.value   = null
    try {
      const res = await api.post('/admin/usuarios', {
        nombre:   form.nombre,
        apellido: form.apellido,
        correo:   form.correo,
        password: form.password,
        rol:      form.rol,
      })
      usuarios.value.unshift(res.data.data)
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al crear usuario.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function actualizar(form) {
    loading.value = true
    error.value   = null
    try {
      const payload = {
        nombre:   form.nombre,
        apellido: form.apellido,
        correo:   form.correo,
      }
      if (form.rol) payload.rol = form.rol
      if (form.password) payload.password = form.password

      const res = await api.put(`/admin/usuarios/${form.id}`, payload)
      const idx = usuarios.value.findIndex(u => u.id === form.id)
      if (idx !== -1) usuarios.value[idx] = res.data.data
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al actualizar usuario.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cambiarEstado(id, nuevoEstado) {
    error.value = null
    const usuario = usuarios.value.find((u) => u.id === id)
    if (usuario && esAdministrador(usuario)) {
      error.value = 'No se puede cambiar el estado de un usuario administrador.'
      return
    }
    try {
      const res = await api.delete(`/admin/usuarios/${id}`, {
        data: { estado: nuevoEstado }
      })
      const idx = usuarios.value.findIndex(u => u.id === id)
      if (idx !== -1) usuarios.value[idx].estado = res.data.data.estado
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al cambiar estado.'
    }
  }

  return { usuarios, loading, error, total, fetchUsuarios, crear, actualizar, cambiarEstado }
})
