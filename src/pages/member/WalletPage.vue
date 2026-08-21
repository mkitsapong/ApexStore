<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { mockTransactions, formatCurrency, formatDateTime } from '../../data/mockData'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const transactions = [...mockTransactions].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))

const txTypeConfig = {
  topup: { label: 'เติมเงิน', emoji: '💰', colorClass: 'text-success' },
  purchase: { label: 'ซื้อสินค้า', emoji: '🛒', colorClass: 'text-danger' },
  refund: { label: 'คืนเงิน', emoji: '↩️', colorClass: 'text-success' },
}
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in">
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">Wallet</h1>
        <p style="color:var(--gray-500);">จัดการยอดเงินและดูประวัติธุรกรรม</p>
      </div>

      <!-- Balance card -->
      <div style="background:linear-gradient(135deg, #0b2d5f 0%, #071428 100%); border:1px solid rgba(249,115,22,0.2); border-radius:var(--radius-xl); padding:var(--space-8); margin-bottom:var(--space-8); position:relative; overflow:hidden;">
        <div class="orb" style="width:200px;height:200px;background:var(--accent-500);right:-60px;top:-60px;opacity:0.12;filter:blur(50px);position:absolute;"></div>
        <div style="position:relative; z-index:1;">
          <div style="font-size:0.9rem; color:var(--gray-400); margin-bottom:var(--space-2);">ยอดเงินคงเหลือ</div>
          <div style="font-size:3rem; font-weight:900; color:var(--white); font-family:var(--font-en); line-height:1; margin-bottom:var(--space-6);">{{ formatCurrency(auth.balance) }}</div>
          <div style="display:flex; gap:var(--space-3);">
            <button class="btn btn-primary" @click="router.push('/topup')" id="wallet-topup-btn">➕ เติมเงิน</button>
            <button class="btn btn-secondary" @click="router.push('/shop')">🛒 ใช้จ่าย</button>
          </div>
        </div>
      </div>

      <!-- Transaction history -->
      <div class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-6);">
        <h3 style="margin-bottom:var(--space-5);">ประวัติธุรกรรม</h3>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>รายการ</th>
                <th>จำนวน</th>
                <th>ยอดคงเหลือหลัง</th>
                <th>วันที่</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in transactions" :key="tx.id">
                <td>
                  <span style="font-size:1.25rem;">{{ txTypeConfig[tx.type]?.emoji }}</span>
                </td>
                <td style="color:var(--white); font-weight:500;">{{ tx.description }}</td>
                <td>
                  <span :class="tx.amount > 0 ? 'text-success' : 'text-danger'" style="font-weight:700; font-family:var(--font-en);">
                    {{ tx.amount > 0 ? '+' : '' }}{{ formatCurrency(Math.abs(tx.amount)) }}
                  </span>
                </td>
                <td style="font-family:var(--font-en); color:var(--gray-300);">{{ formatCurrency(tx.balance_after) }}</td>
                <td style="color:var(--gray-500); font-size:0.875rem;">{{ formatDateTime(tx.created_at) }}</td>
                <td>
                  <span :class="['badge', tx.status === 'completed' ? 'badge-success' : 'badge-warning']">
                    {{ tx.status === 'completed' ? 'สำเร็จ' : 'รอดำเนินการ' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
