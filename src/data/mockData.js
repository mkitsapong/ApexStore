// Mock Data — Products
export const mockProducts = [
  {
    id: 1,
    name: 'Netflix Premium',
    category: 'streaming',
    description: 'ดูหนัง ซีรีส์ และอนิเมะไม่จำกัด คุณภาพ 4K HDR บน 4 หน้าจอพร้อมกัน รองรับ Dolby Atmos',
    long_description: 'บัญชี Netflix Premium ดูได้พร้อมกัน 4 หน้าจอ คุณภาพสูงสุด 4K Ultra HD พร้อม HDR และ Dolby Atmos ดาวน์โหลดดูออฟไลน์ได้ไม่จำกัด เข้าถึงเนื้อหาจากทั่วโลก ไม่มีโฆษณา',
    image_url: 'https://picsum.photos/seed/netflix/400/225',
    logo_emoji: '🎬',
    color: '#E50914',
    duration_days: 30,
    price: 149,
    original_price: 419,
    is_available: true,
    stock_count: 42,
    features: ['4K Ultra HD', 'Dolby Atmos', '4 จอพร้อมกัน', 'ดาวน์โหลดได้', 'ไม่มีโฆษณา'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 149 },
      { id: '3m', label: '3 เดือน', duration_days: 90, price: 399 },
      { id: '6m', label: '6 เดือน', duration_days: 180, price: 749 },
    ]
  },
  {
    id: 2,
    name: 'Spotify Premium',
    category: 'music',
    description: 'ฟังเพลงไม่จำกัด ไม่มีโฆษณา ดาวน์โหลดฟังออฟไลน์ เสียงคุณภาพสูง HiFi',
    long_description: 'Spotify Premium ฟังเพลงได้ไม่จำกัด ไม่มีโฆษณาขัดจังหวะ เลือกเพลงได้ตรงตามใจ ดาวน์โหลดเพลงฟังแบบออฟไลน์ เสียงคุณภาพสูงสุด 320kbps หรือ Lossless',
    image_url: 'https://picsum.photos/seed/spotify/400/225',
    logo_emoji: '🎵',
    color: '#1DB954',
    duration_days: 30,
    price: 89,
    original_price: 229,
    is_available: true,
    stock_count: 78,
    features: ['ไม่มีโฆษณา', 'เสียง HiFi', 'ดาวน์โหลดได้', 'เลือกเพลงได้', 'ข้ามเพลงไม่จำกัด'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 89 },
      { id: '3m', label: '3 เดือน', duration_days: 90, price: 239 },
      { id: '6m', label: '6 เดือน', duration_days: 180, price: 459 },
    ]
  },
  {
    id: 3,
    name: 'Disney+ Hotstar',
    category: 'streaming',
    description: 'Marvel, Star Wars, Pixar, National Geographic รวมถึงซีรีส์ไทยและต่างประเทศ',
    long_description: 'Disney+ Hotstar รวม Marvel Cinematic Universe, Star Wars, Pixar Animation, National Geographic และคอนเทนต์เอ็กซ์คลูซีฟจาก Disney Originals พร้อมซีรีส์ไทยและสากลอีกหลายพันรายการ',
    image_url: 'https://picsum.photos/seed/disney/400/225',
    logo_emoji: '🏰',
    color: '#113CCF',
    duration_days: 30,
    price: 129,
    original_price: 299,
    is_available: true,
    stock_count: 35,
    features: ['Marvel ครบ', 'Star Wars', 'Pixar', 'National Geographic', '4K HDR'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 129 },
      { id: '3m', label: '3 เดือน', duration_days: 90, price: 349 },
      { id: '6m', label: '6 เดือน', duration_days: 180, price: 649 },
    ]
  },
  {
    id: 4,
    name: 'YouTube Premium',
    category: 'streaming',
    description: 'ดู YouTube ไม่มีโฆษณา ดาวน์โหลดวิดีโอ ฟัง background พร้อม YouTube Music',
    long_description: 'YouTube Premium เพลิดเพลินกับ YouTube แบบไม่มีโฆษณา ดาวน์โหลดวิดีโอดูออฟไลน์ เล่นในพื้นหลังขณะใช้แอปอื่น และรับ YouTube Music Premium ฟรีในตัว',
    image_url: 'https://picsum.photos/seed/youtube/400/225',
    logo_emoji: '▶️',
    color: '#FF0000',
    duration_days: 30,
    price: 99,
    original_price: 239,
    is_available: true,
    stock_count: 56,
    features: ['ไม่มีโฆษณา', 'Background Play', 'ดาวน์โหลดได้', 'YouTube Music', 'YouTube Originals'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 99 },
      { id: '3m', label: '3 เดือน', duration_days: 90, price: 269 },
      { id: '6m', label: '6 เดือน', duration_days: 180, price: 519 },
    ]
  },
  {
    id: 5,
    name: 'Apple TV+',
    category: 'streaming',
    description: 'ดูซีรีส์และภาพยนตร์ Originals สุดพิเศษจาก Apple คุณภาพสูงระดับโรงภาพยนตร์',
    long_description: 'Apple TV+ นำเสนอ Originals เอ็กซ์คลูซีฟจาก Apple ที่ได้รับรางวัลมากมาย ทั้งซีรีส์ ภาพยนตร์ สารคดี คุณภาพระดับสตูดิโอใหญ่ ใช้ได้บนทุกอุปกรณ์',
    image_url: 'https://picsum.photos/seed/appletv/400/225',
    logo_emoji: '🍎',
    color: '#555555',
    duration_days: 30,
    price: 119,
    original_price: 259,
    is_available: true,
    stock_count: 28,
    features: ['Apple Originals', '4K Dolby Vision', 'Dolby Atmos', 'ทุกอุปกรณ์', 'Offline'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 119 },
      { id: '3m', label: '3 เดือน', duration_days: 90, price: 319 },
    ]
  },
  {
    id: 6,
    name: 'Canva Pro',
    category: 'design',
    description: 'ออกแบบกราฟิกระดับมือโปร เทมเพลต 100M+ และเครื่องมือ AI อันทรงพลัง',
    long_description: 'Canva Pro ปลดล็อกทุกฟีเจอร์ Pro เทมเพลตพรีเมียม 100M+ ภาพ, วิดีโอ, กราฟิก ฟรีเข้าถึงได้ ลบพื้นหลังอัตโนมัติ กำหนดตราสินค้า ทำงานร่วมกันเป็นทีม',
    image_url: 'https://picsum.photos/seed/canva/400/225',
    logo_emoji: '🎨',
    color: '#7D2AE8',
    duration_days: 30,
    price: 199,
    original_price: 549,
    is_available: true,
    stock_count: 20,
    features: ['เทมเพลต 100M+', 'ลบพื้นหลัง AI', 'Brand Kit', 'Magic Resize', 'ทำงานเป็นทีม'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 199 },
      { id: '3m', label: '3 เดือน', duration_days: 90, price: 539 },
      { id: '6m', label: '6 เดือน', duration_days: 180, price: 999 },
    ]
  },
  {
    id: 7,
    name: 'ChatGPT Plus',
    category: 'ai',
    description: 'GPT-4o, DALL-E 3, Code Interpreter, Advanced Data Analysis — AI ทรงพลังที่สุด',
    long_description: 'ChatGPT Plus เข้าถึง GPT-4o สุดล้ำ สร้างรูปด้วย DALL-E 3 วิเคราะห์ข้อมูล Code Interpreter Plugins เข้าถึงได้ในชั่วโมงเร่งด่วน และอัปเดตฟีเจอร์ใหม่ก่อนใคร',
    image_url: 'https://picsum.photos/seed/chatgpt/400/225',
    logo_emoji: '🤖',
    color: '#10a37f',
    duration_days: 30,
    price: 599,
    original_price: 699,
    is_available: true,
    stock_count: 15,
    features: ['GPT-4o', 'DALL-E 3', 'Code Interpreter', 'Web Browsing', 'ไม่มี Limit ช่วงเร่งด่วน'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 599 },
    ]
  },
  {
    id: 8,
    name: 'Adobe Creative Cloud',
    category: 'design',
    description: 'Photoshop, Illustrator, Premiere Pro, After Effects และแอปอีก 20+ รายการ',
    long_description: 'Adobe Creative Cloud All Apps ครบทุกแอปในชุด Adobe ทั้ง Photoshop, Illustrator, Premiere Pro, After Effects, InDesign, Lightroom และอีกกว่า 20 แอป พื้นที่ Cloud 100GB',
    image_url: 'https://picsum.photos/seed/adobe/400/225',
    logo_emoji: '🔴',
    color: '#FF0000',
    duration_days: 30,
    price: 899,
    original_price: 1999,
    is_available: false,
    stock_count: 0,
    features: ['Photoshop', 'Illustrator', 'Premiere Pro', 'After Effects', 'Cloud 100GB'],
    packages: [
      { id: '1m', label: '1 เดือน', duration_days: 30, price: 899 },
      { id: '3m', label: '3 เดือน', duration_days: 90, price: 2499 },
    ]
  }
]

