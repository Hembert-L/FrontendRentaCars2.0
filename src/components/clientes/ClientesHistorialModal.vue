<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="hist-backdrop fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
        @click.self.stop="$emit('cerrar')"
      >
        <div class="hist-shell w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden" @click.stop>
          <!-- Header -->
          <div class="hist-header flex items-start justify-between gap-3 px-5 py-4 sm:px-6 flex-shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                :style="`background:${avatarColor(clienteInfo?.nombre || cliente?.nombre)}`"
              >
                {{ initials(clienteInfo?.nombre || cliente?.nombre) }}
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-widest text-[#f0a500]/90">Historial del cliente</p>
                <h2 class="text-lg font-extrabold text-white truncate">{{ clienteInfo?.nombre || '—' }}</h2>
                <div v-if="clienteInfo?.dui || clienteInfo?.telefono" class="flex flex-wrap items-center gap-2 mt-1.5">
                  <span v-if="clienteInfo?.dui" class="hist-meta-chip">
                    <i class="pi pi-id-card text-[10px]"></i>
                    <span class="hist-meta-label">DUI</span>
                    <span class="hist-meta-value">{{ clienteInfo.dui }}</span>
                  </span>
                  <span v-if="clienteInfo?.telefono" class="hist-meta-chip">
                    <i class="pi pi-phone text-[10px]"></i>
                    <span class="hist-meta-label">Tel.</span>
                    <span class="hist-meta-value">{{ clienteInfo.telefono }}</span>
                  </span>
                </div>
              </div>
            </div>
            <button type="button" class="hist-close-btn" @click.stop.prevent="$emit('cerrar')">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="hist-body flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden" :class="isDark ? 'hist-body--dark' : 'hist-body--light'">
            <!-- Nav lateral -->
            <nav class="hist-nav flex-shrink-0 p-3 md:p-4 md:w-[240px] border-b md:border-b-0 md:border-r" :class="isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-100 bg-gray-50/80'">
              <p class="hidden md:block text-[10px] font-bold uppercase tracking-widest mb-3 px-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Explorar historial</p>
              <div class="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                <button
                  v-for="t in tabs"
                  :key="t.id"
                  type="button"
                  class="hist-tab md:w-full"
                  :class="[
                    tabActiva === t.id ? 'hist-tab--active' : '',
                    isDark ? 'hist-tab--dark' : 'hist-tab--light',
                    `hist-tab--type-${t.id}`,
                  ]"
                  @click="tabActiva = t.id"
                >
                  <span class="hist-tab-icon">
                    <i :class="['pi', t.icon]"></i>
                  </span>
                  <span class="hist-tab-body">
                    <span class="hist-tab-label">{{ t.label }}</span>
                    <span class="hist-tab-desc">{{ t.desc }}</span>
                  </span>
                  <span class="hist-tab-count">{{ t.count }}</span>
                </button>
              </div>

              <div v-if="!cargando && !error" class="hidden md:block mt-5 pt-4 border-t space-y-2" :class="isDark ? 'border-gray-800' : 'border-gray-200'">
                <div class="hist-stat">
                  <span :class="isDark ? 'text-gray-500' : 'text-gray-400'">Total reservas</span>
                  <strong :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ reservas.length }}</strong>
                </div>
                <div class="hist-stat">
                  <span :class="isDark ? 'text-gray-500' : 'text-gray-400'">Total contratos</span>
                  <strong :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ contratos.length }}</strong>
                </div>
                <div class="hist-stat">
                  <span :class="isDark ? 'text-gray-500' : 'text-gray-400'">Incidentes</span>
                  <strong :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ incidentes.length }}</strong>
                </div>
              </div>
            </nav>

            <!-- Contenido -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
              <div v-if="cargando" class="flex flex-col items-center justify-center py-20 gap-2">
                <i class="pi pi-spin pi-spinner text-2xl" style="color:#c0392b;"></i>
                <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Cargando historial...</p>
              </div>

              <div v-else-if="error" class="text-center py-16">
                <i class="pi pi-exclamation-circle text-3xl mb-3 block" style="color:#c0392b;"></i>
                <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ error }}</p>
              </div>

              <!-- Reservas -->
              <div v-else-if="tabActiva === 'reservas'">
                <div class="hist-section-head">
                  <div>
                    <h3 class="hist-content-title" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
                      <i class="pi pi-calendar" style="color:#c0392b;"></i> Reservas
                    </h3>
                    <p class="hist-section-sub" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Citas y fechas del cliente</p>
                  </div>
                  <span class="hist-section-badge" :class="isDark ? 'hist-section-badge--dark' : ''">
                    {{ reservas.length }} registro{{ reservas.length !== 1 ? 's' : '' }}
                  </span>
                </div>
                <div v-if="!reservas.length" class="hist-empty">
                  <i class="pi pi-calendar-times"></i>
                  <p>Este cliente no tiene reservas registradas.</p>
                </div>
                <div v-else class="hist-list">
                  <article
                    v-for="r in reservasPaginadas"
                    :key="'r-' + r.id"
                    class="hist-record hist-record--reservas"
                    :class="isDark ? 'hist-record--dark' : 'hist-record--light'"
                  >
                    <div class="hist-record-banner">
                      <div class="hist-record-banner-left">
                        <span class="hist-record-ref">Reserva #{{ r.id }}</span>
                        <span class="hist-pill" :style="estadoReservaStyle(r.estado, isDark)">{{ labelEstadoReserva(r.estado) }}</span>
                        <span class="hist-pill hist-pill--muted" :class="isDark ? 'hist-pill--muted-dark' : ''">{{ labelTipoReserva(r.tipo_reserva) }}</span>
                      </div>
                      <i class="pi pi-calendar hist-record-banner-icon"></i>
                    </div>
                    <div class="hist-record-period" :class="isDark ? 'hist-record-period--dark' : ''">
                      <div class="hist-period-node">
                        <span class="hist-period-label">Inicio</span>
                        <span class="hist-period-date">{{ formatFechaSoloHistorial(r.fecha_inicio) }}</span>
                      </div>
                      <div class="hist-period-line">
                        <span class="hist-period-days">{{ diasEntreReserva(r.fecha_inicio, r.fecha_fin) }} día{{ diasEntreReserva(r.fecha_inicio, r.fecha_fin) !== 1 ? 's' : '' }}</span>
                      </div>
                      <div class="hist-period-node hist-period-node--end">
                        <span class="hist-period-label">Fin</span>
                        <span class="hist-period-date">{{ formatFechaSoloHistorial(r.fecha_fin) }}</span>
                      </div>
                    </div>
                    <div class="hist-spec-grid">
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-car hist-spec-icon"></i>
                        <span class="hist-spec-label">Vehículo</span>
                        <span class="hist-spec-value">{{ nombreVehiculoHistorial(r.vehiculo) }}</span>
                      </div>
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-file-edit hist-spec-icon"></i>
                        <span class="hist-spec-label">Contrato</span>
                        <span class="hist-spec-value">{{ r.contrato?.numero_contrato || 'Sin contrato' }}</span>
                      </div>
                      <div class="hist-spec-box hist-spec-box--wide" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-user hist-spec-icon"></i>
                        <span class="hist-spec-label">Registrado por</span>
                        <span class="hist-spec-value">{{ nombreUsuarioHistorial(r.user) }}</span>
                      </div>
                    </div>
                  </article>
                </div>
                <HistorialPagination
                  v-if="reservas.length > registrosPorPagina"
                  :pagination="paginationReservas"
                  @cambiar="paginaReservas = $event"
                />
              </div>

              <!-- Contratos -->
              <div v-else-if="tabActiva === 'contratos'">
                <div class="hist-section-head">
                  <div>
                    <h3 class="hist-content-title" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
                      <i class="pi pi-file-edit" style="color:#c0392b;"></i> Contratos de renta
                    </h3>
                    <p class="hist-section-sub" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Rentas formalizadas del cliente</p>
                  </div>
                  <span class="hist-section-badge" :class="isDark ? 'hist-section-badge--dark' : ''">
                    {{ contratos.length }} registro{{ contratos.length !== 1 ? 's' : '' }}
                  </span>
                </div>
                <div v-if="!contratos.length" class="hist-empty">
                  <i class="pi pi-file-excel"></i>
                  <p>Este cliente no tiene contratos de renta.</p>
                </div>
                <div v-else class="hist-list">
                  <article
                    v-for="c in contratosPaginados"
                    :key="'c-' + c.id"
                    class="hist-record hist-record--contratos"
                    :class="isDark ? 'hist-record--dark' : 'hist-record--light'"
                  >
                    <div class="hist-record-banner">
                      <div class="hist-record-banner-left">
                        <span class="hist-record-ref hist-record-ref--gold">{{ c.numero_contrato }}</span>
                        <span class="hist-pill" :style="estadoContratoStyle(c.estado_contrato, isDark)">{{ labelEstadoContrato(c.estado_contrato) }}</span>
                      </div>
                      <i class="pi pi-file-edit hist-record-banner-icon"></i>
                    </div>
                    <div class="hist-spec-grid">
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-car hist-spec-icon"></i>
                        <span class="hist-spec-label">Vehículo</span>
                        <span class="hist-spec-value">{{ nombreVehiculoHistorial(c.vehiculo || c.reserva?.vehiculo) }}</span>
                      </div>
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-sign-in hist-spec-icon"></i>
                        <span class="hist-spec-label">Entrega</span>
                        <span class="hist-spec-value">{{ formatFechaHoraHistorial(c.fecha_hora_entrega) }}</span>
                      </div>
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-sign-out hist-spec-icon"></i>
                        <span class="hist-spec-label">Devolución</span>
                        <span class="hist-spec-value">{{ formatFechaHoraHistorial(c.fecha_hora_devolucion) }}</span>
                      </div>
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-clock hist-spec-icon"></i>
                        <span class="hist-spec-label">Días</span>
                        <span class="hist-spec-value">{{ c.dias_acordados }}</span>
                      </div>
                      <div class="hist-spec-box hist-spec-box--wide" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-user hist-spec-icon"></i>
                        <span class="hist-spec-label">Atendido por</span>
                        <span class="hist-spec-value">{{ nombreUsuarioHistorial(c.user) }}</span>
                      </div>
                    </div>
                    <div class="hist-record-total">
                      <span class="hist-record-total-label">Total de la renta</span>
                      <span class="hist-record-total-value">{{ formatMoneyHistorial(c.total_final ?? c.monto_total_renta) }}</span>
                    </div>
                  </article>
                </div>
                <HistorialPagination
                  v-if="contratos.length > registrosPorPagina"
                  :pagination="paginationContratos"
                  @cambiar="paginaContratos = $event"
                />
              </div>

              <!-- Incidentes -->
              <div v-else-if="tabActiva === 'incidentes'">
                <div class="hist-section-head">
                  <div>
                    <h3 class="hist-content-title" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
                      <i class="pi pi-exclamation-triangle" style="color:#c0392b;"></i> Incidentes y deudas
                    </h3>
                    <p class="hist-section-sub" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Registros de daños y montos pendientes</p>
                  </div>
                  <span class="hist-section-badge" :class="isDark ? 'hist-section-badge--dark' : ''">
                    {{ incidentes.length }} registro{{ incidentes.length !== 1 ? 's' : '' }}
                  </span>
                </div>
                <div v-if="!incidentes.length" class="hist-empty">
                  <i class="pi pi-check-circle"></i>
                  <p>Sin incidentes ni deudas registradas.</p>
                </div>
                <div v-else class="hist-list">
                  <article
                    v-for="item in incidentesPaginados"
                    :key="'i-' + item.id"
                    class="hist-record hist-record--incidentes"
                    :class="isDark ? 'hist-record--dark' : 'hist-record--light'"
                  >
                    <div class="hist-record-banner hist-record-banner--warn">
                      <div class="hist-record-banner-left">
                        <span class="hist-pill" :style="estadoHistorialStyle(item.estado, isDark)">{{ labelEstadoHistorial(item.estado) }}</span>
                        <span class="hist-pill hist-pill--brand" :class="isDark ? 'hist-pill--brand-dark' : ''">{{ labelTipoHistorial(item.tipo_registro) }}</span>
                      </div>
                      <span class="hist-record-date">{{ formatFechaHoraHistorial(item.fecha_registro) }}</span>
                    </div>
                    <div class="hist-spec-grid">
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-file hist-spec-icon"></i>
                        <span class="hist-spec-label">Contrato</span>
                        <span class="hist-spec-value">{{ item.contrato?.numero_contrato || '—' }}</span>
                      </div>
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-car hist-spec-icon"></i>
                        <span class="hist-spec-label">Vehículo</span>
                        <span class="hist-spec-value">{{ nombreVehiculoHistorial(item.vehiculo || item.contrato?.vehiculo || item.contrato?.reserva?.vehiculo) }}</span>
                      </div>
                      <div class="hist-spec-box" :class="isDark ? 'hist-spec-box--dark' : ''">
                        <i class="pi pi-user hist-spec-icon"></i>
                        <span class="hist-spec-label">Registrado por</span>
                        <span class="hist-spec-value">{{ nombreUsuarioHistorial(item.user) }}</span>
                      </div>
                    </div>
                    <div
                      class="hist-record-total"
                      :class="Number(item.monto_pendiente) > 0 ? 'hist-record-total--debt' : 'hist-record-total--ok'"
                    >
                      <span class="hist-record-total-label">Monto pendiente</span>
                      <span class="hist-record-total-value">{{ formatMoneyHistorial(item.monto_pendiente) }}</span>
                    </div>
                    <div v-if="item.descripcion" class="hist-record-note" :class="isDark ? 'hist-record-note--dark' : ''">
                      <i class="pi pi-comment"></i>
                      <p>{{ item.descripcion }}</p>
                    </div>
                  </article>
                </div>
                <HistorialPagination
                  v-if="incidentes.length > registrosPorPagina"
                  :pagination="paginationIncidentes"
                  @cambiar="paginaIncidentes = $event"
                />
              </div>
            </div>
          </div>

          <div class="hist-footer px-5 py-3 border-t flex justify-end flex-shrink-0" :class="isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'">
            <button type="button" class="hist-btn-close" :class="isDark ? 'hist-btn-close--dark' : ''" @click.stop.prevent="$emit('cerrar')">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { useClientesStore } from '@/stores/clientes'
