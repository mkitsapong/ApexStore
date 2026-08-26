<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { mockReviews } from '../data/mockData'

const router = useRouter()
const productsStore = useProductsStore()
const cart = useCartStore()

function quickAddToCart(e, product) {
  e.stopPropagation()
  if (!product.is_available) return
  const defaultPkg = product.packages?.[0] || null
  cart.addItem(product, defaultPkg, 1, true)
}

const featured = computed(() => productsStore.products.filter(p => p.is_available).slice(0, 4))
const categories = computed(() => [
  { key: 'streaming', emoji: '🎬', label: 'Streaming', desc: 'หนัง ซีรีส์ และความบันเทิง', count: productsStore.products.filter(p => p.category === 'streaming').length },
  { key: 'music', emoji: '🎵', label: 'Music & Audio', desc: 'ฟังเพลงไม่จำกัด เสียงระดับ HiFi', count: productsStore.products.filter(p => p.category === 'music').length },
  { key: 'design', emoji: '🎨', label: 'Design & Creative', desc: 'กราฟิก และงานสร้างสรรค์', count: productsStore.products.filter(p => p.category === 'design').length },
  { key: 'ai', emoji: '🤖', label: 'AI Tools', desc: 'AI อัจฉริยะปลดล็อกงานไว', count: productsStore.products.filter(p => p.category === 'ai').length },
])

const stats = [
  { value: '5,000+', label: 'สมาชิกที่ไว้วางใจ', emoji: '👥' },
  { value: '20,000+', label: 'คำสั่งซื้อสำเร็จ', emoji: '📦' },
  { value: '99.8%', label: 'ความพึงพอใจ', emoji: '⭐' },
  { value: '24/7', label: 'ซัพพอร์ตดูแลตลอด', emoji: '🕐' },
]

const steps = [
  { emoji: '🔐', title: '1. สมัครสมาชิก', desc: 'สมัครฟรีด้วยอีเมลของคุณใน 10 วินาที ใช้งานได้ทันที' },
  { emoji: '💳', title: '2. เติมเงิน Wallet', desc: 'สแกน QR PromptPay เงินเข้ากระเป๋าอัตโนมัติ 24 ชม.' },
  { emoji: '🚀', title: '3. รับบัญชีพร้อมใช้', desc: 'เลือกแพ็กเกจ กดสั่งซื้อ รับ Email & Password ใช้งานได้เลย' },
]
</script>

