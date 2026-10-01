<template>
  <div class="min-h-screen" :class="isDark ? 'bg-gray-950' : 'bg-gray-50'">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">Contratos</h1>
        <p class="text-sm mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Contratos de renta activos y finalizados</p>
      </div>
      <router-link
        :to="{ name: 'contratos-nuevo' }"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm no-underline transition-all hover:opacity-90 hover:no-underline active:scale-[0.98] shadow-sm"
        style="background:#c0392b;"
      >
        <i class="pi pi-plus text-sm"></i>
        Nuevo contrato
      </router-link>
    </div>

    <div
      class="rounded-2xl border shadow-sm p-4 mb-5 flex flex-col sm:flex-row sm:flex-wrap gap-3"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
    >
      <div class="relative flex-1 min-w-[220px]">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
        <input
          v-model="buscar"
          type="text"
          placeholder="Buscar por contrato, cliente o DUI..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500' : 'border-gray-200 bg-gray-50'"
        />
      </div>
      <select
        v-model="filtroEstado"
        class="px-4 py-2.5 rounded-xl border text-sm focus:outline-none min-w-[160px]"
        :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'"
      >
        <option value="">Todos los estados</option>
        <option value="ACTIVO">Activo</option>
        <option value="FINALIZADO">Finalizado</option>
        <option value="ANULADO">Anulado</option>
      </select>
      <select
        v-model="filtroPago"
        class="px-4 py-2.5 rounded-xl border text-sm focus:outline-none min-w-[160px]"
        :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'"
      >
        <option value="">Todos los pagos</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="PARCIAL">Pago parcial</option>
        <option value="PAGADO">Pagado</option>
      </select>
      <select
        v-model="filtroDevolucion"
        class="px-4 py-2.5 rounded-xl border text-sm focus:outline-none min-w-[180px]"
        :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'"
      >
        <option value="">Cualquier devolución</option>
        <option value="hoy">Devuelven hoy</option>
        <option value="atrasados">Atrasados</option>
        <option value="semana">Próximos 7 días</option>
      </select>
      <div class="flex items-center gap-2">
        <label class="text-xs font-semibold whitespace-nowrap" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Entrega desde</label>
        <input
          v-model="filtroDesde"
          type="date"
          class="px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'"
        />
        <label class="text-xs font-semibold" :class="isDark ? 'text-gray-400' : 'text-gray-500'">hasta</label>
        <input
          v-model="filtroHasta"
          type="date"
          :min="filtroDesde || undefined"
          class="px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'"
        />
      </div>
      <button
        v-if="hayFiltros"
        type="button"
        class="text-xs font-bold underline self-center"
        style="color:#c0392b;"
        @click="limpiarFiltros"
      >
        Limpiar filtros
      </button>
    </div>

    <div
      class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
    >
      <div v-if="store.loading" class="flex items-center justify-center py-20 gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <i class="pi pi-spin pi-spinner"></i>
        <span class="text-sm">Cargando contratos...</span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[1040px]">
          <thead>
            <tr :style="isDark ? 'background:#111827; border-bottom:1px solid #1f2937;' : 'background:#fafafa; border-bottom:1px solid #f3f4f6;'">
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Contrato</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Cliente</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Vehículo</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Periodo</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Total</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Estado</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest min-w-[130px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Pago</th>
              <th class="px-5 py-3.5 min-w-[180px] text-center text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in contratosPaginados"
              :key="c.id"
              class="border-b transition-colors"
              :class="isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50/80'"
            >
              <td class="px-5 py-4 font-mono font-bold text-sm" style="color:#922b21;">{{ c.numero_contrato }}</td>
              <td class="px-5 py-4">
                <p class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ clienteContrato(c)?.nombre || '-' }}</p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ clienteContrato(c)?.dui || '' }}</p>
              </td>
              <td class="px-5 py-4">
                <p class="font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ nombreVehiculo(vehiculoContrato(c)) }}</p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ vehiculoContrato(c)?.placa || '' }}</p>
              </td>
              <td class="px-5 py-4" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                <p>{{ fmtFecha(c.fecha_hora_entrega) }}</p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">-> {{ fmtFecha(c.fecha_hora_devolucion) }}</p>
              </td>
              <td class="px-5 py-4 tabular-nums" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
                <p class="font-bold">${{ formatPrecio(totalFinalContrato(c)) }}</p>
                <p v-if="montoExtrasContrato(c) > 0" class="text-xs font-semibold mt-0.5" style="color:#d97706;">
                  Incluye ${{ formatPrecio(montoExtrasContrato(c)) }} extras
                </p>
                <p v-if="montoPagadoContrato(c) > 0" class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  Pagado: ${{ formatPrecio(montoPagadoContrato(c)) }}
                </p>
              </td>
              <td class="px-5 py-4">
                <span class="status-badge" :style="estadoContratoStyle(c.estado_contrato)">{{ labelEstadoContrato(c.estado_contrato) }}</span>
              </td>
              <td class="px-5 py-4">
                <span class="status-badge" :style="estadoPagoStyle(c.estado_pago)">{{ labelEstadoPago(c.estado_pago) }}</span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:shadow-sm shrink-0"
                    :class="isDark ? 'border-red-800 bg-red-950/40 text-[#c0392b] hover:bg-red-950/70' : 'border-red-200 bg-red-50 text-[#c0392b] hover:bg-red-100'"
                    title="Ver contrato"
                    data-label="Ver contrato"
                    :disabled="cargandoPdf === c.id"
                    @click="verContrato(c)"
                  >
                    <i :class="cargandoPdf === c.id ? 'pi pi-spin pi-spinner' : 'pi pi-eye'" class="text-sm leading-none"></i>
                  </button>
                  <router-link
                    v-if="c.estado_contrato === 'ACTIVO'"
                    :to="{ name: 'contrato-cierre', params: { id: c.id } }"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90"
                    style="background:#c0392b;"
                    title="Cerrar renta"
                  >
                    <i class="pi pi-flag text-[10px]"></i>
                    Cerrar
                  </router-link>
                  <button
                    v-else-if="puedeRegistrarPago(c)"
                    type="button"
                    class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:shadow-sm shrink-0"
                    :class="isDark ? 'border-red-800 bg-red-950/40 text-[#f0a500] hover:bg-red-950/70' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'"
                    title="Registrar pago"
                    data-label="Registrar pago"
                    @click="irAPagos(c)"
                  >
                    <i class="pi pi-dollar text-xs"></i>
                  </button>
                  <button
                    v-if="accionesExtra(c).length"
                    type="button"
                    class="mas-btn"
                    :class="[isDark ? 'mas-btn--dark' : 'mas-btn--light', { 'mas-btn--abierto': menuAcciones?.contrato.id === c.id }]"
                    title="Más opciones"
                    @click.stop="abrirMenuAcciones(c, $event)"
                  >
                    Más
                    <i class="pi pi-chevron-down text-[9px]"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!contratosFiltrados.length">
              <td colspan="8" class="px-5 py-16 text-center">
                <i class="pi pi-file-edit text-4xl mb-3 block" :class="isDark ? 'text-gray-700' : 'text-gray-200'"></i>
                <p class="font-medium" :class="isDark ? 'text-gray-500' : 'text-gray-400'">No se encontraron contratos</p>
                <router-link :to="{ name: 'contratos-nuevo' }" class="inline-flex items-center gap-1.5 mt-3 text-sm font-bold" style="color:#c0392b;">
                  <i class="pi pi-plus text-xs"></i> Crear el primer contrato
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-5 py-3 border-t text-xs" :class="isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} contrato{{ pagination.total !== 1 ? 's' : '' }}
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

    <Teleport to="body">
      <div
        v-if="menuAcciones"
        class="menu-acciones"
        :class="isDark ? 'menu-acciones--dark' : 'menu-acciones--light'"
        :style="{ top: `${menuAcciones.top}px`, left: `${menuAcciones.left}px` }"
        @click.stop
      >
        <button
          v-for="accion in accionesExtra(menuAcciones.contrato)"
          :key="accion.id"
          type="button"
          class="menu-acciones__item"
          :class="accion.peligro ? 'menu-acciones__item--peligro' : ''"
          @click="ejecutarAccion(accion)"
        >
          <i :class="['pi', accion.icono]"></i>
          {{ accion.texto }}
        </button>
      </div>
    </Teleport>

    <ContratoPdfPreview :visible="modalPdf" :contrato="contratoVer" @cerrar="cerrarPdf" />
    <ContratoCambiarVehiculoModal
      :visible="Boolean(contratoCambio)"
      :contrato="contratoCambio"
      :guardando="cambiandoVehiculo"
      :errores-servidor="erroresCambio"
      :error-servidor="errorCambio"
      @cerrar="contratoCambio = null"
      @confirmar="confirmarCambioVehiculo"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import ContratoPdfPreview from '@/components/contratos/ContratoPdfPreview.vue'
