import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mockProducts } from '../data/mockData'
import { supabase, isSupabaseConfigured } from '../services/supabase'

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
  const loading = ref(false)
  const error = ref(null)

  function save() {
    localStorage.setItem('sp_products', JSON.stringify(products.value))
  }

  /**
   * Fetch products list from Supabase
   */
  async function fetchProducts() {
    if (isSupabaseConfigured && supabase) {
      try {
        loading.value = true
        error.value = null
        const { data, error: sbError } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true })

        if (sbError) throw sbError
        if (data && data.length > 0) {
          products.value = data
          save()
          subscribeToProducts()
          return data
        }
      } catch (err) {
        console.error('Error fetching Supabase products:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    return products.value
  }

  let productsChannel = null

  /**
   * Subscribe to live Realtime updates on products table
   */
  function subscribeToProducts() {
    if (!isSupabaseConfigured || !supabase) return

    if (productsChannel) {
      supabase.removeChannel(productsChannel)
      productsChannel = null
    }

    productsChannel = supabase
      .channel('products-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const exists = products.value.some(p => p.id === payload.new.id)
            if (!exists) {
              products.value.push(payload.new)
              save()
            }
          } else if (payload.eventType === 'UPDATE') {
            const idx = products.value.findIndex(p => p.id === payload.new.id)
            if (idx !== -1) {
              products.value[idx] = { ...products.value[idx], ...payload.new }
              save()
            }
          } else if (payload.eventType === 'DELETE') {
            products.value = products.value.filter(p => p.id !== payload.old.id)
            save()
          }
        }
      )
      .subscribe()
  }


  /**
   * Add a new product
   */
  async function addProduct(product) {
    const newId = products.value.length ? Math.max(...products.value.map(p => Number(p.id) || 0)) + 1 : 1
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert({
            name: newProd.name,
            category: newProd.category,
            description: newProd.description,
            long_description: newProd.long_description,
            image_url: newProd.image_url,
            logo_emoji: newProd.logo_emoji,
            color: newProd.color,
            duration_days: newProd.duration_days,
            price: newProd.price,
            original_price: newProd.original_price,
            is_available: newProd.is_available,
            stock_count: newProd.stock_count,
            features: newProd.features,
            packages: newProd.packages
          })
          .select()
          .single()

        if (insertError) {
          console.warn('Could not insert product to Supabase, saving locally:', insertError)
        } else if (data) {
          products.value.unshift(data)
          save()
          return data
        }
      } catch (err) {
        console.error('Error inserting product into Supabase:', err)
      }
    }

    products.value.unshift(newProd)
    save()
    return newProd
  }

  /**
   * Update an existing product
   */
  async function updateProduct(id, updated) {
    const numId = Number(id)
    const idx = products.value.findIndex(p => Number(p.id) === numId)
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...updated }
      save()

      if (isSupabaseConfigured && supabase) {
        try {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              name: updated.name,
              category: updated.category,
              description: updated.description,
              long_description: updated.long_description,
              image_url: updated.image_url,
              logo_emoji: updated.logo_emoji,
              color: updated.color,
              duration_days: Number(updated.duration_days) || 30,
              price: Number(updated.price) || 0,
              original_price: Number(updated.original_price) || 0,
              is_available: updated.is_available,
              stock_count: Number(updated.stock_count) || 0,
              features: updated.features,
              packages: updated.packages,
              updated_at: new Date().toISOString()
            })
            .eq('id', numId)

          if (updateError) {
            console.warn('Supabase product update error:', updateError)
          }
        } catch (err) {
          console.error('Error updating product in Supabase:', err)
        }
      }
      return true
    }
    return false
  }

  /**
   * Delete product
   */
  async function deleteProduct(id) {
    const numId = Number(id)
    products.value = products.value.filter(p => Number(p.id) !== numId)
    save()

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', numId)
      } catch (err) {
        console.error('Error deleting product in Supabase:', err)
      }
    }
  }

  /**
   * Toggle product availability
   */
  async function toggleAvailable(id) {
    const numId = Number(id)
    const p = products.value.find(p => Number(p.id) === numId)
    if (p) {
      p.is_available = !p.is_available
      save()

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('products')
            .update({ is_available: p.is_available, updated_at: new Date().toISOString() })
            .eq('id', numId)
        } catch (err) {
          console.error('Error toggling product status in Supabase:', err)
        }
      }
    }
  }

  function getProductById(id) {
    return products.value.find(p => Number(p.id) === Number(id))
  }

  function resetToDefault() {
    products.value = [...mockProducts]
    save()
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    subscribeToProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleAvailable,
    getProductById,
    resetToDefault
  }
})
