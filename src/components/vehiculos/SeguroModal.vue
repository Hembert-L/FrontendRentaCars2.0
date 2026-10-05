<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="seguro-backdrop fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4"
      >
        <div
          class="seguro-modal w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          :class="isDark ? 'seguro-modal--dark' : 'seguro-modal--light'"
          @click.stop
        >
          <header
            class="seguro-header flex items-center justify-between gap-3 px-5 py-4 border-b"
            :class="isDark ? 'border-gray-800' : 'border-gray-100'"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="seguro-icon-wrap">
                <i class="pi pi-shield"></i>
              </div>
              <div class="min-w-0">
                <h2
                  class="text-base sm:text-lg font-extrabold truncate"
                  :class="isDark ? 'text-gray-100' : 'text-gray-900'"
                >
                  {{ titulo }}
                </h2>
                <p
                  class="text-xs mt-0.5 truncate"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  {{ subtitulo }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="seguro-close-btn"
              title="Cerrar"
              aria-label="Cerrar modal"
              @click="cerrar"
            >
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="seguro-body min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div
              v-if="globalError"
              class="seguro-alert mb-5"
              :class="isDark ? 'seguro-alert--dark' : 'seguro-alert--light'"
              role="alert"
            >
              <i class="pi pi-exclamation-circle flex-shrink-0"></i>
              {{ globalError }}
            </div>

            <form v-if="!esVista" class="space-y-5" @submit.prevent="guardar">
              <div class="seguro-field">
                <label class="seguro-label" for="seguro-vehiculo">Vehículo</label>
                <select
                  id="seguro-vehiculo"
                  v-model="form.vehiculo_id"
                  class="seguro-control"
                  :class="inputClass(errors.vehiculo_id)"
                  :disabled="loading"
                >
                  <option value="">Seleccionar vehículo</option>
                  <option v-for="vehiculo in vehiculos" :key="vehiculo.id" :value="vehiculo.id">
                    {{ nombreVehiculo(vehiculo) }} - {{ vehiculo.placa || "Sin placa" }}
                  </option>
                </select>
                <p v-if="errors.vehiculo_id" class="seguro-error">
                  <i class="pi pi-info-circle"></i>{{ errors.vehiculo_id }}
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="seguro-field">
                  <label class="seguro-label" for="seguro-aseguradora">Aseguradora</label>
                  <input
                    id="seguro-aseguradora"
                    v-model="form.aseguradora"
                    type="text"
                    maxlength="150"
                    class="seguro-control"
                    :class="inputClass(errors.aseguradora)"
                    :disabled="loading"
                  />
                  <p v-if="errors.aseguradora" class="seguro-error">
                    <i class="pi pi-info-circle"></i>{{ errors.aseguradora }}
                  </p>
                </div>
                <div class="seguro-field">
                  <label class="seguro-label" for="seguro-poliza">Número de póliza</label>
                  <input
                    id="seguro-poliza"
                    v-model="form.numero_poliza"
                    type="text"
                    maxlength="50"
                    class="seguro-control"
                    :class="inputClass(errors.numero_poliza)"
                    :disabled="loading"
                  />
                  <p v-if="errors.numero_poliza" class="seguro-error">
                    <i class="pi pi-info-circle"></i>{{ errors.numero_poliza }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="seguro-field">
                  <label class="seguro-label" for="seguro-inicio">Fecha de inicio</label>
                  <input
                    id="seguro-inicio"
                    v-model="form.fecha_inicio"
                    type="date"
                    class="seguro-control"
                    :class="inputClass(errors.fecha_inicio)"
                    :disabled="loading"
                  />
                  <p v-if="errors.fecha_inicio" class="seguro-error">
                    <i class="pi pi-info-circle"></i>{{ errors.fecha_inicio }}
                  </p>
                </div>
                <div class="seguro-field">
                  <label class="seguro-label" for="seguro-vencimiento">Fecha de vencimiento</label>
                  <input
                    id="seguro-vencimiento"
                    v-model="form.fecha_vencimiento"
                    type="date"
                    class="seguro-control"
                    :class="inputClass(errors.fecha_vencimiento)"
                    :disabled="loading"
                  />
                  <p v-if="errors.fecha_vencimiento" class="seguro-error">
                    <i class="pi pi-info-circle"></i>{{ errors.fecha_vencimiento }}
                  </p>
                </div>
              </div>

              <div class="seguro-field">
                <label class="seguro-label" for="seguro-cobertura"
                  >Cobertura <span class="font-normal opacity-60">(opcional)</span></label
                >
                <textarea
                  id="seguro-cobertura"
                  v-model="form.cobertura"
                  rows="4"
                  class="seguro-control seguro-textarea"
                  :class="inputClass(errors.cobertura)"
                  :disabled="loading"
                  placeholder="Descripción de la cobertura"
                ></textarea>
                <p v-if="errors.cobertura" class="seguro-error">
                  <i class="pi pi-info-circle"></i>{{ errors.cobertura }}
                </p>
              </div>
            </form>

            <div v-else class="seguro-readonly space-y-5">
              <section
                class="seguro-vehicle-summary"
                :class="isDark ? 'seguro-surface--dark' : 'seguro-surface--light'"
              >
                <div class="seguro-vehicle-icon"><i class="pi pi-car"></i></div>
                <div class="min-w-0">
                  <p class="seguro-readonly-label">Vehículo asegurado</p>
                  <p
                    class="seguro-vehicle-name truncate"
                    :class="isDark ? 'text-gray-100' : 'text-gray-900'"
                  >
                    {{
                      nombreVehiculo(seguro?.vehiculo) ||
                      `Vehículo #${form.vehiculo_id || "no disponible"}`
                    }}
                  </p>
                  <p class="text-xs mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    Placa: {{ seguro?.vehiculo?.placa || "Sin placa disponible" }}
                  </p>
                </div>
              </section>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                <div class="seguro-readonly-item">
                  <span class="seguro-readonly-label">Aseguradora</span>
                  <span class="seguro-readonly-value">{{ seguro?.aseguradora || "—" }}</span>
                </div>
                <div class="seguro-readonly-item">
                  <span class="seguro-readonly-label">Número de póliza</span>
                  <span class="seguro-readonly-value break-all">{{
                    seguro?.numero_poliza || "—"
                  }}</span>
                </div>
                <div class="seguro-readonly-item">
                  <span class="seguro-readonly-label">Fecha de inicio</span>
                  <span class="seguro-readonly-value">{{ form.fecha_inicio || "—" }}</span>
                </div>
                <div class="seguro-readonly-item">
                  <span class="seguro-readonly-label">Fecha de vencimiento</span>
                  <span class="seguro-readonly-value">{{ form.fecha_vencimiento || "—" }}</span>
                </div>
                <div class="seguro-readonly-item sm:col-span-2">
                  <span class="seguro-readonly-label">Cobertura</span>
                  <span class="seguro-readonly-value whitespace-pre-line">{{
                    seguro?.cobertura || "Sin cobertura descrita"
                  }}</span>
                </div>
              </div>

              <div v-if="seguro?.estado" class="seguro-readonly-item seguro-status-row">
                <span class="seguro-readonly-label">Estado</span>
                <span class="seguro-status-badge" :class="estadoClase(seguro.estado)">{{
                  seguro.estado
                }}</span>
              </div>
            </div>
          </div>

          <div
            v-if="!esVista"
            class="seguro-footer flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
            :class="isDark ? 'seguro-footer--dark' : 'seguro-footer--light'"
          >
            <button
              type="button"
              class="seguro-btn seguro-btn--secondary"
              :disabled="loading"
              @click="cerrar"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="seguro-btn seguro-btn--primary"
              :disabled="loading"
              @click="guardar"
            >
              <i v-if="loading" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-check"></i>
              {{ mode === "edit" ? "Guardar cambios" : "Registrar seguro" }}
            </button>
          </div>
          <div
            v-else
            class="seguro-footer flex justify-end"
            :class="isDark ? 'seguro-footer--dark' : 'seguro-footer--light'"
          >
            <button type="button" class="seguro-btn seguro-btn--secondary" @click="cerrar">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useAppTheme } from "@/composables/useAppTheme";
import { nombreVehiculo } from "@/utils/vehiculoFormatters";

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: "view" },
  seguro: { type: Object, default: null },
  vehiculos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  backendErrors: { type: Object, default: () => ({}) },
  backendMessage: { type: String, default: "" },
});

