<template>
  <aside class="ticket-panel">
    <!-- perforación superior estilo ticket -->
    <div class="ticket-perforation"></div>

    <div class="ticket-header">
      <div class="ticket-logo">
        <i class="pi pi-file-edit"></i>
      </div>
      <div>
        <p class="ticket-brand">RentaCar El Guayabo</p>
        <p class="ticket-sub">Vista previa del contrato</p>
      </div>
    </div>

    <div class="ticket-divider"></div>

    <div class="ticket-body">
      <div class="ticket-row" :class="{ 'ticket-row--empty': !cliente }">
        <span class="ticket-key">Cliente</span>
        <span class="ticket-val">{{ cliente?.nombre || '—' }}</span>
      </div>
      <div v-if="cliente" class="ticket-row ticket-row--sub">
        <span class="ticket-key">DUI</span>
        <span class="ticket-val">{{ documentoCliente(cliente) }}</span>
      </div>

      <div class="ticket-row" :class="{ 'ticket-row--empty': !fechaEntrega }">
        <span class="ticket-key">Entrega</span>
        <span class="ticket-val">{{ lineaFechaHora(fechaEntrega, horaEntrega) }}</span>
      </div>
      <div class="ticket-row" :class="{ 'ticket-row--empty': !fechaDevolucion }">
        <span class="ticket-key">Devolución</span>
        <span class="ticket-val">{{ lineaFechaHora(fechaDevolucion, horaDevolucion) }}</span>
      </div>
      <div v-if="dias" class="ticket-row ticket-row--sub">
        <span class="ticket-key">Duración</span>
        <span class="ticket-val">{{ dias }} día(s)</span>
      </div>

      <div class="ticket-row" :class="{ 'ticket-row--empty': !vehiculo }">
        <span class="ticket-key">Vehículo</span>
        <span class="ticket-val">{{ vehiculo ? nombreVehiculo(vehiculo) : '—' }}</span>
      </div>
      <div v-if="vehiculo?.placa" class="ticket-row ticket-row--sub">
        <span class="ticket-key">Placa</span>
        <span class="ticket-val ticket-val--mono">{{ vehiculo.placa }}</span>
      </div>
    </div>

    <div class="ticket-divider ticket-divider--dashed"></div>

    <div class="ticket-total">
      <span class="ticket-total-label">Total estimado</span>
      <span class="ticket-total-amount">${{ totalEstimado ? formatPrecio(totalEstimado) : '0.00' }}</span>
    </div>

    <!-- Indicador de paso -->
    <div class="ticket-steps">
      <span v-for="n in 3" :key="n" class="ticket-dot" :class="{ 'ticket-dot--active': paso === n, 'ticket-dot--done': n < paso }"></span>
    </div>

    <div v-if="contratoGenerado" class="ticket-actions">
      <button type="button" class="ticket-action-btn" @click="$emit('ver-pdf')">
        <i class="pi pi-eye"></i> Ver PDF
      </button>
      <router-link
        :to="{ name: 'pagos', query: { contrato_id: contratoGenerado.id } }"
        class="ticket-action-btn ticket-action-btn--green"
      >
        <i class="pi pi-dollar"></i> Cobrar
      </router-link>
    </div>

    <div class="ticket-perforation ticket-perforation--bottom"></div>
  </aside>
</template>

<script setup>
import { nombreVehiculo, formatPrecio, formatHora12 } from '@/utils/contratoFormatters'
import { formatFecha } from '@/utils/reservaFormatters'
import { documentoCliente } from '@/utils/clienteDocumento'

defineProps({
  cliente:           { type: Object, default: null },
  fechaEntrega:      { type: String, default: '' },
  horaEntrega:       { type: String, default: '' },
  fechaDevolucion:   { type: String, default: '' },
  horaDevolucion:    { type: String, default: '' },
  vehiculo:          { type: Object, default: null },
  dias:              { type: Number, default: 0 },
  totalEstimado:     { type: Number, default: 0 },
  paso:              { type: Number, default: 1 },
  contratoGenerado:  { type: Object, default: null },
})

