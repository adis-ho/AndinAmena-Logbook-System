# Changelog — Amena Logbook

Catatan lengkap semua fitur yang sudah dibangun, kapan, dan detail perubahannya.

---

## [3.5.0] — Februari 2026 (Latest)

### ✨ Fitur Baru
- **Halaman Riwayat Transaksi** (`/admin/transactions`)
  - Dual-tab view: **Uang Operasional** & **E-Toll**
  - Tabel lengkap: Tanggal, Driver/Kartu, Aksi, Jumlah, Saldo Awal/Akhir, Admin, Keterangan
  - Color-coded action badges (Top Up = hijau, Edit = biru, Reset = orange, Deduct = merah)
  - File: `src/features/admin/TransactionLogsPage.tsx`

- **E-Toll Balance Logging**
  - Tabel `etoll_logs` di Supabase (`supabase/etoll_logs.sql`)
  - Type `EtollLog` di `types/index.ts`
  - API: `ApiService.getEtollLogs()` — fetch semua riwayat saldo E-Toll
  - Logging otomatis saat admin update saldo via `updateEtoll()`
  - RLS: Admin-only view & insert

- **PDF Report Generator (Dual Logo)**
  - File dedicated: `utils/reportPdfGenerator.ts`
  - Logo perusahaan: `logo-andin.png` + `logo-ass.png` di header PDF
  - Sections: Ringkasan Umum → Tabel Per Driver → Tabel Per Unit
  - Footer: Halaman X dari Y + Tanggal cetak
  - Auto-table formatting dengan header biru

- **DateRangePicker Component**
  - File: `components/ui/DateRangePicker.tsx`
  - Digunakan di Driver Summary untuk filter rentang tanggal
  - Compose dari 2x DatePicker (Start + End)
  - Unit tests: `DateRangePicker.test.tsx`

### 🧪 Testing
- **Vitest** sebagai test runner (v4)
- **Testing Library** (React + User Event + jsdom)
- Test files:
  - `utils/calculations.test.ts` — formatCurrency, calculateNewBalance, deductBalance, calculateTotalCost
  - `components/ui/DatePicker.test.tsx` — render, interaction, locale
  - `components/ui/DateRangePicker.test.tsx` — range selection
  - `components/ui/DeleteConfirmModal.test.tsx` — confirm/cancel flows
- Scripts: `npm test` (watch), `npm run test:run` (single), `npm run test:coverage`

### 🏗️ Code Quality
- **Centralized Constants** (`constants/index.ts`)
  - `PAGE_SIZE`, `MAX_PAGE_SIZE`, `MIN_PASSWORD_LENGTH`
  - `TOAST_DURATION_MS`, `DEBOUNCE_DELAY_MS`
  - Status enums: `USER_STATUS`, `LOGBOOK_STATUS`, `UNIT_STATUS`, `ETOLL_STATUS`

- **Pure Utility Functions** (`utils/calculations.ts`)
  - `formatCurrency(value)` — format angka ke IDR
  - `calculateNewBalance(current, topUp)` — hitung saldo setelah top-up
  - `deductBalance(current, cost)` — kurangi saldo (min 0)
  - `calculateTotalCost(toll, operational)` — total biaya

- **Class Merging** (`utils/cn.ts`)
  - Wrapper `clsx` + `tailwind-merge` untuk conditional classnames

### 🎨 UI/UX Refactoring

