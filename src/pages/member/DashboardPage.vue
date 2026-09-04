<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { useOrdersStore } from '../../stores/orders'
import { usePaymentStore } from '../../stores/payment'
import { formatCurrency, formatDateTime } from '../../data/mockData'

const auth = useAuthStore()
const ordersStore = useOrdersStore()
const paymentStore = usePaymentStore()
const router = useRouter()

async function loadDashboardData() {
  if (auth.isLoggedIn) {
    await Promise.all([
      ordersStore.fetchUserOrders(),
      paymentStore.fetchTopups()
    ])
  }
}

onMounted(() => {
  loadDashboardData()
})

watch(() => auth.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadDashboardData()
  }
})

// Dynamic stats from active Pinia stores
const stats = computed(() => [
  {
    label: 'ยอดเงินคงเหลือ',
    value: formatCurrency(auth.balance),
    emoji: '💰',
    iconClass: 'stat-icon-accent',
    sub: 'ในกระเป๋าเงิน'
  },
  {
    label: 'คำสั่งซื้อทั้งหมด',
    value: `${ordersStore.orders.length} รายการ`,
    emoji: '📦',
    iconClass: 'stat-icon-primary',
    sub: 'ประวัติทั้งหมด'
  },
  {
    label: 'สำเร็จแล้ว',
    value: `${ordersStore.orders.filter(o => o.status === 'completed').length} รายการ`,
    emoji: '✅',
    iconClass: 'stat-icon-success',
    sub: 'พร้อมใช้งาน'
  },
  {
    label: 'กำลังดำเนินการ',
    value: `${ordersStore.orders.filter(o => o.status === 'pending').length} รายการ`,
    emoji: '⏳',
    iconClass: 'stat-icon-warning',
    sub: 'รออนุมัติ'
  },
])

// Recent orders from real store
const recentOrders = computed(() => {
  return ordersStore.orders.slice(0, 4)
})

// Unified live transactions combining Topups and Order Purchases
const recentTransactions = computed(() => {
  const list = []

  // 1. Topup transactions
  const topups = paymentStore.topupLogs || []
  for (const t of topups) {
    // Only include if matches user or admin
    if (!auth.isAdmin && auth.user?.id && t.user_id && t.user_id !== auth.user.id) {
      continue
    }
    list.push({
      id: `topup-${t.id}`,
      type: 'topup',
      title: 'เติมเงิน PromptPay',
      description: `เติมเงินเข้ากระเป๋า (${t.trans_ref || t.id})`,
      amount: Number(t.amount),
      status: t.status === 'approved' ? 'completed' : t.status,
      created_at: t.created_at,
      link: '/wallet'
    })
  }

  // 2. Order purchases
  const orders = ordersStore.orders || []
  for (const o of orders) {
    if (!auth.isAdmin && auth.user?.id && o.user_id && o.user_id !== auth.user.id) {
      continue
    }
    list.push({
      id: `order-${o.id}`,
      type: 'purchase',
      title: o.product_name,
      description: `ซื้อแพ็กเกจ ${o.package_label || ''} (#${o.id})`,
      amount: -Number(o.amount),
      status: o.status,
      created_at: o.created_at,
      link: `/orders/${o.id}`
    })
  }

  // Sort descending by date
  list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

  return list.slice(0, 4)
})

const statusConfig = {
  completed: { label: 'สำเร็จ', class: 'badge-success', emoji: '✅' },
  approved: { label: 'สำเร็จ', class: 'badge-success', emoji: '✅' },
  pending: { label: 'รอดำเนินการ', class: 'badge-warning', emoji: '⏳' },
  rejected: { label: 'ถูกปฏิเสธ', class: 'badge-danger', emoji: '❌' },
}

