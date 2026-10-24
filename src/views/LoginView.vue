<template>
  <div class="min-h-screen flex flex-col lg:flex-row login-page" style="font-family: 'Montserrat', sans-serif;">
    <div class="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#1a0505]">
      <div class="absolute inset-0 grid grid-cols-4 grid-rows-4 login-pattern">
        <div class="bg-[#f0a500]" />
        <div class="bg-[#c0392b] col-span-2" />
        <div class="bg-[#3b82f6] rounded-bl-[100%]" />
        <div class="bg-[#e67e22] row-span-2" />
        <div class="bg-[#3b0a0a] col-span-2 row-span-2" />
        <div class="bg-[#f0a500] rounded-tr-[100%]" />
        <div class="bg-[#c0392b] rounded-tl-[100%]" />
        <div class="bg-[#3b82f6] col-span-2" />
        <div class="bg-[#e67e22]" />
        <div class="bg-[#f0a500] col-span-2 rounded-br-[80%]" />
        <div class="bg-[#3b0a0a]" />
      </div>

      <div class="login-logo-slot">
        <img
          :src="logoElGuayabo"
          alt="El Guayabo Renta Car"
          class="login-logo login-logo--panel"
        />
        <p class="login-brand-text">
          El Guayabo · Admin
        </p>
      </div>

    </div>

    <div class="flex-1 flex flex-col min-h-screen bg-[#3b0a0a] px-8 py-10 lg:px-16 login-form-panel">
      <div class="flex-1 flex flex-col justify-center w-full max-w-md mx-auto">

        <h2 class="text-4xl font-bold text-white" :class="modo === 'login' ? 'mb-10' : 'mb-3'">{{ titulo }}</h2>

        <!-- olvide mi contraseña: pide el correo -->
        <form v-if="modo === 'olvide'" @submit.prevent="enviarEnlace" class="space-y-6">
          <p class="text-sm text-white/70">
            Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
          </p>

          <template v-if="!enlaceEnviado">
            <div>
              <label class="block text-sm text-white/90 mb-2">Correo electrónico</label>
              <input
                v-model="recuperar.correo"
                type="email"
                autocomplete="email"
                class="login-input"
                :class="{ 'login-input--error': recuperar.error }"
              />
              <p v-if="recuperar.error" class="text-xs mt-1.5 text-red-300">{{ recuperar.error }}</p>
            </div>

            <button type="submit" :disabled="loading" class="login-btn">
              <span v-if="loading" class="inline-flex items-center justify-center gap-2">
                <i class="pi pi-spin pi-spinner"></i>
                Enviando...
              </span>
              <span v-else>Enviar enlace</span>
            </button>
          </template>

          <div v-else class="login-aviso login-aviso--ok">
            <i class="pi pi-envelope"></i>
            <div>
              <p>{{ enlaceEnviado }}</p>
              <p class="mt-1 text-white/60">Revisa también la carpeta de spam. El enlace vence en 60 minutos.</p>
            </div>
          </div>

          <div class="text-center">
            <router-link :to="{ name: 'login' }" class="text-sm text-white/60 hover:text-white/90 transition-colors">
              Volver a iniciar sesión
            </router-link>
          </div>
        </form>

        <!-- restablecer: llega desde el enlace del correo -->
        <form v-else-if="modo === 'restablecer'" @submit.prevent="guardarNuevaPassword" class="space-y-6">
          <template v-if="!enlaceValido">
            <div class="login-aviso login-aviso--error">
              <i class="pi pi-exclamation-circle"></i>
              <p>El enlace no está completo. Pide uno nuevo desde "¿Olvidaste tu contraseña?".</p>
            </div>
          </template>

          <template v-else-if="!passwordCambiada">
            <p class="text-sm text-white/70">
              Cuenta: <strong class="text-white">{{ route.query.correo }}</strong>
            </p>

            <div>
              <label class="block text-sm text-white/90 mb-2">Nueva contraseña</label>
              <div class="relative">
                <input
                  v-model="restablecer.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="login-input pr-11"
                  :class="{ 'login-input--error': restablecer.errorPassword }"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabindex="-1"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm"></i>
                </button>
              </div>
              <p v-if="restablecer.errorPassword" class="text-xs mt-1.5 text-red-300">{{ restablecer.errorPassword }}</p>
              <p v-else class="text-xs mt-1.5 text-white/50">Mínimo 8 caracteres.</p>
            </div>

            <div>
              <label class="block text-sm text-white/90 mb-2">Confirmar contraseña</label>
              <input
                v-model="restablecer.confirmacion"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="login-input"
                :class="{ 'login-input--error': restablecer.errorConfirmacion }"
              />
              <p v-if="restablecer.errorConfirmacion" class="text-xs mt-1.5 text-red-300">{{ restablecer.errorConfirmacion }}</p>
            </div>

            <button type="submit" :disabled="loading" class="login-btn">
              <span v-if="loading" class="inline-flex items-center justify-center gap-2">
                <i class="pi pi-spin pi-spinner"></i>
                Guardando...
              </span>
              <span v-else>Guardar contraseña</span>
            </button>
          </template>

          <div v-else class="login-aviso login-aviso--ok">
            <i class="pi pi-check-circle"></i>
            <p>{{ passwordCambiada }} Ya puedes iniciar sesión con tu nueva contraseña.</p>
          </div>

          <div
            v-if="globalError"
            class="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-950/60 text-red-200 border border-red-800/50"
          >
            <i class="pi pi-exclamation-circle"></i>
            {{ globalError }}
          </div>

          <div class="text-center space-y-2">
            <router-link
              v-if="!enlaceValido || globalError"
              :to="{ name: 'olvide-password' }"
              class="block text-sm text-white/60 hover:text-white/90 transition-colors"
            >
              Pedir un enlace nuevo
            </router-link>
            <router-link
              :to="{ name: 'login', query: route.query.correo ? { correo: route.query.correo } : {} }"
              class="block text-sm text-white/60 hover:text-white/90 transition-colors"
            >
              Ir a iniciar sesión
            </router-link>
          </div>
        </form>

        <form v-else @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm text-white/90 mb-2">Correo electrónico</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="login-input"
              :class="{ 'login-input--error': errors.email }"
            />
            <p v-if="errors.email" class="text-xs mt-1.5 text-red-300">{{ errors.email }}</p>
          </div>

          <div>
            <label class="block text-sm text-white/90 mb-2">Contraseña</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="login-input pr-11"
                :class="{ 'login-input--error': errors.password }"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm"></i>
              </button>
            </div>
            <p v-if="errors.password" class="text-xs mt-1.5 text-red-300">{{ errors.password }}</p>
          </div>

          <label class="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              v-model="form.remember"
              type="checkbox"
              class="w-4 h-4 rounded border-white/30 accent-[#3b82f6] cursor-pointer"
            />
            <span class="text-sm text-white/85">Recordarme</span>
          </label>

          <div
            v-if="globalError"
            class="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-950/60 text-red-200 border border-red-800/50"
          >
            <i class="pi pi-exclamation-circle"></i>
            {{ globalError }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 rounded-md text-white font-semibold text-sm bg-[#3b82f6] hover:bg-[#2563eb] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="inline-flex items-center justify-center gap-2">
              <i class="pi pi-spin pi-spinner"></i>
              Iniciando sesión...
            </span>
            <span v-else>Iniciar Sesión</span>
          </button>

          <div class="text-center">
            <router-link
              :to="{ name: 'olvide-password', query: form.email ? { correo: form.email } : {} }"
              class="text-sm text-white/60 hover:text-white/90 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>
        </form>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { rutaInicio } from '@/utils/permisos'
import logoElGuayabo from '@/assets/logo-el-guayabo.png'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email:    typeof route.query.correo === 'string' ? route.query.correo : '',
  password: '',
  remember: false,
})

