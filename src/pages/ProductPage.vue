<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const auth = useAuthStore()
const toast = useToastStore()

const product = computed(() => productsStore.getProductById(route.params.id))
const selectedPkg = ref(null)
const purchasing = ref(false)
const showConfirm = ref(false)

function selectPkg(pkg) {
  selectedPkg.value = pkg
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
  if (auth.balance < selectedPkg.value.price) {
    toast.error('ยอดเงินไม่เพียงพอ กรุณาเติมเงิน')
    return
  }
  purchasing.value = true
  await new Promise(r => setTimeout(r, 1200))
  auth.deductBalance(selectedPkg.value.price)
  toast.success(`ซื้อ ${product.value.name} สำเร็จ! ตรวจสอบบัญชีได้ที่ Orders`)
  purchasing.value = false
  showConfirm.value = false
  router.push('/orders')
}

const relatedProducts = computed(() =>
  productsStore.products.filter(p => p.category === product.value?.category && p.id !== product.value?.id).slice(0, 3)
)
</script>

<template>
  <main style="flex:1; padding:var(--space-10) 0;" v-if="product">
    <div class="container">
      <!-- Breadcrumb -->
      <div style="display:flex; gap:var(--space-2); align-items:center; margin-bottom:var(--space-6); font-size:0.875rem; color:var(--gray-500);">
        <RouterLink to="/" style="color:var(--gray-500); hover:color:var(--white)">หน้าหลัก</RouterLink>
        <span>/</span>
        <RouterLink to="/shop" style="color:var(--gray-500)">ร้านค้า</RouterLink>
        <span>/</span>
        <span style="color:var(--white)">{{ product.name }}</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 380px; gap:var(--space-10); align-items:start;">
        <!-- Left: Product Info -->
        <div>
          <!-- Product hero card -->
          <div style="background:linear-gradient(135deg, rgba(11,29,58,0.7), rgba(5,13,26,0.9)); border:1px solid var(--glass-border); border-radius:var(--radius-xl); padding:var(--space-8); margin-bottom:var(--space-6); text-align:center; position:relative; overflow:hidden;">
            <div class="orb" style="width:200px;height:200px;opacity:0.08;top:-50px;right:-50px;background:var(--accent-500);"></div>
            
            <!-- Hero Image / Emoji -->
            <div v-if="product.image_url" style="max-width:320px; height:180px; margin:0 auto var(--space-4); border-radius:var(--radius-lg); overflow:hidden; background:var(--bg-surface); position:relative; z-index:1; box-shadow:var(--shadow-lg);">
              <img :src="product.image_url" :alt="product.name" style="width:100%; height:100%; object-fit:cover;" />
            </div>
            <div v-else style="font-size:5rem; margin-bottom:var(--space-4); position:relative; z-index:1; filter:drop-shadow(0 8px 24px rgba(0,0,0,0.5));">
              {{ product.logo_emoji || '📦' }}
            </div>

            <h1 style="margin-bottom:var(--space-3); position:relative; z-index:1;">{{ product.name }}</h1>
            <div class="badge badge-accent" style="position:relative; z-index:1;">
              -{{ Math.round((1-product.price/product.original_price)*100) }}% ส่วนลดพิเศษ
            </div>
          </div>

          <!-- Description -->
          <div class="card" style="margin-bottom:var(--space-5);">
            <h3 style="margin-bottom:var(--space-4);">รายละเอียดสินค้า</h3>
            <p style="line-height:1.8; color:var(--gray-400);">{{ product.long_description }}</p>
          </div>

          <!-- Features -->
          <div class="card" style="margin-bottom:var(--space-5);">
            <h3 style="margin-bottom:var(--space-4);">ฟีเจอร์</h3>
            <div style="display:flex; flex-direction:column; gap:var(--space-3);">
              <div v-for="f in product.features" :key="f" style="display:flex; align-items:center; gap:var(--space-3);">
                <span style="color:var(--success); font-size:1.1rem;">✓</span>
                <span style="color:var(--gray-300);">{{ f }}</span>
              </div>
            </div>
          </div>

          <!-- Related products -->
          <div v-if="relatedProducts.length">
            <h3 style="margin-bottom:var(--space-4);">สินค้าที่เกี่ยวข้อง</h3>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-4);">
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
                  <div style="font-weight:600; color:var(--white); font-size:0.9rem;">{{ rp.name }}</div>
                  <div style="color:var(--accent-400); font-weight:700; margin-top:4px;">฿{{ rp.price }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Buy Panel (sticky) -->
        <div style="position:sticky; top:80px;">
          <div class="card-elevated" style="border-radius:var(--radius-xl);">
            <!-- Price -->
            <div style="margin-bottom:var(--space-5); padding-bottom:var(--space-5); border-bottom:1px solid var(--glass-border);">
              <div style="font-size:2.25rem; font-weight:900; color:var(--accent-400); font-family:var(--font-en); line-height:1;">฿{{ selectedPkg?.price ?? product.price }}</div>
              <div style="color:var(--gray-500); font-size:0.875rem; text-decoration:line-through; margin-top:2px;">฿{{ product.original_price }}</div>
              <div style="color:var(--success); font-size:0.875rem; margin-top:4px; font-weight:600;">
                ประหยัด ฿{{ (product.original_price - (selectedPkg?.price ?? product.price)).toLocaleString() }}
              </div>
            </div>

            <!-- Package selector -->
            <div style="margin-bottom:var(--space-5);">
              <div style="font-size:0.875rem; font-weight:600; color:var(--gray-300); margin-bottom:var(--space-3);">เลือกแพ็กเกจ</div>
              <div style="display:flex; flex-direction:column; gap:var(--space-2);">
                <div
                  v-for="pkg in product.packages"
                  :key="pkg.id"
                  :class="['pkg-option', { active: selectedPkg?.id === pkg.id }]"
                  @click="selectPkg(pkg)"
                >
                  <div>
                    <div style="font-weight:600; color:var(--white);">{{ pkg.label }}</div>
                    <div style="font-size:0.8125rem; color:var(--gray-500);">{{ pkg.duration_days }} วัน</div>
                  </div>
                  <div style="font-weight:700; color:var(--accent-400); font-family:var(--font-en);">฿{{ pkg.price }}</div>
                </div>
              </div>
            </div>

            <!-- Stock info -->
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-5); font-size:0.875rem;">
              <span style="color:var(--gray-500);">สินค้าในสต็อก</span>
              <span :style="{color: product.stock_count > 10 ? 'var(--success)' : product.stock_count > 0 ? 'var(--warning)' : 'var(--danger)'}">
                {{ product.stock_count > 0 ? `${product.stock_count} รายการ` : 'หมดสต็อก' }}
              </span>
            </div>

            <!-- Auth info -->
            <div v-if="auth.isLoggedIn" style="margin-bottom:var(--space-4); padding:var(--space-3); background:rgba(255,255,255,0.03); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size:0.8125rem; color:var(--gray-400);">
                ยอดเงินของคุณ: <span style="color:var(--accent-400); font-weight:700;">฿{{ auth.balance.toLocaleString() }}</span>
              </div>
              <RouterLink to="/topup" style="font-size:0.75rem; color:var(--accent-300); font-weight:600; text-decoration:underline;">
                + เติมเงิน
              </RouterLink>
            </div>

            <button
              class="btn btn-primary w-full btn-lg"
              :disabled="!product.is_available || !selectedPkg"
              @click="handleBuy"
              style="width:100%;"
              id="buy-now-btn"
            >
              {{ !product.is_available ? '❌ หมดสต็อก' : !selectedPkg ? 'กรุณาเลือกแพ็กเกจ' : `🛒 ซื้อเลย ฿${selectedPkg.price}` }}
            </button>

            <div style="margin-top:var(--space-4); display:flex; flex-direction:column; gap:var(--space-2);">
              <div style="font-size:0.75rem; color:var(--gray-600); display:flex; align-items:center; gap:4px;">✅ ส่งบัญชีทันทีหลังชำระ</div>
              <div style="font-size:0.75rem; color:var(--gray-600); display:flex; align-items:center; gap:4px;">🔒 ปลอดภัย 100%</div>
              <div style="font-size:0.75rem; color:var(--gray-600); display:flex; align-items:center; gap:4px;">💯 รับประกันคืนเงิน</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm modal -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
      <div class="modal">
        <div class="modal-header">
          <h3>ยืนยันการซื้อ</h3>
          <button class="btn btn-secondary btn-icon" @click="showConfirm=false">✕</button>
        </div>
        
        <div style="margin-bottom:var(--space-5); padding:var(--space-4); background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
          <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-2);">
            <span style="color:var(--gray-400);">สินค้า</span>
            <span style="color:var(--white); font-weight:600;">{{ product.logo_emoji }} {{ product.name }}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-2);">
            <span style="color:var(--gray-400);">แพ็กเกจ</span>
            <span style="color:var(--white);">{{ selectedPkg?.label }}</span>
          </div>
          <div class="divider" style="margin:var(--space-3) 0;"></div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:var(--gray-400);">ยอดชำระ</span>
            <span style="color:var(--accent-400); font-size:1.35rem; font-weight:900; font-family:var(--font-en);">฿{{ selectedPkg?.price }}</span>
          </div>
        </div>

        <!-- Warning & Details when balance is not enough -->
        <div v-if="auth.balance < (selectedPkg?.price ?? 0)" style="padding:var(--space-4); background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); border-radius:var(--radius-md); margin-bottom:var(--space-5);">
          <div style="display:flex; align-items:center; gap:var(--space-2); color:#F87171; font-weight:700; font-size:0.9rem; margin-bottom:4px;">
            <span>⚠️</span> ยอดเงินใน Wallet ไม่เพียงพอ
          </div>
          <div style="font-size:0.8125rem; color:#FCA5A5; line-height:1.5;">
            คุณมียอดเงิน <strong>฿{{ auth.balance.toLocaleString() }}</strong> (ขาดอีก <span style="color:#FACC15; font-weight:700;">฿{{ ((selectedPkg?.price ?? 0) - auth.balance).toLocaleString() }}</span>) กรุณาเติมเงินเพื่อดำเนินการต่อ
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; gap:var(--space-3);">
          <button class="btn btn-secondary" @click="showConfirm=false" style="flex:1">
            ยกเลิก
          </button>

          <!-- Top-up Button if balance is insufficient -->
          <button
            v-if="auth.balance < (selectedPkg?.price ?? 0)"
            class="btn btn-primary"
            @click="goToTopup"
            style="flex:2;"
            id="modal-topup-btn"
          >
            💳 เติมเงิน (+฿{{ ((selectedPkg?.price ?? 0) - auth.balance).toLocaleString() }})
          </button>

          <!-- Confirm Purchase Button if balance is enough -->
          <button
            v-else
            class="btn btn-primary"
            @click="confirmPurchase"
            :disabled="purchasing"
            style="flex:2;"
            id="confirm-buy-btn"
          >
            <div v-if="purchasing" class="spinner" style="width:16px;height:16px;"></div>
            <span v-else>✅ ยืนยันการสั่งซื้อ</span>
          </button>
        </div>
      </div>
    </div>
  </main>

  <!-- 404 -->
  <div v-else class="container empty-state" style="padding:var(--space-20) 0;">
    <div class="empty-state-icon">😢</div>
    <h2>ไม่พบสินค้า</h2>
    <RouterLink to="/shop" class="btn btn-primary">กลับไปร้านค้า</RouterLink>
  </div>
</template>

<style scoped>
.pkg-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.pkg-option:hover {
  border-color: rgba(249,115,22,0.4);
  background: rgba(249,115,22,0.05);
}
.pkg-option.active {
  border-color: var(--accent-400);
  background: rgba(249,115,22,0.1);
}

@media (max-width: 768px) {
  div[style*="grid-template-columns:1fr 380px"] {
    grid-template-columns: 1fr !important;
  }
  div[style*="position:sticky"] {
    position: static !important;
  }
}
</style>
