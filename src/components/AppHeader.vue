<template>
  <header
    class="fixed top-0 right-0 z-40 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 shadow-sm transition-colors border-b"
    :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    :style="{ left: sidebarWidth, height: '64px' }"
  >
    <button
      v-if="movil"
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
      :class="isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'"
      title="Abrir menú"
      aria-label="Abrir menú"
      @click="$emit('abrir-menu')"
    >
      <i class="pi pi-bars text-lg" />
    </button>

    <div class="relative flex items-center gap-2 ml-auto">
      <NotificationBell
        v-if="puedeConsultarNotificaciones"
        ref="bellRef"
        @panel-change="notifPanelOpen = $event"
      />

      <button
        type="button"
        class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-colors"
        :class="isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'"
        @click="userMenuOpen = !userMenuOpen"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style="background: #c0392b"
        >
          {{ userInitials }}
        </div>
        <div class="hidden sm:flex flex-col items-start leading-tight">
          <span class="text-sm font-semibold" :class="isDark ? 'text-gray-100' : 'text-gray-800'">{{
            userName
          }}</span>
          <span class="text-xs font-medium" style="color: #f0a500">{{ userRole }}</span>
        </div>
        <i
          class="pi pi-chevron-down text-xs ml-1"
          :class="isDark ? 'text-gray-500' : 'text-gray-400'"
        />
      </button>

      <div v-if="userMenuOpen" class="absolute top-16 right-4 z-50">
        <button
          type="button"
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-lg border border-gray-200 bg-white transition-opacity hover:opacity-90 whitespace-nowrap"
          style="color: #c0392b"
          @click="handleLogout"
        >
          <i class="pi pi-sign-out" style="color: #c0392b" /> Cerrar sesión
        </button>
      </div>
    </div>
  </header>

  <div v-if="userMenuOpen || notifPanelOpen" class="fixed inset-0 z-30" @click="cerrarMenus" />
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import NotificationBell from "@/components/notifications/NotificationBell.vue";

const router = useRouter();
const authStore = useAuthStore();
const { isDark } = storeToRefs(useThemeStore());
const { user } = storeToRefs(authStore);

const props = defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false,
  },
  movil: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["abrir-menu"]);

const userMenuOpen = ref(false);
const notifPanelOpen = ref(false);
const bellRef = ref(null);

const sidebarWidth = computed(() => {
  if (props.movil) return "0px";
  return props.sidebarCollapsed ? "64px" : "256px";
});
const puedeConsultarNotificaciones = computed(() =>
  authStore.userRoles.some((role) => ["ADMINISTRADOR", "EMPLEADO"].includes(role)),
);

const userName = computed(() => {
  if (!user.value) return "Usuario";
  return `${user.value.nombre || ""} ${user.value.apellido || ""}`.trim() || "Usuario";
});

const userRole = computed(() => {
  if (!user.value) return "Usuario";
  const role = user.value.roles?.[0];
  return typeof role === "string" ? role : role?.name || "Usuario";
});

const userInitials = computed(() => {
  if (!user.value) return "U";
  const n = user.value.nombre?.[0] || "";
  const a = user.value.apellido?.[0] || "";
  return (n + a).toUpperCase() || "U";
});

function cerrarMenus() {
  userMenuOpen.value = false;
  notifPanelOpen.value = false;
  bellRef.value?.cerrarPanel?.();
}

async function handleLogout() {
  userMenuOpen.value = false;

  const result = await Swal.fire({
    title: "¿Cerrar sesión?",
    text: "Se cerrará tu sesión actual en el panel de administración.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#c0392b",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    background: "#fff",
  });

  if (!result.isConfirmed) return;

  await authStore.logout();
  router.push({ name: "login" });
}
</script>
