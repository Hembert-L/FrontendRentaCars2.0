<template>
  <div class="min-h-screen" :class="isDark ? 'bg-gray-950' : 'bg-gray-50'">

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">Pagos</h1>
        <p class="text-sm mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Registro de pagos de contratos</p>
      </div>
    </div>

    <!-- Registrar pago -->
    <div
      class="rounded-2xl border shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
    >
      <div class="flex-1">
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Contrato con saldo pendiente</label>
        <select
          :value="contratoId"
          :disabled="operacionesBloqueadas || modalAbierto"
          class="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'"
          @change="cargarContrato($event.target.value)"
        >
          <option value="">Seleccionar contrato...</option>
          <option v-for="c in contratosAbiertos" :key="c.id" :value="c.id">
            {{ c.numero_contrato }} — {{ nombreCliente(c) }} — {{ saldoLabel(c) }}
          </option>
        </select>
      </div>
      <div
        v-if="contratoSel"
        class="rounded-xl px-4 py-2.5 text-sm border shrink-0"
        :class="isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'"
      >
        <div v-if="montoExtrasSel > 0" class="text-xs opacity-60 mb-0.5">
          Renta ${{ formatPrecio(contratoSel.monto_total_renta) }} + extras ${{ formatPrecio(montoExtrasSel) }}
        </div>
        <span class="opacity-60">Saldo: </span>
        <strong style="color:#922b21;">${{ formatPrecio(saldoContrato) }}</strong>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 shadow-sm shrink-0"
        style="background:#c0392b;"
        :disabled="operacionesBloqueadas || modalAbierto || !contratoSel || saldoContrato <= 0"
        @click="abrirRegistro"
      >
        <i class="pi pi-plus text-sm"></i>
        Registrar pago
      </button>
    </div>

    <div v-if="errorRecarga" role="alert" class="mb-4 rounded-xl border p-4 text-sm"
      :class="isDark ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'">
      <p>{{ errorRecarga }} Los datos pueden estar desactualizados. Actualiza antes de registrar o cancelar pagos.</p>
      <button type="button" class="mt-2 font-bold underline disabled:opacity-50" :disabled="operacionEnCurso" @click="actualizarDatos">Actualizar datos</button>
    </div>

    <p v-if="advertenciaCierres" role="status" class="mb-4 rounded-xl border px-4 py-3 text-sm"
      :class="isDark ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'">
      {{ advertenciaCierres }}
    </p>

    <!-- Búsqueda y filtros del historial -->
    <div
      class="rounded-2xl border shadow-sm p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
    >
      <div class="relative sm:col-span-2 lg:col-span-2">
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Buscar</label>
        <i class="pi pi-search absolute left-3 bottom-3 text-sm pointer-events-none" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
        <input
          v-model="filtros.busqueda"
          type="text"
          placeholder="N.º de contrato, cliente o DUI..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500' : 'border-gray-200 bg-gray-50'"
        />
      </div>
      <div>
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Estado</label>
        <select v-model="filtros.estado" class="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'">
          <option value="">Todos</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Método</label>
        <select v-model="filtros.metodo" class="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'">
          <option value="">Todos</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="DEPOSITO">Depósito</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Desde</label>
        <input v-model="filtros.desde" type="date" class="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'" />
      </div>
      <div>
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Hasta</label>
        <input v-model="filtros.hasta" type="date" :min="filtros.desde || undefined" class="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-50'" />
      </div>
      <button
        v-if="hayFiltros"
        type="button"
        class="sm:col-span-2 lg:col-span-6 justify-self-end text-xs font-bold underline"
        style="color:#c0392b;"
        @click="limpiarFiltros"
      >
        Limpiar filtros
      </button>
    </div>

    <!-- Tabla historial -->
    <div
      class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
    >
      <div v-if="cargandoVista" class="flex items-center justify-center py-20 gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <i class="pi pi-spin pi-spinner"></i>
        <span class="text-sm">Cargando pagos...</span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr :style="isDark ? 'background:#111827; border-bottom:1px solid #1f2937;' : 'background:#fafafa; border-bottom:1px solid #f3f4f6;'">
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Fecha</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Contrato</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Cliente</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Monto</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Método</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Estado</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in pagosPaginados"
              :key="p.id"
              class="border-b transition-colors"
              :class="isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50/80'"
            >
              <td class="px-5 py-4 text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-600'">{{ fmt(p.fecha_pago) }}</td>
              <td class="px-5 py-4 font-mono font-bold" style="color:#922b21;">{{ p.contrato?.numero_contrato || '—' }}</td>
              <td class="px-5 py-4">
                <p class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ nombreClientePago(p) }}</p>
              </td>
              <td class="px-5 py-4 font-bold tabular-nums" :class="p.estado_transaccion === 'CANCELADO' ? (isDark ? 'text-gray-500 line-through' : 'text-gray-400 line-through') : ''" :style="p.estado_transaccion === 'CANCELADO' ? '' : 'color:#166534;'">${{ formatPrecio(p.monto) }}</td>
              <td class="px-5 py-4">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full" :style="metodoStyle(p.metodo_pago)">{{ p.metodo_pago }}</span>
              </td>
              <td class="px-5 py-4">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full" :style="estadoTransaccionStyle(p.estado_transaccion)">
                  {{ labelEstadoTransaccion(p.estado_transaccion) }}
                </span>
                <p v-if="p.estado_transaccion === 'CANCELADO' && p.motivo_cancelacion" class="text-[11px] mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ p.motivo_cancelacion }}
                </p>
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  v-if="puedeCancelarPago(p)"
                  type="button"
                  class="inline-flex items-center justify-center gap-1.5 min-h-8 px-3 rounded-lg border text-xs font-bold transition-all hover:shadow-sm whitespace-nowrap"
                  :class="isDark
                    ? 'border-red-800 bg-red-950/40 text-red-300 hover:bg-red-950/70 hover:border-red-700'
                    : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'"
                  title="Cancelar pago"
                  :disabled="operacionesBloqueadas || modalAbierto"
                  @click="cancelarPago(p)"
                >
                  <i class="pi pi-times text-xs"></i>
                  Cancelar
                </button>
                <span
                  v-else
                  class="inline-flex whitespace-nowrap text-xs font-semibold"
                  :class="isDark ? 'text-gray-600' : 'text-gray-400'"
                >
                  No disponible
                </span>
              </td>
            </tr>
            <tr v-if="!pagosFiltrados.length">
              <td colspan="7" class="px-5 py-16 text-center">
                <i class="pi pi-dollar text-4xl mb-3 block" :class="isDark ? 'text-gray-700' : 'text-gray-200'"></i>
                <p class="font-medium" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ pagosStore.pagos.length ? 'Ningún pago coincide con los filtros' : 'No hay pagos registrados' }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-5 py-3 border-t text-xs" :class="isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} pago{{ pagination.total !== 1 ? 's' : '' }}
            · Total confirmado{{ hayFiltros ? ' (filtrado)' : '' }}: ${{ formatPrecio(totalCobrado) }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeRetroceder || pagosStore.loading"
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
              :disabled="!puedeAvanzar || pagosStore.loading"
              @click="cambiarPagina(paginaActual + 1)"
            >
              Siguiente
              <i class="pi pi-chevron-right text-[0.65rem]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <PagoRegistrarModal ref="modalPago" :visible="modalAbierto" :contrato="contratoSel"
      :guardando="operacionEnCurso" :resumen="resumenLote" :error-recarga="errorRecarga"
      @cerrar="cerrarRegistro" @guardar="registrarPago" @actualizar="actualizarDatos" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import Swal from 'sweetalert2'
import PagoRegistrarModal from '@/components/pagos/PagoRegistrarModal.vue'
import { useContratosStore } from '@/stores/contratos'
import { usePagosStore } from '@/stores/pagos'
import { useAppTheme } from '@/composables/useAppTheme'
import api from '@/services/api'
import { getToken } from '@/services/authToken'
import { fetchAllPaginated } from '@/utils/apiPagination'
import { toastSuccess } from '@/utils/toast'
import { formatPrecio, saldoPendienteContrato, montoExtrasContrato, totalFinalContrato, moneyCents, toMoneyNumber } from '@/utils/contratoFormatters'

const route = useRoute()
const { isDark } = useAppTheme()
const contratosStore = useContratosStore()
const pagosStore = usePagosStore()

const contratoId = ref('')
const contratoSel = ref(null)
const modalAbierto = ref(false)
const guardando = ref(false)
const cargandoInicial = ref(true)
const modalPago = ref(null)
const cancelando = ref(false)
const recargando = ref(false)
const seleccionando = ref(false)
const errorRecarga = ref('')
const cierresPorContrato = ref(new Map())
const advertenciaCierres = ref('')
const resumenLote = ref('')
const confirmadosLote = ref(0)
const pendientesLote = ref([])
const loteCompletoPorCerrar = ref(null)
const operacionEnCurso = computed(() => guardando.value || cancelando.value || recargando.value || seleccionando.value || pagosStore.procesando)
const operacionesBloqueadas = computed(() => cargandoInicial.value || operacionEnCurso.value || Boolean(errorRecarga.value))
const paginaActual = ref(1)
const pagosPorPagina = 10

const MOTIVOS_CANCELACION_PAGO = [
  'Error al registrar el pago',
  'Pago duplicado',
  'Monto incorrecto',
  'Método de pago incorrecto',
  'Cliente solicitó anulación',
  'Comprobante inválido',
]

const motivosCancelacionOptions = Object.fromEntries(
  MOTIVOS_CANCELACION_PAGO.map((motivo) => [motivo, motivo]),
)

const cargandoVista = computed(() => cargandoInicial.value || pagosStore.loading)

const contratosAbiertos = computed(() =>
  contratosStore.contratos.filter((c) =>
    c.estado_contrato === 'ACTIVO' &&
    c.estado_pago !== 'PAGADO' &&
    saldoPendienteContrato(c) > 0
  )
)

const saldoContrato = computed(() => saldoPendienteContrato(contratoSel.value))
const montoExtrasSel = computed(() => montoExtrasContrato(contratoSel.value))

function saldoDe(c) {
  return saldoPendienteContrato(c)
}

function saldoLabel(c) {
  if (c.saldo_pendiente != null || Array.isArray(c.pagos)) {
    return `Saldo $${formatPrecio(saldoDe(c))}`
  }
  if (c.estado_pago === 'PARCIAL') return 'Saldo pendiente'
  return `Total $${formatPrecio(totalFinalContrato(c))}`
}

const filtros = reactive({ busqueda: '', estado: '', metodo: '', desde: '', hasta: '' })
const hayFiltros = computed(() => Object.values(filtros).some(Boolean))

function normalizarTexto(valor) {
  return String(valor ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function fechaPagoISO(pago) {
  const fecha = new Date(pago.fecha_pago)
  if (Number.isNaN(fecha.getTime())) return String(pago.fecha_pago || '').slice(0, 10)
  const pad = (n) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`
}

// Todos los pagos ya están cargados en el store, así que se filtra localmente.
const pagosFiltrados = computed(() => {
  const termino = normalizarTexto(filtros.busqueda)
  return pagosStore.pagos.filter((p) => {
    if (filtros.estado && p.estado_transaccion !== filtros.estado) return false
    if (filtros.metodo && p.metodo_pago !== filtros.metodo) return false
    const fecha = fechaPagoISO(p)
    if (filtros.desde && fecha < filtros.desde) return false
    if (filtros.hasta && fecha > filtros.hasta) return false
    if (!termino) return true
    const contrato = contratoPago(p)
    return [contrato?.numero_contrato, nombreCliente(contrato), contrato?.info_registro?.cliente?.dui]
      .some((valor) => normalizarTexto(valor).includes(termino))
  })
})

function limpiarFiltros() {
  Object.assign(filtros, { busqueda: '', estado: '', metodo: '', desde: '', hasta: '' })
}

watch(filtros, () => { paginaActual.value = 1 })

const totalCobrado = computed(() => pagosFiltrados.value
  .filter((p) => p.estado_transaccion === 'CONFIRMADO')
  .reduce((s, p) => s + Number(p.monto || 0), 0))

const pagination = computed(() => {
  const total = pagosFiltrados.value.length
  const lastPage = Math.max(1, Math.ceil(total / pagosPorPagina))
  const currentPage = Math.min(paginaActual.value, lastPage)
  const from = total ? ((currentPage - 1) * pagosPorPagina) + 1 : 0
  const to = total ? Math.min(currentPage * pagosPorPagina, total) : 0

  return {
    current_page: currentPage,
    last_page: lastPage,
    per_page: pagosPorPagina,
    total,
    from,
    to,
  }
})

const pagosPaginados = computed(() => {
  const start = (pagination.value.current_page - 1) * pagosPorPagina
  return pagosFiltrados.value.slice(start, start + pagosPorPagina)
})

const puedeRetroceder = computed(() => pagination.value.current_page > 1)
const puedeAvanzar = computed(() => pagination.value.current_page < pagination.value.last_page)

onMounted(async () => {
  window.addEventListener('beforeunload', protegerRecarga)
  cargandoInicial.value = true
  try {
    await Promise.all([
      contratosStore.fetchContratos(),
      pagosStore.fetchPagos(),
      cargarCierres(),
    ])
    if (route.query.contrato_id) {
      contratoId.value = String(route.query.contrato_id)
      await cargarContrato()
    }
  } finally {
    cargandoInicial.value = false
  }
  if (route.query.contrato_id) abrirRegistro()
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', protegerRecarga))
onBeforeRouteLeave((to) => to.name === 'login' || !operacionEnCurso.value)
onBeforeRouteUpdate((to) => to.name === 'login' || !operacionEnCurso.value)

function protegerRecarga(event) {
  if (!operacionEnCurso.value) return
  event.preventDefault()
  event.returnValue = ''
}

function abrirRegistro() {
  if (operacionesBloqueadas.value || modalAbierto.value || !contratoSel.value || saldoContrato.value <= 0) return
  resumenLote.value = ''
  confirmadosLote.value = 0
  pendientesLote.value = []
  loteCompletoPorCerrar.value = null
  modalAbierto.value = true
}

function cerrarRegistro() {
  if (operacionEnCurso.value) return
  modalAbierto.value = false
}

watch(
  () => pagosFiltrados.value.length,
  () => {
    if (paginaActual.value > pagination.value.last_page) {
      paginaActual.value = pagination.value.last_page
    }
  },
)

function cambiarPagina(page) {
  if (page < 1 || page > pagination.value.last_page || page === paginaActual.value) return
  paginaActual.value = page
}

async function cargarContrato(id = contratoId.value) {
  if (operacionEnCurso.value || errorRecarga.value || modalAbierto.value) return
  if (!id) { contratoId.value = ''; contratoSel.value = null; return }
  seleccionando.value = true
  try {
    const contrato = await contratosStore.fetchContrato(id)
    contratoSel.value = await completarContratoConPagos(contrato)
    contratoId.value = String(id)
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: mensajeOriginal(e), confirmButtonColor: '#922b21' })
  } finally {
    seleccionando.value = false
  }
}

async function completarContratoConPagos(contrato) {
  if (!contrato?.numero_contrato) return contrato
  const { items } = await fetchAllPaginated(
    (requestParams) => api.get('/admin/pagos', { params: requestParams }),
    { search: contrato.numero_contrato, per_page: 100 },
  )
  const pagosContrato = items.filter((p) => Number(p.contrato_id || p.contrato?.id) === Number(contrato.id))
  return {
    ...contrato,
    pagos: pagosContrato,
    monto_pagado: pagosContrato
      .filter((p) => p.estado_transaccion === 'CONFIRMADO')
      .reduce((s, p) => s + Number(p.monto || 0), 0),
  }
}

async function registrarPago(form) {
  if (operacionesBloqueadas.value) return
  const pagos = (Array.isArray(form?.pagos) ? form.pagos : [form]).map((pago) => ({ ...pago }))
  const saldo = moneyCents(saldoContrato.value)
  const metodos = ['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO']
  const valido = contratoSel.value?.id && saldo > 0 && pagos.length > 0
    && pagos.every((p) => Number.isFinite(Number(p.monto)) && moneyCents(p.monto) > 0
      && metodos.includes(p.metodo_pago) && typeof p.fecha_pago === 'string' && p.fecha_pago.trim())
    && pagos.reduce((s, p) => s + moneyCents(p.monto), 0) <= saldo
  if (!valido) {
    resumenLote.value = 'Revisa el contrato, saldo, montos, métodos y fechas. El total no puede superar el saldo pendiente.'
    return
  }
  const lote = pagos.map((pago) => ({ ...pago, monto: toMoneyNumber(pago.monto) }))
  const contrato = { ...contratoSel.value }
  guardando.value = true
  confirmadosLote.value = 0
  loteCompletoPorCerrar.value = null
  reconciliarPendientes(lote)
  resumenLote.value = ''
  let fallo = false
  try {
    try {
      await pagosStore.registrarLote(contrato.id, lote, (_pago, indice) => {
        confirmadosLote.value = indice + 1
        reconciliarPendientes(lote.slice(indice + 1))
        resumenLote.value = resumenProgreso()
      })
      loteCompletoPorCerrar.value = lote.length
    } catch (e) {
      if (e.response?.status === 401 || route.name === 'login') return
      fallo = true
      const indice = e.progreso?.indiceFallido ?? confirmadosLote.value
      const ambiguo = e.progreso?.ambiguo ?? true
      reconciliarPendientes(lote.slice(indice + (ambiguo ? 1 : 0)))
      resumenLote.value = `${resumenProgreso()} Falló el elemento ${indice + 1}: ${mensajeOriginal(e)} `
        + (ambiguo ? 'El resultado de ese pago es incierto y se retiró del reintento automático. Revisa el historial recargado antes de volver a ingresarlo manualmente.' : 'Reintentar enviará únicamente los pagos pendientes.')
    }
    const actualizado = await reconciliarDatos(contrato)
    if (!fallo && actualizado) finalizarRegistro()
  } finally {
    guardando.value = false
  }
}

function reconciliarPendientes(pagos) {
  pendientesLote.value = pagos.map((pago) => ({ ...pago }))
  modalPago.value?.actualizarPendientes(pendientesLote.value)
}

function resumenProgreso() {
  return `Pagos confirmados: ${confirmadosLote.value}. Pagos pendientes: ${pendientesLote.value.length}.`
}

function mensajeOriginal(e) {
  const datos = e.response?.data
  return [datos?.message, ...Object.values(datos?.errors || {}).flat()].filter(Boolean).join(' ') || e.message || 'Error sin detalle.'
}

async function cargarCierres() {
  // No conservar permisos de cancelación basados en una consulta anterior si la recarga falla.
  cierresPorContrato.value = new Map()
  advertenciaCierres.value = ''
  try {
    const { items } = await fetchAllPaginated((params) => api.get('/admin/cierres-renta', { params }))
    cierresPorContrato.value = new Map(items.map((cierre) => [Number(cierre.contrato_id), cierre]))
  } catch {
    advertenciaCierres.value = 'No se pudo comprobar qué contratos finalizados admiten cancelación de pagos. Su cancelación permanecerá deshabilitada; puedes seguir registrando pagos y cancelar pagos de contratos activos.'
  }
}

async function reconciliarDatos(contrato = contratoSel.value) {
  recargando.value = true
  try {
    // Las cuatro recargas principales bloquean si fallan; los cierres tienen una advertencia independiente.
    const resultados = await Promise.allSettled([
      contrato?.id ? contratosStore.fetchContrato(contrato.id) : Promise.resolve(null),
      contrato?.id ? completarContratoConPagos(contrato) : Promise.resolve(null),
      pagosStore.fetchPagos({}, { silencioso: true, lanzarError: true }),
      fetchAllPaginated((params) => api.get('/admin/contratos', { params })),
      cargarCierres(),
    ])
    const [detalle, historial, , contratos] = resultados
    if (contrato?.id) {
      const actualizado = detalle.status === 'fulfilled' ? detalle.value : contratoSel.value
      contratoSel.value = historial.status === 'fulfilled'
        ? { ...actualizado, pagos: historial.value.pagos, monto_pagado: historial.value.monto_pagado }
        : actualizado
    }
    if (contratos.status === 'fulfilled') contratosStore.contratos = contratos.value.items
    const nombres = ['contrato seleccionado', 'pagos del contrato', 'listado de pagos', 'listado de contratos']
    errorRecarga.value = resultados.slice(0, 4).map((r, i) => r.status === 'rejected'
      ? `No se pudo actualizar ${nombres[i]}: ${mensajeOriginal(r.reason)}` : '').filter(Boolean).join(' ')
    return !errorRecarga.value
  } finally {
    recargando.value = false
  }
}

function finalizarRegistro() {
  const cantidad = loteCompletoPorCerrar.value
  if (cantidad === null) return
  modalAbierto.value = false
  loteCompletoPorCerrar.value = null
  toastSuccess(cantidad > 1 ? 'Pagos registrados' : 'Pago registrado')
}

async function actualizarDatos() {
  if (operacionEnCurso.value) return
  if (await reconciliarDatos()) finalizarRegistro()
}

async function cancelarPago(pago) {
  if (operacionesBloqueadas.value || modalAbierto.value || !puedeCancelarPago(pago)) return
  cancelando.value = true
  try {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar pago?',
      text: `El pago de $${formatPrecio(pago.monto)} quedará cancelado y el saldo del contrato se recalculará.`,
      input: 'select',
      inputLabel: 'Motivo de cancelación',
      inputOptions: motivosCancelacionOptions,
      inputPlaceholder: 'Selecciona un motivo...',
      showCancelButton: true,
      confirmButtonText: 'Cancelar pago',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#c0392b',
      cancelButtonColor: '#6b7280',
      background: isDark.value ? '#1f2937' : '#fff',
      color: isDark.value ? '#f3f4f6' : '#111827',
      preConfirm: (value) => {
        const motivo = String(value || '').trim()
        if (!motivo) {
          Swal.showValidationMessage('Debes seleccionar el motivo de cancelación')
          return false
        }
        return motivo
      },
    })

    if (!result.isConfirmed || route.name === 'login' || !getToken() || errorRecarga.value || !puedeCancelarPago(pago)) return

    try {
      await pagosStore.cancelar(pago.id, result.value)
      if (route.name === 'login' || !getToken()) return
      await reconciliarDatos()
      toastSuccess('Pago cancelado')
    } catch (e) {
      if (e.response?.status === 401 || route.name === 'login' || !getToken()) return
      const mensaje = mensajeOriginal(e)
      await reconciliarDatos()
      Swal.fire({ icon: 'error', title: 'Error', text: mensaje, confirmButtonColor: '#922b21' })
    }
  } finally {
    cancelando.value = false
  }
}
function fmt(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString('es-SV', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function nombreCliente(contrato) {
  // El listado de contratos no incluye la relación `cliente`; cada contrato
  // guarda una copia en info_registro.cliente desde que se crea.
  return contrato?.cliente?.nombre
    || contrato?.reserva?.cliente?.nombre
    || contrato?.info_registro?.cliente?.nombre
    || 'Cliente no disponible'
}

function nombreClientePago(pago) {
  return nombreCliente(contratoPago(pago))
}

function contratoPago(pago) {
  const contratoId = pago.contrato_id || pago.contrato?.id
  const contratoCompleto = contratosStore.contratos.find((c) => Number(c.id) === Number(contratoId))
  return { ...pago.contrato, ...contratoCompleto }
}

function puedeCancelarPago(pago) {
  if (pago.estado_transaccion !== 'CONFIRMADO') return false
  const contrato = contratoPago(pago)
  if (contrato?.estado_contrato !== 'FINALIZADO') return true
  const cierre = cierresPorContrato.value.get(Number(pago.contrato_id || contrato.id))
  return cierre?.estado === 'FINALIZADO_CON_DEUDA'
}

function metodoStyle(m) {
  const map = {
    EFECTIVO: 'background:#dcfce7; color:#166534;',
    TRANSFERENCIA: 'background:#dbeafe; color:#1e40af;',
    DEPOSITO: 'background:#f3e8ff; color:#6b21a8;',
  }
  return map[m] || 'background:#f3f4f6; color:#6b7280;'
}

function labelEstadoTransaccion(estado) {
  const map = { CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado' }
  return map[estado] || estado || 'Sin estado'
}

function estadoTransaccionStyle(estado) {
  const map = {
    CONFIRMADO: 'background:#dcfce7; color:#166534;',
    CANCELADO: 'background:#fee2e2; color:#991b1b;',
  }
  return map[estado] || 'background:#f3f4f6; color:#6b7280;'
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



