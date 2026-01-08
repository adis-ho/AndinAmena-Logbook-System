-- =============================================
-- SUPABASE RLS POLICIES - Andin-Amena Logbook System
-- =============================================
-- Jalankan script ini di Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query -> Paste -> Run
-- =============================================

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

-- Drop existing policies (jika ada)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua user yang login bisa lihat profiles
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- UPDATE: User bisa update profile sendiri
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- UPDATE: Admin bisa update semua profiles
CREATE POLICY "Admin can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Hanya admin yang bisa delete profiles
CREATE POLICY "Admin can delete profiles" ON profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- INSERT: Trigger handle ini, tapi kita izinkan untuk safety
CREATE POLICY "Enable insert for authenticated users" ON profiles
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- =============================================
-- 2. UNITS TABLE
-- =============================================

DROP POLICY IF EXISTS "Anyone can view units" ON units;
DROP POLICY IF EXISTS "Admin can insert units" ON units;
DROP POLICY IF EXISTS "Admin can update units" ON units;
DROP POLICY IF EXISTS "Admin can delete units" ON units;

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua user yang login bisa lihat units
CREATE POLICY "Anyone can view units" ON units
FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Hanya admin
CREATE POLICY "Admin can insert units" ON units
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- UPDATE: Hanya admin
CREATE POLICY "Admin can update units" ON units
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Hanya admin
CREATE POLICY "Admin can delete units" ON units
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);


-- =============================================
-- 3. ETOLLS TABLE
-- =============================================

DROP POLICY IF EXISTS "Anyone can view etolls" ON etolls;
DROP POLICY IF EXISTS "Admin can insert etolls" ON etolls;
DROP POLICY IF EXISTS "Admin can update etolls" ON etolls;
DROP POLICY IF EXISTS "Admin can delete etolls" ON etolls;

ALTER TABLE etolls ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua user yang login bisa lihat etolls
CREATE POLICY "Anyone can view etolls" ON etolls
FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Hanya admin
CREATE POLICY "Admin can insert etolls" ON etolls
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- UPDATE: Hanya admin
CREATE POLICY "Admin can update etolls" ON etolls
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Hanya admin
CREATE POLICY "Admin can delete etolls" ON etolls
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);


-- =============================================
-- 4. LOGBOOKS TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can view own logbooks" ON logbooks;
DROP POLICY IF EXISTS "Admin can view all logbooks" ON logbooks;
DROP POLICY IF EXISTS "Drivers can insert own logbooks" ON logbooks;
DROP POLICY IF EXISTS "Drivers can update own logbooks" ON logbooks;
DROP POLICY IF EXISTS "Admin can update all logbooks" ON logbooks;
DROP POLICY IF EXISTS "Admin can delete all logbooks" ON logbooks;
DROP POLICY IF EXISTS "Drivers can delete own rejected logbooks" ON logbooks;

ALTER TABLE logbooks ENABLE ROW LEVEL SECURITY;

-- SELECT: Driver lihat logbook sendiri
CREATE POLICY "Users can view own logbooks" ON logbooks
FOR SELECT USING (auth.uid() = driver_id);

-- SELECT: Admin lihat semua logbooks
CREATE POLICY "Admin can view all logbooks" ON logbooks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- INSERT: Driver bisa insert logbook sendiri
CREATE POLICY "Drivers can insert own logbooks" ON logbooks
FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- UPDATE: Driver bisa update logbook sendiri
CREATE POLICY "Drivers can update own logbooks" ON logbooks
FOR UPDATE USING (auth.uid() = driver_id);

-- UPDATE: Admin bisa update semua logbooks (untuk approve/reject)
CREATE POLICY "Admin can update all logbooks" ON logbooks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Admin bisa delete semua logbooks
CREATE POLICY "Admin can delete all logbooks" ON logbooks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Driver bisa delete logbook sendiri HANYA jika status = 'rejected'
CREATE POLICY "Drivers can delete own rejected logbooks" ON logbooks
FOR DELETE USING (
  auth.uid() = driver_id AND status = 'rejected'
);


-- =============================================
-- 5. NOTIFICATIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: User lihat notifikasi sendiri
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Siapa saja yang login bisa insert notifikasi (untuk admin kirim ke driver)
CREATE POLICY "Authenticated can insert notifications" ON notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: User bisa update notifikasi sendiri (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: User bisa delete notifikasi sendiri
CREATE POLICY "Users can delete own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);


-- =============================================
-- VERIFIKASI
-- =============================================
-- Jalankan query ini untuk memastikan policies sudah terpasang:

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
