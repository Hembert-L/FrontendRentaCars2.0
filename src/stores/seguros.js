import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

function extraerSeguro(payload) {
    return payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? payload.data
        : null
}

export const useSegurosStore = defineStore('seguros', () => {
    const seguros = ref([])
    const proximoAVencer = ref(null)
    const loading = ref(false)
    const error = ref(null)

    async function fetchSeguros() {
        loading.value = true
        error.value = null
        try {
            const res = await api.get('/admin/seguros')
            seguros.value = Array.isArray(res.data?.data) ? res.data.data : []
            proximoAVencer.value = res.data?.proximo_a_vencer || null
            return seguros.value
        } catch (e) {
            error.value = e.response?.data?.message || 'No se pudieron cargar los seguros.'
            seguros.value = []
            proximoAVencer.value = null
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchSeguro(id) {
        const res = await api.get(`/admin/seguros/${id}`)
        return extraerSeguro(res.data)
    }

    async function crear(form) {
        const res = await api.post('/admin/seguros', form)
        return extraerSeguro(res.data)
    }

    async function actualizar(id, form) {
        const res = await api.put(`/admin/seguros/${id}`, form)
        return extraerSeguro(res.data)
    }

    async function anular(id) {
        const res = await api.delete(`/admin/seguros/${id}`)
        return extraerSeguro(res.data)
    }

    const total = computed(() => seguros.value.length)

    return {
        seguros,
        proximoAVencer,
        loading,
        error,
        total,
        fetchSeguros,
        fetchSeguro,
        crear,
        actualizar,
        anular,
    }
})