<template>
  <main style="flex:1">
    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- HERO SECTION                                               -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <section class="hero">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="container" style="position:relative; z-index:2">
        <div class="hero-badge">
          <span>⚡</span>
          <span>อันดับ 1 ร้านบัญชีดิจิทัลพรีเมียม ส่งมอบทันที 24 ชม.</span>
        </div>

        <h1 class="hero-title">
          ซื้อบัญชี <span class="gradient-text-accent">Premium Apps</span><br />
          ราคาประหยัด คุณภาพแท้ 100%
        </h1>

        <p class="hero-subtitle">
          Netflix, Spotify, Disney+, YouTube, ChatGPT Plus, Canva Pro และอีกมากมาย<br class="hidden-mobile" />
          ประหยัดสูงสุดถึง 70% ปลอดภัย ส่งมอบข้อมูลบัญชีเข้า Orders ทันที
        </p>

        <div class="hero-actions">
          <button class="btn btn-primary btn-lg hero-btn-main" @click="router.push('/shop')" id="btn-hero-shop">
            🛒 เลือกซื้อสินค้าทั้งหมด
          </button>
          <button class="btn btn-secondary btn-lg" @click="router.push('/auth/register')" id="btn-hero-register">
            ✨ สมัครสมาชิกฟรี
          </button>
        </div>

        <!-- Trust badges -->
        <div class="trust-grid">
          <div class="trust-badge">
            <span class="trust-icon">⚡</span>
            <span>ส่งทันที Auto</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">🔒</span>
            <span>ปลอดภัยด้วย AES-256</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">🛡️</span>
            <span>รับประกันดูแลตลอดอายุ</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">📲</span>
            <span>รองรับ PromptPay QR</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- STATS COUNTER BAR                                          -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <section class="stats-bar">
      <div class="container">
        <div class="stats-counter-grid">
          <div v-for="s in stats" :key="s.label" class="stat-counter-item">
            <div class="stat-counter-emoji">{{ s.emoji }}</div>
            <div class="stat-counter-value">{{ s.value }}</div>
            <div class="stat-counter-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- CATEGORIES SECTION                                         -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <section class="section-sm">
      <div class="container">
        <div class="text-center" style="margin-bottom:var(--space-8);">
          <div class="section-label">หมวดหมู่สินค้า</div>
          <h2>เลือกบริการที่ตอบโจทย์คุณ</h2>
        </div>
        <div class="category-grid">
          <RouterLink
            v-for="cat in categories"
            :key="cat.key"
            :to="`/shop?cat=${cat.key}`"
            class="cat-card"
          >
            <div class="cat-card-emoji">{{ cat.emoji }}</div>
            <div class="cat-card-title">{{ cat.label }}</div>
            <div class="cat-card-desc">{{ cat.desc }}</div>
            <div class="cat-card-count">{{ cat.count }} สินค้าพร้อมส่ง →</div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- FEATURED PRODUCTS SECTION                                  -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <section class="section-sm" style="background:rgba(255,255,255,0.015); border-top:1px solid var(--glass-border); border-bottom:1px solid var(--glass-border);">
      <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-8); flex-wrap:wrap; gap:var(--space-4);">
          <div>
            <div class="section-label">🔥 สินค้ายอดนิยม</div>
            <h2>ขายดีประจำสัปดาห์</h2>
          </div>
          <RouterLink to="/shop" class="btn btn-outline btn-sm">
            ดูสินค้าทั้งหมด ({{ productsStore.products.length }}) →
          </RouterLink>
        </div>

        <div class="product-grid">
          <div
            v-for="p in featured"
            :key="p.id"
            class="product-card"
            @click="router.push(`/shop/${p.id}`)"
          >
            <!-- Badge -->
            <div class="product-card-badge">
              <span class="badge badge-accent">
                -{{ Math.round((1 - p.price / p.original_price) * 100) }}%
              </span>
            </div>

            <!-- Image Area -->
            <div class="product-media-wrapper">
              <img
                v-if="p.image_url"
                :src="p.image_url"
                :alt="p.name"
                class="card-product-img"
              />
              <div v-else class="product-emoji-fallback">
                {{ p.logo_emoji || '📦' }}
              </div>
            </div>

            <div class="product-card-body">
              <div style="font-weight:700; color:var(--white); font-size:1.1rem; margin-bottom:4px;">
                {{ p.name }}
              </div>
              <p class="product-card-desc">
                {{ p.description }}
              </p>

              <div class="product-card-footer">
                <div>
                  <div class="product-price">฿{{ p.price }}</div>
                  <div class="product-original-price">฿{{ p.original_price }}</div>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                  <button
                    class="btn btn-secondary btn-icon btn-sm"
                    @click="quickAddToCart($event, p)"
                    title="ใส่ตะกร้าทันที"
                    style="width:34px; height:34px; border-color:rgba(249,115,22,0.4); background:rgba(249,115,22,0.1);"
                  >
                    🛒
                  </button>
                  <button class="btn btn-primary btn-sm" style="box-shadow:none;">
                    สั่งซื้อ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- HOW IT WORKS (3 STEPS)                                     -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <section class="section">
      <div class="container">
        <div class="text-center" style="margin-bottom:var(--space-12);">
          <div class="section-label">วิธีการสั่งซื้อ</div>
          <h2>สั่งซื้อง่าย เพียง 3 ขั้นตอน</h2>
          <p style="color:var(--gray-400); margin-top:var(--space-2);">
            ระบบอัตโนมัติ 100% สั่งซื้อได้ตลอด 24 ชั่วโมง ได้รับข้อมูลทันที
          </p>
        </div>

        <div class="step-grid">
          <div v-for="(step, i) in steps" :key="i" class="step-card">
            <div class="step-badge-number">{{ i + 1 }}</div>
            <div class="step-emoji">{{ step.emoji }}</div>
            <h3 style="font-size:1.15rem; margin-bottom:var(--space-2);">{{ step.title }}</h3>
            <p style="font-size:0.875rem; color:var(--gray-400); line-height:1.6;">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- REVIEWS SECTION                                            -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <section class="section-sm" style="border-top:1px solid var(--glass-border);">
      <div class="container">
        <div class="text-center" style="margin-bottom:var(--space-10);">
          <div class="section-label">ความพึงพอใจของลูกค้า</div>
          <h2>ลูกค้าพูดถึงเราว่าอย่างไร</h2>
        </div>

        <div class="review-grid">
          <div v-for="r in mockReviews" :key="r.id" class="card review-card">
            <div style="display:flex; align-items:center; gap:var(--space-3); margin-bottom:var(--space-4);">
              <div class="review-avatar">{{ r.avatar }}</div>
              <div>
                <div style="font-weight:700; color:var(--white); font-size:0.95rem;">{{ r.user }}</div>
                <div style="font-size:0.75rem; color:var(--accent-400);">{{ r.product }}</div>
              </div>
              <div style="margin-left:auto; font-size:0.9rem; color:#facc15;">★★★★★</div>
            </div>
            <p style="font-size:0.875rem; color:var(--gray-300); line-height:1.6; font-style:italic;">
              &ldquo;{{ r.text }}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- CTA BANNER                                                 -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <section class="section">
      <div class="container">
        <div class="cta-card">
          <div class="orb" style="width:350px;height:350px;background:var(--accent-500);top:-120px;right:-80px;opacity:0.18;filter:blur(80px);position:absolute;"></div>
          <div style="position:relative; z-index:1;">
            <h2 style="font-size:clamp(1.8rem, 4vw, 2.5rem); margin-bottom:var(--space-3);">
              พร้อมสัมผัสประสบการณ์ดิจิทัลระดับพรีเมียมแล้วหรือยัง?
            </h2>
            <p style="color:var(--gray-300); margin-bottom:var(--space-8); font-size:1.05rem; max-width:600px; margin-left:auto; margin-right:auto;">
              สมัครสมาชิกฟรีวันนี้ เติมเงิน และเป็นเจ้าของบัญชี Premium ในราคาสุดคุ้มทันที
            </p>
            <div style="display:flex; gap:var(--space-4); justify-content:center; flex-wrap:wrap;">
              <button class="btn btn-primary btn-lg" @click="router.push('/auth/register')">
                🚀 เริ่มต้นสมัครสมาชิกฟรี
              </button>
              <button class="btn btn-secondary btn-lg" @click="router.push('/shop')">
                🛒 ดูรายการสินค้าทั้งหมด
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 16px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-300);
  margin-bottom: var(--space-4);
  backdrop-filter: blur(10px);
}

