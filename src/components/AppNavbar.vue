<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePaymentStore } from '../stores/payment'
import { useNotificationsStore, NOTIFICATION_TYPES } from '../stores/notifications'
import { useOrdersStore } from '../stores/orders'
import { formatDateTime } from '../data/mockData'

const auth = useAuthStore()
const payment = usePaymentStore()
const notificationsStore = useNotificationsStore()
const ordersStore = useOrdersStore()
const router = useRouter()
const route = useRoute()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const notifMenuOpen = ref(false)
const notifFilter = ref('all') // 'all' | 'unread'

onMounted(async () => {
  if (auth.isLoggedIn) {
    await notificationsStore.fetchNotifications()
    const orders = await ordersStore.fetchUserOrders()
    notificationsStore.checkOrderExpirations(orders)
  }
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleLogout() {
  auth.logout()
  router.push('/')
  userMenuOpen.value = false
  notifMenuOpen.value = false
  mobileMenuOpen.value = false
}

function formatBalance(n) {
  return `฿${Number(n).toLocaleString('th-TH')}`
}

function toggleNotifMenu() {
  notifMenuOpen.value = !notifMenuOpen.value
  userMenuOpen.value = false
  mobileMenuOpen.value = false
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
  notifMenuOpen.value = false
  mobileMenuOpen.value = false
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  userMenuOpen.value = false
  notifMenuOpen.value = false
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function handleNotifClick(notif) {
  notificationsStore.markAsRead(notif.id)
  notifMenuOpen.value = false
  if (notif.link) {
    router.push(notif.link)
  }
}

const filteredNotifications = computed(() => {
  let list = notificationsStore.notifications || []
  if (notifFilter.value === 'unread') {
    list = list.filter(n => !n.is_read)
  }
  return list
})
</script>

<template>
  <header>
    <!-- Announcement Bar -->
    <div
      v-if="payment.storeSettings?.showAnnouncement && payment.storeSettings?.announcement"
      class="announcement-bar"
    >
      <span>{{ payment.storeSettings.announcement }}</span>
    </div>

    <nav class="navbar">
      <div class="container">
        <div class="navbar-inner">
          <!-- Logo -->
          <RouterLink to="/" class="navbar-logo" @click="closeMobileMenu">
            ⚡ {{ payment.storeSettings?.storeName || 'ApexStore' }}
          </RouterLink>

          <!-- Desktop Navigation -->
          <ul class="navbar-nav desktop-only">
            <li>
              <RouterLink to="/" class="navbar-link" :class="{ active: isActive('/') && route.path === '/' }">
                หน้าหลัก
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/shop" class="navbar-link" :class="{ active: isActive('/shop') }">
                ร้านค้า
              </RouterLink>
            </li>
          </ul>

          <!-- Action Items -->
          <div class="navbar-actions">
            <!-- Wallet balance (if logged in) -->
            <div
              v-if="auth.isLoggedIn"
              class="wallet-badge"
              @click="router.push('/wallet')"
              title="ยอดเงินใน Wallet"
            >
              💰 {{ formatBalance(auth.balance) }}
            </div>

            <!-- ══════════════════════════════════════════════════════════ -->
            <!-- NOTIFICATION BELL & DROPDOWN                               -->
            <!-- ══════════════════════════════════════════════════════════ -->
            <div v-if="auth.isLoggedIn" class="notif-wrapper">
              <button
                class="btn btn-secondary btn-icon notif-bell-btn"
                @click="toggleNotifMenu"
                id="btn-notification-bell"
                title="การแจ้งเตือน"
              >
                <span style="font-size:1.15rem;">🔔</span>
                <span
                  v-if="notificationsStore.unreadCount > 0"
                  class="notif-badge-pulse"
                >
                  {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
                </span>
              </button>

              <!-- Notification Center Dropdown -->
              <div v-if="notifMenuOpen" class="notif-dropdown" @click.stop>
                <!-- Header -->
                <div class="notif-dropdown-header">
                  <div>
                    <h4 style="font-size:0.95rem; margin-bottom:2px; color:var(--white); display:flex; align-items:center; gap:var(--space-2);">
                      🔔 การแจ้งเตือน
                      <span v-if="notificationsStore.unreadCount > 0" class="badge badge-accent" style="font-size:0.65rem; padding:1px 6px;">
                        {{ notificationsStore.unreadCount }} ใหม่
                      </span>
                    </h4>
                  </div>
                  <button
                    v-if="notificationsStore.unreadCount > 0"
                    class="notif-action-btn"
                    @click="notificationsStore.markAllAsRead"
                  >
                    ✓ อ่านทั้งหมด
                  </button>
                </div>

                <!-- Tabs Filter -->
                <div class="notif-tabs">
                  <button
                    :class="['notif-tab', { active: notifFilter === 'all' }]"
                    @click="notifFilter = 'all'"
                  >
                    ทั้งหมด ({{ notificationsStore.notifications.length }})
                  </button>
                  <button
                    :class="['notif-tab', { active: notifFilter === 'unread' }]"
                    @click="notifFilter = 'unread'"
                  >
                    ยังไม่อ่าน ({{ notificationsStore.unreadCount }})
                  </button>
                </div>

                <!-- Notification List -->
                <div class="notif-list">
                  <div
                    v-for="n in filteredNotifications"
                    :key="n.id"
                    :class="['notif-item', { unread: !n.is_read }]"
                    @click="handleNotifClick(n)"
                  >
                    <div class="notif-icon-box">
                      {{ NOTIFICATION_TYPES[n.type]?.emoji || '🔔' }}
                    </div>
                    <div class="notif-body">
                      <div class="notif-item-title-row">
                        <strong class="notif-item-title">{{ n.title }}</strong>
                        <span v-if="!n.is_read" class="unread-dot"></span>
                      </div>
                      <p class="notif-item-message">{{ n.message }}</p>
                      <div class="notif-item-time">{{ formatDateTime(n.created_at) }}</div>
                    </div>
                    <button
                      class="notif-delete-btn"
                      @click.stop="notificationsStore.deleteNotification(n.id)"
                      title="ลบ"
                    >
                      ✕
                    </button>
                  </div>

                  <!-- Empty State -->
                  <div v-if="filteredNotifications.length === 0" class="notif-empty">
                    <div style="font-size:2rem; margin-bottom:var(--space-2);">🎉</div>
                    <div style="font-size:0.875rem; color:var(--white); font-weight:500;">ไม่มีการแจ้งเตือน</div>
                    <div style="font-size:0.75rem; color:var(--gray-500);">คุณอ่านข้อความทั้งหมดเรียบร้อยแล้ว</div>
                  </div>
                </div>

                <!-- Footer -->
                <div v-if="notificationsStore.notifications.length > 0" class="notif-dropdown-footer">
                  <button class="notif-footer-btn" @click="notificationsStore.clearAll">
                    🗑️ ล้างการแจ้งเตือนทั้งหมด
                  </button>
                </div>
              </div>
            </div>

            <!-- Logged in User Menu (Desktop) -->
            <div v-if="auth.isLoggedIn" class="user-menu-wrapper desktop-only" style="position:relative;">
              <button class="btn btn-secondary btn-sm" @click="toggleUserMenu" style="gap:8px;">
                <span>👤</span>
                <span class="user-name-text">{{ auth.user?.username }}</span>
                <span style="font-size:0.75rem; opacity:0.6;">▾</span>
              </button>

              <!-- Dropdown -->
              <div v-if="userMenuOpen" class="user-dropdown" @click.stop>
                <RouterLink to="/dashboard" class="dropdown-item" @click="userMenuOpen=false">📊 Dashboard</RouterLink>
                <RouterLink to="/orders" class="dropdown-item" @click="userMenuOpen=false">📦 คำสั่งซื้อ</RouterLink>
                <RouterLink to="/wallet" class="dropdown-item" @click="userMenuOpen=false">💰 Wallet</RouterLink>
                <RouterLink to="/topup" class="dropdown-item" @click="userMenuOpen=false">➕ เติมเงิน</RouterLink>
                <RouterLink to="/profile" class="dropdown-item" @click="userMenuOpen=false">⚙️ โปรไฟล์</RouterLink>
                <div v-if="auth.isAdmin" class="dropdown-divider"></div>
                <RouterLink v-if="auth.isAdmin" to="/admin" class="dropdown-item text-accent" @click="userMenuOpen=false">👑 Admin Panel</RouterLink>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item text-danger" @click="handleLogout">🚪 ออกจากระบบ</button>
              </div>
            </div>

            <!-- Logged Out Actions (Desktop) -->
            <div v-else class="auth-buttons-row desktop-only">
              <RouterLink to="/auth/login" class="btn btn-secondary btn-sm">เข้าสู่ระบบ</RouterLink>
              <RouterLink to="/auth/register" class="btn btn-primary btn-sm">สมัครสมาชิก</RouterLink>
            </div>

            <!-- Mobile Hamburger Toggle Button -->
            <button
              class="btn btn-secondary btn-icon mobile-hamburger-btn mobile-only"
              @click="toggleMobileMenu"
              id="mobile-nav-toggle"
              aria-label="เปิดเมนู"
            >
              <span v-if="!mobileMenuOpen" style="font-size:1.25rem;">☰</span>
              <span v-else style="font-size:1.25rem;">✕</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MOBILE NAVIGATION DRAWER                                   -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-if="mobileMenuOpen" class="mobile-nav-overlay" @click.self="closeMobileMenu">
      <div class="mobile-nav-drawer animate-fade-in">
        <!-- User Info if Logged In -->
        <div v-if="auth.isLoggedIn" class="mobile-user-card">
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <div class="mobile-avatar">
              {{ auth.user?.username?.[0]?.toUpperCase() || 'U' }}
            </div>
            <div>
              <div style="font-weight:700; color:var(--white); font-size:1rem;">{{ auth.user?.username }}</div>
              <div style="font-size:0.8125rem; color:var(--accent-400); font-weight:700;">💰 {{ formatBalance(auth.balance) }}</div>
            </div>
          </div>
          <RouterLink to="/topup" class="btn btn-primary btn-sm" @click="closeMobileMenu" style="margin-top:var(--space-3); width:100%; text-align:center;">
            ➕ เติมเงิน Wallet
          </RouterLink>
        </div>

        <!-- Menu Links -->
        <div class="mobile-nav-links">
          <div class="mobile-menu-section-title">เมนูหลัก</div>
          <RouterLink to="/" class="mobile-nav-link" :class="{ active: isActive('/') && route.path === '/' }" @click="closeMobileMenu">
            <span>🏠</span> หน้าหลัก
          </RouterLink>
          <RouterLink to="/shop" class="mobile-nav-link" :class="{ active: isActive('/shop') }" @click="closeMobileMenu">
            <span>🛒</span> ร้านค้าสินค้าทั้งหมด
          </RouterLink>

          <template v-if="auth.isLoggedIn">
            <div class="mobile-menu-section-title" style="margin-top:var(--space-4);">สมาชิก</div>
            <RouterLink to="/dashboard" class="mobile-nav-link" :class="{ active: isActive('/dashboard') }" @click="closeMobileMenu">
              <span>📊</span> Dashboard
            </RouterLink>
            <RouterLink to="/orders" class="mobile-nav-link" :class="{ active: isActive('/orders') }" @click="closeMobileMenu">
              <span>📦</span> คำสั่งซื้อของฉัน
            </RouterLink>
            <RouterLink to="/wallet" class="mobile-nav-link" :class="{ active: isActive('/wallet') }" @click="closeMobileMenu">
              <span>💰</span> Wallet & ประวัติการเติมเงิน
            </RouterLink>
            <RouterLink to="/profile" class="mobile-nav-link" :class="{ active: isActive('/profile') }" @click="closeMobileMenu">
              <span>⚙️</span> จัดการโปรไฟล์
            </RouterLink>

            <template v-if="auth.isAdmin">
              <div class="mobile-menu-section-title" style="margin-top:var(--space-4);">ผู้ดูแลระบบ</div>
              <RouterLink to="/admin" class="mobile-nav-link text-accent" @click="closeMobileMenu">
                <span>👑</span> Admin Panel
              </RouterLink>
            </template>
          </template>
        </div>

        <!-- Auth Actions at bottom -->
        <div class="mobile-nav-footer">
          <button v-if="auth.isLoggedIn" class="btn btn-danger w-full" @click="handleLogout">
            🚪 ออกจากระบบ
          </button>
          <div v-else style="display:flex; flex-direction:column; gap:var(--space-2);">
            <RouterLink to="/auth/login" class="btn btn-secondary w-full" @click="closeMobileMenu">
              🔑 เข้าสู่ระบบ
            </RouterLink>
            <RouterLink to="/auth/register" class="btn btn-primary w-full" @click="closeMobileMenu">
              ✨ สมัครสมาชิกฟรี
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.announcement-bar {
  background: linear-gradient(90deg, #ea580c 0%, #f97316 100%);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.user-name-text {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-buttons-row {
  display: flex;
  gap: var(--space-2);
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

/* Notification wrapper */
.notif-wrapper {
  position: relative;
}

.notif-bell-btn {
  position: relative;
}

.notif-badge-pulse {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: var(--radius-full);
  line-height: 1.2;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  animation: pulse 2s infinite;
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px;
  max-width: calc(100vw - 24px);
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl), 0 0 30px rgba(0, 0, 0, 0.6);
  z-index: var(--z-dropdown);
  overflow: hidden;
  animation: fadeIn 0.2s ease;
  backdrop-filter: blur(20px);
}

.notif-dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
}

.notif-action-btn {
  font-size: 0.75rem;
  color: var(--accent-300);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.notif-action-btn:hover {
  text-decoration: underline;
}

.notif-tabs {
  display: flex;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--glass-border);
  gap: 6px;
}

.notif-tab {
  flex: 1;
  padding: 5px 8px;
  font-size: 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--gray-400);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.notif-tab.active {
  background: rgba(249, 115, 22, 0.15);
  color: var(--accent-300);
  font-weight: 700;
}

.notif-list {
  max-height: 320px;
  overflow-y: auto;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.notif-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.notif-item.unread {
  background: rgba(249, 115, 22, 0.06);
}

.notif-icon-box {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 2px;
}

.notif-item-title {
  font-size: 0.8125rem;
  color: var(--white);
  line-height: 1.3;
}

.unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-400);
  flex-shrink: 0;
}

.notif-item-message {
  font-size: 0.75rem;
  color: var(--gray-400);
  line-height: 1.4;
  margin-bottom: 4px;
}

.notif-item-time {
  font-size: 0.7rem;
  color: var(--gray-500);
}

.notif-delete-btn {
  color: var(--gray-600);
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  transition: color var(--transition-fast);
  flex-shrink: 0;
}

.notif-delete-btn:hover {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
}

.notif-empty {
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.notif-dropdown-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.2);
  text-align: center;
}

.notif-footer-btn {
  font-size: 0.75rem;
  color: var(--gray-400);
  background: none;
  border: none;
  cursor: pointer;
}

.notif-footer-btn:hover {
  color: var(--white);
}

/* User dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 200px;
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--space-2);
  z-index: var(--z-dropdown);
  animation: fadeIn 0.2s ease;
  backdrop-filter: blur(20px);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 12px;
  font-size: 0.875rem;
  color: var(--gray-300);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--glass-hover);
  color: var(--white);
}

.dropdown-divider {
  height: 1px;
  background: var(--glass-border);
  margin: var(--space-1) 0;
}

/* Mobile Nav Drawer */
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  top: 68px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: var(--z-sticky);
  display: flex;
  flex-direction: column;
}

.mobile-nav-drawer {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--glass-border);
  padding: var(--space-5);
  max-height: calc(100vh - 68px);
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.mobile-user-card {
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.mobile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-200), var(--accent-500));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
}

.mobile-menu-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  color: var(--gray-300);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.mobile-nav-link:hover, .mobile-nav-link.active {
  background: rgba(249, 115, 22, 0.1);
  color: var(--accent-300);
  font-weight: 700;
}

.mobile-nav-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--glass-border);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
  .wallet-badge {
    padding: 4px 10px;
    font-size: 0.78125rem;
  }
}
</style>