const emit = defineEmits(["cerrar", "guardar"]);
const { isDark } = useAppTheme();
const errors = reactive({});
const form = reactive({
  vehiculo_id: "",
  aseguradora: "",
  numero_poliza: "",
  fecha_inicio: "",
  fecha_vencimiento: "",
  cobertura: "",
});
const globalError = ref("");
const esVista = computed(() => props.mode === "view");
const titulo = computed(
  () =>
    ({ view: "Detalle del seguro", edit: "Editar seguro", create: "Nuevo seguro" })[props.mode] ||
    "Seguro",
);
const subtitulo = computed(
  () =>
    ({
      view: "Información registrada de la póliza",
      edit: "Actualiza los datos de la póliza",
      create: "Registra la póliza asociada a un vehículo",
    })[props.mode] || "Gestiona la póliza del vehículo",
);

function fechaCalendario(value) {
  return value ? String(value).slice(0, 10) : "";
}

function limpiarErrores() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function preparar() {
  limpiarErrores();
  globalError.value = props.backendMessage || "";
  const seguro = props.seguro || {};
  form.vehiculo_id = seguro.vehiculo_id ?? seguro.vehiculo?.id ?? "";
  form.aseguradora = seguro.aseguradora ?? "";
  form.numero_poliza = seguro.numero_poliza ?? "";
  form.fecha_inicio = fechaCalendario(seguro.fecha_inicio);
  form.fecha_vencimiento = fechaCalendario(seguro.fecha_vencimiento);
  form.cobertura = seguro.cobertura ?? "";
}

