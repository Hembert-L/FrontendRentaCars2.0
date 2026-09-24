<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="veh-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
        @click.self.stop="$emit('cerrar')"
      >
        <div class="veh-modal-shell w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden" @click.stop>
          <!-- Header -->
          <div class="veh-modal-header flex items-start justify-between gap-3 px-5 py-4 sm:px-6">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f0a500]/90">Flota RentaCar</p>
              <h2 class="text-lg sm:text-xl font-extrabold text-white leading-tight">
                {{ modoEdicion ? 'Editar vehículo' : 'Alta de vehículo' }}
              </h2>
            </div>
            <button type="button" class="veh-close-btn" @click.stop.prevent="$emit('cerrar')">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="veh-modal-body flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
            <!-- Preview lateral -->
            <aside class="veh-preview hidden md:flex flex-col justify-between p-5 w-[260px] flex-shrink-0">
              <div>
                <div class="veh-plate">
                  <span class="veh-plate-label">El Salvador</span>
                  <span class="veh-plate-num">{{ form.placa.trim().toUpperCase() || 'P-000000' }}</span>
                </div>

                <div class="mt-5 flex items-center gap-3">
                  <div class="veh-preview-icon">
                    <i class="pi pi-car text-xl text-white"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-white font-extrabold text-sm truncate">{{ previewNombre }}</p>
                    <p class="text-white/60 text-xs">{{ form.anio || '—' }} · {{ form.color || 'Sin color' }}</p>
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap gap-1.5">
                  <span v-if="previewCategoria" class="veh-chip">{{ previewCategoria }}</span>
                  <span v-if="previewPropietario" class="veh-chip veh-chip--gold">{{ previewPropietario }}</span>
                  <span class="veh-chip" :class="'veh-chip--' + (form.estado || 'DISPONIBLE').replace(/\s/g, '_')">
                    {{ labelEstado(form.estado) }}
                  </span>
                </div>
              </div>

              <div v-if="previewPrecio" class="veh-price-tag">
                <span class="text-[10px] uppercase tracking-wider text-white/70">Tarifa diaria</span>
                <span class="text-2xl font-extrabold text-[#f0a500]">${{ previewPrecio }}</span>
              </div>
            </aside>

            <!-- Formulario -->
            <div class="veh-form-area flex-1 flex flex-col min-h-0" :class="isDark ? 'veh-form-area--dark' : 'veh-form-area--light'">
              <!-- Steps -->
              <div class="flex gap-2 px-5 pt-4 pb-2 flex-shrink-0">
                <button
                  v-for="s in pasos"
                  :key="s.id"
                  type="button"
                  class="veh-step flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                  :class="paso === s.id ? 'veh-step--active' : 'veh-step--idle'"
                  @click="paso = s.id"
                >
                  <i :class="['pi', s.icon, 'text-[11px]']"></i>
                  {{ s.label }}
                </button>
              </div>

              <form class="flex-1 overflow-y-auto px-5 pb-4 space-y-4" @submit.prevent="handleGuardar">
                <!-- Paso 1 -->
                <div v-show="paso === 1" class="space-y-4 animate-fade">
                  <p class="veh-section-title"><i class="pi pi-id-card"></i> Identificación</p>

                  <div class="grid grid-cols-1 sm:grid-cols-[1fr_100px_140px] gap-3">
                    <div class="veh-field">
                      <label>Placa</label>
                      <input
                        v-model="form.placa"
                        type="text"
                        maxlength="20"
                        class="veh-input veh-input--plate"
                        :class="{ 'veh-input--error': errors.placa }"
                        placeholder="P123456"
                        @input="form.placa = form.placa.toUpperCase()"
                      />
                      <p v-if="errors.placa" class="veh-error">{{ errors.placa }}</p>
                    </div>
                    <div class="veh-field">
                      <label>Año</label>
                      <input
                        v-model="form.anio"
                        type="number"
                        :min="ANIO_MIN"
                        :max="ANIO_MAX"
                        class="veh-input"
                        :class="{ 'veh-input--error': errors.anio }"
                      />
                      <p v-if="errors.anio" class="veh-error">{{ errors.anio }}</p>
                    </div>
                    <div class="veh-field">
                      <label>Pasajeros</label>
                      <input
                        v-model="form.capacidad_pasajeros"
                        type="number"
                        min="1"
                        max="255"
                        class="veh-input"
                        :class="{ 'veh-input--error': errors.capacidad_pasajeros }"
                      />
                      <p v-if="errors.capacidad_pasajeros" class="veh-error">{{ errors.capacidad_pasajeros }}</p>
                    </div>
                  </div>

                  <div class="veh-field">
                    <label>Color</label>
                    <div class="flex flex-wrap gap-2 mb-2">
                      <button
                        v-for="c in coloresRapidos"
                        :key="c.nombre"
                        type="button"
                        class="veh-color-btn"
                        :class="{ 'veh-color-btn--active': form.color === c.nombre }"
                        :title="c.nombre"
                        @click="form.color = c.nombre"
                      >
                        <span class="veh-color-dot" :style="{ background: c.hex }"></span>
                        <span class="text-[10px] font-semibold">{{ c.nombre }}</span>
                      </button>
                    </div>
                    <select
                      v-model="form.color"
                      class="veh-input veh-input--select"
                      :class="{ 'veh-input--error': errors.color }"
                    >
                      <option value="">Seleccionar color</option>
                      <option v-for="c in coloresFormulario" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <p v-if="errors.color" class="veh-error">{{ errors.color }}</p>
                  </div>

                  <p class="veh-section-title mt-2"><i class="pi pi-sitemap"></i> Marca y modelo</p>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="veh-field">
                      <label>Marca</label>
                      <select
                        v-model="marcaId"
                        class="veh-input veh-input--select"
                        :class="{ 'veh-input--error': errors.marca_id }"
                      >
                        <option value="">Seleccionar</option>
                        <option v-for="m in marcas" :key="m.id" :value="m.id">{{ m.nombre }}</option>
                      </select>
                      <p v-if="errors.marca_id" class="veh-error">{{ errors.marca_id }}</p>
                    </div>
                    <div class="veh-field">
                      <label>Modelo</label>
                      <select
                        v-model="form.modelo_id"
                        class="veh-input veh-input--select"
                        :class="{ 'veh-input--error': errors.modelo_id }"
                        :disabled="!marcaId"
                      >
                        <option value="">Seleccionar</option>
                        <option v-for="m in modelosDisponibles" :key="m.id" :value="m.id">{{ m.nombre }}</option>
                      </select>
                      <p v-if="errors.modelo_id" class="veh-error">{{ errors.modelo_id }}</p>
                    </div>
                  </div>
                </div>

                <!-- Paso 2 -->
                <div v-show="paso === 2" class="space-y-4 animate-fade">
                  <p class="veh-section-title"><i class="pi pi-tags"></i> Clasificación</p>

                  <div class="veh-field">
                    <label>Categoría</label>
                    <p v-if="modoEdicion" class="veh-cat-hint">
                      <i class="pi pi-lock text-[10px]"></i>
                      La categoría queda fija al registrar el vehículo (ej. Sedán, SUV).
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        v-for="c in categorias"
                        :key="c.id"
                        type="button"
                        class="veh-cat-card"
                        :class="{
                          'veh-cat-card--active': form.categoria_id == c.id,
                          'veh-cat-card--locked': modoEdicion && c.id != categoriaOriginalId,
                        }"
                        :disabled="modoEdicion && c.id != categoriaOriginalId"
                        @click="seleccionarCategoria(c.id)"
                      >
                        <span class="font-bold text-sm flex items-center gap-1.5">
                          <i v-if="modoEdicion && c.id == categoriaOriginalId" class="pi pi-lock text-[10px] opacity-80"></i>
                          {{ c.nombre }}
                        </span>
                        <span class="text-xs opacity-75">${{ Number(c.precio_dia).toFixed(2) }}/día</span>
                      </button>
                    </div>
                    <p v-if="errors.categoria_id" class="veh-error">{{ errors.categoria_id }}</p>
                    <p v-if="!categorias.length" class="text-xs mt-2 opacity-60">No hay categorías. Agrégalas desde el catálogo.</p>
                  </div>

                  <div class="veh-field">
                    <label>Propietario</label>
                    <div class="veh-owner-toggle">
                      <button
                        type="button"
                        class="veh-owner-toggle-btn"
                        :class="{ 'veh-owner-toggle-btn--active': tipoPropietario === 'PROPIO' }"
                        @click="seleccionarTipoPropietario('PROPIO')"
                      >
                        <i class="pi pi-home"></i>
                        Propio
                      </button>
                      <button
                        type="button"
                        class="veh-owner-toggle-btn"
                        :class="{ 'veh-owner-toggle-btn--active': tipoPropietario === 'TERCERO' }"
                        @click="seleccionarTipoPropietario('TERCERO')"
                      >
                        <i class="pi pi-users"></i>
                        Tercero
                      </button>
                    </div>
                    <input
                      v-if="tipoPropietario === 'TERCERO'"
                      v-model="busquedaPropietario"
                      type="text"
                      class="veh-input mb-2"
                      placeholder="Buscar propietario..."
                    />
                    <select
                      v-model="form.propietario_id"
                      class="veh-input veh-input--select"
                      :class="{ 'veh-input--error': errors.propietario_id }"
                    >
                      <option value="">Seleccionar propietario</option>
                      <option v-for="p in propietariosDisponibles" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                    </select>
                    <p v-if="tipoPropietario === 'PROPIO' && !propietarioPropio" class="veh-help">
                      No hay propietario propio registrado. Agrégalo desde la pestaña Propietarios.
                    </p>
                    <p v-if="tipoPropietario === 'TERCERO' && !propietariosDisponibles.length" class="veh-help">
                      No hay propietarios de tercero disponibles con ese filtro.
                    </p>
                    <p v-if="errors.propietario_id" class="veh-error">{{ errors.propietario_id }}</p>
                  </div>

                  <div class="veh-field">
                    <label>Observaciones</label>
                    <textarea
                      v-model="form.observaciones"
                      rows="3"
                      maxlength="400"
                      class="veh-input veh-input--textarea"
                      :class="{ 'veh-input--error': errors.observaciones }"
                      placeholder="Detalles generales del vehículo, si aplica..."
                    ></textarea>
                    <p v-if="errors.observaciones" class="veh-error">{{ errors.observaciones }}</p>
                  </div>
                </div>

                <div v-if="globalError" class="veh-alert">
                  <i class="pi pi-exclamation-circle"></i>{{ globalError }}
                </div>
              </form>

              <!-- Footer -->
              <div class="veh-footer flex-shrink-0 px-5 py-4 flex gap-2 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <button type="button" class="veh-btn veh-btn--ghost flex-1" @click.stop.prevent="$emit('cerrar')">
                  Cancelar
                </button>
                <button
                  v-if="paso > 1"
                  type="button"
                  class="veh-btn veh-btn--ghost"
                  @click="paso--"
                >
                  <i class="pi pi-arrow-left"></i>
                </button>
                <button
                  v-if="paso < 2"
                  type="button"
                  class="veh-btn veh-btn--next flex-1"
                  @click="siguientePaso"
                >
                  Siguiente <i class="pi pi-arrow-right ml-1"></i>
                </button>
                <button
                  v-else
                  type="button"
                  class="veh-btn veh-btn--submit flex-1"
                  :disabled="loading"
                  @click="handleGuardar"
                >
                  <i v-if="loading" class="pi pi-spin pi-spinner"></i>
                  <i v-else :class="modoEdicion ? 'pi pi-check' : 'pi pi-car'"></i>
                  {{ loading ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Ingresar a flota' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useVehiculosStore } from '@/stores/vehiculos'
import { useAppTheme } from '@/composables/useAppTheme'
import { labelEstadoVehiculo } from '@/utils/vehiculoFormatters'

const props = defineProps({
  visible: Boolean,
  modoEdicion: Boolean,
  vehiculo: Object,
})

const emit = defineEmits(['guardar', 'cerrar'])

const { isDark } = useAppTheme()
const vehiculosStore = useVehiculosStore()
const { marcas, categorias, propietarios, modelosPorMarca } = storeToRefs(vehiculosStore)

const paso = ref(1)
const pasos = [
  { id: 1, label: 'Vehículo', icon: 'pi-car' },
  { id: 2, label: 'Clasificación', icon: 'pi-sliders-h' },
]

const coloresRapidos = [
  { nombre: 'Blanco', hex: '#f8fafc' },
  { nombre: 'Negro', hex: '#1f2937' },
  { nombre: 'Gris', hex: '#9ca3af' },
  { nombre: 'Plata', hex: '#cbd5e1' },
  { nombre: 'Rojo', hex: '#dc2626' },
  { nombre: 'Azul', hex: '#2563eb' },
  { nombre: 'Verde', hex: '#16a34a' },
  { nombre: 'Dorado', hex: '#f0a500' },
]

const ANIO_MIN = 1980
const ANIO_MAX = 2050
const loading = ref(false)
const globalError = ref('')
const marcaId = ref('')
const modelos = ref([])
const categoriaOriginalId = ref(null)
const bloquearMarcaWatch = ref(false)
const tipoPropietario = ref('TERCERO')
const busquedaPropietario = ref('')

const modelosDisponibles = computed(() => {
  if (!marcaId.value) return modelos.value
  return modelosPorMarca.value[String(marcaId.value)] ?? modelos.value
})

const coloresFormulario = computed(() => {
  const base = coloresRapidos.map((c) => c.nombre)
  if (form.color && !base.includes(form.color)) return [...base, form.color]
  return base
})

const propietarioPropio = computed(() =>
  propietarios.value.find((p) => String(p.tipo_propietario || '').toUpperCase() === 'PROPIO') || null,
)

const propietariosDisponibles = computed(() => {
  const term = busquedaPropietario.value.trim().toLowerCase()
  return propietarios.value.filter((p) => {
    const tipo = String(p.tipo_propietario || '').toUpperCase()
    const coincideTipo = tipoPropietario.value === 'PROPIO'
      ? tipo === 'PROPIO'
      : tipo !== 'PROPIO'
    if (!coincideTipo) return false
    if (!term) return true
    return [p.nombre, p.telefono, p.tipo_propietario]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term))
  })
})

