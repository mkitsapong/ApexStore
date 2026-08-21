<script setup>
import { ref } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { useToastStore } from '../../stores/toast'
import { mockOrders, formatDateTime } from '../../data/mockData'

const toast = useToastStore()
const orders = ref([...mockOrders])
const filterStatus = ref('all')

const filtered = () => filterStatus.value === 'all' ? orders.value : orders.value.filter(o => o.status === filterStatus.value)

function approve(id) {
  const o = orders.value.find(o => o.id === id)
  if (o) {
    o.status = 'completed'
    o.account_email = `auto.acc${id.slice(-2)}@example.com`
    o.account_password = `Pass${id.slice(-4)}!`
    toast.success('อนุมัติคำสั่งซื้อสำเร็จ')
  }
}

function reject(id) {
  const o = orders.value.find(o => o.id === id)
  if (o) { o.status = 'rejected'; toast.success('ปฏิเสธคำสั่งซื้อแล้ว') }
}

const statusBadge = { completed: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger' }
const statusLabel = { completed: 'สำเร็จ', pending: 'รอดำเนินการ', rejected: 'ถูกปฏิเสธ' }
</script>

<template>
  <AdminLayout>
    <div class="page-content animate-fade-in">
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">จัดการคำสั่งซื้อ</h1>
        <p style="color:var(--gray-500);">{{ orders.length }} คำสั่งซื้อทั้งหมด</p>
      </div>

      <!-- Filter -->
      <div class="tabs">
        <button v-for="s in ['all','pending','completed','rejected']" :key="s" :class="['tab', {active: filterStatus===s}]" @click="filterStatus=s">
          {{ s === 'all' ? 'ทั้งหมด' : statusLabel[s] }} ({{ s==='all' ? orders.length : orders.filter(o=>o.status===s).length }})
        </button>
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>สินค้า</th>
              <th>ยอด</th>
              <th>วันที่</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in filtered()" :key="o.id">
              <td style="font-size:0.8125rem; font-family:var(--font-en); color:var(--gray-400);">{{ o.id }}</td>
              <td style="color:var(--white); font-weight:500;">{{ o.product_emoji }} {{ o.product_name }}</td>
              <td style="color:var(--accent-400); font-weight:700; font-family:var(--font-en);">฿{{ o.amount }}</td>
              <td style="font-size:0.8125rem; color:var(--gray-500);">{{ formatDateTime(o.created_at) }}</td>
              <td><span :class="['badge', statusBadge[o.status]]">{{ statusLabel[o.status] }}</span></td>
              <td>
                <div v-if="o.status === 'pending'" style="display:flex; gap:var(--space-2);">
                  <button class="btn btn-sm" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3);" @click="approve(o.id)" :id="`approve-${o.id}`">✅ อนุมัติ</button>
                  <button class="btn btn-sm" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);" @click="reject(o.id)">❌ ปฏิเสธ</button>
                </div>
                <span v-else style="font-size:0.8125rem; color:var(--gray-600);">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>
