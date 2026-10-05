import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { extractListFromApi, fetchAllPaginated } from '@/utils/apiPagination'

function normalizeCliente(cliente) {
  if (!cliente) return cliente

  const municipio = cliente.municipio
  const departamento = municipio?.departamento

  return {
    ...cliente,
    municipio_id: cliente.municipio_id ?? municipio?.id ?? '',
    departamento_id: cliente.departamento_id ?? municipio?.departamento_id ?? departamento?.id ?? '',
    municipio_nombre: typeof municipio === 'object' ? municipio?.nombre : municipio,
    departamento_nombre: typeof departamento === 'object' ? departamento?.nombre : cliente.departamento,
  }
}

export const useClientesStore = defineStore('clientes', () => {

  const clientes = ref([])
  const departamentos = ref([])
  const loading  = ref(false)
  const error    = ref(null)
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  })

  const total = computed(() => pagination.value.total || clientes.value.length)

  function normalizePagination(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.data)) {
      return {
        current_page: 1,
        last_page: 1,
        per_page: clientes.value.length || 10,
        total: clientes.value.length,
        from: clientes.value.length ? 1 : 0,
        to: clientes.value.length,
      }
    }

    return {
      current_page: Number(payload.current_page || 1),
      last_page: Number(payload.last_page || 1),
      per_page: Number(payload.per_page || 10),
      total: Number(payload.total || 0),
      from: Number(payload.from || 0),
      to: Number(payload.to || 0),
    }
  }

  async function fetchClientes(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const res = await api.get('/admin/clientes', { params })
      const payload = res.data?.data
      clientes.value = extractListFromApi(res.data).map(normalizeCliente)
      pagination.value = normalizePagination(payload)
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al cargar clientes.'
      clientes.value = []
      pagination.value = normalizePagination(null)
    } finally {
      loading.value = false
    }
  }

  // filtro de licencia: el back no lo tiene, se traen todos y se pagina aqui
  async function fetchClientesFiltrados(params = {}, filtrar, page = 1, perPage = 10) {
    loading.value = true
    error.value   = null
    try {
      const filtros = { ...params }
      delete filtros.page
      const { items } = await fetchAllPaginated((p) => api.get('/admin/clientes', { params: p }), filtros)
      const visibles = items.map(normalizeCliente).filter(filtrar)
      const total = visibles.length
      const lastPage = Math.max(1, Math.ceil(total / perPage))
      const actual = Math.min(Math.max(1, Number(page) || 1), lastPage)
      const inicio = (actual - 1) * perPage
      clientes.value = visibles.slice(inicio, inicio + perPage)
      pagination.value = {
        current_page: actual,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total ? inicio + 1 : 0,
        to: inicio + clientes.value.length,
      }
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al cargar clientes.'
      clientes.value = []
      pagination.value = normalizePagination(null)
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartamentos() {
    if (departamentos.value.length) return departamentos.value

    const res = await api.get('/admin/departamentos')
    departamentos.value = Array.isArray(res.data?.data) ? res.data.data : []
    return departamentos.value
  }

  async function fetchMunicipios(departamentoId) {
    if (!departamentoId) return []

    const res = await api.get(`/admin/departamentos/${departamentoId}/municipios`)
    return Array.isArray(res.data?.data) ? res.data.data : []
  }

  async function crear(form) {
    loading.value = true
    error.value   = null
    try {
      const res = await api.post('/admin/clientes', form)
      const cliente = normalizeCliente(res.data.data)
      clientes.value.unshift(cliente)
      return cliente
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al crear cliente.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function buscarClientes(term) {
    if (!term?.trim()) return []
    try {
      const { items } = await fetchAllPaginated(
        (params) => api.get('/admin/clientes', { params }),
        { search: term.trim() },
      )
      return items.map(normalizeCliente)
    } catch {
      return []
    }
  }

  async function actualizar(form) {
    loading.value = true
    error.value   = null
    try {
      const res = await api.put(`/admin/clientes/${form.id}`, form)
      const cliente = normalizeCliente(res.data.data)
      const idx = clientes.value.findIndex(c => c.id === form.id)
      if (idx !== -1) clientes.value[idx] = cliente
      return cliente
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al actualizar cliente.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchHistorial(clienteId) {
    error.value = null
    try {
      const base = `/admin/clientes/${clienteId}/historial`
      const [resumenRes, reservasRes, contratosRes, incidenciasRes] = await Promise.all([
        api.get(`${base}/resumen`),
        fetchAllPaginated((params) => api.get(`${base}/reservas`, { params })),
        fetchAllPaginated((params) => api.get(`${base}/contratos`, { params })),
        fetchAllPaginated((params) => api.get(`${base}/incidencias`, { params })),
      ])

      const resumen = resumenRes.data?.data ?? null
      const reservas = reservasRes.items
      const contratos = contratosRes.items
      const incidentes = incidenciasRes.items.map((incidencia) => ({
        ...incidencia,
        estado: incidencia.estado_incidencia,
        tipo_registro: incidencia.tipo_incidencia,
        fecha_registro: incidencia.fecha || incidencia.created_at,
        monto_pendiente: incidencia.responsable_tipo === 'CLIENTE' ? Number(incidencia.costo || 0) : 0,
        user: incidencia.usuario || incidencia.user,
      }))

      return {
        disponible: true,
        cliente: resumen,
        reservas,
        contratos,
        incidentes,
      }
    } catch (e) {
      if (e.response?.status === 404) {
        return {
          disponible: false,
          cliente: null,
          reservas: [],
          contratos: [],
          incidentes: [],
        }
      }
      error.value = e.response?.data?.message || 'Error al cargar historial.'
      throw e
    }
  }

  return {
    clientes,
    departamentos,
    loading,
    error,
    pagination,
    total,
    fetchClientes,
    fetchClientesFiltrados,
    fetchDepartamentos,
    fetchMunicipios,
    buscarClientes,
    crear,
    actualizar,
    fetchHistorial,
  }
})
