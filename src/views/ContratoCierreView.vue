<template>
  <div class="cierre-root" :class="isDark ? 'cierre-root--dark' : 'cierre-root--light'">
    <header class="cierre-header">
      <button type="button" class="cierre-back" :disabled="operacionEnCurso" @click="volverAContratos">
        <i class="pi pi-arrow-left"></i>
      </button>
      <div class="flex-1 min-w-0">
        <p class="cierre-kicker">Finalizacion de renta</p>
        <h1 class="cierre-title">Cierre de renta</h1>
      </div>
      <span v-if="contrato" class="cierre-badge">{{ contrato.numero_contrato }}</span>
    </header>

    <div v-if="cargando" class="cierre-loading">
      <i class="pi pi-spin pi-spinner text-xl"></i>
      <span>Cargando contrato...</span>
    </div>

    <div v-else-if="contrato" class="cierre-layout">
      <div class="cierre-main">
        <div v-if="resultadoGuardado || errorRecarga" class="cierre-alert" role="status" aria-live="polite">
          <p v-if="resultadoGuardado">{{ resultadoGuardado }}</p>
          <p v-if="errorRecarga">{{ errorRecarga }} Los datos pueden estar desactualizados. Actualiza antes de guardar o cerrar.</p>
          <button v-if="errorRecarga" type="button" class="cierre-alert-btn" :disabled="operacionEnCurso" @click="reintentarRecarga">
            Actualizar datos
          </button>
        </div>
        <div class="cierre-info-banner">
          <div v-for="info in infoContrato" :key="info.label" class="cierre-info-item">
            <i :class="['pi', info.icon]"></i>
            <div>
              <p class="cierre-info-label">{{ info.label }}</p>
              <p class="cierre-info-value">{{ info.value }}</p>
            </div>
          </div>
        </div>

        <section class="cierre-card">
          <div class="cierre-card-head">
            <span class="cierre-step">1</span>
            <h2>Inspección del vehículo</h2>
          </div>
          <div class="cierre-field">
            <label>Observaciones de entrega</label>
            <div class="cierre-readonly">
              {{ contrato.observaciones_entrega || "Sin observaciones registradas en la entrega." }}
            </div>
          </div>
          <div class="cierre-field">
            <label>Estado y observaciones al recibir</label>
            <textarea
              v-model="observacionesRecepcion"
              :disabled="operacionEnCurso"
              rows="3"
              class="cierre-input"
              placeholder="Describe rayones, golpes, limpieza u otros detalles..."
            ></textarea>
          </div>
        </section>

        <div class="cierre-grid-2">
          <section class="cierre-card">
            <div class="cierre-card-head">
              <span class="cierre-step">2</span>
              <h2>Combustible</h2>
            </div>
            <div class="cierre-fuel-row">
              <div class="cierre-fuel-col">
                <span class="cierre-fuel-tag">Entrega</span>
                <span class="cierre-fuel-val cierre-fuel-val--red">{{ entregaLabel }}</span>
                <div class="cierre-fuel-meter cierre-fuel-meter--readonly" :style="{ '--fuel-fill': `${pctEntrega}%` }">
                  <div class="cierre-fuel-fill"></div>
                </div>
              </div>
              <div class="cierre-fuel-col">
                <span class="cierre-fuel-tag">Recepcion</span>
                <span class="cierre-fuel-val cierre-fuel-val--gold">{{ combLabel }}</span>
                <div class="cierre-fuel-meter" :style="{ '--fuel-fill': `${pctRecepcion}%` }">
                  <div class="cierre-fuel-fill"></div>
                  <button
                    v-for="nivel in NIVELES_COMBUSTIBLE"
                    :key="nivel.value"
                    type="button"
                    class="cierre-fuel-point"
                    :disabled="operacionEnCurso"
                    :class="{ 'cierre-fuel-point--active': nivel.value === nivelRecepcion }"
                    :style="{ left: `${nivel.pct}%` }"
                    :aria-label="`Seleccionar ${nivel.label}`"
                    @click="seleccionarCombustible(nivel.value)"
                  >
                    <span></span>
                  </button>
                </div>
                <div class="cierre-fuel-labels">
                  <button
                    v-for="nivel in NIVELES_COMBUSTIBLE"
                    :key="`fuel-label-${nivel.value}`"
                    type="button"
                    :disabled="operacionEnCurso"
                    :class="{ 'cierre-fuel-label--active': nivel.value === nivelRecepcion }"
                    @click="seleccionarCombustible(nivel.value)"
                  >
                    {{ combustibleCorto(nivel) }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="alertaCombustible" class="cierre-alert">
              <i class="pi pi-exclamation-triangle"></i>
              <span>Combustible menor al entregado</span>
              <button type="button" class="cierre-alert-btn" :disabled="operacionEnCurso" @click="agregarCargoCombustible">
                + Cargo $10
              </button>
            </div>
          </section>

          <section class="cierre-card">
            <div class="cierre-card-head">
              <span class="cierre-step">3</span>
              <h2>Retraso</h2>
            </div>
            <div v-if="horasRetraso > 0" class="cierre-status cierre-status--warn">
              <i class="pi pi-clock"></i>
              <div class="flex-1">
                <p class="cierre-status-title">{{ horasRetraso }} hora(s) de retraso</p>
                <label class="cierre-check">
                  <input v-model="aplicarCargoRetraso" :disabled="operacionEnCurso" type="checkbox" />
                  <span>Aplicar cargo por retraso al cierre</span>
                </label>
                <input
                  v-if="aplicarCargoRetraso"
                  v-model.number="montoRetraso"
                  :disabled="operacionEnCurso"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="cierre-input cierre-input--sm cierre-input--amount mt-2"
                />
              </div>
            </div>
            <div v-else class="cierre-status cierre-status--ok">
              <i class="pi pi-check-circle"></i>
              <p class="cierre-status-title">Devolucion a tiempo</p>
            </div>
          </section>
        </div>

        <section class="cierre-card">
          <div class="cierre-card-head">
            <span class="cierre-step">4</span>
            <h2>Cargos adicionales antes de cerrar</h2>
            <button
              type="button"
              class="cierre-add-btn"
              @click="agregarCargoNuevo()"
              :disabled="operacionEnCurso"
            >
              <i class="pi pi-plus"></i> Agregar
            </button>
          </div>
          <p class="cierre-helper">
            Si agregas cargos aqui, primero se registran y se cobran en Pagos. Luego puedes volver a
            cerrar la renta.
          </p>
          <div v-if="cargosRegistrados.length" class="cierre-registered-cargos">
            <div class="cierre-registered-head">
              <span>Cargos registrados</span>
              <strong>${{ formatPrecio(totalCargosRegistrados) }}</strong>
            </div>
            <div v-for="cargo in cargosRegistrados" :key="cargo.id || `${cargo.tipo_cargo}-${cargo.concepto}`" class="cierre-registered-row">
              <span>{{ labelTipoCargo(cargo.tipo_cargo) }}</span>
              <p>{{ cargo.concepto }}</p>
              <strong>${{ formatPrecio(cargo.monto) }}</strong>
            </div>
          </div>
          <div v-if="!cargosRegistrados.length && !cargos.length" class="cierre-empty-cargos">Sin cargos adicionales</div>
          <div v-for="(cargo, i) in cargos" :key="i" class="cierre-cargo-row">
            <select
              v-model="cargo.tipo_cargo"
              :disabled="operacionEnCurso"
              class="cierre-input cierre-input--sm cierre-input--type"
            >
              <option value="" disabled>Selecciona tipo</option>
              <option value="COMBUSTIBLE">Combustible</option>
              <option value="DANIO">Daño</option>
              <option value="DIA EXTRA">Día extra</option>
              <option value="OTRO">Otro</option>
            </select>
            <input
              v-model="cargo.concepto"
              :disabled="operacionEnCurso"
              class="cierre-input cierre-input--sm"
              placeholder="Concepto del cargo"
            />
            <input
              v-model.number="cargo.monto"
              :disabled="operacionEnCurso"
              type="number"
              min="0"
              class="cierre-input cierre-input--sm cierre-input--amount"
              placeholder="0.00"
            />
            <button type="button" class="cierre-remove-btn" :disabled="operacionEnCurso" @click="eliminarCargo(i)">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div v-if="cargos.length" class="cierre-save-row">
            <p class="cierre-extras-total">
              Total por registrar: <strong>${{ formatPrecio(totalExtras) }}</strong>
            </p>
            <button
              type="button"
              class="cierre-save-btn"
              :disabled="operacionEnCurso || Boolean(errorRecarga)"
              @click="guardarCargosPendientes"
            >
              <i :class="guardandoCargos ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
              Guardar cargos
            </button>
          </div>
        </section>

        <section class="cierre-card">
          <div class="cierre-card-head">
            <span class="cierre-step">5</span>
            <h2>Incidencias detectadas</h2>
            <button
              type="button"
              class="cierre-add-btn"
              @click="agregarIncidenciaNueva()"
              :disabled="operacionEnCurso"
            >
              <i class="pi pi-plus"></i> Agregar
            </button>
          </div>
          <p class="cierre-helper">
            Registra daños estéticos o mecánicos encontrados al recibir el vehículo. Si el responsable es el cliente y hay costo, se suma al contrato.
          </p>
          <div v-if="incidenciasRegistradas.length" class="cierre-registered-cargos cierre-registered-incidencias">
            <div class="cierre-registered-head">
              <span>Incidencias registradas</span>
              <strong>${{ formatPrecio(totalIncidenciasClienteRegistradas) }}</strong>
            </div>
            <div v-for="incidencia in incidenciasRegistradas" :key="incidencia.id || `${incidencia.tipo_incidencia}-${incidencia.descripcion}`" class="cierre-registered-row cierre-registered-row--incidencia">
              <span>{{ labelTipoIncidencia(incidencia.tipo_incidencia) }}</span>
              <p>{{ incidencia.descripcion || 'Sin descripción' }}</p>
              <strong>{{ incidencia.responsable_tipo === 'CLIENTE' ? `$${formatPrecio(incidencia.costo)}` : labelResponsableIncidencia(incidencia.responsable_tipo) }}</strong>
            </div>
          </div>
          <div v-if="!incidenciasRegistradas.length && !incidencias.length" class="cierre-empty-cargos">Sin incidencias registradas</div>
          <div v-for="(incidencia, i) in incidencias" :key="i" class="cierre-incidencia-row">
            <select
              v-model="incidencia.tipo_incidencia"
              :disabled="operacionEnCurso"
              class="cierre-input cierre-input--sm cierre-input--type"
            >
              <option value="" disabled>Tipo</option>
              <option value="DANIO ESTETICO">Daño estético</option>
              <option value="DANIO MECANICO">Daño mecánico</option>
            </select>
            <select
              v-model="incidencia.responsable_tipo"
              :disabled="operacionEnCurso"
              class="cierre-input cierre-input--sm cierre-input--responsable"
            >
              <option value="CLIENTE">Cliente</option>
              <option value="NEGOCIO">Negocio</option>
              <option value="TERCERO">Tercero</option>
              <option value="NO DETERMINADO">No determinado</option>
            </select>
            <input
              v-model="incidencia.descripcion"
              :disabled="operacionEnCurso"
              class="cierre-input cierre-input--sm"
              placeholder="Descripción de la incidencia"
            />
            <input
              v-model.number="incidencia.costo"
              :disabled="operacionEnCurso"
              type="number"
              min="0"
              step="0.01"
              class="cierre-input cierre-input--sm cierre-input--amount"
              placeholder="0.00"
            />
            <button type="button" class="cierre-remove-btn" :disabled="operacionEnCurso" @click="eliminarIncidencia(i)">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div v-if="incidencias.length" class="cierre-save-row">
            <p class="cierre-extras-total">
              Total por registrar al cliente: <strong>${{ formatPrecio(totalIncidenciasClientePorRegistrar) }}</strong>
            </p>
            <button
              type="button"
              class="cierre-save-btn"
              :disabled="operacionEnCurso || Boolean(errorRecarga)"
              @click="guardarIncidenciasPendientes"
            >
              <i :class="guardandoIncidencias ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
              Guardar incidencias
            </button>
          </div>
        </section>
      </div>

      <aside class="cierre-ticket">
        <div class="cierre-ticket-perf"></div>
        <div class="cierre-ticket-head">
          <div class="cierre-ticket-icon"><i class="pi pi-flag"></i></div>
          <div>
            <p class="cierre-ticket-brand">Liquidacion final</p>
            <p class="cierre-ticket-sub">Revisa antes de cerrar</p>
          </div>
        </div>
        <div class="cierre-ticket-line"></div>
        <div class="cierre-ticket-rows">
          <div class="cierre-ticket-row">
            <span>Total contrato</span>
            <strong>${{ formatPrecio(contrato.monto_total_renta) }}</strong>
          </div>
          <div class="cierre-ticket-row">
            <span>Cargos registrados</span>
            <strong class="cierre-ticket-gold">+${{ formatPrecio(totalCargosRegistrados) }}</strong>
          </div>
          <div v-if="totalExtras > 0" class="cierre-ticket-row">
            <span>Cargos por registrar</span>
            <strong class="cierre-ticket-gold">+${{ formatPrecio(totalExtras) }}</strong>
          </div>
          <div v-if="totalIncidenciasClientePorRegistrar > 0" class="cierre-ticket-row">
            <span>Incidencias por registrar</span>
            <strong class="cierre-ticket-gold">+${{ formatPrecio(totalIncidenciasClientePorRegistrar) }}</strong>
          </div>
          <div v-if="aplicarCargoRetraso" class="cierre-ticket-row">
            <span>Cargo por retraso</span>
            <strong class="cierre-ticket-gold">+${{ formatPrecio(montoRetraso) }}</strong>
          </div>
          <div v-if="pagadoContrato > 0" class="cierre-ticket-row">
            <span>Ya pagado</span>
            <strong>-${{ formatPrecio(pagadoContrato) }}</strong>
          </div>
        </div>
        <div class="cierre-ticket-total">
          <span>{{ saldoPendiente > 0 ? "Saldo pendiente" : "Estado de pago" }}</span>
          <p>{{ saldoPendiente > 0 ? `$${formatPrecio(saldoPendiente)}` : labelPagoContrato }}</p>
        </div>
        <p v-if="mensajeBloqueoCierre" class="cierre-ticket-note">{{ mensajeBloqueoCierre }}</p>
        <div class="cierre-ticket-actions">
          <button
            type="button"
            class="cierre-btn cierre-btn--outline"
            :disabled="operacionEnCurso || Boolean(errorRecarga) || saldoPendiente <= 0"
            @click="irACobrarSaldo"
          >
            <i :class="cobrando ? 'pi pi-spin pi-spinner' : 'pi pi-dollar'"></i>
            Cobrar saldo
          </button>
          <button
            type="button"
            class="cierre-btn cierre-btn--primary"
            :disabled="operacionEnCurso || Boolean(mensajeBloqueoCierre)"
            @click="cerrarRenta"
          >
            <i :class="cerrando ? 'pi pi-spin pi-spinner' : 'pi pi-flag'"></i>
            Cerrar renta y liberar vehículo
          </button>
        </div>
        <div class="cierre-ticket-perf cierre-ticket-perf--flip"></div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useContratosStore } from "@/stores/contratos";
