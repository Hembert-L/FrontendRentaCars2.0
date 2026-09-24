<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style="background: rgba(0, 0, 0, 0.45)"
        @click.self.stop="cerrar"
      >
        <div
          class="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          :class="isDark ? 'modal-panel-dark bg-gray-900' : 'modal-panel-light bg-white'"
          @click.stop
        >
          <div
            class="flex items-center justify-between px-6 py-5 border-b"
            :class="isDark ? 'border-gray-800' : 'border-gray-100'"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                :class="isDark ? 'bg-red-900/60' : 'bg-red-50'"
              >
                <i
                  class="pi pi-wrench text-base"
                  :style="isDark ? 'color:#f0a500' : 'color:#c0392b;'"
                ></i>
              </div>
              <div>
                <p class="font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
                  {{ modoEdicion ? "Editar mantenimiento" : "Nuevo mantenimiento" }}
                </p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{
                    modoEdicion
                      ? "Actualiza el servicio registrado"
                      : "Registra un mantenimiento activo para el vehículo"
                  }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg border flex items-center justify-center"
              :disabled="bloqueado"
              aria-label="Cerrar mantenimiento"
              @click.stop.prevent="cerrar"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <form
            class="px-6 py-5 max-h-[70vh] overflow-y-auto"
            @submit.prevent="handleGuardar"
          >
            <fieldset :disabled="bloqueado" class="min-w-0 space-y-4">
            <div>
              <label class="field-label">Vehículo</label>
              <div v-if="modoEdicion" class="vehicle-selected readonly">
                <i class="pi pi-car text-xs"></i>
                <span>{{ vehiculoSeleccionadoLabel || "Vehículo registrado" }}</span>
              </div>
              <div v-else class="vehicle-combobox">
                <div class="vehicle-search" :class="errors.vehiculo_id ? 'error' : ''">
                  <i class="pi pi-search vehicle-search-icon"></i>
                  <input
                    v-model="busquedaVehiculo"
                    type="text"
                    placeholder="Buscar o seleccionar vehículo..."
                    @focus="abrirListaVehiculos"
                    @input="onBuscarVehiculo"
                  />
                  <button
                    type="button"
                    class="vehicle-toggle"
                    :title="listaVehiculosAbierta ? 'Ocultar vehículos' : 'Mostrar vehículos'"
                    @click="alternarListaVehiculos"
                  >
                    <i
                      class="pi"
                      :class="listaVehiculosAbierta ? 'pi-chevron-up' : 'pi-chevron-down'"
                    ></i>
                  </button>
                </div>

                <div v-if="vehiculoSeleccionado" class="vehicle-selected">
                  <i class="pi pi-check-circle text-xs"></i>
                  <span
                    >{{ nombreVehiculo(vehiculoSeleccionado) }} -
                    {{ vehiculoSeleccionado.placa }}</span
                  >
                  <button
                    type="button"
                    title="Cambiar vehículo"
                    @click="limpiarVehiculoSeleccionado"
                  >
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>

                <div
                  v-if="listaVehiculosAbierta"
                  class="vehicle-options"
                  :class="isDark ? 'dark' : ''"
                >
                  <div v-if="vehiculosLoading" class="vehicle-option muted">
                    <i class="pi pi-spin pi-spinner text-xs"></i>
                    Buscando vehículos disponibles...
                  </div>
                  <button
                    v-for="v in vehiculosElegibles"
                    v-else
                    :key="v.id"
                    type="button"
                    class="vehicle-option"
                    :class="{ selected: Number(form.vehiculo_id) === Number(v.id) }"
                    @mousedown.prevent="seleccionarVehiculo(v)"
                  >
                    <span class="vehicle-option-title">{{ nombreVehiculo(v) }}</span>
                    <span class="vehicle-option-plate">{{ v.placa }}</span>
                  </button>
                </div>

                <p v-if="mostrarSinResultados" class="field-help">
                  No se encontraron vehículos disponibles con esa búsqueda.
                </p>
                <p v-else-if="mostrarSinDisponibles" class="field-help">
                  No hay vehículos disponibles para registrar mantenimiento.
                </p>
              </div>
              <p v-if="errors.vehiculo_id" class="field-error">{{ errors.vehiculo_id }}</p>
              <!-- <p v-if="!modoEdicion" class="field-help">
                Al registrar el mantenimiento, el vehículo pasará a estado Mantenimiento automáticamente.
              </p> -->
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Tipo</label>
                <select v-model="form.tipo_mantenimiento" class="field-input w-full">
                  <option value="PREVENTIVO">Preventivo</option>
                  <option value="CORRECTIVO">Correctivo</option>
                </select>
              </div>
              <div v-if="modoEdicion">
                <label class="field-label">Estado</label>
                <select v-model="form.estado" class="field-input w-full">
                  <option value="ACTIVO">Activo</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>

            <div v-if="modoEdicion" class="incidencia-summary">
              <p class="field-label">Incidencia vinculada</p>
              <template v-if="mantenimiento?.incidencia_id || mantenimiento?.incidencia">
                <p class="text-sm font-semibold">
                  Incidencia #{{ mantenimiento.incidencia_id || mantenimiento.incidencia.id }}
                  <template v-if="mantenimiento.incidencia"> · {{ mantenimiento.incidencia.tipo_incidencia }}</template>
                </p>
                <p class="text-sm">{{ mantenimiento.incidencia?.descripcion || 'Sin descripción' }}</p>
                <p class="field-help">{{ mantenimiento.incidencia?.estado_incidencia || 'Estado no disponible' }} · Solo lectura</p>
              </template>
              <p v-else class="field-help">Sin incidencia vinculada</p>
            </div>
            <div v-else-if="puedeVincularIncidencia">
              <label for="mantenimiento-incidencia" class="field-label">Incidencia relacionada (opcional)</label>
              <select
                id="mantenimiento-incidencia"
                v-model="incidenciaId"
                class="field-input w-full min-w-0"
                :disabled="cargandoIncidencias"
              >
                <option value="">Sin incidencia relacionada</option>
                <option v-for="incidencia in incidencias" :key="incidencia.id" :value="incidencia.id">
                  {{ etiquetaIncidencia(incidencia) }}
                </option>
              </select>
              <p v-if="cargandoIncidencias" class="field-help" role="status">Cargando incidencias...</p>
              <p v-else-if="errorIncidencias" class="field-help" role="status">{{ errorIncidencias }}</p>
              <p v-else-if="!incidencias.length" class="field-help">No hay incidencias elegibles. Puedes continuar sin vincular una.</p>
              <p v-if="incidenciaSeleccionada" class="incidencia-summary text-sm mt-2">{{ etiquetaIncidencia(incidenciaSeleccionada) }}</p>
              <p v-if="errors.incidencia_id" class="field-error">{{ errors.incidencia_id }}</p>
            </div>

            <div>
              <p v-if="!modoEdicion" class="field-help">
                La fecha se registrará automáticamente con la hora del sistema.
              </p>
              <p v-else class="field-help">Fecha registrada: {{ fechaRegistrada }}</p>
            </div>

            <div>
              <label class="field-label">Costo ($)</label>
              <input
                v-model="form.costo"
                type="number"
                min="0"
                step="0.01"
                class="field-input w-full"
                :class="errors.costo ? 'error' : ''"
              />
              <p v-if="errors.costo" class="field-error">{{ errors.costo }}</p>
            </div>

            <div>
              <label class="field-label">Lugar</label>
              <input
                v-model="form.lugar"
                type="text"
                class="field-input w-full"
                :class="errors.lugar ? 'error' : ''"
                placeholder="Taller, sucursal o lugar del servicio"
              />
              <p v-if="errors.lugar" class="field-error">{{ errors.lugar }}</p>
            </div>

            <div>
              <label class="field-label">Descripción</label>
              <textarea
                v-model="form.descripcion"
                rows="3"
                class="field-input w-full resize-none"
                placeholder="Detalle del trabajo realizado o requerido..."
              ></textarea>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm border"
                @click.stop.prevent="cerrar"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style="background: #c0392b"
                :disabled="bloqueado"
              >
                <i v-if="bloqueado" class="pi pi-spin pi-spinner mr-1"></i>
                {{ modoEdicion ? "Guardar cambios" : "Registrar" }}
              </button>
            </div>
            </fieldset>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from "vue";
