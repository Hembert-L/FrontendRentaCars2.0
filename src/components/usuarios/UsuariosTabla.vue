<template>
  <div>
    <!-- Filtros y búsqueda -->
    <div
      class="rounded-2xl border shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
    >
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
          :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
        <input
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          type="text"
          placeholder="Buscar por nombre o correo..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition"
          :class="isDark
            ? 'border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500'
            : 'border-gray-200 bg-gray-50 text-gray-900'"
        />
      </div>
      <div class="flex gap-2 flex-wrap">
        <select
          :value="filtroEstado"
          aria-label="Filtrar por estado"
          class="px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-600'"
          @change="$emit('update:filtroEstado', $event.target.value)"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="BLOQUEADO">Bloqueado</option>
        </select>
        <button
          v-for="f in filtros"
          :key="f.value"
          @click="$emit('update:filtro', f.value)"
          class="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
          :style="filtroActivo === f.value
            ? 'background:#c0392b; color:white; border-color:#c0392b;'
            : isDark
              ? 'background:#1f2937; color:#9ca3af; border-color:#374151;'
              : 'background:white; color:#6b7280; border-color:#e5e7eb;'"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- Tabla -->
    <div
      class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr :style="isDark ? 'background:#111827; border-bottom:1px solid #1f2937;' : 'background:#fafafa; border-bottom:1px solid #f3f4f6;'">
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Usuario</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Correo</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Rol</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Estado</th>
              <th class="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="usuario in usuarios"
              :key="usuario.id"
              class="border-b transition-colors"
              :class="isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50/80'"
            >
              <!-- Usuario -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    :style="`background:${avatarColor(nombreCompleto(usuario))}`"
                  >{{ initials(usuario) }}</div>
                  <div>
                    <p class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ nombreCompleto(usuario) }}</p>
                    <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ usuario.telefono || '—' }}</p>
                  </div>
                </div>
              </td>

              <!-- Correo -->
              <td class="px-5 py-4" :class="isDark ? 'text-gray-400' : 'text-gray-600'">{{ usuario.correo }}</td>

              <!-- Rol -->
              <td class="px-5 py-4">
                <span class="rol-badge" :style="rolStyle(rolNombre(usuario))">
                  <i :class="['pi', rolIcon(rolNombre(usuario)), 'text-[10px]']"></i>
                  {{ rolNombre(usuario) }}
                </span>
              </td>

              <!-- Estado -->
              <td class="px-5 py-4">
                <select
                  v-if="!esAdministrador(usuario)"
                  :value="usuario.estado"
                  @change="$emit('cambiar-estado', usuario, $event.target.value)"
                  class="estado-select"
                  :style="estadoStyle(usuario.estado)"
                  title="Cambiar estado"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                </select>
                <span
                  v-else
                  class="estado-badge"
                  :style="estadoStyle(usuario.estado)"
                  title="El estado de un administrador no se puede modificar"
                >
                  {{ labelEstado(usuario.estado) }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-5 py-4">
                <button
                  @click="$emit('editar', usuario)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:shadow-sm"
                  :class="isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
                  title="Editar"
                  data-label="Editar"
                ><i class="pi pi-pencil text-xs"></i></button>
              </td>
            </tr>

            <tr v-if="usuarios.length === 0">
              <td colspan="5" class="px-5 py-16 text-center">
                <i class="pi pi-users text-4xl mb-3 block" :class="isDark ? 'text-gray-700' : 'text-gray-200'"></i>
                <p class="font-medium" :class="isDark ? 'text-gray-500' : 'text-gray-400'">No se encontraron usuarios</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="px-5 py-3 border-t text-xs"
        :class="isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} usuario{{ pagination.total !== 1 ? 's' : '' }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="pagination.current_page <= 1 || loading"
              @click="$emit('cambiar-pagina', pagination.current_page - 1)"
            >
              <i class="pi pi-chevron-left text-[0.65rem]"></i>
              Anterior
            </button>
            <span class="pagination-page" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
              Página {{ pagination.current_page }} de {{ pagination.last_page }}
            </span>
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="pagination.current_page >= pagination.last_page || loading"
              @click="$emit('cambiar-pagina', pagination.current_page + 1)"
            >
              Siguiente
              <i class="pi pi-chevron-right text-[0.65rem]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppTheme } from '@/composables/useAppTheme'
import { esAdministrador } from '@/utils/usuario'

const { isDark } = useAppTheme()

defineProps({
  usuarios:     { type: Array, default: () => [] },
  search:       String,
  filtroActivo: String,
  filtroEstado: { type: String, default: '' },
  filtros:      Array,
  loading:      { type: Boolean, default: false },
  pagination:   {
    type: Object,
    default: () => ({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 }),
  },
})

defineEmits(['update:search', 'update:filtro', 'update:filtroEstado', 'editar', 'cambiar-estado', 'cambiar-pagina'])

const colores = ['#c0392b','#f0a500','#2563eb','#16a34a','#7c3aed','#0891b2']

function nombreCompleto(u) {
  return `${u.nombre || ''} ${u.apellido || ''}`.trim() || '—'
}

function initials(u) {
  const n = u.nombre?.[0] || ''
  const a = u.apellido?.[0] || ''
  return (n + a).toUpperCase() || '?'
}

function avatarColor(nombre) {
  if (!nombre) return '#c0392b'
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = nombre.charCodeAt(i) + ((h << 5) - h)
  return colores[Math.abs(h) % colores.length]
}

function rolNombre(u) {
  return u.roles?.[0]?.name || '—'
}

function rolStyle(rol) {
  const map = {
    'ADMINISTRADOR': 'background:#fef2f2; color:#c0392b;',
    'EMPLEADO':      'background:#dbeafe; color:#1e40af;',
    'CONTADOR':      'background:#f3e8ff; color:#7c3aed;',
  }
  return map[rol] || 'background:#f3f4f6; color:#4b5563;'
}

function rolIcon(rol) {
  return { 'ADMINISTRADOR': 'pi-shield', 'EMPLEADO': 'pi-user', 'CONTADOR': 'pi-calculator' }[rol] || 'pi-user'
}

function estadoStyle(estado) {
  const map = {
    // background-color (no `background`) para no borrar la flecha del selector
    'ACTIVO':    'background-color:#dcfce7; color:#166534;',
    'INACTIVO':  'background-color:#fee2e2; color:#991b1b;',
    'BLOQUEADO': 'background-color:#fef9c3; color:#854d0e;',
  }
  return map[estado] || 'background-color:#f3f4f6; color:#4b5563;'
}

function labelEstado(estado) {
  const map = { ACTIVO: 'Activo', INACTIVO: 'Inactivo', BLOQUEADO: 'Bloqueado' }
  return map[estado] || estado
}
</script>

<style scoped>
.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.15s ease;
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.pagination-btn-light {
  color: #334155;
  background: #ffffff;
  border-color: #dbe3ed;
}

.pagination-btn-light:not(:disabled):hover {
  color: #c0392b;
  background: #fff7f5;
  border-color: #fecaca;
}

.pagination-btn-dark {
  color: #d1d5db;
  background: #111827;
  border-color: #374151;
}

.pagination-btn-dark:not(:disabled):hover {
  color: #f0a500;
  background: #1f2937;
  border-color: #4b5563;
}

.pagination-page {
  min-width: 6.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Selector de estado con el mismo aspecto que las etiquetas de estado: punto de color + texto (ver main.css). */
.estado-select {
  appearance: none;
  padding: 0.15rem 1.1rem 0.15rem 0.85rem;
  border: 0 !important;
  background-color: transparent !important;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  /* punto a la izquierda y flecha a la derecha, ambos del color del estado */
  background-image: radial-gradient(circle, currentColor 0.2rem, transparent 0.23rem),
    linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: 0 50%, calc(100% - 0.5rem) 55%, calc(100% - 0.2rem) 55%;
  background-size: 0.45rem 0.45rem, 0.3rem 0.3rem, 0.3rem 0.3rem;
  background-repeat: no-repeat;
}

.estado-select:focus-visible {
  box-shadow: 0 0 0 2px rgba(192, 57, 43, 0.35);
}

.estado-select option {
  text-transform: none;
  color: #111827;
  background: #fff;
}
</style>
