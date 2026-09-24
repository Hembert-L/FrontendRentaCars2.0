<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.45);"
        @click.self.stop="$emit('cerrar')"
      >
        <div
          class="rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          :class="isDark ? 'modal-panel-dark bg-gray-900' : 'modal-panel-light bg-white'"
          @click.stop
        >
          <div
            class="flex items-center justify-between px-6 py-5"
            :class="isDark ? 'border-b border-gray-800' : 'border-b border-gray-200'"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                :class="isDark ? 'bg-red-900/60' : 'bg-red-50'"
              >
                <i class="pi pi-user text-base" :class="isDark ? 'text-[#f0a500]' : ''" :style="!isDark ? 'color:#c0392b;' : ''"></i>
              </div>
              <div>
                <p class="font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ modoEdicion ? 'Editar cliente' : 'Nuevo cliente' }}</p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">{{ modoEdicion ? 'Actualiza los datos del cliente' : 'Completa la información del cliente' }}</p>
              </div>
            </div>
            <button
              type="button"
              @click.stop.prevent="$emit('cerrar')"
              class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border"
              :class="isDark
                ? 'border-red-900/60 text-[#f0a500] hover:bg-red-950/50 hover:border-red-800'
                : 'border-red-100 text-red-500 hover:bg-red-50'"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <form @submit.prevent="handleGuardar" class="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
            <div>
              <label class="field-label">Nombre completo</label>
              <div class="relative">
                <i class="pi pi-user input-icon"></i>
                <input v-model.trim="form.nombre" type="text" class="field-input" :class="errors.nombre ? 'error' : ''" autocomplete="name" @blur="normalizarNombreEnFormulario" />
              </div>
              <p v-if="errors.nombre" class="field-error">{{ errors.nombre }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label">DUI</label>
                <div class="relative">
                  <i class="pi pi-id-card input-icon"></i>
                  <input
                    :value="form.dui"
                    type="text"
                    inputmode="numeric"
                    placeholder="00000000-0"
                    maxlength="10"
                    class="field-input"
                    :class="errors.dui ? 'error' : ''"
                    @input="onDuiInput"
                  />
                </div>
                <p v-if="errors.dui" class="field-error">{{ errors.dui }}</p>
              </div>
              <div>
                <label class="field-label">Vencimiento de DUI</label>
                <div class="relative">
                  <i class="pi pi-calendar input-icon"></i>
                  <input
                    v-model="form.vencimiento_dui"
                    type="date"
                    :min="fechaMinimaDui"
                    class="field-input"
                    :class="errors.vencimiento_dui ? 'error' : ''"
                  />
                </div>
                <p v-if="errors.vencimiento_dui" class="field-error">{{ errors.vencimiento_dui }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label">Número de licencia</label>
                <div class="relative">
                  <i class="pi pi-car input-icon"></i>
                  <input
                    v-model.trim="form.numero_licencia"
                    type="text"
                    inputmode="numeric"
                    placeholder="10000001"
                    maxlength="30"
                    class="field-input"
                    :class="errors.numero_licencia ? 'error' : ''"
                  />
                </div>
                <p v-if="errors.numero_licencia" class="field-error">{{ errors.numero_licencia }}</p>
              </div>
              <div>
                <label class="field-label">Vencimiento de licencia</label>
                <div class="relative">
                  <i class="pi pi-calendar input-icon"></i>
                  <input
                    v-model="form.vencimiento_licencia"
                    type="date"
                    :min="fechaMinimaLicencia"
                    class="field-input"
                    :class="errors.vencimiento_licencia ? 'error' : ''"
                  />
                </div>
                <p v-if="errors.vencimiento_licencia" class="field-error">{{ errors.vencimiento_licencia }}</p>
              </div>
            </div>

            <div>
              <label class="field-label">Teléfono</label>
              <TelefonoPaisInput
                v-model="form.telefono"
                v-model:pais="form.pais_telefono"
                :error="errors.telefono"
                :control-class="['field-input', errors.telefono ? 'error' : '']"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label">Departamento</label>
                <div class="relative">
                  <i class="pi pi-map-marker input-icon"></i>
                  <select
                    v-model="form.departamento_id"
                    class="field-input field-select"
                    :class="errors.departamento_id ? 'error' : ''"
                    :disabled="cargandoDepartamentos"
                  >
                    <option value="">{{ cargandoDepartamentos ? 'Cargando...' : 'Selecciona departamento' }}</option>
                    <option v-for="departamento in departamentos" :key="departamento.id" :value="String(departamento.id)">
                      {{ departamento.nombre }}
                    </option>
                  </select>
                </div>
                <p v-if="errors.departamento_id" class="field-error">{{ errors.departamento_id }}</p>
              </div>
              <div>
                <label class="field-label">Municipio</label>
                <div class="relative">
                  <i class="pi pi-map input-icon"></i>
                  <select
                    v-model="form.municipio_id"
                    class="field-input field-select"
                    :class="errors.municipio_id ? 'error' : ''"
                    :disabled="!form.departamento_id || cargandoMunicipios"
                  >
                    <option value="">{{ municipioPlaceholder }}</option>
                    <option v-for="municipio in municipios" :key="municipio.id" :value="String(municipio.id)">
                      {{ municipio.nombre }}
                    </option>
                  </select>
                </div>
                <p v-if="errors.municipio_id" class="field-error">{{ errors.municipio_id }}</p>
              </div>
            </div>

            <div
              v-if="globalError"
              class="flex items-center gap-2 p-3 rounded-xl text-sm border"
              :class="isDark ? 'bg-red-950/40 text-red-300 border-red-900/50' : ''"
              :style="!isDark ? 'background:#fef2f2; color:#c0392b; border-color:#fecaca;' : ''"
            >
              <i class="pi pi-exclamation-circle"></i>{{ globalError }}
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click.stop.prevent="$emit('cerrar')"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all"
                :class="isDark
                  ? 'border-red-800 text-red-300 hover:bg-red-950/40 hover:border-red-700'
                  : 'border-red-200 text-red-600 hover:bg-red-50'"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="guardando || cargandoDepartamentos || cargandoMunicipios"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style="background:#c0392b;"
              >
                <i v-if="guardando" class="pi pi-spin pi-spinner"></i>
                <i v-else :class="modoEdicion ? 'pi pi-check' : 'pi pi-user-plus'"></i>
                {{ guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Registrar cliente' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import TelefonoPaisInput from '@/components/common/TelefonoPaisInput.vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { useClientesStore } from '@/stores/clientes'
import {
  CODIGO_PAIS_DEFAULT,
  buscarPaisTelefono,
  detectarPaisTelefono,
  telefonoNormalizadoCompleto,
  validarTelefonoPais,
} from '@/data/paisesTelefono'

const { isDark } = useAppTheme()
const store = useClientesStore()

const props = defineProps({
  visible: Boolean,
  modoEdicion: Boolean,
  cliente: Object,
  guardando: { type: Boolean, default: false },
  serverErrors: { type: Object, default: () => ({}) },
  submitError: { type: String, default: '' },
})

const emit = defineEmits(['guardar', 'cerrar'])

const globalError = ref('')
const departamentos = ref([])
const municipios = ref([])
const cargandoDepartamentos = ref(false)
const cargandoMunicipios = ref(false)
const inicializandoFormulario = ref(false)

const form = reactive({
  id: null,
  nombre: '',
  dui: '',
  vencimiento_dui: '',
  numero_licencia: '',
  vencimiento_licencia: '',
  telefono: '',
  pais_telefono: CODIGO_PAIS_DEFAULT,
  departamento_id: '',
  municipio_id: '',
})

const errors = reactive({
  nombre: '',
  dui: '',
  vencimiento_dui: '',
  numero_licencia: '',
  vencimiento_licencia: '',
  telefono: '',
  departamento_id: '',
  municipio_id: '',
})

const fechaMinimaDui = computed(() => fechaMananaLocal())
const fechaMinimaLicencia = computed(() => fechaMananaLocal())

const municipioPlaceholder = computed(() => {
  if (!form.departamento_id) return 'Selecciona primero un departamento'
  if (cargandoMunicipios.value) return 'Cargando...'
  return 'Selecciona municipio'
})

watch(() => props.visible, async (val) => {
  if (!val) return
  resetErrors()
  inicializandoFormulario.value = true
  try {
    llenarFormulario()
    await cargarDepartamentos()
    if (form.departamento_id) await cargarMunicipios(form.departamento_id, false)
  } finally {
    inicializandoFormulario.value = false
  }
})

watch(() => form.departamento_id, async (departamentoId, previo) => {
  if (!props.visible || departamentoId === previo) return
  if (inicializandoFormulario.value) return
  form.municipio_id = ''
  municipios.value = []
  await cargarMunicipios(departamentoId, true)
})

watch(() => props.serverErrors, (serverErrors) => {
  aplicarErroresServidor(serverErrors)
}, { deep: true })

watch(() => props.submitError, (message) => {
  globalError.value = message || ''
})

function resetErrors() {
  globalError.value = ''
  Object.keys(errors).forEach(k => errors[k] = '')
}

function llenarFormulario() {
  const cliente = props.cliente || {}
  const municipio = cliente.municipio || {}

  if (props.modoEdicion && props.cliente) {
    Object.assign(form, {
      id: cliente.id,
      nombre: cliente.nombre || '',
      dui: cliente.dui || '',
      vencimiento_dui: fechaInput(cliente.vencimiento_dui),
      numero_licencia: cliente.numero_licencia || '',
      vencimiento_licencia: fechaInput(cliente.vencimiento_licencia),
      telefono: telefonoNormalizadoCompleto(cliente.telefono || '', detectarPaisTelefono(cliente.telefono || '')),
      pais_telefono: detectarPaisTelefono(cliente.telefono || '').codigo,
      departamento_id: String(cliente.departamento_id ?? municipio.departamento_id ?? municipio.departamento?.id ?? ''),
      municipio_id: String(cliente.municipio_id ?? municipio.id ?? ''),
    })
    return
  }

  Object.assign(form, {
    id: null,
    nombre: '',
    dui: '',
    vencimiento_dui: '',
    numero_licencia: '',
    vencimiento_licencia: '',
    telefono: '',
    pais_telefono: CODIGO_PAIS_DEFAULT,
    departamento_id: '',
    municipio_id: '',
  })
  municipios.value = []
}

async function cargarDepartamentos() {
  cargandoDepartamentos.value = true
  try {
    departamentos.value = await store.fetchDepartamentos()
  } catch {
    globalError.value = 'No se pudieron cargar los departamentos.'
  } finally {
    cargandoDepartamentos.value = false
  }
}

async function cargarMunicipios(departamentoId) {
  if (!departamentoId) return
  cargandoMunicipios.value = true
  try {
    municipios.value = await store.fetchMunicipios(departamentoId)
  } catch {
    globalError.value = 'No se pudieron cargar los municipios.'
  } finally {
    cargandoMunicipios.value = false
  }
}

function validar() {
  resetErrors()
  let ok = true
  form.nombre = normalizarNombre(form.nombre)
  form.numero_licencia = String(form.numero_licencia || '').trim()

  if (!form.nombre) { errors.nombre = 'El nombre es obligatorio.'; ok = false }
  else if (!nombreTieneFormatoValido(form.nombre)) {
    errors.nombre = 'El nombre solo debe contener letras, espacios, acentos, guion o apostrofo.'
    ok = false
  }
  if (!form.dui) {
    errors.dui = 'El DUI es obligatorio.'
    ok = false
  } else if (!duiTieneFormato(form.dui)) {
    errors.dui = 'El DUI debe tener el formato 12345678-9.'
    ok = false
  } else if (duiTieneDigitosRepetidos(form.dui)) {
    errors.dui = 'Ingresa un DUI real, no una secuencia repetida.'
    ok = false
  } else if (!duiValido(form.dui)) {
    errors.dui = 'El DUI no es valido. Revisa el digito final.'
    ok = false
  }
  if (!form.vencimiento_dui) {
    errors.vencimiento_dui = 'La fecha de vencimiento del DUI es obligatoria.'
    ok = false
  } else if (!fechaPosteriorAHoy(form.vencimiento_dui)) {
    errors.vencimiento_dui = 'El DUI debe vencer después de hoy.'
    ok = false
  }
  if (!form.numero_licencia) {
    errors.numero_licencia = 'El número de licencia es obligatorio.'
    ok = false
  } else if (!/^\d{1,30}$/.test(form.numero_licencia)) {
    errors.numero_licencia = 'El número de licencia solo debe contener números.'
    ok = false
  }
  if (!form.vencimiento_licencia) {
    errors.vencimiento_licencia = 'La fecha de vencimiento de la licencia es obligatoria.'
    ok = false
  } else if (!fechaPosteriorAHoy(form.vencimiento_licencia)) {
    errors.vencimiento_licencia = 'La licencia debe vencer después de hoy.'
    ok = false
  }
  const telefonoError = validarTelefonoPais(form.telefono, buscarPaisTelefono(form.pais_telefono))
  if (telefonoError) { errors.telefono = telefonoError; ok = false }
  if (!form.departamento_id) { errors.departamento_id = 'Selecciona un departamento.'; ok = false }
  if (!form.municipio_id) { errors.municipio_id = 'Selecciona un municipio.'; ok = false }
  return ok
}

function handleGuardar() {
  if (!validar()) return
  emit('guardar', {
    id: form.id,
    nombre: form.nombre.trim(),
    dui: form.dui.trim(),
    vencimiento_dui: form.vencimiento_dui,
    numero_licencia: form.numero_licencia,
    vencimiento_licencia: form.vencimiento_licencia,
    telefono: telefonoNormalizadoCompleto(form.telefono, buscarPaisTelefono(form.pais_telefono)),
    municipio_id: form.municipio_id,
  })
}

function aplicarErroresServidor(serverErrors = {}) {
  Object.keys(errors).forEach(k => errors[k] = '')
  const aliases = {
    nacimiento_dui: 'vencimiento_dui',
  }
  let primerErrorNoMapeado = ''

  Object.entries(serverErrors || {}).forEach(([field, messages]) => {
    const mensaje = Array.isArray(messages) ? messages[0] : messages
    const mappedField = aliases[field] || field
    if (mappedField in errors) {
      errors[mappedField] = mensaje
    } else if (!primerErrorNoMapeado) {
      primerErrorNoMapeado = mensaje
    }
  })

  if (primerErrorNoMapeado) globalError.value = primerErrorNoMapeado
}

function onDuiInput(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 9)
  form.dui = digits.length > 8 ? `${digits.slice(0, 8)}-${digits.slice(8)}` : digits
}

function normalizarNombre(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function normalizarNombreEnFormulario() {
  form.nombre = normalizarNombre(form.nombre)
}

function nombreTieneFormatoValido(value) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/.test(value)
}

function duiTieneFormato(value) {
  return /^\d{8}-\d$/.test(value)
}

function duiTieneDigitosRepetidos(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return /^(\d)\1{8}$/.test(digits)
}

function duiValido(value) {
  if (!duiTieneFormato(value)) return false
  const digits = value.replace('-', '').split('').map(Number)
  const factores = [9, 8, 7, 6, 5, 4, 3, 2]
  const suma = factores.reduce((total, factor, index) => total + digits[index] * factor, 0)
  const residuo = suma % 10
  const verificador = (10 - residuo) % 10
  return digits[8] === verificador
}

function fechaInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function fechaHoyLocal() {
  const hoy = new Date()
  const year = hoy.getFullYear()
  const month = String(hoy.getMonth() + 1).padStart(2, '0')
  const day = String(hoy.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fechaMananaLocal() {
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const year = manana.getFullYear()
  const month = String(manana.getMonth() + 1).padStart(2, '0')
  const day = String(manana.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fechaPosteriorAHoy(value) {
  return Boolean(value) && value > fechaHoyLocal()
}
</script>

<style scoped>
.field-label { display:block; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.375rem; }
.input-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-size:0.875rem; pointer-events:none; }
.field-input { width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; border-radius:0.75rem; font-size:0.875rem; transition:all 0.15s; outline:none; }
.field-select { appearance:auto; padding-right:0.875rem; }
.field-input:focus { border-color:#c0392b; box-shadow:0 0 0 3px rgba(192,57,43,0.1); }
.field-input:disabled { opacity:0.7; cursor:not-allowed; }
.field-error { font-size:0.7rem; color:#c0392b; margin-top:0.25rem; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.modal-panel-light .field-label { color:#4b5563; }
.modal-panel-light .input-icon { color:#c0392b; opacity:0.65; }
.modal-panel-light .field-input { border:1px solid #d1d5db; background:#f9fafb; color:#1f2937; }
.modal-panel-light .field-input:focus { background:white; }
.modal-panel-light .field-input.error { border-color:#f87171; background:#fef2f2; }

.modal-panel-dark .field-label { color:#9ca3af; }
.modal-panel-dark .input-icon { color:#f0a500; opacity:0.9; }
.modal-panel-dark .field-input { border:1px solid #4b5563; background:#1f2937; color:#f3f4f6; }
.modal-panel-dark .field-input:focus { background:#111827; }
.modal-panel-dark .field-input.error { border-color:#f87171; background:#450a0a; }
.modal-panel-dark .field-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.85); }
</style>




