import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Upload a product image to public Supabase Storage bucket 'product-images'
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadProductImage(file) {
  if (!file) return { success: false, error: 'ไม่พบไฟล์รูปภาพ' }

  // Generate unique file path
  const fileExt = file.name ? file.name.split('.').pop() : 'png'
  const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
  const filePath = `products/${fileName}`

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Get public CDN URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path)

      return {
        success: true,
        url: publicUrlData.publicUrl,
        path: data.path
      }
    } catch (err) {
      console.warn('Supabase product image upload error, falling back to Base64:', err)
    }
  }

  // Fallback to Base64 data URL
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve({ success: true, url: e.target.result })
    }
    reader.onerror = () => {
      resolve({ success: false, error: 'ไม่สามารถอ่านไฟล์ได้' })
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Upload a payment slip to private Supabase Storage bucket 'payment-slips'
 * @param {File} file - Slip image file
 * @param {string} userId - User identifier
 * @returns {Promise<{success: boolean, path?: string, signedUrl?: string, error?: string}>}
 */
export async function uploadPaymentSlip(file, userId = 'guest') {
  if (!file) return { success: false, error: 'ไม่พบไฟล์สลิป' }

  const fileExt = file.name ? file.name.split('.').pop() : 'jpg'
  const fileName = `slip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('payment-slips')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Generate a signed URL with 7 days validity
      const { data: signedData, error: signedError } = await supabase.storage
        .from('payment-slips')
        .createSignedUrl(data.path, 60 * 60 * 24 * 7)

      return {
        success: true,
        path: data.path,
        url: signedData?.signedUrl || data.path
      }
    } catch (err) {
      console.warn('Supabase slip upload error, falling back to local URL:', err)
    }
  }

  // Fallback to Base64 data URL
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve({ success: true, url: e.target.result, path: null })
    }
    reader.onerror = () => {
      resolve({ success: false, error: 'ไม่สามารถอ่านไฟล์ได้' })
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Get a viewable URL for a slip (creates signed URL if it's a private storage path)
 * @param {string} pathOrUrl - Storage path or direct URL
 * @returns {Promise<string>} - Usable image URL
 */
export async function getSlipUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('payment-slips')
        .createSignedUrl(pathOrUrl, 60 * 60 * 24)

      if (!error && data?.signedUrl) {
        return data.signedUrl
      }
    } catch (err) {
      console.error('Error generating signed URL for slip:', err)
    }
  }

  return pathOrUrl
}
