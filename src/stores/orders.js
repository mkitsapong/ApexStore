import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { mockOrders } from '../data/mockData'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'


export const useOrdersStore = defineStore('orders', () => {
  const orders = ref(JSON.parse(localStorage.getItem('sp_orders') || JSON.stringify(mockOrders)))
  const loading = ref(false)
  const error = ref(null)

  function saveLocal() {
    localStorage.setItem('sp_orders', JSON.stringify(orders.value))
  }

  /**
   * Fetch orders for the current user
   */
  async function fetchUserOrders() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return []

    if (isSupabaseConfigured && supabase) {
      try {
        loading.value = true
        error.value = null
        const { data, error: err } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })

        if (err) throw err
        if (data && data.length > 0) {
          orders.value = data
          saveLocal()
          return data
        }
      } catch (err) {
        console.error('Error fetching Supabase user orders:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    // Fallback: Filter by local user id or return existing orders
    return orders.value
  }

  /**
   * Fetch all orders (Admin only)
   */
  async function fetchAllOrders() {
    if (isSupabaseConfigured && supabase) {
      try {
        loading.value = true
        error.value = null
        const { data, error: err } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (err) throw err
        if (data) {
          orders.value = data
          saveLocal()
          subscribeToOrders()
          return data
        }
      } catch (err) {
        console.error('Error fetching Supabase admin orders:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    return orders.value
  }

  let ordersChannel = null

  /**
   * Subscribe to live Realtime updates on orders
   */
  function subscribeToOrders() {
    if (!isSupabaseConfigured || !supabase) return
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return

    if (ordersChannel) {
      supabase.removeChannel(ordersChannel)
      ordersChannel = null
    }

    const channelName = `orders-live-${auth.isAdmin ? 'admin' : auth.user.id}`
    ordersChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(auth.isAdmin ? {} : { filter: `user_id=eq.${auth.user.id}` })
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const exists = orders.value.some(o => o.id === payload.new.id)
            if (!exists) {
              orders.value.unshift(payload.new)
              saveLocal()
              if (auth.isAdmin) {
                try {
                  useToastStore().info(`📦 มีคำสั่งซื้อใหม่เข้ามา: ${payload.new.product_name}`)
                } catch (e) {}
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const idx = orders.value.findIndex(o => o.id === payload.new.id)
            if (idx !== -1) {
              const oldOrder = orders.value[idx]
              orders.value[idx] = { ...orders.value[idx], ...payload.new }
              saveLocal()

              // If order was completed, notify user
              if (oldOrder.status === 'pending' && payload.new.status === 'completed') {
                try {
                  useToastStore().success(`🎉 คำสั่งซื้อ ${payload.new.product_name} ได้รับการอนุมัติแล้ว!`)
                } catch (e) {}
              }
            }
          } else if (payload.eventType === 'DELETE') {

            orders.value = orders.value.filter(o => o.id !== payload.old.id)
            saveLocal()
          }
        }
      )
      .subscribe()
  }

  /**
   * Create a new purchase order
   */
  async function createOrder({ product, packageInfo, amount }) {
    const auth = useAuthStore()
    const orderId = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    const durationDays = Number(packageInfo.duration_days) || Number(product.duration_days) || 30
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

    const newOrder = {
      id: orderId,
      user_id: auth.user?.id || 'demo_user',
      product_id: product.id,
      product_name: product.name,
      product_emoji: product.logo_emoji || '📦',
      package_label: packageInfo.label || `${durationDays} วัน`,
      amount: Number(amount),
      status: 'completed', // Instant delivery
      account_email: `acc.${product.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString().slice(-4)}@apexstore.com`,
      account_password: `Pass@${Date.now().toString().slice(-4)}!`,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }

    if (isSupabaseConfigured && supabase && auth.user?.id) {
      try {
        const { data, error: insertError } = await supabase
          .from('orders')
          .insert({
            id: newOrder.id,
            user_id: auth.user.id,
            product_id: typeof product.id === 'number' ? product.id : null,
            product_name: newOrder.product_name,
            product_emoji: newOrder.product_emoji,
            package_label: newOrder.package_label,
            amount: newOrder.amount,
            status: newOrder.status,
            account_email: newOrder.account_email,
            account_password: newOrder.account_password,
            expires_at: newOrder.expires_at
          })
          .select()
          .single()

        if (insertError) {
          console.warn('Could not insert order into Supabase, falling back to local:', insertError)
        } else if (data) {
          orders.value.unshift(data)
          saveLocal()
          return { success: true, order: data }
        }
      } catch (err) {
        console.error('Error creating Supabase order:', err)
      }
    }

    // Local fallback
    orders.value.unshift(newOrder)
    saveLocal()
    return { success: true, order: newOrder }
  }

  /**
   * Admin: Approve pending order
   */
  async function approveOrder(id, accountEmail, accountPassword) {
    const email = accountEmail || `auto.acc${id.slice(-2)}@example.com`
    const pass = accountPassword || `Pass${id.slice(-4)}!`

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            account_email: email,
            account_password: pass
          })
          .eq('id', id)
      } catch (err) {
        console.error('Error approving order in Supabase:', err)
      }
    }

    const o = orders.value.find(item => item.id === id)
    if (o) {
      o.status = 'completed'
      o.account_email = email
      o.account_password = pass
      saveLocal()
    }
  }

  /**
   * Admin: Reject order
   */
  async function rejectOrder(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status: 'rejected' })
          .eq('id', id)
      } catch (err) {
        console.error('Error rejecting order in Supabase:', err)
      }
    }

    const o = orders.value.find(item => item.id === id)
    if (o) {
      o.status = 'rejected'
      saveLocal()
    }
  }

  function getOrderById(id) {
    return orders.value.find(o => o.id === id)
  }

  return {
    orders,
    loading,
    error,
    fetchUserOrders,
    fetchAllOrders,
    subscribeToOrders,
    createOrder,
    approveOrder,
    rejectOrder,
    getOrderById
  }
})
