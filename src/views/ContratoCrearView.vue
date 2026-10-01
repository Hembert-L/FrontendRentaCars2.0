<template>
  <div class="wizard-root" :class="isDark ? 'wizard-root--dark' : 'wizard-root--light'">

    <div class="wizard-body">
      <!-- Contenido del paso -->
      <div ref="wizardMainRef" class="wizard-main">
    <!-- Top bar -->
    <header class="wizard-header">
      <button type="button" class="wizard-back" @click="volver">
        <i class="pi pi-arrow-left"></i>
      </button>
      <div class="flex-1 min-w-0">
        <p class="wizard-kicker">Generación digital</p>
        <h1 class="wizard-title">{{ reservaId ? 'Contrato desde reserva' : 'Nuevo contrato' }}</h1>
      </div>
      <div v-if="reservaOrigen" class="wizard-badge-reserva">
        Reserva #{{ reservaOrigen.id }}
      </div>
      <div v-if="contratoGenerado" class="wizard-badge-ok">
        <i class="pi pi-check"></i> {{ contratoGenerado.numero_contrato }}
      </div>
    </header>

    <!-- Stepper horizontal -->
    <nav class="wizard-stepper" aria-label="Pasos del contrato">
      <button
        v-for="s in pasos"
        :key="s.id"
        type="button"
        class="wizard-step"
        :class="{
          'wizard-step--active': paso === s.id,
          'wizard-step--done': s.id < paso || (s.id === paso && s.completo),
          'wizard-step--clickable': s.id <= pasoMaximo,
        }"
        :disabled="s.id > pasoMaximo"
        @click="irPaso(s.id)"
      >
        <span class="wizard-step-num">
          <i v-if="s.id < paso || (s.completo && s.id !== paso)" class="pi pi-check text-[10px]"></i>
          <span v-else>{{ s.id }}</span>
        </span>
        <span class="wizard-step-label">{{ s.titulo }}</span>
      </button>
    </nav>
        <Transition name="slide-fade" mode="out-in">
          <div :key="paso" class="wizard-panel">
            <ContratoClienteSection
              v-if="paso === 1"
              ref="clienteRef"
              v-model="cliente"
              :cargando-reservas="cargandoReservasCliente"
              :sin-reserva="sinReservaDisponible"
              :reservas="reservasCliente"
              :reserva-seleccionada="reservaOrigen"
              :renta-directa-confirmada="rentaDirectaConfirmada"
              @cliente-seleccionado="onClienteSeleccionado"
              @cliente-limpiado="onClienteLimpiado"
              @reserva-elegir="aplicarReserva"
              @reserva-limpiar="onReservaLimpiar"
              @reserva-omitir="onReservaOmitir"
            />
            <ContratoFechasVehiculoSection
              v-else-if="paso === 2"
              v-model:fecha-entrega="fechaEntrega"
              v-model:fecha-devolucion="fechaDevolucion"
              v-model:vehiculo-id="vehiculoId"
              :vehiculos="vehiculos"
              :cargando="cargandoVehiculos"
              :consultados="vehiculosConsultados"
              :modo-directo="!esDesdeReserva"
              :bloqueado="esDesdeReserva"
            />
            <ContratoPreciosInspeccionSection
              v-else
              v-model:descuento="descuento"
              v-model:nivel-combustible="nivelCombustible"
              v-model:observaciones-entrega="observacionesEntrega"
              :dias="dias"
              :precio-dia="precioDia"
            />
          </div>
        </Transition>

        <p v-if="error" class="wizard-error">{{ error }}</p>
        <p v-if="mensajeContratoActivo" class="wizard-error">{{ mensajeContratoActivo }}</p>
        <p v-if="mensajeReservaTraslapada" class="wizard-error">{{ mensajeReservaTraslapada }}</p>
        <p v-if="mensajeVehiculoReserva" class="wizard-error">{{ mensajeVehiculoReserva }}</p>
        <p v-if="mensajeDiaEntrega" class="wizard-error">{{ mensajeDiaEntrega }}</p>

        <!-- Navegación -->
        <div class="wizard-nav">
          <button v-if="paso > 1" type="button" class="wizard-btn wizard-btn--ghost" @click="anterior">
            <i class="pi pi-arrow-left"></i> Anterior
          </button>
          <div v-else></div>

          <button
            v-if="paso < 3"
            type="button"
            class="wizard-btn wizard-btn--primary"
            :disabled="!puedeAvanzar"
            @click="siguiente"
          >
            Siguiente <i class="pi pi-arrow-right"></i>
          </button>
          <button
            v-else
            type="button"
            class="wizard-btn wizard-btn--primary"
            :disabled="!puedeGenerar || generando"
            @click="generarContrato"
          >
            <i :class="generando ? 'pi pi-spin pi-spinner' : 'pi pi-file-pdf'"></i>
            {{ generando ? 'Generando...' : 'Generar contrato' }}
          </button>
        </div>
      </div>

      <!-- Ticket lateral -->
      <ContratoResumen
        :cliente="cliente"
        :fecha-entrega="fechaEntrega"
        :fecha-devolucion="fechaDevolucion"
        :vehiculo="vehiculoSel"
        :dias="dias"
        :total-estimado="totalEstimado"
        :paso="paso"
        :contrato-generado="contratoGenerado"
        @ver-pdf="mostrarPdf = true"
      />
    </div>

    <ContratoPdfPreview :visible="mostrarPdf" :contrato="contratoGenerado" @cerrar="cerrarPreviewContrato" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import ContratoClienteSection from '@/components/contratos/ContratoClienteSection.vue'
