<template>
  <div
    class="min-h-screen transition-colors"
    :class="isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'"
  >
    <AppSidebar
      :movil="!esEscritorio"
      :abierto="menuMovilAbierto"
      @collapsed-change="sidebarCollapsed = $event"
      @cerrar="menuMovilAbierto = false"
    />
    <div
      v-if="!esEscritorio && menuMovilAbierto"
      class="fixed inset-0 bg-black/50"
      style="z-index: 45"
      aria-hidden="true"
      @click="menuMovilAbierto = false"
    />
    <AppHeader
      :sidebar-collapsed="sidebarCollapsed"
      :movil="!esEscritorio"
      @abrir-menu="menuMovilAbierto = true"
    />

    <!-- Page content -->
    <main
      class="transition-all duration-300 pt-16"
      :style="{ marginLeft: margenContenido }"
    >
      <div class="p-3 sm:p-6">
        <router-view />
        <!-- If not using Vue Router, replace <router-view /> with your page component -->
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import { useNotificacionesStore } from "@/stores/notificaciones";
import AppSidebar from "@/components/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";

// Por debajo de este ancho la barra lateral deja de ser fija y pasa a ser un
// menú deslizable; si no, en un teléfono ocupaba 256px y dejaba el contenido
// casi sin espacio.
const MEDIA_ESCRITORIO = "(min-width: 1024px)";

const sidebarCollapsed = ref(false);
const { isDark } = storeToRefs(useThemeStore());
const authStore = useAuthStore();
const notificacionesStore = useNotificacionesStore();
const route = useRoute();

const mediaQuery = typeof window !== "undefined" ? window.matchMedia(MEDIA_ESCRITORIO) : null;
const esEscritorio = ref(mediaQuery ? mediaQuery.matches : true);
const menuMovilAbierto = ref(false);

const margenContenido = computed(() => {
  if (!esEscritorio.value) return "0px";
  return sidebarCollapsed.value ? "64px" : "256px";
});

function actualizarEscritorio(event) {
  esEscritorio.value = event.matches;
  if (event.matches) menuMovilAbierto.value = false;
}

watch(() => route.fullPath, () => {
  menuMovilAbierto.value = false;
});

let pollingId = null;
let desmontado = false;

function puedeConsultarNotificaciones() {
  return authStore.userRoles.some((role) => ["ADMINISTRADOR", "EMPLEADO"].includes(role));
}

onMounted(async () => {
  mediaQuery?.addEventListener("change", actualizarEscritorio);

  if (!authStore.isAuthenticated) return;

  try {
    await authStore.me();
  } catch {
    // Conserva el rol local para decidir si se permite el polling.
  }

  if (!desmontado && authStore.isAuthenticated && puedeConsultarNotificaciones() && pollingId === null) {
    pollingId = notificacionesStore.iniciarPolling(60000);
  }
});

onUnmounted(() => {
  desmontado = true;
  mediaQuery?.removeEventListener("change", actualizarEscritorio);
  if (pollingId !== null) {
    clearInterval(pollingId);
    pollingId = null;
  }
});
</script>
