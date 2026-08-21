<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/admin', label: 'Dashboard', emoji: '📊', exact: true },
  { path: '/admin/products', label: 'สินค้า', emoji: '🏷️' },
  { path: '/admin/orders', label: 'คำสั่งซื้อ', emoji: '📦' },
  { path: '/admin/topups', label: 'เติมเงิน', emoji: '💳', badge: 2 },
  { path: '/admin/users', label: 'ผู้ใช้', emoji: '👥' },
]

function isActive(item) {
  return item.exact ? route.path === item.path : route.path.startsWith(item.path)
}

function logout() { auth.logout(); router.push('/') }
</script>

<template>
  <div class="dashboard-layout">
    <!-- Admin Sidebar -->
    <aside class="sidebar" style="background:var(--bg-surface); border-right-color:rgba(249,115,22,0.1);">
      <div class="sidebar-logo">
        <RouterLink to="/admin" style="font-size:1.1rem; font-weight:800; color:var(--white); font-family:var(--font-en);">
          👑 Admin Panel
        </RouterLink>
        <div style="font-size:0.75rem; color:var(--accent-400); margin-top:2px;">ApexStore</div>
      </div>

      <ul class="sidebar-menu">
        <li v-for="item in menuItems" :key="item.path" class="sidebar-item">
          <RouterLink :to="item.path" :class="['sidebar-link', { active: isActive(item) }]">
            <span class="sidebar-icon">{{ item.emoji }}</span>
            {{ item.label }}
            <span v-if="item.badge" style="margin-left:auto; background:var(--danger); color:white; font-size:0.65rem; padding:1px 6px; border-radius:var(--radius-full);">{{ item.badge }}</span>
          </RouterLink>
        </li>
      </ul>

      <div style="position:absolute; bottom:0; width:100%; padding:var(--space-4) var(--space-3);">
        <div class="divider"></div>
        <RouterLink to="/" class="sidebar-link">
          <span class="sidebar-icon">🌐</span> ดูหน้าเว็บ
        </RouterLink>
        <button class="sidebar-link w-full" @click="logout" style="color:var(--danger); width:100%;">
          <span class="sidebar-icon">🚪</span> ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- Content -->
    <div class="main-content">
      <slot />
    </div>
  </div>
</template>
