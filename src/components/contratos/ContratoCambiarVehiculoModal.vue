<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.45);"
        @click.self.stop="solicitarCierre"
      >
        <div
          class="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col"
          :class="isDark ? 'bg-gray-900' : 'bg-white'"
          @click.stop
        >
          <div class="flex items-center justify-between px-6 py-5 border-b" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100">
                <i class="pi pi-sync text-amber-700"></i>
              </div>
              <div>
                <p class="font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">Cambiar vehículo</p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ contrato?.numero_contrato }}</p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-50"
              :class="isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'"
              :disabled="guardando"
              @click.stop.prevent="solicitarCierre"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <form class="px-6 py-5 space-y-4 overflow-y-auto" @submit.prevent="confirmar">
            <div class="rounded-xl p-3 text-sm space-y-1" :class="isDark ? 'bg-gray-800/60 text-gray-300' : 'bg-gray-50 text-gray-600'">
              <p><span class="opacity-60">Cliente:</span> <strong>{{ contrato?.cliente?.nombre || '—' }}</strong></p>
              <p><span class="opacity-60">Vehículo actual:</span> <strong>{{ nombreVehiculo(contrato?.vehiculo) }}</strong> · {{ contrato?.vehiculo?.placa }}</p>
              <p><span class="opacity-60">Devolución acordada:</span> {{ formatFechaHora12(contrato?.fecha_hora_devolucion) }}</p>
              <p class="text-xs pt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                El precio y las fechas del contrato no cambian. El vehículo actual pasa a <strong>En proceso</strong>
                y se registra una incidencia por daño mecánico que no se cobra al cliente.
              </p>
            </div>

            <div>
              <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Vehículo de reemplazo</label>
              <div v-if="cargandoVehiculos" class="text-sm py-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                <i class="pi pi-spin pi-spinner"></i> Consultando vehículos disponibles...
              </div>
              <template v-else>
                <select v-model="form.vehiculo_nuevo_id" class="field-input" :class="claseInput(errores.vehiculo_nuevo_id)" :disabled="guardando">
                  <option value="">Seleccionar vehículo...</option>
                  <option v-for="v in vehiculos" :key="v.id" :value="v.id">
                    {{ nombreVehiculo(v) }} · {{ v.placa }}{{ v.categoria?.nombre ? ` · ${v.categoria.nombre}` : '' }}
                  </option>
                </select>
                <p v-if="errorVehiculos" class="field-error">{{ errorVehiculos }}</p>
                <p v-else-if="!vehiculos.length" class="field-error">No hay vehículos disponibles hasta la devolución acordada.</p>
              </template>
              <p v-if="errores.vehiculo_nuevo_id" class="field-error">{{ errores.vehiculo_nuevo_id }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Responsable del desperfecto</label>
                <select v-model="form.responsable_tipo" class="field-input" :class="claseInput(errores.responsable_tipo)" :disabled="guardando">
                  <option value="NEGOCIO">Negocio</option>
                  <option value="TERCERO">Tercero</option>
                </select>
                <p v-if="errores.responsable_tipo" class="field-error">{{ errores.responsable_tipo }}</p>
              </div>
              <div>
                <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Combustible del reemplazo</label>
                <select v-model="form.nivel_combustible_entrega" class="field-input" :class="claseInput(errores.nivel_combustible_entrega)" :disabled="guardando">
                  <option v-for="n in NIVELES_COMBUSTIBLE" :key="n.value" :value="n.value">{{ n.label }}</option>
                </select>
                <p v-if="errores.nivel_combustible_entrega" class="field-error">{{ errores.nivel_combustible_entrega }}</p>
              </div>
            </div>

            <div>
              <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Descripción del desperfecto</label>
              <textarea
                v-model="form.motivo"
                rows="3"
                maxlength="500"
                class="field-input resize-none"
                :class="claseInput(errores.motivo)"
                placeholder="Ej.: falla en la transmisión, el vehículo no enciende..."
                :disabled="guardando"
              ></textarea>
              <p v-if="errores.motivo" class="field-error">{{ errores.motivo }}</p>
            </div>

            <div>
              <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Costo estimado de la reparación (opcional)</label>
              <input
                v-model="form.costo"
                type="number"
                min="0"
                max="999999.99"
                step="0.01"
                class="field-input"
                :class="claseInput(errores.costo)"
                placeholder="0.00"
                :disabled="guardando"
              />
              <p v-if="errores.costo" class="field-error">{{ errores.costo }}</p>
            </div>

            <p v-if="errorServidor" class="field-error">{{ errorServidor }}</p>

            <div class="flex gap-3 pt-1">
              <button
                type="button"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm border"
                :class="isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'"
                :disabled="guardando"
                @click.stop.prevent="solicitarCierre"
              >
                Volver
              </button>
              <button
                type="submit"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                style="background:#c0392b;"
                :disabled="guardando || cargandoVehiculos || !vehiculos.length"
              >
                <i v-if="guardando" class="pi pi-spin pi-spinner mr-1"></i>
                {{ guardando ? 'Cambiando...' : 'Cambiar vehículo' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { useAppTheme } from '@/composables/useAppTheme'
import { useReservasStore } from '@/stores/reservas'
import { NIVELES_COMBUSTIBLE, normalizarNivelCombustible, nombreVehiculo, formatFechaHora12 } from '@/utils/contratoFormatters'
import { fechaHoyLocal } from '@/utils/reservaFormatters'

const props = defineProps({
  visible: { type: Boolean, default: false },
  contrato: { type: Object, default: null },
  guardando: { type: Boolean, default: false },
  // errores que devuelve el back
  erroresServidor: { type: Object, default: () => ({}) },
  errorServidor: { type: String, default: '' },
})

const emit = defineEmits(['cerrar', 'confirmar'])

const { isDark } = useAppTheme()
const reservasStore = useReservasStore()

const vehiculos = ref([])
const cargandoVehiculos = ref(false)
const errorVehiculos = ref('')
const erroresLocales = ref({})
const form = reactive({
  vehiculo_nuevo_id: '',
  responsable_tipo: 'NEGOCIO',
  nivel_combustible_entrega: '1/2',
  motivo: '',
  costo: '',
})

const errores = reactive({})
watch([erroresLocales, () => props.erroresServidor], () => {
  for (const campo of Object.keys(errores)) delete errores[campo]
  for (const [campo, msgs] of Object.entries(props.erroresServidor || {})) {
    errores[campo] = Array.isArray(msgs) ? msgs[0] : msgs
  }
  Object.assign(errores, erroresLocales.value)
}, { deep: true, immediate: true })

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    Object.assign(form, {
      vehiculo_nuevo_id: '',
      responsable_tipo: 'NEGOCIO',
      nivel_combustible_entrega: normalizarNivelCombustible(props.contrato?.nivel_combustible_entrega) || '1/2',
      motivo: '',
      costo: '',
    })
    erroresLocales.value = {}
    cargarVehiculos()
  },
)

// yyyy-mm-dd en hora local, el back manda la fecha en utc
function fechaLocal(valor) {
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function sumarDia(fechaIso) {
  const d = new Date(`${fechaIso}T00:00:00`)
  d.setDate(d.getDate() + 1)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

async function cargarVehiculos() {
  cargandoVehiculos.value = true
  errorVehiculos.value = ''
  vehiculos.value = []
  try {
    // disponibles desde hoy hasta la devolucion
    const hoy = fechaHoyLocal()
    const devolucion = fechaLocal(props.contrato?.fecha_hora_devolucion)
    const fin = devolucion > hoy ? devolucion : sumarDia(hoy)
    const lista = await reservasStore.fetchVehiculosDisponibles(hoy, fin)
    const actualId = Number(props.contrato?.vehiculo_id ?? props.contrato?.vehiculo?.id)
    vehiculos.value = lista.filter((v) => Number(v.id) !== actualId)
  } catch (e) {
    errorVehiculos.value = e.response?.data?.message || 'No se pudieron consultar los vehículos disponibles.'
  } finally {
    cargandoVehiculos.value = false
  }
}

function claseInput(error) {
  return [isDark.value ? 'field-input--dark' : '', error ? 'error' : '']
}

function validar() {
  const e = {}
  if (!form.vehiculo_nuevo_id) e.vehiculo_nuevo_id = 'Debe seleccionar el vehículo de reemplazo.'
  if (!form.motivo.trim()) e.motivo = 'Debe describir el desperfecto del vehículo.'
  if (form.costo !== '' && form.costo !== null) {
    const costo = Number(form.costo)
    if (!Number.isFinite(costo) || costo < 0 || costo > 999999.99) e.costo = 'El costo debe estar entre 0 y 999,999.99.'
  }
  erroresLocales.value = e
  return !Object.keys(e).length
}

async function confirmar() {
  if (props.guardando || !validar()) return
  const vehiculo = vehiculos.value.find((v) => Number(v.id) === Number(form.vehiculo_nuevo_id))
  const { isConfirmed } = await Swal.fire({
    icon: 'warning',
    title: '¿Cambiar el vehículo del contrato?',
    text: `El contrato pasará a ${nombreVehiculo(vehiculo)} (${vehiculo?.placa}) y ${props.contrato?.vehiculo?.placa || 'el vehículo actual'} quedará En proceso.`,
    showCancelButton: true,
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'Volver',
    confirmButtonColor: '#c0392b',
    cancelButtonColor: isDark.value ? '#4b5563' : '#6b7280',
    reverseButtons: true,
    background: isDark.value ? '#111827' : '#fff',
    color: isDark.value ? '#f3f4f6' : '#111827',
  })
  if (!isConfirmed) return
  emit('confirmar', {
    vehiculo_nuevo_id: Number(form.vehiculo_nuevo_id),
    responsable_tipo: form.responsable_tipo,
    nivel_combustible_entrega: form.nivel_combustible_entrega,
    motivo: form.motivo.trim(),
    costo: form.costo === '' || form.costo === null ? null : Number(form.costo),
  })
}

function solicitarCierre() {
  if (!props.guardando) emit('cerrar')
}
</script>

<style scoped>
.field-label { display:block; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.5rem; }
.field-input { padding:0.75rem 1rem; border-radius:0.75rem; font-size:0.875rem; outline:none; border:1px solid #e5e7eb; width:100%; background:#fff; color:#111827; }
.field-input--dark { background:#1f2937; border-color:#374151; color:#f3f4f6; }
.field-input.error { border-color:#f87171; }
.field-error { font-size:0.75rem; color:#c0392b; margin-top:0.25rem; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
