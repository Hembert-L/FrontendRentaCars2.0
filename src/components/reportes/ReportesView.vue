<template>
  <div class="min-h-screen reportes-page" :class="isDark ? 'bg-gray-950' : 'bg-gray-50'">
    <section class="reportes-header" :class="isDark ? 'reportes-header--dark' : 'reportes-header--light'">
      <div class="reportes-header__accent"></div>
      <i class="pi pi-chart-bar reportes-header__icon"></i>
      <div>
        <h1>Reportes del sistema</h1>
        <p>Selecciona un reporte, ajusta sus filtros y genera el PDF.</p>
      </div>
    </section>

    <section class="reportes-list" aria-label="Reportes disponibles">
      <article
        v-for="reporte in reportes"
        :key="reporte.id"
        class="reporte-item"
        :class="[
          isDark ? 'reporte-item--dark' : 'reporte-item--light',
          { 'reporte-item--open': reporteAbierto === reporte.id },
        ]"
      >
        <button
          type="button"
          class="reporte-trigger"
          :aria-expanded="reporteAbierto === reporte.id"
          @click="toggleReporte(reporte.id)"
        >
          <i
            class="pi reporte-trigger__arrow"
            :class="reporteAbierto === reporte.id ? 'pi-chevron-down' : 'pi-chevron-right'"
          ></i>
          <i class="pi reporte-trigger__icon" :class="reporte.icono"></i>
          <span>{{ reporte.titulo }}</span>
        </button>

        <Transition name="accordion">
          <div v-if="reporteAbierto === reporte.id" class="reporte-panel">
            <p class="reporte-panel__description">{{ reporte.descripcion }}</p>

            <div v-if="reporte.needsPeriod || reporte.needsDias || reporte.needsPropietario || reporte.needsPorcentaje" class="reporte-filters">
              <div v-if="reporte.needsPeriod" class="filter-group filter-group--wide">
                <label>Periodo rápido</label>
                <div class="period-options">
                  <button
                    v-for="periodo in periodos"
                    :key="periodo.value"
                    type="button"
                    class="period-btn"
                    :class="{ 'period-btn--active': filtros.periodo === periodo.value }"
                    @click="seleccionarPeriodo(periodo.value)"
                  >
                    {{ periodo.label }}
                  </button>
                </div>
              </div>

              <div v-if="reporte.needsPeriod" class="filter-group">
                <label :for="`inicio-${reporte.id}`">Fecha inicio</label>
                <input
                  :id="`inicio-${reporte.id}`"
                  :key="`inicio-${destello}`"
                  v-model="filtros.fechaInicio"
                  type="date"
                  class="filter-control"
                  :class="{ 'filter-control--cambiado': filtros.periodo !== 'mes', 'filter-control--destello': destello > 0 }"
                />
              </div>

              <div v-if="reporte.needsPeriod" class="filter-group">
                <label :for="`fin-${reporte.id}`">Fecha fin</label>
                <input
                  :id="`fin-${reporte.id}`"
                  :key="`fin-${destello}`"
                  v-model="filtros.fechaFin"
                  type="date"
                  class="filter-control"
                  :class="{ 'filter-control--cambiado': filtros.periodo !== 'mes', 'filter-control--destello': destello > 0 }"
                />
              </div>

              <div v-if="reporte.needsDias" class="filter-group">
                <label :for="`dias-${reporte.id}`">Días por vencer</label>
                <input
                  :id="`dias-${reporte.id}`"
                  v-model.number="filtros.dias"
                  type="number"
                  min="1"
                  max="365"
                  class="filter-control"
                  :class="{ 'filter-control--cambiado': Number(filtros.dias) !== 30 }"
                />
              </div>

              <div v-if="reporte.needsPropietario" class="filter-group">
                <label :for="`propietario-${reporte.id}`">Propietario</label>
                <select
                  :id="`propietario-${reporte.id}`"
                  v-model="filtros.propietarioId"
                  class="filter-control"
                  :class="{ 'filter-control--cambiado': filtros.propietarioId }"
                  :disabled="cargandoPropietarios"
                >
                  <option value="">
                    {{ cargandoPropietarios ? 'Cargando propietarios...' : 'Todos los propietarios' }}
                  </option>
                  <option v-for="p in propietarios" :key="p.id" :value="String(p.id)">
                    {{ p.nombre }}{{ p.tipo_propietario ? ` (${labelTipoPropietario(p.tipo_propietario)})` : '' }}
                  </option>
                </select>
                <small v-if="errorPropietarios" class="filter-hint filter-hint--error">
                  {{ errorPropietarios }}
                  <button type="button" class="filter-retry" @click="cargarPropietarios">Reintentar</button>
                </small>
              </div>

              <div v-if="reporte.needsPorcentaje" class="filter-group">
                <label :for="`porcentaje-${reporte.id}`">% de administración</label>
                <input
                  :id="`porcentaje-${reporte.id}`"
                  v-model.number="filtros.porcentajeAdmin"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  class="filter-control"
                  :class="{ 'filter-control--cambiado': Number(filtros.porcentajeAdmin) > 0 }"
                />
                <small class="filter-hint">Se descuenta de los ingresos de propietarios que no son propios.</small>
              </div>
            </div>

            <p v-else class="reporte-panel__empty-filter">
              Este reporte no necesita filtros adicionales.
            </p>

            <p v-if="resumenFiltros(reporte).length" class="reporte-resumen">
              Se generará con:
              <template v-for="(parte, i) in resumenFiltros(reporte)" :key="parte.etiqueta">
                <span v-if="i" class="reporte-resumen__sep">·</span>
                {{ parte.etiqueta }} <strong>{{ parte.valor }}</strong>
              </template>
            </p>

            <div class="reporte-actions">
              <button type="button" class="action-btn action-btn--ghost" @click="limpiarFiltros(reporte)">
                <i class="pi pi-filter-slash"></i>
                Limpiar
              </button>
              <button
                type="button"
                class="action-btn action-btn--ghost"
                :disabled="generando === reporte.id"
                title="Descargar el PDF como archivo"
                @click="generarReporte(reporte, 'descargar')"
              >
                <i class="pi pi-download"></i>
                Descargar
              </button>
              <button
                type="button"
                class="action-btn action-btn--primary"
                :disabled="generando === reporte.id"
                title="Abrir el PDF en una pestaña nueva"
                @click="generarReporte(reporte, 'abrir')"
              >
                <i :class="generando === reporte.id ? 'pi pi-spin pi-spinner' : 'pi pi-file-pdf'"></i>
                {{ generando === reporte.id ? 'Generando...' : 'Abrir PDF' }}
              </button>
            </div>
          </div>
        </Transition>
      </article>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import { useAppTheme } from '@/composables/useAppTheme'
