<template>
  <div class="reserva-wizard-root" :class="isDark ? 'bg-gray-950' : 'bg-gray-50'">
    <div class="reserva-wizard-body">
      <div class="reserva-wizard-main">
        <div class="reserva-wizard-header">
          <button
            type="button"
            @click="volver"
            class="w-10 h-10 rounded-xl flex items-center justify-center border transition-all hover:shadow-sm"
            :class="
              isDark
                ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            title="Volver"
          >
            <i class="pi pi-arrow-left text-sm"></i>
          </button>
          <div>
            <h1 class="text-2xl font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
              Nueva reserva
            </h1>
            <p class="text-sm mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              Completa los datos para registrar la reserva
            </p>
          </div>
        </div>

        <div class="space-y-5">
          <ReservaClienteBuscar
            v-model:busqueda="busquedaCliente"
            :cliente-seleccionado="clienteSeleccionado"
            :resultados="resultadosClientes"
            :buscando="buscandoClientes"
            :error="errorListadoClientes"
            :paginacion="paginacionClientes"
            @buscar="onBuscarCliente"
            @seleccionar="seleccionarCliente"
            @limpiar="limpiarCliente"
            @cambiar-pagina="cambiarPaginaClientes"
            @agregar-nuevo="abrirModalCliente"
          />

          <ReservaFechas
            v-if="clientePuedeReservar"
            v-model:fecha-inicio="fechaInicio"
            v-model:fecha-fin="fechaFin"
            v-model:tipo-reserva="tipoReserva"
            :hoy="hoy"
            :min-fecha-inicio="minFechaInicio"
            :error-inicio="errorFechaInicio"
            :error-fin="errorFechaFin"
            :dias-reserva="diasReserva"
            :tipo-reserva="tipoReserva"
            @change="onFechasChange"
          />

          <ReservaVehiculosDisponibles
            v-if="clientePuedeReservar"
            :fecha-inicio="fechaInicio"
            :fecha-fin="fechaFin"
            :vehiculos="vehiculosDisponibles"
            :vehiculo-seleccionado="vehiculoSeleccionado"
            :cargando="cargandoVehiculos"
            :consultados="vehiculosConsultados"
            @seleccionar="seleccionarVehiculo"
          />

          <p v-if="errorGlobal" class="text-sm text-center font-medium" style="color: #c0392b">
            {{ errorGlobal }}
          </p>
        </div>
      </div>

      <div class="reserva-wizard-summary">
        <ReservaResumen
          :cliente="clienteSeleccionado"
          :fecha-inicio="fechaInicio"
          :fecha-fin="fechaFin"
          :vehiculo="vehiculoSeleccionado"
          :dias-reserva="diasReserva"
          :tipo-reserva="tipoReservaLabel"
          :precio-estimado="precioEstimado"
          :puede-confirmar="puedeConfirmar"
          :creando="creando"
          @confirmar="confirmarReserva"
        />
      </div>
    </div>

    <ClientesModal
      :visible="modalClienteAbierto"
      :modo-edicion="false"
      :cliente="null"
      :guardando="guardandoCliente"
      :server-errors="erroresCliente"
      :submit-error="errorCliente"
      @guardar="onClienteCreado"
      @cerrar="modalClienteAbierto = false"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import ClientesModal from "@/components/clientes/ClientesModal.vue";
import ReservaClienteBuscar from "@/components/reservas/ReservaClienteBuscar.vue";
import ReservaFechas from "@/components/reservas/ReservaFechas.vue";
import ReservaVehiculosDisponibles from "@/components/reservas/ReservaVehiculosDisponibles.vue";
import ReservaResumen from "@/components/reservas/ReservaResumen.vue";
import { useClientesStore } from "@/stores/clientes";
import { useReservasStore } from "@/stores/reservas";
import { useAppTheme } from "@/composables/useAppTheme";
import { fechaHoyLocal, sumarDiasISO, diasEntreFechasISO } from "@/utils/reservaFormatters";
import { documentosVigentes } from "@/utils/contratoFormatters";
import { pasaFechaMaxima, mensajeFechaMaxima } from "@/utils/rangoFechas";
import { toastSuccess } from "@/utils/toast";

