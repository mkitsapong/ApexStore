<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { mockOrders, mockTransactions, mockProducts, formatCurrency, formatDate } from '../../data/mockData'

const auth = useAuthStore()
const router = useRouter()

const recentOrders = mockOrders.slice(0, 3)
const recentTx = mockTransactions.slice(0, 4)

const stats = computed(() => [
  { label: 'ยอดเงินคงเหลือ', value: formatCurrency(auth.balance), emoji: '💰', iconClass: 'stat-icon-accent', sub: 'ในกระเป๋าเงิน' },
  { label: 'คำสั่งซื้อทั้งหมด', value: mockOrders.length, emoji: '📦', iconClass: 'stat-icon-primary', sub: 'รายการ' },
  { label: 'สำเร็จแล้ว', value: mockOrders.filter(o => o.status === 'completed').length, emoji: '✅', iconClass: 'stat-icon-success', sub: 'คำสั่งซื้อ' },
  { label: 'กำลังดำเนินการ', value: mockOrders.filter(o => o.status === 'pending').length, emoji: '⏳', iconClass: 'stat-icon-warning', sub: 'คำสั่งซื้อ' },
])

const statusConfig = {
  completed: { label: 'สำเร็จ', class: 'badge-success' },
  pending: { label: 'รอดำเนินการ', class: 'badge-warning' },
  rejected: { label: 'ถูกปฏิเสธ', class: 'badge-danger' },
}
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in">
      <!-- Header -->
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">สวัสดี, {{ auth.user?.username }} 👋</h1>
        <p style="color:var(--gray-500);">ภาพรวมบัญชีของคุณ</p>
      </div>

      <!-- Stats grid -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-bottom:var(--space-8);">
        <div v-for="s in stats" :key="s.label" class="stat-card">
          <div :class="['stat-icon', s.iconClass]">{{ s.emoji }}</div>
          <div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-6); margin-bottom:var(--space-8);">
        <div class="card" style="background:linear-gradient(135deg, rgba(249,115,22,0.1), rgba(249,115,22,0.02)); border-color:rgba(249,115,22,0.2);">
          <div style="font-size:2rem; margin-bottom:var(--space-3);">💳</div>
          <h3 style="margin-bottom:var(--space-2);">เติมเงิน</h3>
          <p style="font-size:0.875rem; color:var(--gray-500); margin-bottom:var(--space-4);">เติมเงินเข้า Wallet ผ่าน PromptPay ทันที</p>
          <button class="btn btn-primary" @click="router.push('/topup')">เติมเงินเลย</button>
        </div>
        <div class="card" style="background:linear-gradient(135deg, rgba(26,82,168,0.15), rgba(26,82,168,0.02)); border-color:rgba(26,82,168,0.2);">
          <div style="font-size:2rem; margin-bottom:var(--space-3);">🛒</div>
          <h3 style="margin-bottom:var(--space-2);">ซื้อสินค้า</h3>
          <p style="font-size:0.875rem; color:var(--gray-500); margin-bottom:var(--space-4);">เลือกบัญชี Premium ที่คุณต้องการ</p>
          <button class="btn btn-secondary" @click="router.push('/shop')">ไปร้านค้า</button>
        </div>
      </div>

      <!-- Two column: recent orders + transactions -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-6);">
        <!-- Recent Orders -->
        <div class="card-elevated" style="border-radius:var(--radius-lg); padding:var(--space-5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
            <h3 style="font-size:1rem;">คำสั่งซื้อล่าสุด</h3>
            <RouterLink to="/orders" style="font-size:0.8125rem; color:var(--accent-400);">ดูทั้งหมด →</RouterLink>
          </div>
          <div style="display:flex; flex-direction:column; gap:var(--space-3);">
            <div v-for="o in recentOrders" :key="o.id" style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-3); background:var(--glass-bg); border-radius:var(--radius-md); cursor:pointer;" @click="router.push(`/orders/${o.id}`)">
              <div style="display:flex; align-items:center; gap:var(--space-3);">
                <div style="font-size:1.5rem;">{{ o.product_emoji }}</div>
                <div>
                  <div style="font-size:0.875rem; font-weight:500; color:var(--white);">{{ o.product_name }}</div>
                  <div style="font-size:0.75rem; color:var(--gray-500);">{{ o.package_label }}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.875rem; font-weight:700; color:var(--accent-400); font-family:var(--font-en);">฿{{ o.amount }}</div>
                <span :class="['badge', statusConfig[o.status]?.class]" style="font-size:0.65rem;">{{ statusConfig[o.status]?.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="card-elevated" style="border-radius:var(--radius-lg); padding:var(--space-5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
            <h3 style="font-size:1rem;">ธุรกรรมล่าสุด</h3>
            <RouterLink to="/wallet" style="font-size:0.8125rem; color:var(--accent-400);">ดูทั้งหมด →</RouterLink>
          </div>
          <div style="display:flex; flex-direction:column; gap:var(--space-3);">
            <div v-for="tx in recentTx" :key="tx.id" style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-3); background:var(--glass-bg); border-radius:var(--radius-md);">
              <div style="display:flex; align-items:center; gap:var(--space-3);">
                <div style="width:36px; height:36px; border-radius:50%; background:var(--glass-bg); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                  {{ tx.type === 'topup' ? '💰' : '📦' }}
                </div>
                <div>
                  <div style="font-size:0.875rem; font-weight:500; color:var(--white);">{{ tx.description }}</div>
                  <div style="font-size:0.75rem; color:var(--gray-500);">{{ tx.type === 'topup' ? 'เติมเงิน' : 'ซื้อสินค้า' }}</div>
                </div>
              </div>
              <div :style="{color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)', fontWeight:700, fontFamily:'var(--font-en)', fontSize:'0.9rem'}">
                {{ tx.amount > 0 ? '+' : '' }}฿{{ Math.abs(tx.amount).toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
@media (max-width: 1024px) {
  div[style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2,1fr) !important; }
  div[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important; }
}
</style>
