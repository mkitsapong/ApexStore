<script setup>
import AdminLayout from '../../components/AdminLayout.vue'
import { mockProducts, mockOrders, mockUsers, mockTopupRequests, formatCurrency } from '../../data/mockData'

const stats = [
  { label: 'ยอดขายรวม', value: formatCurrency(mockOrders.reduce((s,o)=>s+o.amount,0)), emoji: '💰', iconClass: 'stat-icon-accent' },
  { label: 'คำสั่งซื้อทั้งหมด', value: mockOrders.length, emoji: '📦', iconClass: 'stat-icon-primary' },
  { label: 'สมาชิกทั้งหมด', value: mockUsers.filter(u=>u.role==='user').length, emoji: '👥', iconClass: 'stat-icon-success' },
  { label: 'รอเติมเงิน', value: mockTopupRequests.filter(t=>t.status==='pending').length, emoji: '⏳', iconClass: 'stat-icon-warning' },
]

const statusBadge = { completed: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger' }
const statusLabel = { completed: 'สำเร็จ', pending: 'รอดำเนินการ', rejected: 'ถูกปฏิเสธ' }
</script>

<template>
  <AdminLayout>
    <div class="page-content animate-fade-in">
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">Admin Dashboard</h1>
        <p style="color:var(--gray-500);">ภาพรวมของระบบ</p>
      </div>

      <!-- Stats -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-bottom:var(--space-8);">
        <div v-for="s in stats" :key="s.label" class="stat-card">
          <div :class="['stat-icon', s.iconClass]">{{ s.emoji }}</div>
          <div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Quick links -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-bottom:var(--space-8);">
        <RouterLink to="/admin/products" class="admin-quick-btn">
          <span style="font-size:1.75rem;">🏷️</span>
          <span>จัดการสินค้า</span>
        </RouterLink>
        <RouterLink to="/admin/orders" class="admin-quick-btn">
          <span style="font-size:1.75rem;">📦</span>
          <span>คำสั่งซื้อ</span>
        </RouterLink>
        <RouterLink to="/admin/topups" class="admin-quick-btn" style="border-color:rgba(234,179,8,0.3); background:rgba(234,179,8,0.04);">
          <span style="font-size:1.75rem;">💳</span>
          <span>เติมเงิน <span style="color:var(--warning);">({{ mockTopupRequests.filter(t=>t.status==='pending').length }} รอ)</span></span>
        </RouterLink>
        <RouterLink to="/admin/users" class="admin-quick-btn">
          <span style="font-size:1.75rem;">👥</span>
          <span>จัดการผู้ใช้</span>
        </RouterLink>
      </div>

      <!-- Recent orders table -->
      <div class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-6);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-5);">
          <h3>คำสั่งซื้อล่าสุด</h3>
          <RouterLink to="/admin/orders" style="font-size:0.8125rem; color:var(--accent-400);">ดูทั้งหมด →</RouterLink>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in mockOrders" :key="o.id">
                <td style="font-size:0.8125rem; color:var(--gray-500); font-family:var(--font-en);">{{ o.id }}</td>
                <td style="color:var(--white); font-weight:500;">{{ o.product_emoji }} {{ o.product_name }}</td>
                <td style="font-family:var(--font-en); color:var(--accent-400); font-weight:700;">฿{{ o.amount }}</td>
                <td><span :class="['badge', statusBadge[o.status]]">{{ statusLabel[o.status] }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  text-align: center;
  font-size: 0.9rem;
  color: var(--gray-300);
  font-weight: 500;
  transition: all var(--transition-base);
  cursor: pointer;
}
.admin-quick-btn:hover {
  background: var(--glass-hover);
  border-color: rgba(249,115,22,0.3);
  color: var(--white);
  transform: translateY(-2px);
}
@media (max-width: 1024px) {
  div[style*="repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
}
</style>
