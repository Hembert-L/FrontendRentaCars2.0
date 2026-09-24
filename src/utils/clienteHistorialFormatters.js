import { formatFecha, fechaSoloISO } from '@/utils/reservaFormatters'

const EMPTY = '—'

export function labelTipoHistorial(tipo) {
  const map = {
    'DANIO ESTETICO': 'Daño estético',
    'DANIO MECANICO': 'Daño mecánico',
    'DEUDA PENDIENTE': 'Deuda pendiente',
    'DANIO VEHICULO': 'Daño vehículo',
    DANIO: 'Daño',
    ACCIDENTE: 'Accidente',
    'FALLA MECANICA': 'Falla mecánica',
    OTRO: 'Otro',
  }
  return map[tipo] || tipo || EMPTY
}

export function labelEstadoHistorial(estado) {
  const map = {
    VIGENTE: 'Vigente',
    RESUELTO: 'Resuelto',
    ARCHIVADO: 'Archivado',
    REPORTADA: 'Reportada',
    'EN REVISION': 'En revisión',
    RESUELTA: 'Resuelta',
    ANULADA: 'Anulada',
  }
  return map[estado] || estado || EMPTY
}

export function estadoHistorialStyle(estado, isDark = false) {
  const light = {
    VIGENTE: 'background:#fef3c7;color:#92400e;',
    RESUELTO: 'background:#dcfce7;color:#166534;',
    ARCHIVADO: 'background:#f3f4f6;color:#4b5563;',
    REPORTADA: 'background:#fef3c7;color:#92400e;',
    'EN REVISION': 'background:#dbeafe;color:#1d4ed8;',
    RESUELTA: 'background:#dcfce7;color:#166534;',
    ANULADA: 'background:#fee2e2;color:#991b1b;',
  }
  const dark = {
    VIGENTE: 'background:rgba(146,43,33,0.25);color:#f0a500;border:1px solid rgba(240,165,0,0.3);',
    RESUELTO: 'background:rgba(22,101,52,0.25);color:#86efac;border:1px solid rgba(34,197,94,0.3);',
    ARCHIVADO: 'background:rgba(55,65,81,0.5);color:#9ca3af;border:1px solid #374151;',
    REPORTADA: 'background:rgba(234,179,8,0.15);color:#fbbf24;border:1px solid rgba(234,179,8,0.3);',
    'EN REVISION': 'background:rgba(29,78,216,0.2);color:#93c5fd;border:1px solid rgba(59,130,246,0.3);',
    RESUELTA: 'background:rgba(22,101,52,0.25);color:#86efac;border:1px solid rgba(34,197,94,0.3);',
    ANULADA: 'background:rgba(127,29,29,0.35);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);',
  }
  const styles = isDark ? dark : light
  return styles[estado] || (isDark ? 'background:#374151;color:#d1d5db;' : 'background:#f3f4f6;color:#4b5563;')
}

export function nombreVehiculoHistorial(vehiculo) {
  if (!vehiculo) return EMPTY
  const marca = vehiculo.modelo?.marca?.nombre
  const modelo = vehiculo.modelo?.nombre
  const nombre = [marca, modelo].filter(Boolean).join(' ')
  if (nombre && vehiculo.placa) return `${nombre} (${vehiculo.placa})`
  return nombre || vehiculo.placa || EMPTY
}

export function nombreUsuarioHistorial(user) {
  if (!user) return EMPTY
  return [user.nombre, user.apellido].filter(Boolean).join(' ') || EMPTY
}

export function formatMoneyHistorial(val) {
  return '$' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatFechaSoloHistorial(fecha) {
  return formatFecha(fecha)
}

export function formatFechaHoraHistorial(fecha) {
  if (!fecha) return EMPTY
  const iso = fechaSoloISO(fecha)
  const tieneHora = String(fecha).includes('T') && !String(fecha).endsWith('T00:00:00.000000Z') && !String(fecha).match(/T00:00:00/)
  if (iso && !tieneHora) return formatFecha(fecha)
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return EMPTY
  return d.toLocaleString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function labelEstadoReserva(estado) {
  const map = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
    CANCELADA: 'Cancelada',
    CONCLUIDA: 'Concluida',
  }
  return map[estado] || estado || EMPTY
}

export function labelTipoReserva(tipo) {
  const map = {
    INMEDIATA: 'Reserva inmediata',
    ANTICIPADA: 'Reserva',
  }
  return map[tipo] || tipo || EMPTY
}

export function labelEstadoContrato(estado) {
  const map = {
    PENDIENTE: 'Pendiente',
    ACTIVO: 'Activo',
    VENCIDO: 'Vencido',
    FINALIZADO: 'Finalizado',
    ANULADO: 'Anulado',
  }
  return map[estado] || estado || EMPTY
}

export function estadoReservaStyle(estado, isDark = false) {
  const light = {
    PENDIENTE: 'background:#fef3c7;color:#92400e;',
    CONFIRMADA: 'background:#dcfce7;color:#166534;',
    CANCELADA: 'background:#fee2e2;color:#991b1b;',
    CONCLUIDA: 'background:#dbeafe;color:#1e40af;',
  }
  const dark = {
    PENDIENTE: 'background:rgba(234,179,8,0.15);color:#fbbf24;border:1px solid rgba(234,179,8,0.3);',
    CONFIRMADA: 'background:rgba(22,101,52,0.25);color:#86efac;border:1px solid rgba(34,197,94,0.3);',
    CANCELADA: 'background:rgba(127,29,29,0.35);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);',
    CONCLUIDA: 'background:rgba(30,64,175,0.25);color:#93c5fd;border:1px solid rgba(59,130,246,0.35);',
  }
  const styles = isDark ? dark : light
  return styles[estado] || (isDark ? 'background:#374151;color:#d1d5db;' : 'background:#f3f4f6;color:#4b5563;')
}

export function estadoContratoStyle(estado, isDark = false) {
  const light = {
    PENDIENTE: 'background:#fef3c7;color:#92400e;',
    ACTIVO: 'background:#dcfce7;color:#166534;',
    VENCIDO: 'background:#ffedd5;color:#c2410c;',
    FINALIZADO: 'background:#dbeafe;color:#1d4ed8;',
    ANULADO: 'background:#fee2e2;color:#991b1b;',
  }
  const dark = {
    PENDIENTE: 'background:rgba(234,179,8,0.15);color:#fbbf24;border:1px solid rgba(234,179,8,0.3);',
    ACTIVO: 'background:rgba(22,101,52,0.25);color:#86efac;border:1px solid rgba(34,197,94,0.3);',
    VENCIDO: 'background:rgba(194,65,12,0.2);color:#fdba74;border:1px solid rgba(249,115,22,0.3);',
    FINALIZADO: 'background:rgba(29,78,216,0.2);color:#93c5fd;border:1px solid rgba(59,130,246,0.3);',
    ANULADO: 'background:rgba(127,29,29,0.35);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);',
  }
  const styles = isDark ? dark : light
  return styles[estado] || (isDark ? 'background:#374151;color:#d1d5db;' : 'background:#f3f4f6;color:#4b5563;')
}
