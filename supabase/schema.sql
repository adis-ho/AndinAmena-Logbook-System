-- =============================================
-- Amena Laporan Harian System - Database Schema
-- VERSI: Field disederhanakan + User, Rute, Keterangan
-- =============================================

-- 1. PROFILES TABLE (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  operational_balance INTEGER DEFAULT 0, -- Saldo Uang Operasional per Driver
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. UNITS TABLE (Kendaraan)
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ETOLLS TABLE (Kartu E-Toll Perusahaan)
CREATE TABLE IF NOT EXISTS public.etolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name TEXT NOT NULL,
  card_number TEXT,
  balance INTEGER DEFAULT 0, -- Saldo dalam Rupiah
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: operational_balance is now stored in profiles table per driver

-- 4. LOGBOOKS TABLE (STRUKTUR BARU)
CREATE TABLE IF NOT EXISTS public.logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) NOT NULL,
  unit_id UUID REFERENCES public.units(id) NOT NULL,
  etoll_id UUID REFERENCES public.etolls(id), -- Kartu E-Toll yang digunakan (opsional)
  client_name TEXT, -- User/Tamu/Client name
  rute TEXT, -- Rute perjalanan
  keterangan TEXT, -- Keterangan/catatan
  toll_cost INTEGER DEFAULT 0, -- Biaya Tol
  parking_cost INTEGER DEFAULT 0, -- Biaya Parkir
  operational_cost INTEGER DEFAULT 0, -- Biaya Operasional
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('logbook_submitted', 'logbook_approved', 'logbook_rejected', 'user_registered', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Anyone can view profiles" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Allow admin to update any profile (including status for soft delete)
CREATE POLICY "Admins can update any profile" ON public.profiles 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Allow insert for authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UNITS POLICIES
CREATE POLICY "Anyone can view units" ON public.units 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage units" ON public.units 
  FOR ALL USING (true);

-- ETOLLS POLICIES
CREATE POLICY "Anyone can view etolls" ON public.etolls 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage etolls" ON public.etolls 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow drivers to update balance (for deduction when submitting logbook)
CREATE POLICY "Drivers can deduct etoll balance" ON public.etolls 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'driver')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'driver')
  );

-- Note: operational_balance is managed through profiles table

-- LOGBOOKS POLICIES
CREATE POLICY "Drivers can view own logbooks" ON public.logbooks 
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Admins can view all logbooks" ON public.logbooks 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Drivers can insert own logbooks" ON public.logbooks 
  FOR INSERT WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Drivers can update own logbooks" ON public.logbooks 
  FOR UPDATE USING (driver_id = auth.uid());

CREATE POLICY "Admins can manage all logbooks" ON public.logbooks 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert notifications" ON public.notifications 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON public.notifications 
  FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- FUNCTION: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- MIGRATION SQL (jalankan di Supabase SQL Editor)
-- =============================================
/*
-- Tambah kolom baru
ALTER TABLE public.logbooks ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.logbooks ADD COLUMN IF NOT EXISTS rute TEXT;

-- Rename activities ke keterangan
ALTER TABLE public.logbooks RENAME COLUMN activities TO keterangan;
*/

-- =============================================
-- RPC FUNCTIONS: Dashboard Statistics Aggregation
-- =============================================

-- Function: Get Admin Dashboard Statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(period_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start DATE := CURRENT_DATE - period_days;
BEGIN
  SELECT json_build_object(
    'totalLogbooks', (SELECT COUNT(*) FROM logbooks),
    'todayLogbooks', (SELECT COUNT(*) FROM logbooks WHERE date = CURRENT_DATE),
    'weekLogbooks', (SELECT COUNT(*) FROM logbooks WHERE date >= CURRENT_DATE - 7),
    'monthLogbooks', (SELECT COUNT(*) FROM logbooks WHERE date >= CURRENT_DATE - 30),
    'totalDrivers', (SELECT COUNT(*) FROM profiles WHERE role = 'driver' AND status = 'active'),
    'totalUnits', (SELECT COUNT(*) FROM units),
    'totalCost', (SELECT COALESCE(SUM(toll_cost + operational_cost), 0) FROM logbooks),
    'todayCost', (SELECT COALESCE(SUM(toll_cost + operational_cost), 0) FROM logbooks WHERE date = CURRENT_DATE),
    'periodCost', (SELECT COALESCE(SUM(toll_cost + operational_cost), 0) FROM logbooks WHERE date >= period_start),
    'statusData', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          CASE status 
            WHEN 'approved' THEN 'Disetujui'
            WHEN 'submitted' THEN 'Pending'
            WHEN 'rejected' THEN 'Ditolak'
          END as name,
          COUNT(*) as value
        FROM logbooks
        GROUP BY status
      ) t
    ),
    'dailyData', (
      SELECT json_agg(row_to_json(t) ORDER BY t.date) FROM (
        SELECT 
          to_char(d.date, 'DD Mon') as date,
          COALESCE(l.count, 0) as count,
          COALESCE(l.cost, 0) as cost
        FROM generate_series(
          CURRENT_DATE - (period_days - 1),
          CURRENT_DATE,
          '1 day'::interval
        ) d(date)
        LEFT JOIN (
          SELECT 
            date,
            COUNT(*) as count,
            SUM(toll_cost + operational_cost) as cost
          FROM logbooks
          WHERE date >= CURRENT_DATE - (period_days - 1)
          GROUP BY date
        ) l ON l.date = d.date::date
      ) t
    ),
    'topDrivers', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          p.full_name as name,
          COALESCE(SUM(l.toll_cost + l.operational_cost), 0) as cost
        FROM profiles p
        LEFT JOIN logbooks l ON l.driver_id = p.id
        WHERE p.role = 'driver'
        GROUP BY p.id, p.full_name
        ORDER BY cost DESC
        LIMIT 5
      ) t
    ),
    'recentLogbooks', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          l.id,
          l.date,
          l.client_name,
          l.rute,
          l.toll_cost,
          l.operational_cost,
          l.status,
          p.full_name as driver_name
        FROM logbooks l
        LEFT JOIN profiles p ON p.id = l.driver_id
        ORDER BY l.created_at DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
