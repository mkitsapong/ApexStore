<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useToastStore } from '../stores/toast'
import { formatCurrency } from '../data/mockData'

const router = useRouter()
const route = useRoute()
const cart = useCartStore()
const auth = useAuthStore()
const ordersStore = useOrdersStore()
const toast = useToastStore()

function handleClose() {
  cart.closeCart()
}

function handleGoToShop() {
  cart.closeCart()
  router.push('/shop')
}

function handleGoToTopup() {
  cart.closeCart()
  router.push('/topup')
}

function handleGoToLogin() {
  cart.closeCart()
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

async function handleCheckout() {
  if (!auth.isLoggedIn) {
    handleGoToLogin()
    return
  }

  if (cart.items.length === 0) {
    toast.error('ไม่มีสินค้าในตะกร้า')
    return
  }

  if (!cart.isBalanceSufficient) {
    toast.error(`ยอดเงินไม่เพียงพอ (ขาดอีก ${formatCurrency(cart.balanceDeficit)}) กรุณาเติมเงิน`)
    return
  }

  cart.isCheckingOut = true

  try {
    // 1. Deduct balance from wallet
    const deducted = await auth.deductBalance(cart.totalPrice)
    if (!deducted) {
      toast.error('ยอดเงินไม่เพียงพอ กรุณาเติมเงิน')
      cart.isCheckingOut = false
      return
    }

    // 2. Create batch orders in store / Supabase
    const result = await ordersStore.createBatchOrders({
      items: cart.items
    })

    if (result.success) {
      toast.success(`🎉 ชำระเงินสำเร็จ ${result.orders.length} รายการ! ตรวจสอบบัญชีได้ที่คำสั่งซื้อ`)
      
      // 3. Clear cart & close drawer
      cart.clearCart()
      cart.closeCart()

      // 4. Redirect to Orders page
      router.push('/orders')
    } else {
      toast.error('เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาติดต่อแอดมิน')
    }
  } catch (err) {
    console.error('Checkout error:', err)
    toast.error('เกิดข้อผิดพลาดระหว่างชำระเงิน: ' + (err.message || 'ไม่ทราบสาเหตุ'))
  } finally {
    cart.isCheckingOut = false
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop Overlay -->
    <Transition name="fade">
      <div
        v-if="cart.isOpen"
        class="cart-overlay"
        @click="handleClose"
      ></div>
    </Transition>

    <!-- Slide-over Drawer -->
    <Transition name="slide">
      <aside
        v-if="cart.isOpen"
        class="cart-drawer"
        role="dialog"
        aria-label="ตะกร้าสินค้า"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="cart-header">
          <div class="cart-title-row">
            <div class="cart-title-icon">🛒</div>
            <div>
              <h2 class="cart-title">ตะกร้าสินค้า</h2>
              <p class="cart-subtitle">
                {{ cart.totalItems > 0 ? `เลือกไว้ ${cart.totalItems} รายการ` : 'ยังไม่มีสินค้า' }}
              </p>
            </div>
          </div>
          <button
            class="cart-close-btn"
            @click="handleClose"
            title="ปิดตะกร้า (Esc)"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        <!-- Body: Cart Items List / Empty State -->
        <div class="cart-body">
          <!-- Empty State -->
          <div v-if="cart.items.length === 0" class="cart-empty-state">
            <div class="cart-empty-icon">🛍️</div>
            <h3 class="cart-empty-title">ตะกร้าของคุณยังว่างอยู่</h3>
            <p class="cart-empty-desc">
              เลือกซื้อบัญชี Premium Apps ราคาประหยัด พร้อมส่งมอบรหัสเข้าใช้งานได้ทันที
            </p>
            <button class="btn btn-primary" @click="handleGoToShop">
              🛒 ไปเลือกร้านค้า
            </button>
          </div>

          <!-- Items List -->
          <div v-else class="cart-items-list">
            <div
              v-for="item in cart.items"
              :key="item.id"
              class="cart-item-card"
            >
              <!-- Thumbnail / Emoji -->
              <div class="cart-item-media" :style="{ backgroundColor: (item.color || '#F97316') + '20', borderColor: (item.color || '#F97316') + '40' }">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.productName"
                  class="cart-item-img"
                  @error="$event.target.style.display='none'"
                />
                <span v-else class="cart-item-emoji">{{ item.productEmoji || '📦' }}</span>
              </div>

              <!-- Details -->
              <div class="cart-item-info">
                <div class="cart-item-top">
                  <h4 class="cart-item-name">{{ item.productName }}</h4>
                  <button
                    class="cart-item-del-btn"
                    @click="cart.removeItem(item.id)"
                    title="ลบรายการนี้"
                  >
                    🗑️
                  </button>
                </div>

                <div class="cart-item-tags">
                  <span class="cart-pkg-badge">⏱️ {{ item.packageLabel }}</span>
                  <span class="cart-duration-badge">⏳ {{ item.durationDays }} วัน</span>
                </div>

                <div class="cart-item-bottom">
                  <!-- Pricing -->
                  <div class="cart-item-price-wrap">
                    <span class="cart-item-price">{{ formatCurrency(item.price * item.quantity) }}</span>
                    <span
                      v-if="item.originalPrice && item.originalPrice > item.price"
                      class="cart-item-orig-price"
                    >
                      {{ formatCurrency(item.originalPrice * item.quantity) }}
                    </span>
                  </div>

                  <!-- Quantity Controls -->
                  <div class="cart-qty-ctrl">
                    <button
                      class="qty-btn"
                      @click="cart.decrementQuantity(item.id)"
                      :disabled="cart.isCheckingOut"
                      title="ลดจำนวน"
                    >
                      -
                    </button>
                    <span class="qty-val">{{ item.quantity }}</span>
                    <button
                      class="qty-btn"
                      @click="cart.incrementQuantity(item.id)"
                      :disabled="cart.isCheckingOut"
                      title="เพิ่มจำนวน"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Clear Cart Shortcut -->
            <div class="cart-clear-wrap">
              <button
                class="cart-clear-btn"
                @click="cart.clearCart"
                :disabled="cart.isCheckingOut"
              >
                ล้างรายการทั้งหมดในตะกร้า
              </button>
            </div>
          </div>
        </div>

        <!-- Footer: Balance Status & Checkout Actions -->
        <div v-if="cart.items.length > 0" class="cart-footer">
          <!-- 1. Wallet Balance Preview -->
          <div class="cart-balance-box">
            <div v-if="auth.isLoggedIn" class="balance-status-row">
              <div class="balance-left">
                <span class="balance-label">💰 กระเป๋าเงินของคุณ:</span>
                <strong class="balance-val">{{ formatCurrency(auth.balance) }}</strong>
              </div>

              <!-- Sufficiency status badge -->
              <div v-if="cart.isBalanceSufficient" class="balance-status-badge success">
                ✅ เพียงพอ
              </div>
              <div v-else class="balance-status-badge warning">
                ⚠️ ขาดอีก {{ formatCurrency(cart.balanceDeficit) }}
              </div>
            </div>

            <div v-else class="balance-status-row not-logged-in">
              <span class="balance-label">🔐 ยังไม่ได้เข้าสู่ระบบ</span>
              <button class="btn btn-secondary btn-sm" @click="handleGoToLogin">
                เข้าสู่ระบบ
              </button>
            </div>

            <!-- Warning if balance not enough -->
            <div v-if="auth.isLoggedIn && !cart.isBalanceSufficient" class="balance-deficit-alert">
              <span>ยอดเงินในกระเป๋าไม่พอชำระบิลนี้</span>
              <button class="btn btn-accent-sm" @click="handleGoToTopup">
                ➕ เติมเงินเพิ่ม {{ formatCurrency(cart.balanceDeficit) }} →
              </button>
            </div>

            <div v-else-if="auth.isLoggedIn && cart.isBalanceSufficient" class="balance-remain-hint">
              <span>ยอดเงินคงเหลือหลังชำระ:</span>
              <strong style="color:var(--gray-300);">{{ formatCurrency(cart.remainingBalanceAfterPurchase) }}</strong>
            </div>
          </div>

          <!-- 2. Cost Breakdown -->
          <div class="cart-summary-card">
            <div class="summary-line">
              <span class="summary-label">ยอดรวมสินค้า ({{ cart.totalItems }} ชิ้น)</span>
              <span class="summary-val">{{ formatCurrency(cart.totalOriginalPrice) }}</span>
            </div>

            <div v-if="cart.totalSavings > 0" class="summary-line savings">
              <span class="summary-label">✨ ส่วนลดที่คุณประหยัด</span>
              <span class="summary-val text-success">-{{ formatCurrency(cart.totalSavings) }}</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-line total">
              <span class="summary-label">ยอดชำระสุทธิ (Net Total)</span>
              <span class="summary-total-val">{{ formatCurrency(cart.totalPrice) }}</span>
            </div>
          </div>

          <!-- 3. Checkout Button -->
          <div class="cart-actions">
            <!-- If logged in & sufficient -->
            <button
              v-if="auth.isLoggedIn && cart.isBalanceSufficient"
              class="btn btn-primary btn-lg cart-checkout-btn"
              :disabled="cart.isCheckingOut"
              @click="handleCheckout"
              id="btn-cart-checkout"
            >
              <span v-if="cart.isCheckingOut" class="spinner-inline"></span>
              <span v-else>🚀 ชำระเงินด้วย Wallet ({{ formatCurrency(cart.totalPrice) }})</span>
            </button>

            <!-- If logged in but insufficient balance -->
            <button
              v-else-if="auth.isLoggedIn && !cart.isBalanceSufficient"
              class="btn btn-warning btn-lg cart-checkout-btn"
              @click="handleGoToTopup"
              id="btn-cart-topup"
            >
              💳 เติมเงิน Wallet ก่อนชำระ (ขาด {{ formatCurrency(cart.balanceDeficit) }})
            </button>

            <!-- If not logged in -->
            <button
              v-else
              class="btn btn-primary btn-lg cart-checkout-btn"
              @click="handleGoToLogin"
              id="btn-cart-login"
            >
              🔐 เข้าสู่ระบบเพื่อชำระเงิน
            </button>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay Backdrop */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9998;
}

/* Drawer Window */
.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 440px;
  background: #081120;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  color: var(--white);
}

/* Header */
.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--glass-border);
  background: rgba(11, 23, 48, 0.85);
  backdrop-filter: blur(10px);
}

