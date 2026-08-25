<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { useOrdersStore } from '../../stores/orders'
import { useTicketsStore, TICKET_CATEGORIES } from '../../stores/tickets'
import { formatDateTime, formatDate } from '../../data/mockData'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const ticketsStore = useTicketsStore()
const toast = useToastStore()

onMounted(async () => {
  if (!ordersStore.orders.length) {
    ordersStore.fetchUserOrders()
  }
  ticketsStore.fetchUserTickets()
})

const order = computed(() => ordersStore.getOrderById(route.params.id))

// Credentials state
const showCreds = ref(false)
const credsLoading = ref(false)
const credentials = ref(null) // { email, password } — in-memory only
const credsError = ref(null)

// Support Ticket state
const showReportModal = ref(false)
const reportCategory = ref('login_failed')
const reportDescription = ref('')
const reportLoading = ref(false)

const orderTickets = computed(() => {
  return ticketsStore.getTicketsByOrderId(route.params.id)
})
const latestTicket = computed(() => {
  return orderTickets.value.length > 0 ? orderTickets.value[0] : null
})

const statusConfig = {
  completed: { label: 'สำเร็จ', badgeClass: 'badge-success', emoji: '✅' },
  pending: { label: 'รอดำเนินการ', badgeClass: 'badge-warning', emoji: '⏳' },
  rejected: { label: 'ถูกปฏิเสธ', badgeClass: 'badge-danger', emoji: '❌' },
}

const ticketStatusBadge = {
  pending: { label: 'รอ Admin ตรวจสอบ', badgeClass: 'badge-warning', emoji: '⏳' },
  in_progress: { label: 'กำลังดำเนินการแก้ไข', badgeClass: 'badge-primary', emoji: '⚙️' },
  resolved: { label: 'แก้ไขปัญหาสำเร็จแล้ว', badgeClass: 'badge-success', emoji: '✅' },
  rejected: { label: 'ไม่พบความผิดปกติ', badgeClass: 'badge-danger', emoji: '❌' }
}

async function toggleCreds() {
  if (showCreds.value) {
    showCreds.value = false
    credentials.value = null
    credsError.value = null
    return
  }
  credsLoading.value = true
  credsError.value = null
  try {
    const result = await ordersStore.fetchOrderCredentials(order.value.id)
    if (result.success) {
      credentials.value = { email: result.email, password: result.password }
      showCreds.value = true
    } else {
      credsError.value = result.error
    }
  } catch (e) {
    credsError.value = e.message
  } finally {
    credsLoading.value = false
  }
}

function copyText(text) {
  navigator.clipboard.writeText(text)
  toast.success('คัดลอกแล้ว!')
}

function openReportModal() {
  reportCategory.value = 'login_failed'
  reportDescription.value = ''
  showReportModal.value = true
}

