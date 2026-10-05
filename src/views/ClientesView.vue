<template>
  <div class="min-h-screen" :class="isDark ? 'bg-gray-950' : 'bg-gray-50'">

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">Clientes</h1>
        <p class="text-sm mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Gestiona los clientes registrados</p>
      </div>
      <button
        @click="abrirModalCrear"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
        style="background:#c0392b;"
      >
        <i class="pi pi-plus text-sm"></i>
        Nuevo cliente
      </button>
    </div>

    <div
      class="rounded-2xl border shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div class="relative flex-1">
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
          :class="isDark ? 'text-[#f0a500]' : 'text-gray-400'"
        ></i>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, DUI o teléfono..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          :class="isDark
            ? 'border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500'
            : 'border-gray-200 bg-gray-50'"
        />
      </div>
      <select
        v-model="filtroLicencia"
        class="px-4 py-2.5 rounded-xl border text-sm focus:outline-none min-w-[170px]"
        :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'"
      >
        <option value="">Toda licencia</option>
        <option value="vigente">Licencia vigente</option>
        <option value="por_vencer">Vence en 30 días</option>
        <option value="vencida">Licencia vencida</option>
      </select>
    </div>

    <div
      class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div v-if="store.loading" class="flex items-center justify-center py-20 gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <i class="pi pi-spin pi-spinner"></i>
        <span class="text-sm">Cargando clientes...</span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr :style="isDark ? 'background:#111827; border-bottom:1px solid #1f2937;' : 'background:#f3f6fa; border-bottom:1px solid #dbe3ed;'">
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Cliente</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">DUI</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Licencia</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Ubicación</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Licencia vigente</th>
              <th class="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cliente in clientesFiltrados"
              :key="cliente.id"
              class="border-b transition-colors"
              :class="isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50/80'"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    :style="`background:${avatarColor(cliente.nombre)}`"
                  >{{ initials(cliente.nombre) }}</div>
                  <div>
                    <p class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ cliente.nombre }}</p>
                    <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ cliente.telefono }}</p>
                  </div>
                </div>
              </td>

              <td class="px-5 py-4" :class="isDark ? 'text-gray-400' : 'text-gray-600'">{{ cliente.dui }}</td>

              <td class="px-5 py-4">
                <p class="font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ cliente.numero_licencia }}</p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Vence: {{ formatFecha(cliente.vencimiento_licencia) }}</p>
              </td>

              <td class="px-5 py-4" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                {{ ubicacionCliente(cliente) }}
              </td>

              <td class="px-5 py-4">
                <span
                  class="text-xs font-bold px-2.5 py-1 rounded-full"
                  :class="licenciaVigente(cliente.vencimiento_licencia)
                    ? (isDark ? 'bg-green-950/50 text-green-300 border border-green-800/50' : '')
                    : (isDark ? 'bg-red-950/50 text-red-300 border border-red-800/50' : '')"
                  :style="!isDark ? (licenciaVigente(cliente.vencimiento_licencia)
                    ? 'background:#dcfce7; color:#166534;'
                    : 'background:#fee2e2; color:#991b1b;') : ''"
                >
                  {{ licenciaVigente(cliente.vencimiento_licencia) ? 'Vigente' : 'Vencida' }}
                </span>
              </td>

              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="abrirHistorial(cliente)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:shadow-sm"
                    :class="isDark
                      ? 'border-gray-700 bg-gray-800 text-[#f0a500] hover:bg-gray-700 hover:border-gray-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'"
                    title="Ver historial"
                    data-label="Ver historial"
                  ><i class="pi pi-history text-xs"></i></button>
                  <button
                    type="button"
                    @click="abrirModalEditar(cliente)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:shadow-sm"
                    :class="isDark
                      ? 'border-red-800 bg-red-950/40 text-[#f0a500] hover:bg-red-950/70 hover:border-red-700'
                      : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'"
                    title="Editar"
                    data-label="Editar"
                  ><i class="pi pi-pencil text-xs"></i></button>
                </div>
              </td>
            </tr>

            <tr v-if="clientesFiltrados.length === 0">
              <td colspan="6" class="px-5 py-16 text-center">
                <i class="pi pi-users text-4xl mb-3 block" :class="isDark ? 'text-gray-700' : 'text-gray-200'"></i>
                <p class="font-medium" :class="isDark ? 'text-gray-500' : 'text-gray-400'">No se encontraron clientes</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="px-5 py-3 border-t text-xs"
        :class="isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} cliente{{ pagination.total !== 1 ? 's' : '' }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeRetroceder || store.loading"
              @click="cambiarPagina(pagination.current_page - 1)"
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
              @click="cambiarPagina(pagination.current_page + 1)"
            >
              Siguiente
              <i class="pi pi-chevron-right text-[0.65rem]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <ClientesModal
      :visible="modalAbierto"
      :modo-edicion="modoEdicion"
      :cliente="clienteSeleccionado"
      :guardando="guardandoCliente"
      :server-errors="erroresFormulario"
      :submit-error="errorFormulario"
      @guardar="guardarCliente"
      @cerrar="modalAbierto = false"
    />

    <ClientesHistorialModal
      :visible="historialAbierto"
      :cliente="clienteHistorial"
      @cerrar="historialAbierto = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatFecha, fechaSoloISO, fechaHoyLocal, sumarDiasISO } from '@/utils/reservaFormatters'