import ContratoFechasVehiculoSection from '@/components/contratos/ContratoFechasVehiculoSection.vue'
import ContratoPreciosInspeccionSection from '@/components/contratos/ContratoPreciosInspeccionSection.vue'
import ContratoResumen from '@/components/contratos/ContratoResumen.vue'
import ContratoPdfPreview from '@/components/contratos/ContratoPdfPreview.vue'
import { useContratosStore } from '@/stores/contratos'
import { useReservasStore } from '@/stores/reservas'
import { useAppTheme } from '@/composables/useAppTheme'
import { calcularDias, documentosVigentes, reservaChocaConContratoDirecto } from '@/utils/contratoFormatters'
import { fechaHoyLocal, formatFecha } from '@/utils/reservaFormatters'
import { toastSuccess } from '@/utils/toast'

const router = useRouter()
const route = useRoute()
const { isDark } = useAppTheme()
const contratosStore = useContratosStore()
const reservasStore = useReservasStore()

const reservaId = ref(route.query.reserva_id ? Number(route.query.reserva_id) : null)
const reservaOrigen = ref(null)
const reservasCliente = ref([])
const reservasVigentesCliente = ref([])
const cargandoReservasCliente = ref(false)
const sinReservaDisponible = ref(false)
const cargandoReserva = ref(false)
const rentaDirectaConfirmada = ref(false)

const clienteRef = ref(null)
const wizardMainRef = ref(null)
const paso = ref(1)
const cliente = ref(null)
const fechaEntrega = ref('')
const fechaDevolucion = ref('')
const vehiculoId = ref('')
const vehiculos = ref([])
const cargandoVehiculos = ref(false)
const vehiculosConsultados = ref(false)
const descuento = ref(0)
const nivelCombustible = ref('1/2')
const observacionesEntrega = ref('')
const generando = ref(false)
const error = ref('')
const contratoGenerado = ref(null)
const mostrarPdf = ref(false)

function escaparHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function labelTipoDetalleEstetico(tipo) {
  return tipo === 'DANIO ESTETICO' ? 'Daño estético' : tipo || 'Detalle estético'
}