import { useAppTheme } from "@/composables/useAppTheme";
import { nombreVehiculo } from "@/utils/reservaFormatters";
import api from "@/services/api";
import { fetchAllPaginated } from "@/utils/apiPagination";

const props = defineProps({
  visible: { type: Boolean, default: false },
  modoEdicion: { type: Boolean, default: false },
  mantenimiento: { type: Object, default: null },
  vehiculos: { type: Array, default: () => [] },
  vehiculosLoading: { type: Boolean, default: false },
  guardando: { type: Boolean, default: false },
});

const emit = defineEmits(["cerrar", "guardar", "buscar-vehiculos"]);

const { isDark } = useAppTheme();

const form = ref(formularioVacio());
const errors = ref({});
const busquedaVehiculo = ref("");
const listaVehiculosAbierta = ref(false);
const vehiculoSeleccionado = ref(null);
const incidenciaId = ref("");
const incidencias = ref([]);
const cargandoIncidencias = ref(false);
const errorIncidencias = ref("");
const enviando = ref(false);
const bloqueado = computed(() => props.guardando || enviando.value);
const puedeVincularIncidencia = computed(() =>
  props.visible && !props.modoEdicion && form.value.tipo_mantenimiento === "CORRECTIVO" && Boolean(form.value.vehiculo_id),
);
const incidenciaSeleccionada = computed(() => incidencias.value.find((i) => String(i.id) === String(incidenciaId.value)));
let consultaIncidencias = null;
let solicitudIncidencias = 0;
let omitirSiguienteBusqueda = false;
let buscarVehiculosTimer = null;

