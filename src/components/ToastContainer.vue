<script setup>
import { useToastStore } from '../stores/toast'
const toast = useToastStore()

const icons = { success: '✅', error: '❌', info: 'ℹ️' }
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="['toast', `toast-${t.type}`]"
        @click="toast.remove(t.id)"
        style="cursor:pointer"
      >
        <span>{{ icons[t.type] }}</span>
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