import api from "@/services/api";
import { useAppTheme } from "@/composables/useAppTheme";
import { toastSuccess } from "@/utils/toast";
import { fetchAllPaginated } from "@/utils/apiPagination";
import {
  NIVELES_COMBUSTIBLE,
  normalizarNivelCombustible,
  formatPrecio,
  formatFechaHora12,
  nivelCombustiblePct,
  nombreVehiculo,
  montoPagadoContrato,
} from "@/utils/contratoFormatters";

const route = useRoute();
const router = useRouter();
const { isDark } = useAppTheme();
const store = useContratosStore();

const contrato = ref(null);
const cargando = ref(true);
const cerrando = ref(false);
const cobrando = ref(false);
const guardandoCargos = ref(false);
const guardandoIncidencias = ref(false);
const recargando = ref(false);
const errorRecarga = ref("");
const resultadoGuardado = ref("");
const operacionEnCurso = computed(() =>
  guardandoCargos.value || guardandoIncidencias.value || recargando.value || cerrando.value || cobrando.value,
);
const salidaConfirmada = ref(false);
const observacionesRecepcion = ref("");
const nivelRecepcion = ref("1/2");
const cargos = ref([]);
const cargosRegistrados = ref([]);
const incidencias = ref([]);
const incidenciasRegistradas = ref([]);
const aplicarCargoRetraso = ref(false);
const montoRetraso = ref(15);

