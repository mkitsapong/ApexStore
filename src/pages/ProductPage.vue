<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const ordersStore = useOrdersStore()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToastStore()

const product = computed(() => productsStore.getProductById(route.params.id))
const selectedPkg = ref(null)
const purchasing = ref(false)
const showConfirm = ref(false)

// Auto-select first package on load
onMounted(() => {
  if (product.value?.packages?.length) {
    selectedPkg.value = product.value.packages[0]
  }
})

watch(product, (newVal) => {
  if (newVal?.packages?.length && !selectedPkg.value) {
    selectedPkg.value = newVal.packages[0]
  }
})

function selectPkg(pkg) {
  selectedPkg.value = pkg
}

function handleAddToCart() {
  if (!product.value?.is_available) {
    toast.error('ขออภัย สินค้านี้หมดสต็อกชั่วคราว')
    return
  }
  if (!selectedPkg.value) {
    toast.error('กรุณาเลือกแพ็กเกจก่อน')
    return
  }
  cart.addItem(product.value, selectedPkg.value, 1, true)
}

async function handleBuy() {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!selectedPkg.value) {
    toast.error('กรุณาเลือกแพ็กเกจก่อน')
    return
  }
  showConfirm.value = true
}

function goToTopup() {
  showConfirm.value = false
  router.push('/topup')
}

async function confirmPurchase() {
  if (Number(auth.balance) < Number(selectedPkg.value.price)) {
    toast.error('ยอดเงินไม่เพียงพอ กรุณาเติมเงิน')
    return
  }
  purchasing.value = true

  const deducted = await auth.deductBalance(selectedPkg.value.price)
  if (!deducted) {
    toast.error('ยอดเงินไม่เพียงพอ กรุณาเติมเงิน')
    purchasing.value = false
    return
  }

  // Create order in store / Supabase
  try {
    const result = await ordersStore.createOrder({
      product: product.value,
      packageInfo: selectedPkg.value,
      amount: selectedPkg.value.price
    })

    toast.success(`ซื้อ ${product.value.name} สำเร็จ! ตรวจสอบบัญชีได้ที่คำสั่งซื้อ`)
    showConfirm.value = false

    if (result?.order?.id) {
      router.push(`/orders/${result.order.id}`)
    } else {
      router.push('/orders')
    }
  } catch (err) {
    console.error('Order creation failed, refunding balance:', err)
    // Refund balance if order creation failed
    await auth.addBalance(selectedPkg.value.price).catch(() => {})
    toast.error('เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ เงินจะถูกคืนเข้า Wallet')
  } finally {
    purchasing.value = false
  }
}

const relatedProducts = computed(() =>
  productsStore.products.filter(p => p.category === product.value?.category && p.id !== product.value?.id).slice(0, 3)
)
</script>

