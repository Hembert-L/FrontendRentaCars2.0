import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { fetchAllPaginated } from '@/utils/apiPagination'

export const usePagosStore = defineStore('pagos', () => {
  const pagos   = ref([])
  const loading = ref(false)
  const error   = ref(null)
  const procesando = ref(false)

  async function fetchPagos(params = {}, { silencioso = false, lanzarError = false } = {}) {
    if (!silencioso) loading.value = true
    error.value   = null
    try {
      const { items } = await fetchAllPaginated(
        (requestParams) => api.get('/admin/pagos', { params: requestParams }),
        params,
      )
      pagos.value = items
    } catch (e) {
      error.value = 'Error al cargar pagos.'
      if (!silencioso) pagos.value = []
      if (lanzarError) throw e
    } finally {
      if (!silencioso) loading.value = false
    }
  }

  async function registrar(contratoId, form) {
    if (procesando.value) throw new Error('Ya hay una operación de pago en curso.')
    procesando.value = true
    loading.value = true
    error.value   = null
    try {
      const res = await api.post('/admin/pagos', {
        contrato_id: contratoId,
        ...form,
      })
      return res.data.data
    } catch (e) {
      const errs = e.response?.data?.errors
      const firstErr = errs && typeof errs === 'object' ? Object.values(errs).flat()[0] : null
      error.value = firstErr || e.response?.data?.message || 'Error al registrar el pago.'
      throw e
    } finally {
      loading.value = false
      procesando.value = false
    }
  }

  async function registrarLote(contratoId, pagosLote, alConfirmar) {
    if (procesando.value) throw new Error('Ya hay una operación de pago en curso.')
    const lote = pagosLote.map((pago) => ({ ...pago }))
    const confirmados = []
    procesando.value = true
    error.value = null
    try {
      for (let indice = 0; indice < lote.length; indice++) {
        let res
        try {
          const pago = lote[indice]
          res = await api.post('/admin/pagos', {
            contrato_id: contratoId,
            monto: pago.monto,
            metodo_pago: pago.metodo_pago,
            fecha_pago: pago.fecha_pago,
          })
        } catch (original) {
          const controlado = [400, 401, 403, 404, 409, 422].includes(original.response?.status)
          original.progreso = {
            confirmados: [...confirmados],
            indiceFallido: indice,
            noIntentados: lote.slice(indice + 1),
            controlado,
            ambiguo: !controlado,
          }
          error.value = original.response?.data?.message || original.message || 'Error al registrar el pago.'
          throw original
        }
        confirmados.push(res.data?.data)
        alConfirmar?.(res.data?.data, indice)
      }
      return { confirmados, indiceFallido: null, noIntentados: [], controlado: false, ambiguo: false }
    } finally {
      procesando.value = false
    }
  }

  async function cancelar(pagoId, motivo_cancelacion) {
    if (procesando.value) throw new Error('Ya hay una operación de pago en curso.')
    procesando.value = true
    loading.value = true
    error.value = null
    try {
      const res = await api.delete(`/admin/pagos/${pagoId}`, {
        data: { motivo_cancelacion },
      })
      const idx = pagos.value.findIndex((p) => p.id === Number(pagoId))
      if (idx !== -1) pagos.value[idx] = res.data.data
      return res.data.data
    } catch (e) {
      const errs = e.response?.data?.errors
      const firstErr = errs && typeof errs === 'object' ? Object.values(errs).flat()[0] : null
      error.value = firstErr || e.response?.data?.message || 'Error al cancelar el pago.'
      throw e
    } finally {
      loading.value = false
      procesando.value = false
    }
  }

  return { pagos, loading, error, procesando, fetchPagos, registrar, registrarLote, cancelar }
})

