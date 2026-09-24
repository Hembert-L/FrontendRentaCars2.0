<template>
  <section
    class="form-section rounded-2xl border shadow-sm p-5 sm:p-6"
    :class="isDark ? 'form-section-dark bg-gray-900 border-gray-800' : 'form-section-light bg-white border-gray-100'"
  >
    <div class="flex items-center justify-between gap-3 mb-3">
      <h2 class="field-label mb-0">Cliente</h2>
      <button type="button" class="new-client-btn" @click="$emit('agregar-nuevo')">
        <i class="pi pi-user-plus" aria-hidden="true"></i>
        Nuevo cliente
      </button>
    </div>

    <div class="relative">
      <i class="pi pi-search input-icon"></i>
      <input
        :value="busqueda"
        type="search"
        placeholder="Buscar por nombre, DUI o teléfono"
        class="field-input"
        @input="$emit('update:busqueda', $event.target.value); $emit('buscar')"
      />
    </div>

    <div class="client-list-shell mt-3">
      <div v-if="buscando" class="client-state" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <i class="pi pi-spin pi-spinner"></i>
        Cargando clientes...
      </div>

      <div v-else-if="error" class="client-state text-red-600" role="alert">
        <i class="pi pi-exclamation-circle"></i>
        {{ error }}
      </div>

      <div v-else-if="resultados.length" class="client-list" role="listbox" aria-label="Clientes">
        <button
          v-for="cliente in resultados"
          :key="cliente.id"
          type="button"
          class="client-row"
          :class="{ 'client-row--selected': esSeleccionado(cliente) }"
          :aria-selected="esSeleccionado(cliente)"
          @click="$emit('seleccionar', cliente)"
        >
          <span class="card-avatar">{{ initials(cliente.nombre) }}</span>
          <span class="client-main">
            <strong class="card-title">{{ cliente.nombre }}</strong>
            <span class="client-contact card-sub">
              <span><i class="pi pi-id-card"></i>{{ cliente.dui || 'Sin DUI' }}</span>
              <span><i class="pi pi-phone"></i>{{ cliente.telefono || 'Sin teléfono' }}</span>
            </span>
          </span>
          <span class="license-info">
            <span class="license-date card-sub">
              Licencia: {{ cliente.vencimiento_licencia ? formatFecha(cliente.vencimiento_licencia) : 'Sin fecha registrada' }}
            </span>
            <span class="license-badge" :class="licenciaVigente(cliente) ? 'license-badge--valid' : 'license-badge--expired'">
              <i :class="licenciaVigente(cliente) ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
              {{ licenciaVigente(cliente) ? 'Vigente' : 'Licencia vencida' }}
            </span>
          </span>
          <i
            class="selection-icon pi"
            :class="esSeleccionado(cliente) ? 'pi-check-circle' : 'pi-chevron-right'"
            aria-hidden="true"
          ></i>
        </button>
      </div>

      <div v-else class="client-state" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <i class="pi pi-users"></i>
        {{ busqueda.trim() ? 'No se encontraron clientes para esta búsqueda.' : 'No hay clientes registrados.' }}
      </div>
    </div>

    <div class="pagination-row">
      <button
        type="button"
        class="pagination-btn"
        :disabled="buscando || paginacion.current_page <= 1"
        @click="$emit('cambiar-pagina', paginacion.current_page - 1)"
      >
        <i class="pi pi-chevron-left"></i>
        Anterior
      </button>
      <span>Página {{ paginacion.current_page }} de {{ paginacion.last_page }}</span>
      <button
        type="button"
        class="pagination-btn"
        :disabled="buscando || paginacion.current_page >= paginacion.last_page"
        @click="$emit('cambiar-pagina', paginacion.current_page + 1)"
      >
        Siguiente
        <i class="pi pi-chevron-right"></i>
      </button>
    </div>

    <p
      v-if="clienteSeleccionado && !licenciaVigente(clienteSeleccionado)"
      role="alert"
      class="mt-3 rounded-lg border p-3 text-xs leading-relaxed"
      :class="isDark ? 'border-red-900/60 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800'"
    >
      <i class="pi pi-exclamation-triangle mr-1" aria-hidden="true"></i>
      {{ clienteSeleccionado.vencimiento_licencia ? 'La licencia debe vencer después de hoy.' : 'El cliente no tiene una fecha de vencimiento de licencia registrada.' }}
      No puedes continuar con la reserva. Actualiza la licencia desde Clientes.
    </p>
  </section>
</template>

<script setup>
import { useAppTheme } from '@/composables/useAppTheme'
import { initials, formatFecha } from '@/utils/reservaFormatters'
import { documentosVigentes } from '@/utils/contratoFormatters'

const props = defineProps({
  busqueda: { type: String, default: '' },
  clienteSeleccionado: { type: Object, default: null },
  resultados: { type: Array, default: () => [] },
  buscando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  paginacion: {
    type: Object,
    default: () => ({ current_page: 1, last_page: 1, total: 0 }),
  },
})

defineEmits([
  'update:busqueda',
  'buscar',
  'seleccionar',
  'limpiar',
  'cambiar-pagina',
  'agregar-nuevo',
])

const { isDark } = useAppTheme()

function licenciaVigente(cliente) {
  return documentosVigentes(cliente).ok
}