function htmlAdvertenciaEstetica(advertenciaEstetica, detallesEsteticos = []) {
  if (!advertenciaEstetica) return ''
  const lista = detallesEsteticos.slice(0, 3)
    .map((detalle) => `<li><strong>${escaparHtml(labelTipoDetalleEstetico(detalle.tipo_incidencia))}:</strong> ${escaparHtml(detalle.descripcion || 'Sin descripción')}</li>`)
    .join('')
  const extra = detallesEsteticos.length > 3 ? `<p style="margin-top:.5rem;">Y ${detallesEsteticos.length - 3} más.</p>` : ''
  return `
    <p style="margin-bottom:.75rem;">${escaparHtml(advertenciaEstetica)}</p>
    ${lista ? `<ul style="text-align:left; padding-left:1.25rem; margin:0;">${lista}</ul>${extra}` : ''}
  `
}

const contratoActivoCliente = computed(() => {
  if (!cliente.value?.id) return null
  return contratosStore.contratos.find((contrato) => {
    const clienteId = contrato.cliente_id || contrato.cliente?.id || contrato.reserva?.cliente_id || contrato.reserva?.cliente?.id
    return Number(clienteId) === Number(cliente.value.id) && contrato.estado_contrato === 'ACTIVO'
  }) || null
})
const mensajeContratoActivo = computed(() => {
  if (!contratoActivoCliente.value) return ''
  return `Este cliente ya tiene un contrato activo (${contratoActivoCliente.value.numero_contrato}). Debe cerrarse antes de generar otro contrato.`
})

const reservaTraslapada = computed(() => {
  if (esDesdeReserva.value) return null
  if (!fechaEntrega.value || !fechaDevolucion.value) return null
  return reservasVigentesCliente.value.find((r) =>
    reservaChocaConContratoDirecto(fechaEntrega.value, fechaDevolucion.value, r),
  ) || null
})
const mensajeReservaTraslapada = computed(() => {
  if (!reservaTraslapada.value) return ''
  const r = reservaTraslapada.value
  const estado = r.estado === 'CONFIRMADA' ? 'confirmada' : 'pendiente'
  const sugerencia = r.estado === 'PENDIENTE'
    ? 'Acorta los días o genera el contrato desde esa reserva.'
    : 'Acorta los días de la renta.'
  return `Las fechas elegidas chocan con la reserva ${estado} #${r.id} de este cliente (${formatFecha(r.fecha_inicio)} - ${formatFecha(r.fecha_fin)}). ${sugerencia}`
})

const dias = computed(() => calcularDias(fechaEntrega.value, fechaDevolucion.value))
const vehiculoSel = computed(() => {
  if (!vehiculoId.value) return null
  const fromList = vehiculos.value.find((v) => Number(v.id) === Number(vehiculoId.value))
  if (fromList) return fromList
  if (Number(reservaOrigen.value?.vehiculo?.id) === Number(vehiculoId.value)) return reservaOrigen.value.vehiculo
  return null
})
// la entrega es ahora mismo, y el back exige que sea el dia de inicio de la reserva
const mensajeDiaEntrega = computed(() => {
  const inicio = fechaSolo(reservaOrigen.value?.fecha_inicio)
  if (!esDesdeReserva.value || !inicio || inicio === fechaHoyLocal()) return ''
  return inicio > fechaHoyLocal()
    ? `Esta reserva inicia el ${formatFecha(inicio)}. El contrato se genera el día de la entrega del vehículo.`
    : `Esta reserva iniciaba el ${formatFecha(inicio)} y ya pasó ese día. Edita las fechas de la reserva o genera un contrato directo.`
})
const mensajeVehiculoReserva = computed(() => {
  if (!esDesdeReserva.value || !vehiculoSel.value?.estado) return ''
  if (vehiculoSel.value.estado === 'DISPONIBLE') return ''
  return `El vehículo de esta reserva no está disponible (estado actual: ${vehiculoSel.value.estado}). No se puede generar el contrato hasta que vuelva a estar disponible.`
})
const precioDia = computed(() => Number(vehiculoSel.value?.categoria?.precio_dia || 0))
const totalEstimado = computed(() => Math.max(0, dias.value * precioDia.value - descuento.value))
const docsOk = computed(() => documentosVigentes(cliente.value).ok)
const esDesdeReserva = computed(() => !!reservaId.value || !!reservaOrigen.value)

