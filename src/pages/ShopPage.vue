<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const route = useRoute()
const productsStore = useProductsStore()
const cart = useCartStore()

function quickAddToCart(e, product) {
  e.stopPropagation()
  if (!product.is_available) return
  const defaultPkg = product.packages?.[0] || null
  cart.addItem(product, defaultPkg, 1, true)
}

const searchQuery = ref('')
const selectedCategory = ref(route.query.cat || 'all')
const sortBy = ref('popular')

const categories = computed(() => [
  { key: 'all', label: 'ทั้งหมด', emoji: '🏪', count: productsStore.products.length },
  { key: 'streaming', label: 'Streaming', emoji: '🎬', count: productsStore.products.filter(p => p.category === 'streaming').length },
  { key: 'music', label: 'Music', emoji: '🎵', count: productsStore.products.filter(p => p.category === 'music').length },
  { key: 'design', label: 'Design', emoji: '🎨', count: productsStore.products.filter(p => p.category === 'design').length },
  { key: 'ai', label: 'AI Tools', emoji: '🤖', count: productsStore.products.filter(p => p.category === 'ai').length },
])

const filtered = computed(() => {
  let list = [...productsStore.products]
  if (selectedCategory.value !== 'all') {
    list = list.filter(p => p.category === selectedCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
  }
  if (sortBy.value === 'price-asc') list.sort((a, b) => a.price - b.price)
  if (sortBy.value === 'price-desc') list.sort((a, b) => b.price - a.price)
  if (sortBy.value === 'discount') list.sort((a, b) => (1 - a.price / a.original_price) - (1 - b.price / b.original_price)).reverse()
  return list
})
</script>

<template>
  <main style="flex:1; padding: var(--space-10) 0;">
    <div class="container">
      <!-- Header -->
      <div style="margin-bottom:var(--space-8);">
        <div class="section-label">🛒 ร้านค้า ApexStore Premium</div>
        <h1 style="margin-bottom:var(--space-2);">สินค้าและบริการดิจิทัลทั้งหมด</h1>
        <p style="color:var(--gray-400);">มีสินค้าพร้อมส่งมอบทันที {{ filtered.length }} รายการ (ระบบ Auto 24 ชั่วโมง)</p>
      </div>

      <!-- Search + Filter Bar -->
      <div class="shop-filter-bar">
        <div style="position:relative; flex:1; min-width:240px; max-width:440px;">
          <input
            v-model="searchQuery"
            class="input"
            placeholder="🔍 ค้นหาสินค้า (Netflix, Spotify, ChatGPT, Canva...)"
            id="shop-search"
            style="padding-right:36px;"
          />
          <button
            v-if="searchQuery"
            class="btn btn-secondary btn-icon"
            style="position:absolute; right:4px; top:50%; transform:translateY(-50%); width:28px; height:28px; font-size:0.75rem;"
            @click="searchQuery = ''"
          >
            ✕
          </button>
        </div>

        <select v-model="sortBy" class="input form-select" style="width:220px;" id="shop-sort">
          <option value="popular">🔥 เรียงตาม: ยอดนิยม</option>
          <option value="price-asc">💵 ราคา: น้อย → มาก</option>
          <option value="price-desc">💎 ราคา: มาก → น้อย</option>
          <option value="discount">🏷️ ส่วนลดมากที่สุด</option>
        </select>
      </div>

      <!-- Category Tabs -->
      <div class="shop-cat-tabs">
        <button
          v-for="cat in categories"
          :key="cat.key"
          :class="['shop-cat-btn', { active: selectedCategory === cat.key }]"
          @click="selectedCategory = cat.key"
          :id="`cat-${cat.key}`"
        >
          <span>{{ cat.emoji }}</span>
          <span>{{ cat.label }}</span>
          <span class="shop-cat-badge">{{ cat.count }}</span>
        </button>
      </div>

      <!-- Product Grid -->
      <div v-if="filtered.length" class="shop-product-grid">
        <div
          v-for="p in filtered"
          :key="p.id"
          class="product-card animate-fade-in"
          @click="router.push(`/shop/${p.id}`)"
        >
          <!-- Badge -->
          <div class="product-card-badge">
            <span v-if="!p.is_available" class="badge badge-danger">สินค้าหมด</span>
            <span v-else class="badge badge-accent">
              -{{ Math.round((1 - p.price / p.original_price) * 100) }}%
            </span>
          </div>

          <!-- Image Area -->
          <div class="product-img-box">
            <img
              v-if="p.image_url"
              :src="p.image_url"
              :alt="p.name"
              class="card-img"
            />
            <div v-else class="emoji-box">
              {{ p.logo_emoji || '📦' }}
            </div>
          </div>

          <div class="product-card-body">
            <div style="font-weight:700; color:var(--white); font-size:1.1rem; margin-bottom:4px;">
              {{ p.name }}
            </div>
            <p class="product-desc-text">
              {{ p.description }}
            </p>

            <!-- Feature Tags -->
            <div v-if="p.features?.length" class="feature-tag-list">
              <span v-for="f in p.features.slice(0, 3)" :key="f" class="feature-pill">
                {{ f }}
              </span>
            </div>

            <div class="product-card-action-row">
              <div>
                <div class="price-main">฿{{ p.price }}</div>
                <div class="price-strike">฿{{ p.original_price }}</div>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                <button
                  v-if="p.is_available"
                  class="btn btn-secondary btn-icon btn-sm"
                  @click="quickAddToCart($event, p)"
                  title="ใส่ตะกร้าทันที"
                  style="width:34px; height:34px; border-color:rgba(249,115,22,0.4); background:rgba(249,115,22,0.1);"
                >
                  🛒
                </button>
                <button
                  :class="['btn btn-sm', p.is_available ? 'btn-primary' : 'btn-secondary']"
                  :disabled="!p.is_available"
                  style="box-shadow:none;"
                >
                  {{ p.is_available ? 'สั่งซื้อเลย' : 'สินค้าหมด' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>ไม่พบสินค้าที่ค้นหา</h3>
        <p style="color:var(--gray-400); margin-bottom:var(--space-4);">ลองค้นหาด้วยคำอื่น หรือเลือกดูหมวดหมู่อื่น</p>
        <button class="btn btn-secondary" @click="searchQuery = ''; selectedCategory = 'all'">
          🔄 ล้างตัวกรองทั้งหมด
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.shop-filter-bar {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  align-items: center;
}

.shop-cat-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}

.shop-cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  color: var(--gray-300);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.shop-cat-btn:hover {
  background: var(--glass-hover);
  color: var(--white);
  border-color: rgba(255, 255, 255, 0.2);
}

.shop-cat-btn.active {
  background: var(--accent-500);
  color: var(--white);
  font-weight: 700;
  border-color: var(--accent-400);
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);
}

.shop-cat-badge {
  background: rgba(0, 0, 0, 0.25);
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.shop-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5);
}

.product-img-box {
  width: 100%;
  height: 150px;
  background: var(--bg-surface);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.emoji-box {
  font-size: 3.75rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
}

.product-desc-text {
  font-size: 0.8125rem;
  color: var(--gray-400);
  margin-bottom: var(--space-3);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feature-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--space-4);
}

.feature-pill {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  color: var(--gray-400);
}

.product-card-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.price-main {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--accent-400);
  font-family: var(--font-en);
  line-height: 1;
}

.price-strike {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-decoration: line-through;
  margin-top: 2px;
}

@media (max-width: 640px) {
  .shop-product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
