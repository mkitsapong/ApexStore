<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

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
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <RouterLink to="/" style="font-size:1.2rem; font-weight:800; color:var(--white); font-family:var(--font-en);">
          ⚡ Apex<span style="color:var(--accent-400)">Store</span>
        </RouterLink>
      </div>

      <!-- User info -->
      <div style="padding:var(--space-4) var(--space-5); margin-bottom:var(--space-2);">
        <div style="display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3); background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-md);">
          <div class="avatar-placeholder avatar-md" style="font-size:1rem; background:linear-gradient(135deg,var(--primary-200),var(--accent-500));">
            {{ auth.user?.username?.[0]?.toUpperCase() }}
          </div>
          <div style="min-width:0;">
            <div style="font-weight:600; color:var(--white); font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ auth.user?.username }}</div>
            <div style="font-size:0.75rem; color:var(--accent-300); font-weight:600;">฿{{ auth.balance.toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <ul class="sidebar-menu">
        <li v-for="item in menuItems" :key="item.path" class="sidebar-item">
          <RouterLink :to="item.path" :class="['sidebar-link', { active: isActive(item.path) }]">
            <span class="sidebar-icon">{{ item.emoji }}</span>
            {{ item.label }}
          </RouterLink>
        </li>

        <!-- Admin link if admin -->
        <li v-if="auth.isAdmin" class="sidebar-item" style="margin-top:var(--space-4);">
          <div class="divider"></div>
          <RouterLink to="/admin" class="sidebar-link">
            <span class="sidebar-icon">👑</span>
            Admin Panel
          </RouterLink>
        </li>
      </ul>

      <!-- Logout -->
      <div style="padding:var(--space-4) var(--space-3); margin-top:auto; position:absolute; bottom:0; width:100%;">
        <div class="divider"></div>
        <button class="sidebar-link w-full" @click="logout" style="color:var(--danger); width:100%;">
          <span class="sidebar-icon">🚪</span>
          ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- Content -->
    <div class="main-content">
      <slot />
    </div>
  </div>
</template>
