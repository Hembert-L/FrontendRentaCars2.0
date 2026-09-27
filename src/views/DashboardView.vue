<template>
  <div
    class="min-h-screen transition-colors"
    :class="isDark ? 'bg-gray-950' : 'bg-gray-50'"
    style="font-family: &quot;Sora&quot;, sans-serif"
  >
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <i class="pi pi-spin pi-spinner text-3xl" style="color: #c0392b"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center h-64">
      <p class="text-red-500 text-sm">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Page header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-2xl transition-colors"
              :class="isDark ? 'text-gray-400' : 'text-gray-500'"
            >
              Bienvenido de nuevo,
              <span class="font-semibold" style="color: #c0392b">{{
                authStore.user?.nombre ?? "Usuario"
              }}</span>
              aquí está el resumen de hoy.
            </p>
          </div>
          <div
            class="flex items-center gap-2 text-xs rounded-xl px-4 py-2 shadow-sm border transition-colors"
            :class="
              isDark
                ? 'text-gray-500 bg-gray-900 border-gray-800'
                : 'text-gray-400 bg-white border-gray-200'
            "
          >
            <i class="pi pi-calendar" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
            {{ today }}
          </div>
        </div>
      </div>

      <!-- STAT CARDS — 3 cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- Reservas hoy -->
        <div
          class="rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all duration-200"
          :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p
                class="text-xs font-bold uppercase tracking-widest"
                :class="isDark ? 'text-gray-500' : 'text-gray-400'"
              >
                Reservas hoy
              </p>
              <p class="text-[11px] mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                Fecha actual
              </p>
            </div>
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              style="background: #c0392b18"
            >
              <i class="pi pi-calendar text-base" style="color: #c0392b"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold mb-3" style="color: #c0392b">
            {{ resumen.reservas_dia }}
          </p>
          <div
            class="w-full h-1.5 rounded-full overflow-hidden"
            :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
          >
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{
                width: Math.min(resumen.reservas_dia * 10, 100) + '%',
                background: '#c0392b',
              }"
            />
          </div>
          <div
            class="flex justify-between mt-1.5 text-[11px]"
            :class="isDark ? 'text-gray-500' : 'text-gray-400'"
          >
            <span>Del día</span><span>100%</span>
          </div>
        </div>

        <!-- Reservas mes -->
        <div
          class="rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all duration-200"
          :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p
                class="text-xs font-bold uppercase tracking-widest"
                :class="isDark ? 'text-gray-500' : 'text-gray-400'"
              >
                Reservas mes
              </p>
              <p class="text-[11px] mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                {{ mesActual }}
              </p>
            </div>
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              style="background: #f0a50018"
            >
              <i class="pi pi-calendar-plus text-base" style="color: #f0a500"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold mb-3" style="color: #f0a500">
            {{ resumen.reservas_mes }}
          </p>
          <div
            class="w-full h-1.5 rounded-full overflow-hidden"
            :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
          >
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{
                width: Math.min(resumen.reservas_mes / 2, 100) + '%',
                background: '#f0a500',
              }"
            />
          </div>
          <div
            class="flex justify-between mt-1.5 text-[11px]"
            :class="isDark ? 'text-gray-500' : 'text-gray-400'"
          >
            <span>Volumen mensual</span><span>100%</span>
          </div>
        </div>

        <!-- Vehículos disponibles x/total -->
        <div
          class="rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all duration-200"
          :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p
                class="text-xs font-bold uppercase tracking-widest"
                :class="isDark ? 'text-gray-500' : 'text-gray-400'"
              >
                Vehículos disp.
              </p>
              <p class="text-[11px] mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                Flota activa
              </p>
            </div>
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              style="background: #3b82f618"
            >
              <i class="pi pi-car text-base" style="color: #3b82f6"></i>
            </div>
          </div>
          <div class="flex items-end gap-1 mb-3">
            <p class="text-3xl font-extrabold" style="color: #3b82f6">
              {{ resumen.vehiculos_disponibles }}
            </p>
            <p class="text-lg font-bold mb-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              /
              {{
                resumen.total_flota ?? resumen.vehiculos_disponibles + resumen.vehiculos_ocupados
              }}
            </p>
          </div>
          <div
            class="w-full h-1.5 rounded-full overflow-hidden"
            :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
          >
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{ width: pctDisponible + '%', background: '#3b82f6' }"
            />
          </div>
          <div
            class="flex justify-between mt-1.5 text-[11px]"
            :class="isDark ? 'text-gray-500' : 'text-gray-400'"
          >
            <span>Disponibilidad</span><span>{{ pctDisponible }}%</span>
          </div>
        </div>
      </div>

      <!-- FILA MEDIA: line chart + donut + resumen operativo -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <!-- Reservas por mes — barras -->
        <div :class="cardShell">
          <p
            class="text-xs font-bold uppercase tracking-widest mb-1"
            :class="isDark ? 'text-gray-500' : 'text-gray-400'"
          >
            Reservas del año
          </p>
          <p class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            por mes — {{ new Date().getFullYear() }}
          </p>
          <DashboardBarChart :data="incomeData" color="#c0392b" />
        </div>

        <!-- Flota por estado — donut -->
        <div :class="cardShell">
          <p
            class="text-xs font-bold uppercase tracking-widest mb-1"
            :class="isDark ? 'text-gray-500' : 'text-gray-400'"
          >
            Vehículos por estado
          </p>
          <p class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            distribución actual
          </p>
          <DashboardDonutChart :data="donutData" />
        </div>

        <!-- Resumen operativo -->
        <div :class="cardShell">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-pie text-sm" style="color: #c0392b"></i>
              <p class="text-xs font-bold uppercase tracking-widest" style="color: #c0392b">
                Resumen operativo
              </p>
            </div>
            <div class="flex gap-1">
              <button
                v-for="tab in ['Hoy', 'Mes']"
                :key="tab"
                type="button"
                @click="activeTab = tab"
                class="text-xs font-bold px-3 py-1 rounded-full transition-all"
                :style="
                  activeTab === tab
                    ? { background: '#c0392b', color: 'white' }
                    : { color: isDark ? '#9ca3af' : '#6b7280' }
                "
              >
                {{ tab }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p
                class="text-2xl font-extrabold"
                :class="isDark ? 'text-gray-100' : 'text-gray-800'"
              >
                {{ activeTab === "Hoy" ? resumen.reservas_dia : resumen.reservas_mes }}
              </p>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Reservas</p>
            </div>
            <div>
              <p
                class="text-2xl font-extrabold"
                :class="isDark ? 'text-gray-100' : 'text-gray-800'"
              >
                {{ resumen.vehiculos_disponibles }} / {{ resumen.total_flota ?? totalFlotaCalc }}
              </p>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Disponibles</p>
            </div>
          </div>

          <div class="space-y-3">
            <DashboardProgressRow label="Flota disponible" :value="pctDisponible" color="#22c55e" />
            <DashboardProgressRow label="Vehículos ocupados" :value="pctOcupados" color="#f0a500" />
            <DashboardProgressRow
              label="Reservas del mes"
              :value="Math.min(resumen.reservas_mes, 100)"
              color="#c0392b"
            />
            <DashboardProgressRow label="Ocupación flota" :value="pctOcupados" color="#3b82f6" />
          </div>
        </div>
      </div>

      <!-- FILA INFERIOR: últimas reservas full ancho -->
      <div :class="cardShell">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-800'">
            Últimas reservas
          </p>
          <button class="text-xs font-semibold hover:underline" style="color: #c0392b">
            Ver todo
          </button>
        </div>

        <!-- tabla -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr :class="isDark ? 'border-gray-800' : 'border-gray-100'" class="border-b">
                <th
                  class="text-left pb-2 text-xs font-bold uppercase tracking-widest"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  #
                </th>
                <th
                  class="text-left pb-2 text-xs font-bold uppercase tracking-widest"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  Cliente
                </th>
                <th
                  class="text-left pb-2 text-xs font-bold uppercase tracking-widest"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  Vehículo
                </th>
                <th
                  class="text-left pb-2 text-xs font-bold uppercase tracking-widest"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  Placa
                </th>
                <th
                  class="text-left pb-2 text-xs font-bold uppercase tracking-widest"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  Fecha inicio
                </th>
                <th
                  class="text-left pb-2 text-xs font-bold uppercase tracking-widest"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in ultimasReservas"
                :key="r.id"
                class="border-b last:border-0 transition-colors"
                :class="
                  isDark
                    ? 'border-gray-800 hover:bg-gray-800/40'
                    : 'border-gray-50 hover:bg-gray-50'
                "
              >
                <td class="py-3 font-semibold" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                  #{{ r.id }}
                </td>
                <td class="py-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                  {{ r.cliente?.nombre ?? "N/D" }}
                </td>
                <td class="py-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                  {{ r.vehiculo?.modelo?.marca?.nombre ?? "" }}
                  {{ r.vehiculo?.modelo?.nombre ?? "" }}
                </td>
                <td
                  class="py-3 font-mono text-xs"
                  :class="isDark ? 'text-gray-400' : 'text-gray-500'"
                >
                  {{ r.vehiculo?.placa ?? "—" }}
                </td>
                <td class="py-3 text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  {{ formatFecha(r.fecha_inicio) }}
                </td>
                <td class="py-3">
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    :style="{
                      background: estadoBadge(r.estado).color + '20',
                      color: estadoBadge(r.estado).color,
                    }"
                    >{{ estadoBadge(r.estado).label }}</span
                  >
                </td>
              </tr>
              <tr v-if="!ultimasReservas.length">
                <td
                  colspan="6"
                  class="py-6 text-center text-xs"
                  :class="isDark ? 'text-gray-600' : 'text-gray-400'"
                >
                  Sin reservas registradas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAppTheme } from "@/composables/useAppTheme";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import DashboardProgressRow from "@/components/dashboard/DashboardProgressRow.vue";
