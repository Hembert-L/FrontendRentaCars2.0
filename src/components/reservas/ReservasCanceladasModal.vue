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
          class="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden modal-shell"
          :class="isDark ? 'modal-shell--dark' : 'modal-shell--light'"
          @click.stop
        >
          <!-- Encabezado -->
          <div class="modal-header shrink-0">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="modal-header__icon">
                  <i class="pi pi-history text-sm"></i>
                </div>
                <div class="min-w-0">
                  <h2 class="font-extrabold text-base leading-tight" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
                    Cancelaciones
                  </h2>
                  <p class="text-xs mt-0.5 truncate" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    Historial de reservas anuladas
                  </p>
                </div>
              </div>
              <button type="button" class="modal-close" @click.stop.prevent="$emit('cerrar')">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Búsqueda -->
          <div class="modal-search shrink-0">
            <div class="flex gap-2">
              <div class="relative flex-1">
                <i class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style="color:#922b21;opacity:0.55;"></i>
                <input
                  v-model="busqueda"
                  type="text"
                  placeholder="Cliente, DUI o motivo..."
                  class="w-full pl-8 pr-3 py-2 rounded-lg border text-xs focus:outline-none"
                  :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-red-100 bg-white'"
                  @keyup.enter="cargar"
                />
              </div>
              <button type="button" class="modal-btn-buscar" @click="cargar">
                Buscar
              </button>
            </div>
          </div>

          <!-- Lista -->
          <div class="flex-1 overflow-y-auto min-h-0 px-4 py-3">
            <div v-if="cargando" class="flex items-center justify-center py-12 gap-2 text-xs opacity-60">
              <i class="pi pi-spin pi-spinner"></i>
              Cargando...
            </div>

            <div v-else-if="!lista.length" class="py-12 text-center">
              <div class="modal-empty-icon mx-auto mb-3">
                <i class="pi pi-inbox text-lg"></i>
              </div>
              <p class="text-sm font-semibold" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Sin cancelaciones</p>
              <p class="text-xs mt-1 opacity-55">Las reservas canceladas aparecerán aquí.</p>
            </div>

            <div v-else class="space-y-2.5">
              <article
                v-for="item in listaPaginada"
                :key="item.id"
                class="cancel-card"
                :class="isDark ? 'cancel-card--dark' : 'cancel-card--light'"
              >
                <!-- Fila superior -->
                <div class="cancel-card__head">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="cancel-badge">Cancelada</span>
                    <span class="text-xs font-bold truncate" :class="isDark ? 'text-[#f0a500]' : 'text-[#922b21]'">
                      #{{ item.reserva?.id }}
                    </span>
                  </div>
                  <span class="cancel-fecha text-[10px] shrink-0">
                    <i class="pi pi-clock mr-0.5 text-[9px]" style="color:#f0a500;"></i>
                    {{ formatFechaHora(item.fecha_cancelacion) }}
                  </span>
                </div>

                <!-- Datos compactos -->
                <div class="cancel-card__body">
                  <div class="cancel-field">
                    <span class="cancel-label"><i class="pi pi-user"></i> Cliente</span>
                    <p class="cancel-value">{{ item.reserva?.cliente?.nombre || '—' }}</p>
                    <p class="cancel-sub">DUI: {{ item.reserva?.cliente?.dui || '—' }}</p>
                  </div>
                  <div class="cancel-field">
                    <span class="cancel-label"><i class="pi pi-car"></i> Vehículo</span>
                    <p class="cancel-value">{{ nombreVehiculo(item.reserva?.vehiculo) }}</p>
                    <p class="cancel-sub">{{ item.reserva?.vehiculo?.placa || '—' }}</p>
                  </div>
                  <div class="cancel-field">
                    <span class="cancel-label"><i class="pi pi-calendar"></i> Periodo</span>
                    <p class="cancel-value text-[11px]">
                      {{ formatFecha(item.reserva?.fecha_inicio) }}
                      <span class="opacity-40 mx-1">→</span>
                      {{ formatFecha(item.reserva?.fecha_fin) }}
                    </p>
                  </div>
                  <div class="cancel-field">
                    <span class="cancel-label"><i class="pi pi-phone"></i> Teléfono</span>
                    <p class="cancel-value">{{ item.reserva?.cliente?.telefono || '—' }}</p>
                  </div>
                  <div class="cancel-field cancel-field--full cancel-motivo">
                    <span class="cancel-label cancel-label--motivo"><i class="pi pi-comment"></i> Motivo</span>
                    <p class="cancel-motivo-text">{{ item.motivo }}</p>
                  </div>
                  <p v-if="item.user" class="cancel-user">
                    <i class="pi pi-id-card text-[9px]" style="color:#f0a500;"></i>
                    {{ item.user.nombre }} {{ item.user.apellido }}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <!-- Pie -->
          <div class="modal-footer shrink-0">
            <span>
              Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} registro{{ pagination.total !== 1 ? 's' : '' }}
            </span>
            <div class="modal-footer__actions">
              <button
                type="button"
                class="modal-page-btn"
                :disabled="pagination.current_page <= 1 || cargando"
                @click="cambiarPagina(pagination.current_page - 1)"
              >
                <i class="pi pi-chevron-left text-[0.6rem]"></i>
                Anterior
              </button>
              <span class="modal-page-label">
                {{ pagination.current_page }} / {{ pagination.last_page }}
              </span>
              <button
                type="button"
                class="modal-page-btn"
                :disabled="pagination.current_page >= pagination.last_page || cargando"
                @click="cambiarPagina(pagination.current_page + 1)"
              >
                Siguiente
                <i class="pi pi-chevron-right text-[0.6rem]"></i>
              </button>
              <button type="button" class="modal-btn-cerrar" @click.stop.prevent="$emit('cerrar')">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { useReservasStore } from '@/stores/reservas'
