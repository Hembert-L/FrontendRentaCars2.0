import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import { ROLES_MODULO, rutaInicio } from '@/utils/permisos'

const { dashboard, usuarios, operacion, pagos, reportes } = ROLES_MODULO

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: '/olvide-password',
      name: 'olvide-password',
      component: LoginView,
      meta: { guest: true },
    },
    {
      // el enlace del correo trae ?token=...&correo=...
      path: '/restablecer-password',
      name: 'restablecer-password',
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'inicio',
          redirect: () => rutaInicio(useAuthStore().userRoles),
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { allowedRoles: dashboard },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('../views/UsuariosView.vue'),
          meta: { allowedRoles: usuarios },
        },
        { path: 'clientes', name: 'clientes', component: () => import('../views/ClientesView.vue'), meta: { allowedRoles: operacion } },
        { path: 'vehiculos', name: 'vehiculos', component: () => import('../views/VehiculosView.vue'), meta: { allowedRoles: operacion } },
        { path: 'reservas', name: 'reservas', component: () => import('../views/ReservasView.vue'), meta: { allowedRoles: operacion } },
        { path: 'reservas/nueva', name: 'reservas-nueva', component: () => import('../views/ReservaCrearView.vue'), meta: { allowedRoles: operacion } },
        { path: 'contratos', name: 'contratos', component: () => import('../views/ContratosView.vue'), meta: { allowedRoles: operacion } },
        { path: 'contratos/nuevo', name: 'contratos-nuevo', component: () => import('../views/ContratoCrearView.vue'), meta: { allowedRoles: operacion } },
        { path: 'contratos/:id/cierre', name: 'contrato-cierre', component: () => import('../views/ContratoCierreView.vue'), meta: { allowedRoles: operacion } },
        { path: 'pagos', name: 'pagos', component: () => import('../views/PagosView.vue'), meta: { allowedRoles: pagos } },
        { path: 'mantenimiento', name: 'mantenimiento', component: () => import('../views/MantenimientoView.vue'), meta: { allowedRoles: operacion } },
        { path: 'reportes', name: 'reportes', component: () => import('../components/reportes/ReportesView.vue'), meta: { allowedRoles: reportes } },
        { path: 'reportes/vista', name: 'reportes-vista', component: () => import('../components/reportes/ReporteVista.vue'), meta: { allowedRoles: reportes } },
      ],
    },
    // una direccion que no existe manda al inicio de cada rol
    { path: '/:pathMatch(.*)*', redirect: { name: 'inicio' } },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some((record) => record.meta.guest)
  const inicio = rutaInicio(authStore.userRoles)

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // sin rol valido se deja en el login para no hacer un bucle
  if (isGuestRoute && authStore.isAuthenticated && inicio.name !== 'login') {
    return inicio
  }

  const allowedRoles = to.matched.flatMap((record) => record.meta.allowedRoles || [])
  if (allowedRoles.length && !allowedRoles.some((role) => authStore.userRoles.includes(role))) {
    return inicio
  }
})

export default router
