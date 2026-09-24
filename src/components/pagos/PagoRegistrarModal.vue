<template>
  <Teleport to="body">
    <Transition name="pay-slide">
      <div v-if="visible" class="pay-overlay" @click.self.stop="cerrar">
        <div class="pay-modal" :class="isDark ? 'pay-modal--dark' : ''" @click.stop>
          <header class="pay-header">
            <button type="button" class="pay-close" :disabled="guardando" @click.stop.prevent="cerrar">
              <i class="pi pi-times"></i>
            </button>
            <p class="pay-kicker">Cobro de contrato</p>
            <h2>{{ contrato?.numero_contrato || 'Contrato' }}</h2>
            <p>{{ clienteNombre }}</p>
          </header>

          <section class="pay-summary">
            <div class="pay-ring-wrap">
              <svg class="pay-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(146,43,33,0.14)" stroke-width="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#922b21"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="`${pctPagado * 3.27} 327`"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="pay-ring-center">
                <strong>{{ Math.round(pctPagado) }}%</strong>
                <span>pagado</span>
              </div>
            </div>

            <div class="pay-balance">
              <span>Saldo pendiente</span>
              <strong>${{ formatPrecio(saldo) }}</strong>
              <p>Total ${{ formatPrecio(total) }} · Pagado ${{ formatPrecio(pagado) }}</p>
              <p v-if="montoExtras > 0">Incluye ${{ formatPrecio(montoExtras) }} en cargos extras.</p>
              <em :style="estadoPagoStyle(estadoPago)">{{ labelEstadoPago(estadoPago) }}</em>
            </div>
          </section>

          <form class="pay-form" @submit.prevent="guardar">
            <p v-if="resumen" class="pay-error" role="status" aria-live="polite">{{ resumen }}</p>
            <div v-if="errorRecarga" class="pay-error" role="alert">
              <p>{{ errorRecarga }} Los datos pueden estar desactualizados.</p>
              <button type="button" :disabled="guardando" @click="actualizar">Actualizar datos</button>
            </div>
            <label class="pay-field-label">Fecha del pago</label>
            <input v-model="fechaPago" :disabled="edicionBloqueada" type="datetime-local" class="pay-input" readonly/>

            <div class="pay-lines-head">
              <label class="pay-field-label">Pagos a registrar</label>
              <button v-if="puedeAgregarLinea" type="button" class="pay-add-line" :disabled="edicionBloqueada" @click="agregarLinea">
                <i class="pi pi-plus"></i>
                Otro método
              </button>
            </div>

            <div class="pay-lines">
              <div v-for="(linea, index) in lineas" :key="linea.id" class="pay-line">
                <div class="pay-line-amount">
                  <span>$</span>
                  <input
                    v-model.number="linea.monto"
                    :disabled="edicionBloqueada"
                    type="number"
                    min="0.01"
                    step="0.01"
                    :max="saldoMax"
                    @input="normalizarMonto(linea)"
                  />
                </div>
                <select v-model="linea.metodo_pago" :disabled="edicionBloqueada">
                  <option v-for="m in metodos" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
                <button
                  v-if="lineas.length > 1"
                  type="button"
                  class="pay-remove-line"
                  :disabled="edicionBloqueada"
                  title="Quitar método"
                  @click="quitarLinea(index)"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>

            <div class="pay-quick-actions">
              <button type="button" :disabled="edicionBloqueada" @click="pagarSaldoCompleto">Pagar saldo completo</button>
              <span :class="montoValido ? 'ok' : 'warn'">
                Registrando ${{ formatPrecio(totalFormulario) }} de ${{ formatPrecio(saldo) }}
              </span>
            </div>

            <p v-if="errorLocal" class="pay-error">{{ errorLocal }}</p>

            <button type="submit" class="pay-submit" :disabled="edicionBloqueada || !montoValido">
              <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"></i>
              {{ guardando ? 'Procesando...' : textoConfirmar }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import {
  formatPrecio,
  labelEstadoPago,
  montoExtrasContrato,
  montoPagadoContrato,
  totalFinalContrato,
  saldoPendienteContrato,
  toMoneyNumber,
} from '@/utils/contratoFormatters'

const props = defineProps({
  visible: { type: Boolean, default: false },
  contrato: { type: Object, default: null },
  guardando: { type: Boolean, default: false },
  resumen: { type: String, default: '' },
  errorRecarga: { type: String, default: '' },
})

const emit = defineEmits(['cerrar', 'guardar', 'actualizar'])

const { isDark } = useAppTheme()
const fechaPago = ref('')
const errorLocal = ref('')
const lineas = ref([])
let lineId = 0
const edicionBloqueada = computed(() => props.guardando || Boolean(props.errorRecarga))

const metodos = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEPOSITO', label: 'Depósito' },
]

