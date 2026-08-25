import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

export const NOTIFICATION_TYPES = {
  order_approved: { emoji: '📦', color: '#22c55e', label: 'คำสั่งซื้อสำเร็จ' },
  order_created: { emoji: '🛍️', color: '#3b82f6', label: 'สั่งซื้อใหม่' },
  topup_success: { emoji: '💰', color: '#eab308', label: 'เติมเงินสำเร็จ' },
  expiry_warning: { emoji: '⏳', color: '#f97316', label: 'แพ็กเกจใกล้หมดอายุ' },
  ticket_resolved: { emoji: '🎉', color: '#a855f7', label: 'แก้ไขปัญหาแล้ว' },
  system: { emoji: '📢', color: '#06b6d4', label: 'ประกาศจากระบบ' }
}

export const useNotificationsStore = defineStore('notifications', () => {
  const auth = useAuthStore()
  const toast = useToastStore()

  const notifications = ref(JSON.parse(localStorage.getItem('sp_notifications') || '[]'))
  const loading = ref(false)

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.is_read).length
  })

  function saveLocal() {
    localStorage.setItem('sp_notifications', JSON.stringify(notifications.value))
  }

  /**
   * Fetch notifications from Supabase or localStorage
   */
  async function fetchNotifications() {
    if (!auth.isLoggedIn || !auth.user?.id) return notifications.value

    if (isSupabaseConfigured && supabase) {
      try {
        loading.value = true
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })
          .limit(30)

        if (error) throw error
        if (data) {
          notifications.value = data
          saveLocal()
          subscribeToNotifications()
          return data
        }
      } catch (err) {
        console.warn('Could not fetch notifications from Supabase:', err)
      } finally {
        loading.value = false
      }
    }
    return notifications.value
  }

  let notifyChannel = null

  /**
   * Subscribe to live Realtime notifications for current user
   */
  function subscribeToNotifications() {
    if (!isSupabaseConfigured || !supabase || !auth.isLoggedIn || !auth.user?.id) return

    if (notifyChannel) {
      supabase.removeChannel(notifyChannel)
      notifyChannel = null
    }

    notifyChannel = supabase
      .channel(`notifications-user-${auth.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${auth.user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const exists = notifications.value.some(n => n.id === payload.new.id)
            if (!exists) {
              notifications.value.unshift(payload.new)
              saveLocal()
              // Show toast
              toast.info(`${payload.new.title}: ${payload.new.message}`)
            }
          } else if (payload.eventType === 'UPDATE') {
            const idx = notifications.value.findIndex(n => n.id === payload.new.id)
            if (idx !== -1) {
              notifications.value[idx] = { ...notifications.value[idx], ...payload.new }
              saveLocal()
            }
          } else if (payload.eventType === 'DELETE') {
            notifications.value = notifications.value.filter(n => n.id !== payload.old.id)
            saveLocal()
          }
        }
      )
      .subscribe()
  }

  /**
   * Add a notification
   */
  async function addNotification({ type = 'system', title, message, link = null, userId = null }) {
    const targetUserId = userId || auth.user?.id
    if (!targetUserId) return

    const id = `NTF-${Date.now()}`
    const newNotif = {
      id,
      user_id: targetUserId,
      type,
      title,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').insert(newNotif)
      } catch (err) {
        console.warn('Could not insert notification into Supabase:', err)
      }
    }

    if (targetUserId === auth.user?.id) {
      notifications.value.unshift(newNotif)
      saveLocal()
    }
    return newNotif
  }

  /**
   * Mark a single notification as read
   */
  async function markAsRead(id) {
    const notif = notifications.value.find(n => n.id === id)
    if (notif && !notif.is_read) {
      notif.is_read = true
      saveLocal()

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        } catch (e) {}
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead() {
    notifications.value.forEach(n => { n.is_read = true })
    saveLocal()

    if (isSupabaseConfigured && supabase && auth.user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', auth.user.id)
          .eq('is_read', false)
      } catch (e) {}
    }
  }

  /**
   * Delete single notification
   */
  async function deleteNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
    saveLocal()

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').delete().eq('id', id)
      } catch (e) {}
    }
  }

  /**
   * Clear all notifications
   */
  async function clearAll() {
    notifications.value = []
    saveLocal()

    if (isSupabaseConfigured && supabase && auth.user?.id) {
      try {
        await supabase.from('notifications').delete().eq('user_id', auth.user.id)
      } catch (e) {}
    }
  }

  /**
   * Scan user's orders for expiration within 3 days and generate warning notification
   */
  function checkOrderExpirations(orders = []) {
    if (!auth.isLoggedIn || !auth.user?.id || !Array.isArray(orders)) return

    const now = new Date().getTime()
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

    // Stored set of already warned orders to avoid repeats today
    const warnedKey = `sp_warned_expirations_${auth.user.id}_${new Date().toISOString().split('T')[0]}`
    const warnedIds = JSON.parse(localStorage.getItem(warnedKey) || '[]')

    orders.forEach(o => {
      if (o.status !== 'completed' || !o.expires_at) return
      if (warnedIds.includes(o.id)) return

      const expireTime = new Date(o.expires_at).getTime()
      const diffMs = expireTime - now
      const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

      if (diffMs > 0 && diffMs <= THREE_DAYS_MS) {
        // Expiring in 1-3 days
        addNotification({
          type: 'expiry_warning',
          title: `⏳ แพ็กเกจ ${o.product_name} ใกล้หมดอายุ`,
          message: `แพ็กเกจของคุณจะหมดอายุในอีก ${daysLeft} วัน (${new Date(o.expires_at).toLocaleDateString('th-TH')}) แนะนำให้ต่ออายุล่วงหน้า`,
          link: `/orders/${o.id}`,
          userId: auth.user.id
        })
        warnedIds.push(o.id)
      } else if (diffMs <= 0 && diffMs >= -THREE_DAYS_MS) {
        // Expired recently
        addNotification({
          type: 'expiry_warning',
          title: `⚠️ แพ็กเกจ ${o.product_name} หมดอายุแล้ว`,
          message: `แพ็กเกจของคุณหมดอายุแล้วเมื่อ ${new Date(o.expires_at).toLocaleDateString('th-TH')} คลิกเพื่อเลือกซื้อแพ็กเกจใหม่`,
          link: `/shop`,
          userId: auth.user.id
        })
        warnedIds.push(o.id)
      }
    })

    localStorage.setItem(warnedKey, JSON.stringify(warnedIds))
  }

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    subscribeToNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    checkOrderExpirations
  }
})