const router = useRouter();
const { isDark } = useAppTheme();
const clientesStore = useClientesStore();
const reservasStore = useReservasStore();

const clienteSeleccionado = ref(null);
const clientePuedeReservar = computed(() => documentosVigentes(clienteSeleccionado.value).ok);
const mensajeLicencia = "No se puede reservar: la licencia debe vencer después de hoy. Actualiza la licencia desde Clientes para continuar.";
const busquedaCliente = ref("");
const resultadosClientes = ref([]);
const buscandoClientes = ref(false);
const errorListadoClientes = ref("");
const paginacionClientes = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
});
const modalClienteAbierto = ref(false);
const guardandoCliente = ref(false);
const erroresCliente = ref({});
const errorCliente = ref('');
let debounceTimer = null;
let consultaClientesVersion = 0;
let consultaVehiculosTimer = null;
let consultaVehiculosVersion = 0;

const fechaInicio = ref("");
const fechaFin = ref("");
const tipoReserva = ref("ANTISIPADA");
const errorFechaInicio = ref("");
const errorFechaFin = ref("");

const vehiculosDisponibles = ref([]);
const vehiculoSeleccionado = ref(null);
const cargandoVehiculos = ref(false);
const vehiculosConsultados = ref(false);

const errorGlobal = ref("");
const creando = ref(false);

function escaparHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function htmlAdvertenciaIncidencias(advertencia, incidencias = []) {
  if (!advertencia) return "";
  const lista = incidencias.slice(0, 3)
    .map((i) => `<li><strong>${escaparHtml(i.tipo_incidencia || "Incidencia")}:</strong> ${escaparHtml(i.descripcion || "Sin descripción")}</li>`)
    .join("");
  const extra = incidencias.length > 3 ? `<p style="margin-top:.5rem;">Y ${incidencias.length - 3} más.</p>` : "";
  return `
    <p style="margin-bottom:.75rem;">${escaparHtml(advertencia)}</p>
    ${lista ? `<ul style="text-align:left; padding-left:1.25rem; margin:0;">${lista}</ul>${extra}` : ""}
  `;
}

const hoy = computed(() => fechaHoyLocal());
const manana = computed(() => sumarDiasISO(hoy.value, 1));
const minFechaInicio = computed(() => manana.value);

watch(fechaInicio, (val) => {
  if (!val) return;
  tipoReserva.value = "ANTISIPADA";
});

const diasReserva = computed(() =>
  diasEntreFechasISO(fechaInicio.value, fechaFin.value),
);

const tipoReservaLabel = computed(() => "Reserva");

const precioEstimado = computed(() => {
  const precio = vehiculoSeleccionado.value?.categoria?.precio_dia;
  if (!precio) return null;
  return Number(precio) * diasReserva.value;
});

const puedeConfirmar = computed(
  () =>
    clientePuedeReservar.value &&
    !!fechaInicio.value &&
    !!fechaFin.value &&
    !!tipoReserva.value &&
    !!vehiculoSeleccionado.value &&
    !errorFechaInicio.value &&
    !errorFechaFin.value,
);

async function cargarClientes(page = 1) {
  const version = ++consultaClientesVersion;
  buscandoClientes.value = true;
  errorListadoClientes.value = "";
  await clientesStore.fetchClientes({
    page,
    ...(busquedaCliente.value.trim() ? { search: busquedaCliente.value.trim() } : {}),
  });
  if (version !== consultaClientesVersion) return;
  resultadosClientes.value = [...clientesStore.clientes];
  paginacionClientes.value = { ...clientesStore.pagination };
  errorListadoClientes.value = clientesStore.error || "";
  buscandoClientes.value = false;
}

function onBuscarCliente() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    cargarClientes(1);
  }, 300);
}

function cambiarPaginaClientes(page) {
  if (
    buscandoClientes.value
    || page < 1
    || page > paginacionClientes.value.last_page
    || page === paginacionClientes.value.current_page
  ) return;
  cargarClientes(page);
}

function seleccionarCliente(c) {
  clearTimeout(debounceTimer);
  debounceTimer = null;
  clienteSeleccionado.value = c;
  errorGlobal.value = "";
}

function limpiarCliente() {
  clearTimeout(debounceTimer);
  debounceTimer = null;
  clienteSeleccionado.value = null;
  errorGlobal.value = "";
}

