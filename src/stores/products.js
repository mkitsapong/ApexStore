import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockProducts } from '../data/mockData'

// Popular brand logo presets for easy selection
export const BRAND_IMAGE_PRESETS = [
  { name: 'Netflix', url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&auto=format&fit=crop&q=80', emoji: '🎬' },
  { name: 'Spotify', url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=400&auto=format&fit=crop&q=80', emoji: '🎵' },
  { name: 'YouTube', url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&auto=format&fit=crop&q=80', emoji: '▶️' },
  { name: 'Disney+', url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80', emoji: '🏰' },
  { name: 'ChatGPT', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=400&auto=format&fit=crop&q=80', emoji: '🤖' },
  { name: 'Canva', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop&q=80', emoji: '🎨' },
  { name: 'Apple TV', url: 'https://images.unsplash.com/photo-1510519138195-068d828884bb?w=400&auto=format&fit=crop&q=80', emoji: '🍎' },
  { name: 'Adobe', url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&auto=format&fit=crop&q=80', emoji: '🔴' },
]

export const useProductsStore = defineStore('products', () => {
  const products = ref(JSON.parse(localStorage.getItem('sp_products') || JSON.stringify(mockProducts)))

  function save() {
    localStorage.setItem('sp_products', JSON.stringify(products.value))
  }

  function addProduct(product) {
    const newId = products.value.length ? Math.max(...products.value.map(p => p.id)) + 1 : 1
    const newProd = {
      id: newId,
      name: product.name || 'สินค้าใหม่',
      category: product.category || 'streaming',
      description: product.description || '',
      long_description: product.long_description || product.description || '',
      image_url: product.image_url || '',
      logo_emoji: product.logo_emoji || '📦',
      color: product.color || '#F97316',
      duration_days: Number(product.duration_days) || 30,
      price: Number(product.price) || 99,
      original_price: Number(product.original_price) || 199,
      is_available: product.is_available ?? true,
      stock_count: Number(product.stock_count) || 10,
      features: product.features || ['คุณภาพสูง', 'ใช้งานได้ทันที', 'รับประกันตลอดการใช้งาน'],
      packages: product.packages?.length ? product.packages : [
        { id: '1m', label: '1 เดือน', duration_days: Number(product.duration_days) || 30, price: Number(product.price) || 99 }
      ]
    }
    products.value.unshift(newProd)
    save()
    return newProd
  }

  function updateProduct(id, updated) {
    const idx = products.value.findIndex(p => p.id === Number(id))
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...updated }
      save()
      return true
    }
    return false
  }

  function deleteProduct(id) {
    products.value = products.value.filter(p => p.id !== Number(id))
    save()
  }

  function toggleAvailable(id) {
    const p = products.value.find(p => p.id === Number(id))
    if (p) {
      p.is_available = !p.is_available
      save()
    }
  }

  function getProductById(id) {
    return products.value.find(p => p.id === Number(id))
  }

  function resetToDefault() {
    products.value = [...mockProducts]
    save()
  }

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleAvailable,
    getProductById,
    resetToDefault
  }
})
