<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[80] flex flex-col bg-black/50"
      @click.self.stop="$emit('cerrar')"
    >
      <div class="flex flex-col mx-auto my-4 w-full max-w-4xl flex-1 max-h-[92vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b bg-red-800 text-white">
          <div>
            <p class="font-extrabold text-sm">Contrato PDF</p>
            <p class="text-xs opacity-80 font-mono">{{ contrato?.numero_contrato }}</p>
          </div>
          <button type="button" class="w-8 h-8 rounded-lg hover:bg-white/10" @click.stop.prevent="$emit('cerrar')">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="flex-1 min-h-0 bg-gray-100 relative">
          <div v-if="cargando" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
            <span class="text-sm">Generando PDF...</span>
          </div>
          <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <i class="pi pi-exclamation-triangle text-2xl text-red-600"></i>
            <p class="text-sm text-gray-600">{{ error }}</p>
            <button type="button" class="px-4 py-2 text-sm font-bold text-white rounded-lg" style="background:#922b21;" @click="cargarPdf">
              Reintentar
            </button>
          </div>
          <iframe
            v-else-if="pdfUrl"
            :src="pdfUrl"
            class="w-full h-full min-h-[480px] border-0 bg-white"
            title="Vista previa del contrato"
          />
        </div>

        <div class="flex gap-3 p-4 border-t bg-white">
          <button type="button" class="flex-1 py-2.5 rounded-lg border font-bold text-sm" @click.stop.prevent="$emit('cerrar')">
            Cerrar
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-50"
            style="background:#922b21;"
            :disabled="!blob || cargando"
            @click="descargar"
          >
            <i class="pi pi-download mr-1"></i> Descargar PDF
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-50"
            style="background:#c0392b;"
            :disabled="!pdfUrl || cargando"
            @click="abrirNuevaPestana"
          >
            <i class="pi pi-external-link mr-1"></i> Abrir
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { obtenerPdfBlobUrl, revocarPdfBlobUrl, descargarBlob } from '@/utils/pdfDownload'

const props = defineProps({
  visible:  { type: Boolean, default: false },
  contrato: { type: Object, default: null },
})

defineEmits(['cerrar'])

const cargando = ref(false)
const error = ref('')
const pdfUrl = ref('')
const filename = ref('contrato.pdf')
const blob = ref(null)

async function cargarPdf() {
  if (!props.contrato?.id) {
    error.value = 'Contrato no disponible.'
    return
  }

  limpiar()
  cargando.value = true
  error.value = ''

  try {
    const result = await obtenerPdfBlobUrl(`/admin/contratos/${props.contrato.id}/pdf`)
    pdfUrl.value = result.blobUrl
    filename.value = result.filename
    blob.value = result.blob
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo generar el PDF del contrato.'
  } finally {
    cargando.value = false
  }
}

function limpiar() {
  revocarPdfBlobUrl(pdfUrl.value)
  pdfUrl.value = ''
  blob.value = null
}

function descargar() {
  if (blob.value) descargarBlob(blob.value, filename.value)
}

function abrirNuevaPestana() {
  if (pdfUrl.value) window.open(pdfUrl.value, '_blank')
}

watch(
  () => [props.visible, props.contrato?.id],
  ([vis, id]) => {
    if (vis && id) cargarPdf()
    if (!vis) limpiar()
  },
  { immediate: true },
)

onBeforeUnmount(limpiar)
</script>