const clienteNombre = computed(() =>
  props.contrato?.cliente?.nombre || props.contrato?.reserva?.cliente?.nombre || 'Cliente no disponible',
)
const montoExtras = computed(() => montoExtrasContrato(props.contrato))
const total = computed(() => totalFinalContrato(props.contrato))
const pagado = computed(() => montoPagadoContrato(props.contrato))
const saldo = computed(() => toMoneyNumber(saldoPendienteContrato(props.contrato)))
const pctPagado = computed(() => total.value > 0 ? Math.min(100, (pagado.value / total.value) * 100) : 0)
const estadoPago = computed(() => props.contrato?.estado_pago || 'PENDIENTE')
const totalFormulario = computed(() => toMoneyNumber(lineas.value.reduce((s, p) => s + Number(p.monto || 0), 0)))
const saldoMax = computed(() => saldo.value.toFixed(2))
const montoValido = computed(() =>
  !!props.contrato?.id && !!fechaPago.value && lineas.value.length > 0 &&
  saldo.value > 0 &&
  totalFormulario.value > 0 &&
  totalFormulario.value <= saldo.value &&
  lineas.value.every((p) => Number.isFinite(Number(p.monto)) && Number(p.monto) > 0 && metodos.some((m) => m.value === p.metodo_pago)),
)
const puedeAgregarLinea = computed(() => lineas.value.length < metodos.length && totalFormulario.value < saldo.value)
const textoConfirmar = computed(() =>
  lineas.value.length > 1
    ? `Confirmar ${lineas.value.length} pagos`
    : `Confirmar pago de $${formatPrecio(totalFormulario.value)}`,
)

watch(() => props.visible, (v) => {
  if (v) reiniciarFormulario()
})

function reiniciarFormulario() {
  if (edicionBloqueada.value) return
  errorLocal.value = ''
  fechaPago.value = fechaHoraLocalInput()
  lineId = 0
  lineas.value = [nuevaLinea(saldo.value, 'EFECTIVO')]
}

function nuevaLinea(monto = 0, metodo = 'EFECTIVO') {
  return {
    id: ++lineId,
    monto: toMoneyNumber(monto),
    metodo_pago: metodo,
  }
}

function fechaHoraLocalInput() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function fechaPagoApi() {
  return fechaPago.value ? `${fechaPago.value.replace('T', ' ')}:00` : null
}

function normalizarMonto(linea) {
  if (edicionBloqueada.value) return
  const monto = Number(linea.monto)
  if (!Number.isFinite(monto) || monto < 0) {
    linea.monto = 0
    return
  }
  if (monto > saldo.value) linea.monto = saldo.value
}

function agregarLinea() {
  if (edicionBloqueada.value || !puedeAgregarLinea.value) return
  const usados = new Set(lineas.value.map((p) => p.metodo_pago))
  const metodo = metodos.find((m) => !usados.has(m.value))?.value || 'EFECTIVO'
  const restante = toMoneyNumber(Math.max(0, saldo.value - totalFormulario.value))
  lineas.value.push(nuevaLinea(restante, metodo))
}

function quitarLinea(index) {
  if (edicionBloqueada.value) return
  lineas.value.splice(index, 1)
}

function pagarSaldoCompleto() {
  if (edicionBloqueada.value) return
  lineas.value = [nuevaLinea(saldo.value, lineas.value[0]?.metodo_pago || 'EFECTIVO')]
}

function estadoPagoStyle(estado) {
  const m = {
    PENDIENTE: 'background:#fee2e2;color:#991b1b;',
    PARCIAL: 'background:#fef3c7;color:#92400e;',
    PAGADO: 'background:#dcfce7;color:#166534;',
  }
  return m[estado] || 'background:#f3f4f6;color:#6b7280;'
}

function guardar() {
  if (edicionBloqueada.value) return
  errorLocal.value = ''
  if (!fechaPago.value) {
    errorLocal.value = 'Selecciona la fecha del pago.'
    return
  }
  if (totalFormulario.value > saldo.value) {
    errorLocal.value = 'El monto no puede superar el saldo pendiente.'
    return
  }
  if (!montoValido.value) {
    errorLocal.value = 'Revisa los montos y métodos antes de confirmar.'
    return
  }

  emit('guardar', {
    pagos: lineas.value.map((p) => ({
      monto: toMoneyNumber(p.monto),
      metodo_pago: p.metodo_pago,
      fecha_pago: fechaPagoApi(),
    })),
  })
}

function cerrar() {
  if (!props.guardando) emit('cerrar')
}

