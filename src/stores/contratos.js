import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { fetchAllPaginated } from '@/utils/apiPagination'
import { montoPagadoContrato } from '@/utils/contratoFormatters'

export const useContratosStore = defineStore('contratos', () => {
  const contratos = ref([])
  const loading   = ref(false)
  const error     = ref(null)
  const advertenciaEstetica = ref(null)
  const detallesEsteticos = ref([])

  async function fetchContratos(params = {}, { lanzarError = false } = {}) {
    loading.value = true
    error.value   = null
    try {
      const { items } = await fetchAllPaginated(
        (requestParams) => api.get('/admin/contratos', { params: requestParams }),
        params,
      )
      // El listado no incluye pagos. Recuperar el historial una vez para todas las filas.
      const { items: pagos } = await fetchAllPaginated((params) => api.get('/admin/pagos', { params }))
      const consultas = new Map()
      const completos = await Promise.all(items.map((contrato) => completarSaldoContrato({
        ...contrato,
        pagos: pagos.filter((p) => Number(p.contrato_id || p.contrato?.id) === Number(contrato.id)),
      }, items, consultas)))
      contratos.value = completos
      return completos
    } catch (e) {
      error.value = 'Error al cargar contratos.'
      contratos.value = []
      if (lanzarError) throw e
    } finally {
      loading.value = false
    }
  }

  async function completarSaldoContrato(contrato, relacionados = [], consultas = new Map()) {
    const continuacionId = contrato.info_registro?.continuado_en?.contrato_id
    let continuacion = contrato.continuacion
      || relacionados.find((c) => Number(c.contrato_origen_id) === Number(contrato.id))
    if (continuacion?.saldo_trasladado == null && (continuacionId || continuacion?.id)) {
      const id = continuacionId || continuacion.id
      // Caché limitada a esta consulta; las recargas vuelven a consultar al servidor.
      if (!consultas.has(String(id))) {
        consultas.set(String(id), api.get(`/admin/contratos/${id}`).then((res) => res.data.data))
      }
      continuacion = await consultas.get(String(id))
      if (continuacion?.saldo_trasladado == null) {
        throw new Error('No se pudo obtener el saldo trasladado a la continuación.')
      }
    }
    const completo = { ...contrato, continuacion: continuacion || null }
    return { ...completo, monto_pagado: montoPagadoContrato(completo) }
  }

  async function fetchContrato(id) {
    const res = await api.get(`/admin/contratos/${id}`)
    return completarSaldoContrato(res.data.data)
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
    return res.data
  }

  async function eliminarCargo(id) {
    const res = await api.delete(`/admin/cargos-adicionales/${id}`)
    return res.data
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
    const contrato = contratos.value.find((c) => Number(c.id) === Number(id)) || await fetchContrato(id)
    if (contrato.contrato_origen_id) {
      throw new Error('No se puede anular un contrato de continuación por cambio de vehículo.')
    }
    const res = await api.patch(`/admin/contratos/${id}/anular`, { motivo })
    const idx = contratos.value.findIndex((c) => c.id === Number(id))
    if (idx !== -1) contratos.value[idx] = { ...contratos.value[idx], ...res.data.data }
    return res.data.data
  }

  // El POST crea otra identidad; los importes y días proceden del servidor.
  async function cambiarVehiculo(id, datos) {
    const res = await api.post(`/admin/contratos/${id}/cambiar-vehiculo`, datos)
    const nuevo = res.data.data
    const continuacion = await completarSaldoContrato({ ...nuevo, pagos: [] })
    const anterior = contratos.value.find((c) => Number(c.id) === Number(id))
    let origen
    let advertencia = ''
    try {
      const detalle = await api.get(`/admin/contratos/${id}`)
      origen = await completarSaldoContrato(detalle.data.data, [continuacion])
    } catch {
      // El POST ya fue confirmado. Un fallo de lectura no debe ofrecer repetirlo.
      origen = {
        ...anterior,
        ...nuevo.contrato_origen,
        id: Number(id),
        estado_contrato: 'FINALIZADO',
        continuacion,
        info_registro: {
          ...anterior?.info_registro,
          continuado_en: { contrato_id: nuevo.id, numero_contrato: nuevo.numero_contrato },
        },
      }
      origen.monto_pagado = montoPagadoContrato(origen)
      advertencia = 'El cambio se registró. No se pudo recargar el detalle del contrato original; actualiza el listado para consultar todos sus importes.'
    }
    const ids = [Number(id), Number(continuacion.id)]
    contratos.value = [origen, continuacion, ...contratos.value.filter((c) => !ids.includes(Number(c.id)))]
    return { data: continuacion, origen, message: res.data.message, advertencia }
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