watch(
  () => [props.visible, props.seguro, props.mode],
  ([visible]) => {
    if (visible) preparar();
  },
  { immediate: true },
);

watch(
  () => props.backendErrors,
  (value) => {
    limpiarErrores();
    Object.entries(value || {}).forEach(([key, messages]) => {
      errors[key] = Array.isArray(messages) ? messages[0] : messages;
    });
  },
  { deep: true },
);

function inputClass(error) {
  return error ? "error" : "";
}

function estadoClase(estado) {
  if (estado === "CANCELADO")
    return isDark.value ? "bg-red-950/50 text-red-300" : "bg-red-100 text-red-700";
  if (estado === "VENCIDO")
    return isDark.value ? "bg-amber-950/50 text-amber-300" : "bg-amber-100 text-amber-700";
  return isDark.value ? "bg-green-950/50 text-green-300" : "bg-green-100 text-green-700";
}

function validar() {
  limpiarErrores();
  globalError.value = "";
  const inicio = String(form.fecha_inicio || "");
  const vencimiento = String(form.fecha_vencimiento || "");
  if (!form.vehiculo_id) errors.vehiculo_id = "El vehículo es obligatorio.";
  if (!String(form.aseguradora).trim())
    errors.aseguradora = "El nombre de la aseguradora es obligatorio.";
  if (String(form.aseguradora).length > 150)
    errors.aseguradora = "El nombre de la aseguradora no debe exceder los 150 caracteres.";
  if (!String(form.numero_poliza).trim())
    errors.numero_poliza = "El número de póliza es obligatorio.";
  if (String(form.numero_poliza).length > 50)
    errors.numero_poliza = "El número de póliza no debe exceder los 50 caracteres.";
  if (!inicio) errors.fecha_inicio = "La fecha de inicio de la póliza es obligatoria.";
  if (!vencimiento) errors.fecha_vencimiento = "La fecha de vencimiento es obligatoria.";
  if (inicio && vencimiento && vencimiento <= inicio)
    errors.fecha_vencimiento = "La fecha de vencimiento debe ser posterior a la fecha de inicio.";
  return !Object.keys(errors).length;
}

function guardar() {
  if (!validar()) return;
  emit("guardar", {
    vehiculo_id: Number(form.vehiculo_id),
    aseguradora: String(form.aseguradora).trim(),
    numero_poliza: String(form.numero_poliza).trim(),
    fecha_inicio: form.fecha_inicio,
    fecha_vencimiento: form.fecha_vencimiento,
    cobertura: String(form.cobertura || "").trim() || null,
  });
}

function cerrar() {
  if (!props.loading) emit("cerrar");
}

defineExpose({
  aplicarErroresBackend: (value) => {
    const backendErrors = value?.response?.data?.errors || {};
    const message = value?.response?.data?.message || "";
    limpiarErrores();
    Object.entries(backendErrors).forEach(([key, messages]) => {
      errors[key] = Array.isArray(messages) ? messages[0] : messages;
    });
    globalError.value = message;
    return Object.keys(backendErrors).length > 0;
  },
});
</script>

<style scoped>
.seguro-backdrop {
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(4px);
}

.seguro-modal {
  color: #1f2937;
}

.seguro-modal--light {
  background: #ffffff;
}

.seguro-modal--dark {
  background: #111827;
  color: #e5e7eb;
}

.seguro-header {
  min-height: 4.75rem;
}

.seguro-icon-wrap {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  background: #fef2f2;
  color: #c0392b;
}

.seguro-modal--dark .seguro-icon-wrap {
  background: rgba(127, 29, 29, 0.45);
  color: #fca5a5;
}