const form = reactive({
  id: null,
  placa: '',
  color: '',
  anio: '',
  capacidad_pasajeros: '',
  marca_id: '',
  modelo_id: '',
  categoria_id: '',
  propietario_id: '',
  estado: 'DISPONIBLE',
  observaciones: '',
})

const errors = reactive({
  placa: '',
  color: '',
  anio: '',
  capacidad_pasajeros: '',
  modelo_id: '',
  categoria_id: '',
  propietario_id: '',
  estado: '',
  observaciones: '',
})

const previewNombre = computed(() => {
  const mod = modelosDisponibles.value.find((m) => m.id == form.modelo_id)
  const mar = marcas.value.find((m) => m.id == marcaId.value)
  if (mod && mar) return `${mar.nombre} ${mod.nombre}`
  if (mod) return mod.nombre
  if (props.modoEdicion && props.vehiculo?.modelo) {
    const m = props.vehiculo.modelo
    return [m.marca?.nombre, m.nombre].filter(Boolean).join(' ') || 'Vehículo'
  }
  return 'Vehículo nuevo'
})

const previewCategoria = computed(() =>
  categorias.value.find((c) => c.id == form.categoria_id)?.nombre
  || props.vehiculo?.categoria?.nombre
  || '',
)
const previewPropietario = computed(() =>
  propietarios.value.find((p) => p.id == form.propietario_id)?.nombre
  || props.vehiculo?.propietario?.nombre
  || '',
)
const previewPrecio = computed(() => {
  const c = categorias.value.find((cat) => cat.id == form.categoria_id)
    || (props.vehiculo?.categoria?.id == form.categoria_id ? props.vehiculo.categoria : null)
  return c ? Number(c.precio_dia).toFixed(2) : null
})

