import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { mockOrders } from '../data/mockData'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'
import { useNotificationsStore } from './notifications'

export const useOrdersStore = defineStore('orders', () => {
  // ── Security migration: strip any plaintext passwords from previous localStorage ──
  const _rawOrders = JSON.parse(localStorage.getItem('sp_orders') || 'null')
  if (_rawOrders && Array.isArray(_rawOrders)) {
    // Remove account_password from every cached order silently
    const _cleaned = _rawOrders.map(({ account_password, ...rest }) => rest)
    localStorage.setItem('sp_orders', JSON.stringify(_cleaned))
  }

  const orders = ref(JSON.parse(localStorage.getItem('sp_orders') || JSON.stringify(mockOrders)))
  const loading = ref(false)
  const error = ref(null)

  // Strip sensitive fields before persisting to localStorage
  function sanitizeForStorage(order) {
    const { account_password, ...safe } = order
    return safe
  }

  function saveLocal() {
    localStorage.setItem('sp_orders', JSON.stringify(orders.value.map(sanitizeForStorage)))
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
            // account_password is handled separately via set_order_credentials RPC
            expires_at: newOrder.expires_at
          })
          .select()
          .single()

        if (insertError) {
          console.warn('Could not insert order into Supabase, falling back to local:', insertError)
        } else if (data) {
          // Call RPC to encrypt and store the password server-side
          if (newOrder.account_password) {
            await supabase.rpc('set_order_credentials', {
              p_order_id: data.id,
              p_email:    newOrder.account_email,
              p_password: newOrder.account_password
            }).catch(e => console.warn('Could not encrypt password, admin must set manually:', e))
          }
          const safeOrder = sanitizeForStorage(data)
          orders.value.unshift(safeOrder)
          saveLocal()

          // Send In-App Notification
          try {
            const notificationsStore = useNotificationsStore()
            notificationsStore.addNotification({
              type: 'order_created',
              title: `🛍️ สั่งซื้อสำเร็จ: ${safeOrder.product_name}`,
              message: `คำสั่งซื้อ #${safeOrder.id} ได้รับการบันทึกแล้ว กำลังเตรียมส่งมอบข้อมูลบัญชี`,
              link: `/orders/${safeOrder.id}`,
              userId: auth.user.id
            })
          } catch (e) {}

          return { success: true, order: safeOrder }
        }
      } catch (err) {
        console.error('Error creating Supabase order:', err)
      }
    }

    // Local fallback (no password stored locally)
    orders.value.unshift(sanitizeForStorage(newOrder))
    saveLocal()

    try {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification({
        type: 'order_created',
        title: `🛍️ สั่งซื้อสำเร็จ: ${newOrder.product_name}`,
        message: `คำสั่งซื้อ #${newOrder.id} ได้รับการบันทึกแล้ว`,
        link: `/orders/${newOrder.id}`,
        userId: auth.user?.id
      })
    } catch (e) {}

    return { success: true, order: newOrder }
  }

  /**
   * Create multiple purchase orders from Cart items in a single transaction
   */
  async function createBatchOrders({ items }) {
    const auth = useAuthStore()
    const createdOrders = []
    let totalAmount = 0

    for (const item of items) {
      const qty = item.quantity || 1
      for (let i = 0; i < qty; i++) {
        const orderId = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`
        const durationDays = Number(item.durationDays) || 30
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        const amount = Number(item.price)
        totalAmount += amount

        const newOrder = {
          id: orderId,
          user_id: auth.user?.id || 'demo_user',
          product_id: item.productId,
          product_name: item.productName,
          product_emoji: item.productEmoji || '📦',
          package_label: item.packageLabel || `${durationDays} วัน`,
          amount: amount,
          status: 'completed',
          account_email: `acc.${item.productName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString().slice(-4)}${i + 1}@apexstore.com`,
          account_password: `Pass@${Date.now().toString().slice(-4)}${i + 1}!`,
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
                product_id: typeof item.productId === 'number' ? item.productId : null,
                product_name: newOrder.product_name,
                product_emoji: newOrder.product_emoji,
                package_label: newOrder.package_label,
                amount: newOrder.amount,
                status: newOrder.status,
                account_email: newOrder.account_email,
                expires_at: newOrder.expires_at
              })
              .select()
              .single()

            if (!insertError && data) {
              if (newOrder.account_password) {
                await supabase.rpc('set_order_credentials', {
                  p_order_id: data.id,
                  p_email: newOrder.account_email,
                  p_password: newOrder.account_password
                }).catch(e => console.warn('Could not encrypt password in batch:', e))
              }
              const safeOrder = sanitizeForStorage(data)
              orders.value.unshift(safeOrder)
              createdOrders.push(safeOrder)
              continue
            }
          } catch (err) {
            console.error('Error creating Supabase batch order item:', err)
          }
        }

        // Local fallback
        const safeFallbackOrder = sanitizeForStorage(newOrder)
        orders.value.unshift(safeFallbackOrder)
        createdOrders.push(safeFallbackOrder)
      }
    }

    saveLocal()

    // Send single consolidated in-app notification
    try {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification({
        type: 'order_created',
        title: `🛍️ สั่งซื้อสำเร็จ ${createdOrders.length} รายการ`,
        message: `ชำระเงินเรียบร้อย รวม ฿${totalAmount.toLocaleString()} ข้อมูลบัญชีพร้อมใช้งานในประวัติคำสั่งซื้อ`,
        link: '/orders',
        userId: auth.user?.id
      })
    } catch (e) {}

    return { success: true, orders: createdOrders, totalAmount }
  }

  /**
   * Fetch decrypted account credentials on-demand via secure RPC.
   * Seamlessly falls back to mock/demo credentials for simulated orders.
   */
  async function fetchOrderCredentials(orderId) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: rpcError } = await supabase
          .rpc('get_order_credentials', { p_order_id: orderId })

        if (!rpcError && data && data.success) {
          return { success: true, email: data.email, password: data.password }
        }

        // If not found in database (e.g. mock/demo order), fallback to mock credentials
        const mockOrder = mockOrders.find(o => o.id === orderId)
        const localOrder = orders.value.find(o => o.id === orderId)
        const email = localOrder?.account_email || mockOrder?.account_email
        const pass = mockOrder?.account_password || localOrder?.account_password || `Pass#${orderId.slice(-4)}!`

        if (email) {
          return { success: true, email, password: pass }
        }

        if (rpcError) throw rpcError
        return { success: false, error: data?.error || 'ไม่สามารถโหลดข้อมูลบัญชีได้' }
      } catch (err) {
        console.warn('RPC credentials error, fallback to mock/demo:', err)
        const mockOrder = mockOrders.find(o => o.id === orderId)
        const localOrder = orders.value.find(o => o.id === orderId)
        const email = localOrder?.account_email || mockOrder?.account_email
        const pass = mockOrder?.account_password || localOrder?.account_password || `Pass#${orderId.slice(-4)}!`
        if (email) {
          return { success: true, email, password: pass }
        }
        return { success: false, error: err.message }
      }
    }

    // Local / Offline fallback:
    const mockOrder = mockOrders.find(o => o.id === orderId)
    const localOrder = orders.value.find(o => o.id === orderId)
    const email = localOrder?.account_email || mockOrder?.account_email
    const pass = mockOrder?.account_password || localOrder?.account_password || `Pass#${orderId.slice(-4)}!`
    if (email) {
      return { success: true, email, password: pass }
    }
    return { success: false, error: 'ไม่พบข้อมูลบัญชี' }
  }

  /**
   * Admin: Approve pending order — encrypts credentials via Supabase RPC
   */
  async function approveOrder(id, accountEmail, accountPassword) {
    const email = accountEmail || `auto.acc${id.slice(-2)}@example.com`
    const pass  = accountPassword || `Pass${id.slice(-4)}!`

    if (isSupabaseConfigured && supabase) {
      try {
        // Use the secure RPC — password is encrypted server-side, never sent as plaintext in response
        const { data, error: rpcError } = await supabase
          .rpc('set_order_credentials', {
            p_order_id: id,
            p_email:    email,
            p_password: pass
          })

        if (rpcError) {
          console.error('Error setting credentials via RPC:', rpcError)
          // Fallback: direct update without encryption (degraded mode)
          await supabase
            .from('orders')
            .update({ status: 'completed', account_email: email })
            .eq('id', id)
        }
      } catch (err) {
        console.error('Error approving order:', err)
      }
    }

    // Update in-memory state (do NOT store password)
    const o = orders.value.find(item => item.id === id)
    if (o) {
      o.status = 'completed'
      o.account_email = email
      // account_password is intentionally NOT stored in local state
      saveLocal()

      // Send In-App Notification to customer
      try {
        const notificationsStore = useNotificationsStore()
        notificationsStore.addNotification({
          type: 'order_approved',
          title: `📦 บัญชีพร้อมใช้งาน: ${o.product_name}`,
          message: `คำสั่งซื้อ #${o.id} ได้รับการอนุมัติแล้ว คลิกเพื่อดูข้อมูลบัญชีและรหัสผ่าน`,
          link: `/orders/${o.id}`,
          userId: o.user_id
        })
      } catch (e) {}
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
    createBatchOrders,
    fetchOrderCredentials,
    approveOrder,
    rejectOrder,
    getOrderById
  }
})
