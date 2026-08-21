<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { mockOrders, formatDateTime, formatDate } from '../../data/mockData'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const order = computed(() => mockOrders.find(o => o.id === route.params.id))
const showCreds = ref(false)
const copied = ref(false)

const statusConfig = {
  completed: { label: 'สำเร็จ', badgeClass: 'badge-success', emoji: '✅' },
  pending: { label: 'รอดำเนินการ', badgeClass: 'badge-warning', emoji: '⏳' },
  rejected: { label: 'ถูกปฏิเสธ', badgeClass: 'badge-danger', emoji: '❌' },
}

function copyText(text) {
  navigator.clipboard.writeText(text)
  toast.success('คัดลอกแล้ว!')
}
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in" v-if="order">
      <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-8);">
        <button class="btn btn-secondary btn-sm" @click="router.push('/orders')">← กลับ</button>
        <div>
          <h1 style="font-size:1.5rem; margin-bottom:2px;">รายละเอียดคำสั่งซื้อ</h1>
          <div style="font-size:0.875rem; color:var(--gray-500); font-family:var(--font-en);">{{ order.id }}</div>
        </div>
        <span :class="['badge', statusConfig[order.status]?.badgeClass]" style="margin-left:auto;">
          {{ statusConfig[order.status]?.emoji }} {{ statusConfig[order.status]?.label }}
        </span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 360px; gap:var(--space-6); align-items:start;">
        <div style="display:flex; flex-direction:column; gap:var(--space-5);">
          <!-- Product info -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-4);">ข้อมูลสินค้า</h3>
            <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-5); padding-bottom:var(--space-5); border-bottom:1px solid var(--glass-border);">
              <div style="width:64px;height:64px;background:var(--bg-surface);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:2.5rem;flex-shrink:0;">
                {{ order.product_emoji }}
              </div>
              <div>
                <h4>{{ order.product_name }}</h4>
                <div style="color:var(--gray-500); font-size:0.9rem;">แพ็กเกจ: {{ order.package_label }}</div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:var(--space-3);">
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--gray-500);">หมายเลขคำสั่งซื้อ</span>
                <span style="color:var(--white); font-family:var(--font-en); font-size:0.875rem;">{{ order.id }}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--gray-500);">ยอดชำระ</span>
                <span style="color:var(--accent-400); font-weight:700; font-family:var(--font-en);">฿{{ order.amount.toLocaleString() }}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--gray-500);">วันที่สั่งซื้อ</span>
                <span style="color:var(--white); font-size:0.875rem;">{{ formatDateTime(order.created_at) }}</span>
              </div>
              <div v-if="order.expires_at" style="display:flex; justify-content:space-between;">
                <span style="color:var(--gray-500);">วันหมดอายุ</span>
                <span style="color:var(--white); font-size:0.875rem;">{{ formatDate(order.expires_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Account credentials -->
          <div v-if="order.status === 'completed'" class="card" style="border-color:rgba(34,197,94,0.3);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-4);">
              <h3>🔑 ข้อมูลบัญชี</h3>
              <button class="btn btn-secondary btn-sm" @click="showCreds = !showCreds">
                {{ showCreds ? '🙈 ซ่อน' : '👁️ แสดง' }}
              </button>
            </div>

            <div v-if="showCreds" style="display:flex; flex-direction:column; gap:var(--space-3);">
              <div style="padding:var(--space-4); background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-md);">
                <div style="font-size:0.75rem; color:var(--gray-500); margin-bottom:var(--space-2);">EMAIL / USERNAME</div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3);">
                  <code style="color:#4ade80; font-size:0.9375rem; font-family:monospace;">{{ order.account_email }}</code>
                  <button class="btn btn-secondary btn-sm" @click="copyText(order.account_email)">📋</button>
                </div>
              </div>
              <div style="padding:var(--space-4); background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-md);">
                <div style="font-size:0.75rem; color:var(--gray-500); margin-bottom:var(--space-2);">PASSWORD</div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3);">
                  <code style="color:#4ade80; font-size:0.9375rem; font-family:monospace;">{{ order.account_password }}</code>
                  <button class="btn btn-secondary btn-sm" @click="copyText(order.account_password)">📋</button>
                </div>
              </div>
              <div style="padding:var(--space-3); background:rgba(234,179,8,0.08); border:1px solid rgba(234,179,8,0.2); border-radius:var(--radius-md); font-size:0.8125rem; color:#facc15;">
                ⚠️ อย่าเปิดเผยข้อมูลบัญชีนี้ให้ผู้อื่น หากมีปัญหาติดต่อ Admin ได้เลย
              </div>
            </div>

            <div v-else style="text-align:center; padding:var(--space-6); color:var(--gray-500); font-size:0.875rem;">
              🔒 คลิก "แสดง" เพื่อดูข้อมูลบัญชี
            </div>
          </div>

          <!-- Pending info -->
          <div v-else-if="order.status === 'pending'" style="padding:var(--space-5); background:rgba(234,179,8,0.08); border:1px solid rgba(234,179,8,0.25); border-radius:var(--radius-lg);">
            <div style="font-size:1.5rem; margin-bottom:var(--space-3);">⏳</div>
            <h4 style="margin-bottom:var(--space-2);">กำลังดำเนินการ</h4>
            <p style="font-size:0.875rem; color:var(--gray-500);">คำสั่งซื้อของคุณกำลังได้รับการดำเนินการ จะได้รับข้อมูลบัญชีเร็วๆ นี้</p>
          </div>
        </div>

        <!-- Side panel -->
        <div class="card-elevated" style="border-radius:var(--radius-lg); padding:var(--space-5);">
          <h4 style="margin-bottom:var(--space-4);">ต้องการความช่วยเหลือ?</h4>
          <div style="display:flex; flex-direction:column; gap:var(--space-3);">
            <button class="btn btn-secondary w-full" style="justify-content:flex-start; gap:var(--space-3);">💬 ติดต่อ Admin Line</button>
            <button class="btn btn-secondary w-full" style="justify-content:flex-start; gap:var(--space-3);">📧 อีเมล Support</button>
          </div>
          <div class="divider"></div>
          <RouterLink to="/orders" class="btn btn-outline w-full" style="width:100%;">📦 คำสั่งซื้อทั้งหมด</RouterLink>
        </div>
      </div>
    </div>

    <div v-else class="page-content empty-state">
      <div class="empty-state-icon">😢</div>
      <h3>ไม่พบคำสั่งซื้อ</h3>
      <button class="btn btn-secondary" @click="router.push('/orders')">← กลับ</button>
    </div>
  </DashboardLayout>
</template>

<style scoped>
@media (max-width: 768px) {
  div[style*="grid-template-columns:1fr 360px"] { grid-template-columns: 1fr !important; }
}
</style>