function labelEstado(e) {
  return labelEstadoVehiculo(e)
}

function seleccionarCategoria(catId) {
  if (props.modoEdicion && catId != categoriaOriginalId.value) return
  form.categoria_id = catId
}

function seleccionarTipoPropietario(tipo) {
  tipoPropietario.value = tipo
  busquedaPropietario.value = ''
  form.propietario_id = tipo === 'PROPIO' && propietarioPropio.value
    ? propietarioPropio.value.id
    : ''
}

function validarPaso1() {
  errors.placa = errors.color = errors.anio = errors.capacidad_pasajeros = errors.marca_id = errors.modelo_id = ''
  let ok = true
  const placa = form.placa.trim()
  const anio = Number(form.anio)
  const pasajeros = Number(form.capacidad_pasajeros)
  if (!placa) { errors.placa = 'La placa es obligatoria.'; ok = false }
  else if (placa.length > 20) { errors.placa = 'La placa no puede tener más de 20 caracteres.'; ok = false }
  if (!form.color.trim()) { errors.color = 'Requerido'; ok = false }
  if (!form.anio || !Number.isInteger(anio) || anio < ANIO_MIN || anio > ANIO_MAX) {
    errors.anio = `El año debe ser un número entero entre ${ANIO_MIN} y ${ANIO_MAX}.`
    ok = false
  }
  if (!form.capacidad_pasajeros || !Number.isInteger(pasajeros) || pasajeros < 1 || pasajeros > 255) {
    errors.capacidad_pasajeros = 'La capacidad debe ser un número entero entre 1 y 255.'
    ok = false
  }
  if (!marcaId.value) { errors.marca_id = 'Selecciona una marca'; ok = false }
  if (!form.modelo_id) { errors.modelo_id = 'Selecciona un modelo'; ok = false }
  return ok
}

