<template>
  <section class="form-section rounded-2xl border shadow-sm p-5 sm:p-6 space-y-4" :class="shellClass">
    <label class="field-label">{{ modoDirecto ? 'Vehículo y duración' : 'Fechas, horarios y vehículo' }}</label>
    <p class="text-xs mb-2 -mt-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
      {{ modoDirecto
        ? 'El contrato inicia hoy. Selecciona la fecha de devolución para calcular los días acordados.'
        : 'Horarios permitidos: 6:00-7:00 AM y 6:00-7:00 PM. Los vehículos se consultan al elegir fechas.' }}
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-if="!modoDirecto">
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Entrega - fecha</label>
        <div class="relative">
          <i class="pi pi-calendar input-icon"></i>
          <input :value="fechaEntrega" type="date" :min="hoy" class="field-input" @input="$emit('update:fechaEntrega', $event.target.value)" />
        </div>
      </div>
      <div v-if="!modoDirecto">
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Entrega - hora</label>
        <select :value="horaEntrega" class="field-input field-input--plain" @change="$emit('update:horaEntrega', $event.target.value)">
          <option v-for="op in HORAS_PERMITIDAS_OPCIONES" :key="'e' + op.value" :value="op.value">{{ op.label }}</option>
        </select>
      </div>
      <div :class="modoDirecto ? 'sm:col-span-2' : ''">
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Devolución - fecha</label>
        <div class="relative">
          <i class="pi pi-calendar input-icon"></i>
          <input :value="fechaDevolucion" type="date" :min="minFechaDevolucion" class="field-input" @input="$emit('update:fechaDevolucion', $event.target.value)" />
        </div>
      </div>
      <div v-if="!modoDirecto">
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Devolución - hora</label>
        <select :value="horaDevolucion" class="field-input field-input--plain" @change="$emit('update:horaDevolucion', $event.target.value)">
          <option v-for="op in HORAS_PERMITIDAS_OPCIONES" :key="'d' + op.value" :value="op.value">{{ op.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="cargando" class="text-sm py-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
      <i class="pi pi-spin pi-spinner"></i> Consultando vehículos...
    </div>

    <div v-else-if="consultados && vehiculos.length === 0" class="text-sm rounded-xl p-3 border" :class="isDark ? 'text-amber-300 bg-amber-950/30 border-amber-900/40' : 'text-amber-700 bg-amber-50 border-amber-100'">
      <i class="pi pi-exclamation-triangle mr-1"></i> No hay vehículos disponibles para esas fechas.
    </div>

    <div v-else-if="vehiculos.length" class="space-y-3 pt-2">
      <div class="vehicles-search">
        <i class="pi pi-search vehicles-search__icon"></i>
        <input
          v-model="busquedaVehiculo"
          type="text"
          class="vehicles-search__input"
          :class="isDark ? 'vehicles-search__input--dark' : 'vehicles-search__input--light'"
          placeholder="Buscar por vehículo, marca, modelo o categoría..."
        />
      </div>

      <div
        v-if="!vehiculosFiltrados.length"
        class="text-sm rounded-xl p-3 border"
        :class="isDark ? 'text-amber-300 bg-amber-950/30 border-amber-900/40' : 'text-amber-700 bg-amber-50 border-amber-100'"
      >
        <i class="pi pi-search mr-1"></i> No se encontraron vehículos disponibles con esa búsqueda.
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <button
          v-for="v in vehiculosPaginados"
          :key="v.id"
          type="button"
          class="reserva-card rounded-xl text-left transition-all overflow-hidden"
          :class="{ 'reserva-card--selected': esVehiculoSeleccionado(v) }"
          @click="$emit('update:vehiculoId', v.id)"
        >
          <div class="card-header">
            <div class="flex items-start gap-3 min-w-0 flex-1">
              <div class="card-icon-wrap"><i class="pi pi-car text-lg text-white"></i></div>
              <div class="min-w-0">
                <p class="font-extrabold text-base leading-tight text-white truncate">{{ nombreVehiculo(v) }}</p>
                <p v-if="v.categoria?.nombre" class="text-[11px] text-white/75 mt-0.5">{{ v.categoria.nombre }}</p>
              </div>
            </div>
            <span v-if="esVehiculoSeleccionado(v)" class="card-selected-badge"><i class="pi pi-check text-[10px]"></i></span>
          </div>
          <div class="card-specs">
            <div class="spec-item"><span class="spec-label">Placa</span><span class="spec-value spec-value--mono">{{ v.placa }}</span></div>
            <div class="spec-item"><span class="spec-label">Color</span><span class="spec-value">{{ v.color }}</span></div>
          </div>
          <div v-if="v.categoria?.precio_dia" class="card-price-bar">
            <span class="text-[10px] font-bold uppercase text-white/70">Tarifa diaria</span>
            <span class="text-lg font-extrabold text-white">${{ formatPrecio(v.categoria.precio_dia) }}<span class="text-xs font-semibold text-white/80">/día</span></span>
          </div>
        </button>
      </div>

      <div
        v-if="paginacionVehiculos.total > vehiculosPorPagina"
        class="vehicles-pagination"
        :class="isDark ? 'vehicles-pagination--dark' : 'vehicles-pagination--light'"
      >
        <span>
          Mostrando {{ paginacionVehiculos.from }}-{{ paginacionVehiculos.to }} de {{ paginacionVehiculos.total }} vehículos disponibles
        </span>
        <div class="vehicles-pagination__actions">
          <button
            type="button"
            class="vehicles-pagination__btn"
            :disabled="!puedeRetrocederVehiculos"
            @click="cambiarPaginaVehiculos(paginacionVehiculos.current_page - 1)"
          >
            <i class="pi pi-chevron-left text-[0.65rem]"></i>
            Anterior
          </button>
          <span class="vehicles-pagination__page">
            Página {{ paginacionVehiculos.current_page }} de {{ paginacionVehiculos.last_page }}
          </span>
          <button
            type="button"
            class="vehicles-pagination__btn"
            :disabled="!puedeAvanzarVehiculos"
            @click="cambiarPaginaVehiculos(paginacionVehiculos.current_page + 1)"
          >
            Siguiente
            <i class="pi pi-chevron-right text-[0.65rem]"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { HORAS_PERMITIDAS_OPCIONES, nombreVehiculo, formatPrecio } from '@/utils/contratoFormatters'

const props = defineProps({
  fechaEntrega:    { type: String, default: '' },
  horaEntrega:     { type: String, default: '06:00' },
  fechaDevolucion: { type: String, default: '' },
  horaDevolucion:  { type: String, default: '18:00' },
  vehiculoId:      { type: [String, Number], default: '' },
  vehiculos:       { type: Array, default: () => [] },
  cargando:        { type: Boolean, default: false },
  consultados:     { type: Boolean, default: false },
  modoDirecto:     { type: Boolean, default: false },
})

defineEmits(['update:fechaEntrega', 'update:horaEntrega', 'update:fechaDevolucion', 'update:horaDevolucion', 'update:vehiculoId'])

const { isDark } = useAppTheme()
const hoy = new Date().toISOString().split('T')[0]
const vehiculosPorPagina = 6
const paginaVehiculos = ref(1)
const busquedaVehiculo = ref('')

const minFechaDevolucion = computed(() => {
  const base = props.fechaEntrega || hoy
  const d = new Date(`${base}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})

const paginacionVehiculos = computed(() => {
  const total = vehiculosFiltrados.value.length
  const lastPage = Math.max(1, Math.ceil(total / vehiculosPorPagina))
  const currentPage = Math.min(paginaVehiculos.value, lastPage)
  const from = total ? ((currentPage - 1) * vehiculosPorPagina) + 1 : 0
  const to = total ? Math.min(currentPage * vehiculosPorPagina, total) : 0

  return {
    current_page: currentPage,
    last_page: lastPage,
    total,
    from,
    to,
  }
})

const vehiculosPaginados = computed(() => {
  const start = (paginacionVehiculos.value.current_page - 1) * vehiculosPorPagina
  return vehiculosFiltrados.value.slice(start, start + vehiculosPorPagina)
})

const puedeRetrocederVehiculos = computed(() => paginacionVehiculos.value.current_page > 1)
const puedeAvanzarVehiculos = computed(() => paginacionVehiculos.value.current_page < paginacionVehiculos.value.last_page)
const shellClass = computed(() => isDark.value ? 'form-section-dark bg-gray-900 border-gray-800' : 'form-section-light bg-white border-gray-100')

const vehiculosFiltrados = computed(() => {
  const terminos = normalizarBusqueda(busquedaVehiculo.value)
    .split(' ')
    .filter(Boolean)
  if (!terminos.length) return props.vehiculos

  return props.vehiculos.filter((vehiculo) => {
    const texto = normalizarBusqueda(textoVehiculo(vehiculo))
    return terminos.every((termino) => texto.includes(termino))
  })
})

watch(
  () => props.vehiculos.map((v) => v.id).join('|'),
  () => {
    paginaVehiculos.value = 1
    busquedaVehiculo.value = ''
  },
)

watch(busquedaVehiculo, () => {
  paginaVehiculos.value = 1
})

watch(
  () => props.vehiculoId,
  (id) => {
    if (!id) return
    const index = props.vehiculos.findIndex((v) => String(v.id) === String(id))
    if (index >= 0) paginaVehiculos.value = Math.floor(index / vehiculosPorPagina) + 1
  },
)

watch(paginacionVehiculos, (value) => {
  if (paginaVehiculos.value !== value.current_page) paginaVehiculos.value = value.current_page
})

function cambiarPaginaVehiculos(page) {
  if (page < 1 || page > paginacionVehiculos.value.last_page || page === paginaVehiculos.value) return
  paginaVehiculos.value = page
}

function esVehiculoSeleccionado(vehiculo) {
  return String(props.vehiculoId) === String(vehiculo.id)
}

function textoVehiculo(vehiculo) {
  return [
    nombreVehiculo(vehiculo),
    vehiculo.marca?.nombre,
    vehiculo.modelo?.nombre,
    vehiculo.categoria?.nombre,
    vehiculo.color,
    vehiculo.placa,
  ].join(' ')
}

function normalizarBusqueda(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
</script>

<style scoped>
.field-label { display:block; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.5rem; }
.input-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-size:0.875rem; pointer-events:none; }
.field-input { width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; border-radius:0.75rem; font-size:0.875rem; outline:none; }
.field-input--plain { padding-left:1rem; }
.form-section-light .field-label { color:#4b5563; }
.form-section-light .input-icon { color:#9ca3af; }
.form-section-light .field-input { border:1px solid #d1d5db; background:#fff; color:#1f2937; }
.form-section-dark .field-label { color:#9ca3af; }
.form-section-dark .input-icon { color:#6b7280; }
.form-section-dark .field-input { border:1px solid #4b5563; background:#1f2937; color:#f3f4f6; }
.reserva-card { background:#922b21; color:#fff; border:2px solid transparent; display:flex; flex-direction:column; }
.reserva-card--selected { border-color:#f0a500; box-shadow:0 0 0 3px rgba(240,165,0,0.35); }
.card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem; padding:1rem 1rem 0.75rem; }
.card-icon-wrap { width:2.75rem; height:2.75rem; border-radius:0.75rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.18); }
.card-selected-badge { width:1.5rem; height:1.5rem; border-radius:9999px; display:flex; align-items:center; justify-content:center; background:#fff; color:#922b21; }
.card-specs { display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; padding:0 1rem 0.75rem; }
.spec-item { background:rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.12); border-radius:0.625rem; padding:0.5rem; }
.spec-label { font-size:0.6rem; font-weight:700; text-transform:uppercase; color:rgba(255,255,255,0.55); display:block; }
.spec-value { font-size:0.8rem; font-weight:700; color:#fff; }
.spec-value--mono { font-family:ui-monospace,monospace; }
.card-price-bar { display:flex; align-items:center; justify-content:space-between; padding:0.625rem 1rem; background:rgba(0,0,0,0.2); border-top:1px solid rgba(255,255,255,0.12); margin-top:auto; }
.vehicles-search { position:relative; }
.vehicles-search__icon { position:absolute; left:0.9rem; top:50%; transform:translateY(-50%); font-size:0.85rem; color:#9ca3af; pointer-events:none; }
.vehicles-search__input { width:100%; min-height:2.75rem; border-radius:0.85rem; border:1px solid; padding:0.7rem 1rem 0.7rem 2.45rem; font-size:0.875rem; outline:none; transition:border-color 0.15s, box-shadow 0.15s, background 0.15s; }
.vehicles-search__input:focus { border-color:#c0392b; box-shadow:0 0 0 3px rgba(192,57,43,0.12); }
.vehicles-search__input--light { border-color:#dbe3ed; background:#fff; color:#1f2937; }
.vehicles-search__input--dark { border-color:#374151; background:#111827; color:#f9fafb; }
.vehicles-pagination { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; padding:0.75rem 0.25rem 0; font-size:0.75rem; font-weight:700; }
.vehicles-pagination--light { color:#64748b; border-top:1px solid #f1f5f9; }
.vehicles-pagination--dark { color:#9ca3af; border-top:1px solid #1f2937; }
.vehicles-pagination__actions { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end; }
.vehicles-pagination__btn { display:inline-flex; align-items:center; gap:0.35rem; min-height:2rem; padding:0.4rem 0.7rem; border-radius:0.7rem; border:1px solid currentColor; font-size:0.72rem; font-weight:800; transition:all 0.15s ease; }
.vehicles-pagination__btn:disabled { opacity:0.45; cursor:not-allowed; }
.vehicles-pagination__btn:not(:disabled):hover { transform:translateY(-1px); color:#c0392b; }
.vehicles-pagination__page { min-width:6.5rem; text-align:center; }
@media (max-width: 640px) {
  .vehicles-pagination { align-items:flex-start; flex-direction:column; }
  .vehicles-pagination__actions { justify-content:flex-start; }
}
</style>