import ClientesModal from '@/components/clientes/ClientesModal.vue'
import ClientesHistorialModal from '@/components/clientes/ClientesHistorialModal.vue'
import { useClientesStore } from '@/stores/clientes'
import { useAppTheme } from '@/composables/useAppTheme'
import { toastSuccess } from '@/utils/toast'

const { isDark } = useAppTheme()
const store = useClientesStore()

const search              = ref('')
const filtroLicencia      = ref('')
const modalAbierto        = ref(false)
const historialAbierto    = ref(false)
const modoEdicion         = ref(false)
const clienteSeleccionado = ref(null)
const clienteHistorial    = ref(null)
const guardandoCliente    = ref(false)
const erroresFormulario   = ref({})
const errorFormulario     = ref('')

const clientes = computed(() => store.clientes)
const pagination = computed(() => store.pagination)
const puedeRetroceder = computed(() => pagination.value.current_page > 1)
const puedeAvanzar = computed(() => pagination.value.current_page < pagination.value.last_page)
let searchTimer = null

onMounted(() => cargarClientes())

const clientesFiltrados = computed(() => {
  return clientes.value
})

watch([search, filtroLicencia], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => cargarClientes(1), 300)
})

// vencida: ya no puede rentar, por vencer: en los proximos 30 dias
function estadoLicencia(cliente) {
  const vence = fechaSoloISO(cliente?.vencimiento_licencia)
  if (!vence) return ''
  const hoy = fechaHoyLocal()
  if (vence <= hoy) return 'vencida'
  if (vence <= sumarDiasISO(hoy, 30)) return 'por_vencer'
  return 'vigente'
}

function clientesParams(page = pagination.value.current_page || 1) {
  const params = { page }
  const term = search.value.trim()
  if (term) params.search = term
  return params
}

async function cargarClientes(page = pagination.value.current_page || 1) {
  if (filtroLicencia.value) {
    await store.fetchClientesFiltrados(clientesParams(page), (c) => estadoLicencia(c) === filtroLicencia.value, page)
    return
  }
  await store.fetchClientes(clientesParams(page))
}

async function cambiarPagina(page) {
  if (page < 1 || page > pagination.value.last_page || page === pagination.value.current_page) return
  await cargarClientes(page)
}

function abrirModalCrear() {
  modoEdicion.value = false
  clienteSeleccionado.value = null
  erroresFormulario.value = {}
  errorFormulario.value = ''
  modalAbierto.value = true
}

function abrirModalEditar(cliente) {
  modoEdicion.value = true
  clienteSeleccionado.value = { ...cliente }
  erroresFormulario.value = {}
  errorFormulario.value = ''
  modalAbierto.value = true
}

function abrirHistorial(cliente) {
  clienteHistorial.value = { ...cliente }
  historialAbierto.value = true
}

async function guardarCliente(form) {
  guardandoCliente.value = true
  erroresFormulario.value = {}
  errorFormulario.value = ''
  try {
    if (modoEdicion.value) {
      await store.actualizar(form)
      toastSuccess('Cliente actualizado')
      await cargarClientes()
    } else {
      await store.crear(form)
      toastSuccess('Cliente registrado')
      await cargarClientes(1)
    }
    modalAbierto.value = false
  } catch (e) {
    const backendErrors = e.response?.data?.errors || {}
    erroresFormulario.value = backendErrors
    const firstError = Object.values(backendErrors).flat()[0]
    errorFormulario.value = firstError ? '' : (e.response?.data?.message || store.error || 'No se pudo guardar el cliente.')
  } finally {
    guardandoCliente.value = false
  }
}

const colores = ['#c0392b', '#f0a500', '#2563eb', '#16a34a', '#7c3aed', '#0891b2']
function avatarColor(nombre) {
  if (!nombre) return '#c0392b'
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = nombre.charCodeAt(i) + ((h << 5) - h)
  return colores[Math.abs(h) % colores.length]
}
function initials(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
function licenciaVigente(vencimiento) {
  const iso = fechaSoloISO(vencimiento)
  return iso ? iso >= fechaHoyLocal() : false
}

function ubicacionCliente(cliente) {
  const municipio = cliente.municipio_nombre || cliente.municipio?.nombre || cliente.municipio
  const departamento = cliente.departamento_nombre || cliente.municipio?.departamento?.nombre || cliente.departamento
  return [municipio, departamento].filter(Boolean).join(', ') || '—'
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
