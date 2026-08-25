<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { useToastStore } from '../../stores/toast'
import { useOrdersStore } from '../../stores/orders'
import { formatDateTime } from '../../data/mockData'

const toast = useToastStore()
const ordersStore = useOrdersStore()
const filterStatus = ref('all')

onMounted(() => {
  ordersStore.fetchAllOrders()
})

const orders = computed(() => ordersStore.orders)
const filtered = () => filterStatus.value === 'all' ? orders.value : orders.value.filter(o => o.status === filterStatus.value)

// ─── Approve Modal ───────────────────────────────────────────────
const approveModal = ref(false)
const approveTarget = ref(null)   // order being approved
const approveEmail = ref('')
const approvePassword = ref('')
const approveLoading = ref(false)
const showApprovePassword = ref(false)

function openApproveModal(order) {
  approveTarget.value = order
  approveEmail.value = ''
  approvePassword.value = ''
  showApprovePassword.value = false
  approveModal.value = true
}

function closeApproveModal() {
  approveModal.value = false
  approveTarget.value = null
  approveEmail.value = ''
  approvePassword.value = ''
}

async function submitApprove() {
  if (!approveEmail.value.trim() || !approvePassword.value.trim()) {
    toast.error('กรุณากรอก Email และ Password ให้ครบ')
    return
  }
  approveLoading.value = true
  try {
    await ordersStore.approveOrder(
      approveTarget.value.id,
      approveEmail.value.trim(),
      approvePassword.value.trim()
    )
    toast.success('✅ อนุมัติและเข้ารหัสข้อมูลบัญชีสำเร็จ')
    closeApproveModal()
  } catch (e) {
    toast.error('เกิดข้อผิดพลาด: ' + e.message)
  } finally {
    approveLoading.value = false
  }
}

async function reject(id) {
  await ordersStore.rejectOrder(id)
  toast.success('ปฏิเสธคำสั่งซื้อแล้ว')
}

const statusBadge = { completed: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger' }
const statusLabel  = { completed: 'สำเร็จ', pending: 'รอดำเนินการ', rejected: 'ถูกปฏิเสธ' }
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
                  <button
                    class="btn btn-sm"
                    style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3);"
                    @click="openApproveModal(o)"
                    :id="`approve-${o.id}`"
                  >✅ อนุมัติ</button>
                  <button class="btn btn-sm" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);" @click="reject(o.id)">❌ ปฏิเสธ</button>
                </div>
                <span v-else style="font-size:0.8125rem; color:var(--gray-600);">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── Approve Modal ─────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="approveModal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:var(--space-4);"
        @click.self="closeApproveModal"
      >
        <div style="background:var(--bg-card);border:1px solid var(--glass-border);border-radius:var(--radius-xl);padding:var(--space-8);width:100%;max-width:480px;">
          <h3 style="margin-bottom:var(--space-2);">🔐 กรอกข้อมูลบัญชี</h3>
          <p style="color:var(--gray-500);font-size:0.875rem;margin-bottom:var(--space-6);">
            ข้อมูลจะถูก <strong style="color:#4ade80;">เข้ารหัส AES-256</strong> ก่อนบันทึกลงฐานข้อมูล<br>
            Order: <code style="font-family:monospace;color:var(--accent-400);">{{ approveTarget?.id }}</code>
          </p>

          <div style="display:flex;flex-direction:column;gap:var(--space-4);">
            <div>
              <label style="font-size:0.875rem;color:var(--gray-400);display:block;margin-bottom:var(--space-2);">Email / Username</label>
              <input
                v-model="approveEmail"
                type="email"
                class="input"
                placeholder="user@example.com"
                id="approve-email-input"
                style="width:100%;"
              />
            </div>

            <div>
              <label style="font-size:0.875rem;color:var(--gray-400);display:block;margin-bottom:var(--space-2);">Password</label>
              <div style="position:relative;">
                <input
                  v-model="approvePassword"
                  :type="showApprovePassword ? 'text' : 'password'"
                  class="input"
                  placeholder="รหัสผ่านบัญชี"
                  id="approve-password-input"
                  style="width:100%;padding-right:3rem;"
                />
                <button
                  type="button"
                  @click="showApprovePassword = !showApprovePassword"
                  style="position:absolute;right:var(--space-3);top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);font-size:1.1rem;"
                >{{ showApprovePassword ? '🙈' : '👁️' }}</button>
              </div>
            </div>

            <div style="padding:var(--space-3);background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);font-size:0.8rem;color:var(--gray-400);">
              🔒 รหัสผ่านจะถูกเข้ารหัสด้วย pgcrypto AES-256 ทันทีที่กด "อนุมัติ" — ไม่มีการเก็บ plaintext ในระบบ
            </div>

            <div style="display:flex;gap:var(--space-3);margin-top:var(--space-2);">
              <button
                class="btn btn-secondary"
                style="flex:1;"
                @click="closeApproveModal"
                :disabled="approveLoading"
              >ยกเลิก</button>
              <button
                class="btn"
                style="flex:2;background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);"
                @click="submitApprove"
                :disabled="approveLoading"
                id="submit-approve-btn"
              >
                <span v-if="approveLoading">⏳ กำลังเข้ารหัสและบันทึก...</span>
                <span v-else>✅ อนุมัติ & เข้ารหัส</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

