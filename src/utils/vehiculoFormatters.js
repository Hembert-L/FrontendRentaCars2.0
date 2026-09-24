export const ESTADOS_VEHICULO_NUEVO = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
]

export const ESTADOS_VEHICULO_TODOS = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'RENTADO', label: 'Rentado' },
  { value: 'EN PROCESO', label: 'En proceso' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'FUERA DE SERVICIO', label: 'Fuera de servicio' },
]

export function nombreVehiculo(v) {
  if (!v) return '—'
  const marca = v.modelo?.marca?.nombre
  const modelo = v.modelo?.nombre
  return [marca, modelo].filter(Boolean).join(' ') || v.placa || '—'
}

export function labelEstadoVehiculo(estado) {
  const map = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    RENTADO: 'Rentado',
    'EN PROCESO': 'En proceso',
    MANTENIMIENTO: 'Mantenimiento',
    'FUERA DE SERVICIO': 'Fuera de servicio',
  }
  return map[estado] || estado
}

export function estadoVehiculoStyle(estado, isDark = false) {
  if (isDark) {
    const m = {
      DISPONIBLE: 'background:#14532d; color:#86efac; border:1px solid #166534;',
      RESERVADO: 'background:#1e3a5f; color:#93c5fd; border:1px solid #1e40af;',
      RENTADO: 'background:#7f1d1d; color:#fca5a5; border:1px solid #991b1b;',
      'EN PROCESO': 'background:#4c1d95; color:#ddd6fe; border:1px solid #6d28d9;',
      MANTENIMIENTO: 'background:#713f12; color:#fde68a; border:1px solid #854d0e;',
      'FUERA DE SERVICIO': 'background:#374151; color:#d1d5db; border:1px solid #4b5563;',
    }
    return m[estado] || m['FUERA DE SERVICIO']
  }
  const m = {
    DISPONIBLE: 'background:#dcfce7; color:#166534;',
    RESERVADO: 'background:#dbeafe; color:#1e40af;',
    RENTADO: 'background:#fee2e2; color:#991b1b;',
    'EN PROCESO': 'background:#ede9fe; color:#5b21b6;',
    MANTENIMIENTO: 'background:#fef9c3; color:#854d0e;',
    'FUERA DE SERVICIO': 'background:#f3f4f6; color:#4b5563;',
  }
  return m[estado] || m['FUERA DE SERVICIO']
}
