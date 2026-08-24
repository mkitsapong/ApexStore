<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPass = ref(false)

async function handleLogin() {
  const res = await auth.login(email.value, password.value)
  if (res.success) {
    const redirect = route.query.redirect || (auth.isAdmin ? '/admin' : '/dashboard')
    router.push(redirect)
  }
}

function fillDemo(type) {
  if (type === 'user') { email.value = 'demo@apexstore.com'; password.value = 'demo1234' }
  else { email.value = 'admin@apexstore.com'; password.value = 'admin1234' }
}
async function handleGoogleLogin() {
  const res = await auth.loginWithGoogle()
  if (res.success && res.user) {
    const redirect = route.query.redirect || (auth.isAdmin ? '/admin' : '/dashboard')
    router.push(redirect)
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="orb" style="width:500px;height:500px;background:var(--primary-200);top:-100px;left:-100px;opacity:0.1;filter:blur(80px);position:fixed;pointer-events:none;"></div>
    <div class="orb" style="width:300px;height:300px;background:var(--accent-500);bottom:0;right:0;opacity:0.07;filter:blur:60px;position:fixed;pointer-events:none;"></div>

    <div class="auth-container">
      <!-- Logo -->
      <RouterLink to="/" class="auth-logo">⚡ Apex<span>Store</span></RouterLink>

      <div class="auth-card">
        <div style="text-align:center; margin-bottom:var(--space-6);">
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-2);">ยินดีต้อนรับกลับ</h1>
          <p style="color:var(--gray-500); font-size:0.9375rem;">เข้าสู่ระบบเพื่อเริ่มต้นช้อปปิ้ง</p>
        </div>

        <!-- Google OAuth Button -->
        <button
          type="button"
          class="google-btn"
          @click="handleGoogleLogin"
          :disabled="auth.loading"
          id="google-login-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>ดำเนินการต่อด้วย Google</span>
        </button>

        <!-- Demo buttons -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3); margin-top:var(--space-3); margin-bottom:var(--space-6);">
          <button class="btn btn-secondary btn-sm" @click="fillDemo('user')">👤 Demo User</button>
          <button class="btn btn-secondary btn-sm" @click="fillDemo('admin')">👑 Demo Admin</button>
        </div>

        <div class="divider" style="margin-bottom:var(--space-6); position:relative;">
          <span style="position:absolute; left:50%; transform:translateX(-50%); top:-10px; background:var(--bg-elevated); padding:0 var(--space-3); font-size:0.8125rem; color:var(--gray-500);">หรือเข้าสู่ระบบด้วยอีเมล</span>
        </div>


        <form @submit.prevent="handleLogin" style="display:flex; flex-direction:column; gap:var(--space-4);">
          <div class="form-group">
            <label class="form-label" for="login-email">อีเมล</label>
            <input id="login-email" v-model="email" type="email" class="form-input" placeholder="your@email.com" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">รหัสผ่าน</label>
            <div style="position:relative;">
              <input
                id="login-password"
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                class="form-input"
                placeholder="••••••••"
                required
              />
              <button type="button" @click="showPass=!showPass" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--gray-500); cursor:pointer; font-size:1rem;">
                {{ showPass ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div v-if="auth.error" style="padding:var(--space-3); background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); color:#f87171; font-size:0.875rem;">
            ❌ {{ auth.error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg" :disabled="auth.loading" style="width:100%; margin-top:var(--space-2);" id="login-submit">
            <div v-if="auth.loading" class="spinner"></div>
            <span v-else>เข้าสู่ระบบ</span>
          </button>
        </form>

        <div style="text-align:center; margin-top:var(--space-6); font-size:0.9rem; color:var(--gray-500);">
          ยังไม่มีบัญชี?
          <RouterLink to="/auth/register" style="color:var(--accent-400); font-weight:600; margin-left:4px;">สมัครสมาชิกฟรี</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.auth-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
}

.auth-logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--white);
  font-family: var(--font-en);
}

.auth-logo span { color: var(--accent-400); }

.auth-card {
  width: 100%;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  backdrop-filter: blur(20px);
}
</style>