import ContratoCambiarVehiculoModal from '@/components/contratos/ContratoCambiarVehiculoModal.vue'
import { useContratosStore } from '@/stores/contratos'
import { useAuthStore } from '@/stores/auth'
import { useAppTheme } from '@/composables/useAppTheme'
import { toastSuccess } from '@/utils/toast'
import {
  nombreVehiculo,
  formatPrecio,
  formatFechaHora12,
  labelEstadoContrato,
  labelEstadoPago,
  totalFinalContrato,
  montoExtrasContrato,
  montoPagadoContrato,
  fechaLocalISO,
} from '@/utils/contratoFormatters'
import { fechaHoyLocal, sumarDiasISO } from '@/utils/reservaFormatters'

const { isDark } = useAppTheme()
const route = useRoute()
const router = useRouter()
const store = useContratosStore()
const authStore = useAuthStore()

const buscar = ref('')
const anulando = ref(null)
const contratoCambio = ref(null)
const cambiandoVehiculo = ref(false)
const erroresCambio = ref({})
const errorCambio = ref('')
const filtroEstado = ref('')
const filtroPago = ref('')
const filtroDevolucion = ref('')
const filtroDesde = ref('')
const filtroHasta = ref('')
const hayFiltros = computed(() =>
  Boolean(buscar.value || filtroEstado.value || filtroPago.value || filtroDevolucion.value || filtroDesde.value || filtroHasta.value),
)
const modalPdf = ref(false)
const contratoVer = ref(null)
const cargandoPdf = ref(null)
const paginaActual = ref(1)
const contratosPorPagina = 10

