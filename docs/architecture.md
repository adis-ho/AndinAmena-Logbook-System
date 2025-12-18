# Arsitektur Sistem Amena Logbook

## Gambaran Umum

Amena Logbook adalah aplikasi web untuk manajemen logbook kendaraan operasional. Aplikasi ini memungkinkan driver untuk mencatat perjalanan harian dan admin untuk mengelola data logbook, unit kendaraan, dan pengguna.

## Stack Teknologi

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| **Frontend Framework** | React | 19.x |
| **Build Tool** | Vite | 7.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Routing** | React Router DOM | 7.x |
| **State Management** | React Query | 5.x |
| **Form Validation** | Zod + React Hook Form | - |
| **Icons** | Lucide React | - |
| **Charts** | Recharts | 2.x |
| **Export** | xlsx, jspdf, html2canvas | - |
| **Backend** | Supabase | - |
| **Database** | PostgreSQL (Supabase) | - |
| **Auth** | Supabase Auth | - |
| **Realtime** | Supabase Realtime | - |
| **Fonts** | Plus Jakarta Sans | - |

## Struktur Direktori

```
src/
├── App.tsx                 # Root component dengan routing
├── main.tsx               # Entry point
├── index.css              # Global styles (Tailwind + animations)
├── assets/
│   └── fonts/             # Custom fonts (Plus Jakarta Sans)
├── lib/                   # External service clients
│   └── supabase.ts        # Supabase client configuration
├── components/            # Reusable components
│   ├── layouts/           # DashboardLayout, Drawer, Header
│   ├── ui/                # Skeleton loaders
│   └── NotificationPanel.tsx  # Notification dropdown
├── context/               # React Context providers
│   ├── AuthContext.tsx    # Authentication state management
│   ├── NotificationContext.tsx  # Notification state + realtime
│   └── ToastContext.tsx   # Toast notifications
├── features/              # Feature-based modules
│   ├── admin/             # Admin pages (Dashboard, Users, Units, Logbooks)
│   ├── auth/              # Login & Register pages
│   └── driver/            # Driver pages (Dashboard, Logbook entry, History)
├── services/              # Data layer
│   └── api.ts             # ApiService (Supabase implementation)
├── types/                 # TypeScript type definitions
│   └── index.ts           # User, Unit, LogbookEntry, Notification types
└── utils/                 # Utility functions
    └── cn.ts              # Tailwind class merger
```

## Keputusan Arsitektur

### 1. Feature-Based Structure
Kode diorganisasi berdasarkan fitur (admin, driver, auth) bukan berdasarkan tipe file. Ini memudahkan navigasi dan scaling.

### 2. ApiService Pattern
Semua interaksi dengan database melalui `ApiService` yang berkomunikasi dengan Supabase.

```typescript
// Contoh penggunaan ApiService
const users = await ApiService.getUsers();
await ApiService.createLogbook(entry);
await ApiService.deleteUser(id); // Soft delete - set status inactive
await ApiService.reactivateUser(id); // Set status active
```

### 3. Context-Based Authentication
`AuthContext` menggunakan Supabase Auth untuk session management dengan:
- Email + password authentication
- Inactive user blocking (cek status di login)
- Token refresh handling

### 4. Real-time Notifications
`NotificationContext` menggunakan Supabase Realtime untuk subscribe ke perubahan tabel `notifications`.

### 5. Toast Notifications
`ToastContext` menyediakan feedback visual untuk CRUD operations dengan auto-dismiss.

### 6. Protected Routes
Routes dibungkus dengan komponen `ProtectedRoute` yang memeriksa autentikasi dan role pengguna.

### 7. Drawer Navigation
Layout menggunakan drawer yang muncul dari kiri dengan backdrop blur dan animasi smooth.

### 8. Soft Delete Pattern
Users di-nonaktifkan dengan mengubah status ke 'inactive', bukan hard delete. User inactive tidak bisa login.

## Alur Data

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Component  │────▶│  ApiService  │────▶│   Supabase   │
│   (React)    │◀────│   (API)      │◀────│  (Database)  │
└──────────────┘     └──────────────┘     └──────────────┘
        │                   │
        ▼                   ▼
┌──────────────┐     ┌──────────────┐
│    Toast     │     │   Realtime   │
│   Context    │     │ Subscription │
└──────────────┘     └──────────────┘
```

## Database Schema

### Profiles (Users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'driver')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  operational_balance INTEGER DEFAULT 0, -- Saldo operasional per driver
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Units (Kendaraan)
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('available', 'in_use', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Logbooks
```sql
CREATE TABLE logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  driver_id UUID REFERENCES profiles(id),
  unit_id UUID REFERENCES units(id),
  client_name TEXT,          -- User/Tamu/Client
  rute TEXT,                 -- Rute perjalanan
  keterangan TEXT,           -- Keterangan/catatan
  toll_cost INTEGER,         -- Biaya Tol
  operational_cost INTEGER,  -- Biaya Parkir dll. (Ex-parking_cost)
  status TEXT CHECK (status IN ('submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('logbook_submitted', 'logbook_approved', 'logbook_rejected', 'user_registered', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## RLS Policies

### Profiles
- Anyone can view profiles
- Users can update own profile
- **Admins can update any profile** (untuk soft delete)
- Insert only for authenticated users

### Units
- Anyone can view/manage units

### Logbooks
- Drivers can view/insert/update own logbooks
- Admins can view all logbooks
- Admins can update all logbooks (approve/reject)

## Role Pengguna

| Role | Akses |
|------|-------|
| **Admin** | Dashboard Analytics, Manajemen Logbook, Unit, User, Approve/Reject, Soft Delete |
| **Driver** | Dashboard, Input Logbook, Riwayat Logbook, Edit Logbook |

## Notification Flow

```
Driver submit logbook → Notifikasi ke semua Admin
Admin approve logbook → Notifikasi ke Driver
Admin reject logbook  → Notifikasi ke Driver (dengan warning)
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

## Catatan Pengembangan

- **State saat ini**: Terintegrasi dengan Supabase, data persisten
- **Realtime**: Notifikasi berfungsi real-time menggunakan Supabase Realtime
- **Security**: Row Level Security (RLS) aktif di semua tabel
- **Analytics**: Dashboard dengan Recharts (bar, pie, line charts)
- **UX**: Toast notifications, skeleton loading, soft delete
