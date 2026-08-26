<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'
import ToastContainer from './components/ToastContainer.vue'
import CartDrawer from './components/CartDrawer.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isDashboardRoute = computed(() => ['/dashboard', '/wallet', '/topup', '/orders', '/profile'].some(p => route.path.startsWith(p)))
const isAuthRoute = computed(() => route.path.startsWith('/auth'))
</script>

<template>
  <div id="sp-app">
    <!-- Navbar: show for public + member pages, not admin/auth -->
    <AppNavbar v-if="!isAdminRoute && !isAuthRoute" />

    <!-- Main content -->
    <RouterView />

    <!-- Footer: show on public pages -->
    <AppFooter v-if="!isAdminRoute && !isAuthRoute && !isDashboardRoute" />

    <!-- Global Cart Drawer -->
    <CartDrawer />

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<style scoped>
#sp-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
