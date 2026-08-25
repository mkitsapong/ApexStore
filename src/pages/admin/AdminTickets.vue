<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { useTicketsStore, TICKET_CATEGORIES } from '../../stores/tickets'
import { useToastStore } from '../../stores/toast'
import { formatDateTime } from '../../data/mockData'

const ticketsStore = useTicketsStore()
const toast = useToastStore()

const filterStatus = ref('all')
const searchQuery = ref('')
const selectedTicket = ref(null)
const showResolveModal = ref(false)
const showRejectModal = ref(false)

// Resolve Form
const resolveForm = ref({
  adminNote: '',
  newEmail: '',
  newPassword: '',
  provideReplacement: false
})
const showPass = ref(false)
const isSubmitting = ref(false)

// Reject Form
const rejectReason = ref('ตรวจสอบแล้ว บัญชีสามารถเข้าใช้งานได้ตามปกติ กรุณาลองใหม่อีกครั้ง')

onMounted(async () => {
  await ticketsStore.fetchAllTickets()
})

const filteredTickets = computed(() => {
  let list = ticketsStore.tickets || []
  if (filterStatus.value !== 'all') {
    list = list.filter(t => t.status === filterStatus.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t =>
      t.id?.toLowerCase().includes(q) ||
      t.order_id?.toLowerCase().includes(q) ||
      t.username?.toLowerCase().includes(q) ||
      t.product_name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    )
  }
  return list
})

const stats = computed(() => {
  const all = ticketsStore.tickets || []
  return [
    { label: 'รอดำเนินการ', value: all.filter(t => t.status === 'pending').length, emoji: '⏳', color: 'stat-icon-warning' },
    { label: 'กำลังดำเนินการ', value: all.filter(t => t.status === 'in_progress').length, emoji: '⚙️', color: 'stat-icon-primary' },
    { label: 'แก้ไขแล้ว', value: all.filter(t => t.status === 'resolved').length, emoji: '✅', color: 'stat-icon-success' },
    { label: 'เคสทั้งหมด', value: all.length, emoji: '📋', color: 'stat-icon-accent' },
  ]
})

function openResolveModal(ticket) {
  selectedTicket.value = ticket
  resolveForm.value = {
    adminNote: 'เปลี่ยนรหัสผ่าน/ส่งมอบบัญชีใหม่ให้เรียบร้อยแล้วครับ รบกวนทดสอบเข้าสู่ระบบอีกครั้ง',
    newEmail: '',
    newPassword: '',
    provideReplacement: true
  }
  showResolveModal.value = true
}

function openRejectModal(ticket) {
  selectedTicket.value = ticket
  rejectReason.value = 'ตรวจสอบแล้ว บัญชีสามารถเข้าใช้งานได้ตามปกติ กรุณาปิด VPN หรือทดสอบอีกครั้ง'
  showRejectModal.value = true
}

