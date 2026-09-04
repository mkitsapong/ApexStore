import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useToastStore } from './toast'


function formatAuthError(msg) {
  if (!msg) return 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
  if (msg.includes('Invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  if (msg.includes('Email not confirmed')) return 'อีเมลนี้ยังไม่ได้ยืนยัน (เช็คกล่องจดหมายในอีเมล หรือปิด Confirm Email ในแดชบอร์ด Supabase)'
  if (msg.includes('User already registered')) return 'อีเมลนี้ถูกใช้งานแล้ว'
  if (msg.includes('Password should be at least')) return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
  if (msg.includes('Email rate limit exceeded')) return 'ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่'
  return msg
}

export const useAuthStore = defineStore('auth', () => {

  // Demo credentials for offline / development fallback
  const DEMO_USERS = [
    { id: 'user1', email: 'demo@apexstore.com', password: 'demo1234', username: 'demo_user', role: 'user', balance: 313, avatar: null },
    { id: 'admin1', email: 'admin@apexstore.com', password: 'admin1234', username: 'admin', role: 'admin', balance: 0, avatar: null },
  ]

  const user = ref(JSON.parse(localStorage.getItem('sp_user') || 'null'))
  const session = ref(null)
  const loading = ref(false)
  const isInitialized = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const balance = computed(() => Number(user.value?.balance ?? 0))

  /**
   * Fetch profile data from Supabase profiles table
   */
  async function fetchProfile(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) return null
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (err) {
        console.warn('Could not fetch profile from Supabase:', err.message)
        return null
      }
      return data
    } catch (e) {
      console.error('Error fetching Supabase profile:', e)
      return null
    }
  }

  /**
   * Initialize Supabase Auth session & listeners on app launch
   */
  async function initAuth() {
    if (isInitialized.value) return
    isInitialized.value = true

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.getSession()
        if (data?.session?.user) {
          session.value = data.session
          const profile = await fetchProfile(data.session.user.id)
          const meta = data.session.user.user_metadata || {}
          const mergedUser = {
            id: data.session.user.id,
            email: data.session.user.email,
            username: profile?.username || meta.full_name || meta.name || meta.username || data.session.user.email.split('@')[0],
            role: profile?.role || meta.role || 'user',
            balance: profile ? Number(profile.balance) : 0,
            avatar: profile?.avatar_url || meta.avatar_url || meta.picture || null
          }
          user.value = mergedUser
          localStorage.setItem('sp_user', JSON.stringify(mergedUser))
          subscribeToProfile(mergedUser.id)
        }

        // Subscribe to auth state changes
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && newSession?.user) {
            session.value = newSession
            const profile = await fetchProfile(newSession.user.id)
            const meta = newSession.user.user_metadata || {}
            const merged = {
              id: newSession.user.id,
              email: newSession.user.email,
              username: profile?.username || meta.full_name || meta.name || meta.username || newSession.user.email.split('@')[0],
              role: profile?.role || meta.role || 'user',
              balance: profile ? Number(profile.balance) : 0,
              avatar: profile?.avatar_url || meta.avatar_url || meta.picture || null
            }
            user.value = merged
            localStorage.setItem('sp_user', JSON.stringify(merged))
            subscribeToProfile(merged.id)
          } else if (event === 'SIGNED_OUT') {
            if (profileSubscription) {
              supabase.removeChannel(profileSubscription)
              profileSubscription = null
            }
            session.value = null
            user.value = null
            localStorage.removeItem('sp_user')
          }
        })
      } catch (err) {
        console.error('Error initializing Supabase auth:', err)
      }
    }
  }

  let profileSubscription = null

  /**
   * Subscribe to live Realtime updates on user's profile
   */
  function subscribeToProfile(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) return
    if (profileSubscription) {
      supabase.removeChannel(profileSubscription)
      profileSubscription = null
    }

    profileSubscription = supabase
      .channel(`profile-live-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && user.value && user.value.id === userId) {
            const oldBalance = Number(user.value.balance || 0)
            const newBalance = Number(payload.new.balance || 0)

            user.value = {
              ...user.value,
              username: payload.new.username || user.value.username,
              role: payload.new.role || user.value.role,
              balance: newBalance,
              avatar: payload.new.avatar_url || user.value.avatar
            }
            localStorage.setItem('sp_user', JSON.stringify(user.value))

            // Toast notification if balance was increased
            if (newBalance > oldBalance) {
              const diff = newBalance - oldBalance
              try {
                const toast = useToastStore()
                toast.success(`🎉 ยอดเงินเข้ากระเป๋า +฿${diff.toLocaleString()} (ยอดคงเหลือ ฿${newBalance.toLocaleString()})`)
              } catch (e) {
                // Pinia might not be mounted in background worker
              }
            }

          }
        }
      )
      .subscribe()
  }


  /**
   * Login user
   */
  async function login(email, password) {
    loading.value = true
    error.value = null

    // 1. If Supabase is configured, use Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        })

        if (sbError) {
          // If demo accounts are attempted on live Supabase without being registered, check fallback
          const demoFound = DEMO_USERS.find(u => u.email === email && u.password === password)
          if (demoFound) {
            const { password: _, ...safeUser } = demoFound
            user.value = safeUser
            localStorage.setItem('sp_user', JSON.stringify(safeUser))
            loading.value = false
            return { success: true }
          }

          error.value = formatAuthError(sbError.message)
          loading.value = false
          return { success: false, error: error.value }
        }

        if (data.user) {
          const profile = await fetchProfile(data.user.id)
          const loggedUser = {
            id: data.user.id,
            email: data.user.email,
            username: profile?.username || data.user.user_metadata?.username || data.user.email.split('@')[0],
            role: profile?.role || data.user.user_metadata?.role || 'user',
            balance: profile ? Number(profile.balance) : 0,
            avatar: profile?.avatar_url || null
          }
          user.value = loggedUser
          localStorage.setItem('sp_user', JSON.stringify(loggedUser))
          loading.value = false
          return { success: true, user: loggedUser }
        }
      } catch (err) {
        console.error('Supabase login error:', err)
        error.value = formatAuthError(err.message) || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
        loading.value = false
        return { success: false, error: error.value }
      }
    }

    // 2. Fallback: Local Demo Auth
    await new Promise(r => setTimeout(r, 600))
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      const { password: _, ...safeUser } = found
      user.value = safeUser
      localStorage.setItem('sp_user', JSON.stringify(safeUser))
      loading.value = false
      return { success: true }
    } else {
      error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (โหมด Demo: demo@apexstore.com / demo1234)'
      loading.value = false
      return { success: false, error: error.value }
    }
  }

  /**
   * Register new user
   */
  async function register(data) {
    loading.value = true
    error.value = null

    // 1. If Supabase configured, register with Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: sbError } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              username: data.username.trim(),
              role: 'user',
              balance: 0
            }
          }
        })

        if (sbError) {
          error.value = formatAuthError(sbError.message)
          loading.value = false
          return { success: false, error: error.value }
        }


        if (authData.user) {
          // Attempt profile upsert just in case trigger is pending
          try {
            await supabase.from('profiles').upsert({
              id: authData.user.id,
              username: data.username.trim(),
              email: data.email.trim(),
              role: 'user',
              balance: 0
            })
          } catch (e) {
            // Trigger might have handled this
          }

          const newUser = {
            id: authData.user.id,
            email: authData.user.email,
            username: data.username.trim(),
            role: 'user',
            balance: 0,
            avatar: null
          }
          user.value = newUser
          localStorage.setItem('sp_user', JSON.stringify(newUser))
          loading.value = false
          return { success: true, user: newUser }
        }
      } catch (err) {
        console.error('Supabase register error:', err)
        error.value = err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน'
        loading.value = false
        return { success: false, error: error.value }
      }
    }

    // 2. Fallback: Local Registration
    await new Promise(r => setTimeout(r, 600))
    if (DEMO_USERS.find(u => u.email === data.email)) {
      error.value = 'อีเมลนี้ถูกใช้งานแล้ว'
      loading.value = false
      return { success: false }
    }
    const newUser = {
      id: 'user_' + Date.now(),
      email: data.email,
      username: data.username,
      role: 'user',
      balance: 0,
      avatar: null
    }
    user.value = newUser
    localStorage.setItem('sp_user', JSON.stringify(newUser))
    loading.value = false
    return { success: true }
  }

  /**
   * Login / Register with Google OAuth
   */
  async function loginWithGoogle() {
    loading.value = true
    error.value = null

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/dashboard'
          }
        })
        if (sbError) throw sbError
        return { success: true, data }
      } catch (err) {
        console.error('Google login error:', err)
        error.value = formatAuthError(err.message) || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google'
        loading.value = false
        return { success: false, error: error.value }
      }
    }

    // Fallback: Demo Google User
    await new Promise(r => setTimeout(r, 600))
    const googleUser = {
      id: 'user_google_' + Date.now(),
      email: 'user.google@apexstore.com',
      username: 'Google_Member',
      role: 'user',
      balance: 350,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
    }
    user.value = googleUser
    localStorage.setItem('sp_user', JSON.stringify(googleUser))
    loading.value = false
    return { success: true, user: googleUser }
  }


  /**
   * Logout user
   */
  async function logout() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.warn('Supabase signOut error:', e)
      }
    }
    user.value = null
    session.value = null
    localStorage.removeItem('sp_user')
    localStorage.removeItem('sp_orders')
    localStorage.removeItem('sp_topup_logs')
    localStorage.removeItem('sp_support_tickets')
  }

  /**
   * Add balance to current user
   */
  async function addBalance(amount) {
    const numAmount = Number(amount)
    if (!user.value || isNaN(numAmount) || numAmount <= 0) return

    const newBalance = Number(user.value.balance) + numAmount
    user.value = { ...user.value, balance: newBalance }
    localStorage.setItem('sp_user', JSON.stringify(user.value))

    if (isSupabaseConfigured && supabase && user.value.id) {
      try {
        // Use RPC add_user_balance if available or update profiles directly
        const { error: rpcErr } = await supabase.rpc('add_user_balance', {
          p_user_id: user.value.id,
          p_amount: numAmount
        })

        if (rpcErr) {
          // Fallback direct update
          await supabase
            .from('profiles')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', user.value.id)
        }
      } catch (err) {
        console.error('Error updating balance in Supabase:', err)
      }
    }
  }

  /**
   * Deduct balance from current user
   */
  async function deductBalance(amount) {
    const numAmount = Number(amount)
    if (!user.value || isNaN(numAmount) || user.value.balance < numAmount) {
      return false
    }

    const newBalance = Number(user.value.balance) - numAmount
    user.value = { ...user.value, balance: newBalance }
    localStorage.setItem('sp_user', JSON.stringify(user.value))

    if (isSupabaseConfigured && supabase && user.value.id) {
      try {
        const { error: rpcErr } = await supabase.rpc('deduct_user_balance', {
          p_user_id: user.value.id,
          p_amount: numAmount
        })

        if (rpcErr) {
          await supabase
            .from('profiles')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', user.value.id)
        }
      } catch (err) {
        console.error('Error deducting balance in Supabase:', err)
      }
    }
    return true
  }

  /**
   * Update user profile
   */
  async function updateProfile(data) {
    if (!user.value) return
    user.value = { ...user.value, ...data }
    localStorage.setItem('sp_user', JSON.stringify(user.value))

    if (isSupabaseConfigured && supabase && user.value.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            username: data.username || user.value.username,
            avatar_url: data.avatar || user.value.avatar,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.value.id)
      } catch (err) {
        console.error('Error updating profile in Supabase:', err)
      }
    }
  }

  return {
    user,
    session,
    loading,
    error,
    isInitialized,
    isLoggedIn,
    isAdmin,
    balance,
    initAuth,
    fetchProfile,
    login,
    register,
    loginWithGoogle,
    logout,
    addBalance,
    deductBalance,
    updateProfile
  }
})
