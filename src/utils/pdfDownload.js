import api from '@/services/api'

/**
 * Descarga un PDF autenticado desde la API y lo abre en una nueva pestaña.
 */
export async function abrirPdf(url, params = {}) {
  const ventana = window.open('', '_blank')
  mostrarCargandoEnVentana(ventana)

  try {
    const { blob, filename } = await pedirPdf(url, params)

    if (!ventana || ventana.closed) {
      descargarBlob(blob, filename)
      return { modo: 'descarga', filename }
    }

    const blobUrl = URL.createObjectURL(blob)
    ventana.location.href = blobUrl
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    return { modo: 'pestana', filename }
  } catch (e) {
    ventana?.close()
    throw e
  }
}

export async function descargarPdf(url, params = {}, nombrePorDefecto = 'documento.pdf') {
  const { blob, filename } = await pedirPdf(url, params, nombrePorDefecto)
  descargarBlob(blob, filename)
  return { modo: 'descarga', filename }
}

async function pedirPdf(url, params = {}, nombrePorDefecto = 'documento.pdf') {
  let res
  try {
    res = await api.get(url, {
      params,
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
  } catch (e) {
    throw await errorConMensajeDelServidor(e)
  }

  await validarRespuestaPdf(res)

  return {
    blob: new Blob([res.data], { type: 'application/pdf' }),
    filename: extraerNombre(res) || nombrePorDefecto,
  }
}

function mostrarCargandoEnVentana(ventana) {
  try {
    if (!ventana?.document) return
    ventana.document.title = 'Generando PDF...'
    ventana.document.body.innerHTML =
      '<p style="font-family:system-ui,sans-serif;color:#4b5563;text-align:center;margin-top:20vh">Generando PDF, espera un momento...</p>'
  } catch {
    return
  }
}

/**
 * Obtiene un PDF como blob URL (útil para iframes en modales).
 */
export async function obtenerPdfBlobUrl(url, params = {}) {
  let res
  try {
    res = await api.get(url, {
      params,
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
  } catch (e) {
    throw await errorConMensajeDelServidor(e)
  }

  await validarRespuestaPdf(res)

  const blob = new Blob([res.data], { type: 'application/pdf' })
  return {
    blobUrl: URL.createObjectURL(blob),
    filename: extraerNombre(res) || 'documento.pdf',
    blob,
  }
}

export function revocarPdfBlobUrl(blobUrl) {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
}

export function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function extraerNombre(response) {
  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*)\1/)
  return match?.[2] ? decodeURIComponent(match[2]) : null
}

async function errorConMensajeDelServidor(error) {
  const data = error.response?.data
  if (!(data instanceof Blob)) return error
  try {
    const json = JSON.parse(await data.text())
    error.response.data = json
    if (json?.message) error.message = json.message
  } catch {
    return error
  }
  return error
}

async function validarRespuestaPdf(response) {
  const type = response.data?.type || response.headers['content-type'] || ''
  if (!type.includes('application/json')) return

  const text = await response.data.text()
  let message = 'Error al generar el PDF.'
  try {
    const json = JSON.parse(text)
    message = json.message || message
  } catch {
    /* usar mensaje por defecto */
  }
  const err = new Error(message)
  err.response = { data: { message } }
  throw err
}
