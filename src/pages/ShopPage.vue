<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductsStore } from '../stores/products'

const router = useRouter()
const route = useRoute()
const productsStore = useProductsStore()

const searchQuery = ref('')
const selectedCategory = ref(route.query.cat || 'all')
const sortBy = ref('popular')

const categories = computed(() => [
  { key: 'all', label: 'ทั้งหมด', emoji: '🏪' },
  { key: 'streaming', label: 'Streaming', emoji: '🎬' },
  { key: 'music', label: 'Music', emoji: '🎵' },
  { key: 'design', label: 'Design', emoji: '🎨' },
  { key: 'ai', label: 'AI Tools', emoji: '🤖' },
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
  if (sortBy.value === 'price-asc') list.sort((a,b) => a.price - b.price)
  if (sortBy.value === 'price-desc') list.sort((a,b) => b.price - a.price)
  if (sortBy.value === 'discount') list.sort((a,b) => (1-a.price/a.original_price) - (1-b.price/b.original_price)).reverse()
  return list
})
</script>

<template>
  <main style="flex:1; padding: var(--space-10) 0;">
    <div class="container">
      <!-- Header -->
      <div style="margin-bottom:var(--space-8);">
        <div class="section-label">🛒 ร้านค้า ApexStore</div>
        <h1 style="margin-bottom:var(--space-2);">สินค้าทั้งหมด</h1>
        <p style="color:var(--gray-500);">{{ filtered.length }} รายการพร้อมส่งทันที 24 ชม.</p>
      </div>

      <!-- Search + Filter bar -->
      <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-6); flex-wrap:wrap;">
        <input
          v-model="searchQuery"
          class="form-input"
          placeholder="🔍 ค้นหาสินค้า (Netflix, Spotify, ChatGPT...)"
          style="flex:1; min-width:200px; max-width:400px;"
          id="shop-search"
        />
        <select v-model="sortBy" class="form-input form-select" style="width:200px;" id="shop-sort">
          <option value="popular">เรียงโดย: ยอดนิยม</option>
          <option value="price-asc">ราคา: น้อย → มาก</option>
          <option value="price-desc">ราคา: มาก → น้อย</option>
          <option value="discount">ส่วนลดมากสุด</option>
        </select>
      </div>

      <!-- Category tabs -->
      <div style="display:flex; gap:var(--space-2); margin-bottom:var(--space-8); flex-wrap:wrap;">
        <button
          v-for="cat in categories"
          :key="cat.key"
          :class="['btn btn-sm', selectedCategory === cat.key ? 'btn-primary' : 'btn-secondary']"
          @click="selectedCategory = cat.key"
          :id="`cat-${cat.key}`"
        >
          {{ cat.emoji }} {{ cat.label }}
        </button>
      </div>

      <!-- Product grid -->
      <div v-if="filtered.length" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:var(--space-5);">
        <div
          v-for="p in filtered"
          :key="p.id"
          class="product-card animate-fade-in"
          @click="router.push(`/shop/${p.id}`)"
        >
          <!-- Badge -->
          <div class="product-card-badge">
            <span v-if="!p.is_available" class="badge badge-danger">หมด</span>
            <span v-else class="badge badge-accent">-{{ Math.round((1-p.price/p.original_price)*100) }}%</span>
          </div>

          <!-- Image / Logo Area -->
          <div style="padding:var(--space-5); display:flex; flex-direction:column; align-items:center; background:linear-gradient(135deg, rgba(255,255,255,0.03), transparent);">
            <!-- Render Image or Fallback Emoji -->
            <div v-if="p.image_url" style="width:100%; height:140px; border-radius:var(--radius-md); overflow:hidden; background:var(--bg-surface); display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-3);">
              <img :src="p.image_url" :alt="p.name" style="width:100%; height:140px; object-fit:cover; transition:transform 0.3s ease;" class="card-img" />
            </div>
            <div v-else style="font-size:3.5rem; height:140px; display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-3); filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">
              {{ p.logo_emoji || '📦' }}
            </div>

            <h3 style="font-size:1.05rem; color:var(--white); text-align:center;">{{ p.name }}</h3>
          </div>

          <div class="product-card-body">
            <p style="font-size:0.8125rem; color:var(--gray-500); margin-bottom:var(--space-4); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              {{ p.description }}
            </p>

            <!-- Features -->
            <div v-if="p.features?.length" style="display:flex; flex-wrap:wrap; gap:var(--space-1); margin-bottom:var(--space-4);">
              <span v-for="f in p.features.slice(0,3)" :key="f" style="font-size:0.7rem; padding:2px 8px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:var(--radius-full); color:var(--gray-400);">{{ f }}</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div>
                <div style="font-size:1.375rem; font-weight:800; color:var(--accent-400); font-family:var(--font-en);">฿{{ p.price }}</div>
                <div style="font-size:0.75rem; color:var(--gray-600); text-decoration:line-through;">฿{{ p.original_price }}</div>
              </div>
              <button
                :class="['btn btn-sm', p.is_available ? 'btn-primary' : 'btn-secondary']"
                :disabled="!p.is_available"
              >{{ p.is_available ? 'ซื้อเลย' : 'หมด' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>ไม่พบสินค้า</h3>
        <p style="color:var(--gray-500);">ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่</p>
        <button class="btn btn-secondary" @click="searchQuery=''; selectedCategory='all'">ล้างตัวกรอง</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.card-img:hover {
  transform: scale(1.05);
}

@media (max-width: 640px) {
  div[style*="grid-template-columns:repeat(auto-fill"] {
    grid-template-columns: 1fr 1fr !important;
  }
}
</style>