<template>
  <main style="flex:1; padding:var(--space-10) 0;" v-if="product">
    <div class="container">
      <!-- Breadcrumb -->
      <div class="breadcrumb-nav">
        <RouterLink to="/" class="breadcrumb-link">หน้าหลัก</RouterLink>
        <span>/</span>
        <RouterLink to="/shop" class="breadcrumb-link">ร้านค้า</RouterLink>
        <span>/</span>
        <span style="color:var(--white); font-weight:600;">{{ product.name }}</span>
      </div>

      <div class="product-layout-grid">
        <!-- Left: Product Info -->
        <div>
          <!-- Product Hero Card -->
          <div class="product-hero-box">
            <div class="orb" style="width:240px;height:240px;opacity:0.12;top:-60px;right:-60px;background:var(--accent-500);"></div>

            <!-- Hero Image / Emoji -->
            <div v-if="product.image_url" class="product-hero-img-box">
              <img :src="product.image_url" :alt="product.name" />
            </div>
            <div v-else class="product-hero-emoji">
              {{ product.logo_emoji || '📦' }}
            </div>

            <h1 style="margin-bottom:var(--space-2); font-size:clamp(1.8rem, 4vw, 2.5rem);">{{ product.name }}</h1>
            <div style="display:flex; justify-content:center; gap:var(--space-2); margin-top:var(--space-3); flex-wrap:wrap;">
              <span class="badge badge-accent">
                -{{ product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0 }}% ส่วนลดพิเศษ
              </span>
              <span class="badge badge-success">
                ⚡ ส่งมอบทันที 24 ชม.
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="card" style="margin-bottom:var(--space-5);">
            <h3 style="margin-bottom:var(--space-4); display:flex; align-items:center; gap:var(--space-2);">
              📝 รายละเอียดสินค้า
            </h3>
            <p style="line-height:1.8; color:var(--gray-300); font-size:0.95rem;">
              {{ product.long_description || product.description }}
            </p>
          </div>

          <!-- Features -->
          <div class="card" style="margin-bottom:var(--space-5);">
            <h3 style="margin-bottom:var(--space-4); display:flex; align-items:center; gap:var(--space-2);">
              ✨ จุดเด่น & ฟีเจอร์ที่ได้รับ
            </h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-3);">
              <div v-for="f in product.features" :key="f" class="feature-item-row">
                <span class="feature-check-icon">✓</span>
                <span style="color:var(--gray-200); font-size:0.9rem;">{{ f }}</span>
              </div>
            </div>
          </div>

          <!-- Related Products -->
          <div v-if="relatedProducts.length">
            <h3 style="margin-bottom:var(--space-4);">สินค้าอื่นๆ ที่คุณอาจสนใจ</h3>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:var(--space-4);">
              <div
                v-for="rp in relatedProducts"
                :key="rp.id"
                class="product-card"
                @click="router.push(`/shop/${rp.id}`)"
              >
                <div style="padding:var(--space-4); text-align:center;">
                  <div v-if="rp.image_url" style="width:100%; height:90px; border-radius:var(--radius-md); overflow:hidden; background:var(--bg-surface); margin-bottom:var(--space-2);">
                    <img :src="rp.image_url" :alt="rp.name" style="width:100%; height:100%; object-fit:cover;" />
                  </div>
                  <div v-else style="font-size:2.5rem; height:90px; display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-2);">
                    {{ rp.logo_emoji || '📦' }}
                  </div>
                  <div style="font-weight:700; color:var(--white); font-size:0.9rem;">{{ rp.name }}</div>
                  <div style="color:var(--accent-400); font-weight:800; margin-top:4px; font-family:var(--font-en);">฿{{ rp.price }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Sticky Buy Panel -->
        <div style="position:sticky; top:88px;">
          <div class="card-elevated" style="border-radius:var(--radius-xl); border-color:rgba(249, 115, 22, 0.2);">
            <!-- Price Display -->
            <div style="margin-bottom:var(--space-5); padding-bottom:var(--space-5); border-bottom:1px solid var(--glass-border);">
              <div style="font-size:0.8125rem; color:var(--gray-400); margin-bottom:4px;">ราคาแพ็กเกจที่เลือก</div>
              <div style="font-size:2.5rem; font-weight:900; color:var(--accent-400); font-family:var(--font-en); line-height:1;">
                ฿{{ selectedPkg?.price ?? product.price }}
              </div>
              <div style="display:flex; align-items:center; gap:var(--space-2); margin-top:6px;">
                <span style="color:var(--gray-500); font-size:0.875rem; text-decoration:line-through;">
                  ฿{{ product.original_price }}
                </span>
                <span style="color:var(--success); font-size:0.8125rem; font-weight:700; background:rgba(34,197,94,0.1); padding:1px 6px; border-radius:var(--radius-sm);">
                  ประหยัด ฿{{ (product.original_price - (selectedPkg?.price ?? product.price)).toLocaleString() }}
                </span>
              </div>
            </div>

            <!-- Package Selector -->
            <div style="margin-bottom:var(--space-5);">
              <div style="font-size:0.875rem; font-weight:700; color:var(--white); margin-bottom:var(--space-3); display:flex; justify-content:space-between;">
                <span>เลือกแพ็กเกจระยะเวลา</span>
                <span style="color:var(--accent-400); font-size:0.75rem;">(คลิกเพื่อเลือก)</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div
                  v-for="(pkg, idx) in product.packages"
                  :key="pkg.id"
                  :class="['pkg-option-card', { active: selectedPkg?.id === pkg.id }]"
                  @click="selectPkg(pkg)"
                >
                  <div>
                    <div style="font-weight:700; color:var(--white); display:flex; align-items:center; gap:6px;">
                      {{ pkg.label }}
                      <span v-if="idx === 0" class="badge badge-accent" style="font-size:0.65rem; padding:1px 5px;">🔥 ยอดนิยม</span>
                    </div>
                    <div style="font-size:0.8125rem; color:var(--gray-400); margin-top:2px;">อายุการใช้งาน {{ pkg.duration_days }} วัน</div>
                  </div>
                  <div style="font-weight:800; color:var(--accent-400); font-family:var(--font-en); font-size:1.15rem;">
                    ฿{{ pkg.price }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Stock info -->
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-4); font-size:0.875rem; padding:var(--space-2) 0;">
              <span style="color:var(--gray-400);">สถานะสินค้า</span>
              <span :style="{ color: product.stock_count > 10 ? '#4ade80' : product.stock_count > 0 ? '#facc15' : '#f87171', fontWeight: '700' }">
                {{ product.stock_count > 0 ? `🟢 พร้อมส่ง (${product.stock_count} รายการ)` : '🔴 หมดสต็อก' }}
              </span>
            </div>

            <!-- Wallet Balance info -->
            <div v-if="auth.isLoggedIn" class="wallet-balance-box">
              <div style="font-size:0.8125rem; color:var(--gray-300);">
                ยอดเงินของคุณ: <strong style="color:var(--accent-400);">฿{{ Number(auth.balance || 0).toLocaleString() }}</strong>
              </div>
              <RouterLink to="/topup" class="topup-quick-link">
                + เติมเงิน
              </RouterLink>
            </div>

            <!-- Buy Action Buttons -->
            <div style="display:flex; flex-direction:column; gap:var(--space-2); margin-top:var(--space-3);">
              <button
                class="btn btn-secondary w-full btn-lg"
                :disabled="!product.is_available || !selectedPkg"
                @click="handleAddToCart"
                id="add-to-cart-btn"
                style="width:100%; border-color:rgba(249,115,22,0.4); background:rgba(249,115,22,0.08); font-weight:700;"
              >
                🛒 เพิ่มลงตะกร้า (Add to Cart)
              </button>

              <button
                class="btn btn-primary w-full btn-lg"
                :disabled="!product.is_available || !selectedPkg"
                @click="handleBuy"
                style="width:100%; font-weight:800;"
                id="buy-now-btn"
              >
                {{ !product.is_available ? '❌ สินค้าหมดชั่วคราว' : !selectedPkg ? 'กรุณาเลือกแพ็กเกจ' : `⚡ สั่งซื้อทันที ฿${selectedPkg.price}` }}
              </button>
            </div>

            <!-- Trust Guarantees -->
            <div class="guarantee-list">
              <div class="guarantee-item">⚡ ส่งข้อมูลบัญชีเข้าหน้ารายการสั่งซื้อทันที</div>
              <div class="guarantee-item">🔒 รหัสผ่านปลอดภัย เข้ารหัส AES-256</div>
              <div class="guarantee-item">🛡️ รับประกันและดูแลตลอดอายุการใช้งาน</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- PURCHASE CONFIRMATION MODAL                                -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
        <div class="modal">
          <div class="modal-header">
            <h3>ยืนยันการสั่งซื้อ</h3>
            <button class="btn btn-secondary btn-icon" @click="showConfirm=false">✕</button>
          </div>

          <div style="margin-bottom:var(--space-5); padding:var(--space-4); background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:var(--radius-lg);">
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-2);">
              <span style="color:var(--gray-400);">สินค้า</span>
              <span style="color:var(--white); font-weight:700;">{{ product.logo_emoji }} {{ product.name }}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-2);">
              <span style="color:var(--gray-400);">แพ็กเกจ</span>
              <span style="color:var(--white); font-weight:600;">{{ selectedPkg?.label }} ({{ selectedPkg?.duration_days }} วัน)</span>
            </div>
            <div class="divider" style="margin:var(--space-3) 0;"></div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--gray-400);">ยอดชำระสุทธิ</span>
              <span style="color:var(--accent-400); font-size:1.5rem; font-weight:900; font-family:var(--font-en);">
                ฿{{ selectedPkg?.price?.toLocaleString() }}
              </span>
            </div>
          </div>

          <!-- Insufficient Balance Warning -->
          <div v-if="auth.balance < (selectedPkg?.price ?? 0)" class="insufficient-warning">
            <div style="display:flex; align-items:center; gap:var(--space-2); color:#f87171; font-weight:700; font-size:0.95rem; margin-bottom:4px;">
              <span>⚠️</span> ยอดเงินใน Wallet ไม่เพียงพอ
            </div>
            <div style="font-size:0.85rem; color:#fca5a5; line-height:1.5;">
              คุณมียอดเงิน <strong>฿{{ auth.balance.toLocaleString() }}</strong> (ขาดอีก <span style="color:#facc15; font-weight:800;">฿{{ ((selectedPkg?.price ?? 0) - auth.balance).toLocaleString() }}</span>) กรุณาเติมเงินเพื่อทำรายการ
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex; gap:var(--space-3);">
            <button class="btn btn-secondary" @click="showConfirm=false" style="flex:1;">
              ยกเลิก
            </button>

            <!-- Topup Redirect Button -->
            <button
              v-if="auth.balance < (selectedPkg?.price ?? 0)"
              class="btn btn-primary"
              @click="goToTopup"
              style="flex:2;"
              id="modal-topup-btn"
            >
              💳 เติมเงินทันที (+฿{{ ((selectedPkg?.price ?? 0) - auth.balance).toLocaleString() }})
            </button>

            <!-- Confirm Buy Button -->
            <button
              v-else
              class="btn btn-primary"
              @click="confirmPurchase"
              :disabled="purchasing"
              style="flex:2;"
              id="confirm-buy-btn"
            >
              <span v-if="purchasing">⏳ กำลังทำรายการ...</span>
              <span v-else>✅ ยืนยันชำระเงิน</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>

  <!-- 404 -->
  <div v-else class="container empty-state" style="padding:var(--space-20) 0;">
    <div class="empty-state-icon">😢</div>
    <h2>ไม่พบสินค้าที่ระบุ</h2>
    <RouterLink to="/shop" class="btn btn-primary" style="margin-top:var(--space-4);">
      ← กลับไปหน้าร้านค้า
    </RouterLink>
  </div>
