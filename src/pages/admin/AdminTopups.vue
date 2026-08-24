<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { usePaymentStore } from '../../stores/payment'
import { useToastStore } from '../../stores/toast'
import { formatDateTime, formatCurrency } from '../../data/mockData'
import { getSlipUrl } from '../../services/storage'

const payment = usePaymentStore()
const toast = useToastStore()

onMounted(() => {
  payment.fetchTopups()
})

const filterStatus = ref('all')
const showSlipModal = ref(false)
const selectedSlip = ref(null)
const showSettingsModal = ref(false)

// Settings form
const settingsForm = ref({ ...payment.settings })

const allLogs = computed(() => payment.topupLogs)

const filteredLogs = computed(() => {
  if (filterStatus.value === 'all') return allLogs.value
  return allLogs.value.filter(l => l.status === filterStatus.value)
})

const stats = computed(() => {
  const approved = allLogs.value.filter(l => l.status === 'approved')
  const totalVolume = approved.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
  const pending = allLogs.value.filter(l => l.status === 'pending')
  const autoApproved = approved.filter(l => l.isAutoApproved)

  return [
    { label: 'ยอดเติมเงินรวม', value: formatCurrency(totalVolume), emoji: '💰', color: 'stat-icon-accent' },
    { label: 'รายการสำเร็จทั้งหมด', value: approved.length, emoji: '✅', color: 'stat-icon-success' },
    { label: 'อนุมัติอัตโนมัติ (Auto)', value: autoApproved.length, emoji: '⚡', color: 'stat-icon-primary' },
    { label: 'รอดำเนินการ (Manual)', value: pending.length, emoji: '⏳', color: 'stat-icon-warning' },
  ]
})

async function viewSlip(slipUrl) {
  if (!slipUrl) {
    toast.error('ไม่พบรูปภาพสลิป')
    return
  }
  selectedSlip.value = await getSlipUrl(slipUrl)
  showSlipModal.value = true
}

function openSettings() {
  settingsForm.value = { ...payment.settings }
  showSettingsModal.value = true
}

function saveSettings() {
  payment.saveSettings(settingsForm.value)
  showSettingsModal.value = false
  toast.success('บันทึกการตั้งค่าระบบเติมเงินสำเร็จ')
}

function handleApprove(id) {
  payment.manualApprove(id)
  toast.success('อนุมัติรายการเติมเงินสำเร็จ')
}

function handleReject(id) {
  payment.manualReject(id)
  toast.success('ปฏิเสธรายการเติมเงินแล้ว')
}

const statusBadge = {
  approved: 'badge-success',
  pending: 'badge-warning',
  rejected: 'badge-danger'
}

const statusLabel = {
  approved: 'อนุมัติแล้ว',
  pending: 'รอดำเนินการ',
  rejected: 'ปฏิเสธ'
}
</script>

