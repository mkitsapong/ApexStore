# ⚡ ApexStore — Premium App & Digital Subscriptions Store

เว็บแอปพลิเคชันจำหน่ายบัญชี Premium App (Netflix, Spotify, Disney+, YouTube, ChatGPT Plus, Canva Pro ฯลฯ) พร้อมระบบสมาชิก, ระบบกระเป๋าเงิน (Wallet), ระบบเติมเงิน **PromptPay QR Code + Auto Slip Verify ตรวจสลิปอัตโนมัติ 24 ชม.** และระบบจัดการหลังบ้าน **Admin Panel** ครบวงจร

---

## ✨ ฟีเจอร์หลัก (Key Features)

### 🌐 หน้าสำหรับลูกค้าทั่วไป (Public)
- **หน้าหลัก (Home)**: Hero Section, หมวดหมู่สินค้า, สินค้าขายดี, วิธีการสั่งซื้อ 3 สเต็ป, รีวิวจากลูกค้า
- **หน้าร้านค้า (Shop)**: ระบบค้นหาแบบ Realtime, ตัวกรองหมวดหมู่, ตัวเรียงลำดับราคา/ส่วนลด, แสดงรูปภาพสินค้าคมชัด
- **หน้ารายละเอียดสินค้า (Product Detail)**: ตัวเลือกแพ็กเกจระยะเวลา, รายละเอียดฟีเจอร์, ปุ่มสั่งซื้อพร้อมระบบตรวจเช็คยอดเงิน Wallet และปุ่มทางลัดไปเติมเงิน
- **ระบบสมาชิก (Auth)**: หน้าเข้าสู่ระบบ (Login) และสมัครสมาชิก (Register) พร้อมปุ่ม Demo User / Admin สำหรับทดสอบ

### 👤 หน้าสำหรับสมาชิก (Member Area)
- **Dashboard**: สรุปยอดเงินคงเหลือ, สถิติคำสั่งซื้อ, ประวัติธุรกรรมล่าสุด
- **Wallet**: แสดงยอดเงินคงเหลือ และตารางประวัติธุรกรรม (เติมเงิน/ซื้อสินค้า)
- **ระบบเติมเงิน (PromptPay Auto Slip Verify)**:
  - สร้าง QR Code พร้อมเพย์ตามมาตรฐาน EMVCo ระบุยอดเงินอัตโนมัติ
  - นับเวลาถอยหลัง (Countdown Timer 15 นาที) พร้อมปุ่มคัดลอกเบอร์และบันทึกรูป QR
  - กล่อง Drag & Drop แนบรูปสลิป
  - ระบบตรวจสลิปอัตโนมัติ (อ่าน QR ในสลิป ➔ เช็คฐานข้อมูลธนาคาร ➔ ป้องกันสลิปซ้ำ ➔ เพิ่มยอดเงินเข้า Wallet ทันที 24 ชม.)
  - ออกใบเสร็จยืนยัน (Verified Receipt) พร้อมเลขอ้างอิง TransRef
- **คำสั่งซื้อ (Orders & Order Detail)**: ดูประวัติการสั่งซื้อทั้งหมด และกดดูข้อมูลบัญชี (Email / Password) พร้อมปุ่มคัดลอก
- **โปรไฟล์ (Profile)**: แก้ไขข้อมูลส่วนตัว และเปลี่ยนรหัสผ่าน

### 👑 ระบบจัดการหลังบ้าน (Admin Panel)
- **Admin Dashboard**: ยอดขายรวม, จำนวนคำสั่งซื้อ, จำนวนสมาชิก, รายการรอตรวจสอบ
- **จัดการสินค้า (Products CRUD)**:
  - เพิ่ม/ลบ/แก้ไขข้อมูลสินค้าและราคา
  - **ระบบจัดการรูปภาพการ์ดสินค้า**: อัปโหลดรูปจากคอมพิวเตอร์ (Base64), ใส่ URL รูปภาพโดยตรง หรือเลือกโลโก้แบรนด์สำเร็จรูป
  - Live Card Preview ดูตัวอย่างการ์ดก่อนบันทึก
  - เปิด/ปิดการวางขาย (Available / Out of Stock)
- **จัดการคำสั่งซื้อ (Orders)**: ตรวจสอบและอนุมัติ/ปฏิเสธคำสั่งซื้อ
- **จัดการระบบเติมเงิน (Topups & Settings)**:
  - ตรวจสอบประวัติสลิปโอนเงินทั้งหมดและดูรูปสลิป
  - ตั้งค่าเบอร์ PromptPay และชื่อบัญชีร้านค้า
  - ใส่ SlipOK API Key สำหรับเชื่อมต่อธนาคารจริง
  - เปิด/ปิดระบบ Auto-Approve และ Simulator Mode
- **จัดการผู้ใช้ (Users)**: ค้นหาผู้ใช้, ปรับยอดเงิน Wallet, สลับสถานะ Active / Suspended

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: [Vue.js 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/) (พร้อม localStorage persistence)
- **Routing**: [Vue Router 4](https://router.vuejs.org/) (พร้อม Navigation Guards ป้องกันเส้นทาง Auth / Admin)
- **QR Code & Slip Scanning**:
  - `qrcode` (สร้าง PromptPay EMVCo QR Code)
  - `jsqr` (อ่านและถอดรหัส QR Code จากภาพสลิป)
- **Styling**: Vanilla CSS Design System (Dark Navy/Orange Theme, Glassmorphism, Responsive)
- **Fonts**: [Google Fonts (Noto Sans Thai & Inter)](https://fonts.google.com/)

---

## 🚀 วิธีติดตั้งและรันโปรเจกต์ (Installation)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันโหมด Development
npm run dev

# 3. Build สำหรับ Production
npm run build
```

---

## 🔑 บัญชีสำหรับทดสอบ (Demo Credentials)

| สิทธิ์ (Role) | อีเมล (Email) | รหัสผ่าน (Password) |
|---|---|---|
| 👤 **User (สมาชิก)** | `demo@apexstore.com` | `demo1234` |
| 👑 **Admin (แอดมิน)** | `admin@apexstore.com` | `admin1234` |
