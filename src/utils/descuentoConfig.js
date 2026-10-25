// Configuración pública de compilación. Mantener igual al porcentaje backend por entorno.
export function normalizarPorcentajeDescuento(valor) {
  if (valor == null || String(valor).trim() === '') return null
  const numero = Number(valor)
  return Number.isFinite(numero) && numero >= 0 && numero <= 100 ? numero : null
}

export const porcentajeDescuentoMaximo = normalizarPorcentajeDescuento(import.meta.env.VITE_DESCUENTO_MAXIMO_PORCENTAJE)
