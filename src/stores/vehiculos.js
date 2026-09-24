import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import { extractListFromApi, fetchAllPaginated } from '@/utils/apiPagination'

function extraerListaApi(payload) {
  return extractListFromApi({ data: payload })
}

function limpiarPayloadVehiculo(form) {
  const { estado, ...payload } = form || {}
  return payload
}

export const useVehiculosStore = defineStore('vehiculos', () => {
  const vehiculos = ref([])
  const loading = ref(false)
  const error = ref(null)
  const estadosOpciones = ref([])
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  })

  const total = computed(() => pagination.value.total || vehiculos.value.length)

  const marcas = ref([])
  const categorias = ref([])
  const propietarios = ref([])
  const modelosPorMarca = ref({})
  const catalogosCargando = ref(false)
  const catalogosCargados = {
    marcas: false,
    categorias: false,
    propietarios: false,
  }
  let catalogosPromesa = null

  function normalizePagination(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.data)) {
      return {
        current_page: 1,
        last_page: 1,
        per_page: vehiculos.value.length || 15,
        total: vehiculos.value.length,
        from: vehiculos.value.length ? 1 : 0,
        to: vehiculos.value.length,
      }
    }

    return {
      current_page: Number(payload.current_page || 1),
      last_page: Number(payload.last_page || 1),
      per_page: Number(payload.per_page || 15),
      total: Number(payload.total || 0),
      from: Number(payload.from || 0),
      to: Number(payload.to || 0),
    }
  }

  async function fetchVehiculos(params = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await api.get('/admin/vehiculos', { params })
      const payload = res.data?.data
      vehiculos.value = extractListFromApi(res.data)
      pagination.value = normalizePagination(payload)
      estadosOpciones.value = res.data.meta?.estados ?? []
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al cargar vehículos.'
      vehiculos.value = []
      pagination.value = normalizePagination(null)
    } finally {
      loading.value = false
    }
  }

  async function fetchCatalogos(force = false) {
    if (!force && catalogosCargados.marcas && catalogosCargados.categorias && catalogosCargados.propietarios) {
      return { marcas: marcas.value, categorias: categorias.value, propietarios: propietarios.value }
    }
    if (catalogosPromesa && !force) return catalogosPromesa

    catalogosCargando.value = true
    catalogosPromesa = (async () => {
      try {
        const [marcasRes, catsRes, propsRes] = await Promise.allSettled([
          api.get('/marcas'),
          api.get('/categorias'),
          fetchAllPaginated((params) => api.get('/admin/propietarios', { params })),
        ])
        marcas.value = marcasRes.status === 'fulfilled' ? extraerListaApi(marcasRes.value.data?.data) : []
        categorias.value = catsRes.status === 'fulfilled' ? extraerListaApi(catsRes.value.data?.data) : []
        propietarios.value = propsRes.status === 'fulfilled' ? propsRes.value.items : []
        catalogosCargados.marcas = marcasRes.status === 'fulfilled'
        catalogosCargados.categorias = catsRes.status === 'fulfilled'
        catalogosCargados.propietarios = propsRes.status === 'fulfilled'
        return { marcas: marcas.value, categorias: categorias.value, propietarios: propietarios.value }
      } finally {
        catalogosCargando.value = false
        catalogosPromesa = null
      }
    })()

    return catalogosPromesa
  }

  async function fetchModelos(marcaId, force = false) {
    if (!marcaId) return []
    const key = String(marcaId)
    if (!force && modelosPorMarca.value[key]?.length) {
      return modelosPorMarca.value[key]
    }
    try {
      const res = await api.get(`/marcas/${marcaId}/modelos`)
      const lista = extraerListaApi(res.data?.data)
      modelosPorMarca.value[key] = lista
      return lista
    } catch {
      modelosPorMarca.value[key] = []
      return []
    }
  }

  function invalidarCatalogos(tipo) {
    if (!tipo || tipo === 'marca') {
      marcas.value = []
      modelosPorMarca.value = {}
      catalogosCargados.marcas = false
    }
    if (!tipo || tipo === 'categoria') {
      categorias.value = []
      catalogosCargados.categorias = false
    }
    if (!tipo || tipo === 'propietario') {
      propietarios.value = []
      catalogosCargados.propietarios = false
    }
    if (!tipo || tipo === 'modelo') modelosPorMarca.value = {}
  }

  async function crear(form) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/admin/vehiculos', limpiarPayloadVehiculo(form))
      vehiculos.value.unshift(res.data.data)
      return res.data.data
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al crear vehículo.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function actualizar(form) {
    loading.value = true
    error.value = null
    try {
      const res = await api.put(`/admin/vehiculos/${form.id}`, limpiarPayloadVehiculo(form))
      const idx = vehiculos.value.findIndex((v) => v.id === form.id)
      if (idx !== -1) vehiculos.value[idx] = res.data.data
      return res.data.data
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al actualizar vehículo.'
      throw e
    } finally {
      loading.value = false
    }
  }
  async function restaurar(id, motivo_restauracion) {
    loading.value = true
    error.value = null
    try {
      const res = await api.patch(`/admin/vehiculos/${id}/restaurar`, { motivo_restauracion })
      const idx = vehiculos.value.findIndex((v) => v.id === Number(id))
      if (idx !== -1) vehiculos.value[idx] = res.data.data
      return res.data.data
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al restaurar vehículo.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    vehiculos,
    loading,
    error,
    estadosOpciones,
    pagination,
    total,
    marcas,
    categorias,
    propietarios,
    modelosPorMarca,
    catalogosCargando,
    fetchVehiculos,
    fetchCatalogos,
    fetchModelos,
    invalidarCatalogos,
    crear,
    actualizar,
    restaurar,
  }
})