async function submitReport() {
  if (!reportDescription.value.trim()) {
    toast.error('กรุณาระบุรายละเอียดปัญหาเพิ่มเติม')
    return
  }

  reportLoading.value = true
  try {
    const res = await ticketsStore.createTicket({
      order: order.value,
      category: reportCategory.value,
      description: reportDescription.value
    })
    if (res.success) {
      toast.success('🚨 ส่งเรื่องแจ้งปัญหาสำเร็จ! แอดมินจะรีบตรวจสอบให้โดยเร็ว')
      showReportModal.value = false
      reportDescription.value = ''
    }
  } catch (err) {
    toast.error('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    reportLoading.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in" v-if="order">
      <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-8); flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" @click="router.push('/orders')">← กลับ</button>
        <div>
          <h1 style="font-size:1.5rem; margin-bottom:2px;">รายละเอียดคำสั่งซื้อ</h1>
          <div style="font-size:0.875rem; color:var(--gray-500); font-family:var(--font-en);">{{ order.id }}</div>
        </div>
        <span :class="['badge', statusConfig[order.status]?.badgeClass]" style="margin-left:auto;">
          {{ statusConfig[order.status]?.emoji }} {{ statusConfig[order.status]?.label }}
        </span>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TICKET STATUS ALERT BANNER (If ticket exists)              -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div
        v-if="latestTicket"
        class="ticket-alert-card"
        :class="latestTicket.status"
        style="margin-bottom:var(--space-6);"
      >
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-2); flex-wrap:wrap; gap:var(--space-2);">
          <div style="display:flex; align-items:center; gap:var(--space-2); font-weight:700;">
            <span>🚨 สถานะการแจ้งปัญหา:</span>
            <span :class="['badge', ticketStatusBadge[latestTicket.status]?.badgeClass]">
              {{ ticketStatusBadge[latestTicket.status]?.emoji }} {{ ticketStatusBadge[latestTicket.status]?.label }}
            </span>
          </div>
          <span style="font-size:0.75rem; color:var(--gray-400);">{{ formatDateTime(latestTicket.created_at) }}</span>
        </div>

        <div style="font-size:0.875rem; margin-bottom:var(--space-2);">
          <strong>หัวข้อ:</strong> {{ latestTicket.title }}
        </div>
        <div style="font-size:0.8125rem; color:var(--gray-300); margin-bottom:var(--space-3); line-height:1.5;">
          <strong>รายละเอียด:</strong> {{ latestTicket.description }}
        </div>

        <!-- Admin Response Note -->
        <div
          v-if="latestTicket.admin_note"
          style="padding:var(--space-3); background:rgba(0,0,0,0.3); border-radius:var(--radius-md); border-left:3px solid var(--accent-400); font-size:0.85rem;"
        >
          <div style="font-weight:700; color:var(--accent-300); margin-bottom:2px;">💬 ข้อความตอบกลับจาก Admin:</div>
          <div style="color:var(--white);">{{ latestTicket.admin_note }}</div>
          <div v-if="latestTicket.status === 'resolved'" style="margin-top:6px; font-size:0.75rem; color:#4ade80;">
            ✨ ข้อมูลบัญชีใหม่ได้รับการอัปเดตแล้ว คลิกปุ่ม "👁️ แสดง" ด้านล่างเพื่อดูรหัสผ่านใหม่
          </div>
        </div>
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
                <span style="color:var(--accent-400); font-weight:700; font-family:var(--font-en);">฿{{ order.amount?.toLocaleString() }}</span>
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
              <button
                class="btn btn-secondary btn-sm"
                @click="toggleCreds"
                :disabled="credsLoading"
                id="toggle-credentials-btn"
              >
                <span v-if="credsLoading">⏳ กำลังโหลด...</span>
                <span v-else-if="showCreds">🙈 ซ่อน</span>
                <span v-else>👁️ แสดง</span>
              </button>
            </div>

            <!-- Error state -->
            <div
              v-if="credsError"
              style="padding:var(--space-3); background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:var(--radius-md); font-size:0.875rem; color:#f87171;"
            >
              ⚠️ {{ credsError }}
            </div>

            <div v-else-if="showCreds && credentials" style="display:flex; flex-direction:column; gap:var(--space-3);">
              <div style="padding:var(--space-4); background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-md);">
                <div style="font-size:0.75rem; color:var(--gray-500); margin-bottom:var(--space-2);">EMAIL / USERNAME</div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3);">
                  <code style="color:#4ade80; font-size:0.9375rem; font-family:monospace;">{{ credentials.email }}</code>
                  <button class="btn btn-secondary btn-sm" @click="copyText(credentials.email)">📋</button>
                </div>
              </div>
              <div style="padding:var(--space-4); background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-md);">
                <div style="font-size:0.75rem; color:var(--gray-500); margin-bottom:var(--space-2);">PASSWORD</div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3);">
                  <code style="color:#4ade80; font-size:0.9375rem; font-family:monospace;">{{ credentials.password }}</code>
                  <button class="btn btn-secondary btn-sm" @click="copyText(credentials.password)">📋</button>
                </div>
              </div>
              <div style="padding:var(--space-3); background:rgba(234,179,8,0.08); border:1px solid rgba(234,179,8,0.2); border-radius:var(--radius-md); font-size:0.8125rem; color:#facc15;">
                ⚠️ หากพบปัญหาบัญชีหลุดหรือเข้าไม่ได้ กดปุ่ม "แจ้งปัญหาบัญชีนี้" ด้านล่างได้ตลอด 24 ชม.
              </div>
            </div>

            <div v-else style="text-align:center; padding:var(--space-6); color:var(--gray-500); font-size:0.875rem;">
              🔒 คลิก &quot;แสดง&quot; เพื่อดูข้อมูลบัญชี (โหลดแบบเข้ารหัสทุกครั้ง)
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
        <div style="display:flex; flex-direction:column; gap:var(--space-4);">
          <!-- Report Issue Action Box -->
          <div v-if="order.status === 'completed'" class="card-elevated" style="border-radius:var(--radius-lg); padding:var(--space-5); border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.03);">
            <h4 style="margin-bottom:var(--space-2); color:var(--white); display:flex; align-items:center; gap:var(--space-2);">
              🚨 พบปัญหาการใช้งาน?
            </h4>
            <p style="font-size:0.8rem; color:var(--gray-400); margin-bottom:var(--space-4); line-height:1.4;">
              รหัสผ่านไม่ถูกต้อง จอเต็ม หรือหมดอายุก่อนกำหนด แจ้งทีมงานเพื่อรับบัญชีทดแทนได้ทันที
            </p>
            <button
              class="btn w-full"
              style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.35); font-weight:600; width:100%;"
              @click="openReportModal"
              id="btn-report-issue"
            >
              🚨 แจ้งปัญหาบัญชีนี้
            </button>
          </div>

          <!-- Contact Support -->
          <div class="card-elevated" style="border-radius:var(--radius-lg); padding:var(--space-5);">
            <h4 style="margin-bottom:var(--space-4);">ช่องทางช่วยเหลืออื่นๆ</h4>
            <div style="display:flex; flex-direction:column; gap:var(--space-3);">
              <button class="btn btn-secondary w-full" style="justify-content:flex-start; gap:var(--space-3);">💬 ติดต่อ Admin Line</button>
              <button class="btn btn-secondary w-full" style="justify-content:flex-start; gap:var(--space-3);">📧 อีเมล Support</button>
            </div>
            <div class="divider"></div>
            <RouterLink to="/orders" class="btn btn-outline w-full" style="width:100%;">📦 คำสั่งซื้อทั้งหมด</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="page-content empty-state">
      <div class="empty-state-icon">😢</div>
      <h3>ไม่พบคำสั่งซื้อ</h3>
      <button class="btn btn-secondary" @click="router.push('/orders')">← กลับ</button>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- REPORT ISSUE MODAL                                         -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showReportModal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:var(--space-4);"
        @click.self="showReportModal = false"
      >
        <div style="background:var(--bg-card);border:1px solid var(--glass-border);border-radius:var(--radius-xl);padding:var(--space-8);width:100%;max-width:520px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
            <h3 style="display:flex; align-items:center; gap:var(--space-2);">
              🚨 แจ้งปัญหาบัญชี
            </h3>
            <button class="btn btn-secondary btn-icon" @click="showReportModal = false">✕</button>
          </div>

          <p style="color:var(--gray-400); font-size:0.875rem; margin-bottom:var(--space-5);">
            คำสั่งซื้อ: <code style="color:var(--accent-400); font-family:monospace;">{{ order?.id }}</code> ({{ order?.product_name }})
          </p>

          <form @submit.prevent="submitReport" style="display:flex; flex-direction:column; gap:var(--space-4);">
            <div>
              <label class="form-label" style="font-size:0.875rem; color:var(--gray-300); display:block; margin-bottom:var(--space-2); font-weight:600;">
                เลือกประเภทปัญหา <span style="color:var(--danger);">*</span>
              </label>
              <div style="display:flex; flex-direction:column; gap:var(--space-2);">
                <label
                  v-for="(cat, key) in TICKET_CATEGORIES"
                  :key="key"
                  class="issue-radio-label"
                  :class="{ active: reportCategory === key }"
                >
                  <input
                    type="radio"
                    v-model="reportCategory"
                    :value="key"
                    style="accent-color:var(--accent-500);"
                  />
                  <span>{{ cat.emoji }} {{ cat.label }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="form-label" style="font-size:0.875rem; color:var(--gray-300); display:block; margin-bottom:var(--space-2); font-weight:600;">
                อธิบายรายละเอียดเพิ่มเติม <span style="color:var(--danger);">*</span>
              </label>
              <textarea
                v-model="reportDescription"
                class="input"
                rows="4"
                placeholder="เช่น เข้าสู่ระบบแล้วขึ้นรหัสผ่านไม่ถูกต้อง หรือ หน้าจอขึ้นแจ้งเตือนว่ามีคนดูเกินจำนวน..."
                required
                style="width:100%; resize:vertical; line-height:1.5;"
                id="ticket-desc-input"
              ></textarea>
            </div>

            <div style="padding:var(--space-3); background:rgba(249,115,22,0.06); border:1px solid rgba(249,115,22,0.2); border-radius:var(--radius-md); font-size:0.75rem; color:var(--gray-400);">
              ⚡ แอดมินจะดำเนินการตรวจสอบข้อมูลและส่งมอบรหัสผ่านใหม่ให้ผ่านหน้านี้ทันที
            </div>

            <div style="display:flex; gap:var(--space-3); margin-top:var(--space-2);">
              <button
                type="button"
                class="btn btn-secondary"
                style="flex:1;"
                @click="showReportModal = false"
                :disabled="reportLoading"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                style="flex:2;"
                :disabled="reportLoading"
                id="btn-submit-ticket"
              >
                <span v-if="reportLoading">⏳ กำลังส่งเรื่อง...</span>
                <span v-else>🚀 ยืนยันส่งเรื่องแจ้งปัญหา</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </DashboardLayout>
</template>

<style scoped>
.ticket-alert-card {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.ticket-alert-card.pending {
  background: rgba(234, 179, 8, 0.08);
  border-color: rgba(234, 179, 8, 0.3);
}

.ticket-alert-card.in_progress {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
}

.ticket-alert-card.resolved {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.3);
}

.ticket-alert-card.rejected {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
}

.issue-radio-label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--gray-300);
  cursor: pointer;
  transition: all 0.2s ease;
}

.issue-radio-label:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(249, 115, 22, 0.3);
}

.issue-radio-label.active {
  background: rgba(249, 115, 22, 0.1);
  border-color: var(--accent-400);
  color: var(--white);
  font-weight: 600;
}

@media (max-width: 768px) {
  div[style*="grid-template-columns:1fr 360px"] { grid-template-columns: 1fr !important; }
}
</style>
