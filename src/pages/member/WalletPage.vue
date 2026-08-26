<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { useOrdersStore } from '../../stores/orders'
import { usePaymentStore } from '../../stores/payment'
import { useToastStore } from '../../stores/toast'
import { formatCurrency, formatDateTime } from '../../data/mockData'

const auth = useAuthStore()
const ordersStore = useOrdersStore()
const paymentStore = usePaymentStore()
const toast = useToastStore()
const router = useRouter()

const activeTab = ref('all') // 'all' | 'topup' | 'purchase'
const searchQuery = ref('')

onMounted(async () => {
  if (auth.isLoggedIn) {
    await Promise.all([
      paymentStore.fetchTopups(),
      ordersStore.fetchUserOrders()
    ])
  }
})

// Unified live transactions combining Topups and Order Purchases
const allTransactions = computed(() => {
  const list = []

  // 1. Topup transactions
  const topups = paymentStore.topupLogs || []
  for (const t of topups) {
    if (!auth.isAdmin && t.user_id && auth.user?.id && t.user_id !== auth.user.id) {
      continue
    }
    list.push({
      id: `topup-${t.id}`,
      rawId: t.id,
      type: 'topup',
      typeLabel: 'เติมเงิน',
      title: 'เติมเงิน PromptPay',
      description: t.trans_ref ? `TransRef: ${t.trans_ref}` : 'สแกน QR Code พร้อมเพย์',
      referenceId: t.trans_ref || t.id,
      amount: Number(t.amount),
      status: t.status === 'approved' ? 'completed' : t.status,
      created_at: t.created_at,
      slipUrl: t.slip_url || null,
      isAuto: t.is_auto_approved
    })
  }

  // 2. Order purchases
  const orders = ordersStore.orders || []
  for (const o of orders) {
    list.push({
      id: `order-${o.id}`,
      rawId: o.id,
      type: 'purchase',
      typeLabel: 'ซื้อสินค้า',
      title: o.product_name,
      description: `แพ็กเกจ ${o.package_label || ''}`,
      referenceId: o.id,
      amount: -Number(o.amount),
      status: o.status,
      created_at: o.created_at,
      orderId: o.id,
      productEmoji: o.product_emoji || '📦'
    })
  }

  // Sort descending by created_at
  list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

  return list
})

// Filtered transactions
const filteredTransactions = computed(() => {
  let list = allTransactions.value

  if (activeTab.value === 'topup') {
    list = list.filter(tx => tx.type === 'topup')
  } else if (activeTab.value === 'purchase') {
    list = list.filter(tx => tx.type === 'purchase')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(tx =>
      tx.title.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      (tx.referenceId && tx.referenceId.toLowerCase().includes(q))
    )
  }

  return list
})

// Lifetime summary metrics
const totalTopupAmount = computed(() => {
  return allTransactions.value
    .filter(tx => tx.type === 'topup' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0)
})