import api from '@/services/api'
import { fetchAllPaginated } from '@/utils/apiPagination'
import { abrirPdf, descargarPdf } from '@/utils/pdfDownload'
import { toastSuccess } from '@/utils/toast'
import { useAuthStore } from '@/stores/auth'

const { isDark } = useAppTheme()
const generando = ref('')
const STORAGE_KEY_REPORTE_ABIERTO = 'rentacar:reportes:reporte-abierto'
const reporteAbierto = ref('')
const destello = ref(0)

const filtros = reactive({
  periodo: 'mes',
  fechaInicio: '',
  fechaFin: '',
  dias: 30,
  propietarioId: '',
  porcentajeAdmin: 0,
})

const propietarios = ref([])
const cargandoPropietarios = ref(false)
const errorPropietarios = ref('')

async function cargarPropietarios() {
  cargandoPropietarios.value = true
  errorPropietarios.value = ''
  try {
    const { items } = await fetchAllPaginated((params) => api.get('/admin/propietarios', { params }))
    propietarios.value = [...items].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
  } catch (e) {
    propietarios.value = []
    errorPropietarios.value = e.response?.data?.message || 'No se pudo cargar la lista de propietarios.'
  } finally {
    cargandoPropietarios.value = false
  }
}

function labelTipoPropietario(tipo) {
  const labels = { PROPIO: 'propio', TERCERO: 'tercero', FAMILIAR: 'familiar' }
  return labels[tipo] || String(tipo).toLowerCase()
}

