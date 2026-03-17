# Changelog — Amena Logbook

Catatan lengkap semua fitur yang sudah dibangun, kapan, dan detail perubahannya.

---

## [4.1.0] — 28 Februari 2026 (Latest)

> **Performance Optimization Rollout (Session 1–3)**
> Implementasi audit efisiensi berbasis Vercel React Best Practices + referensi React/TanStack Query.

### 🚀 Perubahan Utama

- **Route-level code splitting** di `src/App.tsx` menggunakan `lazy` + `Suspense`.
- **Lazy-load export libraries**:
  - `xlsx`, `jspdf`, `jspdf-autotable` baru di-load saat aksi export.
  - Affected: `LogbookList.tsx`, `DriverSummary.tsx`, `MonthlyReport.tsx`.
- **Async waterfall reduction** di `ApiService`:
  - `notifyAdmins()` jadi batch insert (single request).
  - `updateLogbookStatus()` paralelisasi fetch/update saldo terkait approve.
  - `getMonthlyReportData()` start metadata fetch lebih awal.

### 🧠 Data Fetching & Cache

- Aktivasi nyata **TanStack Query defaults** via `src/lib/queryClient.ts`.
- Standarisasi key query di `src/lib/queryKeys.ts`.
- Reusable query hooks reference data di `src/hooks/useReferenceDataQueries.ts`.
- Migrasi metadata fetch berulang ke query hooks pada halaman:
  - `LogbookForm.tsx`
  - `LogbookHistory.tsx`
  - `MonthlyReport.tsx`
  - `DriverSummary.tsx`
  - `LogbookList.tsx`
  - `TransactionLogsPage.tsx`
- Invalidasi query pasca mutasi di halaman manajemen:
  - `UserList.tsx`
  - `UnitList.tsx`
  - `EtollList.tsx`

### ⚡ Quick Wins Runtime

- Lookup map (`Map`) untuk resolve nama user/E-Toll pada transaction logs.
- Single-pass aggregation statistik pada driver dashboard.
- Event listener DatePicker aktif hanya saat popover terbuka.
- Logging debug diguard dev-only via `src/utils/logger.ts`.

### ✅ Validasi

- `npm run build` sukses.
- `npm run test:run` sukses (4 files, 58 tests passed).
- Baseline plan terdokumentasi di `docs/performance-audit-plan.md`.

---

## [4.0.0] — 22–28 Februari 2026 (Latest) 🔥

> **Full-App Premium Redesign + E-Toll Top-Up Feature**
> Audit & redesign menyeluruh terhadap **13 file** berdasarkan Vercel Web Interface Guidelines + Frontend Design Skill. Setiap halaman di-audit, ditemukan puluhan masalah accessibility/visual, lalu diperbaiki semua.

### ✨ Fitur Baru

- **E-Toll Top-Up** (`EtollList.tsx` + `api.ts`)
  - Method baru: `ApiService.topUpEtollBalance(etollId, amount)`
  - Fetch saldo saat ini → hitung `newBalance = prevBalance + amount` → update + log ke `etoll_logs`
  - Tombol **Isi Saldo** (icon `Plus`/`Wallet`) di desktop table & mobile cards
  - **Top-Up Modal**: Info kartu + saldo saat ini, input jumlah, preview saldo baru, glassmorphism styling
  - Otomatis muncul di **Riwayat Transaksi** (Tab E-Toll) karena `getActionBadge()` sudah support `top_up`

- **Reusable Pagination Component** (`components/ui/Pagination.tsx`)
  - Component terpisah untuk client-side pagination
  - Digunakan di `LogbookHistory.tsx` — dari infinite scroll ke paginated list

### 🎨 Full-App UI/UX Redesign (13 File)

Setiap file di bawah ini mendapat **audit accessibility lengkap** + **visual redesign ke luxury aesthetic**:

---

#### 1. OperationalBudgetPage.tsx — 11 issue fixed
> Audit lengkap Web Design Guidelines. 11 masalah ditemukan dan diperbaiki.

**Accessibility:** `aria-hidden` semua dekoratif icons, `aria-label` ganti `title`, `htmlFor`+`id` pairing di modals
**Visual:** Header boxed icon, KPI `tabular-nums font-black`, **hapus "Cara Kerja" card**, negative balance alert redesign, driver avatar initials, ghost hover actions
**Modal:** Glassmorphism `backdrop-blur-sm`, X close button, `rounded-2xl`, gradient submit, **visual spinner**, `overscroll-behavior: contain`

