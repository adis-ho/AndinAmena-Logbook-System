# Roadmap Pengembangan Amena Logbook

## Status Proyek: Phase 3.0 - Advanced Features ✅

---

## Phase 0: Initial Setup ✅
- [x] Inisialisasi Git Repository
- [x] Setup `.gitignore`
- [x] Buat `README.md`
- [x] Initial commit

## Phase 1: Core Application ✅

### 1.1 Project Scaffolding
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS v4
- [x] Dependencies (React Query, React Router, Zod, Lucide)

### 1.2 Authentication
- [x] Login Page
- [x] Register Page (Driver)
- [x] AuthContext untuk state management
- [x] Protected Routes

### 1.3 Layout & Navigation
- [x] Dashboard Layout (Sidebar + Header)
- [x] Responsive mobile sidebar (drawer)
- [x] Role-based navigation

### 1.4 Admin Features
- [x] Admin Dashboard
- [x] User Management (CRUD)
- [x] Unit Management (CRUD)
- [x] Logbook Management (CRUD + Approve/Reject)
- [x] Export to XLSX & PDF
- [x] Delete confirmation modal

### 1.5 Driver Features
- [x] Driver Dashboard
- [x] Logbook Entry Form (React Hook Form + Zod)
- [x] Logbook History
- [x] Edit own logbook

### 1.6 Data Layer
- [x] MockService (simulated API)
- [x] Type-safe data models

---

## Phase 2: Backend Integration ✅

### 2.1 Supabase Setup ✅
- [x] Buat project Supabase
- [x] Setup `.env.local` dengan credentials
- [x] Buat Supabase client (`lib/supabase.ts`)

### 2.2 Database Schema ✅
- [x] Tabel `profiles` (users) dengan kolom `status`
- [x] Tabel `units` (kendaraan)
- [x] Tabel `logbooks` (entries) dengan kolom `client_name`, `rute`, `keterangan`
- [x] Tabel `notifications` (real-time notifications)
- [x] Row Level Security (RLS) policies
- [x] Admin RLS policy untuk update semua profiles
- [x] Auto-create profile trigger

### 2.3 API Integration ✅
- [x] `ApiService` menggantikan `MockService`
- [x] Real authentication (email + password)
- [x] Session management dengan Supabase Auth
- [x] CRUD operations untuk semua entity
- [x] Soft delete untuk users (set status inactive)
- [x] Block login untuk inactive users

### 2.3.5 UX Enhancements ✅ (NEW)
- [x] Dashboard Analytics dengan Recharts
  - [x] Statistik cards (Total, Pending, Approved, Rejected)
  - [x] Bar chart: Logbook 7 hari terakhir
  - [x] Pie chart: Status distribusi
  - [x] Line chart: Trend biaya
  - [x] Bar chart: Top drivers by cost
- [x] Toast Notifications (`ToastContext`)
- [x] Skeleton Loading components
- [x] Export terpisah (Excel & PDF buttons)
- [x] Plus Jakarta Sans font integration
- [x] Soft delete & reactivate users
- [x] Tampilan status user (Aktif/Nonaktif)

### 2.3.6 Cost Management & UI Polish ✅ (NEW)
- [x] Refactor `parking_cost` ke `operational_cost` ("Biaya Lain")
- [x] Implementasi Saldo Operasional per Driver (`operational_balance`)
- [x] Hapus tabel `operational_budget` (company-wide)
- [x] Driver Dashboard: Unified Hero Card (Saldo + Stats)
- [x] Detailed Cost Breakdown (Tol vs Biaya Lain) di History & Detail
- [x] Global Skeleton Loading Implementation (8 halaman)

### 2.3.7 E-Toll & Advanced Features ✅ (LATEST)
- [x] Manajemen E-Toll (CRUD, Saldo, Status) 
- [x] Integrasi E-Toll dengan Driver Logbook Input
- [x] Filter Unit di Admin Logbook List
- [x] Pagination Server-side untuk Logbook List
- [x] Sorting (Terbaru/Terlama) untuk Logbook List
- [x] Export PDF & Excel: Kolom Unit (Nama Pendek + Plat) dan Biaya Lain
- [x] UX: Rename "Biaya Parkir dll." ke "Biaya Lain" di semua form

### 2.4 UI/UX Improvements ✅
- [x] Drawer navigation (Flowbite-style)
- [x] Real-time notification system
- [x] Notification bell dengan dropdown panel
- [x] Notification triggers pada CRUD events
- [x] Modern glassmorphism header
- [x] Fitur Hapus Foto Profil (kembali ke inisial)
- [x] Hapus teks status upload avatar (cleaner UI)
- [x] Custom Date Picker (Flowbite style, ID localized)

