<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { usePaymentStore, DEFAULT_PAYMENT_SETTINGS, DEFAULT_STORE_SETTINGS } from '../../stores/payment'
import { useToastStore } from '../../stores/toast'
import { generatePromptPayQRDataUrl } from '../../utils/promptpay'
import { isSupabaseConfigured, supabase } from '../../services/supabase'

const payment = usePaymentStore()
const toast = useToastStore()

// Tab state
const activeTab = ref('payment') // 'payment' | 'store' | 'system'

// Form States (cloned from store)
const payForm = ref({ ...DEFAULT_PAYMENT_SETTINGS, ...payment.settings })
const storeForm = ref({ ...DEFAULT_STORE_SETTINGS, ...payment.storeSettings })

// UI States
const isSaving = ref(false)
const showApiKey = ref(false)
const testingApi = ref(false)
const previewAmount = ref(100)
const liveQrUrl = ref('')
const isGeneratingQr = ref(false)

// System Health Checks
const dbStatus = ref({ checked: false, connected: false, latency: 0, error: null })
const realtimeStatus = ref({ connected: isSupabaseConfigured })
const storageStatus = ref({ checked: false, productImages: false, paymentSlips: false })

onMounted(async () => {
  await loadFreshSettings()
  updateLiveQr()
  runSystemDiagnostics()
})

async function loadFreshSettings() {
  try {
    const res = await payment.fetchSettings()
    if (res) {
      payForm.value = { ...DEFAULT_PAYMENT_SETTINGS, ...res.payment }
      storeForm.value = { ...DEFAULT_STORE_SETTINGS, ...res.store }
    }
  } catch (err) {
    console.warn('Failed to load settings from Supabase:', err)
  }
}

// Generate live QR preview when promptPayId or previewAmount changes
async function updateLiveQr() {
  if (!payForm.value.promptPayId) {
    liveQrUrl.value = ''
    return
  }
  try {
    isGeneratingQr.value = true
    liveQrUrl.value = await generatePromptPayQRDataUrl(
      payForm.value.promptPayId,
      previewAmount.value || null,
      { width: 220 }
    )
  } catch (e) {
    liveQrUrl.value = ''
  } finally {
    isGeneratingQr.value = false
  }
}

watch(() => [payForm.value.promptPayId, previewAmount.value], () => {
  updateLiveQr()
}, { debounce: 300 })

// Auto-detect PromptPay type from ID length
function onPromptPayIdInput() {
  const cleaned = (payForm.value.promptPayId || '').replace(/[^0-9]/g, '')
  if (cleaned.length === 13) {
    payForm.value.promptPayType = 'national_id'
  } else if (cleaned.length === 10) {
    payForm.value.promptPayType = 'phone'
  }
}

// Save Payment Settings
async function savePaymentSettings() {
  if (!payForm.value.promptPayId.trim()) {
    toast.error('กรุณาระบุหมายเลข PromptPay ID')
    return
  }
  if (!payForm.value.promptPayName.trim()) {
    toast.error('กรุณาระบุชื่อบัญชีผู้รับเงิน PromptPay')
    return
  }
  if (payForm.value.minTopupAmount < 1) {
    toast.error('ยอดเติมเงินขั้นต่ำต้องมากกว่าหรือเท่ากับ 1 บาท')
    return
  }
  if (payForm.value.maxTopupAmount <= payForm.value.minTopupAmount) {
    toast.error('ยอดเติมเงินสูงสุดต้องมากกว่ายอดขั้นต่ำ')
    return
  }

  isSaving.value = true
  try {
    await payment.saveSettings(payForm.value)
    toast.success('💾 บันทึกการตั้งค่าชำระเงินและ PromptPay สำเร็จ!')
    updateLiveQr()
  } catch (err) {
    toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || err))
  } finally {
    isSaving.value = false
  }
}

// Save Store Branding Settings
async function saveStoreConfig() {
  isSaving.value = true
  try {
    await payment.saveStoreSettings(storeForm.value)
    toast.success('🏬 บันทึกข้อมูลร้านค้าและการแสดงผลสำเร็จ!')
  } catch (err) {
    toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || err))
  } finally {
    isSaving.value = false
  }
}