.cart-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.cart-title-icon {
  font-size: 1.5rem;
  width: 42px;
  height: 42px;
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--white);
  line-height: 1.2;
}

.cart-subtitle {
  font-size: 0.8125rem;
  color: var(--gray-400);
  margin-top: 2px;
}

.cart-close-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--gray-300);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cart-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
  transform: rotate(90deg);
}

/* Body */
.cart-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

/* Empty State */
.cart-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-4);
  height: 100%;
}

.cart-empty-icon {
  font-size: 3.5rem;
  margin-bottom: var(--space-4);
  animation: float 3s ease-in-out infinite;
}

.cart-empty-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: var(--space-2);
}

.cart-empty-desc {
  font-size: 0.875rem;
  color: var(--gray-400);
  line-height: 1.6;
  max-width: 280px;
  margin-bottom: var(--space-6);
}

/* Items List */
.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cart-item-card {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background: rgba(15, 28, 54, 0.7);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.cart-item-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(18, 34, 66, 0.85);
}

.cart-item-media {
  width: 54px;
  height: 54px;
  border-radius: var(--radius-md);
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.cart-item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-emoji {
  font-size: 1.75rem;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cart-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.cart-item-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-item-del-btn {
  background: transparent;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  padding: 2px;
}

.cart-item-del-btn:hover {
  opacity: 1;
  transform: scale(1.15);
}

.cart-item-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cart-pkg-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  background: rgba(249, 115, 22, 0.12);
  color: var(--accent-300);
  border-radius: var(--radius-full);
  font-weight: 500;
}

.cart-duration-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--gray-400);
  border-radius: var(--radius-full);
}

