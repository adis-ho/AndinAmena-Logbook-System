# Arsitektur Sistem Amena Logbook

## Gambaran Umum

Amena Logbook adalah aplikasi web untuk manajemen logbook kendaraan operasional. Aplikasi ini memungkinkan driver untuk mencatat perjalanan harian dan admin untuk mengelola data logbook, unit kendaraan, kartu E-Toll, saldo operasional, dan pengguna. Aplikasi sudah live di **[andinlaporanharian.vercel.app](https://andinlaporanharian.vercel.app)**.

## Stack Teknologi

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| **Frontend Framework** | React | 19.x |
| **Build Tool** | Vite | 7.x |
| **Language** | TypeScript | ~5.9 |
| **Styling** | Tailwind CSS | 4.x |
| **Routing** | React Router DOM | 7.x |
| **State Management** | React Query (TanStack) | 5.x |
| **Form Validation** | Zod 4 + React Hook Form | - |
| **Icons** | Lucide React | 0.561+ |
| **Charts** | Recharts | 3.x |
| **Date Utils** | date-fns | 4.x |
| **Export Excel** | xlsx | 0.18.x |
| **Export PDF** | jsPDF + jsPDF-AutoTable | 3.x / 5.x |
| **UI Components** | Headless UI | 2.x |
| **Class Merging** | clsx + tailwind-merge | - |
| **Testing** | Vitest + Testing Library | 4.x / 16.x |
| **Backend** | Supabase | - |
| **Database** | PostgreSQL (Supabase) | - |
| **Auth** | Supabase Auth | - |
| **Realtime** | Supabase Realtime | - |
| **Fonts** | Plus Jakarta Sans | - |
| **Deployment** | Vercel | - |

## Struktur Direktori

```
src/
├── App.tsx                    # Root component dengan routing (10 admin + 3 driver routes)
├── main.tsx                   # Entry point
├── index.css                  # Global styles (Tailwind + animations)
├── setupTests.ts              # Vitest setup file
├── assets/
│   ├── fonts/                 # Custom fonts (Plus Jakarta Sans)
│   ├── images/                # Logo perusahaan (logo-andin.png, logo-ass.png)
│   └── favicon/               # Favicon files
├── lib/
│   └── supabase.ts            # Supabase client configuration
├── constants/
│   └── index.ts               # Centralized app constants (pagination, status values, etc.)
├── components/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx # Layout wrapper
│   │   ├── Header.tsx          # Glassmorphism header + hamburger menu
│   │   └── Sidebar.tsx         # Drawer navigation (slide-in, clipped below header)
│   ├── ui/
│   │   ├── DatePicker.tsx      # Custom date picker (Flowbite style, ID locale)
│   │   ├── DatePicker.test.tsx # Unit tests for DatePicker
│   │   ├── DateRangePicker.tsx # Range picker (start + end date) for reporting
│   │   ├── DateRangePicker.test.tsx  # Unit tests for DateRangePicker
│   │   ├── DeleteConfirmModal.tsx    # Reusable delete confirmation modal
│   │   ├── DeleteConfirmModal.test.tsx  # Unit tests for DeleteConfirmModal
│   │   ├── Select.tsx          # Custom select dropdown (supports upward opening)
│   │   └── Skeleton.tsx        # Skeleton loading components (8+ variants)
│   ├── NotificationPanel.tsx   # Notification bell dropdown panel
│   └── ProtectedRoute.tsx      # Role-based route guard
├── context/
│   ├── AuthContext.tsx         # Authentication state management + inactive user blocking
│   ├── NotificationContext.tsx # Real-time notification subscriptions
│   └── ToastContext.tsx        # Toast notifications (success/error/warning/info)
├── features/
│   ├── admin/
│   │   ├── Dashboard.tsx              # Admin dashboard (charts, stats, RPC-powered)
│   │   ├── LogbookList.tsx            # Logbook management (paginated, filterable, sortable)
│   │   ├── UserList.tsx               # User CRUD (soft delete, reactivate, hard delete)
│   │   ├── UnitList.tsx               # Unit management (CRUD)
│   │   ├── EtollList.tsx              # E-Toll card management (CRUD + balance)
│   │   ├── OperationalBudgetPage.tsx  # Driver balance management (top-up, edit, reset)
│   │   ├── DriverSummary.tsx          # Driver performance summary + PDF export
│   │   ├── MonthlyReport.tsx          # Monthly report + PDF export with logos
│   │   └── TransactionLogsPage.tsx    # Riwayat Transaksi (Balance + E-Toll logs viewer)
│   ├── auth/
│   │   └── LoginPage.tsx              # Login page
│   ├── driver/
│   │   ├── Dashboard.tsx              # Driver dashboard (saldo + stats hero card)
│   │   ├── LogbookForm.tsx            # Logbook entry form (E-Toll select, validation)
│   │   └── LogbookHistory.tsx         # Driver logbook history (edit, delete rejected)
│   └── profile/
│       └── ProfilePage.tsx            # Shared profile page (avatar, password, email)
├── hooks/
│   └── useRealtimeSubscription.ts     # Supabase Realtime auto-refresh hook
├── services/
│   └── api.ts                 # ApiService (~1500 baris, 58+ methods)
├── types/
│   └── index.ts               # TypeScript types (User, Unit, Etoll, LogbookEntry, BalanceLog, EtollLog, AuthState)
└── utils/
    ├── cn.ts                  # Tailwind class merger (clsx + tailwind-merge)
    ├── calculations.ts        # Pure functions (formatCurrency, calculateNewBalance, deductBalance, calculateTotalCost)
    ├── calculations.test.ts   # Unit tests for calculations
    └── reportPdfGenerator.ts  # Monthly Report PDF generator (dual logos, auto-table)
```

## Keputusan Arsitektur

### 1. Feature-Based Structure
Kode diorganisasi berdasarkan fitur (`admin/`, `driver/`, `auth/`, `profile/`) bukan berdasarkan tipe file. Ini memudahkan navigasi dan scaling.

### 2. ApiService Pattern
Semua interaksi dengan database melalui `ApiService` yang berkomunikasi langsung dengan Supabase. Service ini memiliki **58+ methods** yang mencakup:

```typescript
// AUTH
ApiService.login(email, password)       // Login + inactive check
ApiService.register(userData)            // Register driver baru
ApiService.getCurrentUser()              // Get session + profile
ApiService.logout()

// PROFILE
ApiService.updateProfile(userId, data)   // Update nama/avatar
ApiService.updatePassword(old, new)      // Change password
ApiService.updateEmail(newEmail)         // Change email
ApiService.uploadAvatar(userId, file)    // Upload foto profil
ApiService.deleteAvatar(userId)          // Hapus foto profil

// USERS
ApiService.getUsers()                    // List semua users
ApiService.getUserById(id)
ApiService.createUser(userData)          // Admin create user
ApiService.updateUser(id, updates)
ApiService.deleteUser(id)               // Soft delete → inactive
ApiService.reactivateUser(id)           // Set status → active
ApiService.deleteUserPermanently(id)    // Hard delete + cleanup logbooks

// UNITS
ApiService.getUnits()
ApiService.getUnitById(id)
ApiService.createUnit(unit)
ApiService.updateUnit(id, updates)
ApiService.deleteUnit(id)

// LOGBOOKS
ApiService.getLogbooks()                // All logbooks
ApiService.getLogbooksPaginated(params) // Server-side pagination + filter + sort
ApiService.getLogbooksByDriverId(id)    // Driver's own logbooks
ApiService.getAllLogbooks(start, end)   // Date range filtered
ApiService.getLogbookById(id)
ApiService.createLogbook(entry)         // Submit + notify admins
ApiService.updateLogbook(id, updates)
ApiService.updateLogbookStatus(id, st)  // Approve/reject + balance deduction + notify
ApiService.deleteLogbook(id)            // Admin delete
ApiService.deleteLogbookByDriver(id, driverId)  // Driver delete rejected only

// E-TOLLS
ApiService.getEtolls()
ApiService.getActiveEtolls()            // Active only (for driver select)
ApiService.createEtoll(etoll)
ApiService.updateEtoll(id, updates)     // + E-Toll balance logging
ApiService.deleteEtoll(id)

// DRIVER BALANCE
ApiService.getDriversWithBalance()      // All drivers + saldo
ApiService.topUpDriverBalance(id, amt)  // Top-up + balance_logs
ApiService.updateDriverBalance(id, bal) // Edit manual + balance_logs
ApiService.resetDriverBalance(id)       // Reset ke 0 + balance_logs
ApiService.getDriverBalance(id)         // Get single driver balance

// NOTIFICATIONS
ApiService.getNotifications(userId)
ApiService.createNotification(notif)
ApiService.markNotificationAsRead(id)
ApiService.markAllNotificationsAsRead(userId)
ApiService.deleteNotification(id)
ApiService.deleteAllNotifications(userId)
ApiService.notifyAdmins(notif)          // Broadcast to all admins

// DASHBOARD (RPC)
ApiService.getAdminDashboardStats(days) // Aggregated stats via RPC function

// REPORTING
ApiService.getMonthlyReportData(month, year, driver?, unit?)

// LOGS
ApiService.getBalanceLogs()             // Riwayat saldo operasional
ApiService.getEtollLogs()               // Riwayat saldo E-Toll
```

### 3. Centralized Constants
File `constants/index.ts` memusatkan semua magic numbers dan status values:
- Pagination: `PAGE_SIZE = 10`, `MAX_PAGE_SIZE = 100`
- Auth: `MIN_PASSWORD_LENGTH = 6`
- UI: `TOAST_DURATION_MS = 5000`, `DEBOUNCE_DELAY_MS = 300`
- Status enums: `USER_STATUS`, `LOGBOOK_STATUS`, `UNIT_STATUS`, `ETOLL_STATUS`

### 4. Context-Based Authentication
`AuthContext` menggunakan Supabase Auth untuk session management dengan:
- Email + password authentication
- Inactive user blocking (cek status di login)
- Token refresh handling
- `setCreatingUserFlag` untuk mencegah redirect saat admin create user

### 5. Real-time Notifications
`NotificationContext` menggunakan Supabase Realtime untuk subscribe ke perubahan tabel `notifications`.

### 5b. Real-time Auto-Refresh (useRealtimeSubscription)
Custom hook `useRealtimeSubscription` digunakan di 5 halaman untuk auto-refresh data saat ada perubahan di database:

| Halaman | Tabel | Events | Filter |
|---------|-------|--------|--------|
| Admin Dashboard | `logbooks` | INSERT, UPDATE, DELETE | - |
| LogbookList | `logbooks` | INSERT, UPDATE, DELETE | - |
| OperationalBudgetPage | `profiles` | UPDATE | - |
| Driver Dashboard | `logbooks` | INSERT, UPDATE, DELETE | `driver_id=eq.{userId}` |
| LogbookHistory | `logbooks` | UPDATE, DELETE | `driver_id=eq.{userId}` |

**Prasyarat Database:**
- `ALTER PUBLICATION supabase_realtime ADD TABLE logbooks, profiles;`
- `ALTER TABLE logbooks REPLICA IDENTITY FULL;` (agar DELETE events mengirim semua kolom)

### 6. Toast Notifications
`ToastContext` menyediakan feedback visual untuk CRUD operations dengan auto-dismiss (5 detik). Mendukung 4 tipe: `success`, `error`, `warning`, `info`.

### 7. Protected Routes
Routes dibungkus dengan komponen `ProtectedRoute` yang memeriksa autentikasi dan role pengguna (`admin` atau `driver`).

### 8. Drawer Navigation
Layout menggunakan drawer yang muncul dari kiri (clipped di bawah header) dengan backdrop blur dan animasi smooth. Admin memiliki 9 menu items, driver memiliki 3 menu items.

### 9. Soft Delete Pattern
Users di-nonaktifkan dengan mengubah status ke `inactive`, bukan hard delete. User inactive tidak bisa login. Admin juga bisa melakukan **hard delete permanen** yang menghapus semua data terkait.

### 10. Pure Utility Functions + Unit Tests
File `utils/calculations.ts` berisi pure functions untuk:
- `formatCurrency()` — format ke IDR (Rp)
- `calculateNewBalance()` — hitung saldo setelah top-up
- `deductBalance()` — kurangi saldo (min 0)
- `calculateTotalCost()` — total biaya tol + operasional

Semua dicover oleh unit tests di `calculations.test.ts`.

### 11. PDF Report Generator
`utils/reportPdfGenerator.ts` menghasilkan PDF laporan bulanan profesional dengan:
- Dual logos perusahaan (Andin + ASS)
- Header: Judul + Periode
- Ringkasan Umum (Total Trip, Total Biaya)
- Tabel Ringkasan Per Driver (No, Nama, Trip, Biaya)
- Tabel Ringkasan Per Unit (No, Nama, Plat, Trip)
- Footer: Nomor halaman + Tanggal cetak

### 12. Testing Infrastructure
Menggunakan **Vitest** + **Testing Library** dengan:
- `vitest` untuk test runner
- `@testing-library/react` untuk component testing
- `@testing-library/user-event` untuk event simulation
- `jsdom` sebagai test environment
- Scripts: `npm test`, `npm run test:run`, `npm run test:coverage`

## Alur Data

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Component  │────▶│  ApiService  │────▶│   Supabase   │
│   (React)    │◀────│   (API)      │◀────│  (Database)  │
└──────────────┘     └──────────────┘     └──────────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Toast     │     │   Realtime   │     │  RPC Stats   │
│   Context    │     │ Subscription │     │  Function    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Alur Approve Logbook (Balance Deduction)
```
Admin approve logbook
  → updateLogbookStatus('approved')
    → Ambil saldo driver saat ini
    → Hitung total biaya (toll + operational)
    → Update profiles.operational_balance (saldo baru = saldo - biaya, bisa minus/utang)
    → Kirim notifikasi ke driver
```

### Alur E-Toll Balance Management
```
Admin top-up/edit/reset saldo E-Toll
  → updateEtoll(id, { balance: newBalance })
    → Simpan log ke etoll_logs table (action_type, amount, prev_balance, new_balance)
```

## Database Schema

### Profiles (Users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  operational_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Units (Kendaraan)
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### E-Tolls (Kartu Tol)
```sql
CREATE TABLE etolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name TEXT NOT NULL,
  card_number TEXT,
  balance INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Logbooks
```sql
CREATE TABLE logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  driver_id UUID REFERENCES profiles(id) NOT NULL,
  unit_id UUID REFERENCES units(id) NOT NULL,
  etoll_id UUID REFERENCES etolls(id),
  client_name TEXT,
  rute TEXT,
  keterangan TEXT,
  toll_cost INTEGER DEFAULT 0,
  parking_cost INTEGER DEFAULT 0,
  operational_cost INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('logbook_submitted', 'logbook_approved', 'logbook_rejected', 'user_registered', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Balance Logs (Riwayat Saldo Operasional)
```sql
CREATE TABLE balance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('top_up', 'edit', 'reset')),
  amount NUMERIC,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### E-Toll Logs (Riwayat Saldo E-Toll)
```sql
CREATE TABLE etoll_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etoll_id UUID REFERENCES etolls(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('top_up', 'deduct', 'edit', 'reset')),
  amount NUMERIC,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RPC Function: Dashboard Statistics
```sql
CREATE FUNCTION get_admin_dashboard_stats(period_days INTEGER DEFAULT 7)
RETURNS JSON
-- Returns: totalLogbooks, todayLogbooks, weekLogbooks, monthLogbooks,
--          totalDrivers, totalUnits, totalCost, todayCost, periodCost,
--          statusData (pie chart), dailyData (bar/line chart),
--          topDrivers (top 5), recentLogbooks (last 5)
```

## RLS Policies

### Profiles
- Anyone can view profiles
- Users can update own profile
- **Admins can update any profile** (untuk soft delete, balance update)
- Authenticated users can insert own profile (trigger-based)

### Units
- Anyone can view/manage units

### E-Tolls
- Anyone can view E-Tolls
- **Admins can manage E-Tolls** (full CRUD)
- **Drivers can deduct E-Toll balance** (saat submit logbook)

### Logbooks
- Drivers can view/insert/update own logbooks
- Admins can view/manage all logbooks
- **Drivers can delete own rejected logbooks**

### Notifications
- Users can view/update/delete own notifications
- Anyone can insert notifications (agar driver bisa trigger notif ke admin)

### Balance Logs
- Admins can view/insert all balance logs
- Drivers can view own balance logs

### E-Toll Logs
- Admins can view/insert all E-Toll logs

## Routing

### Admin Routes (`/admin/*`)
| Route | Component | Deskripsi |
|-------|-----------|-----------|
| `/admin` | `Dashboard` | Dashboard analytics + charts (RPC-powered) |
| `/admin/logbooks` | `LogbookList` | Manajemen logbook (paginated, filter, sort, export) |
| `/admin/etolls` | `EtollList` | Manajemen kartu E-Toll |
| `/admin/operational` | `OperationalBudgetPage` | Manajemen saldo operasional driver |
| `/admin/driver-summary` | `DriverSummary` | Ringkasan performa driver + PDF export |
| `/admin/laporan` | `MonthlyReport` | Laporan bulanan + PDF export dengan logo |
| `/admin/transactions` | `TransactionLogsPage` | Riwayat transaksi (Balance + E-Toll logs) |
| `/admin/units` | `UnitList` | Manajemen unit kendaraan |
| `/admin/users` | `UserList` | Manajemen user (soft/hard delete, create) |
| `/admin/profile` | `ProfilePage` | Profil admin |

### Driver Routes (`/driver/*`)
| Route | Component | Deskripsi |
|-------|-----------|-----------|
| `/driver` | `Dashboard` | Dashboard + saldo hero card |
| `/driver/logbook` | `LogbookForm` | Input logbook baru |
| `/driver/history` | `LogbookHistory` | Riwayat logbook (edit, delete rejected) |
| `/driver/profile` | `ProfilePage` | Profil driver |

## Role Pengguna

| Role | Akses |
|------|-------|
| **Admin** | Dashboard Analytics, Manajemen Logbook (CRUD + Approve/Reject), Manajemen Unit, User (Soft/Hard Delete), E-Toll, Saldo Operasional, Driver Summary, Laporan Bulanan, Riwayat Transaksi |
| **Driver** | Dashboard (Saldo + Stats), Input Logbook, Riwayat Logbook, Edit Logbook, Hapus Logbook Rejected, Profil |

## Notification Flow

```
Driver submit logbook      → Notifikasi ke semua Admin (type: logbook_submitted)
Admin approve logbook      → Notifikasi ke Driver (type: logbook_approved)
Admin reject logbook       → Notifikasi ke Driver (type: logbook_rejected, with warning)
User registered            → Notifikasi ke Admin (type: user_registered)
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

## SQL Migration Files (supabase/)

| File | Deskripsi |
|------|-----------|
| `schema.sql` | Main schema: profiles, units, etolls, logbooks, notifications + RLS + triggers + RPC |
| `operational_logs.sql` | Tabel `balance_logs` + RLS policies |
| `etoll_logs.sql` | Tabel `etoll_logs` + RLS policies |
| `rls_policies.sql` | Comprehensive RLS policies reference |
| `enable_realtime.sql` | Enable realtime subscriptions untuk tabel terkait |

## Catatan Pengembangan

- **State saat ini**: Phase 3.5 - Advanced Features Complete
- **Realtime**: Auto-refresh di 5 halaman via `useRealtimeSubscription` hook + Notifikasi real-time via `NotificationContext`
- **Security**: Row Level Security (RLS) aktif di semua 7 tabel
- **Analytics**: Dashboard dengan Recharts (bar, pie, line charts) via RPC function
- **Reporting**: Laporan Bulanan + Driver Summary dengan PDF export (dual company logos)
- **Cost Management**: Top Up, Edit, Reset saldo + Balance Logs + E-Toll Logs + Saldo Minus (Hutang Kantor)
- **Transaction History**: Halaman Riwayat Transaksi dengan dual-tab (Uang Operasional + E-Toll)
- **Testing**: Vitest + Testing Library, unit tests untuk calculations, DatePicker, DateRangePicker, DeleteConfirmModal
- **Constants**: Centralized magic numbers dan status enums di `constants/index.ts`
- **UX**: Toast notifications, skeleton loading (8+ variants), soft delete, glassmorphism header, **Mobile Responsive (Card/Table views)**, accessibility compliant (ARIA, htmlFor, tabular-nums)
- **Deployment**: Live di **andinlaporanharian.vercel.app**