const catalogoReportes = [
  {
    id: 'desempeno-general',
    titulo: 'Desempeño general',
    descripcion: 'Resumen ejecutivo de ingresos, contratos, ocupación de flota, clientes nuevos y gastos del negocio (incidencias y mantenimientos).',
    icono: 'pi-chart-line',
    endpoint: '/admin/reportes/desempeno-general',
    needsPeriod: true,
  },
  {
    id: 'ingresos',
    titulo: 'Ingresos',
    descripcion: 'Detalle de pagos confirmados dentro del periodo seleccionado.',
    icono: 'pi-dollar',
    endpoint: '/admin/reportes/ingresos',
    needsPeriod: true,
  },
  {
    id: 'estado-flota',
    titulo: 'Estado de flota',
    descripcion: 'Distribución de vehículos por estado y listado general de la flota.',
    icono: 'pi-car',
    endpoint: '/admin/reportes/estado-flota',
  },
  {
    id: 'licencias-por-vencer',
    titulo: 'Licencias por vencer',
    descripcion: 'Clientes con licencia próxima a vencer según el rango de días indicado.',
    icono: 'pi-id-card',
    endpoint: '/admin/reportes/licencias-por-vencer',
    needsDias: true,
  },
  {
    id: 'reservas-canceladas',
    titulo: 'Reservas canceladas',
    descripcion: 'Historial de reservas canceladas, incluyendo motivo, cliente, vehículo y usuario responsable.',
    icono: 'pi-history',
    endpoint: '/admin/reportes/reservas-canceladas',
    needsPeriod: true,
  },
  {
    id: 'ingresos-por-vehiculo',
    titulo: 'Ingresos por vehículo',
    descripcion: 'Ingresos confirmados agrupados por vehículo, con filtro opcional por propietario.',
    icono: 'pi-wallet',
    endpoint: '/admin/reportes/ingresos-por-vehiculo',
    needsPeriod: true,
    needsPropietario: true,
  },
  {
    id: 'gastos-por-vehiculo',
    titulo: 'Gastos por vehículo',
    descripcion: 'Gastos del negocio por vehículo: incidencias asumidas por el negocio y mantenimientos.',
    icono: 'pi-wrench',
    endpoint: '/admin/reportes/gastos-por-vehiculo',
    needsPeriod: true,
  },
  {
    id: 'resultado-neto-por-vehiculo',
    titulo: 'Resultado neto por vehículo',
    descripcion: 'Comparativo por vehículo de ingresos confirmados, gastos (incidencias del negocio y mantenimientos) y resultado neto.',
    icono: 'pi-chart-pie',
    endpoint: '/admin/reportes/resultado-neto-por-vehiculo',
    needsPeriod: true,
  },
  {
    id: 'resultado-neto-por-propietario',
    titulo: 'Resultado neto por propietario',
    descripcion: 'Ingresos, gastos (incidencias del negocio y mantenimientos) y resultado neto agrupados por propietario.',
    icono: 'pi-wallet',
    endpoint: '/admin/reportes/resultado-neto-por-propietario',
    needsPeriod: true,
    needsPropietario: true,
    needsPorcentaje: true,
  },
  {
    id: 'saldos-pendientes',
    titulo: 'Saldos pendientes',
    descripcion: 'Contratos con pagos incompletos y saldos todavía pendientes de cobro.',
    icono: 'pi-credit-card',
    endpoint: '/admin/reportes/saldos-pendientes',
  },
]

// el empleado solo ve reportes sin montos de dinero (coincide con ReporteController del back)
const REPORTES_EMPLEADO = ['estado-flota', 'licencias-por-vencer', 'reservas-canceladas']
const authStore = useAuthStore()
const reportes = computed(() => {
  const roles = authStore.userRoles
  const veTodo = roles.includes('ADMINISTRADOR') || roles.includes('CONTADOR')
  return veTodo ? catalogoReportes : catalogoReportes.filter((r) => REPORTES_EMPLEADO.includes(r.id))
})

const periodos = [
  { value: 'mes', label: 'Este mes' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado' },
]

function toggleReporte(id) {
  reporteAbierto.value = reporteAbierto.value === id ? '' : id
  localStorage.setItem(STORAGE_KEY_REPORTE_ABIERTO, reporteAbierto.value)
}

function rangoPeriodo(valor) {
  const hoy = new Date()
  if (valor === 'mes') return { inicio: fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), fin: fechaISO(hoy) }
  if (valor === 'trimestral') {
    const inicio = new Date(hoy)
    inicio.setMonth(hoy.getMonth() - 3)
    return { inicio: fechaISO(inicio), fin: fechaISO(hoy) }
  }
  if (valor === 'anual') return { inicio: fechaISO(new Date(hoy.getFullYear(), 0, 1)), fin: fechaISO(hoy) }
  return null
}

function seleccionarPeriodo(valor) {
  filtros.periodo = valor
  const rango = rangoPeriodo(valor)
  if (!rango) return
  filtros.fechaInicio = rango.inicio
  filtros.fechaFin = rango.fin
  destello.value++
}

// si se cambia una fecha a mano ya no es "este mes": se marca personalizado
watch(() => [filtros.fechaInicio, filtros.fechaFin], ([inicio, fin]) => {
  const rango = rangoPeriodo(filtros.periodo)
  if (rango && (rango.inicio !== inicio || rango.fin !== fin)) filtros.periodo = 'personalizado'
})

