import { ref, computed, watch, onScopeDispose } from 'vue'
import { useClientesStore } from '@/stores/clientes'
import { documentosVigentes } from '@/utils/contratoFormatters'

// Una consulta por selección incompleta; las respuestas antiguas no reemplazan otra selección.
export function useDocumentosCliente(obtenerCliente, obtenerFecha) {
  const store = useClientesStore()
  const completo = ref(null)
  const cargando = ref(false)
  const error = ref('')
  let version = 0
  async function reintentar() {
    const actual = obtenerCliente()
    const consulta = ++version
    completo.value = null
    error.value = ''
    cargando.value = !!actual
    if (!actual) return
    try {
      const resultado = await store.completarDocumentos(actual)
      if (consulta === version) completo.value = resultado
    } catch (e) {
      if (consulta === version) error.value = e.response?.data?.message || e.message || 'No se pudieron consultar los documentos del cliente.'
    } finally {
      if (consulta === version) cargando.value = false
    }
  }
  watch(obtenerCliente, reintentar, { immediate: true, flush: 'sync' })
  onScopeDispose(() => { version++ })
  const estado = computed(() => documentosVigentes(completo.value || obtenerCliente(), obtenerFecha()))
  const ok = computed(() => !!obtenerCliente() && !cargando.value && !error.value && estado.value.ok)
  const mensaje = computed(() => !obtenerCliente() ? '' : cargando.value
    ? 'Consultando vencimientos del DUI y la licencia…'
    : error.value ? `No se pudo comprobar la documentación: ${error.value}` : estado.value.mensaje)
  return { estado, ok, mensaje, cargando, error, reintentar }
}
