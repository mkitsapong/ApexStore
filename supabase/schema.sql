-- ========================================================
-- ApexStore - Complete Supabase Database Schema
-- Run this script in the Supabase SQL Editor
-- ========================================================

-- 1. Create Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Create Profiles Table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  balance numeric not null default 0 check (balance >= 0),
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Automatic Profile Creation on New User Registration (Email & Google OAuth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, role, balance, avatar_url, status)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce((new.raw_user_meta_data->>'balance')::numeric, 0),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    'active'
  )
  on conflict (id) do update set
    username = coalesce(public.profiles.username, excluded.username),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    email = coalesce(excluded.email, public.profiles.email);
  return new;
end;
$$;


drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Helper Function: Check If Current User Is Admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5. Create Products Table
create table if not exists public.products (
  id bigint primary key generated always as identity,
  name text not null,
  category text not null default 'streaming',
  description text default '',
  long_description text default '',
  image_url text default '',
  logo_emoji text default '📦',
  color text default '#F97316',
  duration_days integer not null default 30,
  price numeric not null default 0,
  original_price numeric default 0,
  is_available boolean not null default true,
  stock_count integer not null default 10,
  features jsonb not null default '[]'::jsonb,
  packages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Create Orders Table
create table if not exists public.orders (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  product_id bigint references public.products(id) on delete set null,
  product_name text not null,
  product_emoji text default '📦',
  package_label text default '1 เดือน',
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  account_email text,
  account_password text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 7. Create Topup Transactions Table
create table if not exists public.topup_transactions (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  amount numeric not null default 0,
  trans_ref text,
  sender jsonb default '{}'::jsonb,
  receiver jsonb default '{}'::jsonb,
  slip_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_auto_approved boolean not null default false,
  is_simulated boolean not null default false,
  error_message text,
  created_at timestamptz not null default now()
);

-- 8. Create App Settings Table
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ========================================================
-- Row Level Security (RLS) Policies
-- ========================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.topup_transactions enable row level security;
alter table public.app_settings enable row level security;

-- Profiles Policies
create policy "Public can view basic profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins have full access to profiles" on public.profiles
  for all using (public.is_admin());

-- Products Policies
create policy "Anyone can view products" on public.products
  for select using (true);

create policy "Admins can insert products" on public.products
  for insert with check (public.is_admin());

create policy "Admins can update products" on public.products
  for update using (public.is_admin());

create policy "Admins can delete products" on public.products
  for delete using (public.is_admin());

-- Orders Policies
create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own orders" on public.orders
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "Admins can update orders" on public.orders
  for update using (public.is_admin());

-- Topup Transactions Policies
create policy "Users can view own topups" on public.topup_transactions
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert topups" on public.topup_transactions
  for insert with check (auth.uid() = user_id or user_id is null or public.is_admin());

create policy "Admins can update topups" on public.topup_transactions
  for update using (public.is_admin());

-- App Settings Policies (Public can view non-secret settings, Admins can view and manage all)
create policy "Anyone can view public settings" on public.app_settings
  for select using (key != 'encryption_settings' or public.is_admin());

create policy "Admins can manage settings" on public.app_settings
  for all using (public.is_admin());

-- ========================================================
-- Stored Procedures / RPC Functions
-- ========================================================

-- Helper: Get Encryption Secret (security definer, non-accessible by public)
create or replace function public.get_encryption_secret()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select value->>'secret'
  from public.app_settings
  where key = 'encryption_settings'
  limit 1;
$$;

-- Revoke direct access from regular users (only called internally by other security definer functions)
revoke execute on function public.get_encryption_secret() from anon, authenticated;

-- RPC: Encrypt and Save Account Credentials (Admin Only)
create or replace function public.set_order_credentials(
  p_order_id text,
  p_email text,
  p_password text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_secret text;
begin
  -- Only admin can set credentials
  if not public.is_admin() then
    raise exception 'ไม่มีสิทธิ์ดำเนินการนี้';
  end if;

  select public.get_encryption_secret() into v_secret;

  if v_secret is null or length(v_secret) < 16 then
    raise exception 'Encryption secret is not configured';
  end if;

  update public.orders
  set
    account_email    = p_email,
    account_password = encode(
      pgp_sym_encrypt(p_password, v_secret, 'compress-algo=1, cipher-algo=aes256'),
      'base64'
    ),
    status           = 'completed'
  where id = p_order_id;

  return found;
end;
$$;

-- RPC: Decrypt and Return Account Credentials (Owner or Admin)
create or replace function public.get_order_credentials(p_order_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order       public.orders%ROWTYPE;
  v_secret      text;
  v_plain_pass  text;
begin
  select * into v_order
  from public.orders
  where id = p_order_id;

  -- Not found
  if not found then
    return jsonb_build_object('success', false, 'error', 'ไม่พบคำสั่งซื้อ');
  end if;

  -- Auth check: must be owner or admin
  if v_order.user_id != auth.uid() and not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
  end if;

  -- Order must be completed
  if v_order.status != 'completed' then
    return jsonb_build_object('success', false, 'error', 'คำสั่งซื้อยังไม่สำเร็จ');
  end if;

  select public.get_encryption_secret() into v_secret;

  if v_secret is null then
    return jsonb_build_object('success', false, 'error', 'ระบบยังไม่พร้อม กรุณาติดต่อ Admin');
  end if;

  -- Try to decrypt (password may be plaintext for legacy rows)
  begin
    v_plain_pass := pgp_sym_decrypt(
      decode(v_order.account_password, 'base64'),
      v_secret
    );
  exception when others then
    -- Legacy plaintext fallback
    v_plain_pass := v_order.account_password;
  end;

  return jsonb_build_object(
    'success',  true,
    'email',    v_order.account_email,
    'password', v_plain_pass
  );
end;
$$;

-- Adjust User Balance Safely
create or replace function public.add_user_balance(p_user_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
as $$
declare
  v_new_balance numeric;
begin
  update public.profiles
  set balance = balance + p_amount,
      updated_at = now()
  where id = p_user_id
  returning balance into v_new_balance;

  return v_new_balance;
end;
$$;

create or replace function public.deduct_user_balance(p_user_id uuid, p_amount numeric)
returns boolean
language plpgsql
security definer
as $$
declare
  v_current_balance numeric;
begin
  select balance into v_current_balance
  from public.profiles
  where id = p_user_id;

  if v_current_balance is null or v_current_balance < p_amount then
    return false;
  end if;

  update public.profiles
  set balance = balance - p_amount,
      updated_at = now()
  where id = p_user_id;

  return true;
end;
$$;

-- Atomic Purchase Function
create or replace function public.purchase_product(
  p_order_id text,
  p_product_id bigint,
  p_product_name text,
  p_product_emoji text,
  p_package_label text,
  p_amount numeric,
  p_duration_days integer
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_balance numeric;
  v_expires_at timestamptz;
  v_order_record public.orders%ROWTYPE;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ');
  end if;

  select balance into v_current_balance
  from public.profiles
  where id = v_user_id;

  if v_current_balance is null or v_current_balance < p_amount then
    return jsonb_build_object('success', false, 'error', 'ยอดเงินไม่เพียงพอ');
  end if;

  -- Deduct Balance
  update public.profiles
  set balance = balance - p_amount,
      updated_at = now()
  where id = v_user_id;

  -- Calculate Expiration Date
  v_expires_at := now() + (p_duration_days || ' days')::interval;

  -- Create Order Record
  insert into public.orders (
    id, user_id, product_id, product_name, product_emoji,
    package_label, amount, status, expires_at, created_at
  )
  values (
    p_order_id, v_user_id, p_product_id, p_product_name, p_product_emoji,
    p_package_label, p_amount, 'pending', v_expires_at, now()
  )
  returning * into v_order_record;

  return jsonb_build_object(
    'success', true,
    'order', row_to_json(v_order_record),
    'new_balance', v_current_balance - p_amount
  );
end;
$$;

-- ========================================================
-- Initial Seed Data
-- ========================================================

-- Insert Initial Products
insert into public.products (name, category, description, long_description, image_url, logo_emoji, color, duration_days, price, original_price, is_available, stock_count, features, packages)
values
  (
    'Netflix Premium',
    'streaming',
    'ดูหนัง ซีรีส์ และอนิเมะไม่จำกัด คุณภาพ 4K HDR บน 4 หน้าจอพร้อมกัน รองรับ Dolby Atmos',
    'บัญชี Netflix Premium ดูได้พร้อมกัน 4 หน้าจอ คุณภาพสูงสุด 4K Ultra HD พร้อม HDR และ Dolby Atmos ดาวน์โหลดดูออฟไลน์ได้ไม่จำกัด เข้าถึงเนื้อหาจากทั่วโลก ไม่มีโฆษณา',
    'https://picsum.photos/seed/netflix/400/225',
    '🎬',
    '#E50914',
    30,
    149,
    419,
    true,
    42,
    '["4K Ultra HD", "Dolby Atmos", "4 จอพร้อมกัน", "ดาวน์โหลดได้", "ไม่มีโฆษณา"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 149}, {"id": "3m", "label": "3 เดือน", "duration_days": 90, "price": 399}, {"id": "6m", "label": "6 เดือน", "duration_days": 180, "price": 749}]'::jsonb
  ),
  (
    'Spotify Premium',
    'music',
    'ฟังเพลงไม่จำกัด ไม่มีโฆษณา ดาวน์โหลดฟังออฟไลน์ เสียงคุณภาพสูง HiFi',
    'Spotify Premium ฟังเพลงได้ไม่จำกัด ไม่มีโฆษณาขัดจังหวะ เลือกเพลงได้ตรงตามใจ ดาวน์โหลดเพลงฟังแบบออฟไลน์ เสียงคุณภาพสูงสุด 320kbps หรือ Lossless',
    'https://picsum.photos/seed/spotify/400/225',
    '🎵',
    '#1DB954',
    30,
    89,
    229,
    true,
    78,
    '["ไม่มีโฆษณา", "เสียง HiFi", "ดาวน์โหลดได้", "เลือกเพลงได้", "ข้ามเพลงไม่จำกัด"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 89}, {"id": "3m", "label": "3 เดือน", "duration_days": 90, "price": 239}, {"id": "6m", "label": "6 เดือน", "duration_days": 180, "price": 459}]'::jsonb
  ),
  (
    'Disney+ Hotstar',
    'streaming',
    'Marvel, Star Wars, Pixar, National Geographic รวมถึงซีรีส์ไทยและต่างประเทศ',
    'Disney+ Hotstar รวม Marvel Cinematic Universe, Star Wars, Pixar Animation, National Geographic และคอนเทนต์เอ็กซ์คลูซีฟจาก Disney Originals พร้อมซีรีส์ไทยและสากลอีกหลายพันรายการ',
    'https://picsum.photos/seed/disney/400/225',
    '🏰',
    '#113CCF',
    30,
    129,
    299,
    true,
    35,
    '["Marvel ครบ", "Star Wars", "Pixar", "National Geographic", "4K HDR"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 129}, {"id": "3m", "label": "3 เดือน", "duration_days": 90, "price": 349}, {"id": "6m", "label": "6 เดือน", "duration_days": 180, "price": 649}]'::jsonb
  ),
  (
    'YouTube Premium',
    'streaming',
    'ดู YouTube ไม่มีโฆษณา ดาวน์โหลดวิดีโอ ฟัง background พร้อม YouTube Music',
    'YouTube Premium เพลิดเพลินกับ YouTube แบบไม่มีโฆษณา ดาวน์โหลดวิดีโอดูออฟไลน์ เล่นในพื้นหลังขณะใช้แอปอื่น และรับ YouTube Music Premium ฟรีในตัว',
    'https://picsum.photos/seed/youtube/400/225',
    '▶️',
    '#FF0000',
    30,
    99,
    239,
    true,
    56,
    '["ไม่มีโฆษณา", "Background Play", "ดาวน์โหลดได้", "YouTube Music", "YouTube Originals"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 99}, {"id": "3m", "label": "3 เดือน", "duration_days": 90, "price": 269}, {"id": "6m", "label": "6 เดือน", "duration_days": 180, "price": 519}]'::jsonb
  ),
  (
    'Apple TV+',
    'streaming',
    'ดูซีรีส์และภาพยนตร์ Originals สุดพิเศษจาก Apple คุณภาพสูงระดับโรงภาพยนตร์',
    'Apple TV+ นำเสนอ Originals เอ็กซ์คลูซีฟจาก Apple ที่ได้รับรางวัลมากมาย ทั้งซีรีส์ ภาพยนตร์ สารคดี คุณภาพระดับสตูดิโอใหญ่ ใช้ได้บนทุกอุปกรณ์',
    'https://picsum.photos/seed/appletv/400/225',
    '🍎',
    '#555555',
    30,
    119,
    259,
    true,
    28,
    '["Apple Originals", "4K Dolby Vision", "Dolby Atmos", "ทุกอุปกรณ์", "Offline"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 119}, {"id": "3m", "label": "3 เดือน", "duration_days": 90, "price": 319}]'::jsonb
  ),
  (
    'Canva Pro',
    'design',
    'ออกแบบกราฟิกระดับมือโปร เทมเพลต 100M+ และเครื่องมือ AI อันทรงพลัง',
    'Canva Pro ปลดล็อกทุกฟีเจอร์ Pro เทมเพลตพรีเมียม 100M+ ภาพ, วิดีโอ, กราฟิก ฟรีเข้าถึงได้ ลบพื้นหลังอัตโนมัติ กำหนดตราสินค้า ทำงานร่วมกันเป็นทีม',
    'https://picsum.photos/seed/canva/400/225',
    '🎨',
    '#7D2AE8',
    30,
    199,
    549,
    true,
    20,
    '["เทมเพลต 100M+", "ลบพื้นหลัง AI", "Brand Kit", "Magic Resize", "ทำงานเป็นทีม"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 199}, {"id": "3m", "label": "3 เดือน", "duration_days": 90, "price": 539}, {"id": "6m", "label": "6 เดือน", "duration_days": 180, "price": 999}]'::jsonb
  ),
  (
    'ChatGPT Plus',
    'ai',
    'GPT-4o, DALL-E 3, Code Interpreter, Advanced Data Analysis — AI ทรงพลังที่สุด',
    'ChatGPT Plus เข้าถึง GPT-4o สุดล้ำ สร้างรูปด้วย DALL-E 3 วิเคราะห์ข้อมูล Code Interpreter Plugins เข้าถึงได้ในชั่วโมงเร่งด่วน และอัปเดตฟีเจอร์ใหม่ก่อนใคร',
    'https://picsum.photos/seed/chatgpt/400/225',
    '🤖',
    '#10a37f',
    30,
    599,
    699,
    true,
    15,
    '["GPT-4o", "DALL-E 3", "Code Interpreter", "Web Browsing", "ไม่มี Limit ช่วงเร่งด่วน"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 599}]'::jsonb
  ),
  (
    'Adobe Creative Cloud',
    'design',
    'Photoshop, Illustrator, Premiere Pro, After Effects และแอปอีก 20+ รายการ',
    'Adobe Creative Cloud All Apps ครบทุกแอปในชุด Adobe ทั้ง Photoshop, Illustrator, Premiere Pro, After Effects, InDesign, Lightroom และอีกกว่า 20 แอป พื้นที่ Cloud 100GB',
    'https://picsum.photos/seed/adobe/400/225',
    '🔴',
    '#FF0000',
    30,
    899,
    1999,
    false,
    0,
    '["Photoshop", "Illustrator", "Premiere Pro", "After Effects", "Cloud 100GB"]'::jsonb,
    '[{"id": "1m", "label": "1 เดือน", "duration_days": 30, "price": 899}, {"id": "3m", "label": "3 เดือน", "duration_days": 90, "price": 2499}]'::jsonb
  )
on conflict do nothing;

-- Insert Default Payment Settings
insert into public.app_settings (key, value)
values (
  'payment_settings',
  '{
    "promptPayId": "0812345678",
    "promptPayName": "ร้าน ApexStore (Official)",
    "promptPayType": "phone",
    "slipokApiKey": "",
    "isAutoVerify": true,
    "isDemoMode": true,
    "minTopupAmount": 20,
    "maxTopupAmount": 50000
  }'::jsonb
)
on conflict (key) do nothing;

-- Insert Encryption Settings (CHANGE secret BEFORE going to production!)
insert into public.app_settings (key, value)
values (
  'encryption_settings',
  '{"secret": "CHANGE_THIS_SECRET_KEY_MIN_32_CHARS_LONG_abc123"}'
)
on conflict (key) do nothing;

-- Insert Default Store Branding Settings
insert into public.app_settings (key, value)
values (
  'store_settings',
  '{
    "storeName": "ApexStore Premium",
    "storeTagline": "ศูนย์รวมบริการดิจิทัลระดับพรีเมียม ส่งมอบทันที 24 ชั่วโมง",
    "contactLine": "@apexstore",
    "contactEmail": "support@apexstore.com",
    "announcement": "🎉 ยินดีต้อนรับสู่ ApexStore ระบบเติมเงินออโต้ 24 ชม. ปลอดภัย รวดเร็ว!",
    "showAnnouncement": true,
    "maintenanceMode": false
  }'::jsonb
)
on conflict (key) do nothing;

-- ========================================================
-- Storage Buckets & Policies
-- ========================================================

-- 1. Create Storage Buckets (product-images = Public, payment-slips = Private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('payment-slips', 'payment-slips', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage Policies for product-images (Public Read, Admin Write)
drop policy if exists "Public Access for Product Images" on storage.objects;
create policy "Public Access for Product Images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Admins can upload Product Images" on storage.objects;
create policy "Admins can upload Product Images" on storage.objects
  for insert with check (bucket_id = 'product-images' and (public.is_admin() or auth.role() = 'authenticated'));

drop policy if exists "Admins can manage Product Images" on storage.objects;
create policy "Admins can manage Product Images" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin());

-- 3. Storage Policies for payment-slips (Private, Authenticated Upload, Owner/Admin Read)
drop policy if exists "Users can upload their own slips" on storage.objects;
create policy "Users can upload their own slips" on storage.objects
  for insert with check (bucket_id = 'payment-slips');

drop policy if exists "Users and Admins can view slips" on storage.objects;
create policy "Users and Admins can view slips" on storage.objects
  for select using (bucket_id = 'payment-slips' and (auth.uid() is not null or public.is_admin()));

-- ========================================================
-- Supabase Realtime Replication Setup
-- ========================================================

-- Enable Realtime for key tables
do $$
begin
  -- Add profiles to realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  -- Add orders to realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  -- Add topup_transactions to realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'topup_transactions'
  ) then
    alter publication supabase_realtime add table public.topup_transactions;
  end if;

  -- Add products to realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;

  -- Add app_settings to realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table public.app_settings;
  end if;
end $$;

