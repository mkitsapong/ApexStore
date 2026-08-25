<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTicketsStore } from '../stores/tickets'

const auth = useAuthStore()
const ticketsStore = useTicketsStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  ticketsStore.fetchAllTickets()
})

const menuItems = computed(() => [
  { path: '/admin', label: 'Dashboard', emoji: '📊', exact: true },
  { path: '/admin/products', label: 'สินค้า', emoji: '🏷️' },
  { path: '/admin/orders', label: 'คำสั่งซื้อ', emoji: '📦' },
  { path: '/admin/topups', label: 'เติมเงิน', emoji: '💳' },
  { path: '/admin/tickets', label: 'แจ้งปัญหา', emoji: '🚨', badge: ticketsStore.pendingTicketsCount || null },
  { path: '/admin/users', label: 'ผู้ใช้', emoji: '👥' },
  { path: '/admin/settings', label: 'ตั้งค่าระบบ', emoji: '⚙️' },
])

function isActive(item) {
  return item.exact ? route.path === item.path : route.path.startsWith(item.path)
}

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="dashboard-layout">
    <!-- Admin Desktop Sidebar -->
    <aside class="sidebar desktop-sidebar" style="background:var(--bg-surface); border-right-color:rgba(249,115,22,0.15);">
      <div class="sidebar-logo">
        <RouterLink to="/admin" style="font-size:1.15rem; font-weight:800; color:var(--white); font-family:var(--font-heading);">
          👑 Admin Panel
        </RouterLink>
        <div style="font-size:0.75rem; color:var(--accent-400); margin-top:2px;">ApexStore Management</div>
      </div>

      <ul class="sidebar-menu">
        <li v-for="item in menuItems" :key="item.path" class="sidebar-item">
          <RouterLink :to="item.path" :class="['sidebar-link', { active: isActive(item) }]">
            <span class="sidebar-icon">{{ item.emoji }}</span>
            {{ item.label }}
            <span v-if="item.badge" class="sidebar-badge-count">{{ item.badge }}</span>
          </RouterLink>
        </li>
      </ul>

      <div class="sidebar-footer-box">
        <div class="divider"></div>
        <RouterLink to="/" class="sidebar-link">
          <span class="sidebar-icon">🌐</span> ดูหน้าบ้าน
        </RouterLink>
        <button class="sidebar-link w-full" @click="logout" style="color:var(--danger); width:100%;">
          <span class="sidebar-icon">🚪</span> ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-content admin-main-content">
      <!-- Mobile Top Bar & Horizontal Tab Menu (Mobile Only) -->
      <header class="mobile-admin-header mobile-only">
        <div class="mobile-admin-top">
          <RouterLink to="/admin" class="mobile-admin-logo">
            👑 Admin Panel
          </RouterLink>
          <div style="display:flex; gap:var(--space-2); align-items:center;">
            <RouterLink to="/" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">
              🌐 หน้าบ้าน
            </RouterLink>
            <button class="btn btn-danger btn-sm" @click="logout" style="font-size:0.75rem;">
              🚪
            </button>
          </div>
        </div>

        <!-- Scrollable Horizontal Tabs -->
        <nav class="mobile-admin-nav-tabs">
          <RouterLink
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            :class="['mobile-admin-tab-item', { active: isActive(item) }]"
          >
            <span>{{ item.emoji }}</span>
            <span>{{ item.label }}</span>
            <span v-if="item.badge" class="mobile-tab-badge">{{ item.badge }}</span>
          </RouterLink>
        </nav>
      </header>

      <!-- Page Slot -->
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sidebar-badge-count {
  margin-left: auto;
  background: var(--danger);
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.sidebar-footer-box {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: var(--space-4) var(--space-3);
}

.mobile-only {
  display: none;
}

/* Mobile Admin Header */
.mobile-admin-header {
  width: 100%;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  backdrop-filter: blur(16px);
}

.mobile-admin-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px var(--space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.mobile-admin-logo {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--white);
  font-family: var(--font-heading);
}

.mobile-admin-nav-tabs {
  display: flex;
  overflow-x: auto;
  padding: 6px 12px;
  gap: 6px;
  -webkit-overflow-scrolling: touch;
}

.mobile-admin-nav-tabs::-webkit-scrollbar {
  display: none;
}

.mobile-admin-tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 0.78125rem;
  font-weight: 500;
  color: var(--gray-400);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  white-space: nowrap;
  text-decoration: none;
  flex-shrink: 0;
}

.mobile-admin-tab-item.active {
  background: rgba(249, 115, 22, 0.15);
  color: var(--accent-300);
  font-weight: 700;
  border-color: var(--accent-400);
}

.mobile-tab-badge {
  background: var(--danger);
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0 5px;
  border-radius: var(--radius-full);
}

@media (max-width: 768px) {
  .desktop-sidebar {
    display: none !important;
  }
  .mobile-only {
    display: block !important;
  }
  .admin-main-content {
    padding-bottom: 40px;
  }
}
</style>