const ordenEstadoContrato = {
  ACTIVO: 1,
  FINALIZADO: 2,
  ANULADO: 3,
}

const ordenPagoContrato = {
  PENDIENTE: 1,
  PARCIAL: 2,
  PAGADO: 3,
}

const contratosFiltrados = computed(() => {
  let list = [...store.contratos]
  const q = buscar.value.trim().toLowerCase()
  if (q) {
    list = list.filter((c) => {
      const cliente = clienteContrato(c)
      const vehiculo = vehiculoContrato(c)
      return c.numero_contrato?.toLowerCase().includes(q) ||
        cliente?.nombre?.toLowerCase().includes(q) ||
        cliente?.dui?.includes(q) ||
        nombreVehiculo(vehiculo).toLowerCase().includes(q) ||
        vehiculo?.placa?.toLowerCase().includes(q)
    })
  }
  if (filtroEstado.value) list = list.filter((c) => c.estado_contrato === filtroEstado.value)
  if (filtroPago.value) list = list.filter((c) => c.estado_pago === filtroPago.value)
  if (filtroDevolucion.value) list = list.filter(coincideDevolucion)
  if (filtroDesde.value) list = list.filter((c) => fechaLocalISO(c.fecha_hora_entrega) >= filtroDesde.value)
  if (filtroHasta.value) list = list.filter((c) => fechaLocalISO(c.fecha_hora_entrega) <= filtroHasta.value)
  return ordenarContratos(list)
})