</template>

<style scoped>
.breadcrumb-nav {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-6);
  font-size: 0.875rem;
  color: var(--gray-500);
}

.breadcrumb-link {
  color: var(--gray-400);
  transition: color var(--transition-fast);
}

.breadcrumb-link:hover {
  color: var(--white);
}

.product-layout-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-8);
  align-items: start;
}

.product-hero-box {
  background: linear-gradient(135deg, rgba(13, 27, 51, 0.8) 0%, rgba(6, 14, 30, 0.95) 100%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  margin-bottom: var(--space-6);
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.product-hero-img-box {
  max-width: 340px;
  height: 190px;
  margin: 0 auto var(--space-4);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-surface);
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow-lg);
}

.product-hero-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-hero-emoji {
  font-size: 5rem;
  margin-bottom: var(--space-4);
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
}

.feature-item-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.feature-check-icon {
  color: var(--success);
  font-weight: 800;
  font-size: 1.1rem;
}

.pkg-option-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition: all var(--transition-fast);
}

.pkg-option-card:hover {
  border-color: rgba(249, 115, 22, 0.4);
  background: rgba(249, 115, 22, 0.05);
}

.pkg-option-card.active {
  border-color: var(--accent-400);
  background: rgba(249, 115, 22, 0.1);
  box-shadow: 0 0 14px rgba(249, 115, 22, 0.15);
}

.wallet-balance-box {
  margin-bottom: var(--space-4);
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topup-quick-link {
  font-size: 0.75rem;
  color: var(--accent-300);
  font-weight: 700;
  text-decoration: underline;
}

.guarantee-list {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.guarantee-item {
  font-size: 0.75rem;
  color: var(--gray-400);
  display: flex;
  align-items: center;
  gap: 6px;
}

.insufficient-warning {
  padding: var(--space-4);
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  max-width: 480px;
  width: 100%;
  box-shadow: var(--shadow-xl);
  animation: fadeIn 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

@media (max-width: 1024px) {
  .product-layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
