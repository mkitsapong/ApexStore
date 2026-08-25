<script setup>
import { usePaymentStore } from '../stores/payment'

const payment = usePaymentStore()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-main-grid">
        <!-- Brand -->
        <div>
          <div class="footer-logo">
            ⚡ {{ payment.storeSettings?.storeName || 'ApexStore Premium' }}
          </div>
          <p class="footer-tagline">
            {{ payment.storeSettings?.storeTagline || 'ร้านขายบัญชี Streaming & Digital Subscriptions คุณภาพสูง ราคาถูก พร้อมบริการหลังการขาย 24 ชั่วโมง' }}
          </p>
          <div class="footer-social-row">
            <a href="#" class="social-btn" title="Line Support">💬</a>
            <a href="#" class="social-btn" title="Facebook">📘</a>
            <a href="#" class="social-btn" title="Instagram">📸</a>
          </div>
        </div>

        <!-- Links -->
        <div>
          <h6 class="footer-column-title">ร้านค้า</h6>
          <ul class="footer-link-list">
            <li><RouterLink to="/shop" class="footer-link">สินค้าทั้งหมด</RouterLink></li>
            <li><RouterLink to="/shop?cat=streaming" class="footer-link">🎬 Streaming</RouterLink></li>
            <li><RouterLink to="/shop?cat=music" class="footer-link">🎵 Music</RouterLink></li>
            <li><RouterLink to="/shop?cat=ai" class="footer-link">🤖 AI Tools</RouterLink></li>
          </ul>
        </div>

        <div>
          <h6 class="footer-column-title">บัญชีของฉัน</h6>
          <ul class="footer-link-list">
            <li><RouterLink to="/dashboard" class="footer-link">📊 Dashboard</RouterLink></li>
            <li><RouterLink to="/wallet" class="footer-link">💰 Wallet</RouterLink></li>
            <li><RouterLink to="/orders" class="footer-link">📦 คำสั่งซื้อ</RouterLink></li>
            <li><RouterLink to="/topup" class="footer-link">➕ เติมเงิน</RouterLink></li>
          </ul>
        </div>

        <div>
          <h6 class="footer-column-title">ติดต่อฝ่ายบริการ</h6>
          <ul class="footer-link-list">
            <li class="footer-contact-item">💬 Line: {{ payment.storeSettings?.contactLine || '@apexstore' }}</li>
            <li class="footer-contact-item">📧 {{ payment.storeSettings?.contactEmail || 'support@apexstore.com' }}</li>
            <li class="footer-contact-item">⚡ ระบบอัตโนมัติ 24 ชม.</li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom-bar">
        <p class="footer-copyright">
          © {{ currentYear }} {{ payment.storeSettings?.storeName || 'ApexStore' }}. All rights reserved.
        </p>
        <div class="footer-policy-links">
          <a href="#" class="footer-link">นโยบายความเป็นส่วนตัว</a>
          <a href="#" class="footer-link">เงื่อนไขการให้บริการ</a>
          <a href="#" class="footer-link">การรับประกันและการคืนเงิน</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--glass-border);
  padding: var(--space-12) 0 var(--space-6);
  margin-top: auto;
  background: rgba(3, 7, 18, 0.75);
  backdrop-filter: blur(12px);
}

.footer-main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.footer-logo {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--white);
  margin-bottom: var(--space-3);
  font-family: var(--font-heading);
}

.footer-tagline {
  font-size: 0.875rem;
  color: var(--gray-400);
  line-height: 1.65;
  max-width: 320px;
}

.footer-social-row {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.footer-column-title {
  color: var(--white);
  margin-bottom: var(--space-4);
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-link-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.footer-link {
  font-size: 0.875rem;
  color: var(--gray-400);
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--accent-300);
}

.footer-contact-item {
  font-size: 0.85rem;
  color: var(--gray-400);
  line-height: 1.5;
}

.social-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.social-btn:hover {
  background: var(--glass-hover);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.footer-bottom-bar {
  border-top: 1px solid var(--glass-border);
  padding-top: var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.footer-copyright {
  font-size: 0.8125rem;
  color: var(--gray-500);
}

.footer-policy-links {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .footer-main-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
  }
}

@media (max-width: 600px) {
  .footer-main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