import {
  labelTipoHistorial,
  labelEstadoHistorial,
  labelEstadoReserva,
  labelTipoReserva,
  labelEstadoContrato,
  estadoHistorialStyle,
  estadoReservaStyle,
  estadoContratoStyle,
  nombreVehiculoHistorial,
  nombreUsuarioHistorial,
  formatMoneyHistorial,
  formatFechaHoraHistorial,
  formatFechaSoloHistorial,
} from '@/utils/clienteHistorialFormatters'
import { diasEntreFechasISO } from '@/utils/reservaFormatters'

const props = defineProps({
  visible: Boolean,
  cliente: Object,
})

defineEmits(['cerrar'])

const { isDark } = useAppTheme()
const store = useClientesStore()

const tabActiva = ref('reservas')
const cargando = ref(false)
const error = ref('')
const clienteInfo = ref(null)
const reservas = ref([])
const contratos = ref([])
const incidentes = ref([])
const paginaReservas = ref(1)
const paginaContratos = ref(1)
const paginaIncidentes = ref(1)
const registrosPorPagina = 4

const tabs = computed(() => [
  { id: 'reservas', label: 'Reservas', desc: 'Citas programadas', icon: 'pi-calendar', count: reservas.value.length },
  { id: 'contratos', label: 'Contratos', desc: 'Rentas formalizadas', icon: 'pi-file-edit', count: contratos.value.length },
  { id: 'incidentes', label: 'Incidentes', desc: 'Deudas y daños', icon: 'pi-exclamation-triangle', count: incidentes.value.length },
])

