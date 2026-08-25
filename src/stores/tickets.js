import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'
import { useNotificationsStore } from './notifications'

export const TICKET_CATEGORIES = {
  login_failed: { label: 'เข้าสู่ระบบไม่ได้ / รหัสผ่านไม่ถูกต้อง', emoji: '🔑', color: '#ef4444' },
  screen_full: { label: 'หน้าจอเต็ม / มีผู้อื่นใช้งานพร้อมกัน', emoji: '👥', color: '#f59e0b' },
  premature_expire: { label: 'บัญชีหมดอายุก่อนกำหนด', emoji: '⏳', color: '#eab308' },
  wrong_package: { label: 'แพ็กเกจหรือบริการไม่ตรงกับที่สั่ง', emoji: '📦', color: '#3b82f6' },
  other: { label: 'ปัญหาอื่นๆ', emoji: '💬', color: '#8b5cf6' }
}

export const useTicketsStore = defineStore('tickets', () => {
  const auth = useAuthStore()
  const toast = useToastStore()

  const tickets = ref(JSON.parse(localStorage.getItem('sp_support_tickets') || '[]'))
  const loading = ref(false)
  const error = ref(null)

  function saveLocal() {
    localStorage.setItem('sp_support_tickets', JSON.stringify(tickets.value))
  }

  const pendingTicketsCount = computed(() => {
    return tickets.value.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  })

  /**
   * Fetch tickets for current user
   */
  async function fetchUserTickets() {
    if (!auth.isLoggedIn) return []

    if (isSupabaseConfigured && supabase) {
      try {
        loading.value = true
        error.value = null
        const { data, error: err } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })

        if (err) throw err
        if (data) {
          tickets.value = data
          saveLocal()
          subscribeToTickets()
          return data
        }
      } catch (err) {
        console.warn('Could not fetch user tickets from Supabase:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    return tickets.value
  }

  /**
   * Fetch all tickets (Admin only)
   */
  async function fetchAllTickets() {
    if (isSupabaseConfigured && supabase) {
      try {
        loading.value = true
        error.value = null
        const { data, error: err } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false })

        if (err) throw err
        if (data) {
          tickets.value = data
          saveLocal()
          subscribeToTickets()
          return data
        }
      } catch (err) {
        console.warn('Could not fetch admin tickets from Supabase:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    return tickets.value
  }

  let ticketsChannel = null

  /**
   * Subscribe to Realtime support_tickets table changes
   */
  function subscribeToTickets() {
    if (!isSupabaseConfigured || !supabase || !auth.isLoggedIn) return

    if (ticketsChannel) {
      supabase.removeChannel(ticketsChannel)
      ticketsChannel = null
    }

    const channelName = `tickets-live-${auth.isAdmin ? 'admin' : auth.user.id}`
    ticketsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          ...(auth.isAdmin ? {} : { filter: `user_id=eq.${auth.user.id}` })
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const exists = tickets.value.some(t => t.id === payload.new.id)
            if (!exists) {
              tickets.value.unshift(payload.new)
              saveLocal()
              if (auth.isAdmin) {
                toast.info(`🚨 มีการแจ้งปัญหาใหม่จากผู้ใช้: ${payload.new.product_name}`)
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const idx = tickets.value.findIndex(t => t.id === payload.new.id)
            if (idx !== -1) {
              const oldStatus = tickets.value[idx].status
              tickets.value[idx] = { ...tickets.value[idx], ...payload.new }
              saveLocal()

              // Notify user if resolved
              if (!auth.isAdmin && oldStatus === 'pending' && payload.new.status === 'resolved') {
                toast.success(`🎉 การแจ้งปัญหา ${payload.new.product_name} ได้รับการแก้ไขแล้ว!`)
              }
            }
          } else if (payload.eventType === 'DELETE') {
            tickets.value = tickets.value.filter(t => t.id !== payload.old.id)
            saveLocal()
          }
        }
      )
      .subscribe()
  }

  /**
   * Create a new support ticket
   */
  async function createTicket({ order, category, description }) {
    const ticketId = `TCK-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
    const categoryInfo = TICKET_CATEGORIES[category] || TICKET_CATEGORIES.other

    const newTicket = {
      id: ticketId,
      order_id: order.id,
      user_id: auth.user?.id || null,
      username: auth.user?.username || 'Member',
      product_name: order.product_name,
      category,
      title: `${categoryInfo.emoji} ${categoryInfo.label}`,
      description: description.trim(),
      status: 'pending',
      admin_note: null,
      replacement_email: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured && supabase && auth.user?.id) {
      try {
        const { data, error: err } = await supabase
          .from('support_tickets')
          .insert(newTicket)
          .select()
          .single()

        if (err) throw err
        if (data) {
          tickets.value.unshift(data)
          saveLocal()
          return { success: true, ticket: data }
        }
      } catch (err) {
        console.warn('Could not save ticket to Supabase, fallback to local:', err)
      }
    }

    // Local fallback
    tickets.value.unshift(newTicket)
    saveLocal()
    return { success: true, ticket: newTicket }
  }

  /**
   * Admin: Resolve ticket & optionally deliver replacement credentials
   */
  async function resolveTicket({ ticketId, adminNote, newEmail, newPassword, status = 'resolved' }) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: err } = await supabase.rpc('resolve_support_ticket', {
          p_ticket_id: ticketId,
          p_admin_note: adminNote || 'แก้ไขปัญหาเรียบร้อยแล้วครับ',
          p_status: status,
          p_new_email: newEmail || null,
          p_new_password: newPassword || null
        })

        if (err) throw err
      } catch (err) {
        console.error('Error resolving ticket via RPC:', err)
      }
    }

    const t = tickets.value.find(item => item.id === ticketId)
    if (t) {
      t.status = status
      t.admin_note = adminNote
      t.replacement_email = newEmail || null
      t.resolved_at = new Date().toISOString()
      t.updated_at = new Date().toISOString()
      saveLocal()

      // Send In-App Notification to ticket owner
      try {
        const notificationsStore = useNotificationsStore()
        notificationsStore.addNotification({
          type: 'ticket_resolved',
          title: status === 'resolved' ? `🎉 การแจ้งปัญหา ${t.product_name} ได้รับการแก้ไขแล้ว` : `❌ ผลการตรวจสอบการแจ้งปัญหา ${t.product_name}`,
          message: adminNote || (status === 'resolved' ? 'แอดมินดำเนินการแก้ไขและส่งมอบข้อมูลให้เรียบร้อยแล้ว' : 'แอดมินได้ตรวจสอบคำขอแล้ว'),
          link: `/orders/${t.order_id}`,
          userId: t.user_id
        })
      } catch (e) {}
    }
    return { success: true }
  }

  /**
   * Admin: Reject ticket
   */
  async function rejectTicket(ticketId, adminNote = 'ตรวจสอบแล้ว ไม่พบความผิดปกติ') {
    return await resolveTicket({
      ticketId,
      adminNote,
      status: 'rejected'
    })
  }

  function getTicketsByOrderId(orderId) {
    return tickets.value.filter(t => t.order_id === orderId)
  }

  return {
    tickets,
    loading,
    error,
    pendingTicketsCount,
    fetchUserTickets,
    fetchAllTickets,
    subscribeToTickets,
    createTicket,
    resolveTicket,
    rejectTicket,
    getTicketsByOrderId
  }
})