<template>
  <AdminLayout>
    <div class="page-content animate-fade-in">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-8); flex-wrap:wrap; gap:var(--space-4);">
        <div>
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">จัดการระบบเติมเงิน (PromptPay & Slips)</h1>
          <p style="color:var(--gray-400);">ตรวจสอบรายการเติมเงิน สลิปโอนเงิน และตั้งค่าระบบ Auto-Verify</p>
        </div>
        <button class="btn btn-primary" @click="openSettings" id="btn-payment-settings">
          ⚙️ ตั้งค่า PromptPay & SlipOK
        </button>
      </div>

      <!-- Stats Grid -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-bottom:var(--space-8);">
        <div v-for="s in stats" :key="s.label" class="stat-card">
          <div :class="['stat-icon', s.color]">{{ s.emoji }}</div>
          <div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Current PromptPay Banner -->
      <div class="card" style="margin-bottom:var(--space-6); background:linear-gradient(135deg, rgba(11,45,95,0.4), rgba(5,13,26,0.8)); border-color:rgba(249,115,22,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-4);">
          <div style="display:flex; align-items:center; gap:var(--space-4);">
            <div style="font-size:2rem;">📱</div>
            <div>
              <div style="font-size:0.8rem; color:var(--gray-400);">พร้อมเพย์ที่ใช้งานอยู่</div>
              <div style="font-size:1.2rem; font-weight:800; color:var(--white);">
                {{ payment.settings.promptPayName }}
                <span style="color:var(--accent-400); margin-left:var(--space-2); font-family:monospace;">({{ payment.settings.promptPayId }})</span>
              </div>
            </div>
          </div>
          <div style="display:flex; gap:var(--space-3); align-items:center;">
            <span :class="['badge', payment.settings.isAutoVerify ? 'badge-success' : 'badge-warning']">
              {{ payment.settings.isAutoVerify ? '⚡ Auto-Verify เปิดอยู่' : '✋ ตรวจสอบแบบ Manual' }}
            </span>
            <span v-if="payment.settings.isDemoMode" class="badge badge-accent">
              🧪 Simulator Mode (ทดสอบ)
            </span>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="tabs">
        <button
          v-for="s in ['all', 'approved', 'pending', 'rejected']"
          :key="s"
          :class="['tab', { active: filterStatus === s }]"
          @click="filterStatus = s"
        >
          {{ s === 'all' ? 'ทั้งหมด' : statusLabel[s] }}
          <span style="opacity:0.7; font-size:0.8rem; margin-left:4px;">
            ({{ s === 'all' ? allLogs.length : allLogs.filter(l => l.status === s).length }})
          </span>
        </button>
      </div>

      <!-- Transaction Logs Table -->
      <div class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-5);">
        <div v-if="filteredLogs.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ผู้ใช้</th>
                <th>จำนวนเงิน</th>
                <th>ข้อมูลผู้โอน (สลิป)</th>
                <th>TransRef</th>
                <th>สลิป</th>
                <th>เวลา</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in filteredLogs" :key="log.id">
                <td style="font-size:0.8125rem; font-family:monospace; color:var(--gray-400);">{{ log.id }}</td>
                <td style="color:var(--white); font-weight:600;">{{ log.username }}</td>
                <td>
                  <span style="color:var(--success); font-weight:800; font-family:var(--font-en); font-size:1.05rem;">
                    +{{ formatCurrency(log.amount) }}
                  </span>
                </td>
                <td>
                  <div v-if="log.sender" style="font-size:0.85rem;">
                    <span style="color:var(--white); font-weight:500;">{{ log.sender.bankIcon || '🏦' }} {{ log.sender.name }}</span>
                    <div style="font-size:0.75rem; color:var(--gray-500);">{{ log.sender.bank }} {{ log.sender.account }}</div>
                  </div>
                  <span v-else style="color:var(--gray-600); font-size:0.8rem;">—</span>
                </td>
                <td>
                  <span v-if="log.transRef" style="font-family:monospace; font-size:0.8rem; color:var(--gray-400);">
                    {{ log.transRef }}
                  </span>
                  <span v-else style="color:var(--gray-600);">—</span>
                </td>
                <td>
                  <button v-if="log.slipUrl" class="btn btn-secondary btn-sm" @click="viewSlip(log.slipUrl)">
                    🖼️ ดูสลิป
                  </button>
                  <span v-else style="color:var(--gray-600); font-size:0.8rem;">ไม่มีรูป</span>
                </td>
                <td style="font-size:0.8125rem; color:var(--gray-500);">
                  {{ formatDateTime(log.createdAt || log.date) }}
                </td>
                <td>
                  <div style="display:flex; flex-direction:column; gap:2px;">
                    <span :class="['badge', statusBadge[log.status]]">
                      {{ statusLabel[log.status] }}
                    </span>
                    <span v-if="log.isAutoApproved" style="font-size:0.65rem; color:#4ade80;">⚡ ตรวจสอบ Auto</span>
                  </div>
                </td>
                <td>
                  <div v-if="log.status === 'pending'" style="display:flex; gap:var(--space-2);">
                    <button class="btn btn-sm" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3);" @click="handleApprove(log.id)">
                      ✅ อนุมัติ
                    </button>
                    <button class="btn btn-sm" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);" @click="handleReject(log.id)">
                      ❌ ปฏิเสธ
                    </button>
                  </div>
                  <span v-else style="color:var(--gray-600); font-size:0.8rem;">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon">💳</div>
          <h4>ยังไม่มีรายการเติมเงินในหมวดหมู่นี้</h4>
          <p style="color:var(--gray-500); font-size:0.875rem;">เมื่อมีผู้ใช้ทำรายการเติมเงิน รายการจะแสดงที่นี่แบบ Realtime</p>
        </div>
      </div>

      <!-- Settings Modal -->
      <div v-if="showSettingsModal" class="modal-overlay" @click.self="showSettingsModal = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3>⚙️ ตั้งค่าระบบชำระเงิน & Auto Verify</h3>
            <button class="btn btn-secondary btn-icon" @click="showSettingsModal = false">✕</button>
          </div>

          <form @submit.prevent="saveSettings" style="display:flex; flex-direction:column; gap:var(--space-4);">
            <!-- PromptPay Settings -->
            <div style="background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-lg); padding:var(--space-4);">
              <h4 style="margin-bottom:var(--space-3); color:var(--accent-400);">📱 ข้อมูลบัญชี PromptPay ร้านค้า</h4>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);">
                <div class="form-group">
                  <label class="form-label">เบอร์โทร / เลขบัตรประชาชน</label>
                  <input v-model="settingsForm.promptPayId" class="form-input" placeholder="0812345678" required />
                </div>
                <div class="form-group">
                  <label class="form-label">ชื่อบัญชีผู้รับ (แสดงใน QR & ตรวจสลิป)</label>
                  <input v-model="settingsForm.promptPayName" class="form-input" placeholder="ร้าน ApexStore" required />
                </div>
              </div>
            </div>

            <!-- Auto Verify & API Settings -->
            <div style="background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-lg); padding:var(--space-4);">
              <h4 style="margin-bottom:var(--space-3); color:var(--accent-400);">⚡ การเชื่อมต่อ Slip Verification API</h4>

              <div class="form-group" style="margin-bottom:var(--space-3);">
                <label class="form-label">SlipOK API Key (หากมี)</label>
                <input v-model="settingsForm.slipokApiKey" class="form-input" placeholder="เช่น apikey_slipok_xxxxxxxxxxxx" />
                <span style="font-size:0.75rem; color:var(--gray-500);">สมัครรับ API Key ได้ที่ slipok.com (หากเว้นว่าง ระบบจะใช้ Smart Bank Simulator)</span>
              </div>

              <div style="display:flex; flex-direction:column; gap:var(--space-2); margin-top:var(--space-3);">
                <label style="display:flex; align-items:center; gap:var(--space-3); cursor:pointer;">
                  <input type="checkbox" v-model="settingsForm.isAutoVerify" style="accent-color:var(--accent-400);" />
                  <span style="font-size:0.9rem; color:var(--white); font-weight:500;">
                    เปิดใช้งานระบบตรวจสอบสลิปและเติมเงินอัตโนมัติ (Auto-Approve)
                  </span>
                </label>
                <label style="display:flex; align-items:center; gap:var(--space-3); cursor:pointer;">
                  <input type="checkbox" v-model="settingsForm.isDemoMode" style="accent-color:var(--accent-400);" />
                  <span style="font-size:0.9rem; color:var(--white); font-weight:500;">
                    โหมดจำลองการตรวจสลิป (High-Fidelity Simulator Mode)
                  </span>
                </label>
              </div>
            </div>

            <!-- Min/Max Amount -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3);">
              <div class="form-group">
                <label class="form-label">ยอดเติมเงินขั้นต่ำ (฿)</label>
                <input v-model.number="settingsForm.minTopupAmount" type="number" class="form-input" min="1" />
              </div>
              <div class="form-group">
                <label class="form-label">ยอดเติมเงินสูงสุด (฿)</label>
                <input v-model.number="settingsForm.maxTopupAmount" type="number" class="form-input" min="1" />
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:var(--space-3); margin-top:var(--space-4);">
              <button type="button" class="btn btn-secondary" @click="showSettingsModal = false">ยกเลิก</button>
              <button type="submit" class="btn btn-primary" id="btn-save-payment-settings">💾 บันทึกการตั้งค่า</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Slip Image Modal -->
      <div v-if="showSlipModal" class="modal-overlay" @click.self="showSlipModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>🖼️ รูปภาพสลิปโอนเงิน</h3>
            <button class="btn btn-secondary btn-icon" @click="showSlipModal = false">✕</button>
          </div>
          <div style="text-align:center; padding:var(--space-2);">
            <img :src="selectedSlip" alt="slip" style="max-height:480px; width:auto; max-width:100%; border-radius:var(--radius-md); border:1px solid var(--glass-border);" />
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
@media (max-width: 1024px) {
  div[style*="repeat(4,1fr)"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