const paso1Ok = computed(() =>
  !!cliente.value &&
  docsOk.value &&
  !contratoActivoCliente.value &&
  !cargandoReservasCliente.value &&
  (esDesdeReserva.value ? !!reservaOrigen.value : (sinReservaDisponible.value || rentaDirectaConfirmada.value || !reservasCliente.value.length)),
)
const paso2Ok = computed(() =>
  !!vehiculoSel.value &&
  !!fechaEntrega.value &&
  !!fechaDevolucion.value &&
  precioDia.value > 0 &&
  !reservaTraslapada.value &&
  !mensajeVehiculoReserva.value &&
  !mensajeDiaEntrega.value,
)
const puedeGenerar = computed(() => paso1Ok.value && paso2Ok.value && dias.value > 0)

const pasoMaximo = computed(() => {
  if (paso2Ok.value) return 3
  if (paso1Ok.value) return 2
  return 1
})

const pasos = computed(() => [
  { id: 1, titulo: 'Cliente', completo: paso1Ok.value },
  { id: 2, titulo: 'Fechas y vehículo', completo: paso2Ok.value },
  { id: 3, titulo: 'Precios e inspección', completo: puedeGenerar.value },
])

const puedeAvanzar = computed(() => {
  if (paso.value === 1) return paso1Ok.value
  if (paso.value === 2) return paso2Ok.value
  return false
})

function irPaso(n) {
  if (n <= pasoMaximo.value) cambiarPaso(n)
}

function siguiente() {
  if (paso.value < 3 && puedeAvanzar.value) cambiarPaso(paso.value + 1)
}

function anterior() {
  if (paso.value > 1) cambiarPaso(paso.value - 1)
}

function scrollProcesoArriba(behavior = 'smooth') {
  wizardMainRef.value?.scrollTo({ top: 0, behavior })
  window.scrollTo({ top: 0, behavior })
}

async function cambiarPaso(n) {
  paso.value = n
  await nextTick()
  scrollProcesoArriba()
}

function limpiarDatosReserva() {
  reservaOrigen.value = null
  reservaId.value = null
  reservasCliente.value = []
  reservasVigentesCliente.value = []
  sinReservaDisponible.value = false
  rentaDirectaConfirmada.value = false
  fechaEntrega.value = ''
  fechaDevolucion.value = ''
  vehiculoId.value = ''
  vehiculos.value = []
  vehiculosConsultados.value = false
}

function onClienteLimpiado() {
  limpiarDatosReserva()
  error.value = ''
}

function onReservaLimpiar() {
  reservaOrigen.value = null
  reservaId.value = null
  rentaDirectaConfirmada.value = false
  fechaEntrega.value = ''
  fechaDevolucion.value = ''
  vehiculoId.value = ''
  vehiculos.value = []
  vehiculosConsultados.value = false
}

async function onClienteSeleccionado(c) {
  if (route.query.reserva_id) return
  await contratosStore.fetchContratos({ estado: 'ACTIVO' })
  fechaEntrega.value = fechaHoyLocal()
  fechaDevolucion.value = ''
  vehiculoId.value = ''
  vehiculos.value = []
  vehiculosConsultados.value = false
  await cargarReservasCliente(c)
}

