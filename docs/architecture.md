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
| **Data Service** | MockService (lokal) | - |

## Struktur Direktori

```
src/
├── App.tsx                 # Root component dengan routing
├── main.tsx               # Entry point
├── index.css              # Global styles
├── assets/                # Static assets
├── components/            # Reusable components
│   ├── layouts/           # DashboardLayout, Sidebar, Header
│   └── ui/                # UI components (modals, buttons)
├── context/               # React Context providers
│   └── AuthContext.tsx    # Authentication state management
├── features/              # Feature-based modules
│   ├── admin/             # Admin pages (Dashboard, Users, Units, Logbooks)
│   ├── auth/              # Login & Register pages
│   └── driver/            # Driver pages (Dashboard, Logbook entry)
├── services/              # Data layer
│   └── mockData.ts        # Mock data service (simulates API)
├── types/                 # TypeScript type definitions
│   └── index.ts           # User, Unit, LogbookEntry types
└── utils/                 # Utility functions
    └── cn.ts              # Tailwind class merger
```

## Keputusan Arsitektur

### 1. Feature-Based Structure
Kode diorganisasi berdasarkan fitur (admin, driver, auth) bukan berdasarkan tipe file. Ini memudahkan navigasi dan scaling.

### 2. MockService Pattern
Data disimpan di memory dengan `MockService` yang mensimulasikan API calls. Pattern ini memudahkan migrasi ke backend nyata di masa depan.

```typescript
// Contoh penggunaan MockService
const users = await MockService.getUsers();
await MockService.createLogbook(entry);
```

### 3. Context-Based Authentication
`AuthContext` menyimpan state autentikasi global dan menyediakan fungsi `login()` dan `logout()`.

### 4. Protected Routes
Routes dibungkus dengan komponen `ProtectedRoute` yang memeriksa autentikasi dan role pengguna.

### 5. Responsive Layout
Layout menggunakan sidebar untuk desktop dan drawer untuk mobile dengan hamburger menu toggle.

## Alur Data

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Component  │────▶│  MockService │────▶│  Local State │
│   (React)    │◀────│   (API sim)  │◀────│   (Memory)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Role Pengguna

| Role | Akses |
|------|-------|
| **Admin** | Dashboard, Manajemen Logbook, Unit, User |
| **Driver** | Dashboard, Input Logbook, Riwayat Logbook |

## Model Data

### User
```typescript
interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'driver';
  status: 'active' | 'inactive';
}
```

### Unit (Kendaraan)
```typescript
interface Unit {
  id: string;
  name: string;
  plate_number: string;
  status: 'available' | 'in_use' | 'maintenance';
}
```

### LogbookEntry
```typescript
interface LogbookEntry {
  id: string;
  date: string;
  driver_id: string;
  unit_id: string;
  start_km: number;
  end_km: number;
  total_km: number;
  activities: string;
  fuel_cost: number;
  toll_cost: number;
  parking_cost: number;
  other_cost: number;
  total_cost: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}
```

## Catatan Pengembangan

- **State saat ini**: Menggunakan MockService (data tidak persisten)
- **Untuk production**: Perlu integrasi dengan backend database (Supabase, Firebase, atau custom API)
