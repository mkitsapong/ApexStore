import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Demo credentials
  const DEMO_USERS = [
    { id: 'user1', email: 'demo@apexstore.com', password: 'demo1234', username: 'demo_user', role: 'user', balance: 313, avatar: null },
    { id: 'admin1', email: 'admin@apexstore.com', password: 'admin1234', username: 'admin', role: 'admin', balance: 0, avatar: null },
  ]

  const user = ref(JSON.parse(localStorage.getItem('sp_user') || 'null'))
  const loading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const balance = computed(() => user.value?.balance ?? 0)

  async function login(email, password) {
    loading.value = true
    error.value = null
    await new Promise(r => setTimeout(r, 800)) // simulate API
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      const { password: _, ...safeUser } = found
      user.value = safeUser
      localStorage.setItem('sp_user', JSON.stringify(safeUser))
      loading.value = false
      return { success: true }
    } else {
      error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      loading.value = false
      return { success: false }
    }
  }

  async function register(data) {
    loading.value = true
    error.value = null
    await new Promise(r => setTimeout(r, 1000))
    // Check if email already exists
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

  function logout() {
    user.value = null
    localStorage.removeItem('sp_user')
  }

  function addBalance(amount) {
    if (user.value) {
      user.value = { ...user.value, balance: user.value.balance + amount }
      localStorage.setItem('sp_user', JSON.stringify(user.value))
    }
  }

  function deductBalance(amount) {
    if (user.value && user.value.balance >= amount) {
      user.value = { ...user.value, balance: user.value.balance - amount }
      localStorage.setItem('sp_user', JSON.stringify(user.value))
      return true
    }
    return false
  }

  function updateProfile(data) {
    if (user.value) {
      user.value = { ...user.value, ...data }
      localStorage.setItem('sp_user', JSON.stringify(user.value))
    }
  }

  return {
    user, loading, error,
    isLoggedIn, isAdmin, balance,
    login, register, logout, addBalance, deductBalance, updateProfile
  }
})
