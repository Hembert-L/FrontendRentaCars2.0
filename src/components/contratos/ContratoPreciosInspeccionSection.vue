<template>
  <section class="form-section rounded-2xl border shadow-sm p-5 sm:p-6 space-y-5" :class="shellClass">
    <div>
      <label class="field-label">Calculadora de precios</label>
      <div class="grid grid-cols-2 gap-3 text-sm mt-3">
        <div class="stat-box" :class="isDark ? 'stat-box--dark' : 'stat-box--light'">
          <span class="stat-label">Días</span><strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ dias }}</strong>
        </div>
        <div class="stat-box" :class="isDark ? 'stat-box--dark' : 'stat-box--light'">
          <span class="stat-label">Precio/día</span><strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">${{ formatPrecio(precioDia) }}</strong>
        </div>
        <div class="stat-box" :class="isDark ? 'stat-box--dark' : 'stat-box--light'">
          <span class="stat-label">Subtotal</span><strong :class="isDark ? 'text-gray-100' : 'text-gray-900'">${{ formatPrecio(subtotal) }}</strong>
        </div>
        <div class="stat-box" :class="isDark ? 'stat-box--dark' : 'stat-box--light'">
          <span class="stat-label">Descuento</span>
          <input
            :value="descuento"
            type="number"
            min="0"
            :max="subtotal"
            step="0.01"
            class="field-input mt-1 w-full field-input--plain"
            :class="errorDescuento ? 'field-input--error' : ''"
            @input="$emit('update:descuento', Number($event.target.value) || 0)"
          />
          <span v-if="errorDescuento" class="text-[11px] font-semibold mt-1 block" style="color:#c0392b;">{{ errorDescuento }}</span>
        </div>
      </div>
      <div class="mt-4 p-4 rounded-xl text-white flex justify-between items-center" style="background:linear-gradient(135deg,#922b21,#6b2118);">
        <span class="font-bold text-sm">Total estimado</span>
        <span class="text-2xl font-extrabold">${{ formatPrecio(total) }}</span>
      </div>
    </div>

    <div>
      <label class="field-label">Inspección física (check-out)</label>
      <p class="text-xs mb-3" :class="isDark ? 'text-gray-500' : 'text-gray-500'">Nivel de combustible al entregar</p>

      <div class="fuel-panel" :class="isDark ? 'fuel-panel--dark' : 'fuel-panel--light'">
        <div class="fuel-readout">
          <div class="fuel-icon" :class="fuelLevelClass">
            <i class="pi pi-bolt"></i>
          </div>
          <div>
            <span>Nivel seleccionado</span>
            <strong>{{ nivelLabel }}</strong>
          </div>
        </div>

        <div class="fuel-track" :style="{ '--fuel-fill': `${nivelPct}%` }">
          <div class="fuel-fill"></div>
          <button
            v-for="nivel in NIVELES_COMBUSTIBLE"
            :key="nivel.value"
            type="button"
            class="fuel-point"
            :class="{ 'fuel-point--active': nivel.value === nivelCombustible }"
            :style="{ left: `${nivel.pct}%` }"
            :aria-label="`Seleccionar ${nivel.label}`"
            @click="seleccionarCombustible(nivel.value)"
          >
            <span></span>
          </button>
        </div>

        <div class="fuel-labels">
          <button
            v-for="nivel in NIVELES_COMBUSTIBLE"
            :key="`label-${nivel.value}`"
            type="button"
            :class="{ 'fuel-label--active': nivel.value === nivelCombustible }"
            @click="seleccionarCombustible(nivel.value)"
          >
            {{ nivel.label }}
          </button>
        </div>
      </div>

      <label class="field-label mt-4">Observaciones previas</label>
      <textarea
        :value="observacionesEntrega"
        rows="4"
        maxlength="500"
        class="field-input w-full resize-none field-input--plain"
        placeholder="Rayones, golpes, estado general..."
        @input="$emit('update:observacionesEntrega', $event.target.value)"
      ></textarea>
      <p class="text-[11px] text-right mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        {{ (observacionesEntrega || '').length }}/500
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { NIVELES_COMBUSTIBLE, formatPrecio, nivelCombustiblePct, errorDescuentoContrato } from '@/utils/contratoFormatters'

const props = defineProps({
  dias:                 { type: Number, default: 0 },
  precioDia:            { type: Number, default: 0 },
  descuento:            { type: Number, default: 0 },
  nivelCombustible:     { type: String, default: '1/2' },
  observacionesEntrega: { type: String, default: '' },
})

const emit = defineEmits(['update:descuento', 'update:nivelCombustible', 'update:observacionesEntrega'])

