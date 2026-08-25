import { defineStore } from 'pinia'
import { ref } from 'vue'
import { verifySlip } from '../services/slipService'
import { uploadPaymentSlip } from '../services/storage'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'
import { supabase, isSupabaseConfigured } from '../services/supabase'

export const DEFAULT_PAYMENT_SETTINGS = {
  promptPayId: '0812345678',
  promptPayName: 'ร้าน ApexStore (Official)',
  promptPayType: 'phone', // 'phone' | 'national_id'
  slipokApiKey: '',
  isAutoVerify: true,
  isDemoMode: true,
  minTopupAmount: 20,
  maxTopupAmount: 50000
}

export const DEFAULT_STORE_SETTINGS = {
  storeName: 'ApexStore Premium',
  storeTagline: 'ศูนย์รวมบริการดิจิทัลระดับพรีเมียม ส่งมอบทันที 24 ชั่วโมง',
  contactLine: '@apexstore',
  contactEmail: 'support@apexstore.com',
  announcement: '🎉 ยินดีต้อนรับสู่ ApexStore ระบบเติมเงินออโต้ 24 ชม. ปลอดภัย รวดเร็ว!',
  showAnnouncement: true,
  maintenanceMode: false
}

export const usePaymentStore = defineStore('payment', () => {
  const auth = useAuthStore()

  // PromptPay and SlipOK Settings (persisted in localStorage with default fallback)
  const settings = ref(JSON.parse(localStorage.getItem('sp_payment_settings') || JSON.stringify(DEFAULT_PAYMENT_SETTINGS)))

  // General Store Branding & Config Settings
  const storeSettings = ref(JSON.parse(localStorage.getItem('sp_store_settings') || JSON.stringify(DEFAULT_STORE_SETTINGS)))

  // Used Transaction References to prevent duplicate slips
  const usedTransRefs = ref(JSON.parse(localStorage.getItem('sp_used_trans_refs') || '[]'))

  // Slip Top-up verification logs
  const topupLogs = ref(JSON.parse(localStorage.getItem('sp_topup_logs') || '[]'))
  const loading = ref(false)
  const settingsLoading = ref(false)

  /**
   * Fetch payment and store settings from Supabase app_settings
   */
  async function fetchSettings() {
    if (isSupabaseConfigured && supabase) {
      try {
        settingsLoading.value = true
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', ['payment_settings', 'store_settings'])

        if (error) throw error

        if (data && data.length > 0) {
          const payData = data.find(item => item.key === 'payment_settings')
          if (payData && payData.value) {
            settings.value = { ...DEFAULT_PAYMENT_SETTINGS, ...payData.value }
            localStorage.setItem('sp_payment_settings', JSON.stringify(settings.value))
          }

          const storeData = data.find(item => item.key === 'store_settings')
          if (storeData && storeData.value) {
            storeSettings.value = { ...DEFAULT_STORE_SETTINGS, ...storeData.value }
            localStorage.setItem('sp_store_settings', JSON.stringify(storeSettings.value))
          }
        }
      } catch (err) {
        console.warn('Could not fetch settings from Supabase, using cached/defaults:', err)
      } finally {
        settingsLoading.value = false
      }
    }
    return { payment: settings.value, store: storeSettings.value }
  }

  /**
   * Save payment settings to state, localStorage, and Supabase
   */
  async function saveSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
    localStorage.setItem('sp_payment_settings', JSON.stringify(settings.value))

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            key: 'payment_settings',
            value: settings.value,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
        return { success: true }
      } catch (err) {
        console.error('Error saving payment settings to Supabase:', err)
        throw err
      }
    }
    return { success: true }
  }

  /**
   * Save general store settings
   */
  async function saveStoreSettings(newStoreSettings) {
    storeSettings.value = { ...storeSettings.value, ...newStoreSettings }
    localStorage.setItem('sp_store_settings', JSON.stringify(storeSettings.value))

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            key: 'store_settings',
            value: storeSettings.value,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
        return { success: true }
      } catch (err) {
        console.error('Error saving store settings to Supabase:', err)
        throw err
      }
    }
    return { success: true }
  }

  /**
   * Reset payment settings to defaults
   */
  async function resetSettings() {
    return await saveSettings(DEFAULT_PAYMENT_SETTINGS)
  }

  function saveLogs() {
    localStorage.setItem('sp_topup_logs', JSON.stringify(topupLogs.value))
  }

  function saveUsedTransRefs() {
    localStorage.setItem('sp_used_trans_refs', JSON.stringify(usedTransRefs.value))
  }

  let topupChannel = null
  let settingsChannel = null

  /**
   * Subscribe to live Realtime updates on app_settings
   */
  function subscribeToSettings() {
    if (!isSupabaseConfigured || !supabase) return

    if (settingsChannel) {
      supabase.removeChannel(settingsChannel)
      settingsChannel = null
    }

    settingsChannel = supabase
      .channel('app-settings-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings'
        },
        (payload) => {
          if (payload.new && payload.new.key === 'payment_settings') {
            settings.value = { ...DEFAULT_PAYMENT_SETTINGS, ...payload.new.value }
            localStorage.setItem('sp_payment_settings', JSON.stringify(settings.value))
          } else if (payload.new && payload.new.key === 'store_settings') {
            storeSettings.value = { ...DEFAULT_STORE_SETTINGS, ...payload.new.value }
            localStorage.setItem('sp_store_settings', JSON.stringify(storeSettings.value))
          }
        }
      )
      .subscribe()
  }

  /**
   * Subscribe to live Realtime updates on topup_transactions
   */
  function subscribeToTopups() {
    if (!isSupabaseConfigured || !supabase) return

    if (topupChannel) {
      supabase.removeChannel(topupChannel)
      topupChannel = null
    }

    const channelName = `topups-live-${auth.isAdmin ? 'admin' : (auth.user?.id || 'guest')}`
    topupChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topup_transactions',
          ...(auth.isAdmin ? {} : (auth.user?.id ? { filter: `user_id=eq.${auth.user.id}` } : {}))
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const exists = topupLogs.value.some(l => l.id === payload.new.id)
            if (!exists) {
              topupLogs.value.unshift(payload.new)
              saveLogs()
              if (auth.isAdmin) {
                try {
                  useToastStore().info(`💰 มีรายการเติมเงินใหม่: ฿${payload.new.amount}`)
                } catch (e) {}
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const idx = topupLogs.value.findIndex(l => l.id === payload.new.id)
            if (idx !== -1) {
              topupLogs.value[idx] = { ...topupLogs.value[idx], ...payload.new }
              saveLogs()
            }
          }
        }
      )
      .subscribe()
  }

  /**
   * Fetch topup transactions from Supabase
   */
  async function fetchTopups() {
    if (isSupabaseConfigured && supabase) {
      try {
        loading.value = true
        let query = supabase.from('topup_transactions').select('*').order('created_at', { ascending: false })
        
        // If not admin, query only current user's topups
        if (!auth.isAdmin && auth.user?.id) {
          query = query.eq('user_id', auth.user.id)
        }

        const { data, error } = await query
        if (error) throw error
        if (data && data.length > 0) {
          topupLogs.value = data
          saveLogs()
          subscribeToTopups()
          return data
        }
      } catch (err) {
        console.error('Error fetching Supabase topups:', err)
      } finally {
        loading.value = false
      }
    }
    return topupLogs.value
  }

  /**
   * Process and verify slip upload
   */
  async function processSlipTopup({ file, amount, slipPreviewUrl }) {
    // 1. Upload slip image to Supabase Storage 'payment-slips'
    let storageSlipUrl = slipPreviewUrl
    if (file) {
      try {
        const uploadRes = await uploadPaymentSlip(file, auth.user?.id || 'guest')
        if (uploadRes.success && uploadRes.url) {
          storageSlipUrl = uploadRes.url
        }
      } catch (e) {
        console.warn('Could not upload slip to Supabase storage:', e)
      }
    }

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
      await auth.addBalance(result.amount)

      // Create rich log entry
      const logEntry = {
        id: `TOP-${Date.now().toString().slice(-6)}`,
        user_id: auth.user?.id || null,
        username: auth.user?.username || 'Guest',
        amount: result.amount,
        trans_ref: result.transRef,
        sender: result.sender || {},
        receiver: result.receiver || {},
        slip_url: storageSlipUrl || '',
        status: 'approved',
        is_auto_approved: true,
        is_simulated: result.isSimulated || false,
        created_at: new Date().toISOString()
      }

      // Sync to Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('topup_transactions').insert({
            id: logEntry.id,
            user_id: logEntry.user_id,
            username: logEntry.username,
            amount: logEntry.amount,
            trans_ref: logEntry.trans_ref,
            sender: logEntry.sender,
            receiver: logEntry.receiver,
            slip_url: logEntry.slip_url,
            status: logEntry.status,
            is_auto_approved: logEntry.is_auto_approved,
            is_simulated: logEntry.is_simulated
          })
        } catch (err) {
          console.error('Error recording topup in Supabase:', err)
        }
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
        user_id: auth.user?.id || null,
        username: auth.user?.username || 'Guest',
        amount: Number(amount) || 0,
        error_message: result.error || 'ตรวจสอบสลิปไม่สำเร็จ',
        slip_url: slipPreviewUrl || '',
        status: 'rejected',
        created_at: new Date().toISOString()
      }

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('topup_transactions').insert({
            id: failedEntry.id,
            user_id: failedEntry.user_id,
            username: failedEntry.username,
            amount: failedEntry.amount,
            error_message: failedEntry.error_message,
            slip_url: failedEntry.slip_url,
            status: failedEntry.status
          })
        } catch (err) {
          console.error('Error recording failed topup in Supabase:', err)
        }
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
  async function manualApprove(logId) {
    const log = topupLogs.value.find(l => l.id === logId)
    if (log && log.status !== 'approved') {
      log.status = 'approved'
      log.is_auto_approved = false
      await auth.addBalance(log.amount)
      saveLogs()

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('topup_transactions')
            .update({ status: 'approved', is_auto_approved: false })
            .eq('id', logId)
        } catch (err) {
          console.error('Error updating topup status in Supabase:', err)
        }
      }
    }
  }

  /**
   * Admin manual reject
   */
  async function manualReject(logId) {
    const log = topupLogs.value.find(l => l.id === logId)
    if (log) {
      log.status = 'rejected'
      saveLogs()

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('topup_transactions')
            .update({ status: 'rejected' })
            .eq('id', logId)
        } catch (err) {
          console.error('Error updating topup status in Supabase:', err)
        }
      }
    }
  }

  return {
    settings,
    storeSettings,
    usedTransRefs,
    topupLogs,
    loading,
    settingsLoading,
    fetchSettings,
    subscribeToSettings,
    fetchTopups,
    subscribeToTopups,
    saveSettings,
    saveStoreSettings,
    resetSettings,
    processSlipTopup,
    manualApprove,
    manualReject
  }
})