async function cargarReservasCliente(clienteSeleccionado) {
  cargandoReservasCliente.value = true
  sinReservaDisponible.value = false
  rentaDirectaConfirmada.value = false
  reservasCliente.value = []
  reservasVigentesCliente.value = []
  reservaOrigen.value = null
  reservaId.value = null
  error.value = ''

  try {
    const vigentes = await reservasStore.fetchReservasVigentesCliente(clienteSeleccionado)
    const list = vigentes.filter((r) => r.estado === 'PENDIENTE' && !r.contrato)
    reservasVigentesCliente.value = vigentes
    reservasCliente.value = list

    if (!list.length) {
      sinReservaDisponible.value = true
      fechaEntrega.value = fechaHoyLocal()
      return
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudieron consultar las reservas del cliente.'
  } finally {
    cargandoReservasCliente.value = false
  }
}

async function aplicarReserva(reserva) {
  if (!reserva || reserva.contrato) return
  reservaOrigen.value = reserva
  reservaId.value = reserva.id
  rentaDirectaConfirmada.value = false
  fechaEntrega.value = fechaSolo(reserva.fecha_inicio)
  fechaDevolucion.value = fechaSolo(reserva.fecha_fin)
  vehiculoId.value = reserva.vehiculo_id
  sinReservaDisponible.value = false
  await consultarVehiculos()
}

function onReservaOmitir() {
  reservaOrigen.value = null
  reservaId.value = null
  rentaDirectaConfirmada.value = true
  fechaEntrega.value = fechaHoyLocal()
  fechaDevolucion.value = ''
  vehiculoId.value = ''
  vehiculos.value = []
  vehiculosConsultados.value = false
  error.value = ''
}

async function consultarVehiculos() {
  if (!fechaEntrega.value || !fechaDevolucion.value || fechaDevolucion.value < fechaEntrega.value) {
    vehiculos.value = []
    vehiculosConsultados.value = false
    return
  }
  cargandoVehiculos.value = true
  vehiculosConsultados.value = false
  const vehiculoReservado = reservaOrigen.value?.vehiculo_id || vehiculoId.value
  if (!reservaId.value) vehiculoId.value = ''
  try {
    if (reservaId.value) {
      const disponibles = await reservasStore.fetchVehiculosDisponibles(
        fechaEntrega.value,
        fechaDevolucion.value,
        reservaId.value,
      )
      const reservado = disponibles.find((v) => Number(v.id) === Number(vehiculoReservado))
        || reservaOrigen.value?.vehiculo
        || null
      vehiculos.value = reservado ? [reservado] : []
      vehiculoId.value = vehiculoReservado
    } else {
      vehiculos.value = await reservasStore.fetchVehiculosDisponibles(
        fechaEntrega.value,
        fechaDevolucion.value,
      )
    }
    vehiculosConsultados.value = true
  } catch (e) {
    vehiculos.value = []
    vehiculosConsultados.value = true
    error.value = e.response?.data?.message || 'No se pudieron consultar vehículos.'
  } finally {
    cargandoVehiculos.value = false
  }
}

function fechaHoraActual() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function fechaSolo(fecha) {
  if (!fecha) return ''
  return typeof fecha === 'string' ? fecha.slice(0, 10) : fecha
}

async function cargarDesdeReserva() {
  if (!reservaId.value) return
  cargandoReserva.value = true
  error.value = ''
  try {
    const reserva = await reservasStore.fetchReserva(reservaId.value)
    if (reserva.contrato) {
      error.value = 'Esta reserva ya tiene un contrato asociado.'
      return
    }
    await contratosStore.fetchContratos({ estado: 'ACTIVO' })
    if (reserva.estado === 'CANCELADA') {
      error.value = 'No se puede generar contrato desde una reserva cancelada.'
      return
    }
    reservaOrigen.value = reserva
    reservasCliente.value = [reserva]
    cliente.value = reserva.cliente
    fechaEntrega.value = fechaSolo(reserva.fecha_inicio)
    fechaDevolucion.value = fechaSolo(reserva.fecha_fin)
    vehiculoId.value = reserva.vehiculo_id
    await consultarVehiculos()
    paso.value = reserva.cliente ? 2 : 1
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo cargar la reserva.'
  } finally {
    cargandoReserva.value = false
  }
}

onMounted(() => {
  contratosStore.fetchContratos({ estado: 'ACTIVO' })
  if (reservaId.value) cargarDesdeReserva()
})

let consultaTimer = null
watch([fechaEntrega, fechaDevolucion], () => {
  clearTimeout(consultaTimer)
  consultaTimer = setTimeout(() => consultarVehiculos(), 400)
})

async function generarContrato() {
  if (!puedeGenerar.value) return
  if (contratoActivoCliente.value) {
    error.value = mensajeContratoActivo.value
    return
  }
  if (reservaTraslapada.value) {
    error.value = mensajeReservaTraslapada.value
    return
  }
  if (mensajeVehiculoReserva.value) {
    error.value = mensajeVehiculoReserva.value
    return
  }
  if (mensajeDiaEntrega.value) {
    error.value = mensajeDiaEntrega.value
    return
  }
  generando.value = true
  error.value = ''
  try {
    const payload = {
      cliente_id:                cliente.value.id,
      vehiculo_id:               vehiculoId.value,
      precio_por_dia:            precioDia.value,
      monto_descuento:           descuento.value,
      nivel_combustible_entrega: nivelCombustible.value,
      observaciones_entrega:     observacionesEntrega.value,
    }
    if (reservaId.value) {
      payload.reserva_id = reservaId.value
      // hora real de entrega, el back suma los dias de la reserva para la devolucion
      payload.fecha_hora_entrega = fechaHoraActual()
    } else {
      payload.dias_acordados = dias.value
    }
    const contrato = await contratosStore.crear(payload)
    contratoGenerado.value = contrato
    const htmlAdvertencia = htmlAdvertenciaEstetica(contratosStore.advertenciaEstetica, contratosStore.detallesEsteticos)
    if (htmlAdvertencia) {
      await Swal.fire({
        icon: 'warning',
        title: 'Contrato generado',
        html: htmlAdvertencia,
        confirmButtonColor: '#922b21',
      })
    } else {
      toastSuccess('Contrato generado', `N° ${contrato.numero_contrato}`)
    }
    await router.push({ name: 'contratos', query: { ver_contrato: contrato.id } })
  } catch (e) {
    error.value = e.response?.status === 401
      ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
      : (e.response?.data?.message || contratosStore.error || 'Error al generar el contrato.')
  } finally {
    generando.value = false
  }
}

function volver() {
  router.push({ name: 'contratos' })
}

function cerrarPreviewContrato() {
  mostrarPdf.value = false
  if (contratoGenerado.value) {
    router.push({ name: 'contratos' })
  }
}
</script>

<style scoped>
.wizard-root--light { background: linear-gradient(160deg, #fafafa 0%, #f3f4f6 50%, #fef2f2 100%); min-height:100vh; }
.wizard-root--dark { background: linear-gradient(160deg, #030712 0%, #111827 60%, #1a0a08 100%); min-height:100vh; }

.wizard-header {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.25rem 0 0.75rem;
  max-width: none; width: 100%; margin: 0;
}
.wizard-back {
  width: 2.5rem; height: 2.5rem; border-radius: 0.75rem;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(146,43,33,0.25); color: #922b21;
  background: rgba(146,43,33,0.06); transition: all 0.15s;
}
.wizard-back:hover { background: rgba(146,43,33,0.12); }
.wizard-kicker { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #922b21; }
.wizard-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; }
.wizard-root--light .wizard-title { color: #111827; }
.wizard-root--dark .wizard-title { color: #f9fafb; }
.wizard-badge-ok {
  font-size: 0.7rem; font-weight: 800; padding: 0.35rem 0.75rem;
  border-radius: 999px; background: #dcfce7; color: #166534;
  display: flex; align-items: center; gap: 0.35rem;
}
.wizard-badge-reserva {
  font-size: 0.7rem; font-weight: 800; padding: 0.35rem 0.75rem;
  border-radius: 999px; background: rgba(146,43,33,0.1); color: #922b21;
  border: 1px solid rgba(146,43,33,0.25);
}

.wizard-stepper {
  display: flex; gap: 0; max-width: none; width: 100%; margin: 0;
  padding: 0 0 1.25rem; overflow-x: auto;
}
.wizard-step {
  flex: 1; display: flex; align-items: center; gap: 0.6rem;
  padding: 0.75rem 1rem; border: none; background: transparent;
  border-bottom: 3px solid transparent; min-width: 140px;
  opacity: 0.45; transition: all 0.2s; cursor: default;
}
.wizard-step--clickable { cursor: pointer; opacity: 0.7; }
.wizard-step--clickable:hover { opacity: 0.9; }
.wizard-step--active { opacity: 1; border-bottom-color: #922b21; }
.wizard-step--done { opacity: 0.85; }
.wizard-step-num {
  width: 1.65rem; height: 1.65rem; border-radius: 999px;
  border: 2px solid #922b21; color: #922b21;
  font-size: 0.75rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.wizard-step--active .wizard-step-num,
.wizard-step--done .wizard-step-num { background: #922b21; color: #fff; }
.wizard-step-label { font-size: 0.75rem; font-weight: 700; text-align: left; line-height: 1.2; }
.wizard-root--light .wizard-step-label { color: #374151; }
.wizard-root--dark .wizard-step-label { color: #d1d5db; }

.wizard-body {
  display: grid; grid-template-columns: 1fr; gap: 1.5rem;
  max-width: none; width: 100%; margin: 0; padding: 0 1.5rem 2rem;
  align-items: start;
}
@media (min-width: 1024px) {
  :global(html:has(.wizard-root)),
  :global(body:has(.wizard-root)) {
    overflow: hidden;
  }

  .wizard-root {
    height: calc(100vh - 6.5rem);
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .wizard-body {
    flex: 1;
    min-height: 0;
    grid-template-columns: minmax(0, 7fr) minmax(320px, 3fr);
    padding-bottom: 1rem;
    overflow: hidden;
  }
}

.wizard-main { min-width: 0; }
@media (min-width: 1024px) {
  .wizard-main {
    height: 100%;
    overflow-y: auto;
    padding-right: 0.35rem;
    scrollbar-gutter: stable;
  }
}
.wizard-panel :deep(.form-section) { border: none; box-shadow: 0 8px 32px rgba(146,43,33,0.08); }
.wizard-root--dark .wizard-panel :deep(.form-section) { box-shadow: 0 8px 32px rgba(0,0,0,0.35); }

.wizard-error {
  margin-top: 0.75rem; text-align: center; font-size: 0.875rem; font-weight: 600;
  color: #c0392b; padding: 0.65rem 1rem; border-radius: 0.75rem;
  background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.2);
}

.wizard-nav {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 1.25rem; gap: 1rem;
}
.wizard-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.75rem 1.35rem; border-radius: 0.75rem;
  font-size: 0.875rem; font-weight: 700; transition: all 0.15s;
}
.wizard-btn--ghost {
  border: 1.5px solid rgba(146,43,33,0.3); color: #922b21; background: transparent;
}
.wizard-btn--ghost:hover { background: rgba(146,43,33,0.06); }
.wizard-btn--primary {
  background: linear-gradient(135deg, #922b21, #c0392b); color: #fff; border: none;
  box-shadow: 0 4px 14px rgba(146,43,33,0.35);
}
.wizard-btn--primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
.wizard-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

@media (max-width: 639px) {
  .wizard-body { padding: 0 0 1.5rem; gap: 1rem; }
  .wizard-header { gap: 0.6rem; padding-top: 0.5rem; flex-wrap: wrap; }
  .wizard-title { font-size: 1.2rem; }
  .wizard-stepper { padding-bottom: 0.75rem; }
  .wizard-step { min-width: 0; padding: 0.6rem 0.35rem; gap: 0.35rem; justify-content: center; }
  .wizard-step-label { font-size: 0.65rem; }
  .wizard-step:not(.wizard-step--active) .wizard-step-label { display: none; }
  .wizard-panel :deep(.form-section) { padding: 1rem; }
  .wizard-nav { position: sticky; bottom: 0; z-index: 5; padding: 0.75rem 0; margin-top: 0.75rem; }
  .wizard-root--light .wizard-nav { background: #f9fafb; }
  .wizard-root--dark .wizard-nav { background: #0b0f19; }
  .wizard-btn { flex: 1; justify-content: center; padding: 0.75rem 0.9rem; }
}

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateX(16px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-16px); }
</style>
