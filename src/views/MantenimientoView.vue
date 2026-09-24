<template>
  <div class="min-h-screen" :class="isDark ? 'bg-gray-950' : 'bg-gray-50'">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
          Mantenimiento
        </h1>
        <p class="text-sm mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Gestiona los mantenimientos de la flota
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-sm"
        style="background:#c0392b;"
        @click="abrirModalCrear"
      >
        <i class="pi pi-plus text-sm"></i>
        Nuevo mantenimiento
      </button>
    </div>

    <div
      class="rounded-2xl border shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-40"></i>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por placa, lugar o descripcion..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white'"
          @keyup.enter="aplicarFiltros"
        />
      </div>
      <select
        v-model="filtroEstado"
        class="px-4 py-2.5 rounded-xl border text-sm min-w-[160px]"
        :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white'"
        @change="aplicarFiltros"
      >
        <option value="">Todos los estados</option>
        <option value="ACTIVO">Activo</option>
        <option value="FINALIZADO">Finalizado</option>
        <option value="CANCELADO">Cancelado</option>
      </select>
      <select
        v-model="filtroTipo"
        class="px-4 py-2.5 rounded-xl border text-sm min-w-[150px]"
        :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white'"
        @change="aplicarFiltros"
      >
        <option value="">Todos los tipos</option>
        <option value="PREVENTIVO">Preventivo</option>
        <option value="CORRECTIVO">Correctivo</option>
      </select>
    </div>

    <div
      class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div v-if="store.loading" class="flex items-center justify-center py-20 gap-2 opacity-60">
        <i class="pi pi-spin pi-spinner"></i>
        <span class="text-sm">Cargando mantenimientos...</span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm mantenimiento-table">
          <thead>
            <tr :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'" class="border-b">
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest opacity-70">Vehículo</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest opacity-70">Tipo</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest opacity-70">Fecha</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest opacity-70">Lugar</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest opacity-70">Costo</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest opacity-70">Estado</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-widest opacity-70">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in listaPaginada"
              :key="m.id"
              class="border-b transition-colors"
              :class="isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'"
            >
              <td class="px-5 py-4">
                <p class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
                  {{ nombreVehiculo(m.vehiculo) }}
                </p>
                <p class="text-xs opacity-60">{{ m.vehiculo?.placa || '-' }}</p>
              </td>
              <td class="px-5 py-4">
                <span class="text-xs font-bold px-2 py-1 rounded-full" :style="tipoStyle(m.tipo_mantenimiento)">
                  {{ labelTipo(m.tipo_mantenimiento) }}
                </span>
                <p v-if="m.incidencia_id || m.incidencia" class="text-xs mt-2 max-w-[14rem] break-words" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                  Incidencia #{{ m.incidencia_id || m.incidencia.id }}<template v-if="m.incidencia"> · {{ m.incidencia.tipo_incidencia }}</template>
                  <span v-if="m.incidencia?.estado_incidencia" class="block">{{ m.incidencia.estado_incidencia }}</span>
                </p>
              </td>
              <td class="px-5 py-4 text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                {{ formatFecha(m.fecha) }}
              </td>
              <td class="px-5 py-4" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                {{ m.lugar || '-' }}
              </td>
              <td class="px-5 py-4 font-semibold" :class="isDark ? 'text-[#f0a500]' : 'text-gray-800'">
                ${{ Number(m.costo || 0).toFixed(2) }}
              </td>
              <td class="px-5 py-4">
                <span class="text-xs font-bold px-2 py-1 rounded-full" :style="estadoStyle(m.estado)">
                  {{ labelEstado(m.estado) }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="m.estado === 'ACTIVO'"
                    type="button"
                    class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                    :class="isDark ? 'border-amber-800 bg-amber-950/30 text-amber-300' : 'border-blue-200 bg-blue-50 text-blue-600'"
                    title="Editar mantenimiento"
                    @click="abrirModalEditar(m)"
                  >
                    <i class="pi pi-pencil text-xs"></i>
                  </button>
                  <button
                    v-if="authStore.isAdmin && m.estado === 'ACTIVO'"
                    type="button"
                    class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                    :class="isDark ? 'border-red-800 bg-red-950/40 text-red-300 hover:bg-red-950' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'"
                    title="Anular mantenimiento"
                    @click="confirmarEliminar(m)"
                  >
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                  <span
                    v-if="m.estado !== 'ACTIVO'"
                    :class="isDark ? 'inline-flex w-20 justify-center rounded-full bg-gray-800 px-2 py-1 text-[11px] font-bold text-gray-300' : 'inline-flex w-20 justify-center rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600'"
                    title="Los mantenimientos finalizados o cancelados no se modifican"
                  >
                    Cerrado
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="7" class="px-5 py-16 text-center opacity-50">
                <i class="pi pi-wrench text-4xl mb-3 block"></i>
                No hay mantenimientos registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-5 py-3 border-t text-xs" :class="isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} registro{{ pagination.total !== 1 ? 's' : '' }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeRetroceder || store.loading"
              @click="cambiarPagina(paginaActual - 1)"
            >
              <i class="pi pi-chevron-left text-[0.65rem]"></i>
              Anterior
            </button>
            <span class="pagination-page" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
              Página {{ pagination.current_page }} de {{ pagination.last_page }}
            </span>
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeAvanzar || store.loading"
              @click="cambiarPagina(paginaActual + 1)"
            >
              Siguiente
              <i class="pi pi-chevron-right text-[0.65rem]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <MantenimientoModal
      :visible="modalAbierto"
      :modo-edicion="modoEdicion"
      :mantenimiento="seleccionado"
      :vehiculos="vehiculosModal"
      :vehiculos-loading="vehiculosModalLoading"
      :guardando="guardando"
      @cerrar="cerrarModal"
      @guardar="guardar"
      @buscar-vehiculos="buscarVehiculosDisponibles"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import MantenimientoModal from '@/components/mantenimiento/MantenimientoModal.vue'
import { useMantenimientosStore } from '@/stores/mantenimientos'
import { useAuthStore } from '@/stores/auth'
import { useAppTheme } from '@/composables/useAppTheme'
import { formatFecha, nombreVehiculo } from '@/utils/reservaFormatters'
import api from '@/services/api'
import { fetchAllPaginated } from '@/utils/apiPagination'
import { toastSuccess } from '@/utils/toast'

const { isDark } = useAppTheme()
const store = useMantenimientosStore()
const authStore = useAuthStore()

const search = ref('')
const filtroEstado = ref('')
const filtroTipo = ref('')
const modalAbierto = ref(false)
const modoEdicion = ref(false)
const seleccionado = ref(null)
const guardando = ref(false)
const vehiculosModal = ref([])
const vehiculosModalLoading = ref(false)
const paginaActual = ref(1)
const registrosPorPagina = 10

const lista = computed(() => {
  const prioridadEstado = {
    ACTIVO: 1,
    FINALIZADO: 2,
    CANCELADO: 3,
  }

  return [...store.mantenimientos].sort((a, b) => {
    const porEstado = (prioridadEstado[a.estado] || 99) - (prioridadEstado[b.estado] || 99)
    if (porEstado !== 0) return porEstado
    return new Date(b.fecha || 0) - new Date(a.fecha || 0)
  })
})

const pagination = computed(() => {
  const total = lista.value.length
  const lastPage = Math.max(1, Math.ceil(total / registrosPorPagina))
  const currentPage = Math.min(paginaActual.value, lastPage)
  const from = total ? ((currentPage - 1) * registrosPorPagina) + 1 : 0
  const to = total ? Math.min(currentPage * registrosPorPagina, total) : 0

  return {
    current_page: currentPage,
    last_page: lastPage,
    per_page: registrosPorPagina,
    total,
    from,
    to,
  }
})

const listaPaginada = computed(() => {
  const start = (pagination.value.current_page - 1) * registrosPorPagina
  return lista.value.slice(start, start + registrosPorPagina)
})

const puedeRetroceder = computed(() => pagination.value.current_page > 1)
const puedeAvanzar = computed(() => pagination.value.current_page < pagination.value.last_page)

onMounted(async () => {
  await Promise.all([
    aplicarFiltros(),
    buscarVehiculosDisponibles(),
  ])
})

watch(
  () => lista.value.length,
  () => {
    if (paginaActual.value > pagination.value.last_page) {
      paginaActual.value = pagination.value.last_page
    }
  },
)

async function aplicarFiltros() {
  paginaActual.value = 1
  const params = {}
  if (search.value.trim()) params.search = search.value.trim()
  if (filtroEstado.value) params.estado = filtroEstado.value
  if (filtroTipo.value) params.tipo_mantenimiento = filtroTipo.value
  await store.fetchMantenimientos(params)
}

function cambiarPagina(page) {
  if (page < 1 || page > pagination.value.last_page || page === paginaActual.value) return
  paginaActual.value = page
}

async function buscarVehiculosDisponibles(search = '') {
  vehiculosModalLoading.value = true
  try {
    const params = {}
    if (search.trim()) params.search = search.trim()
    const { items } = await fetchAllPaginated(
      (requestParams) => api.get('/admin/vehiculos', { params: requestParams }),
      params,
    )
    vehiculosModal.value = items.filter((v) => ['DISPONIBLE', 'EN PROCESO'].includes(v.estado))
  } catch {
    vehiculosModal.value = []
  } finally {
    vehiculosModalLoading.value = false
  }
}

async function abrirModalCrear() {
  if (guardando.value) return
  modoEdicion.value = false
  seleccionado.value = null
  modalAbierto.value = true
  await buscarVehiculosDisponibles()
}

function abrirModalEditar(m) {
  if (guardando.value) return
  modoEdicion.value = true
  seleccionado.value = m
  vehiculosModal.value = m.vehiculo ? [m.vehiculo] : []
  modalAbierto.value = true
}

function cerrarModal() {
  if (guardando.value) return
  modalAbierto.value = false
  seleccionado.value = null
}

async function guardar(form) {
  if (guardando.value) return
  guardando.value = true
  try {
    if (modoEdicion.value && seleccionado.value?.id) {
      await store.actualizar(seleccionado.value.id, form)
    } else {
      await store.crear(form)
    }
    toastSuccess(modoEdicion.value ? 'Mantenimiento actualizado' : 'Mantenimiento registrado')
    modalAbierto.value = false
    seleccionado.value = null
    await Promise.all([
      aplicarFiltros(),
      buscarVehiculosDisponibles(),
    ])
  } catch (e) {
    const errores = e.response?.data?.errors
    const primerError = errores
      ? Object.values(errores).flat()[0]
      : null
    await Swal.fire({
      icon: 'error',
      title: 'No se pudo guardar',
      text: primerError || e.response?.data?.message || store.error || 'Revisa los datos e intenta de nuevo.',
      confirmButtonColor: '#922b21',
      background: isDark.value ? '#1f2937' : '#fff',
      color: isDark.value ? '#f3f4f6' : '#111827',
    })
  } finally {
    guardando.value = false
  }
}

async function confirmarEliminar(m) {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Anular mantenimiento',
    text: `El mantenimiento de ${m.vehiculo?.placa || 'este vehículo'} pasará a cancelado.`,
    showCancelButton: true,
    confirmButtonColor: '#c0392b',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Anular',
    cancelButtonText: 'Cancelar',
    background: isDark.value ? '#1f2937' : '#fff',
    color: isDark.value ? '#f3f4f6' : '#111827',
  })
  if (!result.isConfirmed) return
  try {
    await store.eliminar(m.id)
    await Promise.all([
      aplicarFiltros(),
      buscarVehiculosDisponibles(),
    ])
    toastSuccess('Mantenimiento anulado')
  } catch (e) {
    await Swal.fire({
      icon: 'error',
      title: 'No se pudo anular',
      text: e.response?.data?.message || store.error || 'Intenta de nuevo.',
      confirmButtonColor: '#922b21',
      background: isDark.value ? '#1f2937' : '#fff',
      color: isDark.value ? '#f3f4f6' : '#111827',
    })
  }
}

