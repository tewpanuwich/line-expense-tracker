# family-expense-tracker

เว็บแอปบันทึกรายจ่ายในครอบครัว — Next.js (App Router) + Supabase + PIN auth แบบ custom

## Setup

1. สร้างโปรเจกต์ Supabase แล้วรัน SQL ตามลำดับ:
   - [`supabase/schema.sql`](./supabase/schema.sql) — สร้างตาราง
   - [`supabase/seed.sql`](./supabase/seed.sql) — ใส่หมวดหมู่เริ่มต้น
2. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ค่าจาก Supabase project settings (Project URL, anon key, service role key) และตั้ง `SESSION_SECRET` เป็นสตริงสุ่มยาวๆ
3. ติดตั้ง dependencies และรัน dev server:

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## หมายเหตุด้านความปลอดภัย

ระบบ auth เป็น PIN แบบ custom (ไม่ใช้ Supabase Auth) ดังนั้นทุก query จะเรียกผ่าน service role key
ฝั่ง server เท่านั้น (`src/lib/supabase/server.ts`) ห้าม import ไฟล์นี้จาก Client Component
ตารางทั้งหมดเปิด RLS ไว้โดยไม่มี policy เพื่อบล็อกการเข้าถึงตรงจาก anon/public key
