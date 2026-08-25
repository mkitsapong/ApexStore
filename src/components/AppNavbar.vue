<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePaymentStore } from '../stores/payment'

const auth = useAuthStore()
const payment = usePaymentStore()
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleLogout() {
  auth.logout()
  router.push('/')
  userMenuOpen.value = false
}

function formatBalance(n) {
  return `฿${Number(n).toLocaleString('th-TH')}`
}
</script>

<template>
  <header>
    <!-- Announcement Bar -->
    <div
      v-if="payment.storeSettings?.showAnnouncement && payment.storeSettings?.announcement"
      style="background:linear-gradient(90deg, #ea580c 0%, #f97316 100%); color:white; font-size:0.8rem; font-weight:600; text-align:center; padding:5px 12px; display:flex; align-items:center; justify-content:center; gap:8px;"
    >
      <span>{{ payment.storeSettings.announcement }}</span>
    </div>

    <nav class="navbar">
      <div class="container">
        <div class="navbar-inner">
          <!-- Logo -->
          <RouterLink to="/" class="navbar-logo">
            ⚡ {{ payment.storeSettings?.storeName || 'ApexStore' }}
          </RouterLink>

        <!-- Desktop Nav -->
        <ul class="navbar-nav">
          <li><RouterLink to="/" class="navbar-link" :class="{ active: isActive('/') && route.path === '/' }">หน้าหลัก</RouterLink></li>
          <li><RouterLink to="/shop" class="navbar-link" :class="{ active: isActive('/shop') }">ร้านค้า</RouterLink></li>
        </ul>

        <!-- Actions -->
        <div class="navbar-actions">
          <!-- Wallet balance -->
          <div v-if="auth.isLoggedIn" class="wallet-badge">
            💰 {{ formatBalance(auth.balance) }}
          </div>

          <!-- Logged in user -->
          <div v-if="auth.isLoggedIn" class="user-menu-wrapper" style="position:relative">
            <button class="btn btn-secondary btn-sm" @click="userMenuOpen = !userMenuOpen" style="gap:8px">
              <span style="font-size:1.1rem">👤</span>
              {{ auth.user?.username }}
              <span style="font-size:0.75rem; opacity:0.6">▾</span>
            </button>
            <!-- Dropdown -->
            <div v-if="userMenuOpen" class="user-dropdown" @click.stop>
              <RouterLink to="/dashboard" class="dropdown-item" @click="userMenuOpen=false">📊 Dashboard</RouterLink>
              <RouterLink to="/orders" class="dropdown-item" @click="userMenuOpen=false">📦 คำสั่งซื้อ</RouterLink>
              <RouterLink to="/wallet" class="dropdown-item" @click="userMenuOpen=false">💰 Wallet</RouterLink>
              <RouterLink to="/profile" class="dropdown-item" @click="userMenuOpen=false">⚙️ โปรไฟล์</RouterLink>
              <div v-if="auth.isAdmin" class="dropdown-divider"></div>
              <RouterLink v-if="auth.isAdmin" to="/admin" class="dropdown-item text-accent" @click="userMenuOpen=false">👑 Admin Panel</RouterLink>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item text-danger" @click="handleLogout">🚪 ออกจากระบบ</button>
            </div>
          </div>

          <!-- Guest -->
          <template v-else>
            <RouterLink to="/auth/login" class="btn btn-secondary btn-sm">เข้าสู่ระบบ</RouterLink>
            <RouterLink to="/auth/register" class="btn btn-primary btn-sm">สมัครสมาชิก</RouterLink>
          </template>
        </div>
      </div>
    </div>

    <!-- Overlay to close dropdown -->
    <div v-if="userMenuOpen" style="position:fixed;inset:0;z-index:99" @click="userMenuOpen=false"></div>
  </nav>
  </header>
</template>

<style scoped>
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  min-width: 200px;
  padding: var(--space-2);
  z-index: var(--z-dropdown);
  box-shadow: var(--shadow-xl);
  animation: fadeIn 0.15s ease;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--gray-300);
  transition: all var(--transition-fast);
  cursor: pointer;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-body);
}

.dropdown-item:hover {
  background: var(--glass-hover);
  color: var(--white);
}

.dropdown-divider {
  height: 1px;
  background: var(--glass-border);
  margin: var(--space-2) 0;
}
</style>
