<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.45);"
      >
        <div
          class="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          :class="isDark ? 'modal-panel-dark bg-gray-900' : 'modal-panel-light bg-white'"
          @click.stop
        >
          <div
            class="flex items-center justify-between px-6 py-5"
            :class="isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                :class="isDark ? 'bg-red-900/60' : 'bg-red-50'"
              >
                <i class="pi pi-calendar text-base" :class="isDark ? 'text-[#f0a500]' : ''" :style="!isDark ? 'color:#922b21;' : ''"></i>
              </div>
              <div>
                <p class="font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">Actualizar fechas</p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">N° {{ reserva?.id }}</p>
              </div>
            </div>
            <button
              type="button"
              :disabled="guardando"
              @click.stop.prevent="solicitarCierre"
              class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border"
              :class="isDark
                ? 'border-red-900/60 text-[#f0a500] hover:bg-red-950/50'
                : 'border-red-100 text-red-500 hover:bg-red-50'"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <div v-if="!puedeEditar" class="px-6 py-5">
            <p class="text-sm rounded-xl p-4 border" :class="isDark ? 'text-amber-300 bg-amber-950/30 border-amber-900/40' : 'text-amber-800 bg-amber-50 border-amber-200'">
              <i class="pi pi-info-circle mr-1"></i>
              Únicamente las reservas <strong>pendientes</strong> permiten actualizar sus fechas.
            </p>
            <button
              type="button"
              class="mt-4 w-full py-2.5 rounded-xl font-bold text-sm border transition-colors"
              :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
              @click.stop.prevent="solicitarCierre"
            >
              Cerrar
            </button>
          </div>

          <form v-else @submit.prevent="handleGuardar" class="px-6 py-5 space-y-4">
            <div
              class="rounded-xl p-3 text-sm space-y-1"
              :class="isDark ? 'bg-gray-800/60 text-gray-300' : 'bg-gray-50 text-gray-600'"
            >
              <p><span class="opacity-60">Cliente:</span> <strong :class="isDark ? 'text-gray-100' : 'text-gray-800'">{{ reserva?.cliente?.nombre }}</strong></p>
              <p><span class="opacity-60">Vehículo:</span> <strong :class="isDark ? 'text-gray-100' : 'text-gray-800'">{{ nombreVehiculo(reserva?.vehiculo) }}</strong> · {{ reserva?.vehiculo?.placa }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Fecha inicio</label>
                <input
                  v-model="form.fecha_inicio"
                  type="date"
                  :min="manana"
                  class="field-input w-full"
                  :class="errors.fecha_inicio ? 'error' : ''"
                  />
                <p v-if="errors.fecha_inicio" class="field-error">{{ errors.fecha_inicio }}</p>
              </div>
              <div>
                <label class="field-label">Fecha fin</label>
                <input
                  v-model="form.fecha_fin"
                  type="date"
                  :min="form.fecha_inicio ? sumarDiasISO(form.fecha_inicio, 1) : manana"
                  class="field-input w-full"
                  :class="errors.fecha_fin ? 'error' : ''"
                />
                <p v-if="errors.fecha_fin" class="field-error">{{ errors.fecha_fin }}</p>
              </div>
            </div>

            <p class="text-xs rounded-lg p-3 border" :class="isDark ? 'text-gray-300 bg-gray-800/60 border-gray-700' : 'text-gray-600 bg-gray-50 border-gray-200'">
              Solo se modificará el periodo de esta reserva. El cliente y el vehículo permanecerán sin cambios.
            </p>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors"
                :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                :disabled="guardando"
                @click.stop.prevent="solicitarCierre"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style="background:#922b21;"
                :disabled="guardando"
              >
                <i v-if="guardando" class="pi pi-spin pi-spinner mr-1"></i>
                {{ guardando ? 'Actualizando...' : 'Actualizar fechas' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { nombreVehiculo, fechaHoyLocal, sumarDiasISO } from '@/utils/reservaFormatters'

const props = defineProps({
  visible: { type: Boolean, default: false },
  reserva:   { type: Object, default: null },
  guardando: { type: Boolean, default: false },
})

const emit = defineEmits(['cerrar', 'guardar'])

const { isDark } = useAppTheme()

const form = ref({
  fecha_inicio: '',
  fecha_fin: '',

})

const errors = ref({})

const hoy = computed(() => fechaHoyLocal())
const manana = computed(() => sumarDiasISO(hoy.value, 1))

const puedeEditar = computed(() => props.reserva?.estado === 'PENDIENTE')

watch(
  () => props.reserva,
  (r) => {
    if (!r) return
    form.value = {
      fecha_inicio: toInputDate(r.fecha_inicio),
      fecha_fin:    toInputDate(r.fecha_fin),

    }
    errors.value = {}
  },
  { immediate: true },
)

function toInputDate(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string' && fecha.includes('T')) return fecha.split('T')[0]
  return String(fecha).slice(0, 10)
}

function validar() {
  errors.value = {}
  if (!puedeEditar.value) return false
  if (!form.value.fecha_inicio) errors.value.fecha_inicio = 'Requerido'
  if (!form.value.fecha_fin) errors.value.fecha_fin = 'Requerido'
  if (
    form.value.fecha_inicio
    && form.value.fecha_inicio < manana.value
  ) {
    errors.value.fecha_inicio = 'La reserva debe iniciar al menos mañana'
  }
  if (form.value.fecha_inicio && form.value.fecha_fin && form.value.fecha_fin <= form.value.fecha_inicio) {
    errors.value.fecha_fin = 'Debe ser posterior al inicio'
  }
  return Object.keys(errors.value).length === 0
}

function handleGuardar() {
  if (props.guardando || !puedeEditar.value || !validar()) return
  emit('guardar', {
    fecha_inicio: form.value.fecha_inicio,
    fecha_fin:    form.value.fecha_fin,
  })
}

function solicitarCierre() {
  if (!props.guardando) emit('cerrar')
}
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
}
.modal-panel-light .field-label { color: #4b5563; }
.modal-panel-dark .field-label { color: #9ca3af; }

.field-input {
  padding: 0.65rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.modal-panel-light .field-input {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #1f2937;
}
.modal-panel-light .field-input:focus { border-color: #922b21; background: #fff; }
.modal-panel-light .field-input.error { border-color: #f87171; }

.modal-panel-dark .field-input {
  border: 1px solid #4b5563;
  background: #1f2937;
  color: #f3f4f6;
}
.modal-panel-dark .field-input:focus { border-color: #922b21; }
.modal-panel-dark .field-input.error { border-color: #f87171; }

.field-error { font-size: 0.75rem; color: #922b21; margin-top: 0.25rem; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

