<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ username: '', email: '', password: '', confirmPassword: '', agree: false })
const showPass = ref(false)
const errors = ref({})

function validate() {
  errors.value = {}
  if (!form.value.username || form.value.username.length < 3) errors.value.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'
  if (!form.value.email || !form.value.email.includes('@')) errors.value.email = 'กรุณาใส่อีเมลที่ถูกต้อง'
  if (!form.value.password || form.value.password.length < 6) errors.value.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
  if (form.value.password !== form.value.confirmPassword) errors.value.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
  if (!form.value.agree) errors.value.agree = 'กรุณายอมรับเงื่อนไขการใช้งาน'
  return Object.keys(errors.value).length === 0
}

async function handleRegister() {
  if (!validate()) return
  const res = await auth.register({
    email: form.value.email,
    username: form.value.username,
    password: form.value.password
  })
  if (res.success) router.push('/dashboard')
}

async function handleGoogleRegister() {
  const res = await auth.loginWithGoogle()
  if (res.success && res.user) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <RouterLink to="/" class="auth-logo">⚡ Apex<span>Store</span></RouterLink>

      <div class="auth-card">
        <div style="text-align:center; margin-bottom:var(--space-6);">
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-2);">สมัครสมาชิกฟรี</h1>
          <p style="color:var(--gray-500);">เริ่มต้นซื้อบัญชี Premium ได้ทันที</p>
        </div>

        <!-- Google OAuth Button -->
        <button
          type="button"
          class="google-btn"
          @click="handleGoogleRegister"
          :disabled="auth.loading"
          id="google-register-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>สมัครด้วยบัญชี Google</span>
        </button>

        <div class="divider" style="margin:var(--space-6) 0; position:relative;">
          <span style="position:absolute; left:50%; transform:translateX(-50%); top:-10px; background:var(--bg-elevated); padding:0 var(--space-3); font-size:0.8125rem; color:var(--gray-500);">หรือกรอกข้อมูลสมัครสมาชิก</span>
        </div>


        <form @submit.prevent="handleRegister" style="display:flex; flex-direction:column; gap:var(--space-4);">
          <div class="form-group">
            <label class="form-label" for="reg-username">ชื่อผู้ใช้</label>
            <input id="reg-username" v-model="form.username" type="text" class="form-input" placeholder="ชื่อผู้ใช้ของคุณ" />
            <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">อีเมล</label>
            <input id="reg-email" v-model="form.email" type="email" class="form-input" placeholder="your@email.com" />
            <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">รหัสผ่าน</label>
            <div style="position:relative;">
              <input id="reg-password" v-model="form.password" :type="showPass ? 'text' : 'password'" class="form-input" placeholder="อย่างน้อย 6 ตัวอักษร" />
              <button type="button" @click="showPass=!showPass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-500);">{{ showPass ? '🙈' : '👁️' }}</button>
            </div>
            <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-confirm">ยืนยันรหัสผ่าน</label>
            <input id="reg-confirm" v-model="form.confirmPassword" :type="showPass ? 'text' : 'password'" class="form-input" placeholder="ยืนยันรหัสผ่าน" />
            <span v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</span>
          </div>

          <label style="display:flex; align-items:flex-start; gap:var(--space-3); cursor:pointer;">
            <input id="reg-agree" v-model="form.agree" type="checkbox" style="margin-top:3px; accent-color:var(--accent-400);" />
            <span style="font-size:0.875rem; color:var(--gray-400); line-height:1.5;">
              ฉันยอมรับ <a href="#" style="color:var(--accent-400);">เงื่อนไขการให้บริการ</a> และ <a href="#" style="color:var(--accent-400);">นโยบายความเป็นส่วนตัว</a>
            </span>
          </label>
          <span v-if="errors.agree" class="form-error">{{ errors.agree }}</span>

          <div v-if="auth.error" style="padding:var(--space-3); background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); color:#f87171; font-size:0.875rem;">
            ❌ {{ auth.error }}
          </div>

          <button type="submit" id="register-submit" class="btn btn-primary btn-lg" :disabled="auth.loading" style="width:100%;">
            <div v-if="auth.loading" class="spinner"></div>
            <span v-else>🚀 สมัครสมาชิก</span>
          </button>
        </form>

        <div style="text-align:center; margin-top:var(--space-6); font-size:0.9rem; color:var(--gray-500);">
          มีบัญชีแล้ว? <RouterLink to="/auth/login" style="color:var(--accent-400); font-weight:600; margin-left:4px;">เข้าสู่ระบบ</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:var(--space-6); }
.auth-container { width:100%; max-width:440px; display:flex; flex-direction:column; align-items:center; gap:var(--space-6); }
.auth-logo { font-size:1.5rem; font-weight:800; color:var(--white); font-family:var(--font-en); }
.auth-logo span { color:var(--accent-400); }
.auth-card { width:100%; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-xl); padding:var(--space-8); backdrop-filter:blur(20px); }
</style>
