<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { mockReviews } from '../data/mockData'

const router = useRouter()
const productsStore = useProductsStore()

const featured = computed(() => productsStore.products.filter(p => p.is_available).slice(0, 4))
const categories = computed(() => [
  { key: 'streaming', emoji: '🎬', label: 'Streaming', count: productsStore.products.filter(p => p.category === 'streaming').length },
  { key: 'music', emoji: '🎵', label: 'Music', count: productsStore.products.filter(p => p.category === 'music').length },
  { key: 'design', emoji: '🎨', label: 'Design', count: productsStore.products.filter(p => p.category === 'design').length },
  { key: 'ai', emoji: '🤖', label: 'AI Tools', count: productsStore.products.filter(p => p.category === 'ai').length },
])

const stats = [
  { value: '5,000+', label: 'สมาชิกที่ไว้วางใจ', emoji: '👥' },
  { value: '20,000+', label: 'คำสั่งซื้อสำเร็จ', emoji: '📦' },
  { value: '99.8%', label: 'ความพึงพอใจ', emoji: '⭐' },
  { value: '24/7', label: 'ซัพพอร์ต', emoji: '🕐' },
]
</script>

<template>
  <main style="flex:1">
    <!-- Hero -->
    <section class="hero" style="position:relative; overflow:hidden;">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="container" style="position:relative; z-index:2">
        <div class="section-label">🔥 ราคาถูกที่สุด ส่งทันที 24 ชั่วโมง</div>
        <h1 class="hero-title">
          ซื้อบัญชี <span class="gradient-text-accent">Premium App</span><br>
          ราคาถูก คุณภาพสูง
        </h1>
        <p class="hero-subtitle">
          Netflix, Spotify, Disney+, YouTube, ChatGPT Plus และอีกมากมาย<br>
          ราคาประหยัดสูงสุด 70% เมื่อเทียบกับราคาทางการ ส่งบัญชีทันทีหลังชำระเงิน
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" @click="router.push('/shop')">
            🛒 เลือกซื้อสินค้า
          </button>
          <button class="btn btn-secondary btn-lg" @click="router.push('/auth/register')">
            สมัครสมาชิกฟรี
          </button>
        </div>

        <!-- Trust badges -->
        <div style="display:flex; justify-content:center; gap:var(--space-6); margin-top:var(--space-12); flex-wrap:wrap;">
          <div class="trust-badge">✅ ส่งทันที Auto</div>
          <div class="trust-badge">🔒 ปลอดภัย 100%</div>
          <div class="trust-badge">💯 รับประกันคืนเงิน</div>
          <div class="trust-badge">⚡ รองรับ PromptPay</div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section style="padding:var(--space-10) 0; border-top:1px solid var(--glass-border); border-bottom:1px solid var(--glass-border);">
      <div class="container">
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-6);">
          <div v-for="s in stats" :key="s.label" style="text-align:center;">
            <div style="font-size:2rem; margin-bottom:var(--space-2);">{{ s.emoji }}</div>
            <div style="font-size:1.75rem; font-weight:800; color:var(--white); font-family:var(--font-en); line-height:1;">{{ s.value }}</div>
            <div style="font-size:0.875rem; color:var(--gray-500); margin-top:4px;">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="section-sm">
      <div class="container">
        <div class="text-center" style="margin-bottom:var(--space-8);">
          <div class="section-label" style="margin:0 auto var(--space-3);">หมวดหมู่สินค้า</div>
          <h2>เลือกสินค้าที่ใช่สำหรับคุณ</h2>
        </div>
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4);">
          <RouterLink
            v-for="cat in categories"
            :key="cat.key"
            :to="`/shop?cat=${cat.key}`"
            class="cat-card"
          >
            <div style="font-size:2.5rem; margin-bottom:var(--space-3);">{{ cat.emoji }}</div>
            <div style="font-weight:600; color:var(--white); font-size:1rem;">{{ cat.label }}</div>
            <div style="font-size:0.8rem; color:var(--gray-500); margin-top:4px;">{{ cat.count }} สินค้า</div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="section-sm" style="background:rgba(255,255,255,0.01); border-top:1px solid var(--glass-border);">
      <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-8);">
          <div>
            <div class="section-label">สินค้ายอดนิยม</div>
            <h2>ขายดีที่สุด</h2>
          </div>
          <RouterLink to="/shop" class="btn btn-outline">ดูทั้งหมด →</RouterLink>
        </div>
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-5);">
          <div
            v-for="p in featured"
            :key="p.id"
            class="product-card"
            @click="router.push(`/shop/${p.id}`)"
          >
            <div class="product-card-badge">
              <span class="badge badge-accent">-{{ Math.round((1 - p.price/p.original_price)*100) }}%</span>
            </div>
            <div style="padding:var(--space-5); display:flex; flex-direction:column; align-items:center; gap:var(--space-3); background:linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));">
              <!-- Image or Emoji -->
              <div v-if="p.image_url" style="width:100%; height:130px; border-radius:var(--radius-md); overflow:hidden; background:var(--bg-surface); display:flex; align-items:center; justify-content:center;">
                <img :src="p.image_url" :alt="p.name" style="width:100%; height:130px; object-fit:cover; transition:transform 0.3s ease;" class="card-product-img" />
              </div>
              <div v-else style="font-size:3.5rem; height:130px; display:flex; align-items:center; justify-content:center; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">
                {{ p.logo_emoji || '📦' }}
              </div>

              <div style="font-weight:700; color:var(--white); font-size:1.05rem; text-align:center;">{{ p.name }}</div>
            </div>
            <div class="product-card-body">
              <p style="font-size:0.8125rem; color:var(--gray-500); margin-bottom:var(--space-3); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                {{ p.description }}
              </p>
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-size:1.25rem; font-weight:800; color:var(--accent-400); font-family:var(--font-en);">฿{{ p.price }}</div>
                  <div style="font-size:0.75rem; color:var(--gray-600); text-decoration:line-through;">฿{{ p.original_price }}</div>
                </div>
                <button class="btn btn-primary btn-sm">ซื้อเลย</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="section">
      <div class="container">
        <div class="text-center" style="margin-bottom:var(--space-12);">
          <div class="section-label" style="margin:0 auto var(--space-3);">วิธีการสั่งซื้อ</div>
          <h2>ง่ายแค่ 3 ขั้นตอน</h2>
          <p style="color:var(--gray-500); margin-top:var(--space-2);">สั่งซื้อได้ตลอด 24 ชั่วโมง ระบบอัตโนมัติส่งบัญชีทันที</p>
        </div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-6);">
          <div v-for="(step, i) in steps" :key="i" class="step-card">
            <div class="step-number">{{ i + 1 }}</div>
            <div style="font-size:2.5rem; margin:var(--space-4) 0 var(--space-3);">{{ step.emoji }}</div>
            <h4 style="margin-bottom:var(--space-2);">{{ step.title }}</h4>
            <p style="font-size:0.875rem; color:var(--gray-500); line-height:1.7;">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews -->
    <section class="section-sm" style="border-top:1px solid var(--glass-border);">
      <div class="container">
        <div class="text-center" style="margin-bottom:var(--space-10);">
          <div class="section-label" style="margin:0 auto var(--space-3);">รีวิวจากลูกค้า</div>
          <h2>ลูกค้าพูดถึงเราว่าอย่างไร</h2>
        </div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-5);">
          <div v-for="r in mockReviews" :key="r.id" class="card">
            <div style="display:flex; align-items:center; gap:var(--space-3); margin-bottom:var(--space-4);">
              <div style="width:44px;height:44px;border-radius:50%;background:var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">{{ r.avatar }}</div>
              <div>
                <div style="font-weight:600; color:var(--white); font-size:0.9rem;">{{ r.user }}</div>
                <div style="font-size:0.75rem; color:var(--gray-500);">{{ r.product }}</div>
              </div>
              <div style="margin-left:auto; font-size:0.875rem; color:var(--warning);">★★★★★</div>
            </div>
            <p style="font-size:0.875rem; color:var(--gray-400); line-height:1.7; font-style:italic;">"{{ r.text }}"</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="container">
        <div class="cta-card">
          <div class="orb" style="width:300px;height:300px;background:var(--accent-500);top:-100px;right:-50px;opacity:0.1;filter:blur(80px);position:absolute;"></div>
          <div style="position:relative;z-index:1;">
            <h2 style="font-size:2.25rem; margin-bottom:var(--space-4);">พร้อมเริ่มแล้วหรือยัง?</h2>
            <p style="color:var(--gray-400); margin-bottom:var(--space-8); font-size:1.05rem;">สมัครสมาชิกฟรี เติมเงิน และซื้อบัญชี Premium แรกของคุณได้เลย</p>
            <div style="display:flex; gap:var(--space-4); justify-content:center; flex-wrap:wrap;">
              <button class="btn btn-primary btn-lg" @click="router.push('/auth/register')">🚀 สมัครสมาชิกฟรี</button>
              <button class="btn btn-secondary btn-lg" @click="router.push('/shop')">🛒 ดูสินค้าทั้งหมด</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
