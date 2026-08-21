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
</script>

<template>
  <div class="auth-page">
    <div class="orb" style="width:500px;height:500px;background:var(--primary-200);top:-100px;left:-100px;opacity:0.1;filter:blur(80px);position:fixed;pointer-events:none;"></div>
    <div class="orb" style="width:300px;height:300px;background:var(--accent-500);bottom:0;right:0;opacity:0.07;filter:blur:60px;position:fixed;pointer-events:none;"></div>

    <div class="auth-container">
      <!-- Logo -->
      <RouterLink to="/" class="auth-logo">⚡ Apex<span>Store</span></RouterLink>

      <div class="auth-card">
        <div style="text-align:center; margin-bottom:var(--space-8);">
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-2);">ยินดีต้อนรับกลับ</h1>
          <p style="color:var(--gray-500); font-size:0.9375rem;">เข้าสู่ระบบเพื่อเริ่มต้นช้อปปิ้ง</p>
        </div>

        <!-- Demo buttons -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3); margin-bottom:var(--space-6);">
          <button class="btn btn-secondary btn-sm" @click="fillDemo('user')">👤 Demo User</button>
          <button class="btn btn-secondary btn-sm" @click="fillDemo('admin')">👑 Demo Admin</button>
        </div>

        <div class="divider" style="margin-bottom:var(--space-6); position:relative;">
          <span style="position:absolute; left:50%; transform:translateX(-50%); top:-10px; background:var(--bg-elevated); padding:0 var(--space-3); font-size:0.8125rem; color:var(--gray-500);">หรือ</span>
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