function validarPaso2() {
  errors.categoria_id = errors.propietario_id = errors.observaciones = ''
  let ok = true
  if (!form.categoria_id) { errors.categoria_id = 'Selecciona una categoría'; ok = false }
  if (!form.propietario_id) { errors.propietario_id = 'Selecciona un propietario'; ok = false }
  if (form.observaciones && form.observaciones.length > 400) { errors.observaciones = 'Máximo 400 caracteres'; ok = false }
  return ok
}

function siguientePaso() {
  if (validarPaso1()) paso.value = 2
}

function limpiarErrores() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  globalError.value = ''
}

function aplicarErroresBackend(e) {
  const responseErrors = e?.response?.data?.errors
  if (!responseErrors || typeof responseErrors !== 'object') return false

  limpiarErrores()
  const map = {
    marca_id: 'marca_id',
    modelo_id: 'modelo_id',
    categoria_id: 'categoria_id',
    propietario_id: 'propietario_id',
    placa: 'placa',
    color: 'color',
    anio: 'anio',
    capacidad_pasajeros: 'capacidad_pasajeros',
    observaciones: 'observaciones',
  }

  Object.entries(responseErrors).forEach(([field, value]) => {
    const target = map[field]
    const message = Array.isArray(value) ? value[0] : value
    if (target && target in errors) errors[target] = message || ''
  })

  if (errors.marca_id || errors.modelo_id || errors.placa || errors.color || errors.anio || errors.capacidad_pasajeros) {
    paso.value = 1
  } else {
    paso.value = 2
  }

  const hasMappedErrors = Object.values(errors).some(Boolean)
  if (!hasMappedErrors) {
    globalError.value = e?.response?.data?.message || 'No se pudo guardar el vehículo.'
  }
  return true
}