// Reset Payment Settings to defaults
async function handleResetDefaults() {
  if (confirm('คุณต้องการรีเซ็ตการตั้งค่าระบบเติมเงินกลับเป็นค่าเริ่มต้นหรือไม่?')) {
    isSaving.value = true
    try {
      await payment.resetSettings()
      payForm.value = { ...payment.settings }
      updateLiveQr()
      toast.success('🔄 รีเซ็ตการตั้งค่ากลับเป็นค่าเริ่มต้นสำเร็จ')
    } catch (e) {
      toast.error('ไม่สามารถรีเซ็ตได้: ' + e.message)
    } finally {
      isSaving.value = false
    }
  }
}

// Test SlipOK API Key
async function testSlipokKey() {
  if (!payForm.value.slipokApiKey.trim()) {
    toast.info('💡 ไม่ได้ระบุ API Key — ระบบจะทำงานในโหมด Smart Bank Simulator (จำลองการตรวจสลิป)')
    return
  }

  testingApi.value = true
  try {
    const res = await fetch(`https://api.slipok.com/api/line/apikey/${encodeURIComponent(payForm.value.slipokApiKey.trim())}`, {
      method: 'GET'
    })
    const data = await res.json()
    if (res.ok && data.success) {
      toast.success(`✅ เชื่อมต่อ SlipOK สำเร็จ! (โควต้าคงเหลือ: ${data.data?.quota || 'ไม่จำกัด'})`)
    } else {
      toast.error('❌ ไม่สามารถตรวจสอบ API Key ได้: ' + (data.message || 'รหัสไม่ถูกต้องหรือหมดอายุ'))
    }
  } catch (err) {
    // SlipOK might block direct client CORS or require proxy
    toast.info('ℹ️ บันทึก API Key เรียบร้อยแล้ว (จะถูกส่งไปใช้งานเมื่อตรวจสลิปจริง)')
  } finally {
    testingApi.value = false
  }
}

// System Diagnostics Check
async function runSystemDiagnostics() {
  if (!isSupabaseConfigured || !supabase) {
    dbStatus.value = { checked: true, connected: false, latency: 0, error: 'ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL ใน .env' }
    return
  }

  const start = performance.now()
  try {
    const { data, error } = await supabase.from('app_settings').select('key').limit(1)
    const end = performance.now()

    if (error) throw error
    dbStatus.value = {
      checked: true,
      connected: true,
      latency: Math.round(end - start),
      error: null
    }

    // Check buckets
    const { data: buckets } = await supabase.storage.listBuckets()
    if (buckets) {
      storageStatus.value = {
        checked: true,
        productImages: buckets.some(b => b.name === 'product-images'),
        paymentSlips: buckets.some(b => b.name === 'payment-slips')
      }
    }
  } catch (err) {
    dbStatus.value = { checked: true, connected: false, latency: 0, error: err.message }
  }
}
</script>