// solo cuenta para contratos activos, que son los que faltan por devolver
function coincideDevolucion(c) {
  if (c.estado_contrato !== 'ACTIVO') return false
  const hoy = fechaHoyLocal()
  const devolucion = fechaLocalISO(c.fecha_hora_devolucion)
  if (filtroDevolucion.value === 'hoy') return devolucion === hoy
  if (filtroDevolucion.value === 'atrasados') return new Date(c.fecha_hora_devolucion).getTime() < Date.now()
  if (filtroDevolucion.value === 'semana') return devolucion >= hoy && devolucion <= sumarDiasISO(hoy, 7)
  return true
}

function limpiarFiltros() {
  buscar.value = ''
  filtroEstado.value = ''
  filtroPago.value = ''
  filtroDevolucion.value = ''
  filtroDesde.value = ''
  filtroHasta.value = ''
}

const pagination = computed(() => {
  const total = contratosFiltrados.value.length
  const lastPage = Math.max(1, Math.ceil(total / contratosPorPagina))
  const currentPage = Math.min(paginaActual.value, lastPage)
  const from = total ? ((currentPage - 1) * contratosPorPagina) + 1 : 0
  const to = total ? Math.min(currentPage * contratosPorPagina, total) : 0
  return {
    current_page: currentPage,
    last_page: lastPage,
    per_page: contratosPorPagina,
    total,
    from,
    to,
  }
})

const contratosPaginados = computed(() => {
  const start = (pagination.value.current_page - 1) * contratosPorPagina
  return contratosFiltrados.value.slice(start, start + contratosPorPagina)
})

const puedeRetroceder = computed(() => pagination.value.current_page > 1)
const puedeAvanzar = computed(() => pagination.value.current_page < pagination.value.last_page)

onMounted(async () => {
  await store.fetchContratos()
  await abrirContratoDesdeQuery()
})

watch([buscar, filtroEstado, filtroPago, filtroDevolucion, filtroDesde, filtroHasta], () => {
  paginaActual.value = 1
})

watch(pagination, (value) => {
  if (paginaActual.value !== value.current_page) paginaActual.value = value.current_page
})

function cambiarPagina(page) {
  if (page < 1 || page > pagination.value.last_page || page === paginaActual.value) return
  paginaActual.value = page
}

function clienteContrato(contrato) {
  const embebido = contrato?.cliente || contrato?.reserva?.cliente || null
  if (embebido) return embebido
  const snap = contrato?.info_registro?.cliente
  return snap ? { nombre: snap.nombre, dui: snap.dui } : null
}

function vehiculoContrato(contrato) {
  const embebido = contrato?.vehiculo || contrato?.reserva?.vehiculo || null
  if (embebido) return embebido
  const snap = contrato?.info_registro?.vehiculo
  if (!snap) return null
  return {
    placa: snap.placa,
    modelo: { nombre: snap.modelo, marca: { nombre: snap.marca } },
  }
}

function fechaOrden(contrato) {
  const fechaBase = contrato.estado_contrato === 'FINALIZADO'
    ? contrato.fecha_hora_devolucion
    : contrato.fecha_hora_entrega
  const fecha = new Date(fechaBase || 0).getTime()
  return Number.isNaN(fecha) ? 0 : fecha
}

function ordenarContratos(lista) {
  return lista.sort((a, b) => {
    const estadoA = ordenEstadoContrato[a.estado_contrato] ?? 99
    const estadoB = ordenEstadoContrato[b.estado_contrato] ?? 99
    if (estadoA !== estadoB) return estadoA - estadoB

    if (a.estado_contrato === 'ACTIVO') {
      const pagoA = ordenPagoContrato[a.estado_pago] ?? 99
      const pagoB = ordenPagoContrato[b.estado_pago] ?? 99
      if (pagoA !== pagoB) return pagoA - pagoB
      return fechaOrden(a) - fechaOrden(b)
    }
    return fechaOrden(b) - fechaOrden(a)
  })
}

