<template>
  <aside
    class="resumen-panel rounded-2xl border shadow-sm flex flex-col overflow-hidden"
    :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
  >
    <!-- Cabecera -->
    <div
      class="px-5 py-4 border-b"
      :class="isDark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-100 bg-gray-50/80'"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#922b21;">
          <i class="pi pi-file-edit text-white text-base"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-sm" :class="isDark ? 'text-gray-100' : 'text-gray-900'">Resumen de reserva</p>
          <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Revisa antes de confirmar</p>
        </div>
      </div>

      <!-- Progreso -->
      <div class="mt-4">
        <div class="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-1.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          <span>Completado</span>
          <span :style="{ color: progresoPct === 100 ? '#922b21' : undefined }">{{ progresoPct }}%</span>
        </div>
        <div class="h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: progresoPct + '%', background: progresoPct === 100 ? '#922b21' : '#9ca3af' }"
          />
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-5 space-y-3 flex-1">
      <!-- Cliente -->
      <div
        class="resumen-bloque rounded-xl border p-4 transition-all"
        :class="bloqueClass(!!cliente)"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="resumen-icon" :class="iconClass(!!cliente)">
            <i class="pi pi-user text-sm"></i>
          </span>
          <span class="resumen-etiqueta">Cliente</span>
          <span v-if="cliente" class="ml-auto resumen-check"><i class="pi pi-check text-[10px]"></i></span>
        </div>

        <template v-if="cliente">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style="background:#922b21;">
              {{ initials(cliente.nombre) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-sm leading-tight truncate" :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ cliente.nombre }}</p>
              <div class="mt-2 space-y-1">
                <p class="resumen-dato" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                  <i class="pi pi-id-card text-[10px] opacity-70"></i>
                  <span>DUI</span>
                  <strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ cliente.dui }}</strong>
                </p>
                <p v-if="cliente.telefono" class="resumen-dato" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                  <i class="pi pi-phone text-[10px] opacity-70"></i>
                  <span>Tel.</span>
                  <strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ cliente.telefono }}</strong>
                </p>
              </div>
            </div>
          </div>
        </template>
        <p v-else class="resumen-vacio" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          <i class="pi pi-user-plus text-lg mb-1 block opacity-40"></i>
          Selecciona o registra un cliente
        </p>
      </div>

      <!-- Fechas -->
      <div
        class="resumen-bloque rounded-xl border p-4 transition-all"
        :class="bloqueClass(!!fechaInicio && !!fechaFin)"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="resumen-icon" :class="iconClass(!!fechaInicio && !!fechaFin)">
            <i class="pi pi-calendar text-sm"></i>
          </span>
          <span class="resumen-etiqueta">Periodo de renta</span>
          <span v-if="fechaInicio && fechaFin" class="ml-auto resumen-check"><i class="pi pi-check text-[10px]"></i></span>
        </div>

        <template v-if="fechaInicio && fechaFin">
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="resumen-fecha-caja" :class="isDark ? 'bg-gray-800/80' : 'bg-gray-50'">
              <p class="text-[10px] font-bold uppercase tracking-wide opacity-60 mb-1">Inicio</p>
              <p class="font-bold text-xs leading-snug" :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ formatFecha(fechaInicio) }}</p>
            </div>
            <div class="resumen-fecha-caja" :class="isDark ? 'bg-gray-800/80' : 'bg-gray-50'">
              <p class="text-[10px] font-bold uppercase tracking-wide opacity-60 mb-1">Fin</p>
              <p class="font-bold text-xs leading-snug" :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ formatFecha(fechaFin) }}</p>
            </div>
          </div>

        </template>
        <p v-else class="resumen-vacio" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          <i class="pi pi-calendar-plus text-lg mb-1 block opacity-40"></i>
          Define el rango de fechas
        </p>
      </div>

      <!-- Vehículo -->
      <div
        class="resumen-bloque rounded-xl border p-4 transition-all"
        :class="bloqueClass(!!vehiculo)"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="resumen-icon" :class="iconClass(!!vehiculo)">
            <i class="pi pi-car text-sm"></i>
          </span>
          <span class="resumen-etiqueta">Vehículo</span>
          <span v-if="vehiculo" class="ml-auto resumen-check"><i class="pi pi-check text-[10px]"></i></span>
        </div>

        <template v-if="vehiculo">
          <p class="font-bold text-sm mb-2" :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ nombreVehiculo(vehiculo) }}</p>
          <div class="space-y-1.5">
            <p class="resumen-dato" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
              <i class="pi pi-tag text-[10px] opacity-70"></i>
              <span>Placa</span>
              <strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ vehiculo.placa }}</strong>
            </p>
            <p v-if="vehiculo.categoria?.nombre" class="resumen-dato" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
              <i class="pi pi-th-large text-[10px] opacity-70"></i>
              <span>Categoría</span>
              <strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ vehiculo.categoria.nombre }}</strong>
            </p>
            <p v-if="vehiculo.categoria?.precio_dia" class="resumen-dato" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
              <i class="pi pi-dollar text-[10px] opacity-70"></i>
              <span>Tarifa</span>
              <strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">${{ formatPrecio(vehiculo.categoria.precio_dia) }}/día</strong>
            </p>
          </div>
        </template>
        <p v-else class="resumen-vacio" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          <i class="pi pi-car text-lg mb-1 block opacity-40"></i>
          Elige un vehículo disponible
        </p>
      </div>

      <!-- Total estimado -->
      <div
        class="rounded-xl p-4 text-white"
        :class="precioEstimado ? '' : 'opacity-50'"
        style="background: linear-gradient(135deg, #922b21 0%, #6b2118 100%);"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-white/70">Total estimado</p>
            <p class="text-2xl font-extrabold mt-0.5">
              {{ precioEstimado ? '$' + formatPrecio(precioEstimado) : '—' }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15 flex-shrink-0">
            <i class="pi pi-wallet text-xl"></i>
          </div>
        </div>
        <p v-if="precioEstimado && diasReserva" class="text-[11px] text-white/75 mt-2">
          {{ diasReserva }} día{{ diasReserva !== 1 ? 's' : '' }} × tarifa diaria
        </p>
        <p v-else class="text-[11px] text-white/60 mt-2">Se calcula al seleccionar vehículo y fechas</p>
      </div>
    </div>

    <!-- Confirmar -->
    <div class="p-4 sm:p-5 pt-0">
      <button
        type="button"
        :disabled="!puedeConfirmar || creando"
        class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        style="background:#922b21;"
        @click="$emit('confirmar')"
      >
        <i :class="creando ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"></i>
        {{ creando ? 'Guardando reserva...' : 'Confirmar reserva' }}
      </button>
      <p v-if="!puedeConfirmar" class="text-center text-[10px] mt-2" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
        Completa cliente, fechas y vehículo para continuar
      </p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { formatFecha, nombreVehiculo, formatPrecio, initials } from '@/utils/reservaFormatters'

const props = defineProps({
  cliente:         { type: Object, default: null },
  fechaInicio:     { type: String, default: '' },
  fechaFin:        { type: String, default: '' },
  vehiculo:        { type: Object, default: null },
  diasReserva:     { type: Number, default: 0 },
  tipoReserva:     { type: String, default: '—' },
  precioEstimado:  { type: Number, default: null },
  puedeConfirmar:  { type: Boolean, default: false },
  creando:         { type: Boolean, default: false },
})

defineEmits(['confirmar'])

const { isDark } = useAppTheme()

const progresoPct = computed(() => {
  let n = 0
  if (props.cliente) n += 34
  if (props.fechaInicio && props.fechaFin) n += 33
  if (props.vehiculo) n += 33
  return n
})

function bloqueClass(completo) {
  if (completo) {
    return isDark.value
      ? 'border-gray-700 bg-gray-800/30'
      : 'border-gray-200 bg-gray-50/80'
  }
  return isDark.value
    ? 'border-gray-700 bg-gray-800/20 border-dashed'
    : 'border-gray-200 bg-gray-50/50 border-dashed'
}

function iconClass(completo) {
  if (completo) return 'resumen-icon--ok'
  return 'resumen-icon--pendiente'
}
</script>

<style scoped>
.resumen-panel {
  width: 100%;
}

@media (min-width: 1024px) {
  .resumen-panel {
    height: 100%;
    max-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
}

.resumen-etiqueta {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

.resumen-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
  flex-shrink: 0;
}

.resumen-icon--ok {
  background: #922b21;
  color: white;
}

.resumen-icon--pendiente {
  background: rgba(107, 114, 128, 0.12);
  color: #9ca3af;
}

.resumen-check {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: #16a34a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resumen-dato {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  line-height: 1.3;
}

.resumen-dato span {
  opacity: 0.55;
  min-width: 2.25rem;
}

.resumen-dato strong {
  font-weight: 700;
  margin-left: auto;
  text-align: right;
}

.resumen-vacio {
  text-align: center;
  font-size: 0.75rem;
  padding: 0.5rem 0;
  opacity: 0.5;
}

.resumen-fecha-caja {
  border-radius: 0.625rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.resumen-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
}

.resumen-badge--dias {
  background: rgba(146, 43, 33, 0.12);
  color: #922b21;
}

.resumen-badge--tipo-light {
  background: #f3f4f6;
  color: #4b5563;
}

.resumen-badge--tipo-dark {
  background: #374151;
  color: #d1d5db;
}

</style>
