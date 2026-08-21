import { defineStore } from 'pinia'
import { ref } from 'vue'
import { verifySlip } from '../services/slipService'
import { useAuthStore } from './auth'

export const usePaymentStore = defineStore('payment', () => {
  const auth = useAuthStore()

  // PromptPay and SlipOK Settings (persisted in localStorage)
  const settings = ref(JSON.parse(localStorage.getItem('sp_payment_settings') || JSON.stringify({
    promptPayId: '0812345678',
    promptPayName: 'ร้าน ApexStore (Official)',
    promptPayType: 'phone', // 'phone' | 'national_id'
    slipokApiKey: '',
    isAutoVerify: true,
    isDemoMode: true,
    minTopupAmount: 20,
    maxTopupAmount: 50000
  })))

  // Used Transaction References to prevent duplicate slips
  const usedTransRefs = ref(JSON.parse(localStorage.getItem('sp_used_trans_refs') || '[]'))

  // Slip Top-up verification logs
  const topupLogs = ref(JSON.parse(localStorage.getItem('sp_topup_logs') || '[]'))

  function saveSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
    localStorage.setItem('sp_payment_settings', JSON.stringify(settings.value))
  }

  function saveLogs() {
    localStorage.setItem('sp_topup_logs', JSON.stringify(topupLogs.value))
  }

  function saveUsedTransRefs() {
    localStorage.setItem('sp_used_trans_refs', JSON.stringify(usedTransRefs.value))
  }

  /**
   * Process and verify slip upload
   */
  async function processSlipTopup({ file, amount, slipPreviewUrl }) {
    const result = await verifySlip({
      file,
      expectedAmount: amount,
      expectedRecipient: settings.value.promptPayName,
      apiKey: settings.value.slipokApiKey,
      usedTransRefs: usedTransRefs.value,
      isDemoMode: settings.value.isDemoMode
    })

    if (result.success) {
      // Record used TransRef to avoid duplicate topup
      usedTransRefs.value.push(result.transRef)
      saveUsedTransRefs()

      // Credit balance to authenticated user
      auth.addBalance(result.amount)

      // Create rich log entry
      const logEntry = {
        id: `TOP-${Date.now().toString().slice(-6)}`,
        userId: auth.user?.id || 'guest',
        username: auth.user?.username || 'Guest',
        amount: result.amount,
        transRef: result.transRef,
        sender: result.sender,
        receiver: result.receiver,
        date: result.date,
        slipUrl: slipPreviewUrl,
        status: 'approved',
        isAutoApproved: true,
        isSimulated: result.isSimulated || false,
        createdAt: new Date().toISOString()
      }

      topupLogs.value.unshift(logEntry)
      saveLogs()

      return {
        success: true,
        data: logEntry
      }
    } else {
      // Failed log
      const failedEntry = {
        id: `TOP-${Date.now().toString().slice(-6)}`,
        userId: auth.user?.id || 'guest',
        username: auth.user?.username || 'Guest',
        amount: Number(amount),
        error: result.error,
        slipUrl: slipPreviewUrl,
        status: 'rejected',
        createdAt: new Date().toISOString()
      }
      topupLogs.value.unshift(failedEntry)
      saveLogs()

      return {
        success: false,
        error: result.error || 'ตรวจสอบสลิปไม่สำเร็จ'
      }
    }
  }

  /**
   * Admin manual approve
   */
  function manualApprove(logId) {
    const log = topupLogs.value.find(l => l.id === logId)
    if (log && log.status !== 'approved') {
      log.status = 'approved'
      log.isAutoApproved = false
      auth.addBalance(log.amount)
      saveLogs()
    }
  }

  /**
   * Admin manual reject
   */
  function manualReject(logId) {
    const log = topupLogs.value.find(l => l.id === logId)
    if (log) {
      log.status = 'rejected'
      saveLogs()
    }
  }

  return {
    settings,
    usedTransRefs,
    topupLogs,
    saveSettings,
    processSlipTopup,
    manualApprove,
    manualReject
  }
})