const totalSpentAmount = computed(() => {
  return allTransactions.value
    .filter(tx => tx.type === 'purchase' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
})

const txTypeConfig = {
  topup: { label: 'เติมเงิน', emoji: '💰', badgeClass: 'badge-success' },
  purchase: { label: 'ซื้อสินค้า', emoji: '🛒', badgeClass: 'badge-primary' }
}

const statusConfig = {
  completed: { label: 'สำเร็จ', badgeClass: 'badge-success', emoji: '✅' },
  approved: { label: 'สำเร็จ', badgeClass: 'badge-success', emoji: '✅' },
  pending: { label: 'รอดำเนินการ', badgeClass: 'badge-warning', emoji: '⏳' },
  rejected: { label: 'ถูกปฏิเสธ', badgeClass: 'badge-danger', emoji: '❌' },
}

function copyText(text) {
  navigator.clipboard.writeText(text)
  toast.success('คัดลอกรหัสแล้ว!')
}
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in">
      <!-- Page Header -->
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">Wallet (กระเป๋าเงิน)</h1>
        <p style="color:var(--gray-500);">จัดการยอดเงิน เติมเงิน และตรวจสอบประวัติธุรกรรมทั้งหมดแบบเรียลไทม์</p>
      </div>

      <!-- Balance Hero Card -->
      <div class="wallet-hero-card">
        <div class="orb" style="width:240px;height:240px;background:var(--accent-500);right:-60px;top:-60px;opacity:0.15;filter:blur(60px);position:absolute;"></div>
        <div style="position:relative; z-index:1;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-4); margin-bottom:var(--space-4);">
            <div>
              <div style="font-size:0.875rem; color:var(--gray-400); margin-bottom:var(--space-2); display:flex; align-items:center; gap:6px;">
                <span>💰</span> ยอดเงินคงเหลือในกระเป๋า
              </div>
              <div class="wallet-hero-balance">
                {{ formatCurrency(auth.balance) }}
              </div>
            </div>
            <div class="wallet-status-pill">
              <span class="live-pulse-dot"></span>
              <span>PromptPay Auto พร้อมใช้งาน 24 ชม.</span>
            </div>
          </div>

          <div class="wallet-hero-actions">
            <button class="btn btn-primary btn-lg" @click="router.push('/topup')" id="wallet-topup-btn">
              ➕ เติมเงิน PromptPay
            </button>
            <button class="btn btn-secondary btn-lg" @click="router.push('/shop')">
              🛒 ไปช้อปปิ้งที่ร้านค้า
            </button>
          </div>
        </div>
      </div>

      <!-- Lifetime Metrics Bar -->
      <div class="wallet-metrics-grid">
        <div class="metric-card">
          <div class="metric-icon" style="background:rgba(34,197,94,0.15); color:#4ade80;">💰</div>
          <div>
            <div class="metric-val text-success">{{ formatCurrency(totalTopupAmount) }}</div>
            <div class="metric-label">ยอดเติมเงินสะสมทั้งหมด</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background:rgba(239,68,68,0.15); color:#f87171;">🛍️</div>
          <div>
            <div class="metric-val" style="color:#f87171;">{{ formatCurrency(totalSpentAmount) }}</div>
            <div class="metric-label">ยอดใช้จ่ายซื้อสินค้าสะสม</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background:rgba(249,115,22,0.15); color:var(--accent-400);">📦</div>
          <div>
            <div class="metric-val text-accent">{{ ordersStore.orders.length }} รายการ</div>
            <div class="metric-label">คำสั่งซื้อในระบบทั้งหมด</div>
          </div>
        </div>
      </div>

      <!-- Transaction History Section -->
      <div class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-6);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-4); margin-bottom:var(--space-6);">
          <div>
            <h3 style="font-size:1.15rem; margin-bottom:2px;">ประวัติธุรกรรมทั้งหมด</h3>
            <p style="font-size:0.8125rem; color:var(--gray-400);">รายการเติมเงินและสั่งซื้อสินค้าซิงค์เรียลไทม์ ({{ filteredTransactions.length }} รายการ)</p>
          </div>

          <!-- Search Filter -->
          <div style="min-width:220px; max-width:320px; width:100%;">
            <input
              v-model="searchQuery"
              class="input"
              placeholder="🔍 ค้นหารายการ / เลขอ้างอิง..."
              style="padding:8px 12px; font-size:0.875rem;"
            />
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="tabs" style="margin-bottom:var(--space-6);">
          <button
            :class="['tab', { active: activeTab === 'all' }]"
            @click="activeTab = 'all'"
          >
            ทั้งหมด ({{ allTransactions.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'topup' }]"
            @click="activeTab = 'topup'"
          >
            💰 เติมเงิน ({{ allTransactions.filter(t => t.type === 'topup').length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'purchase' }]"
            @click="activeTab = 'purchase'"
          >
            🛒 ซื้อสินค้า ({{ allTransactions.filter(t => t.type === 'purchase').length }})
          </button>
        </div>

        <!-- Transactions Table -->
        <div v-if="filteredTransactions.length > 0" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>รายการ</th>
                <th>เลขอ้างอิง</th>
                <th>จำนวนเงิน</th>
                <th>วันที่ทำรายการ</th>
                <th>สถานะ</th>
                <th>การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in filteredTransactions" :key="tx.id">
                <!-- Type Icon -->
                <td style="white-space:nowrap;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.25rem;">{{ txTypeConfig[tx.type]?.emoji }}</span>
                    <span style="font-size:0.8125rem; font-weight:600; color:var(--gray-300);">
                      {{ txTypeConfig[tx.type]?.label }}
                    </span>
                  </div>
                </td>

                <!-- Description -->
                <td>
                  <div style="color:var(--white); font-weight:600; font-size:0.9rem;">
                    {{ tx.title }}
                  </div>
                  <div style="color:var(--gray-400); font-size:0.75rem; margin-top:2px;">
                    {{ tx.description }}
                  </div>
                </td>

                <!-- Reference ID -->
                <td>
                  <div v-if="tx.referenceId" style="display:flex; align-items:center; gap:6px;">
                    <code style="font-size:0.78125rem; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:var(--radius-sm); font-family:var(--font-en); color:var(--accent-300);">
                      {{ tx.referenceId }}
                    </code>
                    <button
                      class="copy-btn"
                      @click="copyText(tx.referenceId)"
                      title="คัดลอกรหัส"
                    >
                      📋
                    </button>
                  </div>
                  <span v-else style="color:var(--gray-600);">-</span>
                </td>

                <!-- Amount -->
                <td>
                  <span
                    :class="tx.amount > 0 ? 'text-success' : 'text-danger'"
                    style="font-weight:800; font-family:var(--font-en); font-size:1rem;"
                  >
                    {{ tx.amount > 0 ? '+' : '' }}{{ formatCurrency(Math.abs(tx.amount)) }}
                  </span>
                </td>

                <!-- Timestamp -->
                <td style="color:var(--gray-400); font-size:0.8125rem; white-space:nowrap;">
                  {{ formatDateTime(tx.created_at) }}
                </td>

                <!-- Status -->
                <td>
                  <span :class="['badge', statusConfig[tx.status]?.badgeClass || 'badge-success']" style="font-size:0.7rem; padding:2px 8px;">
                    {{ statusConfig[tx.status]?.label || tx.status }}
                  </span>
                </td>

                <!-- Action Button -->
                <td style="white-space:nowrap;">
                  <button
                    v-if="tx.type === 'purchase' && tx.orderId"
                    class="btn btn-secondary btn-sm"
                    style="padding:4px 10px; font-size:0.75rem;"
                    @click="router.push(`/orders/${tx.orderId}`)"
                  >
                    ดูออเดอร์ →
                  </button>
                  <a
                    v-else-if="tx.slipUrl"
                    :href="tx.slipUrl"
                    target="_blank"
                    class="btn btn-secondary btn-sm"
                    style="padding:4px 10px; font-size:0.75rem;"
                  >
                    ดูสลิป 📄
                  </a>
                  <span v-else style="color:var(--gray-600);">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state" style="padding:var(--space-12) var(--space-4);">
          <div class="empty-state-icon">💳</div>
          <h3 style="font-size:1.15rem; margin-bottom:var(--space-2);">ไม่พบประวัติธุรกรรม</h3>
          <p style="color:var(--gray-400); max-width:320px; margin:0 auto var(--space-6);">
            {{ searchQuery ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา ลองค้นหาด้วยคำอื่น' : 'คุณยังไม่มีประวัติการเติมเงินหรือการสั่งซื้อสินค้าในระบบ' }}
          </p>
          <button v-if="searchQuery" class="btn btn-secondary" @click="searchQuery = ''">
            ล้างคำค้นหา
          </button>
          <button v-else class="btn btn-primary" @click="router.push('/topup')">
            ➕ เติมเงิน Wallet เลย
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.wallet-hero-card {
  background: linear-gradient(135deg, #0b2d5f 0%, #071428 100%);
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  margin-bottom: var(--space-8);
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.wallet-hero-balance {
  font-size: 3.25rem;
  font-weight: 900;
  color: var(--white);
  font-family: var(--font-en);
  line-height: 1;
  letter-spacing: -0.02em;
}

.wallet-status-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: #4ade80;
  font-weight: 600;
}

.live-pulse-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.wallet-hero-actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-top: var(--space-6);
}

.wallet-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.metric-card {
  background: rgba(15, 28, 54, 0.7);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.metric-val {
  font-size: 1.2rem;
  font-weight: 800;
  font-family: var(--font-en);
  line-height: 1.2;
}

.metric-label {
  font-size: 0.75rem;
  color: var(--gray-400);
  margin-top: 2px;
}

.copy-btn {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.copy-btn:hover {
  opacity: 1;
}

@media (max-width: 900px) {
  .wallet-metrics-grid {
    grid-template-columns: 1fr;
  }
  .wallet-hero-balance {
    font-size: 2.5rem;
  }
}
</style>