function resetForm() {
  categoriaOriginalId.value = null
  marcaId.value = ''
  modelos.value = []
  tipoPropietario.value = propietarioPropio.value ? 'PROPIO' : 'TERCERO'
  busquedaPropietario.value = ''
  Object.assign(form, {
    id: null, placa: '', color: '', anio: '', capacidad_pasajeros: '', modelo_id: '',
    categoria_id: '', propietario_id: propietarioPropio.value?.id || '', estado: 'DISPONIBLE', observaciones: '',
  })
}

function aplicarVehiculoAlForm(vehiculo) {
  categoriaOriginalId.value = vehiculo.categoria_id || vehiculo.categoria?.id || null
  Object.assign(form, {
    id: vehiculo.id,
    placa: vehiculo.placa || '',
    color: vehiculo.color || '',
    anio: vehiculo.anio || '',
    capacidad_pasajeros: vehiculo.capacidad_pasajeros || '',
    modelo_id: vehiculo.modelo_id || '',
    categoria_id: vehiculo.categoria_id || vehiculo.categoria?.id || '',
    propietario_id: vehiculo.propietario_id || vehiculo.propietario?.id || '',
    estado: vehiculo.estado || 'DISPONIBLE',
    observaciones: vehiculo.observaciones || '',
  })
  const propietario = propietarios.value.find((p) => p.id == form.propietario_id) || vehiculo.propietario
  tipoPropietario.value = String(propietario?.tipo_propietario || '').toUpperCase() === 'PROPIO' ? 'PROPIO' : 'TERCERO'
  busquedaPropietario.value = ''
  if (vehiculo.modelo) {
    modelos.value = [{ ...vehiculo.modelo }]
  }
}

