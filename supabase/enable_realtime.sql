-- =============================================
-- Enable Supabase Realtime for logbooks & profiles
-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================

-- Enable Realtime for logbooks table
ALTER PUBLICATION supabase_realtime ADD TABLE logbooks;

-- Enable Realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Verifikasi: Cek tabel mana saja yang sudah di-enable
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
