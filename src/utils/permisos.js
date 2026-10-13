// quien entra a cada modulo, tiene que coincidir con routes/api.php del back
export const ROLES_MODULO = {
  dashboard: ['ADMINISTRADOR', 'CONTADOR'],
  usuarios: ['ADMINISTRADOR'],
  operacion: ['ADMINISTRADOR', 'EMPLEADO'],
  pagos: ['ADMINISTRADOR', 'EMPLEADO', 'CONTADOR'],
  reportes: ['ADMINISTRADOR', 'EMPLEADO', 'CONTADOR'],
}

export function tieneAcceso(roles, modulo) {
  return (roles || []).some((rol) => ROLES_MODULO[modulo]?.includes(rol))
}

// acciones dentro de un modulo que no todos los roles pueden hacer (tambien coincide con el back)
export const ROLES_ACCION = {
  // POST y DELETE /admin/pagos: el contador solo consulta pagos
  registrarPago: ['ADMINISTRADOR', 'EMPLEADO'],
  // StoreVehiculoRequest / UpdateVehiculoRequest: solo el administrador crea y edita vehiculos
  gestionarVehiculos: ['ADMINISTRADOR'],
}

export function puedeHacer(roles, accion) {
  return (roles || []).some((rol) => ROLES_ACCION[accion]?.includes(rol))
}

// el empleado no tiene dashboard, entra directo a reservas
export function rutaInicio(roles) {
  if (tieneAcceso(roles, 'dashboard')) return { name: 'dashboard' }
  if (tieneAcceso(roles, 'operacion')) return { name: 'reservas' }
  if (tieneAcceso(roles, 'pagos')) return { name: 'pagos' }
  return { name: 'login' }
}