defineEmits(['ver-pdf'])

function lineaFechaHora(fecha, hora) {
  if (!fecha) return '—'
  const f = formatFecha(fecha)
  if (!hora) return f
  return `${f}, ${formatHora12(hora)}`
}
</script>

<style scoped>
.ticket-panel {
  position: relative;
  background: #1a0a08;
  color: #fef2f2;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(146,43,33,0.4);
}
@media (min-width: 1024px) {
  .ticket-panel {
    position: static;
    align-self: stretch;
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
}

.ticket-perforation {
  height: 10px;
  background: repeating-linear-gradient(90deg, transparent, transparent 6px, #0d0504 6px, #0d0504 12px);
  opacity: 0.6;
}
.ticket-perforation--bottom { transform: rotate(180deg); }

.ticket-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 1.25rem 1.25rem 1rem;
}
.ticket-logo {
  width: 2.75rem; height: 2.75rem; border-radius: 0.75rem;
  background: linear-gradient(135deg, #922b21, #c0392b);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.15rem; color: #fff;
  box-shadow: 0 4px 12px rgba(146,43,33,0.5);
}
.ticket-brand { font-size: 0.8rem; font-weight: 900; letter-spacing: 0.04em; }
.ticket-sub { font-size: 0.65rem; color: rgba(254,242,242,0.5); margin-top: 0.1rem; }

.ticket-divider { height: 1px; background: rgba(240,165,0,0.25); margin: 0 1.25rem; }
.ticket-divider--dashed {
  height: 0; border: none;
  border-top: 2px dashed rgba(240,165,0,0.3);
  margin: 1rem 1.25rem;
}

.ticket-body { padding: 1rem 1.25rem; }
.ticket-row {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 0.5rem; padding: 0.4rem 0; font-size: 0.8rem;
}
.ticket-row--sub { opacity: 0.55; font-size: 0.72rem; padding-top: 0; }
.ticket-row--empty .ticket-val { opacity: 0.3; }
.ticket-key { color: rgba(240,165,0,0.8); font-weight: 700; text-transform: uppercase; font-size: 0.62rem; letter-spacing: 0.08em; flex-shrink: 0; }
.ticket-val { font-weight: 600; text-align: right; line-height: 1.3; }
.ticket-val--mono { font-family: ui-monospace, monospace; letter-spacing: 0.05em; }

.ticket-total {
  padding: 0 1.25rem 1rem;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.ticket-total-label { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(240,165,0,0.7); }
.ticket-total-amount { font-size: 2rem; font-weight: 900; color: #f0a500; letter-spacing: -0.02em; line-height: 1.2; }

.ticket-steps {
  display: flex; justify-content: center; gap: 0.5rem;
  padding: 0 1.25rem 1.25rem;
}
.ticket-dot {
  width: 0.5rem; height: 0.5rem; border-radius: 999px;
  background: rgba(255,255,255,0.15); transition: all 0.2s;
}
.ticket-dot--active { background: #f0a500; transform: scale(1.3); }
.ticket-dot--done { background: #922b21; }

.ticket-actions {
  display: flex; gap: 0.5rem; padding: 0 1.25rem 1.25rem;
}
.ticket-action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.35rem;
  padding: 0.6rem; border-radius: 0.625rem; font-size: 0.72rem; font-weight: 700;
  border: 1px solid rgba(240,165,0,0.35); color: #f0a500; background: rgba(240,165,0,0.08);
  transition: all 0.15s;
}
.ticket-action-btn:hover { background: rgba(240,165,0,0.15); }
.ticket-action-btn--green { border-color: rgba(34,197,94,0.4); color: #86efac; background: rgba(34,197,94,0.1); }
</style>