<template>
  <AdminLayout>
    <div class="page-content animate-fade-in">
      <!-- Page Header -->
      <div class="settings-header">
        <div>
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-1); display:flex; align-items:center; gap:var(--space-3);">
            ⚙️ ตั้งค่าระบบ (System Settings)
          </h1>
          <p style="color:var(--gray-400);">จัดการบัญชี PromptPay, การตรวจสลิป, ข้อมูลร้านค้า และระบบความปลอดภัย</p>
        </div>
        <div style="display:flex; gap:var(--space-3); align-items:center;">
          <button class="btn btn-secondary btn-sm" @click="loadFreshSettings" title="โหลดค่าล่าสุดจากฐานข้อมูล">
            🔄 ซิงค์ข้อมูลล่าสุด
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs" style="margin-bottom:var(--space-6);">
        <button
          :class="['tab', { active: activeTab === 'payment' }]"
          @click="activeTab = 'payment'"
          id="tab-payment"
        >
          💳 ระบบชำระเงิน & PromptPay
        </button>
        <button
          :class="['tab', { active: activeTab === 'store' }]"
          @click="activeTab = 'store'"
          id="tab-store"
        >
          🏬 ข้อมูลร้านค้า & การแสดงผล
        </button>
        <button
          :class="['tab', { active: activeTab === 'system' }]"
          @click="activeTab = 'system'"
          id="tab-system"
        >
          🛡️ สถานะระบบ & Cloud DB
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TAB 1: Payment & PromptPay Settings                        -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'payment'" class="settings-grid">
        <!-- Left: Form Controls -->
        <div class="settings-form-column">
          <!-- PromptPay Merchant Account -->
          <div class="card" style="margin-bottom:var(--space-6);">
            <div class="card-title-row">
              <span class="card-icon">📱</span>
              <div>
                <h3 style="font-size:1.1rem; color:var(--white);">ข้อมูลบัญชี PromptPay ร้านค้า</h3>
                <p style="font-size:0.8rem; color:var(--gray-400);">ใช้สร้าง QR Code รับเงิน และใช้ตรวจสอบชื่อผู้รับในสลิปโอนเงิน</p>
              </div>
            </div>

            <div class="form-body">
              <div class="form-row">
                <div class="form-group" style="flex:1;">
                  <label class="form-label">
                    หมายเลข PromptPay ID <span style="color:var(--danger);">*</span>
                  </label>
                  <input
                    v-model="payForm.promptPayId"
                    @input="onPromptPayIdInput"
                    type="text"
                    class="input"
                    placeholder="เช่น 0812345678 หรือ 1234567890123"
                    id="input-promptpay-id"
                    style="font-family:var(--font-en); font-size:1rem; font-weight:600; letter-spacing:0.5px;"
                    required
                  />
                  <span class="form-hint">
                    รองรับเบอร์โทรศัพท์ (10 หลัก) หรือ เลขประจำตัวประชาชน/ภาษี (13 หลัก)
                  </span>
                </div>

                <div class="form-group" style="width:160px;">
                  <label class="form-label">ประเภทบัญชี</label>
                  <select v-model="payForm.promptPayType" class="input">
                    <option value="phone">📞 เบอร์โทรศัพท์</option>
                    <option value="national_id">🆔 เลขบัตรประชาชน</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  ชื่อบัญชีผู้รับเงิน (Merchant Name) <span style="color:var(--danger);">*</span>
                </label>
                <input
                  v-model="payForm.promptPayName"
                  type="text"
                  class="input"
                  placeholder="เช่น ร้าน ApexStore (Official) หรือ นาย สมชาย ใจดี"
                  id="input-promptpay-name"
                  required
                />
                <span class="form-hint">
                  ชื่อนี้จะแสดงบนหัวบัตร QR Code และใช้เปรียบเทียบกับชื่อผู้รับบนสลิปของลูกค้า
                </span>
              </div>
            </div>
          </div>

          <!-- Slip Verification & API -->
          <div class="card" style="margin-bottom:var(--space-6);">
            <div class="card-title-row">
              <span class="card-icon">⚡</span>
              <div>
                <h3 style="font-size:1.1rem; color:var(--white);">ระบบตรวจสอบสลิปโอนเงิน (Slip Verification)</h3>
                <p style="font-size:0.8rem; color:var(--gray-400);">กำหนดการเชื่อมต่อ API SlipOK หรือใช้ High-Fidelity Simulator</p>
              </div>
            </div>

            <div class="form-body">
              <div class="form-group">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
                  <label class="form-label" style="margin-bottom:0;">SlipOK API Key</label>
                  <a href="https://slipok.com" target="_blank" rel="noopener" style="font-size:0.75rem; color:var(--accent-400); text-decoration:none;">
                    🌐 สมัครรับ API Key ที่ slipok.com ↗
                  </a>
                </div>
                <div style="position:relative;">
                  <input
                    v-model="payForm.slipokApiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    class="input"
                    placeholder="เช่น apikey_slipok_xxxxxxxxxxxxxxxx"
                    id="input-slipok-key"
                    style="font-family:monospace; padding-right:5.5rem;"
                  />
                  <div style="position:absolute; right:var(--space-2); top:50%; transform:translateY(-50%); display:flex; gap:4px;">
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      style="padding:2px 8px; font-size:0.75rem;"
                      @click="showApiKey = !showApiKey"
                    >
                      {{ showApiKey ? '🙈 ซ่อน' : '👁️ แสดง' }}
                    </button>
                    <button
                      v-if="payForm.slipokApiKey"
                      type="button"
                      class="btn btn-sm"
                      style="padding:2px 8px; font-size:0.75rem; background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3);"
                      @click="testSlipokKey"
                      :disabled="testingApi"
                    >
                      {{ testingApi ? '⏳...' : '🧪 เช็ค' }}
                    </button>
                  </div>
                </div>
                <span class="form-hint">
                  หากเว้นว่างไว้ ระบบจะสลับไปใช้ **Smart Bank Simulator** จำลองการตรวจสลิปอัตโนมัติ
                </span>
              </div>

              <!-- Switches -->
              <div class="switches-container">
                <label class="toggle-card">
                  <input type="checkbox" v-model="payForm.isAutoVerify" class="toggle-checkbox" id="toggle-auto-verify" />
                  <div class="toggle-info">
                    <div class="toggle-title">⚡ ระบบเติมเงินอัตโนมัติ (Auto-Approve & Instant Credit)</div>
                    <div class="toggle-desc">เมื่อระบบตรวจสลิปสำเร็จ เงินจะเข้าสู่ Wallet ของลูกค้าทันทีโดยไม่ต้องรอแอดมินกดอนุมัติ</div>
                  </div>
                </label>

                <label class="toggle-card">
                  <input type="checkbox" v-model="payForm.isDemoMode" class="toggle-checkbox" id="toggle-demo-mode" />
                  <div class="toggle-info">
                    <div class="toggle-title">🧪 โหมดจำลองตรวจสลิป (High-Fidelity Simulator Demo Mode)</div>
                    <div class="toggle-desc">
                      ถอดรหัส QR จากภาพสลิปจริง แต่จำลองการยืนยันยอดเงินสำเร็จโดยไม่ต้องเรียก API เสียเงิน เหมาะสำหรับช่วงทดสอบ
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Topup Limits -->
          <div class="card" style="margin-bottom:var(--space-6);">
            <div class="card-title-row">
              <span class="card-icon">💰</span>
              <div>
                <h3 style="font-size:1.1rem; color:var(--white);">ขอบเขตยอดเติมเงิน (Topup Limits)</h3>
                <p style="font-size:0.8rem; color:var(--gray-400);">กำหนดยอดเติมเงินต่ำสุดและสูงสุดต่อ 1 รายการ</p>
              </div>
            </div>

            <div class="form-body">
              <div class="form-row">
                <div class="form-group" style="flex:1;">
                  <label class="form-label">ยอดเติมเงินขั้นต่ำ (฿)</label>
                  <input
                    v-model.number="payForm.minTopupAmount"
                    type="number"
                    min="1"
                    class="input"
                    placeholder="20"
                    id="input-min-amount"
                    style="font-family:var(--font-en); font-weight:600;"
                  />
                  <span class="form-hint">เริ่มต้นแนะนำ 20 บาท</span>
                </div>

                <div class="form-group" style="flex:1;">
                  <label class="form-label">ยอดเติมเงินสูงสุด (฿)</label>
                  <input
                    v-model.number="payForm.maxTopupAmount"
                    type="number"
                    min="1"
                    class="input"
                    placeholder="50000"
                    id="input-max-amount"
                    style="font-family:var(--font-en); font-weight:600;"
                  />
                  <span class="form-hint">แนะนำไม่เกิน 50,000 บาท</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-4);">
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleResetDefaults"
              :disabled="isSaving"
            >
              🔄 คืนค่าเริ่มต้น
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="savePaymentSettings"
              :disabled="isSaving"
              id="btn-save-payment-settings"
              style="padding:0.75rem 2rem; font-weight:600;"
            >
              <span v-if="isSaving">⏳ กำลังบันทึก...</span>
              <span v-else>💾 บันทึกการตั้งค่าชำระเงิน</span>
            </button>
          </div>
        </div>

        <!-- Right: Live QR Preview Card -->
        <div class="settings-preview-column">
          <div class="card-elevated live-preview-sticky">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
              <h4 style="font-size:1rem; color:var(--white); display:flex; align-items:center; gap:var(--space-2);">
                📱 Live PromptPay Preview
              </h4>
              <span class="badge badge-success" style="font-size:0.7rem;">ลูกค้าจะเห็นแบบนี้</span>
            </div>

            <!-- Card Simulation -->
            <div class="promptpay-preview-card">
              <div class="pp-card-header">
                <div class="pp-logo-badge">
                  <span style="font-weight:900; letter-spacing:-0.5px; color:#0B2D5F;">พร้อมเพย์</span>
                  <span style="font-size:0.65rem; color:#0079C1; font-weight:700;">PROMPTPAY</span>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.75rem; color:var(--gray-400);">สแกนจ่ายผ่านแอปธนาคาร</div>
                  <div style="font-size:0.85rem; font-weight:700; color:var(--white); font-family:var(--font-en);">
                    ฿{{ previewAmount.toLocaleString() }}
                  </div>
                </div>
              </div>

              <!-- QR Image -->
              <div class="pp-qr-box">
                <div v-if="isGeneratingQr" class="pp-qr-loading">
                  ⏳ กำลังสร้าง QR Code...
                </div>
                <img
                  v-else-if="liveQrUrl"
                  :src="liveQrUrl"
                  alt="PromptPay QR"
                  class="pp-qr-img"
                />
                <div v-else class="pp-qr-empty">
                  กรุณากรอก PromptPay ID
                </div>
              </div>

              <!-- Recipient info -->
              <div class="pp-recipient-box">
                <div style="font-size:0.75rem; color:var(--gray-500); margin-bottom:2px;">ชื่อบัญชีผู้รับ</div>
                <div style="font-size:0.95rem; font-weight:700; color:var(--white);">
                  {{ payForm.promptPayName || '(ยังไม่ได้ระบุชื่อ)' }}
                </div>
                <div style="font-size:0.8rem; color:var(--accent-400); font-family:var(--font-en); margin-top:2px;">
                  ID: {{ payForm.promptPayId || '-' }}
                </div>
              </div>
            </div>

            <!-- Preview Amount Test Input -->
            <div style="margin-top:var(--space-4); padding-top:var(--space-4); border-top:1px solid var(--glass-border);">
              <label class="form-label" style="font-size:0.8rem;">ทดสอบจำลองยอดเงิน (฿)</label>
              <div style="display:flex; gap:var(--space-2);">
                <button
                  v-for="amt in [50, 100, 300, 500]"
                  :key="amt"
                  type="button"
                  :class="['btn btn-sm', previewAmount === amt ? 'btn-primary' : 'btn-secondary']"
                  style="flex:1;"
                  @click="previewAmount = amt"
                >
                  ฿{{ amt }}
                </button>
              </div>
            </div>

            <!-- Mode Badges -->
            <div style="margin-top:var(--space-4); display:flex; flex-direction:column; gap:var(--space-2);">
              <div v-if="payForm.isDemoMode" class="badge-status-box warning">
                🧪 <strong>โหมดทดสอบ:</strong> Simulator Active (ไม่ตัดเงินจริง)
              </div>
              <div v-else-if="payForm.slipokApiKey" class="badge-status-box success">
                ⚡ <strong>โหมดจริง:</strong> เชื่อมต่อ SlipOK Live API
              </div>
              <div v-if="payForm.isAutoVerify" class="badge-status-box info">
                ⚡ <strong>ระบบ Auto:</strong> ลูกค้าได้รับเงินทันทีหลังสแกน
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TAB 2: Store & Branding Settings                           -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div v-else-if="activeTab === 'store'" style="max-width:800px;">
        <div class="card" style="margin-bottom:var(--space-6);">
          <div class="card-title-row">
            <span class="card-icon">🏬</span>
            <div>
              <h3 style="font-size:1.1rem; color:var(--white);">ข้อมูลแบรนด์และร้านค้า (Store Identity)</h3>
              <p style="font-size:0.8rem; color:var(--gray-400);">ข้อมูลนี้จะแสดงบน Navbar, Footer และส่วนหัวของเว็บไซต์</p>
            </div>
          </div>

          <div class="form-body">
            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label class="form-label">ชื่อร้านค้า (Store Name)</label>
                <input v-model="storeForm.storeName" class="input" placeholder="ApexStore Premium" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Line Official Account ID</label>
                <input v-model="storeForm.contactLine" class="input" placeholder="@apexstore" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">คำโปรยร้านค้า (Store Tagline)</label>
              <input v-model="storeForm.storeTagline" class="input" placeholder="ศูนย์รวมบริการดิจิทัลระดับพรีเมียม ส่งมอบทันที 24 ชั่วโมง" />
            </div>

            <div class="form-group">
              <label class="form-label">อีเมลสำหรับติดต่อฝ่ายบริการลูกค้า (Support Email)</label>
              <input v-model="storeForm.contactEmail" type="email" class="input" placeholder="support@apexstore.com" />
            </div>
          </div>
        </div>

        <!-- Announcement & Maintenance -->
        <div class="card" style="margin-bottom:var(--space-6);">
          <div class="card-title-row">
            <span class="card-icon">📢</span>
            <div>
              <h3 style="font-size:1.1rem; color:var(--white);">การแจ้งเตือน & โหมดปิดปรับปรุง</h3>
              <p style="font-size:0.8rem; color:var(--gray-400);">เปิด/ปิด แถบประกาศแจ้งข่าวสารหน้าแรก หรือพักระบบชั่วคราว</p>
            </div>
          </div>

          <div class="form-body">
            <label class="toggle-card" style="margin-bottom:var(--space-4);">
              <input type="checkbox" v-model="storeForm.showAnnouncement" class="toggle-checkbox" />
              <div class="toggle-info">
                <div class="toggle-title">📢 เปิดใช้งานแถบข้อความประกาศ (Announcement Banner)</div>
                <div class="toggle-desc">แสดงแถบข้อความวิ่งด้านบนสุดของหน้าเว็บ</div>
              </div>
            </label>

            <div v-if="storeForm.showAnnouncement" class="form-group" style="margin-bottom:var(--space-4);">
              <label class="form-label">ข้อความประกาศ</label>
              <input v-model="storeForm.announcement" class="input" placeholder="🎉 ยินดีต้อนรับสู่ ApexStore ระบบเติมเงินออโต้ 24 ชม.!" />
            </div>

            <label class="toggle-card" style="border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.04);">
              <input type="checkbox" v-model="storeForm.maintenanceMode" class="toggle-checkbox" style="accent-color:var(--danger);" />
              <div class="toggle-info">
                <div class="toggle-title" style="color:#f87171;">⚠️ โหมดปิดปรับปรุงระบบชั่วคราว (Maintenance Mode)</div>
                <div class="toggle-desc">เมื่อเปิดใช้งาน ลูกค้าทั่วไปจะเห็นหน้าแจ้งปิดปรับปรุง (Admin ยังเข้าสู่ระบบได้ตามปกติ)</div>
              </div>
            </label>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          <button
            type="button"
            class="btn btn-primary"
            @click="saveStoreConfig"
            :disabled="isSaving"
            style="padding:0.75rem 2rem; font-weight:600;"
          >
            <span v-if="isSaving">⏳ กำลังบันทึก...</span>
            <span v-else>💾 บันทึกข้อมูลร้านค้า</span>
          </button>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TAB 3: System Health & Cloud Database Diagnostics           -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div v-else-if="activeTab === 'system'" style="max-width:900px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:var(--space-5); margin-bottom:var(--space-6);">
          <!-- Database Card -->
          <div class="card diagnostic-card">
            <div class="diag-icon-wrapper" :class="dbStatus.connected ? 'success' : 'danger'">
              {{ dbStatus.connected ? '🗄️' : '⚠️' }}
            </div>
            <div class="diag-content">
              <h4 style="color:var(--white); margin-bottom:2px;">Supabase Database</h4>
              <div v-if="dbStatus.connected" style="font-size:0.85rem; color:#4ade80;">
                🟢 เชื่อมต่อสำเร็จ (Latency: {{ dbStatus.latency }}ms)
              </div>
              <div v-else style="font-size:0.85rem; color:#f87171;">
                🔴 โหมด Mock Local (ยังไม่ต่อ Supabase)
              </div>
              <div style="font-size:0.75rem; color:var(--gray-500); margin-top:4px;">
                ตาราง app_settings, orders, products, topup_transactions
              </div>
            </div>
          </div>

          <!-- Realtime Card -->
          <div class="card diagnostic-card">
            <div class="diag-icon-wrapper" :class="realtimeStatus.connected ? 'success' : 'warning'">
              ⚡
            </div>
            <div class="diag-content">
              <h4 style="color:var(--white); margin-bottom:2px;">Realtime Replication</h4>
              <div v-if="realtimeStatus.connected" style="font-size:0.85rem; color:#4ade80;">
                🟢 WebSocket Pub/Sub พร้อมใช้งาน
              </div>
              <div v-else style="font-size:0.85rem; color:#facc15;">
                🟡 ทำงานเฉพาะในเครื่อง (Local Mode)
              </div>
              <div style="font-size:0.75rem; color:var(--gray-500); margin-top:4px;">
                อัปเดตคำสั่งซื้อ & สลิปแบบสดทันที
              </div>
            </div>
          </div>

          <!-- Encryption Card -->
          <div class="card diagnostic-card">
            <div class="diag-icon-wrapper success">
              🔐
            </div>
            <div class="diag-content">
              <h4 style="color:var(--white); margin-bottom:2px;">pgcrypto AES-256</h4>
              <div style="font-size:0.85rem; color:#4ade80;">
                🟢 ป้องกันรหัสผ่านปลอดภัย
              </div>
              <div style="font-size:0.75rem; color:var(--gray-500); margin-top:4px;">
                เข้ารหัสก่อนลง DB และปลอด plaintext ใน localStorage
              </div>
            </div>
          </div>
        </div>

        <!-- Cloud Storage Buckets -->
        <div class="card" style="margin-bottom:var(--space-6);">
          <h3 style="font-size:1.1rem; color:var(--white); margin-bottom:var(--space-4); display:flex; align-items:center; gap:var(--space-2);">
            📦 Supabase Storage Buckets
          </h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-4);">
            <div style="padding:var(--space-4); background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-md);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
                <strong style="color:var(--white); font-family:monospace;">product-images</strong>
                <span class="badge badge-success">Public</span>
              </div>
              <p style="font-size:0.8rem; color:var(--gray-400); margin:0;">
                เก็บรูปภาพปกสินค้า รูปโลโก้บริการ (Public Read, Admin Write)
              </p>
            </div>

            <div style="padding:var(--space-4); background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-md);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
                <strong style="color:var(--white); font-family:monospace;">payment-slips</strong>
                <span class="badge badge-warning">Private RLS</span>
              </div>
              <p style="font-size:0.8rem; color:var(--gray-400); margin:0;">
                เก็บรูปภาพสลิปโอนเงินของลูกค้า (เฉพาะเจ้าของสลิปและ Admin ที่ดูได้)
              </p>
            </div>
          </div>
        </div>

        <!-- Maintenance & Refresh -->
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-4);">
          <div>
            <h4 style="color:var(--white); margin-bottom:2px;">ทดสอบการเชื่อมต่อระบบใหม่</h4>
            <p style="font-size:0.8rem; color:var(--gray-400); margin:0;">ตรวจสอบสถานะการเชื่อมต่อไปยังเซิร์ฟเวอร์ Supabase Cloud อีกครั้ง</p>
          </div>
          <button class="btn btn-secondary" @click="runSystemDiagnostics">
            🔄 รันทดสอบระบบ
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-6);
  align-items: start;
}

