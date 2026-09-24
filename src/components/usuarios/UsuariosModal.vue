<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-[80] flex items-center justify-center p-4" style="background:rgba(0,0,0,0.55);" @click.self.stop="$emit('cerrar')">
        <div class="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" :class="isDark ? 'bg-gray-900' : 'bg-white'" @click.stop>

          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-5 border-b"
            :class="isDark ? 'border-gray-800' : 'border-gray-100'">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:#fef2f2;">
                <i class="pi pi-user text-base" style="color:#c0392b;"></i>
              </div>
              <div>
                <p class="font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
                  {{ modoEdicion ? 'Editar usuario' : 'Nuevo usuario' }} </p>
                <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ modoEdicion ? 'Actualiza los datos' : 'Completa la información' }}</p>
              </div>
            </div>
            <button type="button" @click.stop.prevent="$emit('cerrar')" class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" :class="isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'" >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleGuardar" class="px-6 py-5 space-y-4">

            <!-- Nombre y Apellido -->
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Nombre</label>
                <div class="relative">
                  <i class="pi pi-user input-icon" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
                  <input v-model="form.nombre" type="text" class="field-input" :class="[errors.nombre ? 'error' : '', isDark ? 'field-input-dark' : 'field-input-light']" />
                </div>
                <p v-if="errors.nombre" class="field-error">{{ errors.nombre }}</p>
              </div>
              <div class="flex-1">
                <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Apellido</label>
                <div class="relative">
                  <i class="pi pi-user input-icon" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
                  <input v-model="form.apellido" type="text" class="field-input" :class="[errors.apellido ? 'error' : '', isDark ? 'field-input-dark' : 'field-input-light']" />
                </div>
                <p v-if="errors.apellido" class="field-error">{{ errors.apellido }}</p>
              </div>
            </div>

            <!-- Correo -->
            <div>
              <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Correo electrónico</label>
              <div class="relative">
                <i class="pi pi-envelope input-icon" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
                <input v-model="form.correo" type="email"
                  class="field-input" :class="[errors.correo ? 'error' : '', isDark ? 'field-input-dark' : 'field-input-light']" />
              </div>
              <p v-if="errors.correo" class="field-error">{{ errors.correo }}</p>
            </div>

            <!-- Rol -->
            <div>
              <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Rol</label>

              <div
                v-if="modoEdicion && esAdminUsuario"
                class="flex items-center gap-2 p-3 rounded-xl border"
                :class="isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'"
              >
                <span class="text-xs font-bold px-2.5 py-1 rounded-full" style="background:#fef2f2; color:#c0392b;">
                  <i class="pi pi-shield mr-1 text-[10px]"></i>Administrador
                </span>
                <span class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  El rol de un administrador no se puede modificar.
                </span>
              </div>

              <div v-else class="grid grid-cols-2 gap-2">
                <button
                  v-for="rol in roles"
                  :key="rol.value"
                  type="button"
                  @click="form.rol = rol.value"
                  class="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all"
                  :style="form.rol === rol.value
                    ? 'border-color:#c0392b; background:#fef2f2;'
                    : isDark
                      ? 'border-color:#374151; background:#1f2937;'
                      : 'border-color:#e5e7eb; background:white;'"
                >
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                    :style="form.rol === rol.value ? 'background:#c0392b;' : isDark ? 'background:#374151;' : 'background:#f3f4f6;'"
                  >
                    <i :class="['pi', rol.icon, 'text-sm']"
                      :style="form.rol === rol.value ? 'color:white' : isDark ? 'color:#9ca3af' : 'color:#9ca3af'"></i>
                  </div>
                  <span class="text-xs font-bold"
                    :style="form.rol === rol.value ? 'color:#c0392b' : isDark ? 'color:#9ca3af' : 'color:#6b7280'">
                    {{ rol.label }}
                  </span>
                </button>
              </div>
              <p v-if="errors.rol" class="field-error mt-1">{{ errors.rol }}</p>
            </div>

            <!-- Contraseña solo al crear -->
            <div v-if="!modoEdicion">
              <label class="field-label" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Contraseña temporal</label>
              <div class="relative">
                <i class="pi pi-lock input-icon" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mínimo 8 caracteres"
                  class="field-input pr-10"
                  :class="[errors.password ? 'error' : '', isDark ? 'field-input-dark' : 'field-input-light']"
                />
                <button type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  :class="isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'"
                  @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm"></i>
                </button>
              </div>
              <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
            </div>

            <!-- Error global -->
            <div v-if="globalError" class="flex items-center gap-2 p-3 rounded-xl text-sm" style="background:#fef2f2; color:#c0392b; border:1px solid #fecaca;">
              <i class="pi pi-exclamation-circle"></i>{{ globalError }}
            </div>

            <!-- Botones -->
            <div class="flex gap-3 pt-2">
              <button type="button" @click.stop.prevent="$emit('cerrar')"
                class="flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all"
                :class="isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'">
                Cancelar
              </button>
              <button type="submit" :disabled="loading"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style="background:#c0392b;">
                <i v-if="loading" class="pi pi-spin pi-spinner"></i>
                <i v-else :class="modoEdicion ? 'pi pi-check' : 'pi pi-user-plus'"></i>
                {{ loading ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Crear usuario' }}
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
import { useAppTheme } from '@/composables/useAppTheme'
import { esAdministrador } from '@/utils/usuario'

const { isDark } = useAppTheme()

const props = defineProps({
  visible:     Boolean,
  modoEdicion: Boolean,
  usuario:     Object,
})

const emit = defineEmits(['guardar', 'cerrar'])

const roles = [
  { value: 'EMPLEADO', label: 'Empleado', icon: 'pi-user' },
  { value: 'CONTADOR', label: 'Contador', icon: 'pi-calculator' },
]

const loading      = ref(false)
const showPassword = ref(false)
const globalError  = ref('')

const form = reactive({
  id: null, nombre: '', apellido: '', correo: '', rol: '', password: '',
})
const errors = reactive({ nombre: '', apellido: '', correo: '', rol: '', password: '' })

const esAdminUsuario = computed(() => props.modoEdicion && esAdministrador(props.usuario))

watch(() => props.visible, (val) => {
  if (!val) return
  globalError.value  = ''
  showPassword.value = false
  Object.keys(errors).forEach(k => errors[k] = '')

  if (props.modoEdicion && props.usuario) {
    Object.assign(form, {
      id:       props.usuario.id,
      nombre:   props.usuario.nombre   || '',
      apellido: props.usuario.apellido || '',
      correo:   props.usuario.correo   || '',
      rol:      props.usuario.roles?.[0]?.name || '',
      password: '',
    })
  } else {
    Object.assign(form, { id: null, nombre: '', apellido: '', correo: '', rol: '', password: '' })
  }
})

function validar() {
  Object.keys(errors).forEach(k => errors[k] = '')
  let ok = true
  if (!form.nombre)   { errors.nombre   = 'Requerido'; ok = false }
  if (!form.apellido) { errors.apellido = 'Requerido'; ok = false }
  if (!form.correo || !/\S+@\S+\.\S+/.test(form.correo)) { errors.correo = 'Correo inválido'; ok = false }
  if (!esAdminUsuario.value && !form.rol) { errors.rol = 'Selecciona un rol'; ok = false }
  if (!props.modoEdicion && form.password.length < 8) { errors.password = 'Mínimo 8 caracteres'; ok = false }
  return ok
}

async function handleGuardar() {
  if (!validar()) return
  loading.value     = true
  globalError.value = ''
  try {
    const payload = { ...form }
    if (esAdminUsuario.value) delete payload.rol
    emit('guardar', payload)
  } catch {
    globalError.value = 'Ocurrió un error. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.field-label { display:block; font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.375rem; }
.input-icon  { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-size:0.875rem; pointer-events:none; }
.field-input { width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; border-radius:0.75rem; font-size:0.875rem; transition:all 0.15s; outline:none; }
.field-input-light { border:1px solid #e5e7eb; background:#f9fafb; color:#1f2937; }
.field-input-light:focus { border-color:#c0392b; box-shadow:0 0 0 3px rgba(192,57,43,0.1); background:white; }
.field-input-dark { border:1px solid #374151; background:#1f2937; color:#f3f4f6; }
.field-input-dark:focus { border-color:#c0392b; box-shadow:0 0 0 3px rgba(192,57,43,0.15); background:#111827; }
.field-input.error { border-color:#f87171 !important; background:#fef2f2 !important; }
.field-error { font-size:0.7rem; color:#c0392b; margin-top:0.25rem; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