function handleTransactionClick(tx) {
  if (tx.link) {
    router.push(tx.link)
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in">
      <!-- Header -->
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">สวัสดี, {{ auth.user?.username }} 👋</h1>
        <p style="color:var(--gray-500);">ภาพรวมบัญชีและคำสั่งซื้อของคุณ (ซิงค์ข้อมูลเรียลไทม์)</p>
      </div>

      <!-- Stats grid -->
      <div class="dashboard-stats-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-bottom:var(--space-8);">
        <div v-for="s in stats" :key="s.label" class="stat-card">
          <div :class="['stat-icon', s.iconClass]">{{ s.emoji }}</div>
          <div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="dashboard-actions-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-6); margin-bottom:var(--space-8);">
        <div class="card" style="background:linear-gradient(135deg, rgba(249,115,22,0.1), rgba(249,115,22,0.02)); border-color:rgba(249,115,22,0.2);">
          <div style="font-size:2rem; margin-bottom:var(--space-3);">💳</div>
          <h3 style="margin-bottom:var(--space-2);">เติมเงิน Wallet</h3>
          <p style="font-size:0.875rem; color:var(--gray-500); margin-bottom:var(--space-4);">สแกน PromptPay QR Code เงินเข้ากระเป๋าอัตโนมัติ 24 ชม.</p>
          <button class="btn btn-primary" @click="router.push('/topup')">➕ เติมเงินทันที</button>
        </div>
        <div class="card" style="background:linear-gradient(135deg, rgba(26,82,168,0.15), rgba(26,82,168,0.02)); border-color:rgba(26,82,168,0.2);">
          <div style="font-size:2rem; margin-bottom:var(--space-3);">🛒</div>
          <h3 style="margin-bottom:var(--space-2);">เลือกซื้อสินค้า</h3>
          <p style="font-size:0.875rem; color:var(--gray-500); margin-bottom:var(--space-4);">Netflix, Spotify, ChatGPT Plus, Canva Pro และอีกมากมาย</p>
          <button class="btn btn-secondary" @click="router.push('/shop')">🛍️ ไปหน้าร้านค้า</button>
        </div>
      </div>

      <!-- Two column: recent orders + transactions -->
      <div class="dashboard-tables-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-6);">
        <!-- Recent Orders -->
        <div class="card-elevated" style="border-radius:var(--radius-lg); padding:var(--space-5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
            <h3 style="font-size:1rem; display:flex; align-items:center; gap:6px;">
              <span>📦</span> คำสั่งซื้อล่าสุด
            </h3>
            <RouterLink to="/orders" style="font-size:0.8125rem; color:var(--accent-400);">ดูทั้งหมด ({{ ordersStore.orders.length }}) →</RouterLink>
          </div>

          <!-- Loading Orders State -->
          <div v-if="ordersStore.loading" style="text-align:center; padding:var(--space-8) var(--space-4); color:var(--gray-400);">
            <div style="font-size:1.5rem; margin-bottom:var(--space-2);">⏳</div>
            <p style="font-size:0.875rem;">กำลังโหลดคำสั่งซื้อ...</p>
          </div>

          <!-- Orders List -->
          <div v-else-if="recentOrders.length > 0" style="display:flex; flex-direction:column; gap:var(--space-3);">
            <div
              v-for="o in recentOrders"
              :key="o.id"
              style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-3); background:var(--glass-bg); border-radius:var(--radius-md); cursor:pointer; transition: all var(--transition-fast);"
              @click="router.push(`/orders/${o.id}`)"
              class="hover-row"
            >
              <div style="display:flex; align-items:center; gap:var(--space-3); min-width:0;">
                <div style="font-size:1.5rem; flex-shrink:0;">{{ o.product_emoji || '📦' }}</div>
                <div style="min-width:0;">
                  <div style="font-size:0.875rem; font-weight:600; color:var(--white); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    {{ o.product_name }}
                  </div>
                  <div style="font-size:0.75rem; color:var(--gray-400);">
                    {{ o.package_label }} · {{ formatDateTime(o.created_at) }}
                  </div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <div style="font-size:0.875rem; font-weight:700; color:var(--accent-400); font-family:var(--font-en);">
                  ฿{{ Number(o.amount).toLocaleString() }}
                </div>
                <span :class="['badge', statusConfig[o.status]?.class]" style="font-size:0.65rem; padding:1px 6px;">
                  {{ statusConfig[o.status]?.label || o.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty Orders State -->
          <div v-else style="text-align:center; padding:var(--space-8) var(--space-4);">
            <div style="font-size:2.5rem; margin-bottom:var(--space-2);">🛍️</div>
            <div style="font-size:0.9rem; font-weight:600; color:var(--white); margin-bottom:4px;">ยังไม่มีคำสั่งซื้อ</div>
            <p style="font-size:0.8125rem; color:var(--gray-400); margin-bottom:var(--space-4);">เลือกซื้อบัญชีพรีเมียมที่คุณต้องการได้เลย</p>
            <button class="btn btn-primary btn-sm" @click="router.push('/shop')">🛒 เริ่มช้อปปิ้ง</button>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="card-elevated" style="border-radius:var(--radius-lg); padding:var(--space-5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
            <h3 style="font-size:1rem; display:flex; align-items:center; gap:6px;">
              <span>💳</span> ธุรกรรมล่าสุด
            </h3>
            <RouterLink to="/wallet" style="font-size:0.8125rem; color:var(--accent-400);">ดู Wallet →</RouterLink>
          </div>

          <!-- Loading Transactions State -->
          <div v-if="paymentStore.loading" style="text-align:center; padding:var(--space-8) var(--space-4); color:var(--gray-400);">
            <div style="font-size:1.5rem; margin-bottom:var(--space-2);">⏳</div>
            <p style="font-size:0.875rem;">กำลังโหลดประวัติธุรกรรม...</p>
          </div>

          <!-- Transactions List -->
          <div v-else-if="recentTransactions.length > 0" style="display:flex; flex-direction:column; gap:var(--space-3);">
            <div
              v-for="tx in recentTransactions"
              :key="tx.id"
              style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-3); background:var(--glass-bg); border-radius:var(--radius-md); cursor:pointer; transition: all var(--transition-fast);"
              @click="handleTransactionClick(tx)"
              class="hover-row"
            >
              <div style="display:flex; align-items:center; gap:var(--space-3); min-width:0;">
                <div style="width:38px; height:38px; border-radius:50%; background:var(--glass-bg); display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0;">
                  {{ tx.type === 'topup' ? '💰' : '📦' }}
                </div>
                <div style="min-width:0;">
                  <div style="font-size:0.875rem; font-weight:600; color:var(--white); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    {{ tx.title }}
                  </div>
                  <div style="font-size:0.75rem; color:var(--gray-400);">
                    {{ tx.description }} · {{ formatDateTime(tx.created_at) }}
                  </div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <div :style="{ color: tx.amount > 0 ? 'var(--success)' : '#f87171', fontWeight: 700, fontFamily: 'var(--font-en)', fontSize: '0.9rem' }">
                  {{ tx.amount > 0 ? '+' : '' }}฿{{ Math.abs(tx.amount).toLocaleString() }}
                </div>
                <span :class="['badge', statusConfig[tx.status]?.class || 'badge-success']" style="font-size:0.65rem; padding:1px 6px;">
                  {{ statusConfig[tx.status]?.label || tx.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty Transactions State -->
          <div v-else style="text-align:center; padding:var(--space-8) var(--space-4);">
            <div style="font-size:2.5rem; margin-bottom:var(--space-2);">💰</div>
            <div style="font-size:0.9rem; font-weight:600; color:var(--white); margin-bottom:4px;">ยังไม่มีประวัติธุรกรรม</div>
            <p style="font-size:0.8125rem; color:var(--gray-400); margin-bottom:var(--space-4);">เติมเงิน Wallet เพื่อเริ่มสั่งซื้อสินค้า</p>
            <button class="btn btn-primary btn-sm" @click="router.push('/topup')">➕ เติมเงิน Wallet</button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.hover-row:hover {
  background: var(--glass-hover) !important;
  transform: translateX(2px);
}

@media (max-width: 1024px) {
  .dashboard-stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .dashboard-actions-grid,
  .dashboard-tables-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 640px) {
  .dashboard-stats-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
