<template>
  <div ref="raiz" class="sb-wrap" :class="[isDark ? 'sb-dark' : 'sb-light', { 'sb-open': abierto }]">
    <div class="relative">
      <i :class="['pi', icono, 'sb-icon']"></i>
      <input
        ref="input"
        :value="abierto ? termino : etiquetaSeleccionada"
        type="text"
        class="sb-input"
        :class="[inputClass, { error }]"
        :placeholder="abierto && etiquetaSeleccionada ? etiquetaSeleccionada : placeholder"
        :disabled="disabled"
        autocomplete="off"
        role="combobox"
        :aria-expanded="abierto"
        @focus="abrir"
        @click="abrir"
        @input="onInput"
        @keydown.down.prevent="mover(1)"
        @keydown.up.prevent="mover(-1)"
        @keydown.enter.prevent="elegirResaltada"
        @keydown.esc.prevent="cerrar"
        @keydown.tab="cerrar"
      />
      <button
        v-if="modelValue && !disabled && !abierto"
        type="button"
        class="sb-clear"
        title="Quitar"
        @mousedown.prevent="limpiar"
      >
        <i class="pi pi-times"></i>
      </button>
      <i v-else :class="['pi', buscando ? 'pi-spin pi-spinner' : 'pi-chevron-down', 'sb-caret']"></i>
    </div>

    <ul v-if="abierto" class="sb-list" role="listbox">
      <li v-if="buscando && !visibles.length" class="sb-empty">Buscando...</li>
      <li v-else-if="!visibles.length" class="sb-empty">
        {{ termino.trim() ? `Sin resultados para "${termino.trim()}"` : 'No hay opciones' }}
      </li>
      <li
        v-for="(op, i) in visibles"
        :key="op.id"
        role="option"
        :aria-selected="String(op.id) === String(modelValue)"
        class="sb-item"
        :class="{ 'sb-item--hl': i === resaltada, 'sb-item--sel': String(op.id) === String(modelValue) }"
        @mousedown.prevent="elegir(op)"
        @mouseenter="resaltada = i"
      >
        <span>{{ op.nombre }}</span>
        <i v-if="String(op.id) === String(modelValue)" class="pi pi-check"></i>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'

// select con buscador. si llega "buscar" filtra en el back (?search=), si no filtra local
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  opciones: { type: Array, default: () => [] },
  buscar: { type: Function, default: null },
  placeholder: { type: String, default: 'Buscar...' },
  icono: { type: String, default: 'pi-search' },
  disabled: Boolean,
  error: Boolean,
  inputClass: { type: [String, Array, Object], default: '' },
})
const emit = defineEmits(['update:modelValue', 'change'])
const { isDark } = useAppTheme()

const raiz = ref(null)
const input = ref(null)
const abierto = ref(false)
const termino = ref('')
const resaltada = ref(0)
const remotas = ref(null)
const buscando = ref(false)
// guarda la opcion elegida por si no viene en la lista filtrada
const elegida = ref(null)
let timer = null
let version = 0

const seleccion = computed(() =>
  props.opciones.find((o) => String(o.id) === String(props.modelValue))
  || (elegida.value && String(elegida.value.id) === String(props.modelValue) ? elegida.value : null),
)
const etiquetaSeleccionada = computed(() => seleccion.value?.nombre || '')

const visibles = computed(() => {
  if (remotas.value) return remotas.value
  const q = normalizar(termino.value)
  if (!q) return props.opciones
  return props.opciones.filter((o) => normalizar(o.nombre).includes(q))
})

watch(visibles, () => { resaltada.value = 0 })

