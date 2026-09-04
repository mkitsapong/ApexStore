<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { usePaymentStore } from '../../stores/payment'
import { useToastStore } from '../../stores/toast'
import { generatePromptPayQRDataUrl } from '../../utils/promptpay'
import { formatCurrency, formatDateTime } from '../../data/mockData'

const auth = useAuthStore()
const payment = usePaymentStore()
const toast = useToastStore()
const router = useRouter()

// Flow state
const step = ref(1) // 1: Amount, 2: Scan QR & Upload, 3: Verifying, 4: Success Receipt
const amount = ref(100)
const presets = [50, 100, 200, 300, 500, 1000, 2000]

// QR state
const qrDataUrl = ref('')
const qrLoading = ref(false)
const countdownSeconds = ref(900) // 15 minutes
let timerInterval = null

// Slip upload & verify state
const isDragging = ref(false)
const slipFile = ref(null)
const slipPreview = ref(null)
const verifyPhase = ref(0) // 0: Start, 1: Reading QR, 2: Checking Bank, 3: Verifying amount, 4: Done
const verifiedData = ref(null)
const verifyError = ref('')

const formattedCountdown = computed(() => {
  const m = Math.floor(countdownSeconds.value / 60).toString().padStart(2, '0')
  const s = (countdownSeconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

onMounted(async () => {
  await payment.fetchSettings()
  payment.subscribeToSettings()
})

onUnmounted(() => {
  clearInterval(timerInterval)
})

function selectPreset(val) {
  amount.value = val
}

async function proceedToQR() {
  if (!amount.value || amount.value < payment.settings.minTopupAmount) {
    toast.error(`ยอดเติมเงินขั้นต่ำ ฿${payment.settings.minTopupAmount}`)
    return
  }
  if (amount.value > payment.settings.maxTopupAmount) {
    toast.error(`ยอดเติมเงินสูงสุดไม่เกิน ฿${payment.settings.maxTopupAmount.toLocaleString()}`)
    return
  }

  qrLoading.value = true
  step.value = 2
  countdownSeconds.value = 900

  try {
    qrDataUrl.value = await generatePromptPayQRDataUrl(
      payment.settings.promptPayId,
      amount.value,
      { width: 260 }
    )
  } catch (err) {
    toast.error('ไม่สามารถสร้าง QR Code ได้: ' + err.message)
  } finally {
    qrLoading.value = false
  }

  startCountdown()
}

function startCountdown() {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--
    } else {
      clearInterval(timerInterval)
      toast.error('QR Code หมดอายุ กรุณาสร้างใหม่อีกครั้ง')
      step.value = 1
    }
  }, 1000)
}

function copyText(text, label = 'คัดลอกแล้ว') {
  navigator.clipboard.writeText(text)
  toast.success(label)
}

function downloadQR() {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.href = qrDataUrl.value
  link.download = `PromptPay-QR-฿${amount.value}.png`
  link.click()
  toast.success('ดาวน์โหลด QR Code สำเร็จ')
}

// File drop & select handlers
function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) handleFile(file)
}

function onFileDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    toast.error('กรุณาอัปโหลดไฟล์รูปภาพสลิป (PNG, JPG, JPEG)')
    return
  }
  slipFile.value = file
  slipPreview.value = URL.createObjectURL(file)
  startAutoVerification()
}

async function startAutoVerification() {
  step.value = 3
  verifyPhase.value = 1
  verifyError.value = ''

  // Step 1: Scanning Slip QR
  await new Promise(r => setTimeout(r, 600))
  verifyPhase.value = 2

  // Step 2: Querying Bank API / SlipOK
  await new Promise(r => setTimeout(r, 800))
  verifyPhase.value = 3

  // Step 3: Verifying Amount & Duplicate
  const result = await payment.processSlipTopup({
    file: slipFile.value,
    amount: amount.value,
    slipPreviewUrl: slipPreview.value
  })

  await new Promise(r => setTimeout(r, 500))

  if (result.success) {
    verifyPhase.value = 4
    verifiedData.value = result.data
    clearInterval(timerInterval)
    toast.success(`🎉 เติมเงินสำเร็จ +฿${amount.value.toLocaleString()}`)
    setTimeout(() => {
      step.value = 4
    }, 600)
  } else {
    verifyError.value = result.error
  }
}