async function prepararModal() {
  paso.value = 1
  globalError.value = ''
  limpiarErrores()

  if (props.modoEdicion && props.vehiculo) {
    await vehiculosStore.fetchCatalogos()
    aplicarVehiculoAlForm(props.vehiculo)
    const mId = props.vehiculo.modelo?.marca_id || props.vehiculo.modelo?.marca?.id || ''
    const modeloId = props.vehiculo.modelo_id || ''
    if (mId) {
      bloquearMarcaWatch.value = true
      marcaId.value = mId
      bloquearMarcaWatch.value = false
    }
    vehiculosStore.fetchModelos(mId).then((lista) => {
      if (lista.length) modelos.value = lista
      if (modeloId) form.modelo_id = modeloId
    })
  } else {
    await vehiculosStore.fetchCatalogos()
    resetForm()
  }
}

watch(marcaId, async (id) => {
  if (bloquearMarcaWatch.value) return
  form.modelo_id = ''
  if (!id) {
    modelos.value = []
    return
  }
  modelos.value = await vehiculosStore.fetchModelos(id)
})

watch(propietarioPropio, (propio) => {
  if (!props.visible || props.modoEdicion || tipoPropietario.value !== 'PROPIO') return
  form.propietario_id = propio?.id || ''
})

watch(
  () => props.visible,
  (val) => {
    if (val) prepararModal()
  },
)

function handleGuardar() {
  const paso1Ok = validarPaso1()
  const paso2Ok = paso1Ok ? validarPaso2() : false
  if (!paso1Ok || !paso2Ok) {
    if (!paso1Ok) paso.value = 1
    else paso.value = 2
    return
  }
  loading.value = true
  globalError.value = ''
  const payload = {
    id: form.id,
    placa: form.placa.trim(),
    color: form.color.trim(),
    anio: Number(form.anio),
    capacidad_pasajeros: Number(form.capacidad_pasajeros),
    modelo_id: Number(form.modelo_id),
    categoria_id: Number(form.categoria_id),
    propietario_id: Number(form.propietario_id),
    observaciones: form.observaciones?.trim() || null,
  }
  emit('guardar', payload)
  loading.value = false
}

defineExpose({ aplicarErroresBackend })
</script>

<style scoped>
.veh-modal-backdrop {
  background: rgba(15, 10, 10, 0.55);
  backdrop-filter: blur(4px);
}

.veh-modal-shell {
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  background: #fff;
}

.veh-modal-header {
  background: linear-gradient(135deg, #922b21 0%, #6b2118 55%, #4a1510 100%);
  border-radius: 1.25rem 1.25rem 0 0;
}

.veh-close-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0a500;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: background 0.15s;
}
.veh-close-btn:hover { background: rgba(255, 255, 255, 0.2); }

