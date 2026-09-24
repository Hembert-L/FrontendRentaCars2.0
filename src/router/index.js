import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const ROLES_OPERATIVOS = ['ADMINISTRADOR', 'EMPLEADO']

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
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: { name: 'dashboard' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('../views/UsuariosView.vue'),
          meta: { allowedRoles: ['ADMINISTRADOR'] },
        },
        { path: 'clientes', name: 'clientes', component: () => import('../views/ClientesView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'vehiculos', name: 'vehiculos', component: () => import('../views/VehiculosView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'reservas', name: 'reservas', component: () => import('../views/ReservasView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'reservas/nueva', name: 'reservas-nueva', component: () => import('../views/ReservaCrearView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'contratos', name: 'contratos', component: () => import('../views/ContratosView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'contratos/nuevo', name: 'contratos-nuevo', component: () => import('../views/ContratoCrearView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'contratos/:id/cierre', name: 'contrato-cierre', component: () => import('../views/ContratoCierreView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'pagos', name: 'pagos', component: () => import('../views/PagosView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'mantenimiento', name: 'mantenimiento', component: () => import('../views/MantenimientoView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'reportes', name: 'reportes', component: () => import('../components/reportes/ReportesView.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
        { path: 'reportes/vista', name: 'reportes-vista', component: () => import('../components/reportes/ReporteVista.vue'), meta: { allowedRoles: ROLES_OPERATIVOS } },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some((record) => record.meta.guest)

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (isGuestRoute && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  const allowedRoles = to.matched.flatMap((record) => record.meta.allowedRoles || [])
  if (allowedRoles.length && !allowedRoles.some((role) => authStore.userRoles.includes(role))) {
    return { name: 'dashboard' }
  }
})

export default router