function fmtFecha(v) {
  return formatFechaHora12(v)
}

function estadoContratoStyle(estado) {
  const m = {
    ACTIVO: 'background:#fee2e2; color:#991b1b;',
    FINALIZADO: 'background:#dcfce7; color:#166534;',
    ANULADO: 'background:#f3f4f6; color:#9ca3af;',
  }
  return m[estado] || 'background:#f3f4f6; color:#6b7280;'
}

function estadoPagoStyle(estado) {
  const m = {
    PENDIENTE: 'background:#fee2e2; color:#991b1b;',
    PARCIAL: 'background:#fef3c7; color:#92400e;',
    PAGADO: 'background:#dcfce7; color:#166534;',
  }
  return m[estado] || 'background:#f3f4f6; color:#6b7280;'
}

async function verContrato(c) {
  cargandoPdf.value = c.id
  try {
    contratoVer.value = await store.fetchContrato(c.id)
    modalPdf.value = true
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'No se pudo cargar el contrato.', confirmButtonColor: '#922b21' })
  } finally {
    cargandoPdf.value = null
  }
}

async function anularContrato(c) {
  const { value: motivo, isConfirmed } = await Swal.fire({
    icon: 'warning',
    title: `¿Anular contrato ${c.numero_contrato}?`,
    html: 'El vehículo se libera y, si viene de una reserva, la reserva vuelve a <strong>Pendiente</strong>.<br><small>Primero deben cancelarse los pagos y anularse los cargos e incidencias vigentes.</small>',
    input: 'textarea',
    inputPlaceholder: 'Motivo de la anulación',
    inputAttributes: { maxlength: 500 },
    inputValidator: (v) => (!v || !v.trim() ? 'Debe indicar el motivo de la anulación.' : undefined),
    showCancelButton: true,
    confirmButtonText: 'Anular contrato',
    cancelButtonText: 'Volver',
    confirmButtonColor: '#922b21',
    cancelButtonColor: '#6b7280',
    background: isDark.value ? '#1f2937' : '#fff',
    color: isDark.value ? '#f3f4f6' : '#111827',
  })
  if (!isConfirmed) return
  anulando.value = c.id
  try {
    await store.anular(c.id, motivo.trim())
    toastSuccess('Contrato anulado', c.numero_contrato)
  } catch (e) {
    const errores = Object.values(e.response?.data?.errors || {}).flat().join(' ')
    Swal.fire({
      icon: 'error',
      title: 'No se pudo anular',
      text: errores || e.response?.data?.message || 'Error al anular el contrato.',
      confirmButtonColor: '#922b21',
    })
  } finally {
    anulando.value = null
  }
}

// menu "Mas": las acciones que no van a la vista para que la columna no se llene
const menuAcciones = ref(null)

function puedeRegistrarPago(c) {
  return c.estado_pago !== 'PAGADO' && c.estado_contrato !== 'ANULADO'
}

function irAPagos(c) {
  router.push({ name: 'pagos', query: { contrato_id: c.id, cobrar: '1' } })
}

function accionesExtra(c) {
  if (c.estado_contrato !== 'ACTIVO') return []
  const acciones = []
  if (puedeRegistrarPago(c)) acciones.push({ id: 'pago', texto: 'Registrar pago', icono: 'pi-dollar', ejecutar: () => irAPagos(c) })
  acciones.push({ id: 'vehiculo', texto: 'Cambiar vehículo', icono: 'pi-sync', ejecutar: () => abrirCambioVehiculo(c) })
  if (authStore.isAdmin) acciones.push({ id: 'anular', texto: 'Anular contrato', icono: 'pi-ban', peligro: true, ejecutar: () => anularContrato(c) })
  return acciones
}