### 2.3.8 Mobile Responsiveness ✅
- [x] Responsive card view untuk LogbookList (mobile cards + desktop table)
- [x] Responsive card view untuk UserList 
- [x] Responsive card view untuk UnitList
- [x] Responsive card view untuk EtollList
- [x] Responsive card view untuk OperationalBudgetPage
- [x] Improved filter grid layout (md:grid-cols-2 lg:grid-cols-3)
- [x] Wrap-able status tabs untuk mobile
- [x] Mobile-friendly pagination
- [x] Consistent card styling sesuai LogbookHistory pattern
- [x] Responsive Add Button (icon-only on mobile)
- [x] Responsive Notification Panel (fixed on mobile)
- [x] Responsive Edit Modal buttons (stacked on mobile)
- [x] Responsive Profile Page (stacked fields, overflow fix)
- [x] Clipped Drawer (side menu below header)

### 2.5 Deployment ✅ (DEPLOYED)
- [x] Setup `vercel.json` untuk SPA routing
- [x] Configure environment variables di Vercel
- [x] Deploy ke Vercel
- [x] Domain: andinlaporanharian.vercel.app
- [x] Database reset script (`scripts/reset-database.sql`)
- [x] Cleanup unused files (mockData.ts, Drawer.tsx)

---

## Phase 3: Advanced Features ✅ (CURRENT)

### 3.1 Laporan Bulanan ✅
- [x] Halaman Laporan Bulanan (`/admin/laporan`)
- [x] Filter: Bulan, Tahun, Driver (opsional), Unit (opsional)
- [x] Preview ringkasan umum (Total Trip, Total Biaya)
- [x] Summary per Driver
- [x] Summary per Unit
- [x] Export PDF dengan jsPDF + jsPDF-AutoTable

### 3.2 Driver Summary ✅
- [x] Halaman Driver Summary (`/admin/driver-summary`)
- [x] Statistik performa driver (Total Trip, Tol, Biaya Lain)
- [x] Filter berdasarkan rentang tanggal
- [x] Export ke PDF
- [x] Hanya menghitung logbook dengan status `approved`
- [x] Mobile-responsive (Card view)

### 3.3 Operational Budget Management ✅
- [x] **Top-Up Saldo Driver**: Menambah saldo operasional
- [x] **Edit Saldo Driver**: Mengubah saldo ke nominal tertentu
- [x] **Reset Saldo Driver**: Mengembalikan saldo ke Rp 0
- [x] **Balance Logs**: Riwayat perubahan saldo (tabel `balance_logs`)
- [x] UI: 3 tombol aksi (Top Up, Edit, Reset) di Desktop & Mobile
- [x] Modal konfirmasi untuk Reset

### 3.4 Admin User Creation Fix ✅
- [x] Fix: Admin tidak lagi di-redirect ke `/unauthorized` saat membuat user baru
- [x] Fix: Profil user baru langsung muncul di UserList setelah dibuat
- [x] RLS Policy: "Admin can insert profiles"

### 3.5 UI/UX Improvements ✅
- [x] DatePicker alignment fix (kalender tidak terpotong)
- [x] Select dropdown position (bisa buka ke atas)
- [x] Mobile card layout untuk Driver Summary
- [x] Opacity fix untuk user inactive di UserList
- [x] Driver dapat menghapus logbook yang ditolak
- [x] Filter Unit di Driver Summary
- [x] Saldo Operasional Minus (Utang Kantor)

---

## Phase 4: Future Enhancements ⏳

### 4.1 Reporting & Analytics
- [ ] Halaman Riwayat Transaksi (Balance Logs viewer)
- [ ] Dashboard trends (grafik mingguan/bulanan)
- [ ] Export laporan otomatis (scheduled)

### 4.2 Mobile Optimization
- [ ] Progressive Web App (PWA)
- [ ] Offline support
- [ ] Push notifications

### 4.3 Email Notifications
- [ ] Email notification untuk approval/rejection
- [ ] Welcome email untuk user baru
- [ ] Reminder untuk logbook yang pending

---

## Catatan Penting

> **Status Saat Ini**: Aplikasi sudah dalam **Phase 3.0** dengan fitur Laporan Bulanan, Driver Summary, dan manajemen saldo operasional (Edit/Reset + Logging). Sudah live di Vercel.

### Teknologi yang Digunakan:
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS v4
- **Charts**: Recharts
- **PDF Export**: jsPDF + jsPDF-AutoTable
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Fonts**: Plus Jakarta Sans
- **Deployment**: Vercel ✅ (Live)