const fechaRegistrada = computed(() => {
  if (!props.mantenimiento?.fecha) return "sin fecha registrada";
  return String(props.mantenimiento.fecha).slice(0, 10);
});

const vehiculosElegibles = computed(() => {
  const idEdicion = props.modoEdicion ? props.mantenimiento?.vehiculo_id : null;

  return props.vehiculos.filter((v) => {
    if (idEdicion && v.id === idEdicion) return true;
    return ["DISPONIBLE", "EN PROCESO"].includes(v.estado);
  });
});

const vehiculoSeleccionadoLabel = computed(() => {
  const vehiculo = vehiculoSeleccionado.value || props.mantenimiento?.vehiculo;
  if (!vehiculo) return "";
  return `${nombreVehiculo(vehiculo)} - ${vehiculo.placa || "sin placa"}`;
});

const mostrarSinResultados = computed(
  () =>
    !props.modoEdicion &&
    !props.vehiculosLoading &&
    listaVehiculosAbierta.value &&
    busquedaVehiculo.value.trim().length > 0 &&
    vehiculosElegibles.value.length === 0,
);

const mostrarSinDisponibles = computed(
  () =>
    !props.modoEdicion &&
    !props.vehiculosLoading &&
    listaVehiculosAbierta.value &&
    busquedaVehiculo.value.trim().length === 0 &&
    vehiculosElegibles.value.length === 0,
);

watch(
  () => [props.visible, props.mantenimiento],
  () => {
    clearTimeout(buscarVehiculosTimer);
    enviando.value = false;
    if (!props.visible) return;
    omitirSiguienteBusqueda = false;
    errors.value = {};
    busquedaVehiculo.value = "";
    listaVehiculosAbierta.value = false;
    vehiculoSeleccionado.value = null;
    if (props.modoEdicion && props.mantenimiento) {
      form.value = {
        vehiculo_id: props.mantenimiento.vehiculo_id ?? "",
        tipo_mantenimiento: props.mantenimiento.tipo_mantenimiento ?? "PREVENTIVO",
        descripcion: props.mantenimiento.descripcion ?? "",
        costo: props.mantenimiento.costo ?? "",
        lugar: props.mantenimiento.lugar ?? "",
        estado: props.mantenimiento.estado ?? "ACTIVO",
      };
      vehiculoSeleccionado.value = props.mantenimiento.vehiculo || null;
    } else {
      form.value = formularioVacio();
    }
  },
);

watch(() => props.guardando, (guardando) => {
  if (!guardando) enviando.value = false;
});

watch(
  () => [props.visible, props.modoEdicion, form.value.tipo_mantenimiento, form.value.vehiculo_id],
  cargarIncidencias,
);