import { formatFecha, nombreVehiculo } from '@/utils/reservaFormatters'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

defineEmits(['cerrar'])

const { isDark } = useAppTheme()
const store = useReservasStore()

const busqueda = ref('')
const lista = ref([])
const cargando = ref(false)
const paginaActual = ref(1)
const registrosPorPagina = 5

const pagination = computed(() => {
  const total = lista.value.length
  const lastPage = Math.max(1, Math.ceil(total / registrosPorPagina))
  const currentPage = Math.min(paginaActual.value, lastPage)
  const from = total ? ((currentPage - 1) * registrosPorPagina) + 1 : 0
  const to = total ? Math.min(currentPage * registrosPorPagina, total) : 0

  return {
    current_page: currentPage,
    last_page: lastPage,
    total,
    from,
    to,
  }
})

const listaPaginada = computed(() => {
  const start = (pagination.value.current_page - 1) * registrosPorPagina
  return lista.value.slice(start, start + registrosPorPagina)
})

watch(
  () => props.visible,
  (v) => {
    if (v) {
      busqueda.value = ''
      paginaActual.value = 1
      cargar()
    }
  },
)

async function cargar() {
  cargando.value = true
  paginaActual.value = 1
  try {
    lista.value = await store.fetchCancelaciones({
      search: busqueda.value.trim() || undefined,
    })
  } catch {
    lista.value = []
  } finally {
    cargando.value = false
  }
}

function cambiarPagina(page) {
  if (page < 1 || page > pagination.value.last_page || page === paginaActual.value) return
  paginaActual.value = page
}

