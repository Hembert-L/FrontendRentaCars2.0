<template>
  <section
    class="form-section rounded-2xl border shadow-sm p-5 sm:p-6 space-y-4"
    :class="isDark ? 'form-section-dark bg-gray-900 border-gray-800' : 'form-section-light bg-white border-gray-100'"
  >
    <div>
      <label class="field-label">Vehículos disponibles</label>
      <p class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        Se actualizan automáticamente al elegir las fechas de la reserva.
      </p>

      <p
        v-if="cargando"
        class="text-sm rounded-xl p-3 border"
        :class="isDark ? 'text-gray-400 bg-gray-800/50 border-gray-700' : 'text-gray-600 bg-gray-50 border-gray-100'"
      >
        <i class="pi pi-spin pi-spinner mr-1"></i>
        Consultando vehículos disponibles...
      </p>

      <p
        v-else-if="consultados && vehiculos.length === 0"
        class="text-sm rounded-xl p-3 border"
        :class="isDark ? 'text-amber-300 bg-amber-950/30 border-amber-900/40' : 'text-amber-700 bg-amber-50 border-amber-100'"
      >
        <i class="pi pi-exclamation-triangle mr-1"></i>
        No hay vehículos disponibles para esas fechas.
      </p>
    </div>

    <div v-if="consultados && vehiculos.length > 0" class="space-y-3 pt-2 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
      <div class="flex items-center justify-between">
        <label class="field-label mb-0">Vehículos disponibles</label>
        <span
          class="text-xs font-bold px-2 py-0.5 rounded-full border"
          :class="isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'"
        >
          {{ vehiculos.length }}
        </span>
      </div>

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
        <i class="pi pi-search mr-1"></i>
        No se encontraron vehículos disponibles con esa búsqueda.
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <button
          v-for="v in vehiculosPaginados"
          :key="v.id"
          type="button"
          class="reserva-card rounded-xl text-left transition-all overflow-hidden"
          :class="{ 'reserva-card--selected': esVehiculoSeleccionado(v) }"
          @click="$emit('seleccionar', v)"
        >
          <!-- Encabezado -->
          <div class="card-header">
            <div class="card-identity flex items-start gap-3 min-w-0 flex-1">
              <div class="card-icon-wrap">
                <i class="pi pi-car text-lg text-white"></i>
              </div>
              <div class="min-w-0">
                <p class="card-title font-extrabold text-base leading-tight text-white truncate">
                  {{ nombreVehiculo(v) }}
                </p>
                <p v-if="v.categoria?.nombre" class="text-[11px] text-white/75 mt-0.5 font-medium">
                  {{ v.categoria.nombre }}
                </p>
              </div>
            </div>
            <span
              v-if="esVehiculoSeleccionado(v)"
              class="card-selected-badge"
              title="Seleccionado"
            >
              <i class="pi pi-check text-[10px]"></i>
            </span>
            <span v-else class="card-select-hint">Elegir</span>
          </div>

          <p v-if="v.estado === 'RENTADO'" class="px-4 py-2 text-xs font-semibold text-white/90 bg-black/20">
            Actualmente rentado · Compatible con las fechas seleccionadas
          </p>

          <!-- Especificaciones -->
          <div class="card-specs">
            <div class="spec-item">
              <span class="spec-label"><i class="pi pi-tag text-[9px]"></i> Placa</span>
              <span class="spec-value spec-value--mono">{{ v.placa || '—' }}</span>
            </div>

            <div class="spec-item">
              <span class="spec-label"><i class="pi pi-palette text-[9px]"></i> Color</span>
              <span class="spec-value spec-value--color">
                <span
                  v-if="v.color"
                  class="color-dot"
                  :style="{ background: colorHex(v.color) }"
                  :title="v.color"
                ></span>
                {{ v.color || '—' }}
              </span>
            </div>

            <div class="spec-item">
              <span class="spec-label"><i class="pi pi-calendar text-[9px]"></i> Año</span>
              <span class="spec-value">{{ v.anio || '—' }}</span>
            </div>

            <div class="spec-item">
              <span class="spec-label"><i class="pi pi-users text-[9px]"></i> Pasajeros</span>
              <span class="spec-value">{{ v.capacidad_pasajeros ? v.capacidad_pasajeros + ' pers.' : '—' }}</span>
            </div>
          </div>

          <!-- Precio -->
          <div v-if="v.categoria?.precio_dia" class="card-price-bar">
            <span class="text-[10px] font-bold uppercase tracking-wide text-white/70">Tarifa diaria</span>
            <span class="text-lg font-extrabold text-white">
              ${{ formatPrecio(v.categoria.precio_dia) }}
              <span class="text-xs font-semibold text-white/80">/ día</span>
            </span>
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
import { nombreVehiculo, formatPrecio } from '@/utils/reservaFormatters'