function retryUpload() {
  slipFile.value = null
  slipPreview.value = null
  verifyError.value = ''
  step.value = 2
}

function resetAll() {
  step.value = 1
  amount.value = 100
  slipFile.value = null
  slipPreview.value = null
  verifiedData.value = null
  verifyError.value = ''
  clearInterval(timerInterval)
}

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in">
      <!-- Header -->
      <div style="margin-bottom:var(--space-8); text-align:center;">
        <div class="section-label" style="margin:0 auto var(--space-3);">⚡ ระบบเติมเงินอัตโนมัติ 24 ชม.</div>
        <h1 style="font-size:2rem; margin-bottom:var(--space-2);">เติมเงินผ่าน PromptPay</h1>
        <p style="color:var(--gray-400); max-width:620px; margin:0 auto;">สแกน QR Code แล้วแนบสลิป ระบบตรวจสอบและเพิ่มยอดเงินเข้า Wallet ทันทีภายใน 3 วินาที</p>
      </div>

      <!-- Step Progress Bar -->
      <div class="steps-progress-container">
        <div :class="['step-node', { active: step >= 1, current: step === 1 }]">
          <div class="node-circle">1</div>
          <span class="node-label">กำหนดจำนวนเงิน</span>
        </div>
        <div :class="['step-line', { filled: step >= 2 }]"></div>
        <div :class="['step-node', { active: step >= 2, current: step === 2 }]">
          <div class="node-circle">2</div>
          <span class="node-label">สแกนชำระ & แนบสลิป</span>
        </div>
        <div :class="['step-line', { filled: step >= 3 }]"></div>
        <div :class="['step-node', { active: step >= 3, current: step === 3 }]">
          <div class="node-circle">3</div>
          <span class="node-label">ตรวจสลิป Auto</span>
        </div>
        <div :class="['step-line', { filled: step === 4 }]"></div>
        <div :class="['step-node', { active: step === 4, current: step === 4 }]">
          <div class="node-circle">✓</div>
          <span class="node-label">สำเร็จ</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 360px; gap:var(--space-8); align-items:start;">
        <!-- Left / Main Area -->
        <div>
          <!-- STEP 1: Select Amount -->
          <div v-if="step === 1" class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-8);">
            <h3 style="margin-bottom:var(--space-2); display:flex; align-items:center; gap:var(--space-2);">
              <span>💰</span> เลือกจำนวนเงินที่ต้องการเติม
            </h3>
            <p style="color:var(--gray-400); font-size:0.875rem; margin-bottom:var(--space-6);">
              ระบุยอดเงินที่ต้องการเติม หรือเลือกจากตัวเลือกด่วนด้านล่าง
            </p>

            <!-- Quick Presets -->
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-6);">
              <button
                v-for="p in presets"
                :key="p"
                :class="['preset-btn', { active: amount === p }]"
                @click="selectPreset(p)"
                type="button"
              >
                <div style="font-size:0.75rem; color:var(--gray-400);">เติมเงิน</div>
                <div style="font-size:1.125rem; font-weight:800; font-family:var(--font-en);">฿{{ p.toLocaleString() }}</div>
              </button>
            </div>

            <!-- Custom Amount Input -->
            <div class="form-group" style="margin-bottom:var(--space-6);">
              <label class="form-label" for="custom-amount">
                หรือกรอกจำนวนเงินเอง (฿{{ payment.settings.minTopupAmount }} - ฿{{ payment.settings.maxTopupAmount.toLocaleString() }})
              </label>
              <div style="position:relative;">
                <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:1.25rem; font-weight:700; color:var(--accent-400);">฿</span>
                <input
                  id="custom-amount"
                  v-model.number="amount"
                  type="number"
                  :min="payment.settings.minTopupAmount"
                  :max="payment.settings.maxTopupAmount"
                  class="form-input"
                  style="padding-left:40px; font-size:1.25rem; font-weight:700; font-family:var(--font-en);"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              class="btn btn-primary btn-lg w-full"
              @click="proceedToQR"
              id="btn-generate-qr"
              style="width:100%; font-size:1.05rem;"
            >
              📱 สร้าง QR Code ชำระเงิน ฿{{ amount.toLocaleString() }}
            </button>
          </div>

          <!-- STEP 2: Scan QR & Upload Slip -->
          <div v-if="step === 2" class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-8);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
              <div>
                <h3 style="margin-bottom:2px;">📱 สแกน QR Code เพื่อชำระเงิน</h3>
                <p style="color:var(--gray-400); font-size:0.875rem;">เปิดแอปธนาคารใดก็ได้แล้วสแกนชำระ</p>
              </div>
              <div class="timer-badge">
                <span>⏱️</span> หมดอายุใน <strong>{{ formattedCountdown }}</strong>
              </div>
            </div>

            <!-- QR Presentation Box -->
            <div class="qr-container-box">
              <!-- PromptPay Header Banner -->
              <div class="promptpay-banner">
                <div style="font-weight:900; font-size:1.15rem; letter-spacing:0.05em;">PromptPay</div>
                <div style="font-size:0.75rem; opacity:0.9;">พร้อมเพย์</div>
              </div>

              <!-- Live QR Code Canvas -->
              <div class="qr-image-wrapper">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="PromptPay QR" class="qr-code-img" />
                <div v-else class="spinner" style="width:40px;height:40px;"></div>
              </div>

              <!-- Recipient info inside QR Box -->
              <div class="qr-info-footer">
                <div style="font-size:0.85rem; color:var(--gray-600); margin-bottom:2px;">ชื่อบัญชี: {{ payment.settings.promptPayName }}</div>
                <div style="font-size:0.8rem; color:var(--gray-500); font-family:monospace; margin-bottom:var(--space-2);">พร้อมเพย์: {{ payment.settings.promptPayId }}</div>
                <div class="qr-amount-pill">
                  จำนวนเงิน <span>฿{{ amount.toLocaleString() }}.00</span>
                </div>
              </div>
            </div>

            <!-- Quick Action Buttons for QR -->
            <div style="display:flex; gap:var(--space-3); margin-top:var(--space-5); margin-bottom:var(--space-8); justify-content:center; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" @click="copyText(payment.settings.promptPayId, 'คัดลอกเบอร์พร้อมเพย์แล้ว')">
                📋 คัดลอกเบอร์พร้อมเพย์
              </button>
              <button class="btn btn-secondary btn-sm" @click="copyText(amount.toString(), 'คัดลอกยอดเงินแล้ว')">
                🔢 คัดลอกยอดเงิน
              </button>
              <button class="btn btn-secondary btn-sm" @click="downloadQR">
                📥 บันทึกรูป QR Code
              </button>
            </div>

            <div class="divider"></div>

            <!-- Slip Upload Section -->
            <div style="margin-top:var(--space-6);">
              <h4 style="margin-bottom:var(--space-3); display:flex; align-items:center; gap:var(--space-2);">
                <span>📎</span> แนบสลิปเพื่อตรวจยอดเงินอัตโนมัติ
              </h4>
              
              <div
                :class="['dropzone-box', { dragging: isDragging }]"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onFileDrop"
                @click="$refs.fileInput.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display:none;"
                  @change="onFileSelect"
                  id="slip-file-input"
                />
                <div style="font-size:3rem; margin-bottom:var(--space-2);">📸</div>
                <div style="font-weight:700; color:var(--white); font-size:1.05rem; margin-bottom:var(--space-1);">
                  คลิกเพื่อเลือกรูปสลิป หรือลากรูปมาวางที่นี่
                </div>
                <div style="font-size:0.8125rem; color:var(--gray-400);">
                  รองรับไฟล์รูปภาพ JPG, PNG (ระบบจะสแกน QR ในสลิปทันที)
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-4);">
                <button class="btn btn-secondary btn-sm" @click="step = 1">← เปลี่ยนยอดเงิน</button>
                <span style="font-size:0.75rem; color:var(--gray-500);">⚡ ปลอดภัย ป้องกันสลิปซ้ำ 100%</span>
              </div>
            </div>
          </div>

          <!-- STEP 3: Verifying Animation -->
          <div v-if="step === 3" class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-12) var(--space-8); text-align:center;">
            <div v-if="!verifyError">
              <!-- Animated Pulse Icon -->
              <div class="verifying-icon-wrapper">
                <div class="verifying-pulse"></div>
                <div class="verifying-icon">⚡</div>
              </div>

              <h2 style="margin-bottom:var(--space-2);">กำลังตรวจสอบสลิปอัตโนมัติ...</h2>
              <p style="color:var(--gray-400); font-size:0.95rem; margin-bottom:var(--space-8);">
                ระบบกำลังเชื่อมต่อโครงข่ายธนาคารเพื่อยืนยันรายการโอน
              </p>

              <!-- Verification Stage Indicators -->
              <div class="verify-stages-box">
                <div :class="['stage-item', { active: verifyPhase >= 1, done: verifyPhase > 1 }]">
                  <span class="stage-dot"></span>
                  <span>1. สแกนและถอดรหัส QR Code ในสลิป</span>
                </div>
                <div :class="['stage-item', { active: verifyPhase >= 2, done: verifyPhase > 2 }]">
                  <span class="stage-dot"></span>
                  <span>2. ตรวจสอบกับฐานข้อมูลธนาคาร & SlipOK Gateway</span>
                </div>
                <div :class="['stage-item', { active: verifyPhase >= 3, done: verifyPhase > 3 }]">
                  <span class="stage-dot"></span>
                  <span>3. ตรวจสอบยอดเงิน ฿{{ amount.toLocaleString() }} และป้องกันสลิปซ้ำ</span>
                </div>
                <div :class="['stage-item', { active: verifyPhase >= 4 }]">
                  <span class="stage-dot"></span>
                  <span>4. ปรับยอดเงินเข้า Wallet สำเร็จ</span>
                </div>
              </div>
            </div>

            <!-- Error in Verification -->
            <div v-else style="max-width:440px; margin:0 auto;">
              <div style="font-size:4rem; margin-bottom:var(--space-3);">❌</div>
              <h3 style="color:#f87171; margin-bottom:var(--space-2);">การตรวจสอบไม่สำเร็จ</h3>
              <div style="padding:var(--space-4); background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); color:#fca5a5; font-size:0.9rem; margin-bottom:var(--space-6);">
                {{ verifyError }}
              </div>
              <div style="display:flex; gap:var(--space-3); justify-content:center;">
                <button class="btn btn-secondary" @click="retryUpload">ลองใหม่อีกครั้ง</button>
                <button class="btn btn-outline" @click="step = 1">เปลี่ยนยอดเงิน</button>
              </div>
            </div>
          </div>

          <!-- STEP 4: Success Receipt -->
          <div v-if="step === 4 && verifiedData" class="card-elevated animate-fade-in" style="border-radius:var(--radius-xl); padding:var(--space-8); text-align:center;">
            <div class="success-badge-icon">🎉</div>
            <h2 style="margin-bottom:var(--space-1);">เติมเงินสำเร็จเรียบร้อย!</h2>
            <p style="color:var(--gray-400); font-size:0.95rem; margin-bottom:var(--space-6);">
              ยอดเงินได้ถูกโอนเข้า Wallet ของคุณแล้ว พร้อมใช้งานทันที
            </p>

            <!-- Verified Receipt Box -->
            <div class="receipt-card">
              <div class="receipt-header">
                <div>
                  <div style="font-size:0.8rem; color:var(--gray-400);">สลิปยืนยันการโอนเงิน (Auto-Verified)</div>
                  <div style="font-size:1.5rem; font-weight:900; color:var(--success); font-family:var(--font-en);">
                    +฿{{ verifiedData.amount.toLocaleString() }}.00
                  </div>
                </div>
                <span class="badge badge-success">✓ ตรวจสอบแล้ว 100%</span>
              </div>

              <div class="divider"></div>

              <div class="receipt-body">
                <div class="receipt-row">
                  <span class="label">เลขอ้างอิงธุรกรรม (TransRef)</span>
                  <span class="value font-mono">{{ verifiedData.transRef }}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">ผู้โอน</span>
                  <span class="value">
                    {{ verifiedData.sender?.bankIcon }} {{ verifiedData.sender?.name }} ({{ verifiedData.sender?.bank }})
                  </span>
                </div>
                <div class="receipt-row">
                  <span class="label">ผู้รับเงิน</span>
                  <span class="value">{{ verifiedData.receiver?.name }}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">เวลาที่ทำรายการ</span>
                  <span class="value">{{ formatDateTime(verifiedData.date) }}</span>
                </div>
                <div class="receipt-row" style="padding-top:var(--space-2); margin-top:var(--space-2); border-top:1px dashed var(--glass-border);">
                  <span class="label" style="font-weight:600; color:var(--white);">ยอดคงเหลือปัจจุบันใน Wallet</span>
                  <span class="value font-mono" style="font-size:1.2rem; font-weight:800; color:var(--accent-400);">
                    {{ formatCurrency(auth.balance) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div style="display:flex; gap:var(--space-4); justify-content:center; margin-top:var(--space-8); flex-wrap:wrap;">
              <button class="btn btn-secondary" @click="resetAll">➕ เติมเงินเพิ่ม</button>
              <RouterLink to="/shop" class="btn btn-primary btn-lg" id="btn-go-to-shop">
                🛒 ไปเลือกซื้อสินค้า Premium
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Right Side: Wallet Summary & How-to -->
        <div style="display:flex; flex-direction:column; gap:var(--space-5);">
          <!-- Current Wallet Card -->
          <div class="card" style="background:linear-gradient(135deg, rgba(11,45,95,0.7), rgba(5,13,26,0.9)); border-color:rgba(249,115,22,0.3);">
            <div style="font-size:0.8125rem; color:var(--gray-400); margin-bottom:var(--space-1);">ยอดเงินคงเหลือในกระเป๋า</div>
            <div style="font-size:2.25rem; font-weight:900; color:var(--accent-400); font-family:var(--font-en); line-height:1; margin-bottom:var(--space-4);">
              {{ formatCurrency(auth.balance) }}
            </div>
            <div style="display:flex; align-items:center; gap:var(--space-2); font-size:0.8125rem; color:var(--gray-300);">
              <span style="width:8px; height:8px; border-radius:50%; background:var(--success); display:inline-block;"></span>
              <span>สถานะบัญชี: ปกติ (พร้อมใช้งาน)</span>
            </div>
          </div>

          <!-- Feature Highlights -->
          <div class="card">
            <h4 style="margin-bottom:var(--space-4); font-size:0.95rem;">⚡ ข้อดีของระบบ Auto Verify</h4>
            <div style="display:flex; flex-direction:column; gap:var(--space-3);">
              <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
                <div style="font-size:1.1rem;">⚡</div>
                <div>
                  <div style="font-size:0.875rem; font-weight:600; color:var(--white);">เงินเข้าทันทีใน 3 วิ</div>
                  <div style="font-size:0.75rem; color:var(--gray-400);">ไม่ต้องรอแอดมินตอบแชทหรือกดอนุมัติ</div>
                </div>
              </div>
              <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
                <div style="font-size:1.1rem;">🔒</div>
                <div>
                  <div style="font-size:0.875rem; font-weight:600; color:var(--white);">ระบบป้องกันความปลอดภัย</div>
                  <div style="font-size:0.75rem; color:var(--gray-400);">เชื่อมต่อฐานข้อมูลธนาคาร ป้องกันสลิปปลอมและสลิปซ้ำ</div>
                </div>
              </div>
              <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
                <div style="font-size:1.1rem;">📱</div>
                <div>
                  <div style="font-size:0.875rem; font-weight:600; color:var(--white);">รองรับทุกธนาคาร</div>
                  <div style="font-size:0.75rem; color:var(--gray-400);">K PLUS, SCB EASY, Krungthai, BBL, TTB, ออมสิน</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Need Help / Support -->
          <div style="padding:var(--space-4); background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:var(--radius-lg); text-align:center;">
            <div style="font-size:0.85rem; color:var(--gray-400); margin-bottom:var(--space-2);">พบปัญหาการเติมเงิน?</div>
            <a href="#" style="font-size:0.875rem; color:var(--accent-400); font-weight:600; text-decoration:underline;">
              💬 ติดต่อแอดมินทาง Line 24 ชม.
            </a>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
/* Steps Progress Bar */
.steps-progress-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 720px;
  margin: 0 auto var(--space-8);
  padding: 0 var(--space-4);
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  position: relative;
  z-index: 2;
}

.node-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 2px solid var(--glass-border);
  color: var(--gray-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  transition: all var(--transition-base);
}

.step-node.active .node-circle {
  background: var(--accent-400);
  border-color: var(--accent-300);
  color: var(--white);
  box-shadow: 0 0 16px rgba(249, 115, 22, 0.4);
}

.step-node.current .node-circle {
  animation: pulseNode 2s infinite;
}

.node-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: 500;
  white-space: nowrap;
}