async function cargarIncidencias() {
  const solicitud = ++solicitudIncidencias;
  consultaIncidencias?.abort();
  consultaIncidencias = null;
  incidenciaId.value = "";
  incidencias.value = [];
  errorIncidencias.value = "";
  errors.value.incidencia_id = "";
  cargandoIncidencias.value = false;
  if (!puedeVincularIncidencia.value) return;

  const vehiculoId = form.value.vehiculo_id;
  const controller = new AbortController();
  consultaIncidencias = controller;
  cargandoIncidencias.value = true;
  try {
    const { items } = await fetchAllPaginated(
      (params) => api.get("/admin/incidencias", { params, signal: controller.signal }),
      { vehiculo_id: vehiculoId },
    );
    if (solicitud !== solicitudIncidencias || controller.signal.aborted) return;
    incidencias.value = items.filter((i) =>
      Number(i.vehiculo_id ?? i.vehiculo?.id) === Number(vehiculoId) &&
      ["REPORTADA", "EN REVISION"].includes(i.estado_incidencia),
    );
  } catch {
    if (solicitud !== solicitudIncidencias || controller.signal.aborted) return;
    errorIncidencias.value = "No se pudieron cargar las incidencias. Puedes registrar el mantenimiento sin incidencia relacionada.";
  } finally {
    if (solicitud === solicitudIncidencias) {
      cargandoIncidencias.value = false;
      consultaIncidencias = null;
    }
  }
}

function etiquetaIncidencia(incidencia) {
  const contrato = incidencia.contrato?.numero_contrato || incidencia.contrato_id || incidencia.contrato?.id;
  return `#${incidencia.id} · ${incidencia.tipo_incidencia} · ${incidencia.descripcion || "Sin descripción"} · ${incidencia.estado_incidencia}${contrato ? ` · Contrato ${contrato}` : ""}`;
}

onBeforeUnmount(() => {
  clearTimeout(buscarVehiculosTimer);
  ++solicitudIncidencias;
  consultaIncidencias?.abort();
});

watch(busquedaVehiculo, (value) => {
  if (!props.visible || props.modoEdicion || bloqueado.value) return;
  if (omitirSiguienteBusqueda) {
    omitirSiguienteBusqueda = false;
    return;
  }
  clearTimeout(buscarVehiculosTimer);
  if (form.value.vehiculo_id) {
    form.value.vehiculo_id = "";
    vehiculoSeleccionado.value = null;
  }
  if (!value.trim()) {
    listaVehiculosAbierta.value = false;
  } else {
    listaVehiculosAbierta.value = true;
  }
  buscarVehiculosTimer = setTimeout(() => {
    if (props.visible && !bloqueado.value) emit("buscar-vehiculos", value.trim());
  }, 300);
});

function formularioVacio() {
  return {
    vehiculo_id: "",
    tipo_mantenimiento: "PREVENTIVO",
    descripcion: "",
    costo: "",
    lugar: "",
    estado: "ACTIVO",
  };
}

function validar() {
  errors.value = {};
  if (!form.value.vehiculo_id) errors.value.vehiculo_id = "Selecciona un vehículo";
  else if (!props.modoEdicion && (
    String(vehiculoSeleccionado.value?.id) !== String(form.value.vehiculo_id) ||
    !["DISPONIBLE", "EN PROCESO"].includes(vehiculoSeleccionado.value?.estado)
  )) errors.value.vehiculo_id = "Selecciona un vehículo disponible o en proceso";
  if (form.value.costo === "" || Number(form.value.costo) < 0)
    errors.value.costo = "Ingresa un costo válido";
  if (!form.value.lugar?.trim()) errors.value.lugar = "Requerido";
  return Object.keys(errors.value).length === 0;
}

function abrirListaVehiculos() {
  if (props.modoEdicion || bloqueado.value) return;
  listaVehiculosAbierta.value = true;
}

function alternarListaVehiculos() {
  if (props.modoEdicion || bloqueado.value) return;
  listaVehiculosAbierta.value = !listaVehiculosAbierta.value;
}

function onBuscarVehiculo() {
  listaVehiculosAbierta.value = Boolean(busquedaVehiculo.value.trim());
}

function seleccionarVehiculo(vehiculo) {
  if (bloqueado.value || props.modoEdicion || !["DISPONIBLE", "EN PROCESO"].includes(vehiculo?.estado)) return;
  form.value.vehiculo_id = vehiculo.id;
  vehiculoSeleccionado.value = vehiculo;
  omitirSiguienteBusqueda = true;
  busquedaVehiculo.value = "";
  listaVehiculosAbierta.value = false;
  errors.value.vehiculo_id = "";
}

function limpiarVehiculoSeleccionado() {
  if (bloqueado.value) return;
  form.value.vehiculo_id = "";
  vehiculoSeleccionado.value = null;
  listaVehiculosAbierta.value = false;
}

function cerrar() {
  if (!bloqueado.value) emit("cerrar");
}