const { isDark } = useAppTheme()
const shellClass = computed(() => isDark.value ? 'form-section-dark bg-gray-900 border-gray-800' : 'form-section-light bg-white border-gray-100')
const subtotal = computed(() => props.dias * props.precioDia)
const total = computed(() => Math.max(0, subtotal.value - props.descuento))
const errorDescuento = computed(() => errorDescuentoContrato(props.descuento, subtotal.value))
const nivelPct = computed(() => nivelCombustiblePct(props.nivelCombustible))
const nivelLabel = computed(() => NIVELES_COMBUSTIBLE.find((n) => n.value === props.nivelCombustible)?.label || props.nivelCombustible)
const fuelLevelClass = computed(() => {
  if (nivelPct.value <= 25) return 'fuel-icon--low'
  if (nivelPct.value <= 75) return 'fuel-icon--mid'
  return 'fuel-icon--full'
})

function seleccionarCombustible(value) {
  emit('update:nivelCombustible', value)
}
</script>

<style scoped>
.field-label { display:block; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.5rem; }
.field-input { padding:0.65rem 0.75rem; border-radius:0.75rem; font-size:0.875rem; outline:none; }
.field-input--plain { padding-left:0.75rem; }
.field-input--error { border-color:#c0392b !important; }
.stat-box { padding:0.75rem; border-radius:0.75rem; border:1px solid; }
.stat-box--light { border-color:#d9dee7; background:#f8fafc; }
.stat-box--dark { border-color:#374151; background:#1f2937; }
.stat-label { display:block; font-size:0.65rem; opacity:0.72; text-transform:uppercase; margin-bottom:0.25rem; }
.form-section-light .field-label { color:#4b5563; }
.form-section-light .field-input { border:1px solid #cfd6e1; background:#f8fafc; color:#1f2937; }
.form-section-dark .field-label { color:#9ca3af; }
.form-section-dark .field-input { border:1px solid #4b5563; background:#1f2937; color:#f3f4f6; }

.fuel-panel {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid;
  padding: 1rem;
}

.fuel-panel--light {
  border-color: #d6dde8;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.fuel-panel--dark {
  border-color: #374151;
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
}

.fuel-readout {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.fuel-readout span {
  display: block;
  color: #6b7280;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fuel-readout strong {
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
}

.fuel-panel--dark .fuel-readout strong {
  color: #f9fafb;
}

.fuel-icon {
  width: 2.35rem;
  height: 2.35rem;
  display: grid;
  place-items: center;
  border-radius: 0.85rem;
  color: #fff;
  box-shadow: 0 10px 22px rgba(245, 158, 11, 0.22);
}

.fuel-icon--low { background: linear-gradient(135deg, #dc2626, #f97316); }
.fuel-icon--mid { background: linear-gradient(135deg, #f97316, #f59e0b); }
.fuel-icon--full { background: linear-gradient(135deg, #f59e0b, #facc15); color: #5f3100; }

.fuel-track {
  --fuel-fill: 50%;
  position: relative;
  height: 0.9rem;
  margin: 0.45rem 0.55rem 1rem;
  border-radius: 999px;
  background: #e5e7eb;
  box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.16);
}

.fuel-panel--dark .fuel-track {
  background: #374151;
}

.fuel-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--fuel-fill);
  border-radius: inherit;
  background: linear-gradient(90deg, #dc2626 0%, #f97316 35%, #f59e0b 68%, #facc15 100%);
  box-shadow: 0 0 18px rgba(249, 115, 22, 0.35);
  transition: width 0.2s ease;
}

.fuel-point {
  position: absolute;
  top: 50%;
  width: 1.45rem;
  height: 1.45rem;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 2px solid #fff;
  background: #cbd5e1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.fuel-point span {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: inherit;
  background: #fff;
}

.fuel-point:hover,
.fuel-point--active {
  transform: translate(-50%, -50%) scale(1.12);
  background: #f59e0b;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45);
}

.fuel-point--active {
  outline: 3px solid rgba(245, 158, 11, 0.18);
}

.fuel-labels {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
}

.fuel-labels button {
  min-height: 2.05rem;
  border-radius: 999px;
  color: #64748b;
  background: rgba(148, 163, 184, 0.12);
  font-size: 0.7rem;
  font-weight: 800;
  transition: all 0.15s ease;
}

.fuel-labels button:hover,
.fuel-labels .fuel-label--active {
  color: #78350f;
  background: #fef3c7;
}

.fuel-panel--dark .fuel-labels button {
  color: #cbd5e1;
  background: rgba(55, 65, 81, 0.8);
}

.fuel-panel--dark .fuel-labels button:hover,
.fuel-panel--dark .fuel-labels .fuel-label--active {
  color: #fef3c7;
  background: rgba(146, 64, 14, 0.72);
}
</style>