import DashboardDonutChart from "@/components/dashboard/DashboardDonutChart.vue";
import DashboardBarChart from "@/components/dashboard/DashboardBarChart.vue";
import { formatFecha } from "@/utils/reservaFormatters";

const { isDark } = useAppTheme();
const authStore = useAuthStore();

const cardShell = computed(() =>
  isDark.value
    ? "rounded-2xl border shadow-sm p-5 bg-gray-900 border-gray-800"
    : "rounded-2xl border shadow-sm p-5 bg-white border-gray-100",
);

const today = computed(() =>
  new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
);

const mesActual = computed(() =>
  new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
);

// ── estado ──
const activeTab = ref("Hoy");
const loading = ref(true);
const error = ref(null);

const resumen = ref({
  reservas_dia: 0,
  reservas_mes: 0,
  vehiculos_disponibles: 0,
  vehiculos_ocupados: 0,
  total_flota: 0,
});
const reservasPorMes = ref([]);
const vehiculosPorEstado = ref([]);
const ultimasReservas = ref([]);

async function fetchDashboard() {
  try {
    loading.value = true;
    const { data } = await api.get("/admin/dashboard/resumen");
    resumen.value = data.resumen;
    reservasPorMes.value = data.graficas.reservas_por_mes;
    vehiculosPorEstado.value = data.graficas.vehiculos_por_estado;
    ultimasReservas.value = data.ultimas_reservas;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchDashboard);

// ── flota ──
const totalFlotaCalc = computed(
  () => (resumen.value.vehiculos_disponibles ?? 0) + (resumen.value.vehiculos_ocupados ?? 0),
);
const pctDisponible = computed(() => {
  const total = resumen.value.total_flota || totalFlotaCalc.value;
  return total ? Math.round((resumen.value.vehiculos_disponibles / total) * 100) : 0;
});
const pctOcupados = computed(() => {
  const total = resumen.value.total_flota || totalFlotaCalc.value;
  return total ? Math.round((resumen.value.vehiculos_ocupados / total) * 100) : 0;
});

// ── estados MAYÚSCULAS ──
const colorMap = {
  DISPONIBLE: "#22c55e",
  RESERVADO: "#f0a500",
  RENTADO: "#3b82f6",
  MANTENIMIENTO: "#ef4444",
};
const labelMap = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  RENTADO: "Rentado",
  MANTENIMIENTO: "Mantenimiento",
};
function estadoColor(e) {
  return colorMap[e] ?? "#9ca3af";
}
function estadoLabel(e) {
  return labelMap[e] ?? e;
}

// ── bar chart: 12 meses ──
const incomeData = computed(() => {
  const arr = Array(12).fill(0);
  reservasPorMes.value.forEach(({ mes, total }) => {
    arr[mes - 1] = total;
  });
  return arr;
});

// ── donut ──
const donutData = computed(() =>
  vehiculosPorEstado.value.map((v) => ({
    label: estadoLabel(v.estado),
    value: v.total,
    color: estadoColor(v.estado),
  })),
);

// ── badge reservas ──
function estadoBadge(estado) {
  const map = {
    pendiente: { label: "Pendiente", color: "#f0a500" },
    activa: { label: "Activa", color: "#3b82f6" },
    completada: { label: "Completada", color: "#22c55e" },
    cancelada: { label: "Cancelada", color: "#ef4444" },
  };
  return map[estado?.toLowerCase()] ?? { label: estado ?? "Nueva", color: "#c0392b" };
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap");
</style>

