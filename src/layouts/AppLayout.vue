<template>
  <div
    class="min-h-screen transition-colors"
    :class="isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'"
  >
    <AppSidebar @collapsed-change="sidebarCollapsed = $event" />
    <AppHeader :sidebar-collapsed="sidebarCollapsed" />

    <!-- Page content -->
    <main
      class="transition-all duration-300 pt-16"
      :style="{ marginLeft: sidebarCollapsed ? '64px' : '256px' }"
    >
      <div class="p-6">
        <router-view />
        <!-- If not using Vue Router, replace <router-view /> with your page component -->
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import { useNotificacionesStore } from "@/stores/notificaciones";
import AppSidebar from "@/components/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";

const sidebarCollapsed = ref(false);
const { isDark } = storeToRefs(useThemeStore());
const authStore = useAuthStore();
const notificacionesStore = useNotificacionesStore();

let pollingId = null;
let desmontado = false;

function puedeConsultarNotificaciones() {
  return authStore.userRoles.some((role) => ["ADMINISTRADOR", "EMPLEADO"].includes(role));
}

onMounted(async () => {
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
  if (pollingId !== null) {
    clearInterval(pollingId);
    pollingId = null;
  }
});
</script>