const combIdx = computed(() => {
  const i = NIVELES_COMBUSTIBLE.findIndex((n) => n.value === normalizarNivelCombustible(nivelRecepcion.value));
  return i >= 0 ? i : 2;
});
const combLabel = computed(() => NIVELES_COMBUSTIBLE[combIdx.value]?.label);
const entregaLabel = computed(() =>
  NIVELES_COMBUSTIBLE.find((n) => n.value === normalizarNivelCombustible(contrato.value?.nivel_combustible_entrega))?.label ||
  contrato.value?.nivel_combustible_entrega ||
  "-",
);
const pctEntrega = computed(() => nivelCombustiblePct(contrato.value?.nivel_combustible_entrega));
const pctRecepcion = computed(() => nivelCombustiblePct(nivelRecepcion.value));
const alertaCombustible = computed(() => pctRecepcion.value < pctEntrega.value);

const horasRetraso = computed(() => {
  if (!contrato.value?.fecha_hora_devolucion) return 0;
  const devolucion = new Date(contrato.value.fecha_hora_devolucion);
  const limite = new Date(devolucion.getTime() + 2 * 3600000);
  const ahora = new Date();
  if (ahora <= limite) return 0;
  return Math.max(0, Math.ceil((ahora - devolucion) / 3600000));
});