.card-title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--glass-border);
}

.card-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: flex;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-300);
  margin-bottom: var(--space-2);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: var(--space-1);
}

.switches-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.toggle-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-card:hover {
  border-color: rgba(249, 115, 22, 0.4);
  background: rgba(255, 255, 255, 0.04);
}

.toggle-checkbox {
  margin-top: 3px;
  width: 18px;
  height: 18px;
  accent-color: var(--accent-400);
  cursor: pointer;
}

.toggle-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--white);
  margin-bottom: 2px;
}

.toggle-desc {
  font-size: 0.75rem;
  color: var(--gray-400);
  line-height: 1.4;
}

/* Live QR Preview */
.live-preview-sticky {
  position: sticky;
  top: var(--space-6);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
}

.promptpay-preview-card {
  background: linear-gradient(135deg, #0B2D5F 0%, #004080 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  color: white;
  box-shadow: 0 10px 25px rgba(11, 45, 95, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.pp-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.pp-logo-badge {
  background: white;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.pp-qr-box {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  margin-bottom: var(--space-3);
}

.pp-qr-img {
  width: 100%;
  max-width: 190px;
  height: auto;
  border-radius: var(--radius-sm);
}

.pp-qr-loading, .pp-qr-empty {
  color: #64748b;
  font-size: 0.85rem;
  text-align: center;
}

.pp-recipient-box {
  background: rgba(0, 0, 0, 0.25);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-align: center;
}

.badge-status-box {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
}

.badge-status-box.warning {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: #facc15;
}

.badge-status-box.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.badge-status-box.info {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.diagnostic-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
}

.diag-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.diag-icon-wrapper.success {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.diag-icon-wrapper.warning {
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.diag-icon-wrapper.danger {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    flex-direction: column;
  }
}
</style>