// Mock Orders
export const mockOrders = [
  {
    id: 'ORD-2024-001',
    user_id: 'user1',
    product_id: 1,
    product_name: 'Netflix Premium',
    product_emoji: '🎬',
    amount: 149,
    status: 'completed',
    account_email: 'netflix.acc01@example.com',
    account_password: 'Netflix@2024!',
    expires_at: '2026-09-20',
    created_at: '2026-08-20T10:30:00Z',
    package_label: '1 เดือน'
  },
  {
    id: 'ORD-2024-002',
    user_id: 'user1',
    product_id: 2,
    product_name: 'Spotify Premium',
    product_emoji: '🎵',
    amount: 239,
    status: 'completed',
    account_email: 'spotify.acc07@example.com',
    account_password: 'Spotify@Prm7',
    expires_at: '2026-11-20',
    created_at: '2026-08-18T14:20:00Z',
    package_label: '3 เดือน'
  },
  {
    id: 'ORD-2024-003',
    user_id: 'user1',
    product_id: 4,
    product_name: 'YouTube Premium',
    product_emoji: '▶️',
    amount: 99,
    status: 'pending',
    account_email: null,
    account_password: null,
    expires_at: null,
    created_at: '2026-08-21T09:15:00Z',
    package_label: '1 เดือน'
  }
]

