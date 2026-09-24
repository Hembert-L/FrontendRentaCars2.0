<template>
  <aside
    :class="[
      'fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 bg-[#a62b1e]',
      collapsed ? 'w-16' : 'w-64',
    ]"
  >
    <div
      class="sidebar-brand border-b border-red-900/40 min-h-[64px]"
      :class="{ 'sidebar-brand--collapsed': collapsed }"
    >
      <div class="sidebar-logo">
        <img :src="logoElGuayabo" alt="El Guayabo RentCar" class="w-full h-full object-contain" />
      </div>
      <div class="sidebar-title" :class="{ 'sidebar-title--collapsed': collapsed }">
        <span class="text-white font-extrabold text-base tracking-widest uppercase">RentaCar</span>
      </div>
      <button
        type="button"
        class="sidebar-collapse-btn"
        :class="{ 'sidebar-collapse-btn--collapsed': collapsed }"
        :title="collapsed ? 'Expandir menú' : 'Contraer menú'"
        :aria-label="collapsed ? 'Expandir menú' : 'Contraer menú'"
        @click="toggleCollapse"
      >
        <i :class="collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" class="text-sm"></i>
      </button>
    </div>

    <nav class="flex-1 min-h-0 overflow-y-auto py-4 px-2 space-y-4">
      <div>
        <p
          v-if="!collapsed"
          class="text-xs font-bold tracking-widest uppercase px-3 mb-2"
          style="color: #f0a50088"
        >
          Principal
        </p>
        <SidebarItem
          icon="pi-home"
          label="Dashboard"
          :collapsed="collapsed"
          :active="activeRoute === 'dashboard'"
          @click="navegar('dashboard')"
        />
        <SidebarItem
          v-if="puedeOperar"
          icon="pi-users"
          label="Clientes"
          :collapsed="collapsed"
          :active="activeRoute === 'clientes'"
          @click="navegar('clientes')"
        />
        <SidebarItem
          v-if="puedeOperar"
          icon="pi-car"
          label="Vehículos"
          :collapsed="collapsed"
          :active="activeRoute === 'vehiculos'"
          @click="navegar('vehiculos')"
        />
        <SidebarItem
          v-if="puedeOperar"
          icon="pi-calendar"
          label="Reservas"
          :collapsed="collapsed"
          :active="activeRoute === 'reservas'"
          @click="navegar('reservas')"
        />
        <SidebarItem
          v-if="puedeOperar"
          icon="pi-file"
          label="Contratos"
          :collapsed="collapsed"
          :active="activeRoute === 'contratos'"
          @click="navegar('contratos')"
        />
      </div>

      <div v-if="puedeOperar">
        <p
          v-if="!collapsed"
          class="text-xs font-bold tracking-widest uppercase px-3 mb-2"
          style="color: #f0a50088"
        >
          Operaciones
        </p>
        <SidebarItem
          icon="pi-credit-card"
          label="Pagos"
          :collapsed="collapsed"
          :active="activeRoute === 'pagos'"
          @click="navegar('pagos')"
        />
        <SidebarItem
          icon="pi-wrench"
          label="Mantenimiento"
          :collapsed="collapsed"
          :active="activeRoute === 'mantenimiento'"
          @click="navegar('mantenimiento')"
        />
        <SidebarItem
          icon="pi-chart-bar"
          label="Reportes"
          :collapsed="collapsed"
          :active="activeRoute === 'reportes'"
          @click="navegar('reportes')"
        />
      </div>

      <div>
        <p
          v-if="!collapsed && authStore.isAdmin"
          class="text-xs font-bold tracking-widest uppercase px-3 mb-2"
          style="color: #f0a50088"
        >
          Admin
        </p>
        <SidebarItem
          v-if="authStore.isAdmin"
          icon="pi-id-card"
          label="Usuarios"
          :collapsed="collapsed"
          :active="activeRoute === 'usuarios'"
          @click="navegar('usuarios')"
        />

        <div
          class="rounded-lg mx-1 mt-2 px-2 py-2.5 bg-black/20"
          :class="
            collapsed
              ? 'flex flex-col items-center gap-2'
              : 'flex items-center justify-between gap-2'
          "
        >
          <div
            v-if="!collapsed"
            class="flex items-center gap-2 min-w-0 text-xs font-semibold text-white/90"
          >
            <i class="pi pi-moon text-sm flex-shrink-0 text-[#f0a500]" />
            <span class="truncate">Modo oscuro</span>
          </div>
          <i v-else class="pi pi-moon text-sm text-[#f0a500]" title="Modo oscuro" />
          <InputSwitch v-model="darkSwitch" />
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import InputSwitch from "primevue/inputswitch";
import SidebarItem from "./SidebarItem.vue";
import { useThemeStore } from "@/stores/theme";
import { useAuthStore } from "@/stores/auth";
import logoElGuayabo from "@/assets/logo-el-guayabo.png";

const themeStore = useThemeStore();
const authStore = useAuthStore();
const puedeOperar = computed(() =>
  authStore.userRoles.some((role) => ["ADMINISTRADOR", "EMPLEADO"].includes(role)),
);
const darkSwitch = computed({
  get: () => themeStore.isDark,
  set: (v) => themeStore.setDark(v),
});

const emit = defineEmits(["collapsed-change"]);
const router = useRouter();
const route = useRoute();

const collapsed = ref(false);
const activeRoute = ref("dashboard");

watch(
  () => route.path,
  (path) => {
    const segment = path.replace("/", "").split("/")[0];
    activeRoute.value = segment || "dashboard";
  },
  { immediate: true },
);

function toggleCollapse() {
  collapsed.value = !collapsed.value;
  emit("collapsed-change", collapsed.value);
}

function navegar(ruta) {
  activeRoute.value = ruta;
  router.push("/" + ruta);
}
</script>

<style scoped>
.sidebar-brand {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) 2.15rem;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  transition:
    grid-template-columns 0.3s ease,
    gap 0.3s ease,
    padding 0.3s ease;
}

.sidebar-brand--collapsed {
  grid-template-columns: 1fr;
  justify-items: center;
  align-content: center;
  gap: 0.55rem;
  min-height: auto;
  padding: 0.7rem 0.5rem 0.8rem;
}

.sidebar-logo {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.5rem;
}

.sidebar-title {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 0.2s ease,
    max-width 0.3s ease,
    transform 0.3s ease;
}

.sidebar-title--collapsed {
  display: none;
  max-width: 0;
  opacity: 0;
  transform: translateX(-0.5rem);
}

.sidebar-collapse-btn {
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(240, 165, 0, 0.36);
  border-radius: 999px;
  background: rgba(89, 20, 14, 0.34);
  color: #f0a500;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition:
    width 0.3s ease,
    height 0.3s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.sidebar-collapse-btn:hover {
  background: rgba(240, 165, 0, 0.14);
  border-color: rgba(240, 165, 0, 0.62);
  color: #ffd166;
  transform: translateY(-1px);
}

.sidebar-collapse-btn--collapsed {
  width: 1.8rem;
  height: 1.8rem;
}
</style>