function handleGuardar() {
  if (bloqueado.value || !validar()) return;
  const payload = {
    vehiculo_id: form.value.vehiculo_id,
    tipo_mantenimiento: form.value.tipo_mantenimiento,
    descripcion: form.value.descripcion?.trim() || null,
    costo: Number(form.value.costo),
    lugar: form.value.lugar.trim(),
  };
  if (props.modoEdicion) {
    payload.estado = form.value.estado;
  } else if (puedeVincularIncidencia.value && incidenciaId.value) {
    const incidencia = incidenciaSeleccionada.value;
    if (!incidencia || Number(incidencia.vehiculo_id ?? incidencia.vehiculo?.id) !== Number(form.value.vehiculo_id)) {
      errors.value.incidencia_id = "Selecciona una incidencia válida del vehículo actual o continúa sin vinculación.";
      return;
    }
    payload.incidencia_id = incidencia.id;
  }
  enviando.value = true;
  clearTimeout(buscarVehiculosTimer);
  emit("guardar", payload);
}
</script>

<style scoped>
.incidencia-summary {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #334155;
  overflow-wrap: anywhere;
}
.modal-panel-dark .incidencia-summary {
  background: #1f2937;
  color: #e5e7eb;
}
.modal-panel-dark .field-help {
  color: #9ca3af;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.field-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
}
.modal-panel-light .field-label {
  color: #4b5563;
}
.modal-panel-dark .field-label {
  color: #9ca3af;
}
.field-input {
  padding: 0.65rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  outline: none;
  border: 1px solid #e5e7eb;
}
.modal-panel-dark .field-input {
  border-color: #4b5563;
  background: #1f2937;
  color: #f3f4f6;
}
.field-input.error {
  border-color: #f87171;
}
.field-help {
  font-size: 0.72rem;
  color: #6b7280;
  margin-top: 0.35rem;
}
.field-error {
  font-size: 0.75rem;
  color: #c0392b;
  margin-top: 0.25rem;
}
.vehicle-combobox {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.vehicle-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0 0.55rem;
  min-height: 2.85rem;
  background: #fff;
}
.modal-panel-dark .vehicle-search {
  border-color: #4b5563;
  background: #1f2937;
  color: #f3f4f6;
}
.vehicle-search.error {
  border-color: #f87171;
}
.vehicle-search-icon {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 0.8rem;
}
.vehicle-search input {
  flex: 1;
  min-width: 0;
  height: 2.7rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
}
.vehicle-toggle {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: transparent;
}
.vehicle-toggle:hover {
  background: #f1f5f9;
}
.modal-panel-dark .vehicle-toggle:hover {
  background: #374151;
}
.vehicle-options {
  border: 1px solid #e5e7eb;
  border-radius: 0.85rem;
  background: #fff;
  max-height: 13.5rem;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  padding: 0.35rem;
}
.vehicle-options.dark {
  border-color: #4b5563;
  background: #111827;
}
.vehicle-option {
  width: 100%;
  border: 0;
  border-radius: 0.65rem;
  padding: 0.65rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  text-align: left;
  background: transparent;
  color: #111827;
}
.vehicle-options.dark .vehicle-option {
  color: #f3f4f6;
}
.vehicle-option:hover,
.vehicle-option.selected {
  background: #fef2f2;
  color: #922b21;
}
.vehicle-options.dark .vehicle-option:hover,
.vehicle-options.dark .vehicle-option.selected {
  background: #3b1f1b;
  color: #fca5a5;
}
.vehicle-option.muted {
  justify-content: flex-start;
  color: #64748b;
  cursor: default;
}
.vehicle-option-title {
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vehicle-option-plate {
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 800;
  color: #64748b;
}
.vehicle-selected {
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
  padding: 0.65rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: #f0fdf4;
  color: #166534;
  font-size: 0.85rem;
  font-weight: 800;
}
.vehicle-selected.readonly {
  border-color: #e5e7eb;
  background: #f8fafc;
  color: #334155;
}
.modal-panel-dark .vehicle-selected {
  border-color: #166534;
  background: #052e16;
  color: #bbf7d0;
}
.modal-panel-dark .vehicle-selected.readonly {
  border-color: #4b5563;
  background: #1f2937;
  color: #e5e7eb;
}
.vehicle-selected span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vehicle-selected button {
  border: 0;
  background: transparent;
  color: inherit;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vehicle-selected button:hover {
  background: rgba(22, 101, 52, 0.12);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