export default {
  data() {
    return {
      steps: [
        { emoji: '🔐', title: 'สมัครสมาชิก', desc: 'สมัครฟรีด้วยอีเมลของคุณ ใช้งานได้ทันที ไม่ต้องยืนยันตัวตนยุ่งยาก' },
        { emoji: '💳', title: 'เติมเงิน', desc: 'สแกน QR PromptPay อัปโหลด Slip Admin อนุมัติรวดเร็ว เงินเข้า Wallet ทันที' },
        { emoji: '📦', title: 'รับบัญชี', desc: 'เลือกสินค้า กดซื้อ ระบบส่ง Email + Password ให้คุณทันที ใช้งานได้เลย' },
      ]
    }
  }
}
</script>

<style scoped>
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  color: var(--gray-300);
}

.cat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
}

.cat-card:hover {
  border-color: rgba(249,115,22,0.35);
  background: rgba(249,115,22,0.05);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.step-card {
  padding: var(--space-8);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  text-align: center;
  position: relative;
}

.step-number {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.875rem;
  color: var(--white);
}

.cta-card {
  background: linear-gradient(135deg, rgba(11,45,95,0.5) 0%, rgba(5,13,26,0.8) 100%);
  border: 1px solid rgba(249,115,22,0.2);
  border-radius: var(--radius-2xl);
  padding: var(--space-16) var(--space-8);
  text-align: center;
  position: relative;
  overflow: hidden;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
  div[style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2,1fr) !important; }
  div[style*="grid-template-columns:repeat(3"] { grid-template-columns: 1fr !important; }
}
</style>
