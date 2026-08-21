<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { mockOrders, formatDateTime } from '../../data/mockData'

const router = useRouter()
const filter = ref('all')

const statusConfig = {
  completed: { label: 'สำเร็จ', badgeClass: 'badge-success' },
  pending: { label: 'รอดำเนินการ', badgeClass: 'badge-warning' },
  rejected: { label: 'ถูกปฏิเสธ', badgeClass: 'badge-danger' },
}

const filtered = computed(() => {
  if (filter.value === 'all') return mockOrders
  return mockOrders.filter(o => o.status === filter.value)
})
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-8);">
        <div>
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">คำสั่งซื้อ</h1>
          <p style="color:var(--gray-500);">ประวัติการสั่งซื้อทั้งหมดของคุณ</p>
        </div>
        <RouterLink to="/shop" class="btn btn-primary">🛒 ซื้อสินค้าใหม่</RouterLink>
      </div>

      <!-- Filter tabs -->
      <div class="tabs">
        <button v-for="f in ['all','completed','pending','rejected']" :key="f" :class="['tab', {active: filter === f}]" @click="filter=f">
          {{ f === 'all' ? 'ทั้งหมด' : statusConfig[f]?.label }} ({{ f === 'all' ? mockOrders.length : mockOrders.filter(o=>o.status===f).length }})
        </button>
      </div>

      <!-- Orders -->
      <div v-if="filtered.length" style="display:flex; flex-direction:column; gap:var(--space-4);">
        <div
          v-for="order in filtered"
          :key="order.id"
          class="card"
          style="cursor:pointer; padding:var(--space-5);"
          @click="router.push(`/orders/${order.id}`)"
        >
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-4);">
            <div style="display:flex; align-items:center; gap:var(--space-4);">
              <div style="width:56px;height:56px;background:var(--bg-surface);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;">
                {{ order.product_emoji }}
              </div>
              <div>
                <div style="font-weight:700; color:var(--white); font-size:1rem; margin-bottom:4px;">{{ order.product_name }}</div>
                <div style="font-size:0.8125rem; color:var(--gray-500);">{{ order.package_label }} · {{ formatDateTime(order.created_at) }}</div>
                <div style="font-size:0.75rem; color:var(--gray-600); margin-top:2px; font-family:var(--font-en);">{{ order.id }}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:var(--space-4);">
              <div style="text-align:right;">
                <div style="font-size:1.25rem; font-weight:800; color:var(--accent-400); font-family:var(--font-en);">฿{{ order.amount.toLocaleString() }}</div>
              </div>
              <span :class="['badge', statusConfig[order.status]?.badgeClass]">{{ statusConfig[order.status]?.label }}</span>
              <span style="color:var(--gray-600);">→</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>ยังไม่มีคำสั่งซื้อ</h3>
        <RouterLink to="/shop" class="btn btn-primary" style="margin-top:var(--space-2);">🛒 เริ่มช้อปปิ้ง</RouterLink>
      </div>
    </div>
  </DashboardLayout>
</template>