const props = defineProps({
  fechaInicio:          { type: String, default: '' },
  fechaFin:             { type: String, default: '' },
  vehiculos:            { type: Array, default: () => [] },
  vehiculoSeleccionado: { type: Object, default: null },
  cargando:             { type: Boolean, default: false },
  consultados:          { type: Boolean, default: false },
})

defineEmits(['seleccionar'])

const { isDark } = useAppTheme()
const vehiculosPorPagina = 6
const paginaVehiculos = ref(1)
const busquedaVehiculo = ref('')

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
  () => props.vehiculoSeleccionado?.id,
  (id) => {
    if (!id) return
    const index = props.vehiculos.findIndex((v) => String(v.id) === String(id))
    if (index >= 0) paginaVehiculos.value = Math.floor(index / vehiculosPorPagina) + 1
  },
)

watch(paginacionVehiculos, (value) => {
  if (paginaVehiculos.value !== value.current_page) paginaVehiculos.value = value.current_page
})

const COLORES_HEX = {
  blanco: '#f8fafc',
  negro: '#1f2937',
  gris: '#6b7280',
  plata: '#94a3b8',
  plateado: '#94a3b8',
  rojo: '#dc2626',
  azul: '#2563eb',
  verde: '#16a34a',
  amarillo: '#eab308',
  naranja: '#ea580c',
  cafe: '#78350f',
  marrón: '#78350f',
  marron: '#78350f',
  beige: '#d6c4a8',
  dorado: '#ca8a04',
  vino: '#7f1d1d',
  morado: '#7c3aed',
  rosado: '#ec4899',
  rosa: '#ec4899',
}

function colorHex(nombre) {
  if (!nombre) return '#9ca3af'
  const key = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return COLORES_HEX[key] || '#9ca3af'
}

function cambiarPaginaVehiculos(page) {
  if (page < 1 || page > paginacionVehiculos.value.last_page || page === paginaVehiculos.value) return
  paginaVehiculos.value = page
}

function esVehiculoSeleccionado(vehiculo) {
  return String(props.vehiculoSeleccionado?.id) === String(vehiculo.id)
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
.field-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}
.form-section-light .field-label { color: #4b5563; }
.form-section-dark .field-label { color: #9ca3af; }

.vehicles-search {
  position: relative;
}

.vehicles-search__icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: #9ca3af;
  pointer-events: none;
}

.vehicles-search__input {
  width: 100%;
  min-height: 2.75rem;
  border-radius: 0.85rem;
  border: 1px solid;
  padding: 0.7rem 1rem 0.7rem 2.45rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.vehicles-search__input:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.12);
}

.vehicles-search__input--light {
  border-color: #dbe3ed;
  background: #fff;
  color: #1f2937;
}

.vehicles-search__input--dark {
  border-color: #374151;
  background: #111827;
  color: #f9fafb;
}

.reserva-card {
  background: #922b21;
  color: #fff;
  border: 2px solid transparent;
  transition: filter 0.15s, border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
}
.reserva-card:hover {
  filter: brightness(1.08);
}

.reserva-card--selected {
  border-color: #f0a500 !important;
  box-shadow: 0 0 0 3px rgba(240, 165, 0, 0.35);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
}

.card-icon-wrap {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.18);
}

.card-selected-badge {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  color: #922b21;
  font-weight: 700;
}

.card-select-hint {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  flex-shrink: 0;
}

.card-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0 1rem 0.75rem;
}

.spec-item {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.625rem;
  padding: 0.5rem 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.spec-label {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.spec-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  word-break: break-word;
}

.spec-value--mono {
  font-family: ui-monospace, monospace;
  letter-spacing: 0.04em;
  font-size: 0.85rem;
}

.spec-value--color {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.color-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.card-price-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  margin-top: auto;
}

.vehicles-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.25rem 0;
  font-size: 0.75rem;
  font-weight: 700;
}
.vehicles-pagination--light {
  color: #64748b;
  border-top: 1px solid #f1f5f9;
}
.vehicles-pagination--dark {
  color: #9ca3af;
  border-top: 1px solid #1f2937;
}
.vehicles-pagination__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.vehicles-pagination__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.4rem 0.7rem;
  border-radius: 0.7rem;
  border: 1px solid currentColor;
  font-size: 0.72rem;
  font-weight: 800;
  transition: all 0.15s ease;
}
.vehicles-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.vehicles-pagination__btn:not(:disabled):hover {
  transform: translateY(-1px);
  color: #c0392b;
}
.vehicles-pagination__page {
  min-width: 6.5rem;
  text-align: center;
}
@media (max-width: 640px) {
  .card-header,
  .card-identity,
  .card-price-bar {
    flex-direction: column;
  }
  .card-title {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .card-specs {
    grid-template-columns: minmax(0, 1fr);
  }
  .vehicles-pagination {
    align-items: flex-start;
    flex-direction: column;
  }
  .vehicles-pagination__actions {
    justify-content: flex-start;
  }
}
</style>
