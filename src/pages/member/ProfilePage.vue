<script setup>
import { ref } from 'vue'
import DashboardLayout from '../../components/DashboardLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'

const auth = useAuthStore()
const toast = useToastStore()

const form = ref({
  username: auth.user?.username || '',
  email: auth.user?.email || '',
  phone: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const savingProfile = ref(false)
const savingPassword = ref(false)
const passError = ref('')

async function saveProfile() {
  savingProfile.value = true
  await new Promise(r => setTimeout(r, 800))
  auth.updateProfile({ username: form.value.username })
  savingProfile.value = false
  toast.success('บันทึกข้อมูลสำเร็จ')
}

async function changePassword() {
  passError.value = ''
  if (form.value.newPassword.length < 6) { passError.value = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'; return }
  if (form.value.newPassword !== form.value.confirmPassword) { passError.value = 'รหัสผ่านไม่ตรงกัน'; return }
  savingPassword.value = true
  await new Promise(r => setTimeout(r, 800))
  savingPassword.value = false
  toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
  form.value.currentPassword = ''
  form.value.newPassword = ''
  form.value.confirmPassword = ''
}
</script>

<template>
  <DashboardLayout>
    <div class="page-content animate-fade-in">
      <div style="margin-bottom:var(--space-8);">
        <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">โปรไฟล์</h1>
        <p style="color:var(--gray-500);">จัดการข้อมูลส่วนตัว</p>
      </div>

      <div style="display:grid; grid-template-columns:280px 1fr; gap:var(--space-6); align-items:start;">
        <!-- Avatar card -->
        <div class="card" style="text-align:center;">
          <div class="avatar-placeholder" style="width:80px;height:80px;font-size:2rem;margin:0 auto var(--space-4);background:linear-gradient(135deg,var(--primary-200),var(--accent-500));">
            {{ auth.user?.username?.[0]?.toUpperCase() }}
          </div>
          <h3 style="font-size:1.1rem;">{{ auth.user?.username }}</h3>
          <p style="font-size:0.875rem; color:var(--gray-500); margin-top:var(--space-1);">{{ auth.user?.email }}</p>
          <span class="badge badge-accent" style="margin-top:var(--space-3);">{{ auth.isAdmin ? '👑 Admin' : '👤 Member' }}</span>
          <div class="divider"></div>
          <div style="font-size:0.8125rem; color:var(--gray-500);">ยอดเงินคงเหลือ</div>
          <div style="font-size:1.5rem; font-weight:800; color:var(--accent-400); font-family:var(--font-en);">฿{{ auth.balance.toLocaleString() }}</div>
          <RouterLink to="/topup" class="btn btn-primary btn-sm" style="margin-top:var(--space-3); width:100%;">➕ เติมเงิน</RouterLink>
        </div>

        <div style="display:flex; flex-direction:column; gap:var(--space-5);">
          <!-- Profile form -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-5);">ข้อมูลส่วนตัว</h3>
            <form @submit.prevent="saveProfile" style="display:flex; flex-direction:column; gap:var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="profile-username">ชื่อผู้ใช้</label>
                <input id="profile-username" v-model="form.username" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label" for="profile-email">อีเมล</label>
                <input id="profile-email" v-model="form.email" type="email" class="form-input" disabled style="opacity:0.5;" />
                <span class="form-error" style="color:var(--gray-500);">ไม่สามารถเปลี่ยนอีเมลได้</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="profile-phone">เบอร์โทร (ไม่จำเป็น)</label>
                <input id="profile-phone" v-model="form.phone" type="tel" class="form-input" placeholder="08x-xxx-xxxx" />
              </div>
              <div style="display:flex; justify-content:flex-end;">
                <button type="submit" class="btn btn-primary" :disabled="savingProfile" id="save-profile-btn">
                  <div v-if="savingProfile" class="spinner" style="width:16px;height:16px;"></div>
                  <span v-else>💾 บันทึก</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Password form -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-5);">เปลี่ยนรหัสผ่าน</h3>
            <form @submit.prevent="changePassword" style="display:flex; flex-direction:column; gap:var(--space-4);">
              <div class="form-group">
                <label class="form-label" for="current-pass">รหัสผ่านปัจจุบัน</label>
                <input id="current-pass" v-model="form.currentPassword" type="password" class="form-input" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label" for="new-pass">รหัสผ่านใหม่</label>
                <input id="new-pass" v-model="form.newPassword" type="password" class="form-input" placeholder="อย่างน้อย 6 ตัวอักษร" />
              </div>
              <div class="form-group">
                <label class="form-label" for="confirm-pass">ยืนยันรหัสผ่านใหม่</label>
                <input id="confirm-pass" v-model="form.confirmPassword" type="password" class="form-input" placeholder="ยืนยันรหัสผ่าน" />
              </div>
              <div v-if="passError" style="color:#f87171; font-size:0.875rem;">❌ {{ passError }}</div>
              <div style="display:flex; justify-content:flex-end;">
                <button type="submit" class="btn btn-primary" :disabled="savingPassword" id="change-pass-btn">
                  <div v-if="savingPassword" class="spinner" style="width:16px;height:16px;"></div>
                  <span v-else>🔒 เปลี่ยนรหัสผ่าน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
@media (max-width: 768px) {
  div[style*="grid-template-columns:280px 1fr"] { grid-template-columns: 1fr !important; }
}
</style>
