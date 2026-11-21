// el cliente puede ser nacional (dui) o extranjero (pasaporte)
export function documentoCliente(cliente) {
  if (!cliente) return ''
  return cliente.dui || cliente.pasaporte || cliente.documento || ''
}

export function tipoDocumentoCliente(cliente) {
  if (!cliente) return 'DUI'
  if (cliente.tipo_documento) return cliente.tipo_documento
  return !cliente.dui && cliente.pasaporte ? 'Pasaporte' : 'DUI'
}

// "DUI: 12345678-9" o "Pasaporte: AB12345"
export function documentoClienteTexto(cliente, vacio = '') {
  const doc = documentoCliente(cliente)
  return doc ? `${tipoDocumentoCliente(cliente)}: ${doc}` : vacio
}