.step-node.active .node-label {
  color: var(--gray-200);
  font-weight: 600;
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--glass-border);
  margin: 0 var(--space-2) var(--space-5);
  transition: background var(--transition-base);
}

.step-line.filled {
  background: var(--accent-400);
}

@keyframes pulseNode {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* Preset Buttons */
.preset-btn {
  padding: var(--space-3) var(--space-2);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--white);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.preset-btn:hover {
  border-color: rgba(249, 115, 22, 0.4);
  background: rgba(249, 115, 22, 0.08);
}

.preset-btn.active {
  border-color: var(--accent-400);
  background: rgba(249, 115, 22, 0.15);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.25);
}

/* QR Presentation Box */
.qr-container-box {
  background: #FFFFFF;
  border-radius: var(--radius-xl);
  overflow: hidden;
  max-width: 320px;
  margin: 0 auto;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
  text-align: center;
}

.promptpay-banner {
  background: #0B2D5F;
  color: #FFFFFF;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qr-image-wrapper {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  min-height: 250px;
}

.qr-code-img {
  width: 220px;
  height: 220px;
  object-fit: contain;
  display: block;
}

.qr-info-footer {
  padding: var(--space-3) var(--space-4) var(--space-4);
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
}

.qr-amount-pill {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: var(--radius-full);
  color: #C2560A;
  font-size: 0.875rem;
  font-weight: 600;
}

