import { fechaHoyLocal, fechaSoloISO } from './reservaFormatters'

export const HORAS_PERMITIDAS = ['06:00', '06:30', '07:00', '18:00', '18:30', '19:00']

/** Hora 24h (HH:mm) -> formato 12h legible, ej. "6:00 a. m." */
export function formatHora12(hora24) {
  if (!hora24 || !/^\d{1,2}:\d{2}$/.test(hora24)) return '—'
  const [h, m] = hora24.split(':').map((x) => parseInt(x, 10))
  const d = new Date(2000, 0, 1, h, m)
  return d.toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export const HORAS_PERMITIDAS_OPCIONES = HORAS_PERMITIDAS.map((value) => ({
  value,
  label: formatHora12(value),
}))

/** Fecha y hora de contrato (API) en formato local 12h. */
export function formatFechaHora12(valor) {
  if (!valor) return '—'
  const s = String(valor)
  // las fechas del back vienen en utc (terminan en Z), si se leen tal cual salen 6 horas adelantadas
  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)
  const match = !tieneZona && s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  if (match) {
    const y = parseInt(match[1], 10)
    const mo = parseInt(match[2], 10)
    const d = parseInt(match[3], 10)
    const hh = parseInt(match[4], 10)
    const mm = parseInt(match[5], 10)
    const dt = new Date(y, mo - 1, d, hh, mm)
    return dt.toLocaleString('es-SV', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }
  return new Date(valor).toLocaleString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export const NIVELES_COMBUSTIBLE = [
  { value: 'E', label: 'Vacío', pct: 0 },
  { value: '1/4', label: '1/4', pct: 25 },
  { value: '1/2', label: '1/2', pct: 50 },
  { value: '3/4', label: '3/4', pct: 75 },
  { value: 'F', label: 'Lleno', pct: 100 },
]

export function normalizarNivelCombustible(valor) {
  const nivelesLegacy = { VACIO: 'E', LLENO: 'F' }
  return nivelesLegacy[valor] || valor
}

export function moneyCents(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100)
}

export function centsToMoney(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2))
}

export function toMoneyNumber(value) {
  return centsToMoney(moneyCents(value))
}