.seguro-close-btn {
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.65rem;
  color: #9ca3af;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.seguro-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.seguro-modal--dark .seguro-close-btn:hover {
  background: #1f2937;
  color: #f3f4f6;
}

.seguro-label,
.seguro-readonly-label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.72rem;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #6b7280;
}

.seguro-modal--dark .seguro-label,
.seguro-modal--dark .seguro-readonly-label {
  color: #9ca3af;
}

.seguro-control {
  display: block;
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  padding: 0.65rem 0.8rem;
  background: #ffffff;
  color: #1f2937;
  font-size: 0.875rem;
  line-height: 1.4;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.seguro-control:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.14);
}

.seguro-control:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.seguro-modal--dark .seguro-control {
  border-color: #374151;
  background: #1f2937;
  color: #f3f4f6;
}

.seguro-modal--dark .seguro-control:focus {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.16);
}

.seguro-control.error {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.seguro-textarea {
  min-height: 6.75rem;
  resize: vertical;
}

.seguro-error {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  margin-top: 0.35rem;
  color: #b91c1c;
  font-size: 0.72rem;
  line-height: 1.35;
}

.seguro-modal--dark .seguro-error {
  color: #fca5a5;
}

.seguro-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  border: 1px solid;
  border-radius: 0.75rem;
  padding: 0.75rem 0.85rem;
  font-size: 0.82rem;
  line-height: 1.4;
}

.seguro-alert--light {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.seguro-alert--dark {
  border-color: rgba(127, 29, 29, 0.7);
  background: rgba(69, 10, 10, 0.35);
  color: #fecaca;
}

.seguro-vehicle-summary {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  border: 1px solid;
  border-radius: 0.85rem;
  padding: 0.9rem 1rem;
}

.seguro-surface--light {
  border-color: #e5e7eb;
  background: #f8fafc;
}

.seguro-surface--dark {
  border-color: #374151;
  background: rgba(31, 41, 55, 0.7);
}

.seguro-vehicle-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: #922b21;
  color: #ffffff;
}

.seguro-vehicle-name {
  font-size: 0.98rem;
  font-weight: 800;
}

.seguro-readonly-item {
  min-width: 0;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #eef2f7;
}

.seguro-modal--dark .seguro-readonly-item {
  border-color: #1f2937;
}

.seguro-readonly-value {
  display: block;
  color: #1f2937;
  font-size: 0.875rem;
  line-height: 1.45;
}

.seguro-modal--dark .seguro-readonly-value {
  color: #e5e7eb;
}

.seguro-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 0;
  padding-bottom: 0;
}

.seguro-status-row .seguro-readonly-label {
  margin-bottom: 0;
}

.seguro-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.75rem;
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 800;
}

.seguro-status-badge.bg-green-100 {
  background: #dcfce7;
  color: #166534;
}

.seguro-status-badge.bg-green-950\/50 {
  background: #14532d;
  color: #bbf7d0;
}

.seguro-status-badge.bg-amber-100 {
  background: #fef3c7;
  color: #92400e;
}

.seguro-status-badge.bg-amber-950\/50 {
  background: #713f12;
  color: #fde68a;
}

.seguro-status-badge.bg-red-100 {
  background: #fee2e2;
  color: #991b1b;
}

.seguro-status-badge.bg-red-950\/50 {
  background: #7f1d1d;
  color: #fecaca;
}

.seguro-footer {
  flex-shrink: 0;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid;
}

.seguro-footer--light {
  border-top-color: #f3f4f6;
  background: #ffffff;
}

.seguro-footer--dark {
  border-top-color: #1f2937;
  background: #111827;
}

.seguro-btn {
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.8rem;
  font-weight: 800;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.seguro-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.seguro-btn--secondary {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #4b5563;
}

.seguro-btn--secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.seguro-modal--dark .seguro-btn--secondary {
  border-color: #4b5563;
  background: #1f2937;
  color: #d1d5db;
}

.seguro-modal--dark .seguro-btn--secondary:hover:not(:disabled) {
  background: #374151;
}

.seguro-btn--primary {
  background: #c0392b;
  color: #ffffff;
}

.seguro-btn--primary:hover:not(:disabled) {
  background: #922b21;
}

@media (max-width: 640px) {
  .seguro-header {
    min-height: 4.35rem;
    padding: 0.9rem 1rem;
  }

  .seguro-body {
    padding: 1rem;
  }

  .seguro-footer {
    padding: 1rem;
  }

  .seguro-btn {
    width: 100%;
  }
}
</style>