.qr-amount-pill span {
  font-size: 1.1rem;
  font-weight: 800;
  font-family: var(--font-en);
  margin-left: 4px;
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 10px;
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: #FACC15;
}

/* Dropzone */
.dropzone-box {
  border: 2px dashed rgba(249, 115, 22, 0.4);
  background: rgba(249, 115, 22, 0.03);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
}

.dropzone-box:hover, .dropzone-box.dragging {
  border-color: var(--accent-400);
  background: rgba(249, 115, 22, 0.08);
  transform: scale(1.01);
}

/* Verifying Stage Animation */
.verifying-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.verifying-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.2);
  animation: radarPulse 1.8s infinite;
}

.verifying-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  position: relative;
  z-index: 1;
}

@keyframes radarPulse {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}

.verify-stages-box {
  max-width: 440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: left;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-500);
  transition: all var(--transition-base);
}

.stage-item.active {
  color: var(--white);
  border-color: rgba(249, 115, 22, 0.3);
  background: rgba(249, 115, 22, 0.06);
}

.stage-item.done {
  color: #4ADE80;
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.06);
}

.stage-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gray-600);
  flex-shrink: 0;
}

.stage-item.active .stage-dot {
  background: var(--accent-400);
  box-shadow: 0 0 8px var(--accent-400);
}

.stage-item.done .stage-dot {
  background: #4ADE80;
}

/* Success Receipt */
.success-badge-icon {
  font-size: 3.5rem;
  margin-bottom: var(--space-2);
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.receipt-card {
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  max-width: 520px;
  margin: 0 auto;
  text-align: left;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.receipt-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.receipt-row .label {
  color: var(--gray-400);
}

.receipt-row .value {
  color: var(--white);
  font-weight: 500;
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 768px) {
  div[style*="grid-template-columns:1fr 360px"] {
    grid-template-columns: 1fr !important;
  }
  .steps-progress-container {
    flex-wrap: wrap;
    gap: var(--space-2);
  }
}
</style>