function formatFechaHora(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
.modal-shell--light { background: #fff; }
.modal-shell--dark { background: #111827; }

.modal-header {
  padding: 0.875rem 1rem;
  border-bottom: 2px solid #922b21;
  background: linear-gradient(135deg, rgba(146,43,33,0.08) 0%, rgba(240,165,0,0.06) 100%);
}
.modal-shell--dark .modal-header {
  background: linear-gradient(135deg, rgba(146,43,33,0.25) 0%, rgba(240,165,0,0.08) 100%);
  border-bottom-color: #c0392b;
}

.modal-header__icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #922b21;
  color: #f0a500;
  flex-shrink: 0;
}

.modal-close {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(146,43,33,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #922b21;
  transition: background 0.15s;
}
.modal-shell--dark .modal-close {
  border-color: rgba(192,57,43,0.4);
  color: #f0a500;
}
.modal-close:hover { background: rgba(146,43,33,0.08); }

.modal-search {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(146,43,33,0.12);
}
.modal-shell--dark .modal-search {
  border-bottom-color: rgba(192,57,43,0.2);
  background: rgba(146,43,33,0.06);
}

.modal-btn-buscar {
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  background: #c0392b;
  transition: opacity 0.15s;
}
.modal-btn-buscar:hover { opacity: 0.9; }

.modal-empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240,165,0,0.15);
  color: #922b21;
}

/* Tarjeta compacta */
.cancel-card {
  border-radius: 0.625rem;
  border: 1px solid rgba(146,43,33,0.18);
  overflow: hidden;
}
.cancel-card--light { background: #fff; }
.cancel-card--dark {
  background: rgba(31,41,55,0.5);
  border-color: rgba(192,57,43,0.25);
}

.cancel-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.65rem;
  background: linear-gradient(90deg, rgba(192,57,43,0.12) 0%, rgba(240,165,0,0.08) 100%);
  border-bottom: 1px solid rgba(146,43,33,0.12);
}
.cancel-card--dark .cancel-card__head {
  background: linear-gradient(90deg, rgba(146,43,33,0.35) 0%, rgba(240,165,0,0.06) 100%);
}

.cancel-badge {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  background: #c0392b;
  color: #fff;
}

.cancel-fecha {
  font-weight: 600;
  opacity: 0.75;
}
.cancel-card--dark .cancel-fecha { color: #e5e7eb; }

.cancel-card__body {
  padding: 0.5rem 0.65rem 0.55rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem 0.75rem;
}

.cancel-field--full { grid-column: 1 / -1; }

.cancel-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #922b21;
  margin-bottom: 0.1rem;
}
.cancel-card--dark .cancel-label { color: #f0a500; }
.cancel-label i { font-size: 0.5rem; }

.cancel-value {
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.25;
}
.cancel-card--light .cancel-value { color: #1f2937; }
.cancel-card--dark .cancel-value { color: #f3f4f6; }

.cancel-sub {
  font-size: 0.6rem;
  opacity: 0.55;
  margin-top: 0.05rem;
}

.cancel-motivo {
  margin-top: 0.15rem;
  padding: 0.35rem 0.45rem;
  border-radius: 0.375rem;
  border-left: 3px solid #c0392b;
  background: rgba(240,165,0,0.1);
}
.cancel-card--dark .cancel-motivo {
  background: rgba(146,43,33,0.2);
  border-left-color: #f0a500;
}

.cancel-label--motivo { color: #c0392b; }
.cancel-card--dark .cancel-label--motivo { color: #f0a500; }

.cancel-motivo-text {
  font-size: 0.68rem;
  line-height: 1.35;
}
.cancel-card--light .cancel-motivo-text { color: #374151; }
.cancel-card--dark .cancel-motivo-text { color: #e5e7eb; }

.cancel-user {
  grid-column: 1 / -1;
  font-size: 0.58rem;
  opacity: 0.55;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.1rem;
}

.modal-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(146,43,33,0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.65rem;
  opacity: 0.65;
}
.modal-shell--dark .modal-footer {
  border-top-color: rgba(192,57,43,0.2);
}

.modal-btn-cerrar {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(146,43,33,0.3);
  color: #922b21;
  transition: background 0.15s;
}
.modal-shell--dark .modal-btn-cerrar {
  border-color: rgba(240,165,0,0.35);
  color: #f0a500;
}
.modal-btn-cerrar:hover { background: rgba(146,43,33,0.06); }

.modal-footer__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.modal-page-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.55rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(146,43,33,0.25);
  color: #922b21;
  font-weight: 800;
  transition: background 0.15s, opacity 0.15s;
}
.modal-shell--dark .modal-page-btn {
  border-color: rgba(240,165,0,0.35);
  color: #f0a500;
}
.modal-page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.modal-page-btn:not(:disabled):hover { background: rgba(146,43,33,0.06); }
.modal-page-label {
  min-width: 2.8rem;
  text-align: center;
  font-weight: 800;
}

@media (max-width: 640px) {
  .modal-footer {
    align-items: flex-start;
    flex-direction: column;
  }
  .modal-footer__actions {
    justify-content: flex-start;
  }
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