function limpiarDatosReserva() {
  fechaInicio.value = "";
  fechaFin.value = "";
  tipoReserva.value = "";
  onFechasChange();
}

watch([clienteSeleccionado, clientePuedeReservar], limpiarDatosReserva, { flush: "sync" });

function abrirModalCliente() {
  erroresCliente.value = {};
  errorCliente.value = '';
  modalClienteAbierto.value = true;
}

async function onClienteCreado(form) {
  guardandoCliente.value = true;
  erroresCliente.value = {};
  errorCliente.value = '';
  try {
    const creado = await clientesStore.crear(form);
    resultadosClientes.value = [
      creado,
      ...resultadosClientes.value.filter((cliente) => cliente.id !== creado.id),
    ];
    paginacionClientes.value.total = Number(paginacionClientes.value.total || 0) + 1;
    seleccionarCliente(creado);
    modalClienteAbierto.value = false;
    toastSuccess("Cliente registrado", `${creado.nombre} se agregó correctamente.`);
  } catch (e) {
    const backendErrors = e.response?.data?.errors || {};
    erroresCliente.value = backendErrors;
    const firstError = Object.values(backendErrors).flat()[0];
    errorCliente.value = firstError ? '' : (e.response?.data?.message || clientesStore.error || 'No se pudo registrar el cliente.');
  } finally {
    guardandoCliente.value = false;
  }
}

function onFechasChange() {
  clearTimeout(consultaVehiculosTimer);
  consultaVehiculosTimer = null;
  consultaVehiculosVersion++;
  errorGlobal.value = "";
  errorFechaInicio.value = "";
  errorFechaFin.value = "";
  cargandoVehiculos.value = false;
  vehiculosConsultados.value = false;
  vehiculosDisponibles.value = [];
  vehiculoSeleccionado.value = null;
}

function mensajeErrorValidacion(e) {
  const errs = e.response?.data?.errors;
  if (errs && typeof errs === "object") {
    const first = Object.values(errs).flat()[0];
    if (first) return first;
  }
  return e.response?.data?.message || reservasStore.error || "No se pudo crear la reserva.";
}

function validarFechas() {
  errorFechaInicio.value = "";
  errorFechaFin.value = "";
  if (!fechaInicio.value) {
    errorFechaInicio.value = "Requerido";
    return false;
  }
  if (!fechaFin.value) {
    errorFechaFin.value = "Requerido";
    return false;
  }
  if (fechaInicio.value < manana.value) {
    errorFechaInicio.value = "La reserva debe iniciar al menos mañana.";
    return false;
  }
  if (fechaFin.value <= fechaInicio.value) {
    errorFechaFin.value = "Debe ser posterior a la fecha de inicio.";
    return false;
  }
  if (pasaFechaMaxima(fechaInicio.value)) {
    errorFechaInicio.value = mensajeFechaMaxima();
    return false;
  }
  if (pasaFechaMaxima(fechaFin.value)) {
    errorFechaFin.value = mensajeFechaMaxima();
    return false;
  }
  return true;
}

async function consultarVehiculos() {
  if (!documentosVigentes(clienteSeleccionado.value).ok || !validarFechas()) return;
  const version = ++consultaVehiculosVersion;
  errorGlobal.value = "";
  cargandoVehiculos.value = true;
  vehiculosConsultados.value = false;
  vehiculoSeleccionado.value = null;
  vehiculosDisponibles.value = [];
  try {
    const disponibles = await reservasStore.fetchVehiculosDisponiblesParaReserva(
      fechaInicio.value,
      fechaFin.value,
    );
    if (version !== consultaVehiculosVersion || !documentosVigentes(clienteSeleccionado.value).ok) return;
    vehiculosDisponibles.value = disponibles;
    vehiculosConsultados.value = true;
  } catch (e) {
    if (version !== consultaVehiculosVersion || !documentosVigentes(clienteSeleccionado.value).ok) return;
    errorGlobal.value = e.response?.data?.message || e.message || "No se pudieron consultar los vehículos.";
    vehiculosDisponibles.value = [];
    vehiculosConsultados.value = false;
  } finally {
    if (version === consultaVehiculosVersion) cargandoVehiculos.value = false;
  }
}

