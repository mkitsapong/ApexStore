<script setup>
import { ref } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { useProductsStore, BRAND_IMAGE_PRESETS } from '../../stores/products'
import { useToastStore } from '../../stores/toast'

const productsStore = useProductsStore()
const toast = useToastStore()

const showModal = ref(false)
const editMode = ref(false)
const form = ref({})
const categories = ['streaming', 'music', 'design', 'ai', 'other']

// Image selection state
const imageTab = ref('upload') // 'upload' | 'url' | 'presets'
const isImageError = ref(false)

function openAdd() {
  editMode.value = false
  form.value = {
    name: '',
    category: 'streaming',
    description: '',
    long_description: '',
    image_url: '',
    logo_emoji: '🎬',
    price: 99,
    original_price: 199,
    duration_days: 30,
    is_available: true,
    stock_count: 20,
    features: ['ใช้งานได้ทันที', 'ไม่มีโฆษณา', 'รับประกันตลอดการใช้งาน']
  }
  isImageError.value = false
  showModal.value = true
}

function openEdit(p) {
  editMode.value = true
  form.value = JSON.parse(JSON.stringify(p))
  isImageError.value = false
  showModal.value = true
}

function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WebP, SVG)')
    return
  }

  // Convert to Base64
  const reader = new FileReader()
  reader.onload = (event) => {
    form.value.image_url = event.target.result
    isImageError.value = false
    toast.success('อัปโหลดรูปภาพสำเร็จ')
  }
  reader.readAsDataURL(file)
}

function selectPreset(preset) {
  form.value.image_url = preset.url
  form.value.logo_emoji = preset.emoji
  if (!form.value.name || form.value.name === 'สินค้าใหม่') {
    form.value.name = `${preset.name} Premium`
  }
  isImageError.value = false
  toast.info(`เลือกรูปภาพ ${preset.name} แล้ว`)
}

function clearImage() {
  form.value.image_url = ''
  isImageError.value = false
}

function saveProduct() {
  if (!form.value.name.trim()) {
    toast.error('กรุณาระบุชื่อสินค้า')
    return
  }

  if (editMode.value) {
    productsStore.updateProduct(form.value.id, form.value)
    toast.success('อัปเดตข้อมูลสินค้าสำเร็จ')
  } else {
    productsStore.addProduct(form.value)
    toast.success('เพิ่มสินค้าใหม่สำเร็จ')
  }
  showModal.value = false
}

function deleteProduct(id) {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) {
    productsStore.deleteProduct(id)
    toast.success('ลบสินค้าสำเร็จ')
  }
}

function toggleAvailable(p) {
  productsStore.toggleAvailable(p.id)
  toast.info(`${p.name}: ${p.is_available ? 'เปิดขาย' : 'ปิดขาย'}`)
}
</script>