- **OperationalBudgetPage — Full Redesign** (`src/features/admin/OperationalBudgetPage.tsx`)
  > Audit lengkap berdasarkan Web Design Guidelines + Frontend Design Skill. 11 masalah ditemukan dan diperbaiki:

  **Accessibility Fixes:**
  - ❌→✅ Semua decorative icons (`Wallet`, `Users`, `TrendingDown`, `Plus`, `Pencil`, `Trash2`, `RefreshCw`) ditambahkan `aria-hidden="true"`
  - ❌→✅ Icon buttons (Top-Up, Edit, Reset) diganti dari `title` ke `aria-label` (screen reader compatible)
  - ❌→✅ Semua `<label>` dipasangkan `htmlFor` + `id` pada input fields di modal

  **Visual Redesign:**
  - **Header**: Flat icon → boxed icon (`bg-green-50 rounded-xl`), `font-black tracking-tight`, subtitle, themed refresh pill
  - **KPI Cards**: Green gradient card → dashboard-matching style, `text-[10px] uppercase tracking-wider` labels, `text-3xl font-black tabular-nums` values, gradient/hover accents
  - **"Cara Kerja" info card**: ❌ **DIHAPUS** — clutters primary data view, bukan data operasional
  - **Negative Balance Alert**: Basic `bg-red-50` → refined alert dengan icon pad, structured typography, `tabular-nums`
  - **Desktop Table**: `text-[10px] uppercase tracking-widest` headers, driver avatar initials, ghost hover action buttons, refined badges
  - **Mobile Cards**: Basic cards → avatar initials, pastel badges, refined button group, elegant separators

  **Modal Improvements:**
  - Modal overlay: `bg-black/50` → `backdrop-blur-sm` glassmorphism + `overscrollBehavior: contain`
  - Ditambahkan **X close button** di Top-Up & Edit modals (sebelumnya hanya "Batal" text)
  - Modal shape: `rounded-xl` → `rounded-2xl` dengan split header
  - Submit button: plain → gradient submit button
  - Loading state: "Memproses..." text → **visual spinner** animation

  **Other Fixes:**
  - `tabular-nums` diterapkan ke semua currency values (monospace alignment)
  - Error state: plain text → icon + structured layout matching other pages
  - Buttons: ditambahkan `transition-*` classes untuk smooth hover states

- **UserList & UnitList** — unified card/table view, consistent styling
- **Glassmorphism modals** — consistent backdrop blur di semua modal
- **Admin Dashboard** — realtime data audit, performance compliance

---

## [3.0.0] — Februari 2026

### ✨ Fitur Baru
- **Laporan Bulanan** (`/admin/laporan`)
  - Filter: Bulan, Tahun, Driver opsional, Unit opsional
  - Preview: Ringkasan Umum (Total Trip, Total Biaya)
  - Summary per Driver + per Unit
  - Export PDF (jsPDF + AutoTable)
  - File: `src/features/admin/MonthlyReport.tsx`

- **Driver Summary** (`/admin/driver-summary`)
  - Statistik performa per driver (Trip, Tol, Biaya Lain)
  - Filter: rentang tanggal + Unit
  - Export PDF
  - Hanya hitung logbook `approved`
  - Mobile card view
  - File: `src/features/admin/DriverSummary.tsx`

- **Balance Management (Edit/Reset)**
  - Edit Saldo Driver → set ke nominal tertentu + balance log
  - Reset Saldo Driver → kembalikan ke Rp 0 + balance log
  - 3 tombol aksi: Top Up, Edit, Reset
  - Modal konfirmasi untuk Reset
  - File: `src/features/admin/OperationalBudgetPage.tsx`

- **Saldo Minus / Hutang Kantor**
  - Saldo operasional bisa negatif setelah approve logbook
  - Visual: warna merah + label "Hutang" untuk saldo negatif

- **Balance Logs**
  - Tabel `balance_logs` di Supabase (`supabase/operational_logs.sql`)
  - Type `BalanceLog` di `types/index.ts`
  - Setiap Top Up/Edit/Reset tercatat: action, amount, prev_balance, new_balance, admin

- **Supabase Realtime Auto-Refresh**
  - Hook: `useRealtimeSubscription` di 5 halaman
  - Admin Dashboard, LogbookList, Budget, Driver Dashboard, LogbookHistory
  - `REPLICA IDENTITY FULL` pada tabel `logbooks` untuk DELETE events
  - SQL: `supabase/enable_realtime.sql`

### 🐛 Bug Fixes
- **Admin User Creation** — tidak lagi redirect ke `/unauthorized`
- **RLS Policy** — "Admin can insert profiles" ditambahkan
- **`setCreatingUserFlag`** di AuthContext mencegah session confusion
- **DatePicker alignment** — kalender tidak terpotong
- **Select dropdown** — bisa buka ke atas
- **User inactive opacity** — visual fix di UserList
- **Driver delete rejected logbook** — fitur ditambahkan

---

## [2.5.0] — Januari 2026