watch([fechaInicio, fechaFin], () => {
  onFechasChange();
  if (!clientePuedeReservar.value || !fechaInicio.value || !fechaFin.value) return;
  consultaVehiculosTimer = setTimeout(() => {
    consultaVehiculosTimer = null;
    consultarVehiculos();
  }, 400);
});

onMounted(() => cargarClientes(1));

onUnmounted(() => {
  clearTimeout(debounceTimer);
  clearTimeout(consultaVehiculosTimer);
  consultaClientesVersion++;
  consultaVehiculosVersion++;
});

function seleccionarVehiculo(v) {
  if (!documentosVigentes(clienteSeleccionado.value).ok) return;
  vehiculoSeleccionado.value = v;
  errorGlobal.value = "";
}

async function confirmarReserva() {
  if (!clienteSeleccionado.value) {
    errorGlobal.value = "Selecciona un cliente.";
    return;
  }
  if (!documentosVigentes(clienteSeleccionado.value).ok) {
    limpiarDatosReserva();
    errorGlobal.value = mensajeLicencia;
    return;
  }
  if (!validarFechas()) return;
  tipoReserva.value = "ANTISIPADA";
  if (!vehiculoSeleccionado.value) {
    errorGlobal.value = "Selecciona un vehículo.";
    return;
  }

  creando.value = true;
  errorGlobal.value = "";
  try {
    await reservasStore.crear({
      cliente_id: clienteSeleccionado.value.id,
      vehiculo_id: vehiculoSeleccionado.value.id,
      fecha_inicio: fechaInicio.value,
      fecha_fin: fechaFin.value,
    });
    const advertenciaReserva = reservasStore.advertencia;
    const htmlAdvertencia = htmlAdvertenciaIncidencias(advertenciaReserva, reservasStore.incidenciasPendientes);
    if (htmlAdvertencia) {
      await Swal.fire({
        icon: "warning",
        title: "Reserva creada",
        html: htmlAdvertencia,
        confirmButtonColor: "#c0392b",
        confirmButtonText: "Ver reservas",
        background: isDark.value ? "#1f2937" : "#fff",
        color: isDark.value ? "#f3f4f6" : "#111827",
      });
    } else {
      toastSuccess("Reserva creada", "La reserva se registró correctamente.");
    }
    router.push({ name: "reservas" });
  } catch (e) {
    if (e.response?.status === 401) {
      await Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "Tu sesión ya no es válida. Inicia sesión de nuevo.",
        confirmButtonColor: "#c0392b",
        background: isDark.value ? "#1f2937" : "#fff",
        color: isDark.value ? "#f3f4f6" : "#111827",
      });
      return;
    }
    await Swal.fire({
      icon: "error",
      title: "Error al crear reserva",
      text: mensajeErrorValidacion(e),
      confirmButtonColor: "#c0392b",
      background: isDark.value ? "#1f2937" : "#fff",
      color: isDark.value ? "#f3f4f6" : "#111827",
    });
  } finally {
    creando.value = false;
  }
}

function volver() {
  router.push({ name: "reservas" });
}
</script>

<style scoped>
.reserva-wizard-root {
  min-height: 100vh;
}

.reserva-wizard-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;
  margin: 0;
  padding: 0 1.5rem 2rem;
  box-sizing: border-box;
  align-items: start;
}

.reserva-wizard-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.reserva-wizard-main,
.reserva-wizard-summary {
  min-width: 0;
}

@media (min-width: 1024px) {
  :global(html:has(.reserva-wizard-root)),
  :global(body:has(.reserva-wizard-root)) {
    overflow: hidden;
  }

  .reserva-wizard-root {
    height: calc(100vh - 6.5rem);
    min-height: 0;
    overflow: hidden;
  }

  .reserva-wizard-body {
    height: 100%;
    min-height: 0;
    grid-template-columns: minmax(0, 7fr) minmax(320px, 3fr);
    padding-bottom: 1rem;
    overflow: hidden;
    align-items: stretch;
  }

  .reserva-wizard-main {
    height: 100%;
    overflow-y: auto;
    padding-right: 0.35rem;
    scrollbar-gutter: stable;
  }

  .reserva-wizard-summary {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
}
</style>
