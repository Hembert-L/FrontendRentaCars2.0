<template>
  <div class="relative" ref="rootRef">
    <!-- Notificación volando hacia la campana -->
    <TransitionGroup name="fly-list" tag="div" class="flying-layer">
      <div
        v-for="fly in flyingQueue"
        :key="fly._flyKey"
        class="flying-card"
        :class="isDark ? 'flying-card-dark' : 'flying-card-light'"
      >
        <div class="flying-icon" :style="iconStyle(fly.tipo)">
          <i :class="iconoTipo(fly.tipo)" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-bold truncate" :class="isDark ? 'text-gray-100' : 'text-gray-900'">{{ fly.titulo }}</p>
          <p class="text-[10px] truncate" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ fly.mensaje }}</p>
        </div>
      </div>
    </TransitionGroup>

    <!-- Campana -->
    <button
      type="button"
      class="relative p-2 rounded-full transition-colors bell-btn"
      :class="[
        isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
        panelAbierto ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : '',
        campanaActiva ? 'bell-ring' : '',
      ]"
      aria-label="Notificaciones"
      @click="togglePanel"
    >
      <i class="pi pi-bell text-lg" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
      <span
        v-if="noLeidas > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
        style="background:#c0392b;"
      >{{ noLeidas > 9 ? '9+' : noLeidas }}</span>
    </button>

    <!-- Panel -->
    <Transition name="panel">
      <div
        v-if="panelAbierto"
        class="absolute top-12 right-0 w-80 sm:w-96 rounded-2xl shadow-2xl border overflow-hidden z-50"
        :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
          <div>
            <p class="text-sm font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">Notificaciones</p>
            <p class="text-[10px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              {{ noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día' }}
            </p>
          </div>
          <button
            v-if="noLeidas > 0"
            type="button"
            class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg transition-colors"
            :class="isDark ? 'hover:bg-gray-800' : 'hover:bg-red-50'"
            style="color:#f0a500;"
            @click="marcarTodasLeidas"
          >
            <i class="pi pi-check-circle text-xs" />
            Marcar leídas
          </button>
        </div>

        <div v-if="loading" class="flex justify-center py-10">
          <i class="pi pi-spin pi-spinner text-xl" style="color:#c0392b;" />
        </div>

        <div v-else-if="ordenadas.length === 0" class="px-4 py-10 text-center">
          <i class="pi pi-bell-slash text-2xl mb-2" :class="isDark ? 'text-gray-600' : 'text-gray-300'" />
          <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No hay notificaciones por ahora</p>
        </div>

        <ul v-else class="max-h-80 overflow-y-auto divide-y" :class="isDark ? 'divide-gray-800' : 'divide-gray-100'">
          <li
            v-for="notif in ordenadas"
            :key="notif.id"
            class="notif-item"
            :class="esLeida(notif.id) ? '' : (isDark ? 'notif-no-leida-dark' : 'notif-no-leida-light')"
          >
            <div
              class="flex items-center gap-3 px-4 py-3 cursor-pointer"
              role="button"
              tabindex="0"
              @click="abrirNotificacion(notif)"
              @keydown.enter="abrirNotificacion(notif)"
            >
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                :style="iconStyle(notif.tipo)"
              >
                <i :class="iconoTipo(notif.tipo)" class="text-sm" />
              </div>

              <div class="min-w-0 flex-1">
                <p
                  class="text-xs truncate"
                  :class="esLeida(notif.id)
                    ? (isDark ? 'text-gray-300 font-medium' : 'text-gray-700 font-medium')
                    : (isDark ? 'text-gray-100 font-bold' : 'text-gray-900 font-bold')"
                >
                  {{ notif.titulo }}
                </p>
                <p class="text-[11px] mt-0.5 leading-snug" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  {{ notif.mensaje }}
                </p>
                <p
                  class="text-[10px] mt-1 font-medium"
                  :style="esLeida(notif.id) ? '' : 'color:#f0a500;'"
                  :class="esLeida(notif.id) ? (isDark ? 'text-gray-500' : 'text-gray-400') : ''"
                >
                  {{ formatearFecha(notif.fecha) }}
                </p>
              </div>

              <button
                type="button"
                class="notif-check-btn flex-shrink-0"
                :title="esLeida(notif.id) ? 'Leída' : 'Marcar como leída'"
                @click.stop="toggleLeida(notif)"
              >
                <span
                  v-if="esLeida(notif.id)"
                  class="w-7 h-7 rounded-full flex items-center justify-center read-check"
                >
                  <i class="pi pi-check text-xs font-bold" />
                </span>
                <span
                  v-else
                  class="w-7 h-7 rounded-full flex items-center justify-center unread-ring"
                  :class="isDark ? 'unread-ring-dark' : 'unread-ring-light'"
                >
                  <span class="w-2 h-2 rounded-full" style="background:#c0392b;" />
                </span>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppTheme } from '@/composables/useAppTheme'