// Mock Transactions
export const mockTransactions = [
  {
    id: 'TXN-001',
    type: 'topup',
    amount: 500,
    balance_before: 0,
    balance_after: 500,
    description: 'เติมเงินผ่าน PromptPay',
    created_at: '2026-08-15T10:00:00Z',
    status: 'completed'
  },
  {
    id: 'TXN-002',
    type: 'purchase',
    amount: -149,
    balance_before: 500,
    balance_after: 351,
    description: 'ซื้อ Netflix Premium 1 เดือน',
    created_at: '2026-08-20T10:30:00Z',
    status: 'completed'
  },
  {
    id: 'TXN-003',
    type: 'topup',
    amount: 300,
    balance_before: 351,
    balance_after: 651,
    description: 'เติมเงินผ่าน PromptPay',
    created_at: '2026-08-17T16:45:00Z',
    status: 'completed'
  },
  {
    id: 'TXN-004',
    type: 'purchase',
    amount: -239,
    balance_before: 651,
    balance_after: 412,
    description: 'ซื้อ Spotify Premium 3 เดือน',
    created_at: '2026-08-18T14:20:00Z',
    status: 'completed'
  },
  {
    id: 'TXN-005',
    type: 'purchase',
    amount: -99,
    balance_before: 412,
    balance_after: 313,
    description: 'ซื้อ YouTube Premium 1 เดือน',
    created_at: '2026-08-21T09:15:00Z',
    status: 'pending'
  }
]