const totalExtras = computed(() => cargosValidos().reduce((s, c) => s + Number(c.monto || 0), 0));
const tieneCargosSinGuardar = computed(() => cargos.value.length > 0);
const tieneIncidenciasSinGuardar = computed(() => incidencias.value.length > 0);
const totalCargosRegistrados = computed(() => cargosRegistrados.value.reduce((s, c) => s + Number(c.monto || 0), 0));
const totalIncidenciasClientePorRegistrar = computed(() =>
  incidencias.value
    .filter((i) => i.responsable_tipo === "CLIENTE")
    .reduce((s, i) => s + Number(i.costo || 0), 0),
);
const totalIncidenciasClienteRegistradas = computed(() =>
  incidenciasRegistradas.value
    .filter((i) => i.responsable_tipo === "CLIENTE")
    .reduce((s, i) => s + Number(i.costo || 0), 0),
);
const pagadoContrato = computed(() => montoPagadoContrato(contrato.value));
const saldoPendiente = computed(() => {
  if (!contrato.value) return 0;
  const saldoBase = Math.max(0, Number(contrato.value.monto_total_renta || 0) - pagadoContrato.value);
  return saldoBase + totalExtras.value + totalIncidenciasClientePorRegistrar.value;
});
const labelPagoContrato = computed(() =>
  contrato.value?.estado_pago === "PAGADO" ? "Pagado" : "Pendiente",
);
const mensajeBloqueoCierre = computed(() => {
  if (operacionEnCurso.value) return "Espera a que termine la operación en curso.";
  if (errorRecarga.value) return "Actualiza los datos del contrato antes de cerrar la renta.";
  if (!contrato.value) return "No se encontro el contrato.";
  if (contrato.value.estado_contrato !== "ACTIVO")
    return "Solo se puede cerrar un contrato activo.";
  if (tieneCargosSinGuardar.value)
    return "Hay cargos pendientes de guardar antes del cierre.";
  if (tieneIncidenciasSinGuardar.value)
    return "Hay incidencias pendientes de guardar antes del cierre.";
  if (saldoPendiente.value > 0)
    return "Hay saldo pendiente por pagar antes de cerrar la renta.";
  if (contrato.value.estado_pago !== "PAGADO")
    return "El contrato debe estar pagado antes de cerrar la renta.";
  if (aplicarCargoRetraso.value && (!montoRetraso.value || Number(montoRetraso.value) <= 0)) {
    return "Indica un monto válido para el cargo por retraso.";
  }
  return "";
});

const infoContrato = computed(() => {
  if (!contrato.value) return [];
  return [
    { label: "Cliente", value: contrato.value.cliente?.nombre || "-", icon: "pi-user" },
    {
      label: "Vehículo",
      value: `${nombreVehiculo(contrato.value.vehiculo)} - ${contrato.value.vehiculo?.placa || ""}`,
      icon: "pi-car",
    },
    { label: "Entrega", value: fmtFecha(contrato.value.fecha_hora_entrega), icon: "pi-sign-in" },
    {
      label: "Devolucion",
      value: fmtFecha(contrato.value.fecha_hora_devolucion),
      icon: "pi-sign-out",
    },
  ];
});