.veh-preview {
  background: linear-gradient(180deg, #1a0a08 0%, #2d1210 100%);
  border-right: 1px solid rgba(240, 165, 0, 0.15);
}

.veh-plate {
  background: linear-gradient(180deg, #fefce8, #fde68a);
  border: 3px solid #1f2937;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.veh-plate-label {
  display: block;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #374151;
}
.veh-plate-num {
  display: block;
  font-size: 1.35rem;
  font-weight: 900;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.08em;
  color: #111827;
  margin-top: 0.15rem;
}

.veh-preview-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  background: rgba(146, 43, 33, 0.6);
  border: 1px solid rgba(240, 165, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.veh-chip {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.veh-chip--gold { color: #f0a500; border-color: rgba(240, 165, 0, 0.35); }
.veh-chip--DISPONIBLE { background: rgba(22, 101, 52, 0.35); color: #86efac; }

.veh-price-tag {
  padding-top: 1rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.15);
}

.veh-form-area--light { background: #fafafa; }
.veh-form-area--dark { background: #111827; }

.veh-step {
  border: 2px solid transparent;
  cursor: pointer;
}
.veh-step--idle {
  background: rgba(146, 43, 33, 0.06);
  color: #9ca3af;
  border-color: #e5e7eb;
}
.veh-form-area--dark .veh-step--idle {
  background: rgba(255, 255, 255, 0.04);
  border-color: #374151;
  color: #6b7280;
}
.veh-step--active {
  background: #922b21;
  color: #fff;
  border-color: #922b21;
  box-shadow: 0 2px 8px rgba(146, 43, 33, 0.35);
}

.veh-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #922b21;
}
.veh-form-area--dark .veh-section-title { color: #f0a500; }

.veh-field label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
  color: #6b7280;
}
.veh-form-area--dark .veh-field label { color: #9ca3af; }

.veh-input {
  width: 100%;
  padding: 0.7rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  color: #1f2937;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.veh-form-area--dark .veh-input {
  background: #1f2937;
  border-color: #374151;
  color: #f3f4f6;
}
.veh-input:focus {
  border-color: #922b21;
  box-shadow: 0 0 0 3px rgba(146, 43, 33, 0.12);
}
.veh-input--plate {
  font-family: ui-monospace, monospace;
  font-weight: 800;
  letter-spacing: 0.06em;
  font-size: 1rem;
}
.veh-input--select { cursor: pointer; }
.veh-input--textarea {
  min-height: 5.5rem;
  resize: vertical;
}
.veh-input--error { border-color: #f87171 !important; }
.veh-input:disabled { opacity: 0.5; cursor: not-allowed; }

.veh-error { font-size: 0.65rem; color: #c0392b; margin-top: 0.25rem; }

.veh-color-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.625rem;
  border: 2px solid #e5e7eb;
  background: #fff;
  transition: all 0.15s;
  min-width: 3.25rem;
}
.veh-form-area--dark .veh-color-btn {
  background: #1f2937;
  border-color: #374151;
  color: #d1d5db;
}
.veh-color-btn--active {
  border-color: #922b21;
  box-shadow: 0 0 0 2px rgba(146, 43, 33, 0.2);
}
.veh-color-dot {
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 9999px;
  border: 2px solid rgba(0, 0, 0, 0.12);
}

.veh-cat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.75rem 1rem;
  border-radius: 0.875rem;
  border: 2px solid #e5e7eb;
  background: #fff;
  text-align: left;
  transition: all 0.15s;
  color: #374151;
}
.veh-form-area--dark .veh-cat-card {
  background: #1f2937;
  border-color: #374151;
  color: #e5e7eb;
}
.veh-cat-card--active {
  border-color: #922b21;
  background: #fef2f2;
  box-shadow: 0 0 0 2px rgba(146, 43, 33, 0.15);
}
.veh-form-area--dark .veh-cat-card--active {
  background: rgba(146, 43, 33, 0.25);
}
.veh-cat-card--locked {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
  filter: grayscale(0.35);
}
.veh-cat-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  margin-bottom: 0.5rem;
  color: #922b21;
  font-weight: 600;
}
.veh-form-area--dark .veh-cat-hint { color: #f0a500; }

.veh-owner-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.veh-owner-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 2px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.15s;
}
.veh-form-area--dark .veh-owner-toggle-btn {
  background: #1f2937;
  border-color: #374151;
  color: #d1d5db;
}
.veh-owner-toggle-btn--active {
  border-color: #922b21;
  background: #922b21;
  color: #fff;
}
.veh-form-area--dark .veh-owner-toggle-btn--active {
  background: #922b21;
  border-color: #922b21;
  color: #fff;
}
.veh-help {
  font-size: 0.7rem;
  margin-top: 0.35rem;
  color: #6b7280;
}
.veh-form-area--dark .veh-help { color: #9ca3af; }

.veh-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  background: #fef2f2;
  color: #c0392b;
  border: 1px solid #fecaca;
}

.veh-footer { background: inherit; }

.veh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.7rem 1rem;
  border-radius: 0.875rem;
  font-size: 0.8rem;
  font-weight: 800;
  transition: all 0.15s;
  border: none;
  cursor: pointer;
}
.veh-btn--ghost {
  background: transparent;
  border: 2px solid #e5e7eb;
  color: #6b7280;
}
.veh-form-area--dark .veh-btn--ghost {
  border-color: #374151;
  color: #9ca3af;
}
.veh-btn--next {
  background: #374151;
  color: #fff;
}
.veh-btn--submit {
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  box-shadow: 0 4px 14px rgba(146, 43, 33, 0.4);
}
.veh-btn--submit:disabled { opacity: 0.55; cursor: not-allowed; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.animate-fade { animation: fadeIn 0.2s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

