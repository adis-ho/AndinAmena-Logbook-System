-- =============================================
-- AMENA LOGBOOK - DATABASE RESET SCRIPT
-- =============================================
-- Jalankan di Supabase SQL Editor
-- WARNING: Script ini akan menghapus data!
-- =============================================

-- 1. Hapus semua NOTIFICATIONS
DELETE FROM notifications;

-- 2. Hapus semua LOGBOOKS
DELETE FROM logbooks;

-- 3. Hapus semua E-TOLLS (opsional, uncomment jika diperlukan)
-- DELETE FROM etolls;

-- 4. Hapus semua UNITS (opsional, uncomment jika diperlukan)
-- DELETE FROM units;

-- 5. Hapus DRIVERS (bukan admin)
-- Ini akan menghapus profiles dengan role 'driver'
-- DELETE FROM profiles WHERE role = 'driver';

-- 6. Reset operational_balance semua drivers ke 0
UPDATE profiles SET operational_balance = 0 WHERE role = 'driver';

-- =============================================
-- VERIFIKASI
-- =============================================
-- Jalankan query berikut untuk memastikan reset berhasil:

-- SELECT COUNT(*) as total_notifications FROM notifications;
-- SELECT COUNT(*) as total_logbooks FROM logbooks;
-- SELECT COUNT(*) as total_etolls FROM etolls;
-- SELECT COUNT(*) as total_units FROM units;
-- SELECT COUNT(*) as total_users FROM profiles;
-- SELECT * FROM profiles WHERE role = 'admin';

-- =============================================
-- CATATAN PENTING:
-- =============================================
-- 1. Pastikan minimal ada 1 ADMIN user yang tersisa
-- 2. Jika ingin hapus units/etolls, uncomment baris yang sesuai
-- 3. Jalankan di Supabase Dashboard > SQL Editor
-- 4. Backup data sebelum menjalankan script ini!
-- =============================================
