// mismas reglas que app/Rules del back (TextoValido, NombrePersonaValido, PlacaValida)
const LETRA = 'A-Za-zÁÉÍÓÚáéíóúÑñÜü'
const PARTICULAS = ['de', 'del', 'la', 'las', 'los', 'y', 'e', 'van', 'von']

function limpiar(valor) {
  return String(valor ?? '').trim().replace(/\s+/g, ' ')
}

function escaparClase(texto) {
  return texto.replace(/[\\\]^-]/g, '\\$&')
}

// devuelve el mensaje de error o '' si esta bien
export function errorTexto(valor, { campo = 'El campo', minLetras = 2, numeros = false, simbolos = '-' } = {}) {
  const texto = limpiar(valor)
  const alfa = LETRA + (numeros ? '0-9' : '')
  const sim = escaparClase(simbolos)

  let permitidos = numeros ? 'letras, números' : 'letras'
  if (simbolos) permitidos += ` (símbolos permitidos: ${[...simbolos].join(' ')})`

  if (!new RegExp(`^[${alfa}${sim} ]+$`, 'u').test(texto)) return `${campo} solo puede llevar ${permitidos}.`
  if (!new RegExp(`^[${alfa}]`, 'u').test(texto)) return `${campo} debe empezar con una letra${numeros ? ' o un número' : ''}.`

  const fin = alfa + (simbolos.includes('.') ? '\\.' : '')
  if (!new RegExp(`[${fin}]$`, 'u').test(texto)) return `${campo} no puede terminar con un símbolo.`
  if (simbolos && new RegExp(`[${sim}] ?[${sim}]`, 'u').test(texto)) return `${campo} tiene símbolos seguidos.`
  if (/^(.)\1+$/iu.test(texto.replace(/ /g, ''))) return `${campo} no puede ser el mismo carácter repetido.`
  if (new RegExp(`([${LETRA}])\\1\\1`, 'iu').test(texto)) return `${campo} tiene una letra repetida demasiadas veces.`

  const letras = (texto.match(new RegExp(`[${LETRA}]`, 'gu')) || []).length
  if (letras < minLetras) return `${campo} debe tener al menos ${minLetras} letras.`
  return ''
}

export function errorNombrePersona(valor, { palabrasMinimas = 2, campo = 'nombre' } = {}) {
  const texto = limpiar(valor)

  if (!new RegExp(`^[${LETRA}]+(?:[' -][${LETRA}]+)*$`, 'u').test(texto)) {
    return `El ${campo} solo puede llevar letras. El guion y el apóstrofo van entre letras (ej. María-José, D'Angelo).`
  }
  if (new RegExp(`([${LETRA}])\\1\\1`, 'iu').test(texto)) return `El ${campo} tiene una letra repetida demasiadas veces.`

  const palabras = texto.replace(/'/g, '').split(/[\s-]+/u)
    .filter((p) => p.length >= 2 && !PARTICULAS.includes(p.toLowerCase()))

  if (palabras.length < palabrasMinimas) {
    return palabrasMinimas >= 2 ? 'Escribe al menos un nombre y un apellido.' : `Escribe un ${campo} válido de al menos 2 letras.`
  }
  if (palabras.some((p) => !/[aeiouyáéíóúü]/iu.test(p))) return `Revisa el ${campo}: hay una palabra sin vocales.`
  return ''
}

export function errorPlaca(valor) {
  const placa = String(valor ?? '').trim().toUpperCase()
  if (!/^[A-Z]{1,3}[ -]?\d{1,3}(?:[ -]?\d{1,4})?$/.test(placa)) {
    return 'La placa debe empezar con letras y seguir con números (ej. P123456 o P 123-456).'
  }
  const digitos = placa.replace(/\D/g, '')
  if (digitos.length < 3) return 'La placa debe tener al menos 3 números.'
  if (/^(\d)\1+$/.test(digitos)) return 'Los números de la placa no pueden ser todos iguales.'
  return ''
}
