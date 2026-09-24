<template>
  <section
    class="form-section rounded-2xl border shadow-sm p-5 sm:p-6"
    :class="isDark ? 'form-section-dark bg-gray-900 border-gray-800' : 'form-section-light bg-white border-gray-100'"
  >
    <label class="field-label">Disponibilidad del vehículo</label>
    <p class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
      Selecciona el rango de fechas para la reserva.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Fecha de inicio</label>
        <div class="relative">
          <i class="pi pi-calendar input-icon"></i>
          <input
            :value="fechaInicio"
            type="date"
            :min="minFechaInicio || hoy"
            class="field-input"
            :class="errorInicio ? 'error' : ''"
            @input="$emit('update:fechaInicio', $event.target.value); $emit('update:tipoReserva', 'ANTISIPADA'); $emit('change')"
          />
        </div>
        <p v-if="errorInicio" class="field-error">{{ errorInicio }}</p>
      </div>
      <div>
        <label class="text-xs font-semibold mb-1 block" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Fecha de fin</label>
        <div class="relative">
          <i class="pi pi-calendar input-icon"></i>
          <input
            :value="fechaFin"
            type="date"
            :min="fechaInicio ? sumarUnDia(fechaInicio) : minFechaInicio || hoy"
            class="field-input"
            :class="errorFin ? 'error' : ''"
            @input="$emit('update:fechaFin', $event.target.value); $emit('change')"
          />
        </div>
        <p v-if="errorFin" class="field-error">{{ errorFin }}</p>
      </div>
    </div>

    <div
      v-if="fechaInicio && fechaFin && !errorInicio && !errorFin"
      class="mt-4 px-3 py-2.5 rounded-xl flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4"
      :class="isDark ? 'bg-gray-800/60' : 'bg-gray-50'"
      style="border-left-color:#922b21;"
    >
      <i class="pi pi-clock text-base dias-banner-icon"></i>
      <strong class="text-sm" :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ diasReserva }} día{{ diasReserva !== 1 ? 's' : '' }}</strong>
      <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ formatFecha(fechaInicio) }} → {{ formatFecha(fechaFin) }}</span>
    </div>
  </section>
</template>

<script setup>
import { useAppTheme } from '@/composables/useAppTheme'
import { formatFecha, sumarDiasISO } from '@/utils/reservaFormatters'

defineProps({
  fechaInicio:  { type: String, default: '' },
  fechaFin:     { type: String, default: '' },
  hoy:              { type: String, required: true },
  minFechaInicio:   { type: String, default: '' },
  errorInicio:  { type: String, default: '' },
  errorFin:     { type: String, default: '' },
  diasReserva:  { type: Number, default: 0 },
  tipoReserva:  { type: String, default: 'ANTISIPADA' },
})

defineEmits(['update:fechaInicio', 'update:fechaFin', 'update:tipoReserva', 'change'])

const { isDark } = useAppTheme()

function sumarUnDia(fecha) {
  return sumarDiasISO(fecha, 1)
}
</script>

<style scoped>
.field-label { display:block; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.5rem; }
.input-icon  { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-size:0.875rem; pointer-events:none; }
.field-input { width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; border-radius:0.75rem; font-size:0.875rem; transition:all 0.15s; outline:none; }
.field-input:focus { border-color:#922b21; box-shadow:0 0 0 3px rgba(146,43,33,0.12); }
.field-error { font-size:0.75rem; color:#922b21; margin-top:0.25rem; }
.dias-banner-icon { color:#922b21; }

.form-section-light .field-label { color:#4b5563; }
.form-section-light .input-icon { color:#9ca3af; }
.form-section-light .field-input { border:1px solid #d1d5db; background:#fff; color:#1f2937; }
.form-section-light .field-input:focus { background:#fff; border-color:#922b21; }
.form-section-light .field-input.error { border-color:#f87171; background:#fef2f2; }

.form-section-dark .field-label { color:#9ca3af; }
.form-section-dark .input-icon { color:#6b7280; }
.form-section-dark .field-input { border:1px solid #4b5563; background:#1f2937; color:#f3f4f6; }
.form-section-dark .field-input:focus { background:#111827; border-color:#922b21; }
.form-section-dark .field-input.error { border-color:#f87171; background:#450a0a; }
.form-section-dark .field-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.85); }
</style>