// Mock Top-up Requests (for admin)
export const mockTopupRequests = [
  {
    id: 'TOP-001',
    user_id: 'user2',
    username: 'somchai_k',
    amount: 500,
    slip_url: 'https://picsum.photos/seed/slip1/200/300',
    status: 'pending',
    created_at: '2026-08-21T08:00:00Z'
  },
  {
    id: 'TOP-002',
    user_id: 'user3',
    username: 'napa_w',
    amount: 1000,
    slip_url: 'https://picsum.photos/seed/slip2/200/300',
    status: 'approved',
    approved_by: 'admin',
    created_at: '2026-08-20T15:30:00Z'
  },
  {
    id: 'TOP-003',
    user_id: 'user4',
    username: 'john_doe99',
    amount: 200,
    slip_url: 'https://picsum.photos/seed/slip3/200/300',
    status: 'pending',
    created_at: '2026-08-21T10:45:00Z'
  }
]

// Mock Users (for admin)
export const mockUsers = [
  { id: 'user1', username: 'demo_user', email: 'demo@apexstore.com', balance: 313, role: 'user', total_orders: 3, created_at: '2026-07-01T00:00:00Z', status: 'active' },
  { id: 'user2', username: 'somchai_k', email: 'somchai@gmail.com', balance: 0, role: 'user', total_orders: 7, created_at: '2026-06-15T00:00:00Z', status: 'active' },
  { id: 'user3', username: 'napa_w', email: 'napa@hotmail.com', balance: 1050, role: 'user', total_orders: 12, created_at: '2026-05-20T00:00:00Z', status: 'active' },
  { id: 'user4', username: 'john_doe99', email: 'john@outlook.com', balance: 800, role: 'user', total_orders: 2, created_at: '2026-08-10T00:00:00Z', status: 'active' },
  { id: 'admin1', username: 'admin', email: 'admin@apexstore.com', balance: 0, role: 'admin', total_orders: 0, created_at: '2026-01-01T00:00:00Z', status: 'active' },
]

// Mock Reviews
export const mockReviews = [
  { id: 1, user: 'สมชาย ก.', avatar: '😊', rating: 5, text: 'บริการดีมาก ได้รับบัญชีเร็วมาก ราคาถูกกว่าซื้อเองตรงๆ เยอะ แนะนำเลย!', product: 'Netflix Premium', date: '2026-08-20' },
  { id: 2, user: 'นภา ว.', avatar: '🌟', rating: 5, text: 'ใช้งานได้จริงทุกอย่าง ระบบเติมเงินสะดวก Admin ตอบเร็ว จะกลับมาซื้ออีกแน่นอน', product: 'Spotify Premium', date: '2026-08-18' },
  { id: 3, user: 'John D.', avatar: '🎯', rating: 5, text: 'Great service! Got my YouTube Premium account instantly after payment. Very reliable shop!', product: 'YouTube Premium', date: '2026-08-17' },
  { id: 4, user: 'มาลี ร.', avatar: '💫', rating: 4, text: 'ร้านน่าเชื่อถือ เคยซื้อมาหลายครั้งแล้ว ไม่เคยมีปัญหา ราคาถูกที่สุดในตลาด', product: 'Disney+', date: '2026-08-15' },
  { id: 5, user: 'เอกชัย บ.', avatar: '🔥', rating: 5, text: 'Canva Pro ใช้งานได้ปกติ Features ครบทุกอย่าง ราคาถูกมากเมื่อเทียบกับเว็บทางการ', product: 'Canva Pro', date: '2026-08-14' },
  { id: 6, user: 'พิมพ์ ส.', avatar: '✨', rating: 5, text: 'ระบบดีมาก ซื้อง่าย จ่ายเงินง่าย ได้บัญชีเลยไม่ต้องรอ จะแนะนำเพื่อนด้วย', product: 'ChatGPT Plus', date: '2026-08-12' },
]

// Helper function
export function formatCurrency(amount) {
  return `฿${amount.toLocaleString('th-TH')}`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
