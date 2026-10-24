export const PAISES_TELEFONO = [
  { codigo: 'SV', nombre: 'El Salvador', iso: 'sv', prefijo: '+503', digitos: 8, grupos: [4, 4], placeholder: '0000-0000' },
  { codigo: 'GT', nombre: 'Guatemala', iso: 'gt', prefijo: '+502', digitos: 8, grupos: [4, 4], placeholder: '0000-0000' },
  { codigo: 'HN', nombre: 'Honduras', iso: 'hn', prefijo: '+504', digitos: 8, grupos: [4, 4], placeholder: '0000-0000' },
  { codigo: 'NI', nombre: 'Nicaragua', iso: 'ni', prefijo: '+505', digitos: 8, grupos: [4, 4], placeholder: '0000-0000' },
  { codigo: 'CR', nombre: 'Costa Rica', iso: 'cr', prefijo: '+506', digitos: 8, grupos: [4, 4], placeholder: '0000-0000' },
  { codigo: 'PA', nombre: 'Panamá', iso: 'pa', prefijo: '+507', digitos: 8, grupos: [4, 4], placeholder: '0000-0000' },
  { codigo: 'BZ', nombre: 'Belice', iso: 'bz', prefijo: '+501', digitos: 7, grupos: [3, 4], placeholder: '000-0000' },
  { codigo: 'US', nombre: 'Estados Unidos', iso: 'us', prefijo: '+1', digitos: 10, grupos: [3, 3, 4], placeholder: '000-000-0000' },
  { codigo: 'MX', nombre: 'México', iso: 'mx', prefijo: '+52', digitos: 10, grupos: [2, 4, 4], placeholder: '00-0000-0000' },
]

export const CODIGO_PAIS_DEFAULT = 'SV'

export function soloDigitos(value) {
  return String(value || '').replace(/\D/g, '')
}

export function buscarPaisTelefono(codigo) {
  return PAISES_TELEFONO.find((pais) => pais.codigo === codigo) || PAISES_TELEFONO[0]
}

export function detectarPaisTelefono(value) {
  const digitos = soloDigitos(value)
  return PAISES_TELEFONO
    .slice()
    .sort((a, b) => soloDigitos(b.prefijo).length - soloDigitos(a.prefijo).length)
    .find((pais) => digitos.startsWith(soloDigitos(pais.prefijo))) || PAISES_TELEFONO[0]
}

export function quitarPrefijoPais(value, pais) {
  const digitos = soloDigitos(value)
  const prefijo = soloDigitos(pais.prefijo)
  return digitos.startsWith(prefijo) ? digitos.slice(prefijo.length) : digitos
}

export function formatearTelefonoLocal(value, pais) {
  const local = quitarPrefijoPais(value, pais).slice(0, pais.digitos)
  const partes = []
  let index = 0

  pais.grupos.forEach((size) => {
    const parte = local.slice(index, index + size)
    if (parte) partes.push(parte)
    index += size
  })

  return partes.join('-')
}

export function telefonoLocalNormalizado(value, pais) {
  return quitarPrefijoPais(value, pais)
}

export function telefonoNormalizadoCompleto(value, pais) {
  const local = formatearTelefonoLocal(value, pais)
  return local ? `${pais.prefijo} ${local}` : ''
}

export function validarTelefonoPais(value, pais) {
  const local = telefonoLocalNormalizado(value, pais)
  if (!local) return 'El teléfono es obligatorio.'
  if (local.length !== pais.digitos) return `Debe tener ${pais.digitos} dígitos para ${pais.prefijo}.`
  if (/^(\d)\1+$/.test(local)) return 'Ingresa un número de teléfono real, no una secuencia repetida.'
  if (pais.codigo === 'SV' && !/^[267]/.test(local)) return 'En El Salvador el número debe empezar con 2 (fijo), 6 o 7 (celular).'
  return ''
}