.cart-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-2);
}

.cart-item-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.cart-item-price {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--accent-400);
  font-family: var(--font-en);
}

.cart-item-orig-price {
  font-size: 0.8rem;
  color: var(--gray-500);
  text-decoration: line-through;
  font-family: var(--font-en);
}

.cart-qty-ctrl {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.qty-btn {
  width: 28px;
  height: 26px;
  background: transparent;
  border: none;
  color: var(--white);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: var(--accent-400);
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-val {
  min-width: 24px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 700;
  font-family: var(--font-en);
  color: var(--white);
}

.cart-clear-wrap {
  text-align: center;
  padding-top: var(--space-2);
}

.cart-clear-btn {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: var(--gray-500);
  text-decoration: underline;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.cart-clear-btn:hover {
  color: #f87171;
}

/* Footer */
.cart-footer {
  border-top: 1px solid var(--glass-border);
  padding: var(--space-4) var(--space-5) var(--space-5);
  background: rgba(7, 15, 30, 0.95);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Wallet Balance Box */
.cart-balance-box {
  background: rgba(15, 28, 54, 0.85);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
}

.balance-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.balance-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.balance-label {
  font-size: 0.8125rem;
  color: var(--gray-400);
}

.balance-val {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--white);
  font-family: var(--font-en);
}

.balance-status-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.balance-status-badge.success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.balance-status-badge.warning {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.balance-deficit-alert {
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px dashed rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #fca5a5;
  flex-wrap: wrap;
  gap: 6px;
}

.btn-accent-sm {
  background: var(--accent-500);
  color: var(--white);
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-accent-sm:hover {
  background: var(--accent-600);
  transform: translateY(-1px);
}

.balance-remain-hint {
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--gray-400);
  display: flex;
  justify-content: space-between;
}

/* Summary Card */
.cart-summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-3) 0;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--gray-400);
}

.summary-line.savings {
  color: #4ade80;
}

.summary-val {
  font-family: var(--font-en);
  font-weight: 500;
}

.summary-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 4px 0;
}

.summary-line.total {
  font-size: 1rem;
  font-weight: 700;
  color: var(--white);
}

.summary-total-val {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--accent-400);
  font-family: var(--font-en);
}

/* Checkout Button */
.cart-checkout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: 700;
  padding: var(--space-3) var(--space-4);
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.35);
}

.btn-warning {
  background: #eab308;
  color: #030712;
  border: none;
  font-weight: 700;
}

.btn-warning:hover {
  background: #facc15;
}

.spinner-inline {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--white);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .cart-drawer {
    max-width: 100%;
  }
}
</style>