export function formatPrecio(n) {
  return toMoneyNumber(n).toLocaleString('es-SV', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function nombreVehiculo(v) {
  if (!v) return '—'
  const marca = v.modelo?.marca?.nombre
  const modelo = v.modelo?.nombre
  return [marca, modelo].filter(Boolean).join(' ') || v.placa
}

export function calcularDias(fechaEntrega, fechaDevolucion) {
  if (!fechaEntrega || !fechaDevolucion) return 0
  const d1 = new Date(fechaEntrega.slice(0, 10) + 'T00:00:00')
  const d2 = new Date(fechaDevolucion.slice(0, 10) + 'T00:00:00')
  return Math.max(1, Math.round((d2 - d1) / 86400000))
}

export function reservaChocaConContratoDirecto(fechaEntrega, fechaDevolucion, reserva) {
  const entrega = fechaSoloISO(fechaEntrega)
  const devolucion = fechaSoloISO(fechaDevolucion)
  const inicio = fechaSoloISO(reserva?.fecha_inicio)
  const fin = fechaSoloISO(reserva?.fecha_fin)
  if (!entrega || !devolucion || !inicio || !fin) return false
  return inicio <= devolucion && fin > entrega
}

export function labelEstadoContrato(e) {
  const m = { PENDIENTE: 'Pendiente', ACTIVO: 'Activo', VENCIDO: 'Vencido', FINALIZADO: 'Finalizado', ANULADO: 'Anulado' }
  return m[e] || e
}

export function labelEstadoPago(e) {
  const m = { PENDIENTE: 'Pendiente', PARCIAL: 'Pago parcial', PAGADO: 'Pagado' }
  return m[e] || e
}

export function badgeEstadoPago(estado, isDark = false) {
  if (isDark) {
    const m = {
      PENDIENTE: 'bg-red-950/60 text-red-300 border-red-900/60',
      PARCIAL: 'bg-amber-950/60 text-amber-300 border-amber-900/60',
      PAGADO: 'bg-green-950/60 text-green-300 border-green-900/60',
    }
    return m[estado] || 'bg-gray-800 text-gray-400 border-gray-700'
  }
  const m = {
    PENDIENTE: 'bg-red-50 text-red-800 border-red-200',
    PARCIAL: 'bg-amber-50 text-amber-800 border-amber-200',
    PAGADO: 'bg-green-50 text-green-800 border-green-200',
  }
  return m[estado] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export function badgeEstadoContrato(estado, isDark = false) {
  if (isDark) {
    const m = {
      PENDIENTE: 'bg-gray-800 text-gray-300 border-gray-700',
      ACTIVO: 'bg-red-950/60 text-red-300 border-red-900/60',
      VENCIDO: 'bg-amber-950/60 text-amber-300 border-amber-900/60',
      FINALIZADO: 'bg-green-950/60 text-green-300 border-green-900/60',
      ANULADO: 'bg-gray-800 text-gray-500 border-gray-700',
    }
    return m[estado] || 'bg-gray-800 text-gray-400 border-gray-700'
  }
  const m = {
    PENDIENTE: 'bg-gray-100 text-gray-700 border-gray-200',
    ACTIVO: 'bg-red-50 text-red-800 border-red-200',
    VENCIDO: 'bg-amber-50 text-amber-800 border-amber-200',
    FINALIZADO: 'bg-green-50 text-green-800 border-green-200',
    ANULADO: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return m[estado] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export function metodoPagoIcon(metodo) {
  const m = { EFECTIVO: 'pi-wallet', TRANSFERENCIA: 'pi-building', DEPOSITO: 'pi-inbox' }
  return m[metodo] || 'pi-dollar'
}

export function documentosVigentes(cliente) {
  if (!cliente) return { ok: false, duiVencido: false, licenciaVencida: true }
  // Compara días calendario locales, sin convertir las fechas de la API a UTC.
  const licencia = fechaSoloISO(cliente.vencimiento_licencia)
  const [anio, mes, dia] = licencia.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  const fechaValida = fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
  const licenciaVencida = !fechaValida || licencia <= fechaHoyLocal()
  return { ok: !licenciaVencida, duiVencido: false, licenciaVencida }
}

export function nivelCombustiblePct(valor) {
  const nivel = normalizarNivelCombustible(valor)
  return NIVELES_COMBUSTIBLE.find((n) => n.value === nivel)?.pct ?? 0
}

// solo para mostrar, el back ya los suma en monto_total_renta
export function montoExtrasContrato(contrato) {
  if (!contrato) return 0
  const cargos = contrato.cargos_adicionales || contrato.cargosAdicionales || []
  return centsToMoney(cargos
    .filter((c) => c.estado_cargo !== 'ANULADO')
    .reduce((s, c) => s + moneyCents(c.monto), 0))
}

export function montoPagadoContrato(contrato) {
  if (!contrato) return 0
  if (contrato.monto_pagado != null) return toMoneyNumber(contrato.monto_pagado)
  const pagos = contrato.pagos || []
  return centsToMoney(pagos
    .filter((p) => p.estado_transaccion === 'CONFIRMADO')
    .reduce((s, p) => s + moneyCents(p.monto), 0))
}

// ya incluye cargos e incidencias del cliente
export function totalFinalContrato(contrato) {
  if (!contrato) return 0
  return toMoneyNumber(contrato.monto_total_renta)
}

export function saldoPendienteContrato(contrato) {
  if (!contrato) return 0
  return centsToMoney(Math.max(0, moneyCents(totalFinalContrato(contrato)) - moneyCents(montoPagadoContrato(contrato))))
}