function actualizar() {
  if (!props.guardando) emit('actualizar')
}

// Solo el padre reconcilia el lote; los cambios del saldo nunca reinician estas líneas.
function actualizarPendientes(pagos) {
  lineas.value = pagos.map((pago) => ({ ...pago, id: pago.id ?? ++lineId }))
}

defineExpose({ actualizarPendientes })
</script>

<style scoped>
.pay-modal button:disabled,
.pay-modal input:disabled,
.pay-modal select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pay-modal--dark .pay-error {
  background: #450a0a;
  border-color: #7f1d1d;
  color: #fecaca;
}
.pay-error button { margin-top: 0.5rem; text-decoration: underline; }
.pay-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

@media (min-width: 640px) {
  .pay-overlay {
    align-items: center;
    padding: 1rem;
  }
}

.pay-modal {
  width: 100%;
  max-width: 520px;
  max-height: min(92vh, 760px);
  overflow-y: auto;
  background: #fff;
  color: #111827;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.22);
}

@media (min-width: 640px) {
  .pay-modal {
    border-radius: 1.25rem;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  }
}

.pay-modal--dark {
  background: #111827;
  color: #f3f4f6;
}

.pay-header {
  position: relative;
  padding: 1.25rem 1.5rem;
  color: #fff;
  background: linear-gradient(160deg, #922b21 0%, #6b2118 100%);
}

.pay-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  cursor: pointer;
}

.pay-kicker {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.75;
}

.pay-header h2 {
  margin-top: 0.2rem;
  font-family: ui-monospace, monospace;
  font-size: 1.2rem;
  font-weight: 900;
}

.pay-header p:last-child {
  font-size: 0.85rem;
  opacity: 0.82;
}

.pay-summary {
  display: flex;
  gap: 1.1rem;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.pay-modal--dark .pay-summary {
  border-color: #1f2937;
}

.pay-ring-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
}

.pay-ring {
  width: 100%;
  height: 100%;
}

.pay-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pay-ring-center strong {
  color: #922b21;
  font-size: 1.1rem;
  line-height: 1;
}

.pay-ring-center span {
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
  opacity: 0.55;
}

.pay-balance {
  min-width: 0;
}

.pay-balance > span,
.pay-field-label {
  display: block;
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
}

.pay-balance strong {
  display: block;
  color: #922b21;
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 1.1;
}

.pay-balance p {
  margin-top: 0.18rem;
  font-size: 0.74rem;
  opacity: 0.62;
}

.pay-balance em {
  display: inline-block;
  margin-top: 0.45rem;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-style: normal;
  font-weight: 800;
}

.pay-form {
  padding: 1.25rem 1.5rem 1.5rem;
}

.pay-input,
.pay-line input,
.pay-line select {
  width: 100%;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  border-radius: 0.75rem;
  padding: 0.75rem 0.9rem;
  font-size: 0.88rem;
  outline: none;
}

.pay-modal--dark .pay-input,
.pay-modal--dark .pay-line input,
.pay-modal--dark .pay-line select {
  border-color: #374151;
  background: #1f2937;
  color: #f3f4f6;
}

.pay-lines-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.pay-add-line {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #922b21;
  font-size: 0.75rem;
  font-weight: 800;
}

.pay-lines {
  display: grid;
  gap: 0.65rem;
}

.pay-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 0.8fr) auto;
  gap: 0.5rem;
  align-items: center;
}

.pay-line-amount {
  position: relative;
}

.pay-line-amount span {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #922b21;
  font-weight: 900;
}

.pay-line-amount input {
  padding-left: 1.7rem;
  font-weight: 800;
}

.pay-remove-line {
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 0.75rem;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.pay-quick-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
}

.pay-quick-actions button {
  color: #922b21;
  text-decoration: underline;
}

.pay-quick-actions .ok {
  color: #166534;
}

.pay-quick-actions .warn,
.pay-error {
  color: #991b1b;
}

.pay-error {
  margin-top: 0.75rem;
  padding: 0.65rem 0.8rem;
  border-radius: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  font-size: 0.8rem;
  font-weight: 700;
}

.pay-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.95rem;
  border-radius: 0.875rem;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #16a34a, #15803d);
  font-size: 0.9rem;
  font-weight: 900;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);
}

.pay-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pay-slide-enter-active,
.pay-slide-leave-active {
  transition: all 0.25s ease;
}

.pay-slide-enter-from,
.pay-slide-leave-to {
  opacity: 0;
}

.pay-slide-enter-from .pay-modal,
.pay-slide-leave-to .pay-modal {
  transform: translateY(24px) scale(0.98);
}
</style>

