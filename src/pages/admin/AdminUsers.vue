<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { useToastStore } from '../../stores/toast'
import { mockUsers, formatDate, formatCurrency } from '../../data/mockData'
import { supabase, isSupabaseConfigured } from '../../services/supabase'

const toast = useToastStore()
const users = ref([...mockUsers])
const search = ref('')
const filterRole = ref('all')
const loading = ref(false)

async function fetchUsers() {
  if (isSupabaseConfigured && supabase) {
    try {
      loading.value = true
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        users.value = data.map(u => ({
          id: u.id,
          username: u.username || 'User',
          email: u.email || '-',
          balance: Number(u.balance) || 0,
          role: u.role || 'user',
          total_orders: 0,
          status: u.status || 'active',
          created_at: u.created_at
        }))
      }
    } catch (err) {
      console.error('Error fetching Supabase profiles:', err)
    } finally {
      loading.value = false
    }
  }
}

onMounted(() => {
  fetchUsers()
})

const filtered = () => {
  let list = users.value
  if (filterRole.value !== 'all') list = list.filter(u => u.role === filterRole.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }
  return list
}

async function toggleStatus(u) {
  u.status = u.status === 'active' ? 'suspended' : 'active'
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').update({ status: u.status, updated_at: new Date().toISOString() }).eq('id', u.id)
    } catch (err) {
      console.error('Error updating status in Supabase:', err)
    }
  }
  toast.info(`${u.username}: ${u.status === 'active' ? 'เปิดใช้งาน' : 'ระงับ'}`)
}

async function adjustBalance(u, amount) {
  u.balance = Math.max(0, u.balance + amount)
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').update({ balance: u.balance, updated_at: new Date().toISOString() }).eq('id', u.id)
    } catch (err) {
      console.error('Error adjusting balance in Supabase:', err)
    }
  }
  toast.success(`${u.username}: ยอดเงิน ${amount > 0 ? '+' : ''}${amount}`)
}
</script>


<template>
  <AdminLayout>
    <div class="page-content animate-fade-in">
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">จัดการผู้ใช้</h1>
        <p style="color:var(--gray-500);">{{ users.length }} ผู้ใช้ทั้งหมด</p>
      </div>

      <!-- Search + filter -->
      <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-5); flex-wrap:wrap;">
        <input v-model="search" class="form-input" placeholder="🔍 ค้นหา username หรือ email..." style="flex:1; min-width:200px;" id="user-search" />
        <select v-model="filterRole" class="form-input form-select" style="width:160px;" id="user-role-filter">
          <option value="all">ทุก Role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>ผู้ใช้</th>
              <th>อีเมล</th>
              <th>ยอดเงิน</th>
              <th>สั่งซื้อ</th>
              <th>Role</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered()" :key="u.id">
              <td>
                <div style="display:flex; align-items:center; gap:var(--space-3);">
                  <div class="avatar-placeholder" style="width:34px;height:34px;font-size:0.875rem;background:linear-gradient(135deg,var(--primary-200),var(--accent-500));">
                    {{ u.username[0].toUpperCase() }}
                  </div>
                  <span style="color:var(--white); font-weight:600;">{{ u.username }}</span>
                </div>
              </td>
              <td style="color:var(--gray-400); font-size:0.875rem;">{{ u.email }}</td>
              <td style="color:var(--accent-400); font-weight:700; font-family:var(--font-en);">{{ formatCurrency(u.balance) }}</td>
              <td style="color:var(--gray-300);">{{ u.total_orders }}</td>
              <td>
                <span :class="['badge', u.role === 'admin' ? 'badge-accent' : 'badge-primary']">
                  {{ u.role === 'admin' ? '👑 Admin' : '👤 User' }}
                </span>
              </td>
              <td>
                <button
                  :class="['badge', u.status === 'active' ? 'badge-success' : 'badge-danger']"
                  style="cursor:pointer; border:none; background:inherit;"
                  @click="toggleStatus(u)"
                  :id="`toggle-user-${u.id}`"
                >
                  {{ u.status === 'active' ? '✅ Active' : '🚫 Suspended' }}
                </button>
              </td>
              <td>
                <div style="display:flex; gap:var(--space-2);" v-if="u.role !== 'admin'">
                  <button class="btn btn-sm" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3);" @click="adjustBalance(u, 100)" title="เพิ่มยอด +100">+฿100</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>