function fechaCorta(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

// lo que se va a mandar al reporte, para que se vea que el filtro si cambio
function resumenFiltros(reporte) {
  const partes = []
  if (reporte.needsPeriod) {
    const periodo = periodos.find((p) => p.value === filtros.periodo)?.label || 'Personalizado'
    partes.push({ etiqueta: `${periodo}:`, valor: `${fechaCorta(filtros.fechaInicio)} – ${fechaCorta(filtros.fechaFin)}` })
  }
  if (reporte.needsDias) partes.push({ etiqueta: 'Licencias que vencen en', valor: `${filtros.dias || 0} días` })
  if (reporte.needsPropietario) {
    const prop = propietarios.value.find((p) => String(p.id) === filtros.propietarioId)
    partes.push({ etiqueta: 'Propietario:', valor: prop ? prop.nombre : 'Todos' })
  }
  if (reporte.needsPorcentaje) partes.push({ etiqueta: 'Administración:', valor: `${Number(filtros.porcentajeAdmin) || 0}%` })
  return partes
}

function limpiarFiltros(reporte) {
  filtros.dias = 30
  filtros.propietarioId = ''
  filtros.porcentajeAdmin = 0
  if (reporte.needsPeriod) seleccionarPeriodo('mes')
}

async function generarReporte(reporte, modo = 'abrir') {
  const error = validarReporte(reporte)
  if (error) {
    await mostrarAlerta('warning', 'Revisa los filtros', error)
    return
  }

  generando.value = reporte.id
  try {
    const resultado = modo === 'descargar'
      ? await descargarPdf(reporte.endpoint, paramsReporte(reporte), `reporte-${reporte.id}.pdf`)
      : await abrirPdf(reporte.endpoint, paramsReporte(reporte))
    toastSuccess(
      'Reporte generado',
      resultado?.modo === 'descarga'
        ? `Se descargó ${resultado.filename}.`
        : 'El PDF se abrió en una pestaña nueva.',
    )
  } catch (e) {
    await mostrarAlerta('error', 'No se pudo generar', e.response?.data?.message || e.message || 'Intenta de nuevo.')
  } finally {
    generando.value = ''
  }
}

function validarReporte(reporte) {
  if (reporte.needsPeriod && (!filtros.fechaInicio || !filtros.fechaFin)) {
    return 'Selecciona la fecha de inicio y la fecha fin.'
  }

  if (reporte.needsPeriod && filtros.fechaFin < filtros.fechaInicio) {
    return 'La fecha fin debe ser igual o posterior a la fecha de inicio.'
  }

  if (reporte.needsDias && (!Number.isFinite(Number(filtros.dias)) || Number(filtros.dias) < 1 || Number(filtros.dias) > 365)) {
    return 'Los días por vencer deben estar entre 1 y 365.'
  }

  const porcentaje = Number(filtros.porcentajeAdmin || 0)
  if (reporte.needsPorcentaje && (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100)) {
    return 'El porcentaje de administración debe estar entre 0 y 100.'
  }

  return ''
}

function paramsReporte(reporte) {
  const params = {}

  if (reporte.needsPeriod) {
    params.fecha_inicio = filtros.fechaInicio
    params.fecha_fin = filtros.fechaFin
  }

  if (reporte.needsDias) params.dias = filtros.dias
  if (reporte.needsPropietario && filtros.propietarioId) params.propietario_id = filtros.propietarioId
  if (reporte.needsPorcentaje && Number(filtros.porcentajeAdmin) > 0) {
    params.porcentaje_administracion = Number(filtros.porcentajeAdmin)
  }

  return params
}

async function mostrarAlerta(icon, title, text) {
  await Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: '#c0392b',
    background: isDark.value ? '#1f2937' : '#fff',
    color: isDark.value ? '#f3f4f6' : '#111827',
  })
}

function fechaISO(fecha) {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  seleccionarPeriodo('mes')
  cargarPropietarios()
  const reporteGuardado = localStorage.getItem(STORAGE_KEY_REPORTE_ABIERTO)
  if (reportes.value.some((reporte) => reporte.id === reporteGuardado)) {
    reporteAbierto.value = reporteGuardado
  }
})
</script>

<style scoped>
.reportes-page {
  padding: 0.25rem 0 2rem;
}

.reportes-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 4.5rem;
  margin-bottom: 1.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid;
  border-radius: 0.85rem;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.reportes-header--light {
  background: #fff;
  border-color: #dbe3ed;
}

.reportes-header--dark {
  background: #111827;
  border-color: #263244;
}

.reportes-header__accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.55rem;
  background: #922b21;
}

.reportes-header__icon {
  margin-left: 0.55rem;
  color: #c0392b;
  font-size: 1.25rem;
}