onMounted(async () => {
  window.addEventListener("beforeunload", advertirSalidaNavegador);
  try {
    contrato.value = await store.fetchContrato(route.params.id);
    nivelRecepcion.value = normalizarNivelCombustible(contrato.value.nivel_combustible_entrega) || "1/2";
    cargosRegistrados.value = cargosDesdeContrato(
      contrato.value.cargos_adicionales || contrato.value.cargosAdicionales,
    );
    cargos.value = [];
    incidencias.value = [];
    incidenciasRegistradas.value = incidenciasDesdeLista(
      contrato.value.incidencias || contrato.value.incidencias_contrato,
    );
    await cargarCargosContrato();
    await cargarIncidenciasContrato();
  } catch (e) {
    const msg =
      e.response?.status === 401
        ? "Tu sesion expiro. Vuelve a iniciar sesion."
        : e.response?.data?.message || store.error || "No se pudo cargar el contrato.";
    await Swal.fire({ icon: "error", title: "Error", text: msg, confirmButtonColor: "#922b21" });
    router.push({ name: "contratos" });
  } finally {
    cargando.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", advertirSalidaNavegador);
});

onBeforeRouteLeave(async (to) => {
  if (to.name === "login") return true;
  if (operacionEnCurso.value) return false;
  if (salidaConfirmada.value) return true;
  return confirmarSalidaConCargos();
});

onBeforeRouteUpdate((to) => to.name === "login" || (!operacionEnCurso.value && confirmarSalidaConCargos()));

function cargosDesdeContrato(lista) {
  return (lista || [])
    .filter((c) => ["PENDIENTE", "APLICADO"].includes(c.estado_cargo))
    .map((c) => ({
      id: c.id,
      concepto: c.descripcion || c.concepto || "Cargo adicional",
      monto: Number(c.monto),
      tipo_cargo: c.tipo_cargo || "OTRO",
      estado_cargo: c.estado_cargo || "PENDIENTE",
    }))
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
}

async function cargarCargosContrato() {
  if (!contrato.value?.id) return;
  const { items } = await fetchAllPaginated(
    (params) => api.get("/admin/cargos-adicionales", { params }),
    { contrato_id: contrato.value.id, per_page: 100 },
  );
  cargosRegistrados.value = cargosDesdeContrato(items);
}

function incidenciasDesdeLista(lista) {
  return (lista || [])
    .filter((i) => i.estado_incidencia !== "ANULADA")
    .map((i) => ({
      id: i.id,
      tipo_incidencia: i.tipo_incidencia || "OTRO",
      responsable_tipo: i.responsable_tipo || "NO DETERMINADO",
      descripcion: i.descripcion || "Sin descripción",
      costo: Number(i.costo || 0),
      estado_incidencia: i.estado_incidencia || "REPORTADA",
      contrato_id: i.contrato_id || i.contrato?.id,
    }))
    .filter((i) => !contrato.value?.id || Number(i.contrato_id) === Number(contrato.value.id))
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
}

async function cargarIncidenciasContrato() {
  if (!contrato.value?.vehiculo?.id) return;
  const { items } = await fetchAllPaginated(
    (params) => api.get("/admin/incidencias", { params }),
    { vehiculo_id: contrato.value.vehiculo.id },
  );
  incidenciasRegistradas.value = incidenciasDesdeLista(items);
}

function cargosValidos() {
  return cargos.value.filter((c) => c.tipo_cargo && c.concepto && Number(c.monto) > 0);
}

function cargosIncompletos() {
  return cargos.value.some((c) => !c.tipo_cargo || !c.concepto || !Number(c.monto) || Number(c.monto) <= 0);
}

function agregarCargoNuevo(tipo = "", concepto = "", monto = 0) {
  if (operacionEnCurso.value) return;
  const tipoCargo = typeof tipo === "string" ? tipo : "";
  cargos.value.unshift({ concepto, monto, tipo_cargo: tipoCargo });
}

async function confirmarSalidaConCargos() {
  if (operacionEnCurso.value) return false;
  if (!tieneCargosSinGuardar.value && !tieneIncidenciasSinGuardar.value) return true;
  const result = await Swal.fire({
    icon: "warning",
    title: "Cargos sin guardar",
    text: "Si sales ahora, los cargos o incidencias que escribiste se perderán.",
    showCancelButton: true,
    confirmButtonText: "Salir sin guardar",
    cancelButtonText: "Volver",
    confirmButtonColor: "#922b21",
    cancelButtonColor: "#6b7280",
  });
  return result.isConfirmed && !operacionEnCurso.value;
}

function advertirSalidaNavegador(event) {
  if (!operacionEnCurso.value && !tieneCargosSinGuardar.value && !tieneIncidenciasSinGuardar.value) return;
  event.preventDefault();
  event.returnValue = "";
}

async function volverAContratos() {
  if (operacionEnCurso.value) return;
  if (await confirmarSalidaConCargos()) {
    salidaConfirmada.value = true;
    router.push({ name: "contratos" });
  }
}

function eliminarCargo(indice) {
  if (!operacionEnCurso.value) cargos.value.splice(indice, 1);
}

function eliminarIncidencia(indice) {
  if (!operacionEnCurso.value) incidencias.value.splice(indice, 1);
}

function mensajeErrorOriginal(error) {
  const datos = error.response?.data;
  const detalles = Object.values(datos?.errors || {}).flat().join(" ");
  return [datos?.message, detalles].filter(Boolean).join(" ") || error.message || "Error sin detalle.";
}

async function recargarDatosContrato() {
  recargando.value = true;
  try {
    // Intentar las tres lecturas aunque alguna falle; nunca recuperar pendientes desde estas listas.
    const resultados = await Promise.allSettled([
      store.fetchContrato(contrato.value.id).then((actualizado) => { contrato.value = actualizado; }),
      cargarCargosContrato(),
      cargarIncidenciasContrato(),
    ]);
    const nombres = ["contrato", "cargos", "incidencias"];
    errorRecarga.value = resultados
      .map((resultado, indice) => resultado.status === "rejected"
        ? `No se pudo actualizar ${nombres[indice]}: ${mensajeErrorOriginal(resultado.reason)}` : "")
      .filter(Boolean).join(" ");
    return !errorRecarga.value;
  } finally {
    recargando.value = false;
  }
}

async function reintentarRecarga() {
  if (operacionEnCurso.value || !contrato.value) return;
  await recargarDatosContrato();
}

async function registrarColeccion(tipo, { mostrarExito = false, desdeCobro = false } = {}) {
  if (guardandoCargos.value || guardandoIncidencias.value || cerrando.value || recargando.value
    || (cobrando.value && !desdeCobro) || errorRecarga.value || !contrato.value) return false;
  const esCargo = tipo === "cargos";
  const pendientes = esCargo ? cargos : incidencias;
  const guardando = esCargo ? guardandoCargos : guardandoIncidencias;
  if (!pendientes.value.length) return false;
  if (esCargo ? cargosIncompletos() : incidenciasIncompletas()) {
    await Swal.fire({
      icon: "warning",
      title: esCargo ? "Completa los cargos" : "Completa las incidencias",
      text: esCargo
        ? "Cada cargo debe tener tipo, concepto y un monto mayor a cero antes de guardarlo."
        : "Cada incidencia debe tener tipo, responsable, descripción y un costo válido.",
      confirmButtonColor: "#922b21",
    });
    return false;
  }

  const lote = pendientes.value.map((elemento) => ({ ...elemento }));
  let confirmados = 0;
  let fallo = null;
  const resumen = () => `${esCargo ? "Cargos confirmados" : "Incidencias confirmadas"}: ${confirmados}. Pendientes: ${pendientes.value.length}.`;
  guardando.value = true;
  resultadoGuardado.value = "";
  try {
    const alConfirmar = (registro, indice) => {
      confirmados = indice + 1;
      pendientes.value = lote.slice(confirmados).map((elemento) => ({ ...elemento }));
      if (!registro) return;
      if (esCargo) cargosRegistrados.value = [...cargosDesdeContrato([registro]), ...cargosRegistrados.value];
      else incidenciasRegistradas.value = [...incidenciasDesdeLista([registro]), ...incidenciasRegistradas.value];
    };
    try {
      if (esCargo) await store.syncCargos(contrato.value.id, lote, alConfirmar);
      else await store.syncIncidencias(contrato.value.id, contrato.value.vehiculo?.id, lote, fechaHoraActualApi(), alConfirmar);
    } catch (e) {
      fallo = e;
      const indice = e.progreso?.indiceFallido ?? confirmados;
      const ambiguo = e.progreso?.ambiguo ?? true;
      pendientes.value = lote.slice(indice + (ambiguo ? 1 : 0)).map((elemento) => ({ ...elemento }));
      resultadoGuardado.value = `${resumen()} `
        + `Falló el elemento ${indice + 1}: ${mensajeErrorOriginal(e)} `
        + (ambiguo ? "Su resultado es incierto y se retiró del reintento automático. Revisa los registros recargados antes de volver a agregar ese elemento." : "Reintentar enviará solamente los pendientes.");
    }
    const actualizado = await recargarDatosContrato();
    if (!fallo) {
      resultadoGuardado.value = resumen();
      if (mostrarExito && actualizado) toastSuccess(esCargo ? "Cargos guardados" : "Incidencias guardadas", resultadoGuardado.value);
    }
    return !fallo && actualizado;
  } finally {
    guardando.value = false;
  }
}

async function registrarCargosPendientes(opciones = {}) {
  return registrarColeccion("cargos", opciones);
}

async function guardarCargosPendientes() {
  await registrarCargosPendientes({ mostrarExito: true });
}

function incidenciasIncompletas() {
  return incidencias.value.some(
    (i) => !i.tipo_incidencia || !i.responsable_tipo || !i.descripcion || Number(i.costo || 0) < 0,
  );
}

function agregarIncidenciaNueva(tipo = "DANIO ESTETICO", descripcion = "", costo = 0) {
  if (operacionEnCurso.value) return;
  const tipoIncidencia = ["DANIO ESTETICO", "DANIO MECANICO"].includes(tipo) ? tipo : "DANIO ESTETICO";
  incidencias.value.unshift({
    tipo_incidencia: tipoIncidencia,
    responsable_tipo: "CLIENTE",
    descripcion,
    costo,
  });
}

async function registrarIncidenciasPendientes(opciones = {}) {
  return registrarColeccion("incidencias", opciones);
}

async function guardarIncidenciasPendientes() {
  await registrarIncidenciasPendientes({ mostrarExito: true });
}

function fmtFecha(v) {
  return formatFechaHora12(v);
}

function fechaHoraActualApi() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function seleccionarCombustible(value) {
  if (operacionEnCurso.value) return;
  if (NIVELES_COMBUSTIBLE.some((n) => n.value === value)) nivelRecepcion.value = value;
}

function labelTipoCargo(tipo) {
  const labels = {
    COMBUSTIBLE: "Combustible",
    DANIO: "Daño",
    "DIA EXTRA": "Día extra",
    RETRASO: "Retraso",
    OTRO: "Otro",
  };
  return labels[tipo] || tipo || "Cargo";
}

function labelTipoIncidencia(tipo) {
  const labels = {
    "DANIO ESTETICO": "Daño estético",
    "DANIO MECANICO": "Daño mecánico",
    DANIO: "Daño",
    ACCIDENTE: "Accidente",
    "FALLA MECANICA": "Falla mecánica",
    OTRO: "Otro",
  };
  return labels[tipo] || tipo || "Incidencia";
}

function labelResponsableIncidencia(responsable) {
  const labels = {
    CLIENTE: "Cliente",
    NEGOCIO: "Negocio",
    TERCERO: "Tercero",
    "NO DETERMINADO": "No determinado",
  };
  return labels[responsable] || responsable || "Responsable";
}

function combustibleCorto(nivel) {
  return nivel.value;
}

function agregarCargoCombustible() {
  agregarCargoNuevo("COMBUSTIBLE", "Falta de gasolina", 10);
}

async function irACobrarSaldo() {
  if (operacionEnCurso.value || errorRecarga.value || !contrato.value) return;
  cobrando.value = true;
  try {
    if (cargos.value.length) {
      const guardado = await registrarCargosPendientes({ desdeCobro: true });
      if (!guardado) return;
    }
    if (incidencias.value.length) {
      const guardado = await registrarIncidenciasPendientes({ desdeCobro: true });
      if (!guardado) return;
    }
    cobrando.value = false;
    await router.push({ name: "pagos", query: { contrato_id: contrato.value.id, cobrar: "1" } });
  } finally {
    cobrando.value = false;
  }
}

async function cerrarRenta() {
  if (operacionEnCurso.value) return;
  if (mensajeBloqueoCierre.value) {
    await Swal.fire({
      icon: "warning",
      title: "No se puede cerrar todavía",
      text: mensajeBloqueoCierre.value,
      confirmButtonColor: "#922b21",
    });
    return;
  }
  cerrando.value = true;
  try {
    const payload = {
      fecha_hora_recepcion: fechaHoraActualApi(),
      nivel_combustible_recepcion: nivelRecepcion.value,
      estado_vehiculo_recepcion: "RECIBIDO",
      observaciones: observacionesRecepcion.value || null,
      aplicar_cargo_retraso: Boolean(aplicarCargoRetraso.value),
    };
    if (aplicarCargoRetraso.value) {
      payload.monto_retraso = Number(montoRetraso.value);
    }
    await store.cerrarRenta(contrato.value.id, payload);
    toastSuccess("Renta cerrada", "Vehículo liberado.");
    cerrando.value = false;
    await router.push({ name: "contratos" });
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: e.response?.data?.message || store.error || "No se pudo cerrar la renta.",
      confirmButtonColor: "#922b21",
    });
  } finally {
    cerrando.value = false;
  }
}
</script>