function labelTipo(tipo) {
  return tipo === 'CORRECTIVO' ? 'Correctivo' : 'Preventivo'
}

function labelEstado(estado) {
  const map = {
    ACTIVO: 'Activo',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
  }
  return map[estado] || estado || '-'
}

function tipoStyle(tipo) {
  return tipo === 'CORRECTIVO'
    ? 'background:#fee2e2;color:#991b1b;'
    : 'background:#dbeafe;color:#1e40af;'
}

function estadoStyle(estado) {
  const styles = {
    ACTIVO: 'background:#fef3c7;color:#92400e;',
    FINALIZADO: 'background:#dcfce7;color:#166534;',
    CANCELADO: 'background:#f3f4f6;color:#6b7280;',
  }
  return styles[estado] || 'background:#f3f4f6;color:#6b7280;'
}
</script>

<style scoped>
.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.15s ease;
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.pagination-btn-light {
  color: #334155;
  background: #ffffff;
  border-color: #dbe3ed;
}

.pagination-btn-light:not(:disabled):hover {
  color: #c0392b;
  background: #fff7f5;
  border-color: #fecaca;
}

.pagination-btn-dark {
  color: #d1d5db;
  background: #111827;
  border-color: #374151;
}

.pagination-btn-dark:not(:disabled):hover {
  color: #f0a500;
  background: #1f2937;
  border-color: #4b5563;
}

.pagination-page {
  min-width: 6.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