const errors      = reactive({ email: '', password: '' })
const globalError = ref('')
const loading     = ref(false)
const showPassword = ref(false)

// la misma vista sirve para login, olvide y restablecer
const modo = computed(() => {
  if (route.name === 'olvide-password') return 'olvide'
  if (route.name === 'restablecer-password') return 'restablecer'
  return 'login'
})
const titulo = computed(() => ({
  olvide: 'Recuperar contraseña',
  restablecer: 'Nueva contraseña',
  login: 'Iniciar Sesión',
}[modo.value]))

const recuperar = reactive({ correo: '', error: '' })
const enlaceEnviado = ref('')

const restablecer = reactive({ password: '', confirmacion: '', errorPassword: '', errorConfirmacion: '' })
const passwordCambiada = ref('')
const enlaceValido = computed(() =>
  typeof route.query.token === 'string' && route.query.token &&
  typeof route.query.correo === 'string' && route.query.correo,
)

watch(modo, () => {
  globalError.value = ''
  showPassword.value = false
  enlaceEnviado.value = ''
  passwordCambiada.value = ''
  recuperar.error = ''
  recuperar.correo = typeof route.query.correo === 'string' ? route.query.correo : form.email
  Object.assign(restablecer, { password: '', confirmacion: '', errorPassword: '', errorConfirmacion: '' })
}, { immediate: true })

