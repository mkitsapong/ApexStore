# ⚡ คู่มือการเชื่อมต่อ Supabase เข้ากับ ApexStore

คู่มือนี้จะพาคุณติดตั้งและเชื่อมต่อ **Supabase Database & Auth** เข้ากับระบบ ApexStore ทีละขั้นตอนอย่างง่ายดาย

---

## 📋 ขั้นตอนที่ 1: สร้างโปรเจกต์ Supabase
1. เข้าไปที่เว็บไซต์ [https://supabase.com](https://supabase.com) แล้วเข้าสู่ระบบ (หรือสมัครสมาชิกฟรี)
2. คลิกปุ่ม **"New Project"**
3. ตั้งชื่อโปรเจกต์ (เช่น `ApexStore`) และกำหนด Database Password
4. เลือก Region ที่ใกล้ที่สุด (เช่น **Singapore** `ap-southeast-1`) แล้วกด **"Create new project"**

---

## 🗄️ ขั้นตอนที่ 2: รัน SQL Schema (สร้างตาราง, Storage, Realtime, และฟังก์ชัน)
1. ในหน้าแดชบอร์ด Supabase ไปที่เมนู **SQL Editor** (ไอคอน `>_` ด้านซ้าย)
2. คลิก **"New query"**
3. คัดลอกเนื้อหาทั้งหมดจากไฟล์ [`supabase/schema.sql`](./supabase/schema.sql) ในโปรเจกต์นี้มาวาง
4. คลิกปุ่ม **"Run"** (หรือกด `Ctrl+Enter`)
5. ระบบจะสร้าง:
   - ตาราง `profiles`, `products`, `orders`, `topup_transactions`, `app_settings`
   - Storage Buckets: `product-images` (Public CDN) และ `payment-slips` (Private Storage)
   - Realtime Replication บนทุกตารางสำคัญ
   - ข้อมูลสินค้าเริ่มต้น 8 รายการ


---

## 🔑 ขั้นตอนที่ 3: คัดลอก API Keys มาใส่ในไฟล์ `.env`
1. ไปที่เมนู **Project Settings** (ไอคอนฟันเฟือง ⚙️ มุมซ้ายล่าง) > เลือกหัวข้อ **API**
2. คัดลอกค่า 2 ตัวนี้:
   - **Project URL** (เช่น `https://xyzcompany.supabase.co`)
   - **anon / public key** (เช่น `eyJhbGciOi...`)
3. เปิดไฟล์ `.env` ในโปรเจกต์นี้ แล้วนำค่าที่ได้มาใส่:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. บันทึกไฟล์ `.env` และ Restart Server (`npm run dev`)

---

## 🌐 ขั้นตอนที่ 4: การตั้งค่า "Continue with Google" (Google OAuth)
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/) > สร้างโปรเจกต์ใหม่
2. ไปที่ **APIs & Services** > **OAuth consent screen** > เลือก **External** และกรอกชื่อแอป
3. ไปที่ **Credentials** > คลิก **Create Credentials** > เลือก **OAuth client ID**
   - **Application type**: Web application
   - **Authorized redirect URIs**: คัดลอก Callback URL จาก Supabase (รูปแบบ: `https://<your-project-id>.supabase.co/auth/v1/callback`)
4. คัดลอก **Client ID** และ **Client Secret** ที่ได้จาก Google
5. ใน **Supabase Dashboard** > ไปที่ **Authentication** > **Providers** > เลือก **Google**
6. เปิดสวิตช์ **Enable Google provider**, วาง **Client ID** และ **Client Secret** แล้วกด **Save**

---

## 👑 ขั้นตอนที่ 5: การตั้งค่าบัญชี Admin
เมื่อคุณสมัครสมาชิกในเว็บผ่านหน้า `/auth/register` หรือ Google Login แล้ว:
1. ไปที่ Supabase Dashboard > **Table Editor** > เลือกตาราง **`profiles`**
2. หาแถวที่เป็น User ของคุณ แล้วเปลี่ยนค่าในคอลัมน์ `role` จาก `'user'` เป็น `'admin'`
3. เมื่อบันทึกแล้ว คุณจะสามารถเข้าใช้งานหน้าจัดการระบบ Admin (`/admin`, `/admin/products`, `/admin/orders`, `/admin/topups`, `/admin/users`) ได้อย่างสมบูรณ์

---

## 🛡️ ฟีเจอร์ความปลอดภัย (Security & RLS)
- ✅ **Row Level Security (RLS)**: ป้องกันไม่ให้ผู้ใช้แอบดูข้อมูลหรือคำสั่งซื้อของผู้อื่น
- ✅ **Atomic Balances**: ระบบตัดยอดเงินและเติมเงินทำงานผ่าน Stored Procedure ป้องกันปัญหายอดเงินติดลบ
- ✅ **Graceful Fallback**: หากยังไม่ได้ใส่ค่า Key ใน `.env` ระบบจะรันในโหมด Demo อัตโนมัติเพื่อให้ทดสอบระบบหน้าบ้านได้ทันที