---

#### 2. EtollList.tsx — 10 issue fixed
**Accessibility:** `aria-hidden` semua icons, `aria-label` ganti `title`, `htmlFor`/`id` di modals
**Visual:** Boxed icon header, KPI `tabular-nums`, luxury pill status badges (`text-[10px] uppercase tracking-wider border`), card avatar initials, pastel saldo box
**Table:** `text-[10px] uppercase tracking-widest` headers, ghost hover actions, `border-none` cells
**Modal:** Glassmorphism, X close, gradient submit, spinner
**Other:** Low balance `⚠` pill badge (menggantikan inline text warning)

---

#### 3. TransactionLogsPage.tsx — 6 issue fixed
**Accessibility:** `aria-hidden` semua icons, tab accessibility (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`)
**Visual:** Boxed icon header + subtitle, **pill/segmented control tabs** (ganti underline style), `text-[10px] uppercase tracking-widest` table headers
**Data:** `tabular-nums tracking-tight` untuk semua tanggal/amounts/balances
**Badges:** Refined luxury style (`text-[9px] uppercase tracking-wider font-bold border`)
**Empty State:** Elegant empty state dengan icon + proper copywriting

---

#### 4. MonthlyReport.tsx — Visual + A11y
**Accessibility:** `aria-hidden` semua decorative icons
**Visual:** Luxury boxed icon header (`rounded-2xl bg-indigo-50`), filter labels `text-[10px] uppercase tracking-wider`
**Summary Cards:** `tabular-nums font-black text-4xl tracking-tight`, small uppercase labels
**Tables:** `border-none` cells, `text-[10px] uppercase tracking-widest` headers, `tabular-nums` angka
**Buttons:** "Tampilkan Laporan" → gradient midnight blue/indigo + hover lift effect, "Download PDF" → ghost/outline rose (`ring-1 ring-inset`)
**Animation:** `animate-in fade-in slide-in-from-bottom-4 duration-500` (ganti arbitrary `animate-fadeIn`)

---

#### 5. LogbookList.tsx — 12 issue fixed
**Accessibility:** `aria-hidden` pada 15+ icons, `aria-label` pada 7 icon buttons, tab accessibility (`role="tablist"`, `aria-selected`)
**Typography:** `tabular-nums` semua angka/tanggal, label hierarchy kontras (`text-[10px] uppercase tracking-wider`)
**Header:** Boxed icon + `font-black tracking-tight text-3xl` + subtitle
**Status Badges:** Luxury pill (`text-[9px] uppercase tracking-widest font-bold border`)
**Table:** `text-[10px] uppercase tracking-widest` headers, `border-none` cells, ghost hover actions
**Modal:** Detail + delete modals → glassmorphism + `overscroll-behavior: contain`
**Export Buttons:** Hierarchy diperjelas (satu primer gradient, satu ghost/outline)
**Cleanup:** Hapus `getUnitName` duplikat, hapus dashed border sort area

---

#### 6. Driver Dashboard.tsx — 11 issue fixed
**Accessibility:** `aria-hidden` pada 10+ icons
**Hero Card:** `rounded-[2rem]`, gradient `from-emerald-500 to-emerald-600`, hapus duplikat `Wallet` icon kecil
**Stats:** `text-2xl font-black tabular-nums tracking-tight`, labels `text-[10px] uppercase tracking-wider`
**Quick Actions:** Gradient CTA `from-blue-600 to-indigo-600` + hover lift + `active:scale-[0.98]`, secondary → white card + border hover
**Recent Logbooks:** `rounded-[2rem]`, heading uppercase, `tabular-nums` tanggal/biaya, `line-clamp-1` nama
**Layout:** Root `max-w-7xl mx-auto pb-12` untuk ultra-wide
**Empty State:** Recent logbooks empty → ikon + pesan "Belum ada laporan"

---

#### 7. LogbookForm.tsx — 11 issue fixed
**Accessibility:** `aria-hidden` icons, **semua label** ada `htmlFor`, **semua input** ada `name` + `autocomplete`
**Visual:** Labels `text-[10px] font-black uppercase tracking-widest text-gray-400`, saldo info `tabular-nums`
**Inputs:** `rounded-2xl` + `bg-gray-50/50` + `focus:bg-white` + `transition-all duration-300` + `focus:ring-4 focus:ring-blue-500/10`
**Submit:** `rounded-2xl` + `shadow-md shadow-blue-500/20` + `active:scale-[0.98]`
**Total Biaya:** Glassmorphism card `rounded-2xl` border
**Anti-pattern Fixed:** `alert()` → inline error/toast, `'Menyimpan...'` → `'Menyimpan…'` (proper ellipsis)

---

#### 8. LogbookHistory.tsx — 14 issue fixed + Pagination + Vertical List
**Accessibility:** `aria-hidden`, `aria-label` ganti `title`, `htmlFor` + `name` di modal edit
**Visual:** Cards `rounded-[2rem]`, labels `text-[10px] uppercase tracking-wider`, `tabular-nums` biaya/tanggal
**Modal Edit:** Input styling konsisten dengan LogbookForm (`rounded-2xl`, transitions, focus ring)
**Modal Delete + Edit:** Glassmorphism `backdrop-blur-sm`, `rounded-2xl`, `overscroll-behavior: contain`, `shadow-2xl`
**Status Badges:** Luxury pill dengan border
**Layout:** Vertical list (ganti horizontal cards) + **client-side Pagination** (`Pagination.tsx`)
**Catatan Section:** Grid layout refined — "Catatan" spans appropriately pada mobile dan desktop
**Rejected Banner:** `rounded-xl p-4 border border-red-100` (upgrade dari basic `rounded-lg p-2`)
**Ellipsis:** `'Menyimpan…'` (proper `…`)
**Layout:** Root `max-w-7xl mx-auto pb-12`

---

#### 9. LoginPage.tsx — Full Redesign
**Aesthetic Direction:** *Refined Minimalist — Glass Card on Soft Gradient*
**Background:** Flat `bg-gray-50` → soft blue-to-white gradient backdrop
**Card:** `rounded-[2rem]` + `shadow-2xl` + `border border-white/60` glassmorphism depth
**Inputs:** `rounded-2xl` + `bg-gray-50/50` rest → `focus:bg-white` active + `transition-all duration-300`
**Submit:** `bg-gray-900 hover:bg-gray-800 text-white rounded-2xl` (dark charcoal like reference)
**Accessibility:**
  - Inputs: `autoComplete="email"` / `autoComplete="current-password"`, `spellCheck={false}`
  - Icons: semua `aria-hidden="true"`
  - Password toggle: `aria-label` (bukan `title`)
  - Focus: `focus-visible:` ganti `focus:`
  - Error: `aria-live="polite"` di error container
**Placeholders:** `"Email…"`, `"Password…"` (proper `…`)

---

#### 10. Sidebar.tsx — 15 issue fixed
**Accessibility:**
  - `aria-hidden="true"` semua nav icons + `LogOut` + `X`
  - Close button: `aria-label` ganti `title`
  - Drawer: `role="dialog"` + `aria-modal="true"` + `aria-label="Navigation menu"`
  - `overscroll-behavior: contain` pada scrollable nav
  - `focus-visible:ring-*` pada semua nav links + logout button
**Visual:**
  - Avatar gradient diganti dari `from-blue-500 to-purple-600` → brand blue konsisten
  - Nav links: `rounded-2xl`, active state refined, hover lebih jelas
  - Shadow: `shadow-xl` → shadow halus custom
  - Close button: `rounded-xl` + `transition-all duration-200`
**UX:** Logout → **browser `confirm()` dialog** sebelum eksekusi (destructive action confirmation)
**Backdrop:** Tambah explicit `duration-300` pada `transition-opacity`

---

#### 11. Header.tsx — A11y + Visual
**Accessibility:** `Menu` icon → `aria-hidden="true"` (sudah punya `aria-label` ✅)
**Visual:** `h1` → `font-black tracking-tight` (konsisten dengan design system)
**Avatar gradient:** `from-blue-500 to-purple-600` → brand blue konsisten
**Profile link:** Touch target diperbesar untuk mobile

---

#### 12. DashboardLayout.tsx
**Typography:** Footer copyright `tabular-nums` untuk tahun

---

#### 13. NotificationPanel.tsx — Full Refactoring
**UI/UX:** Refactor dengan high-quality design dan accessibility compliance

---

## [3.5.0] — Awal Februari 2026

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

> **Total Fitur yang Sudah Dibangun**: 130+ fitur dan improvements
> **Total API Methods**: 59+ (termasuk `topUpEtollBalance`)
> **Total Database Tables**: 7
> **Total Admin Routes**: 10
> **Total Driver Routes**: 4
> **Total Test Files**: 4
> **Total File Redesigned (v4.0)**: 13
