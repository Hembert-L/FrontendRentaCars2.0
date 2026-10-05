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

// el empleado no tiene dashboard, entra directo a reservas
export function rutaInicio(roles) {
  if (tieneAcceso(roles, 'dashboard')) return { name: 'dashboard' }
  if (tieneAcceso(roles, 'operacion')) return { name: 'reservas' }
  if (tieneAcceso(roles, 'pagos')) return { name: 'pagos' }
  return { name: 'login' }
}