<template>
  <AdminLayout>
    <div class="page-content animate-fade-in">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-8); flex-wrap:wrap; gap:var(--space-4);">
        <div>
          <h1 style="font-size:1.75rem; margin-bottom:var(--space-1);">จัดการสินค้า (Product Management)</h1>
          <p style="color:var(--gray-400);">เพิ่ม ลบ แก้ไขสินค้า และจัดการรูปภาพบนการ์ดสินค้า</p>
        </div>
        <div style="display:flex; gap:var(--space-3);">
          <button class="btn btn-primary" @click="openAdd" id="btn-add-product">
            ➕ เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      <!-- Products Table -->
      <div class="card-elevated" style="border-radius:var(--radius-xl); padding:var(--space-5);">
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>รูปภาพ / ไอคอน</th>
                <th>ชื่อสินค้า</th>
                <th>หมวดหมู่</th>
                <th>ราคาขาย</th>
                <th>สต็อก</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in productsStore.products" :key="p.id">
                <td>
                  <div style="display:flex; align-items:center; gap:var(--space-3);">
                    <!-- Image or Emoji thumbnail -->
                    <div class="table-img-thumb">
                      <img
                        v-if="p.image_url"
                        :src="p.image_url"
                        :alt="p.name"
                        class="thumb-img"
                        @error="e => e.target.style.display = 'none'"
                      />
                      <span v-else style="font-size:1.5rem;">{{ p.logo_emoji || '📦' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="color:var(--white); font-weight:700; font-size:0.95rem;">{{ p.name }}</div>
                  <div style="font-size:0.75rem; color:var(--gray-400);">{{ p.duration_days }} วัน · {{ p.features?.length || 0 }} ฟีเจอร์</div>
                </td>
                <td>
                  <span class="badge badge-primary">{{ p.category }}</span>
                </td>
                <td>
                  <div style="font-weight:800; color:var(--accent-400); font-family:var(--font-en); font-size:1.05rem;">
                    ฿{{ p.price }}
                  </div>
                  <div style="font-size:0.75rem; color:var(--gray-600); text-decoration:line-through;">
                    ฿{{ p.original_price }}
                  </div>
                </td>
                <td style="color:var(--white); font-weight:600;">
                  <span :style="{ color: p.stock_count > 0 ? '#4ADE80' : '#F87171' }">
                    {{ p.stock_count }} รายการ
                  </span>
                </td>
                <td>
                  <button
                    @click="toggleAvailable(p)"
                    :class="['badge', p.is_available ? 'badge-success' : 'badge-danger']"
                    style="cursor:pointer; border:none; padding:4px 10px;"
                  >
                    {{ p.is_available ? '✓ เปิดขาย' : '✕ ปิดขาย' }}
                  </button>
                </td>
                <td>
                  <div style="display:flex; gap:var(--space-2);">
                    <button class="btn btn-secondary btn-sm" @click="openEdit(p)" title="แก้ไขสินค้า & รูปภาพ">
                      ✏️ แก้ไข
                    </button>
                    <button class="btn btn-danger btn-sm" @click="deleteProduct(p.id)" title="ลบสินค้า">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Product Modal with Image Chooser -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal modal-lg" style="max-width:820px; max-height:90vh; overflow-y:auto;">
          <div class="modal-header">
            <h3>{{ editMode ? '✏️ แก้ไขข้อมูลและรูปภาพสินค้า' : '➕ เพิ่มสินค้าใหม่' }}</h3>
            <button class="btn btn-secondary btn-icon" @click="showModal = false">✕</button>
          </div>

          <form @submit.prevent="saveProduct" style="display:flex; flex-direction:column; gap:var(--space-5);">
            <!-- Section 1: Image & Card Preview Section -->
            <div style="background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:var(--radius-lg); padding:var(--space-5);">
              <h4 style="margin-bottom:var(--space-3); color:var(--accent-400); display:flex; align-items:center; gap:var(--space-2);">
                <span>🖼️</span> รูปภาพการ์ดสินค้า (Card Image)
              </h4>

              <div style="display:grid; grid-template-columns: 1fr 240px; gap:var(--space-6); align-items:start;">
                <!-- Left: Image Source Chooser -->
                <div>
                  <!-- Tab Selector -->
                  <div class="tabs" style="margin-bottom:var(--space-4);">
                    <button
                      type="button"
                      :class="['tab', { active: imageTab === 'upload' }]"
                      @click="imageTab = 'upload'"
                    >
                      📁 อัปโหลดจากเครื่อง
                    </button>
                    <button
                      type="button"
                      :class="['tab', { active: imageTab === 'url' }]"
                      @click="imageTab = 'url'"
                    >
                      🔗 ใส่ URL รูป
                    </button>
                    <button
                      type="button"
                      :class="['tab', { active: imageTab === 'presets' }]"
                      @click="imageTab = 'presets'"
                    >
                      ⚡ โลโก้สำเร็จรูป
                    </button>
                  </div>

                  <!-- Tab 1: Upload File -->
                  <div v-if="imageTab === 'upload'">
                    <label class="upload-dropzone">
                      <input
                        type="file"
                        accept="image/*"
                        style="display:none;"
                        @change="onFileSelect"
                      />
                      <div style="font-size:2rem; margin-bottom:var(--space-2);">📤</div>
                      <div style="font-weight:600; color:var(--white); font-size:0.9rem;">
                        คลิกเพื่อเลือกไฟล์รูปภาพจากคอมพิวเตอร์
                      </div>
                      <div style="font-size:0.75rem; color:var(--gray-400); margin-top:2px;">
                        รองรับ PNG, JPG, WebP, SVG (ระบบแปลงบันทึกอัตโนมัติ)
                      </div>
                    </label>
                  </div>

                  <!-- Tab 2: Direct URL -->
                  <div v-if="imageTab === 'url'" class="form-group">
                    <label class="form-label">ลิงก์ URL รูปภาพ (Direct Link)</label>
                    <input
                      v-model="form.image_url"
                      class="form-input"
                      placeholder="https://example.com/logo.png"
                      @input="isImageError = false"
                    />
                    <span style="font-size:0.75rem; color:var(--gray-500);">
                      สามารถนำ URL รูปภาพจากอินเทอร์เน็ตมาวางได้โดยตรง
                    </span>
                  </div>

                  <!-- Tab 3: Quick Brand Presets -->
                  <div v-if="imageTab === 'presets'">
                    <div style="font-size:0.8rem; color:var(--gray-400); margin-bottom:var(--space-2);">
                      คลิกเพื่อเลือกรูปภาพแบรนด์ยอดนิยม:
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:var(--space-2);">
                      <button
                        v-for="preset in BRAND_IMAGE_PRESETS"
                        :key="preset.name"
                        type="button"
                        class="preset-thumb-btn"
                        @click="selectPreset(preset)"
                      >
                        <img :src="preset.url" :alt="preset.name" class="preset-thumb-img" />
                        <span style="font-size:0.75rem; font-weight:600; color:var(--white); margin-top:2px;">
                          {{ preset.name }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- Emoji & Clear Buttons -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-4); gap:var(--space-3); flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:var(--space-2);">
                      <label class="form-label" style="margin:0; font-size:0.85rem;">Emoji ไอคอนสำรอง:</label>
                      <input
                        v-model="form.logo_emoji"
                        class="form-input"
                        style="width:60px; text-align:center; font-size:1.2rem; padding:4px;"
                        placeholder="🎬"
                      />
                    </div>
                    <button
                      v-if="form.image_url"
                      type="button"
                      class="btn btn-secondary btn-sm"
                      @click="clearImage"
                      style="color:#F87171;"
                    >
                      🗑️ ลบรูป (ใช้ Emoji แทน)
                    </button>
                  </div>
                </div>

                <!-- Right: Live Card Preview -->
                <div>
                  <div style="font-size:0.8rem; color:var(--gray-400); margin-bottom:var(--space-2); text-align:center;">
                    👁️ ตัวอย่างการแสดงผลบน Card
                  </div>
                  
                  <div class="preview-card-box">
                    <div class="preview-card-header">
                      <!-- Image Display -->
                      <div v-if="form.image_url && !isImageError" class="preview-img-wrapper">
                        <img
                          :src="form.image_url"
                          alt="preview"
                          class="preview-card-img"
                          @error="isImageError = true"
                        />
                      </div>
                      <!-- Emoji Fallback -->
                      <div v-else class="preview-emoji-wrapper">
                        <div style="font-size:3rem; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));">
                          {{ form.logo_emoji || '📦' }}
                        </div>
                      </div>
                      
                      <div class="preview-title">{{ form.name || 'ชื่อสินค้าตัวอย่าง' }}</div>
                    </div>

                    <div class="preview-body">
                      <div style="font-size:0.75rem; color:var(--gray-400); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                        {{ form.description || 'คำอธิบายสินค้าตัวอย่างจะแสดงตรงนี้...' }}
                      </div>
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-2);">
                        <div style="font-size:1.1rem; font-weight:800; color:var(--accent-400); font-family:var(--font-en);">
                          ฿{{ form.price || 0 }}
                        </div>
                        <span class="badge badge-accent" style="font-size:0.65rem;">ซื้อเลย</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: General Info -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-4);">
              <div class="form-group" style="grid-column:span 2;">
                <label class="form-label">ชื่อสินค้า</label>
                <input v-model="form.name" class="form-input" placeholder="เช่น Netflix Premium" required />
              </div>

              <div class="form-group">
                <label class="form-label">หมวดหมู่</label>
                <select v-model="form.category" class="form-input form-select">
                  <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">ระยะเวลาแพ็กเกจ (วัน)</label>
                <input v-model.number="form.duration_days" type="number" class="form-input" min="1" />
              </div>

              <div class="form-group">
                <label class="form-label">ราคาขาย (฿)</label>
                <input v-model.number="form.price" type="number" class="form-input" min="0" required />
              </div>

              <div class="form-group">
                <label class="form-label">ราคาปกติ / ก่อนลด (฿)</label>
                <input v-model.number="form.original_price" type="number" class="form-input" min="0" required />
              </div>

              <div class="form-group">
                <label class="form-label">จำนวนสินค้าในสต็อก</label>
                <input v-model.number="form.stock_count" type="number" class="form-input" min="0" />
              </div>

              <div class="form-group">
                <label class="form-label">สถานะการวางขาย</label>
                <select v-model="form.is_available" class="form-input form-select">
                  <option :value="true">เปิดขายทันที (Available)</option>
                  <option :value="false">ปิดขายชั่วคราว (Out of Stock)</option>
                </select>
              </div>

              <div class="form-group" style="grid-column:span 2;">
                <label class="form-label">คำอธิบายสั้น (แสดงบน Card หน้าร้าน)</label>
                <input v-model="form.description" class="form-input" placeholder="ดูหนัง ซีรีส์ และอนิเมะไม่จำกัด คุณภาพ 4K HDR..." />
              </div>

              <div class="form-group" style="grid-column:span 2;">
                <label class="form-label">คำอธิบายละเอียด (แสดงในหน้า Product Detail)</label>
                <textarea v-model="form.long_description" class="form-input" rows="3" placeholder="รายละเอียดแบบเต็ม..."></textarea>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex; justify-content:flex-end; gap:var(--space-3); margin-top:var(--space-3);">
              <button type="button" class="btn btn-secondary" @click="showModal = false">ยกเลิก</button>
              <button type="submit" class="btn btn-primary" id="btn-save-product">💾 บันทึกสินค้า</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.table-img-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(249, 115, 22, 0.4);
  background: rgba(249, 115, 22, 0.04);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  cursor: pointer;
  text-align: center;
  transition: all var(--transition-fast);
}

.upload-dropzone:hover {
  border-color: var(--accent-400);
  background: rgba(249, 115, 22, 0.08);
}

.preset-thumb-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-thumb-btn:hover {
  border-color: var(--accent-400);
  transform: translateY(-2px);
  background: rgba(249, 115, 22, 0.1);
}

.preset-thumb-img {
  width: 100%;
  height: 38px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

/* Preview Card Box */
.preview-card-box {
  background: var(--glass-bg);
  border: 1.5px solid rgba(249, 115, 22, 0.35);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.preview-card-header {
  padding: var(--space-4) var(--space-3) var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent);
}

.preview-img-wrapper {
  width: 100%;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-2);
  background: var(--bg-surface);
}

.preview-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-emoji-wrapper {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-1);
}

.preview-title {
  font-weight: 700;
  color: var(--white);
  font-size: 0.9rem;
  text-align: center;
  margin-top: 4px;
}

.preview-body {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--glass-border);
}
</style>