### ✨ Fitur Baru
- **Manajemen E-Toll** (`/admin/etolls`)
  - CRUD kartu E-Toll (nama, nomor, saldo, status)
  - Integrasi dengan Driver Logbook Input (pilih kartu E-Toll)
  - File: `src/features/admin/EtollList.tsx`

- **Server-side Pagination** untuk Logbook List
  - `ApiService.getLogbooksPaginated()` dengan filter + sort
  - Filter: Status, Driver, Unit, Client Name, Date Range
  - Sorting: Terbaru/Terlama

- **Export Improvements**
  - Kolom Unit (Nama Pendek + Plat Nomor) di PDF & Excel
  - Kolom "Biaya Lain" (ex-parking) di PDF & Excel

### 🎨 UI/UX
- Rename "Biaya Parkir dll." → "Biaya Lain" di semua form

### 🚀 Deployment
- Deploy ke **Vercel** ✅
- Domain: **andinlaporanharian.vercel.app**
- `vercel.json` untuk SPA routing
- Database reset script (`scripts/reset-database.sql`)

---

## [2.0.0] — Desember 2025

### ✨ Fitur Baru
- **Saldo Operasional per Driver**
  - Kolom `operational_balance` di tabel `profiles`
  - Top-up saldo via `OperationalBudgetPage`
  - Deduksi otomatis saat logbook di-approve
  - Driver Dashboard: Hero Card (Saldo + Stats)

- **Cost Breakdown**
  - Detailed view: Tol vs Biaya Lain (ex-parking)
  - Ditampilkan di History & Detail modal

- **Dashboard Analytics** (Recharts)
  - Statistik cards (Total, Pending, Approved, Rejected)
  - Bar chart: Logbook 7 hari terakhir
  - Pie chart: Status distribusi
  - Line chart: Trend biaya
  - Bar chart: Top 5 drivers by cost
  - Recent logbook entries
  - **RPC Function** `get_admin_dashboard_stats()` untuk server-side aggregation

### 🎨 UI/UX
- **Toast Notifications** — `ToastContext` (success/error/warning/info, auto-dismiss 5s)
- **Skeleton Loading** — 8+ variant components untuk semua halaman
- **Plus Jakarta Sans** font integration
- **Soft Delete & Reactivate** users (status active/inactive)
- **Hard Delete** users (permanen + warning + cleanup logbooks)

### 📱 Mobile Responsiveness
- Card view untuk: LogbookList, UserList, UnitList, EtollList, OperationalBudgetPage
- Mobile-friendly pagination & filters
- Responsive Add Button (icon-only mobile)
- Responsive Notification Panel (fixed mobile)
- Responsive Edit Modal (stacked buttons)
- Responsive Profile Page (stacked fields)
- Clipped Drawer (below header)

---

## [1.5.0] — November–Desember 2025

### ✨ Fitur Baru
- **Drawer Navigation** (slide-in, Flowbite-style)
- **Real-time Notifications** (`NotificationContext` + Supabase Realtime)
- **Notification Bell** dengan dropdown panel
- **Glassmorphism Header**
- **Profile Management** — upload/hapus foto profil, ubah password & email
- **Custom DatePicker** (Flowbite style, ID locale)
- **Custom Select** (support upward opening)
- **DeleteConfirmModal** — reusable confirmation component

---

## [1.0.0] — November 2025

### 🏗️ Foundation
- **Supabase Integration** — menggantikan MockService
- **Database Schema** — profiles, units, logbooks, notifications + RLS
- **Authentication** — email + password, session management, inactive blocking
- **ApiService** — CRUD untuk semua entity

### ✨ Fitur Baru
- **Admin Module**: Dashboard, User/Unit/Logbook CRUD, Approve/Reject, Export XLSX & PDF
- **Driver Module**: Dashboard, Logbook Form (Zod + React Hook Form), History, Edit
- **Protected Routes** — role-based (admin/driver)

---

## [0.1.0] — Oktober–November 2025

### 🏗️ Initial Setup
- Vite + React 19 + TypeScript scaffolding
- Tailwind CSS v4 setup
- MockService (simulated API) untuk development
- Git repository init

---

> **Total Fitur yang Sudah Dibangun**: 100+ fitur dan improvements
> **Total API Methods**: 58+
> **Total Database Tables**: 7
> **Total Admin Routes**: 10
> **Total Driver Routes**: 4
> **Total Test Files**: 4