<style scoped>
.cierre-root button:disabled,
.cierre-root input:disabled,
.cierre-root select:disabled,
.cierre-root textarea:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.cierre-root--light {
  min-height: 100vh;
  background: linear-gradient(160deg, #fafafa 0%, #f3f4f6 55%, #fef2f2 100%);
}
.cierre-root--dark {
  min-height: 100vh;
  background: linear-gradient(160deg, #030712 0%, #111827 60%, #1a0a08 100%);
}
.cierre-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 0.75rem;
}
.cierre-back {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(146, 43, 33, 0.25);
  color: #922b21;
  background: rgba(146, 43, 33, 0.06);
  transition: background 0.15s;
}
.cierre-back:hover {
  background: rgba(146, 43, 33, 0.12);
}
.cierre-kicker {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #922b21;
}
.cierre-title {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.cierre-root--light .cierre-title {
  color: #111827;
}
.cierre-root--dark .cierre-title {
  color: #f9fafb;
}
.cierre-badge {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(146, 43, 33, 0.1);
  color: #922b21;
  border: 1px solid rgba(146, 43, 33, 0.25);
}
.cierre-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 5rem;
  opacity: 0.5;
  font-size: 0.875rem;
}
.cierre-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem;
  align-items: start;
}
@media (min-width: 1024px) {
  .cierre-layout {
    grid-template-columns: 1fr 290px;
  }
}
.cierre-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}
.cierre-info-banner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid rgba(146, 43, 33, 0.15);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(146, 43, 33, 0.06);
}
.cierre-root--dark .cierre-info-banner {
  background: #111827;
  border-color: rgba(146, 43, 33, 0.3);
}
@media (min-width: 640px) {
  .cierre-info-banner {
    grid-template-columns: repeat(4, 1fr);
  }
}
.cierre-info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
.cierre-info-item i {
  color: #922b21;
  font-size: 0.9rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
}
.cierre-info-label {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  opacity: 0.5;
}
.cierre-info-value {
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 0.1rem;
}
.cierre-root--light .cierre-info-value {
  color: #1f2937;
}
.cierre-root--dark .cierre-info-value {
  color: #e5e7eb;
}
.cierre-card {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid rgba(146, 43, 33, 0.12);
  padding: 1.25rem;
  box-shadow: 0 4px 20px rgba(146, 43, 33, 0.05);
}
.cierre-root--dark .cierre-card {
  background: #111827;
  border-color: rgba(146, 43, 33, 0.25);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.cierre-card-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
}
.cierre-card-head h2 {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex: 1;
  margin: 0;
}
.cierre-root--light .cierre-card-head h2 {
  color: #374151;
}
.cierre-root--dark .cierre-card-head h2 {
  color: #d1d5db;
}
.cierre-step {
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 999px;
  background: #922b21;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cierre-field {
  margin-bottom: 0.85rem;
}
.cierre-field:last-child {
  margin-bottom: 0;
}
.cierre-field label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
  margin-bottom: 0.35rem;
}
.cierre-readonly {
  font-size: 0.875rem;
  line-height: 1.5;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px dashed rgba(146, 43, 33, 0.2);
  background: rgba(146, 43, 33, 0.03);
}
.cierre-root--dark .cierre-readonly {
  background: rgba(146, 43, 33, 0.08);
  color: #9ca3af;
}
.cierre-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  outline: none;
  border: 1.5px solid rgba(146, 43, 33, 0.2);
  background: #fff;
  color: inherit;
  transition: border-color 0.15s;
}
.cierre-input:focus {
  border-color: #922b21;
  box-shadow: 0 0 0 3px rgba(146, 43, 33, 0.1);
}
.cierre-root--dark .cierre-input {
  background: #1f2937;
  border-color: rgba(146, 43, 33, 0.35);
}
.cierre-input--sm {
  font-size: 0.8rem;
  padding: 0.55rem 0.75rem;
}
.cierre-input--amount {
  width: 6rem;
  flex-shrink: 0;
  text-align: right;
  font-weight: 700;
}
.cierre-input--type {
  width: 8.5rem;
  flex-shrink: 0;
}
.cierre-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .cierre-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}
.cierre-fuel-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.cierre-fuel-col {
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid rgba(146, 43, 33, 0.12);
  border-radius: 0.9rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(248, 250, 252, 0.72));
}
.cierre-root--dark .cierre-fuel-col {
  border-color: rgba(146, 43, 33, 0.25);
  background: linear-gradient(180deg, rgba(31, 41, 55, 0.76), rgba(17, 24, 39, 0.74));
}
.cierre-fuel-tag {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
  display: block;
}
.cierre-fuel-val {
  display: block;
  font-size: 1.1rem;
  font-weight: 900;
  margin: 0.2rem 0 0.7rem;
}
.cierre-fuel-val--red {
  color: #922b21;
}
.cierre-fuel-val--gold {
  color: #d97706;
}
.cierre-fuel-meter {
  --fuel-fill: 50%;
  position: relative;
  height: 0.75rem;
  margin: 0.15rem 0.45rem 0.85rem;
  border-radius: 999px;
  background: #e5e7eb;
  box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.15);
}
.cierre-root--dark .cierre-fuel-meter {
  background: #374151;
}
.cierre-fuel-meter--readonly {
  margin-bottom: 0.1rem;
}
.cierre-fuel-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--fuel-fill);
  border-radius: inherit;
  background: linear-gradient(90deg, #dc2626 0%, #f97316 38%, #f59e0b 72%, #facc15 100%);
  box-shadow: 0 0 14px rgba(249, 115, 22, 0.3);
  transition: width 0.2s ease;
}
.cierre-fuel-point {
  position: absolute;
  top: 50%;
  width: 1.18rem;
  height: 1.18rem;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 2px solid #fff;
  background: #cbd5e1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.cierre-fuel-point span {
  width: 0.34rem;
  height: 0.34rem;
  border-radius: inherit;
  background: #fff;
}
.cierre-fuel-point:hover,
.cierre-fuel-point--active {
  transform: translate(-50%, -50%) scale(1.13);
  background: #f59e0b;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45);
}
.cierre-fuel-point--active {
  outline: 3px solid rgba(245, 158, 11, 0.16);
}
.cierre-fuel-labels {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.2rem;
}
.cierre-fuel-labels button {
  min-height: 1.65rem;
  border-radius: 999px;
  color: #64748b;
  background: rgba(148, 163, 184, 0.12);
  font-size: 0.68rem;
  font-weight: 900;
  transition: all 0.15s ease;
}
.cierre-fuel-labels button:hover,
.cierre-fuel-labels .cierre-fuel-label--active {
  color: #78350f;
  background: #fef3c7;
}
.cierre-root--dark .cierre-fuel-labels button {
  color: #cbd5e1;
  background: rgba(55, 65, 81, 0.8);
}
.cierre-root--dark .cierre-fuel-labels button:hover,
.cierre-root--dark .cierre-fuel-labels .cierre-fuel-label--active {
  color: #fef3c7;
  background: rgba(146, 64, 14, 0.72);
}
.cierre-alert {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 0.75rem;
  font-weight: 600;
  color: #b45309;
}
.cierre-alert-btn {
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: #922b21;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.cierre-alert-btn:hover {
  opacity: 0.85;
}
.cierre-status {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
}
.cierre-status i {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}
.cierre-status--warn i {
  color: #c0392b;
}
.cierre-status--ok i {
  color: #16a34a;
}
.cierre-status-title {
  font-size: 0.875rem;
  font-weight: 700;
}
.cierre-check {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.5rem;
  font-size: 0.76rem;
  font-weight: 700;
}
.cierre-helper {
  font-size: 0.76rem;
  opacity: 0.62;
  margin: -0.35rem 0 0.85rem;
  line-height: 1.45;
}
.cierre-add-btn {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1.5px solid #922b21;
  color: #922b21;
  background: rgba(146, 43, 33, 0.06);
  cursor: pointer;
  transition: background 0.15s;
}
.cierre-add-btn:hover {
  background: rgba(146, 43, 33, 0.12);
}
.cierre-save-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.65rem;
}
.cierre-save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: none;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  color: #fff;
  background: linear-gradient(135deg, #922b21, #c0392b);
  font-size: 0.78rem;
  font-weight: 800;
  box-shadow: 0 4px 14px rgba(146, 43, 33, 0.24);
  transition: opacity 0.15s, transform 0.15s;
}
.cierre-save-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}
.cierre-save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}
.cierre-registered-cargos {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.cierre-registered-head,
.cierre-registered-row {
  display: grid;
  grid-template-columns: minmax(92px, 0.42fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(245, 158, 11, 0.28);
  background: rgba(245, 158, 11, 0.08);
}
.cierre-registered-head {
  grid-template-columns: minmax(0, 1fr) auto;
  color: #92400e;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.cierre-registered-row span {
  color: #92400e;
  font-size: 0.62rem;
  font-weight: 900;
}
.cierre-registered-row p {
  min-width: 0;
  color: #374151;
  font-size: 0.78rem;
  font-weight: 700;
}
.cierre-registered-row strong {
  color: #922b21;
  font-size: 0.8rem;
}
.cierre-root--dark .cierre-registered-head,
.cierre-root--dark .cierre-registered-row {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.08);
}
.cierre-root--dark .cierre-registered-head,
.cierre-root--dark .cierre-registered-row span,
.cierre-root--dark .cierre-registered-row strong {
  color: #fbbf24;
}
.cierre-root--dark .cierre-registered-row p {
  color: #e5e7eb;
}
.cierre-empty-cargos {
  font-size: 0.8rem;
  opacity: 0.4;
  text-align: center;
  padding: 0.75rem 0;
}
.cierre-cargo-row,
.cierre-incidencia-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.cierre-incidencia-row {
  flex-wrap: wrap;
}
.cierre-incidencia-row .cierre-input:not(.cierre-input--type):not(.cierre-input--responsable):not(.cierre-input--amount) {
  flex: 1 1 15rem;
}
.cierre-input--responsable {
  width: 10.5rem;
  flex-shrink: 0;
}
.cierre-registered-row--incidencia {
  grid-template-columns: minmax(92px, 0.34fr) minmax(0, 1fr) minmax(92px, auto);
}
.cierre-remove-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(192, 57, 43, 0.3);
  color: #c0392b;
  background: rgba(192, 57, 43, 0.06);
  cursor: pointer;
  transition: background 0.15s;
}
.cierre-remove-btn:hover {
  background: rgba(192, 57, 43, 0.12);
}
.cierre-extras-total {
  text-align: right;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  opacity: 0.7;
}
.cierre-extras-total strong {
  color: #922b21;
  font-size: 1rem;
}
.cierre-ticket {
  background: #1a0a08;
  color: #fef2f2;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(146, 43, 33, 0.4);
}
@media (min-width: 1024px) {
  .cierre-ticket {
    position: sticky;
    top: 1rem;
  }
}
.cierre-ticket-perf {
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 6px,
    #0d0504 6px,
    #0d0504 12px
  );
  opacity: 0.6;
}
.cierre-ticket-perf--flip {
  transform: rotate(180deg);
}
.cierre-ticket-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.25rem 1.25rem 1rem;
}
.cierre-ticket-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #922b21, #c0392b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
}
.cierre-ticket-brand {
  font-size: 0.8rem;
  font-weight: 900;
}
.cierre-ticket-sub {
  font-size: 0.62rem;
  opacity: 0.5;
  margin-top: 0.1rem;
}
.cierre-ticket-line {
  height: 0;
  border-top: 2px dashed rgba(240, 165, 0, 0.3);
  margin: 0 1.25rem;
}
.cierre-ticket-rows {
  padding: 1rem 1.25rem;
}
.cierre-ticket-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  padding: 0.35rem 0;
  gap: 0.5rem;
}
.cierre-ticket-row span {
  opacity: 0.55;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cierre-ticket-gold {
  color: #f0a500 !important;
}
.cierre-ticket-total {
  text-align: center;
  padding: 0 1.25rem 1rem;
  border-top: 1px solid rgba(240, 165, 0, 0.15);
  margin: 0 1.25rem;
  padding-top: 1rem;
}
.cierre-ticket-total span {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(240, 165, 0, 0.7);
  display: block;
}
.cierre-ticket-total p {
  font-size: 2rem;
  font-weight: 900;
  color: #f0a500;
  line-height: 1.1;
  margin-top: 0.15rem;
}
.cierre-ticket-note {
  margin: 0 1.25rem 1rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.65rem;
  background: rgba(240, 165, 0, 0.09);
  border: 1px solid rgba(240, 165, 0, 0.2);
  color: #fde68a;
  font-size: 0.72rem;
  line-height: 1.4;
}
.cierre-ticket-actions {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.cierre-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.15s;
  text-decoration: none;
}
.cierre-btn--outline {
  border: 1.5px solid rgba(240, 165, 0, 0.45);
  color: #f0a500;
  background: rgba(240, 165, 0, 0.08);
}
.cierre-btn--outline:hover:not(:disabled) {
  background: rgba(240, 165, 0, 0.16);
}
.cierre-btn--outline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.cierre-btn--primary {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #922b21, #c0392b);
  box-shadow: 0 4px 14px rgba(146, 43, 33, 0.4);
}
.cierre-btn--primary:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}
.cierre-btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}
@media (max-width: 640px) {
  .cierre-cargo-row {
    flex-wrap: wrap;
  }
  .cierre-input--type,
  .cierre-input--amount {
    width: 100%;
  }
}
</style>