function esSeleccionado(cliente) {
  return Number(cliente?.id) === Number(props.clienteSeleccionado?.id)
}
</script>

<style scoped>
.field-label { display:block; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; }
.input-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-size:0.875rem; pointer-events:none; }
.field-input { width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; border-radius:0.75rem; font-size:0.875rem; transition:all 0.15s; outline:none; }
.field-input:focus { border-color:#922b21; box-shadow:0 0 0 3px rgba(146,43,33,0.12); }
.new-client-btn, .pagination-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.4rem; border:1px solid; border-radius:0.65rem; font-size:0.75rem; font-weight:700; transition:all 0.15s; }
.new-client-btn { padding:0.45rem 0.7rem; }
.pagination-btn { min-height:2rem; padding:0.35rem 0.65rem; }
.pagination-btn:disabled { opacity:0.45; cursor:not-allowed; }
.client-list-shell { min-height:12rem; max-height:19rem; overflow-y:auto; border:1px solid; border-radius:0.85rem; }
.client-list { display:flex; flex-direction:column; }
.client-row { width:100%; display:grid; grid-template-columns:auto minmax(0, 1fr) minmax(12rem, auto) auto; align-items:center; gap:0.8rem; padding:0.8rem; border:2px solid transparent; border-bottom-width:1px; text-align:left; transition:background 0.15s, border-color 0.15s; }
.client-row:last-child { border-bottom-color:transparent; }
.client-main, .license-info { min-width:0; display:flex; flex-direction:column; gap:0.3rem; }
.card-title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.875rem; }
.client-contact { display:flex; flex-wrap:wrap; gap:0.35rem 0.85rem; font-size:0.75rem; }
.client-contact span { display:inline-flex; align-items:center; gap:0.3rem; }
.license-info { align-items:flex-end; }
.license-date { font-size:0.7rem; white-space:nowrap; }
.license-badge { display:inline-flex; align-items:center; gap:0.3rem; border-radius:9999px; padding:0.25rem 0.55rem; font-size:0.7rem; font-weight:700; }
.license-badge--valid { color:#166534; background:#dcfce7; }
.license-badge--expired { color:#991b1b; background:#fee2e2; }
.selection-icon { font-size:0.85rem; }
.client-state { min-height:12rem; display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:1rem; text-align:center; font-size:0.8rem; }
.pagination-row { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; margin-top:0.75rem; font-size:0.75rem; font-weight:700; }
.card-avatar { width:2.5rem; height:2.5rem; border-radius:9999px; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#fff; background:#922b21; font-size:0.75rem; font-weight:700; }
.form-section-light .field-label { color:#4b5563; }
.form-section-light .input-icon { color:#9ca3af; }
.form-section-light .field-input { border:1px solid #e5e7eb; background:#f9fafb; color:#1f2937; }
.form-section-light .field-input:focus { background:#fff; }
.form-section-light .client-list-shell { border-color:#e5e7eb; }
.form-section-light .client-row { border-bottom-color:#e5e7eb; background:#fff; }
.form-section-light .client-row:hover { background:#fafafa; }
.form-section-light .client-row--selected { border-color:#922b21; background:#fff7f5; }
.form-section-light .card-title { color:#111827; }
.form-section-light .card-sub { color:#6b7280; }
.form-section-light .selection-icon { color:#922b21; }
.form-section-light .new-client-btn, .form-section-light .pagination-btn { color:#7f1d1d; border-color:#fecaca; background:#fff; }
.form-section-light .new-client-btn:hover, .form-section-light .pagination-btn:not(:disabled):hover { background:#fff7f5; }
.form-section-dark .field-label { color:#9ca3af; }
.form-section-dark .input-icon { color:#6b7280; }
.form-section-dark .field-input { border:1px solid #4b5563; background:#1f2937; color:#f3f4f6; }
.form-section-dark .field-input:focus { background:#111827; }
.form-section-dark .client-list-shell { border-color:#374151; }
.form-section-dark .client-row { border-bottom-color:#374151; background:#1f2937; }
.form-section-dark .client-row:hover { background:#263040; }
.form-section-dark .client-row--selected { border-color:#c0392b; background:#2b1d20; }
.form-section-dark .card-title { color:#f3f4f6; }
.form-section-dark .card-sub { color:#9ca3af; }
.form-section-dark .selection-icon { color:#f0a500; }
.form-section-dark .license-badge--valid { color:#86efac; background:rgba(20,83,45,0.55); }
.form-section-dark .license-badge--expired { color:#fca5a5; background:rgba(127,29,29,0.45); }
.form-section-dark .new-client-btn, .form-section-dark .pagination-btn { color:#f3f4f6; border-color:#4b5563; background:#1f2937; }
.form-section-dark .new-client-btn:hover, .form-section-dark .pagination-btn:not(:disabled):hover { background:#374151; }
@media (max-width: 640px) {
  .client-list-shell { max-height:24rem; }
  .client-row { grid-template-columns:auto minmax(0, 1fr) auto; align-items:start; gap:0.65rem; }
  .license-info { grid-column:2 / 4; align-items:flex-start; }
  .license-date { white-space:normal; }
  .client-contact { flex-direction:column; gap:0.2rem; }
  .pagination-row { flex-wrap:wrap; justify-content:center; }
  .pagination-row span { order:-1; width:100%; text-align:center; }
}
</style>