function normalizar(v) {
  // sin tildes para que "peru" encuentre "Perú"
  return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function abrir() {
  if (props.disabled || abierto.value) return
  abierto.value = true
  termino.value = ''
  remotas.value = null
  resaltada.value = Math.max(0, visibles.value.findIndex((o) => String(o.id) === String(props.modelValue)))
}

function cerrar() {
  abierto.value = false
  termino.value = ''
  remotas.value = null
  clearTimeout(timer)
  version++
  buscando.value = false
}

function onInput(e) {
  termino.value = e.target.value
  if (!props.buscar) return
  clearTimeout(timer)
  const q = termino.value.trim()
  if (!q) { remotas.value = null; buscando.value = false; version++; return }
  buscando.value = true
  timer = setTimeout(async () => {
    const actual = ++version
    try {
      const res = await props.buscar(q)
      if (actual === version) remotas.value = Array.isArray(res) ? res : []
    } catch {
      // si el back falla se queda con el filtro local
      if (actual === version) remotas.value = null
    } finally {
      if (actual === version) buscando.value = false
    }
  }, 250)
}

function mover(paso) {
  if (!abierto.value) { abrir(); return }
  const n = visibles.value.length
  if (!n) return
  resaltada.value = (resaltada.value + paso + n) % n
  raiz.value?.querySelectorAll('.sb-item')[resaltada.value]?.scrollIntoView({ block: 'nearest' })
}

function elegirResaltada() {
  const op = visibles.value[resaltada.value]
  if (op) elegir(op)
}

function elegir(op) {
  elegida.value = op
  emit('update:modelValue', String(op.id))
  emit('change', op)
  cerrar()
  input.value?.blur()
}

function limpiar() {
  elegida.value = null
  emit('update:modelValue', '')
  emit('change', null)
}

function clickFuera(e) {
  if (abierto.value && raiz.value && !raiz.value.contains(e.target)) cerrar()
}

onMounted(() => document.addEventListener('mousedown', clickFuera))
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', clickFuera)
  clearTimeout(timer)
})
</script>

<style scoped>
.sb-wrap { position: relative; }
.sb-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-size:0.875rem; pointer-events:none; }
.sb-input { width:100%; padding:0.75rem 2.25rem 0.75rem 2.5rem; border-radius:0.75rem; font-size:0.875rem; outline:none; transition:all 0.15s; cursor:text; }
.sb-input:focus { border-color:#c0392b; box-shadow:0 0 0 3px rgba(192,57,43,0.1); }
.sb-input:disabled { opacity:0.7; cursor:not-allowed; }
.sb-caret, .sb-clear { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); font-size:0.75rem; }
.sb-caret { pointer-events:none; opacity:0.6; }
.sb-clear { width:1.25rem; height:1.25rem; display:flex; align-items:center; justify-content:center; border-radius:9999px; opacity:0.6; }
.sb-clear:hover { opacity:1; }
.sb-clear .pi { font-size:0.65rem; }
.sb-list { position:absolute; z-index:30; left:0; right:0; top:calc(100% + 0.25rem); max-height:13rem; overflow-y:auto; border-radius:0.75rem; padding:0.25rem; box-shadow:0 10px 25px rgba(0,0,0,0.15); }
.sb-item { display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.5rem 0.75rem; border-radius:0.5rem; font-size:0.85rem; cursor:pointer; }
.sb-item .pi { font-size:0.75rem; }
.sb-empty { padding:0.6rem 0.75rem; font-size:0.8rem; opacity:0.7; }

.sb-light .sb-icon { color:#c0392b; opacity:0.65; }
.sb-light .sb-input { border:1px solid #d1d5db; background:#f9fafb; color:#1f2937; }
.sb-light .sb-input:focus { background:white; }
.sb-light .sb-input.error { border-color:#f87171; background:#fef2f2; }
.sb-light .sb-list { background:white; border:1px solid #e5e7eb; color:#1f2937; }
.sb-light .sb-item--hl { background:#fef2f2; }
.sb-light .sb-item--sel { color:#c0392b; font-weight:700; }

.sb-dark .sb-icon { color:#f0a500; opacity:0.9; }
.sb-dark .sb-input { border:1px solid #4b5563; background:#1f2937; color:#f3f4f6; }
.sb-dark .sb-input:focus { background:#111827; }
.sb-dark .sb-input.error { border-color:#f87171; background:#450a0a; }
.sb-dark .sb-list { background:#1f2937; border:1px solid #374151; color:#e5e7eb; }
.sb-dark .sb-item--hl { background:rgba(240,165,0,0.12); }
.sb-dark .sb-item--sel { color:#f0a500; font-weight:700; }
.sb-dark .sb-clear { color:#e5e7eb; }
</style>