.trust-grid {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-10);
  flex-wrap: wrap;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  color: var(--gray-300);
  backdrop-filter: blur(8px);
}

.trust-icon {
  font-size: 1rem;
}

/* Stats Counter Bar */
.stats-bar {
  padding: var(--space-8) 0;
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.2);
}

.stats-counter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-6);
}

.stat-counter-item {
  text-align: center;
}

.stat-counter-emoji {
  font-size: 1.75rem;
  margin-bottom: 4px;
}

.stat-counter-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--white);
  font-family: var(--font-en);
  line-height: 1.1;
}

.stat-counter-label {
  font-size: 0.8125rem;
  color: var(--gray-400);
  margin-top: 4px;
}

/* Categories */
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
}

.cat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) var(--space-5);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
  backdrop-filter: blur(12px);
}

.cat-card:hover {
  border-color: rgba(249, 115, 22, 0.4);
  background: rgba(249, 115, 22, 0.06);
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(249, 115, 22, 0.1);
}

.cat-card-emoji {
  font-size: 2.75rem;
  margin-bottom: var(--space-3);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.cat-card-title {
  font-weight: 700;
  color: var(--white);
  font-size: 1.05rem;
  margin-bottom: 4px;
}

.cat-card-desc {
  font-size: 0.78125rem;
  color: var(--gray-400);
  margin-bottom: var(--space-3);
  line-height: 1.4;
}

.cat-card-count {
  font-size: 0.75rem;
  color: var(--accent-300);
  font-weight: 600;
  margin-top: auto;
}

/* Products Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
}

.product-media-wrapper {
  width: 100%;
  height: 140px;
  background: var(--bg-surface);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-product-img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.product-emoji-fallback {
  font-size: 3.5rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
}

.product-card-desc {
  font-size: 0.8125rem;
  color: var(--gray-400);
  margin-bottom: var(--space-4);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.product-price {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--accent-400);
  font-family: var(--font-en);
  line-height: 1;
}

.product-original-price {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-decoration: line-through;
  margin-top: 2px;
}

/* Step Grid */
.step-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.step-card {
  padding: var(--space-8) var(--space-6);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  text-align: center;
  position: relative;
  backdrop-filter: blur(12px);
  transition: all var(--transition-base);
}

.step-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: var(--shadow-lg);
}

.step-badge-number {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8125rem;
  color: var(--white);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
}

.step-emoji {
  font-size: 2.75rem;
  margin: var(--space-3) 0 var(--space-3);
}

/* Reviews */
.review-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

.review-card {
  transition: all var(--transition-base);
}

.review-card:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.15);
}

.review-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1.5px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

/* CTA Card */
.cta-card {
  background: linear-gradient(135deg, rgba(15, 36, 68, 0.6) 0%, rgba(3, 7, 18, 0.85) 100%);
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: var(--radius-2xl);
  padding: var(--space-16) var(--space-8);
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-xl), 0 0 40px rgba(249, 115, 22, 0.08);
}

@media (max-width: 1024px) {
  .category-grid,
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-counter-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }
  .category-grid,
  .product-grid,
  .step-grid,
  .review-grid {
    grid-template-columns: 1fr;
  }
  .hidden-mobile {
    display: none;
  }
}
</style>
