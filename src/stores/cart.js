import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToastStore } from './toast'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', () => {
  const toast = useToastStore()
  const auth = useAuthStore()

  // Cart items state with localStorage persistence
  const items = ref(JSON.parse(localStorage.getItem('sp_cart') || '[]'))
  const isOpen = ref(false)
  const isCheckingOut = ref(false)

  // Save to localStorage
  function saveLocal() {
    localStorage.setItem('sp_cart', JSON.stringify(items.value))
  }

  // Getters
  const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.quantity || 1), 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0)
  })

  const totalOriginalPrice = computed(() => {
    return items.value.reduce((sum, item) => {
      const orig = Number(item.originalPrice || item.price * 1.3)
      return sum + (orig * (item.quantity || 1))
    }, 0)
  })

  const totalSavings = computed(() => {
    const savings = totalOriginalPrice.value - totalPrice.value
    return savings > 0 ? savings : 0
  })

  const isBalanceSufficient = computed(() => {
    if (!auth.isLoggedIn) return false
    return Number(auth.balance) >= totalPrice.value
  })

  const balanceDeficit = computed(() => {
    if (!auth.isLoggedIn) return totalPrice.value
    const deficit = totalPrice.value - Number(auth.balance)
    return deficit > 0 ? deficit : 0
  })

  const remainingBalanceAfterPurchase = computed(() => {
    if (!auth.isLoggedIn) return 0
    return Math.max(0, Number(auth.balance) - totalPrice.value)
  })

  // Drawer Actions
  function openCart() {
    isOpen.value = true
  }

  function closeCart() {
    isOpen.value = false
  }

  function toggleCart() {
    isOpen.value = !isOpen.value
  }

  /**
   * Generate a unique cart item ID based on product ID and package ID/duration
   */
  function generateCartItemId(product, packageInfo) {
    const pkgKey = packageInfo?.id || packageInfo?.duration_days || packageInfo?.label || 'default'
    return `${product.id}_${pkgKey}`
  }

  /**
   * Add an item to the cart
   */
  function addItem(product, packageInfo, quantity = 1, autoOpen = true) {
    if (!product) return

    const pkg = packageInfo || (product.packages && product.packages.length > 0 ? product.packages[0] : {
      id: 'default',
      label: `${product.duration_days || 30} วัน`,
      price: product.price,
      original_price: product.original_price,
      duration_days: product.duration_days || 30
    })

    const itemId = generateCartItemId(product, pkg)
    const existingIndex = items.value.findIndex(item => item.id === itemId)

    const price = Number(pkg.price || product.price || 0)
    const originalPrice = Number(pkg.original_price || product.original_price || (price * 1.25))
    const durationDays = Number(pkg.duration_days || product.duration_days || 30)

    if (existingIndex > -1) {
      // Increment quantity
      items.value[existingIndex].quantity += quantity
    } else {
      // Add new item
      items.value.push({
        id: itemId,
        productId: product.id,
        productName: product.name,
        productEmoji: product.logo_emoji || '📦',
        imageUrl: product.image_url || '',
        category: product.category || 'streaming',
        color: product.color || '#F97316',
        packageId: pkg.id || itemId,
        packageLabel: pkg.label || `${durationDays} วัน`,
        durationDays,
        price,
        originalPrice,
        quantity: Math.max(1, quantity),
        stockCount: product.stock_count || 50
      })
    }

    saveLocal()

    toast.success(`🛒 เพิ่ม "${product.name} (${pkg.label || `${durationDays} วัน`})" ลงตะกร้าแล้ว`)

    if (autoOpen) {
      isOpen.value = true
    }
  }

  /**
   * Update quantity of an item in the cart
   */
  function updateQuantity(itemId, quantity) {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index === -1) return

    const newQty = parseInt(quantity, 10)
    if (isNaN(newQty) || newQty <= 0) {
      removeItem(itemId)
      return
    }

    // Cap at stock count if available
    const maxStock = items.value[index].stockCount || 99
    items.value[index].quantity = Math.min(newQty, maxStock)
    saveLocal()
  }

  /**
   * Increase quantity by 1
   */
  function incrementQuantity(itemId) {
    const item = items.value.find(i => i.id === itemId)
    if (item) {
      updateQuantity(itemId, item.quantity + 1)
    }
  }

  /**
   * Decrease quantity by 1 (removes if reaches 0)
   */
  function decrementQuantity(itemId) {
    const item = items.value.find(i => i.id === itemId)
    if (item) {
      if (item.quantity > 1) {
        updateQuantity(itemId, item.quantity - 1)
      } else {
        removeItem(itemId)
      }
    }
  }

  /**
   * Remove an item from the cart
   */
  function removeItem(itemId) {
    const item = items.value.find(i => i.id === itemId)
    items.value = items.value.filter(i => i.id !== itemId)
    saveLocal()
    if (item) {
      toast.info(`ลบ "${item.productName}" ออกจากตะกร้าแล้ว`)
    }
  }

  /**
   * Clear all items from the cart
   */
  function clearCart() {
    items.value = []
    saveLocal()
  }

  return {
    items,
    isOpen,
    isCheckingOut,
    totalItems,
    totalPrice,
    totalOriginalPrice,
    totalSavings,
    isBalanceSufficient,
    balanceDeficit,
    remainingBalanceAfterPurchase,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart
  }
})
