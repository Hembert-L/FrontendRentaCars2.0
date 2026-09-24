import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

const LEIDAS_KEY = 'rentacar_notificaciones_leidas'
let notificacionesDisponibles = true

function cargarLeidas() {
  try {
    const raw = localStorage.getItem(LEIDAS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function guardarLeidas(ids) {
  localStorage.setItem(LEIDAS_KEY, JSON.stringify(ids))
}

function normalizarTipo(tipo) {
  return String(tipo || '').toLowerCase()
}

function tituloNotificacion(tipo) {
  const map = {
    licencia_por_vencer: 'Licencia por vencer',
    seguro_por_vencer: 'Seguro por vencer',
    pago_pendiente: 'Pago pendiente',
    pago_parcial: 'Pago parcial',
    incidencia_pendiente: 'Incidencia pendiente',
    reserva_creada: 'Reserva reciente',
  }
  return map[tipo] || 'Notificación'
}

function prioridadOrden(prioridad) {
  const map = { ALTA: 1, MEDIA: 2, BAJA: 3 }
  return map[String(prioridad || '').toUpperCase()] || 9
}

function rutaNotificacion(notif) {
  if (notif.contrato_id) return { name: 'pagos', query: { contrato_id: notif.contrato_id } }
  if (notif.cliente_id) return { name: 'clientes' }
  if (notif.vehiculo_id) return { name: 'vehiculos' }
  if (notif.reserva_id) return { name: 'reservas' }
  return null
}

function normalizarNotificacion(notif, index) {
  const tipo = normalizarTipo(notif.tipo)
  const entidad = notif.contrato_id || notif.cliente_id || notif.vehiculo_id || notif.seguro_id || notif.incidencia_id || notif.reserva_id || index
  return {
    ...notif,
    id: notif.id || `${tipo}-${entidad}-${String(notif.mensaje || '').slice(0, 40)}`,
    tipo,
    titulo: notif.titulo || tituloNotificacion(tipo),
    prioridad_orden: notif.prioridad_orden ?? prioridadOrden(notif.prioridad),
    fecha: notif.fecha || notif.created_at || null,
    ruta: notif.ruta || rutaNotificacion(notif),
  }
}

function extraerNotificaciones(responseData) {
  const payload = responseData?.data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.notificaciones)) return payload.notificaciones
  return []
}


export const useNotificacionesStore = defineStore('notificaciones', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)
  const leidas = ref(cargarLeidas())
  const flyingQueue = ref([])
  const conocidas = ref(new Set())
  const primeraCarga = ref(true)

  const noLeidas = computed(() =>
    items.value.filter((n) => !leidas.value.includes(n.id)).length,
  )

  const ordenadas = computed(() =>
    [...items.value].sort((a, b) => {
      const aLeida = leidas.value.includes(a.id)
      const bLeida = leidas.value.includes(b.id)
      if (aLeida !== bLeida) return aLeida ? 1 : -1
      return (a.prioridad_orden ?? 9) - (b.prioridad_orden ?? 9)
    }),
  )

  function esLeida(id) {
    return leidas.value.includes(id)
  }

  function marcarLeida(id) {
    if (!leidas.value.includes(id)) {
      leidas.value = [...leidas.value, id]
      guardarLeidas(leidas.value)
    }
  }

  function marcarTodasLeidas() {
    leidas.value = items.value.map((n) => n.id)
    guardarLeidas(leidas.value)
  }

  function encolarAnimacion(nuevas) {
    nuevas.forEach((notif, index) => {
      const flyKey = `${notif.id}-${Date.now()}-${index}`
      setTimeout(() => {
        flyingQueue.value.push({ ...notif, _flyKey: flyKey })
        setTimeout(() => {
          flyingQueue.value = flyingQueue.value.filter((f) => f._flyKey !== flyKey)
        }, 1400)
      }, index * 450)
    })
  }

  async function fetchNotificaciones(silencioso = false) {
    if (!notificacionesDisponibles) return
    if (!silencioso) loading.value = true
    error.value = null
    try {
      const res = await api.get('/admin/notificaciones')
      const lista = extraerNotificaciones(res.data).map(normalizarNotificacion)
      const idsNuevos = lista
        .map((n) => n.id)
        .filter((id) => !conocidas.value.has(id))

      if (conocidas.value.size > 0 && idsNuevos.length > 0) {
        encolarAnimacion(lista.filter((n) => idsNuevos.includes(n.id)))
      }

      lista.forEach((n) => conocidas.value.add(n.id))
      items.value = lista

      if (primeraCarga.value) {
        primeraCarga.value = false
        const paraMostrar = lista.filter((n) => !leidas.value.includes(n.id)).slice(0, 3)
        if (paraMostrar.length) {
          setTimeout(() => encolarAnimacion(paraMostrar), 600)
        }
      }
    } catch (e) {
      if (e.response?.status === 404) {
        notificacionesDisponibles = false
        error.value = null
        items.value = []
        primeraCarga.value = false
        return
      }
      error.value = e.response?.data?.message || 'No se pudieron cargar las notificaciones.'
      if (!silencioso) items.value = []
    } finally {
      if (!silencioso) loading.value = false
    }
  }

  function iniciarPolling(intervaloMs = 60000) {
    fetchNotificaciones()
    return setInterval(() => fetchNotificaciones(true), intervaloMs)
  }

  return {
    items,
    ordenadas,
    flyingQueue,
    loading,
    error,
    noLeidas,
    esLeida,
    marcarLeida,
    marcarTodasLeidas,
    fetchNotificaciones,
    iniciarPolling,
  }
})