function mensajeApi(e, porDefecto) {
  if (e.response?.status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.'
  const errores = Object.values(e.response?.data?.errors || {}).flat()
  return errores[0] || e.response?.data?.message || porDefecto
}

async function enviarEnlace() {
  recuperar.error = ''
  const correo = recuperar.correo.trim()
  if (!correo) { recuperar.error = 'El correo es requerido.'; return }
  if (!/^\S+@\S+\.\S+$/.test(correo)) { recuperar.error = 'Escribe un correo válido.'; return }

  loading.value = true
  try {
    const { data } = await api.post('/auth/olvide-password', { correo })
    enlaceEnviado.value = data?.message || 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.'
  } catch (e) {
    recuperar.error = mensajeApi(e, 'No se pudo enviar el enlace. Intenta de nuevo.')
  } finally {
    loading.value = false
  }
}

async function guardarNuevaPassword() {
  restablecer.errorPassword = ''
  restablecer.errorConfirmacion = ''
  globalError.value = ''

  if (restablecer.password.length < 8) { restablecer.errorPassword = 'Mínimo 8 caracteres.'; return }
  if (restablecer.password !== restablecer.confirmacion) {
    restablecer.errorConfirmacion = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  try {
    const { data } = await api.post('/auth/restablecer-password', {
      correo: route.query.correo,
      token: route.query.token,
      password: restablecer.password,
      password_confirmation: restablecer.confirmacion,
    })
    passwordCambiada.value = data?.message || 'Contraseña actualizada correctamente.'
  } catch (e) {
    globalError.value = mensajeApi(e, 'No se pudo cambiar la contraseña. Intenta de nuevo.')
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  errors.email    = ''
  errors.password = ''
  globalError.value = ''

  if (!form.email)    { errors.email    = 'El correo es requerido.';    return }
  if (!form.password) { errors.password = 'La contraseña es requerida.'; return }

  loading.value = true
  try {
    await authStore.login(form.email, form.password, form.remember)

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.push(redirect || rutaInicio(authStore.userRoles))

  } catch (e) {
    const msg = e.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.'
    globalError.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>

.login-page {
  animation: login-fade-in 0.45s ease-out;
}

.login-form-panel {
  animation: login-slide-in 0.5s ease-out;
}

.login-pattern > div {
  animation: login-scale-in 0.45s ease-out backwards;
}

.login-pattern > div:nth-child(1) { animation-delay: 0.05s; }
.login-pattern > div:nth-child(2) { animation-delay: 0.1s; }
.login-pattern > div:nth-child(3) { animation-delay: 0.15s; }
.login-pattern > div:nth-child(4) { animation-delay: 0.2s; }
.login-pattern > div:nth-child(5) { animation-delay: 0.25s; }
.login-pattern > div:nth-child(6) { animation-delay: 0.3s; }
.login-pattern > div:nth-child(7) { animation-delay: 0.35s; }
.login-pattern > div:nth-child(8) { animation-delay: 0.4s; }
.login-pattern > div:nth-child(9) { animation-delay: 0.45s; }
.login-pattern > div:nth-child(10) { animation-delay: 0.5s; }
.login-pattern > div:nth-child(11) { animation-delay: 0.55s; }

@keyframes login-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes login-slide-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes login-scale-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.login-input {
  @apply w-full px-4 py-3 rounded-md bg-white text-gray-900 text-sm placeholder-gray-400 border-0 outline-none focus:ring-2 focus:ring-[#3b82f6]/60 transition-shadow;
}

.login-input--error {
  @apply ring-2 ring-red-400;
}

.login-btn {
  @apply w-full py-3.5 rounded-md text-white font-semibold text-sm bg-[#3b82f6] hover:bg-[#2563eb] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed;
}

.login-aviso {
  @apply flex items-start gap-3 p-4 rounded-lg text-sm border;
}

.login-aviso > i {
  @apply mt-0.5 text-base;
}

.login-aviso--ok {
  @apply bg-emerald-950/50 text-emerald-100 border-emerald-700/50;
}

.login-aviso--error {
  @apply bg-red-950/60 text-red-200 border-red-800/50;
}

.login-logo {
  @apply h-auto object-contain;
}

/* Cuadro central del grid (#3b0a0a, celda 2×2) */
.login-logo-slot {
  position: absolute;
  z-index: 10;
  left: 25%;
  top: 25%;
  width: 50%;
  height: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  pointer-events: none;
}

.login-logo--panel {
  width: 92%;
  max-width: 16rem;
  max-height: min(14rem, 72%);
  height: auto;
  flex-shrink: 1;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.35));
}

.login-brand-text {
  flex-shrink: 0;
  margin: 0;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 620;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #f0a500;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
</style>