async function handleResolve() {
  if (!selectedTicket.value) return
  isSubmitting.value = true
  try {
    const res = await ticketsStore.resolveTicket({
      ticketId: selectedTicket.value.id,
      adminNote: resolveForm.value.adminNote,
      newEmail: resolveForm.value.provideReplacement ? resolveForm.value.newEmail.trim() : null,
      newPassword: resolveForm.value.provideReplacement ? resolveForm.value.newPassword.trim() : null,
      status: 'resolved'
    })
    if (res.success) {
      toast.success('✅ จัดการปัญหาและอัปเดตข้อมูลบัญชีให้ลูกค้าเรียบร้อยแล้ว')
      showResolveModal.value = false
    }
  } catch (err) {
    toast.error('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

async function handleReject() {
  if (!selectedTicket.value) return
  isSubmitting.value = true
  try {
    const res = await ticketsStore.rejectTicket(
      selectedTicket.value.id,
      rejectReason.value
    )
    if (res.success) {
      toast.success('ปฏิเสธรายการแจ้งปัญหาแล้ว')
      showRejectModal.value = false
    }
  } catch (err) {
    toast.error('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

const statusBadge = {
  pending: 'badge-warning',
  in_progress: 'badge-primary',
  resolved: 'badge-success',
  rejected: 'badge-danger'
}

const statusLabel = {
  pending: '⏳ รอดำเนินการ',
  in_progress: '⚙️ กำลังแก้ไข',
  resolved: '✅ แก้ไขแล้ว',
  rejected: '❌ ปฏิเสธ'
}
</script>

<template>
  <AdminLayout>
    <div class="page-content animate-fade-in">
      <!-- Header -->
      <div class="tickets-header">
        <div>
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-1); display:flex; align-items:center; gap:var(--space-3);">
            🚨 จัดการปัญหาการใช้งาน (Support Tickets)
          </h1>
          <p style="color:var(--gray-400);">ตรวจสอบรายการแจ้งปัญหาจากลูกค้า ตอบกลับ และส่งมอบบัญชีใหม่ทดแทน</p>
        </div>
        <button class="btn btn-secondary btn-sm" @click="ticketsStore.fetchAllTickets">
          🔄 ซิงค์ข้อมูลล่าสุด
        </button>
      </div>

      <!-- Stats Grid -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-bottom:var(--space-6);">
        <div v-for="s in stats" :key="s.label" class="stat-card">
          <div :class="['stat-icon', s.color]">{{ s.emoji }}</div>
          <div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Filter bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-4); margin-bottom:var(--space-5); flex-wrap:wrap;">
        <!-- Tabs -->
        <div class="tabs" style="margin-bottom:0;">
          <button
            v-for="st in [
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'pending', label: '⏳ รอดำเนินการ' },
              { id: 'resolved', label: '✅ แก้ไขแล้ว' },
              { id: 'rejected', label: '❌ ปฏิเสธ' }
            ]"
            :key="st.id"
            :class="['tab', { active: filterStatus === st.id }]"
            @click="filterStatus = st.id"
          >
            {{ st.label }}
          </button>
        </div>

        <!-- Search -->
        <input
          v-model="searchQuery"
          class="input"
          placeholder="🔍 ค้นหาตาม Ticket ID, Order ID, ชื่อลูกค้า..."
          style="max-width:320px; font-size:0.875rem;"
        />
      </div>

      <!-- Tickets Table -->
      <div class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-6);">
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Order ID</th>
                <th>ลูกค้า</th>
                <th>สินค้า</th>
                <th>ประเภทปัญหา</th>
                <th>วันที่แจ้ง</th>
                <th>สถานะ</th>
                <th style="text-align:right;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTickets" :key="t.id" class="ticket-row">
                <td style="font-family:monospace; font-weight:700; color:var(--accent-400); font-size:0.8125rem;">
                  {{ t.id }}
                </td>
                <td style="font-family:monospace; color:var(--gray-300); font-size:0.8125rem;">
                  {{ t.order_id }}
                </td>
                <td style="font-weight:600; color:var(--white);">
                  {{ t.username }}
                </td>
                <td style="color:var(--white); font-weight:500;">
                  {{ t.product_name }}
                </td>
                <td>
                  <span class="category-chip">
                    {{ TICKET_CATEGORIES[t.category]?.emoji || '⚠️' }} {{ TICKET_CATEGORIES[t.category]?.label || t.category }}
                  </span>
                </td>
                <td style="font-size:0.8125rem; color:var(--gray-500);">
                  {{ formatDateTime(t.created_at) }}
                </td>
                <td>
                  <span :class="['badge', statusBadge[t.status]]">
                    {{ statusLabel[t.status] }}
                  </span>
                </td>
                <td style="text-align:right;">
                  <div style="display:flex; justify-content:flex-end; gap:var(--space-2);">
                    <button
                      v-if="t.status === 'pending' || t.status === 'in_progress'"
                      class="btn btn-sm btn-primary"
                      @click="openResolveModal(t)"
                      title="ส่งมอบบัญชีใหม่หรือแก้ไขปัญหา"
                    >
                      🔧 แก้ไข/ส่งบัญชีใหม่
                    </button>
                    <button
                      v-if="t.status === 'pending'"
                      class="btn btn-sm btn-secondary"
                      @click="openRejectModal(t)"
                      title="ปฏิเสธคำขอ"
                    >
                      ✕ ปฏิเสธ
                    </button>
                    <button
                      v-else-if="t.status === 'resolved'"
                      class="btn btn-sm btn-secondary"
                      @click="openResolveModal(t)"
                    >
                      👁️ ดูรายละเอียด
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div v-if="filteredTickets.length === 0" style="text-align:center; padding:var(--space-12); color:var(--gray-500);">
            <div style="font-size:3rem; margin-bottom:var(--space-2);">🎉</div>
            <h3>ไม่มีรายการแจ้งปัญหา</h3>
            <p style="font-size:0.875rem;">ระบบทำงานราบรื่น ไม่มีเคสค้างในหมวดหมู่นี้</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- RESOLVE & REPLACEMENT MODAL                                -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showResolveModal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:var(--space-4);"
        @click.self="showResolveModal = false"
      >
        <div style="background:var(--bg-card);border:1px solid var(--glass-border);border-radius:var(--radius-xl);padding:var(--space-8);width:100%;max-width:560px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
            <h3 style="display:flex; align-items:center; gap:var(--space-2);">
              🔧 แก้ไขปัญหา & ส่งมอบบัญชีทดแทน
            </h3>
            <button class="btn btn-secondary btn-icon" @click="showResolveModal = false">✕</button>
          </div>

          <!-- Problem Summary Card -->
          <div style="padding:var(--space-4); background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:var(--radius-lg); margin-bottom:var(--space-4);">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
              <span style="color:var(--gray-400);">เคส: <strong style="color:var(--accent-400); font-family:monospace;">{{ selectedTicket?.id }}</strong></span>
              <span style="color:var(--white); font-weight:600;">{{ selectedTicket?.product_name }}</span>
            </div>
            <div style="font-size:0.85rem; color:var(--gray-400); margin-bottom:var(--space-2);">
              ผู้แจ้ง: <strong>{{ selectedTicket?.username }}</strong> (Order: {{ selectedTicket?.order_id }})
            </div>
            <div style="padding:var(--space-3); background:rgba(0,0,0,0.25); border-radius:var(--radius-md); font-size:0.8125rem; color:#cbd5e1;">
              <strong>ข้อความแจ้งจากลูกค้า:</strong><br />
              {{ selectedTicket?.description }}
            </div>
          </div>

          <form @submit.prevent="handleResolve" style="display:flex; flex-direction:column; gap:var(--space-4);">
            <!-- Toggle replacement credentials -->
            <label class="toggle-replacement-label">
              <input type="checkbox" v-model="resolveForm.provideReplacement" style="accent-color:var(--accent-500);" />
              <div>
                <strong style="color:var(--white);">ส่งมอบบัญชี/รหัสผ่านใหม่ (Update Order Credentials)</strong>
                <div style="font-size:0.75rem; color:var(--gray-400);">ระบบจะนำข้อมูลนี้ไปเข้ารหัส AES-256 และอัปเดตลงในคำสั่งซื้อของลูกค้าให้อัตโนมัติทันที</div>
              </div>
            </label>

            <!-- New Credentials inputs -->
            <div v-if="resolveForm.provideReplacement" style="display:flex; flex-direction:column; gap:var(--space-3); padding:var(--space-4); background:rgba(34,197,94,0.04); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-lg);">
              <div>
                <label class="form-label" style="font-size:0.8125rem; color:var(--gray-300); display:block; margin-bottom:4px;">
                  New Email / Account ID <span style="color:var(--danger);">*</span>
                </label>
                <input
                  v-model="resolveForm.newEmail"
                  class="input"
                  placeholder="เช่น account.new@gmail.com"
                  required
                  style="font-family:monospace;"
                />
              </div>

              <div>
                <label class="form-label" style="font-size:0.8125rem; color:var(--gray-300); display:block; margin-bottom:4px;">
                  New Password <span style="color:var(--danger);">*</span>
                </label>
                <div style="position:relative;">
                  <input
                    v-model="resolveForm.newPassword"
                    :type="showPass ? 'text' : 'password'"
                    class="input"
                    placeholder="รหัสผ่านใหม่"
                    required
                    style="font-family:monospace; padding-right:4rem;"
                  />
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    style="position:absolute; right:6px; top:50%; transform:translateY(-50%); padding:2px 8px; font-size:0.75rem;"
                    @click="showPass = !showPass"
                  >
                    {{ showPass ? 'ซ่อน' : 'แสดง' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Admin Note -->
            <div>
              <label class="form-label" style="font-size:0.8125rem; color:var(--gray-300); display:block; margin-bottom:4px;">
                ข้อความตอบกลับลูกค้า (Admin Response Note) <span style="color:var(--danger);">*</span>
              </label>
              <textarea
                v-model="resolveForm.adminNote"
                class="input"
                rows="3"
                placeholder="เช่น เปลี่ยนรหัสผ่านใหม่ให้แล้วครับ รบกวนทดสอบเข้าสู่ระบบอีกครั้ง"
                required
                style="width:100%; resize:vertical; line-height:1.4;"
              ></textarea>
            </div>

            <div style="display:flex; gap:var(--space-3); margin-top:var(--space-2);">
              <button
                type="button"
                class="btn btn-secondary"
                style="flex:1;"
                @click="showResolveModal = false"
                :disabled="isSubmitting"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                style="flex:2;"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting">⏳ กำลังบันทึก...</span>
                <span v-else>✅ บันทึกและแจ้งลูกค้า</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- REJECT MODAL                                               -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showRejectModal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:var(--space-4);"
        @click.self="showRejectModal = false"
      >
        <div style="background:var(--bg-card);border:1px solid var(--glass-border);border-radius:var(--radius-xl);padding:var(--space-8);width:100%;max-width:480px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
            <h3 style="display:flex; align-items:center; gap:var(--space-2); color:#f87171;">
              ✕ ปฏิเสธรายการแจ้งปัญหา
            </h3>
            <button class="btn btn-secondary btn-icon" @click="showRejectModal = false">✕</button>
          </div>

          <form @submit.prevent="handleReject" style="display:flex; flex-direction:column; gap:var(--space-4);">
            <div>
              <label class="form-label" style="font-size:0.8125rem; color:var(--gray-300); display:block; margin-bottom:4px;">
                ระบุเหตุผลในการปฏิเสธ (ลูกค้าจะเห็นข้อความนี้)
              </label>
              <textarea
                v-model="rejectReason"
                class="input"
                rows="3"
                required
                style="width:100%; resize:vertical;"
              ></textarea>
            </div>

            <div style="display:flex; gap:var(--space-3);">
              <button
                type="button"
                class="btn btn-secondary"
                style="flex:1;"
                @click="showRejectModal = false"
                :disabled="isSubmitting"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="btn"
                style="flex:1.5; background:rgba(239,68,68,0.2); color:#f87171; border:1px solid rgba(239,68,68,0.4);"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting">⏳...</span>
                <span v-else>ยืนยันปฏิเสธ</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<style scoped>
.tickets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.category-chip {
  font-size: 0.75rem;
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  color: var(--gray-300);
  white-space: nowrap;
}

.toggle-replacement-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.ticket-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

@media (max-width: 1024px) {
  div[style*="repeat(4,1fr)"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