.reportes-header h1 {
  color: #922b21;
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.2;
}

.reportes-header--dark h1 {
  color: #f0a500;
}

.reportes-header p {
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.85rem;
}

.reportes-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.reporte-item {
  border: 1px solid;
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.reporte-item--light {
  background: #fff;
  border-color: #dbe3ed;
}

.reporte-item--dark {
  background: #111827;
  border-color: #263244;
}

.reporte-item--open {
  border-color: rgba(192, 57, 43, 0.45);
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.12);
}

.reporte-trigger {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  min-height: 4.25rem;
  padding: 1rem 1.4rem;
  color: #922b21;
  text-align: left;
  background: transparent;
  border: 0;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.reporte-item--dark .reporte-trigger {
  color: #f0a500;
}

.reporte-trigger__arrow {
  color: #922b21;
  font-size: 1rem;
}

.reporte-trigger__icon {
  color: #c0392b;
  font-size: 1.1rem;
}

.reporte-panel {
  padding: 1.35rem 2rem 1.55rem;
  border-top: 1px solid #e2e8f0;
}

.reporte-item--dark .reporte-panel {
  border-top-color: #263244;
}

.reporte-panel__description,
.reporte-panel__empty-filter {
  margin-bottom: 1.15rem;
  color: #64748b;
  font-size: 0.9rem;
}

.reporte-panel__empty-filter {
  padding: 0.9rem 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 0.75rem;
}

.reporte-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.2rem;
  margin-bottom: 1.25rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-group--wide {
  grid-column: 1 / -1;
}

.filter-group label {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
}

.reporte-item--dark .filter-group label {
  color: #cbd5e1;
}

.filter-control {
  width: 100%;
  min-height: 2.85rem;
  padding: 0.65rem 0.75rem;
  color: #1e293b;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 0.2rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.reporte-item--dark .filter-control {
  color: #f8fafc;
  background: #0f172a;
  border-color: #334155;
}

.filter-control:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.12);
}

/* filtro distinto al valor por defecto */
.filter-control--cambiado {
  border-color: #c0392b;
  background: #fdf3f2;
}

.reporte-item--dark .filter-control--cambiado {
  border-color: #f0a500;
  background: rgba(240, 165, 0, 0.08);
}

/* al elegir un periodo las fechas parpadean para que se note que cambiaron */
.filter-control--destello {
  animation: destello-fecha 0.7s ease;
}

@keyframes destello-fecha {
  0% { box-shadow: 0 0 0 4px rgba(192, 57, 43, 0.35); }
  100% { box-shadow: 0 0 0 0 rgba(192, 57, 43, 0); }
}

.reporte-resumen {
  margin: -0.25rem 0 1.1rem;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.6;
}

.reporte-resumen strong {
  color: #922b21;
  font-weight: 700;
}

.reporte-item--dark .reporte-resumen strong {
  color: #f0a500;
}

.reporte-resumen__sep {
  margin: 0 0.4rem;
  opacity: 0.5;
}

.filter-control:disabled {
  opacity: 0.6;
  cursor: wait;
}

.filter-hint {
  color: #64748b;
  font-size: 0.72rem;
  line-height: 1.35;
}

.reporte-item--dark .filter-hint {
  color: #94a3b8;
}

.filter-hint--error {
  color: #b91c1c;
}

.reporte-item--dark .filter-hint--error {
  color: #fca5a5;
}

.filter-retry {
  margin-left: 0.35rem;
  font-weight: 800;
  text-decoration: underline;
  color: inherit;
}

.period-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.period-btn {
  min-height: 2.25rem;
  padding: 0.45rem 0.85rem;
  color: #475569;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.reporte-item--dark .period-btn {
  color: #cbd5e1;
  background: #0f172a;
  border-color: #334155;
}

.period-btn--active {
  color: #fff;
  background: #922b21;
  border-color: #922b21;
}

.reporte-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.4rem;
}

.reporte-actions > .action-btn:first-child {
  margin-right: auto;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.45rem;
  padding: 0.55rem 1rem;
  border: 1px solid;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  font-weight: 800;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.action-btn--ghost {
  color: #922b21;
  background: transparent;
  border-color: rgba(192, 57, 43, 0.45);
}

.action-btn--primary {
  color: #fff;
  background: #c0392b;
  border-color: #c0392b;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

@media (max-width: 768px) {
  .reporte-panel {
    padding: 1rem;
  }

  .reporte-filters {
    grid-template-columns: 1fr;
  }

  .reporte-actions {
    flex-direction: column-reverse;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