const paginationReservas = computed(() => paginar(reservas.value, paginaReservas.value))
const paginationContratos = computed(() => paginar(contratos.value, paginaContratos.value))
const paginationIncidentes = computed(() => paginar(incidentes.value, paginaIncidentes.value))

const reservasPaginadas = computed(() => slicePagina(reservas.value, paginationReservas.value.current_page))
const contratosPaginados = computed(() => slicePagina(contratos.value, paginationContratos.value.current_page))
const incidentesPaginados = computed(() => slicePagina(incidentes.value, paginationIncidentes.value.current_page))

const HistorialPagination = {
  props: {
    pagination: {
      type: Object,
      required: true,
    },
  },
  emits: ['cambiar'],
  template: `
    <div class="hist-pagination">
      <span>Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} registros</span>
      <div class="hist-pagination__actions">
        <button
          type="button"
          class="hist-pagination__btn"
          :disabled="pagination.current_page <= 1"
          @click="$emit('cambiar', pagination.current_page - 1)"
        >
          <i class="pi pi-chevron-left"></i>
          Anterior
        </button>
        <span class="hist-pagination__page">Página {{ pagination.current_page }} de {{ pagination.last_page }}</span>
        <button
          type="button"
          class="hist-pagination__btn"
          :disabled="pagination.current_page >= pagination.last_page"
          @click="$emit('cambiar', pagination.current_page + 1)"
        >
          Siguiente
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
}

const colores = ['#c0392b', '#f0a500', '#2563eb', '#16a34a', '#7c3aed', '#0891b2']
function avatarColor(nombre) {
  if (!nombre) return '#922b21'
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = nombre.charCodeAt(i) + ((h << 5) - h)
  return colores[Math.abs(h) % colores.length]
}
function initials(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function diasEntreReserva(inicio, fin) {
  return diasEntreFechasISO(inicio, fin) || 0
}

function seleccionarTabInicial() {
  if (reservas.value.length) tabActiva.value = 'reservas'
  else if (contratos.value.length) tabActiva.value = 'contratos'
  else if (incidentes.value.length) tabActiva.value = 'incidentes'
  else tabActiva.value = 'reservas'
}

function paginar(lista, pagina) {
  const total = lista.length
  const lastPage = Math.max(1, Math.ceil(total / registrosPorPagina))
  const currentPage = Math.min(pagina, lastPage)
  const from = total ? ((currentPage - 1) * registrosPorPagina) + 1 : 0
  const to = total ? Math.min(currentPage * registrosPorPagina, total) : 0

  return {
    current_page: currentPage,
    last_page: lastPage,
    total,
    from,
    to,
  }
}

function slicePagina(lista, pagina) {
  const start = (pagina - 1) * registrosPorPagina
  return lista.slice(start, start + registrosPorPagina)
}

watch(
  () => props.visible,
  async (val) => {
    if (!val || !props.cliente?.id) return
    cargando.value = true
    error.value = ''
    reservas.value = []
    contratos.value = []
    incidentes.value = []
    clienteInfo.value = null
    tabActiva.value = 'reservas'
    paginaReservas.value = 1
    paginaContratos.value = 1
    paginaIncidentes.value = 1
    try {
      const data = await store.fetchHistorial(props.cliente.id)
      clienteInfo.value = data.cliente || props.cliente
      if (data.disponible === false) {
        error.value = 'El historial todavía no está disponible en backend.'
        return
      }
      reservas.value = data.reservas ?? []
      contratos.value = data.contratos ?? []
      incidentes.value = data.incidentes ?? []
      seleccionarTabInicial()
    } catch (e) {
      error.value = e.response?.data?.message || store.error || 'No se pudo cargar el historial.'
    } finally {
      cargando.value = false
    }
  },
)
</script>

<style scoped>
.hist-backdrop { background: rgba(15, 10, 10, 0.55); backdrop-filter: blur(4px); }

.hist-shell {
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  background: #fff;
  display: flex;
  flex-direction: column;
}

.hist-header {
  background: linear-gradient(135deg, #922b21 0%, #6b2118 55%, #4a1510 100%);
  border-radius: 1.25rem 1.25rem 0 0;
}

.hist-close-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0a500;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}
.hist-close-btn:hover { background: rgba(255, 255, 255, 0.2); }

.hist-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 0.7rem;
  line-height: 1.2;
}
.hist-meta-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(240, 165, 0, 0.95);
  font-size: 0.6rem;
}
.hist-meta-value {
  font-weight: 600;
  color: #fff;
}

.hist-body--light { background: #fafafa; }
.hist-body--dark { background: #111827; }

.hist-tab {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-width: 11rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.875rem;
  border: 1.5px solid transparent;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.hist-tab::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: transparent;
  transition: background 0.15s;
}
.hist-tab:hover:not(.hist-tab--active) {
  transform: translateY(-1px);
}
.hist-tab--light {
  background: #fff;
  border-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.hist-tab--light:hover:not(.hist-tab--active) {
  border-color: #fecaca;
  box-shadow: 0 4px 12px rgba(146, 43, 33, 0.08);
}
.hist-tab--dark {
  background: #1f2937;
  border-color: #374151;
}
.hist-tab--dark:hover:not(.hist-tab--active) {
  border-color: #922b21;
  background: #263040;
}
.hist-tab--active {
  background: linear-gradient(135deg, #922b21 0%, #7a2419 100%);
  border-color: #922b21;
  box-shadow: 0 4px 14px rgba(146, 43, 33, 0.35);
}
.hist-tab--active::before {
  background: #f0a500;
}
.hist-tab--active .hist-tab-icon {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}
.hist-tab--active .hist-tab-label { color: #fff; }
.hist-tab--active .hist-tab-desc { color: rgba(255, 255, 255, 0.75); }
.hist-tab--active .hist-tab-count {
  background: #f0a500;
  color: #4a1510;
  border-color: #f0a500;
}

.hist-tab-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.95rem;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s;
}
.hist-tab--type-reservas .hist-tab-icon {
  background: #fef2f2;
  color: #c0392b;
  border-color: #fecaca;
}
.hist-tab--type-contratos .hist-tab-icon {
  background: #fff7ed;
  color: #c2410c;
  border-color: #fed7aa;
}
.hist-tab--type-incidentes .hist-tab-icon {
  background: #fefce8;
  color: #a16207;
  border-color: #fde68a;
}
.hist-tab--dark.hist-tab--type-reservas:not(.hist-tab--active) .hist-tab-icon {
  background: rgba(192, 57, 43, 0.15);
  color: #f87171;
  border-color: rgba(192, 57, 43, 0.3);
}
.hist-tab--dark.hist-tab--type-contratos:not(.hist-tab--active) .hist-tab-icon {
  background: rgba(234, 88, 12, 0.12);
  color: #fb923c;
  border-color: rgba(234, 88, 12, 0.25);
}
.hist-tab--dark.hist-tab--type-incidentes:not(.hist-tab--active) .hist-tab-icon {
  background: rgba(240, 165, 0, 0.12);
  color: #f0a500;
  border-color: rgba(240, 165, 0, 0.25);
}

.hist-tab-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.hist-tab-label {
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.2;
  color: #1f2937;
}
.hist-tab--dark:not(.hist-tab--active) .hist-tab-label { color: #e5e7eb; }
.hist-tab-desc {
  font-size: 0.65rem;
  font-weight: 500;
  line-height: 1.2;
  color: #9ca3af;
}
.hist-tab--dark:not(.hist-tab--active) .hist-tab-desc { color: #6b7280; }

.hist-tab-count {
  flex-shrink: 0;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  background: #f3f4f6;
  color: #374151;
  border: 1.5px solid #e5e7eb;
}
.hist-tab--dark:not(.hist-tab--active) .hist-tab-count {
  background: #374151;
  color: #d1d5db;
  border-color: #4b5563;
}

.hist-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}
.hist-stat strong { font-weight: 800; }

.hist-content-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 800;
}

.hist-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.hist-section-sub {
  font-size: 0.75rem;
  margin-top: 0.15rem;
}
.hist-section-badge {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
  background: #fef2f2;
  color: #c0392b;
  border: 1px solid #fecaca;
}
.hist-section-badge--dark {
  background: rgba(146, 43, 33, 0.25);
  color: #f0a500;
  border-color: rgba(240, 165, 0, 0.25);
}

.hist-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.hist-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(146, 43, 33, 0.14);
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.hist-body--dark .hist-pagination {
  border-top-color: #374151;
  color: #9ca3af;
}

.hist-pagination__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.hist-pagination__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
  border-radius: 0.65rem;
  border: 1px solid #dbe3ed;
  background: #fff;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 800;
  transition: all 0.15s ease;
}

.hist-pagination__btn i {
  font-size: 0.65rem;
}

.hist-body--dark .hist-pagination__btn {
  border-color: #374151;
  background: #111827;
  color: #d1d5db;
}

.hist-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hist-pagination__btn:not(:disabled):hover {
  color: #c0392b;
  border-color: #fecaca;
  background: #fff7f5;
  transform: translateY(-1px);
}

.hist-body--dark .hist-pagination__btn:not(:disabled):hover {
  color: #f0a500;
  border-color: #4b5563;
  background: #1f2937;
}

.hist-pagination__page {
  min-width: 6.5rem;
  text-align: center;
}

@media (max-width: 640px) {
  .hist-pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .hist-pagination__actions {
    justify-content: flex-start;
  }
}

.hist-record {
  border-radius: 1rem;
  overflow: hidden;
  border: 1.5px solid;
  transition: box-shadow 0.15s, transform 0.15s;
}
.hist-record--light {
  background: #fff;
  border-color: #e5e7eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.hist-record--light:hover {
  box-shadow: 0 6px 20px rgba(146, 43, 33, 0.1);
  transform: translateY(-1px);
}
.hist-record--dark {
  background: #1f2937;
  border-color: #374151;
}
.hist-record--dark:hover {
  border-color: #922b21;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.hist-record-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background: linear-gradient(135deg, #922b21, #7a2419);
  color: #fff;
}
.hist-record--contratos .hist-record-banner {
  background: linear-gradient(135deg, #9a3412, #7c2d12);
}
.hist-record-banner--warn {
  background: linear-gradient(135deg, #78350f, #92400e);
}
.hist-record-banner-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}
.hist-record-ref {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #fff;
}
.hist-record-ref--gold {
  color: #f0a500;
  font-family: ui-monospace, monospace;
}
.hist-record-banner-icon {
  font-size: 1.1rem;
  opacity: 0.45;
  flex-shrink: 0;
}
.hist-record-date {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.hist-record-period {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
}
.hist-record-period--dark {
  background: rgba(146, 43, 33, 0.12);
  border-bottom-color: rgba(146, 43, 33, 0.25);
}
.hist-period-node {
  flex: 1;
  min-width: 0;
}
.hist-period-node--end { text-align: right; }
.hist-period-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 0.1rem;
}
.hist-period-date {
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  color: #1f2937;
}
.hist-record-period--dark .hist-period-date { color: #f3f4f6; }
.hist-period-line {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 4rem;
}
.hist-period-line::before {
  content: '';
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #c0392b, #f0a500);
  border-radius: 2px;
  margin-bottom: 0.25rem;
}
.hist-period-days {
  font-size: 0.6rem;
  font-weight: 800;
  color: #c0392b;
  white-space: nowrap;
}
.hist-record-period--dark .hist-period-days { color: #f0a500; }

.hist-spec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}
@media (min-width: 640px) {
  .hist-spec-grid { grid-template-columns: repeat(3, 1fr); }
}
.hist-spec-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  padding: 0.5rem 0.625rem;
  min-width: 0;
}
.hist-spec-box--dark {
  background: rgba(17, 24, 39, 0.6);
  border-color: #374151;
}
.hist-spec-box--wide {
  grid-column: 1 / -1;
}
@media (min-width: 640px) {
  .hist-spec-box--wide { grid-column: span 2; }
}
.hist-spec-icon {
  font-size: 0.65rem;
  color: #c0392b;
  margin-bottom: 0.2rem;
  display: block;
}
.hist-spec-box--dark .hist-spec-icon { color: #f0a500; }
.hist-spec-label {
  display: block;
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 0.15rem;
}
.hist-spec-value {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
  word-break: break-word;
}
.hist-spec-box--dark .hist-spec-value { color: #e5e7eb; }

.hist-record-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, #922b21, #6b2118);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.hist-record-total--debt {
  background: linear-gradient(135deg, #991b1b, #7f1d1d);
}
.hist-record-total--ok {
  background: linear-gradient(135deg, #166534, #14532d);
}
.hist-record-total-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.75);
}
.hist-record-total-value {
  font-size: 1.05rem;
  font-weight: 900;
  color: #f0a500;
}

.hist-record-note {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.65rem 1rem;
  background: #fffbeb;
  border-top: 1px solid #fde68a;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #78350f;
}
.hist-record-note i {
  flex-shrink: 0;
  margin-top: 0.1rem;
  opacity: 0.7;
}
.hist-record-note--dark {
  background: rgba(120, 53, 15, 0.15);
  border-top-color: rgba(240, 165, 0, 0.2);
  color: #fcd34d;
}

.hist-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}
.hist-empty i { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; opacity: 0.5; }
.hist-empty p { font-size: 0.875rem; }

.hist-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}
.hist-pill--muted {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}
.hist-pill--muted-dark {
  background: #374151;
  color: #d1d5db;
  border-color: #4b5563;
}
.hist-pill--brand {
  background: #fef2f2;
  color: #c0392b;
  border: 1px solid #fecaca;
}
.hist-pill--brand-dark {
  background: rgba(146, 43, 33, 0.25);
  color: #f0a500;
  border-color: rgba(240, 165, 0, 0.3);
}

.hist-btn-close {
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 800;
  border: 2px solid #e5e7eb;
  color: #6b7280;
  background: transparent;
  transition: all 0.15s;
}
.hist-btn-close:hover { background: #f9fafb; }
.hist-btn-close--dark {
  border-color: #374151;
  color: #9ca3af;
}
.hist-btn-close--dark:hover { background: #1f2937; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

