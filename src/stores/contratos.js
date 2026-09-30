import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { fetchAllPaginated } from '@/utils/apiPagination'

export const useContratosStore = defineStore('contratos', () => {
  const contratos = ref([])
  const loading   = ref(false)
  const error     = ref(null)
  const advertenciaEstetica = ref(null)
  const detallesEsteticos = ref([])

  async function fetchContratos(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const { items } = await fetchAllPaginated(
        (requestParams) => api.get('/admin/contratos', { params: requestParams }),
        params,
      )
      contratos.value = items
    } catch {
      error.value = 'Error al cargar contratos.'
      contratos.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchContrato(id) {
    const res = await api.get(`/admin/contratos/${id}`)
    return res.data.data
  }

  async function crear(form) {
    loading.value = true
    error.value   = null
    advertenciaEstetica.value = null
    detallesEsteticos.value = []
    try {
      const endpoint = form.reserva_id ? '/admin/contratos' : '/admin/contratos/directo'
      const res = await api.post(endpoint, form)
      advertenciaEstetica.value = res.data?.advertencia_estetica !== undefined
        ? res.data.advertencia_estetica
        : res.data?.advertencia || null
      detallesEsteticos.value = (res.data?.detalles_esteticos !== undefined
        ? res.data.detalles_esteticos
        : res.data?.incidencias_pendientes) || []
      contratos.value.unshift(res.data.data)
      return res.data.data
    } catch (e) {
      const errs = e.response?.data?.errors
      const firstErr = errs && typeof errs === 'object' ? Object.values(errs).flat()[0] : null
      error.value = firstErr || e.response?.data?.message || 'Error al generar el contrato.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cerrarRenta(contratoId, form) {
    const res = await api.post('/admin/cierres-renta', {
      contrato_id: contratoId,
      ...form,
    })
    // si hubo retraso y queda saldo el back responde 200 pero no cierra
    const cierreCompletado = res.data?.cierre_completado !== false
    const idx = contratos.value.findIndex((c) => c.id === Number(contratoId))
    if (cierreCompletado && idx !== -1) {
      contratos.value[idx] = {
        ...contratos.value[idx],
        estado_contrato: 'FINALIZADO',
        cierre_renta: res.data.data,
      }
    }
    return {
      cierre_completado: cierreCompletado,
      message: res.data?.message,
      data: res.data?.data,
    }
  }

  async function enviarSecuencia(endpoint, elementos, alConfirmar) {
    const lote = elementos.map((elemento) => ({ ...elemento }))
    const confirmados = []
    for (let indice = 0; indice < lote.length; indice++) {
      let res
      try {
        res = await api.post(endpoint, lote[indice])
      } catch (errorOriginal) {
        // Solo estos rechazos garantizan que no se registró el elemento.
        const ambiguo = ![400, 401, 403, 404, 422].includes(errorOriginal.response?.status)
        errorOriginal.progreso = {
          confirmados: [...confirmados],
          indiceFallido: indice,
          noIntentados: lote.slice(indice + 1),
          ambiguo,
        }
        throw errorOriginal
      }
      confirmados.push(res.data.data)
      alConfirmar?.(res.data.data, indice)
    }
    return confirmados
  }

  async function syncCargos(contratoId, cargos, alConfirmar) {
    return enviarSecuencia('/admin/cargos-adicionales', cargos.map((cargo) => ({
      contrato_id: contratoId,
      tipo_cargo: cargo.tipo_cargo || 'OTRO',
      descripcion: cargo.concepto || cargo.descripcion || null,
      monto: Number(cargo.monto || 0),
      fecha_registro: new Date().toISOString().slice(0, 19).replace('T', ' '),
    })), alConfirmar)
  }

  async function syncIncidencias(contratoId, vehiculoId, incidencias, fecha, alConfirmar) {
    return enviarSecuencia('/admin/incidencias', incidencias.map((incidencia) => ({
      vehiculo_id: vehiculoId,
      contrato_id: contratoId,
      tipo_incidencia: incidencia.tipo_incidencia,
      responsable_tipo: incidencia.responsable_tipo,
      descripcion: incidencia.descripcion,
      fecha,
      costo: Number(incidencia.costo || 0),
    })), alConfirmar)
  }

  async function actualizarCargo(id, datos) {
    const res = await api.put(`/admin/cargos-adicionales/${id}`, datos)
    return res.data.data
  }

  async function eliminarCargo(id) {
    await api.delete(`/admin/cargos-adicionales/${id}`)
  }

  async function actualizarIncidencia(id, datos) {
    const res = await api.put(`/admin/incidencias/${id}`, datos)
    return res.data.data
  }

  async function anularIncidencia(id) {
    const res = await api.delete(`/admin/incidencias/${id}`)
    return res.data.data
  }

  // solo admin, y el contrato no debe tener pagos, cargos ni incidencias
  async function anular(id, motivo) {
    const res = await api.patch(`/admin/contratos/${id}/anular`, { motivo })
    const idx = contratos.value.findIndex((c) => c.id === Number(id))
    if (idx !== -1) contratos.value[idx] = { ...contratos.value[idx], ...res.data.data }
    return res.data.data
  }

  // el precio no cambia, el carro anterior pasa a en proceso
  async function cambiarVehiculo(id, datos) {
    const res = await api.post(`/admin/contratos/${id}/cambiar-vehiculo`, datos)
    const idx = contratos.value.findIndex((c) => c.id === Number(id))
    if (idx !== -1) contratos.value[idx] = { ...contratos.value[idx], ...res.data.data }
    return res.data.data
  }

  return {
    contratos,
    loading,
    error,
    advertenciaEstetica,
    detallesEsteticos,
    fetchContratos,
    fetchContrato,
    crear,
    cerrarRenta,
    syncCargos,
    syncIncidencias,
    actualizarCargo,
    eliminarCargo,
    actualizarIncidencia,
    anularIncidencia,
    anular,
    cambiarVehiculo,
  }
})
