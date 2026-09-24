<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.45);"
        @click.self.stop="$emit('cerrar')"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" @click.stop>
          <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style="background:#fee2e2;">
            <i class="pi pi-trash text-xl" style="color:#c0392b;"></i>
          </div>
          <p class="font-extrabold text-gray-900 text-lg mb-1">¿Eliminar usuario?</p>
          <p class="text-sm text-gray-500 mb-6">
            Vas a eliminar a <strong>{{ usuario?.nombre }}</strong>. Esta acción no se puede deshacer.
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              @click.stop.prevent="$emit('cerrar')"
              class="flex-1 py-2.5 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            >Cancelar</button>
            <button
              type="button"
              @click.stop.prevent="$emit('confirmar')"
              class="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
              style="background:#c0392b;"
            >Eliminar</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  visible:  Boolean,
  usuario:  Object,
})
defineEmits(['confirmar', 'cerrar'])
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