import { useNotificacionesStore } from '@/stores/notificaciones'

const emit = defineEmits(['panel-change'])

const router = useRouter()
const store = useNotificacionesStore()
const { isDark } = useAppTheme()

const {
  ordenadas,
  flyingQueue,
  loading,
  noLeidas,
} = storeToRefs(store)

const { esLeida, marcarLeida, marcarTodasLeidas } = store

const panelAbierto = ref(false)
const campanaActiva = ref(false)
const rootRef = ref(null)

watch(flyingQueue, (lista) => {
  if (lista.length > 0) {
    campanaActiva.value = true
    setTimeout(() => { campanaActiva.value = false }, 600)
  }
}, { deep: true })

watch(panelAbierto, (v) => emit('panel-change', v))

function togglePanel() {
  panelAbierto.value = !panelAbierto.value
  if (panelAbierto.value) {
    store.fetchNotificaciones(true)
  }
}

function cerrarPanel() {
  panelAbierto.value = false
}

defineExpose({ cerrarPanel })

function iconoTipo(tipo) {
  const map = {
    devolucion_proxima: 'pi pi-calendar-clock',
    devolucion_vencida: 'pi pi-exclamation-triangle',
    licencia_por_vencer: 'pi pi-id-card',
    reserva_proxima: 'pi pi-calendar-plus',
    mantenimiento_activo: 'pi pi-wrench',
  }
  return map[tipo] || 'pi pi-info-circle'
}

function iconStyle(tipo) {
  const colores = {
    devolucion_proxima: { bg: 'rgba(240,165,0,0.15)', color: '#f0a500' },
    devolucion_vencida: { bg: 'rgba(192,57,43,0.15)', color: '#c0392b' },
    licencia_por_vencer: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    reserva_proxima: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    mantenimiento_activo: { bg: 'rgba(146,43,33,0.15)', color: '#922b21' },
  }
  const c = colores[tipo] || colores.devolucion_proxima
  return { background: c.bg, color: c.color }
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-SV', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function abrirNotificacion(notif) {
  marcarLeida(notif.id)
  panelAbierto.value = false
  if (notif.ruta) {
    router.push(typeof notif.ruta === 'string' ? { name: notif.ruta } : notif.ruta)
  }
}

function toggleLeida(notif) {
  if (!esLeida(notif.id)) {
    marcarLeida(notif.id)
  }
}
</script>

<style scoped>
.flying-layer {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 60;
  width: 0;
  height: 0;
}

.flying-card {
  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  min-width: 220px;
  max-width: 280px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  animation: fly-into-bell 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.flying-card-light {
  background: #fff;
  border: 1px solid #f3f4f6;
}

.flying-card-dark {
  background: #1f2937;
  border: 1px solid #374151;
}

.flying-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@keyframes fly-into-bell {
  0% {
    opacity: 0;
    transform: translateY(-50%) translateX(-120px) scale(1.05);
  }
  15% {
    opacity: 1;
    transform: translateY(-50%) translateX(-120px) scale(1.05);
  }
  75% {
    opacity: 1;
    transform: translateY(-50%) translateX(-8px) scale(0.75);
  }
  100% {
    opacity: 0;
    transform: translateY(-50%) translateX(20px) scale(0.2);
  }
}

.bell-ring {
  animation: bell-shake 0.55s ease-in-out;
}

@keyframes bell-shake {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(14deg); }
  40% { transform: rotate(-12deg); }
  60% { transform: rotate(8deg); }
  80% { transform: rotate(-4deg); }
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.notif-item {
  background: transparent;
}

.notif-check-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.notif-no-leida-light {
  border-left: 3px solid #c0392b;
}

.notif-no-leida-dark {
  border-left: 3px solid #c0392b;
}

.read-check {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
  border: 1.5px solid rgba(34, 197, 94, 0.35);
}

.unread-ring-light {
  border: 1.5px dashed #d1d5db;
  background: transparent;
}

.unread-ring-dark {
  border: 1.5px dashed #4b5563;
  background: transparent;
}
</style>