function abrirMenuAcciones(c, evento) {
  if (menuAcciones.value?.contrato.id === c.id) {
    menuAcciones.value = null
    return
  }
  const caja = evento.currentTarget.getBoundingClientRect()
  const ancho = 190
  menuAcciones.value = {
    contrato: c,
    top: caja.bottom + 6,
    left: Math.max(8, Math.min(caja.right - ancho, window.innerWidth - ancho - 8)),
  }
}

function cerrarMenuAcciones() {
  menuAcciones.value = null
}

function ejecutarAccion(accion) {
  cerrarMenuAcciones()
  accion.ejecutar()
}

onMounted(() => {
  document.addEventListener('click', cerrarMenuAcciones)
  window.addEventListener('scroll', cerrarMenuAcciones, true)
  window.addEventListener('resize', cerrarMenuAcciones)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', cerrarMenuAcciones)
  window.removeEventListener('scroll', cerrarMenuAcciones, true)
  window.removeEventListener('resize', cerrarMenuAcciones)
})

async function abrirCambioVehiculo(c) {
  erroresCambio.value = {}
  errorCambio.value = ''
  try {
    // el detalle trae cliente y combustible
    contratoCambio.value = await store.fetchContrato(c.id)
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'No se pudo cargar el contrato.', confirmButtonColor: '#922b21' })
  }
}

async function confirmarCambioVehiculo(datos) {
  if (!contratoCambio.value) return
  cambiandoVehiculo.value = true
  erroresCambio.value = {}
  errorCambio.value = ''
  try {
    const actualizado = await store.cambiarVehiculo(contratoCambio.value.id, datos)
    contratoCambio.value = null
    toastSuccess('Vehículo cambiado', `${actualizado.numero_contrato} · ${actualizado.vehiculo?.placa || ''}`)
    await store.fetchContratos()
  } catch (e) {
    erroresCambio.value = e.response?.data?.errors || {}
    errorCambio.value = e.response?.data?.errors ? '' : (e.response?.data?.message || 'No se pudo cambiar el vehículo.')
  } finally {
    cambiandoVehiculo.value = false
  }
}

function cerrarPdf() {
  modalPdf.value = false
  contratoVer.value = null
  if (route.query.ver_contrato) {
    const query = { ...route.query }
    delete query.ver_contrato
    router.replace({ name: 'contratos', query })
  }
}

async function abrirContratoDesdeQuery() {
  const contratoId = Number(route.query.ver_contrato)
  if (!contratoId) return
  await verContrato({ id: contratoId })
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

.mas-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  background: transparent;
  transition: background-color 0.15s ease;
}

.mas-btn--light {
  color: #57534e;
}

.mas-btn--dark {
  color: #d6d3d1;
}

.mas-btn:hover,
.mas-btn--abierto {
  background: rgba(120, 113, 108, 0.12);
}

.menu-acciones {
  position: fixed;
  z-index: 70;
  width: 190px;
  padding: 0.3rem;
  border-radius: 0.6rem;
  box-shadow: 0 10px 30px rgba(28, 25, 23, 0.16);
}

.menu-acciones--light {
  background: #fff;
}

.menu-acciones--dark {
  background: #1f2937;
}

.menu-acciones__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: left;
  background: transparent;
}

.menu-acciones--light .menu-acciones__item {
  color: #292524;
}

.menu-acciones--dark .menu-acciones__item {
  color: #e7e5e4;
}

.menu-acciones__item:hover {
  background: rgba(120, 113, 108, 0.12);
}

.menu-acciones__item .pi {
  font-size: 0.8rem;
  opacity: 0.7;
}

.menu-acciones__item--peligro,
.menu-acciones--light .menu-acciones__item--peligro,
.menu-acciones--dark .menu-acciones__item--peligro {
  color: #c0392b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: max-content;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}
</style>
