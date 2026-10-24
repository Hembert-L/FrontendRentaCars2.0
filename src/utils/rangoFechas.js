// Rango de fechas permitido para reservas y contratos: desde hoy hasta el 31 de diciembre
// de dentro de dos años. Se recorre solo cada año. Tiene que coincidir con app/Support/RangoFechas.php del back.
export const ANIOS_ADELANTE = 2

// Fecha máxima en formato YYYY-MM-DD (en 2026 es 2028-12-31)
export function fechaMaximaPermitida() {
  return `${new Date().getFullYear() + ANIOS_ADELANTE}-12-31`
}

// true si la fecha (YYYY-MM-DD o con hora) pasa del límite
export function pasaFechaMaxima(fecha) {
  if (!fecha) return false
  return String(fecha).slice(0, 10) > fechaMaximaPermitida()
}

export function mensajeFechaMaxima() {
  const [anio, mes, dia] = fechaMaximaPermitida().split('-')
  return `La fecha no puede ser posterior al ${dia}/${mes}/${anio}.`
}
