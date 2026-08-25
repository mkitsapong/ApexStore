<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useOrdersStore } from '../stores/orders'
import { usePaymentStore } from '../stores/payment'

const auth = useAuthStore()
const payment = usePaymentStore()
const notificationsStore = useNotificationsStore()
const ordersStore = useOrdersStore()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  if (auth.isLoggedIn) {
    await notificationsStore.fetchNotifications()
    const orders = await ordersStore.fetchUserOrders()
    notificationsStore.checkOrderExpirations(orders)
  }
})

const menuItems = [
  { path: '/dashboard', emoji: '📊', label: 'Dashboard' },
  { path: '/orders', emoji: '📦', label: 'คำสั่งซื้อ' },
  { path: '/wallet', emoji: '💰', label: 'Wallet' },
  { path: '/topup', emoji: '➕', label: 'เติมเงิน' },
  { path: '/profile', emoji: '⚙️', label: 'โปรไฟล์' },
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="dashboard-layout">
    <!-- Desktop Sidebar (Hidden on Mobile) -->
    <aside class="sidebar desktop-sidebar">
      <div class="sidebar-logo">
        <RouterLink to="/" class="sidebar-logo-link">
          ⚡ {{ payment.storeSettings?.storeName || 'ApexStore' }}
        </RouterLink>
      </div>

      <!-- User Card in Sidebar -->
      <div style="padding:var(--space-4) var(--space-5); margin-bottom:var(--space-2);">
        <div class="sidebar-user-card">
          <div style="display:flex; align-items:center; gap:var(--space-3); min-width:0;">
            <div class="avatar-placeholder avatar-md">
              {{ auth.user?.username?.[0]?.toUpperCase() || 'U' }}
            </div>
            <div style="min-width:0;">
              <div class="sidebar-user-name">{{ auth.user?.username }}</div>
              <div class="sidebar-user-balance">฿{{ auth.balance.toLocaleString() }}</div>
            </div>
          </div>
          <RouterLink to="/" title="ดูการแจ้งเตือน" class="sidebar-notif-btn">
            <span>🔔</span>
            <span v-if="notificationsStore.unreadCount > 0" class="sidebar-notif-badge">
              {{ notificationsStore.unreadCount }}
            </span>
          </RouterLink>
        </div>
      </div>

      <ul class="sidebar-menu">
        <li v-for="item in menuItems" :key="item.path" class="sidebar-item">
          <RouterLink :to="item.path" :class="['sidebar-link', { active: isActive(item.path) }]">
            <span class="sidebar-icon">{{ item.emoji }}</span>
            {{ item.label }}
          </RouterLink>
        </li>

        <!-- Back to Store -->
        <li class="sidebar-item" style="margin-top:var(--space-3);">
          <RouterLink to="/shop" class="sidebar-link">
            <span class="sidebar-icon">🛒</span>
            หน้าร้านค้า
          </RouterLink>
        </li>

        <!-- Admin link if admin -->
        <li v-if="auth.isAdmin" class="sidebar-item" style="margin-top:var(--space-2);">
          <div class="divider"></div>
          <RouterLink to="/admin" class="sidebar-link text-accent">
            <span class="sidebar-icon">👑</span>
            Admin Panel
          </RouterLink>
        </li>
      </ul>

      <!-- Logout button -->
      <div class="sidebar-logout-box">
        <div class="divider"></div>
        <button class="sidebar-link w-full" @click="logout" style="color:var(--danger); width:100%;">
          <span class="sidebar-icon">🚪</span>
          ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-content dashboard-main-content">
      <!-- Mobile Top Header (Visible on Mobile only) -->
      <header class="mobile-top-header mobile-only">
        <RouterLink to="/" class="mobile-top-logo">
          ⚡ {{ payment.storeSettings?.storeName || 'ApexStore' }}
        </RouterLink>
        <div style="display:flex; align-items:center; gap:var(--space-3);">
          <RouterLink to="/wallet" class="mobile-wallet-badge">
            💰 ฿{{ auth.balance.toLocaleString() }}
          </RouterLink>
          <RouterLink to="/shop" class="btn btn-secondary btn-icon btn-sm" title="ร้านค้า">
            🛒
          </RouterLink>
        </div>
      </header>

      <!-- Page Slot -->
      <slot />
    </div>

    <!-- Mobile Bottom Navigation Bar (Visible on Mobile only) -->
    <nav class="mobile-bottom-bar mobile-only">
      <RouterLink
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        :class="['mobile-bottom-tab', { active: isActive(item.path) }]"
      >
        <span class="mobile-bottom-emoji">{{ item.emoji }}</span>
        <span class="mobile-bottom-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.sidebar-logo-link {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--white);
  font-family: var(--font-heading);
}

.sidebar-user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-200), var(--accent-500));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}

.sidebar-user-name {
  font-weight: 700;
  color: var(--white);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-balance {
  font-size: 0.75rem;
  color: var(--accent-400);
  font-weight: 700;
}

.sidebar-notif-btn {
  position: relative;
  font-size: 1.15rem;
  text-decoration: none;
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-notif-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0 4px;
  border-radius: var(--radius-full);
  line-height: 1.2;
}

.sidebar-logout-box {
  padding: var(--space-4) var(--space-3);
  margin-top: auto;
  position: absolute;
  bottom: 0;
  width: 100%;
}

.mobile-only {
  display: none;
}

/* Mobile Top Header */
.mobile-top-header {
  width: 100%;
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  backdrop-filter: blur(16px);
}

.mobile-top-logo {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--white);
  font-family: var(--font-heading);
}

.mobile-wallet-badge {
  padding: 4px 10px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-300);
}

/* Mobile Bottom Tab Bar */
.mobile-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 62px;
  background: rgba(8, 18, 36, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: var(--z-sticky);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mobile-bottom-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 12px;
  color: var(--gray-400);
  font-size: 0.7rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  text-decoration: none;
}

.mobile-bottom-tab.active {
  color: var(--accent-400);
  font-weight: 700;
}

.mobile-bottom-emoji {
  font-size: 1.25rem;
}

.mobile-bottom-label {
  font-size: 0.6875rem;
}

@media (max-width: 768px) {
  .desktop-sidebar {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
  .dashboard-main-content {
    padding-bottom: 74px; /* Ensure content is never cut off by bottom nav */
  }
}
</style>
