# Performance Audit Plan (Vercel React Best Practices)

**Dibuat:** 28 Februari 2026  
**Scope:** Frontend React SPA (Vite) + data layer client-side  
**Tujuan utama:** Meningkatkan performa tanpa merusak fungsionalitas yang sudah berjalan.

---

## Prinsip Implementasi

- **Non-breaking first**: tidak mengubah alur bisnis inti (auth, approval/reject, CRUD, reporting).
- **Incremental per sesi**: setiap sesi bisa diuji dan di-rollback terpisah.
- **Evidence-based**: perubahan mengacu pada:
  - `vercel-react-best-practices` skill (local AGENTS/SKILL)
  - React docs (Context7: `/websites/react_dev`)
  - TanStack Query docs (Context7: `/tanstack/query/v5_84_1`)

---

## Baseline & KPI

Gunakan baseline sebelum/sesudah tiap sesi:

- **Bundle**: ukuran chunk utama dari `dist/assets`.
- **Network**: jumlah request duplikat metadata antar halaman (users/units/etolls).
- **Runtime**: waktu interaksi pada halaman besar (LogbookList, Dashboard, TransactionLogs).
- **Regression**: smoke flow utama admin & driver.

---

## Sesi 1 — Critical (Bundle + Async Waterfall)

**Status:** `Done`

### Target
- Menurunkan initial JS payload.
- Mengurangi blocking async berantai di service.

### Ruang Lingkup
- Route-level lazy loading.
- Dynamic import untuk export libs (`xlsx`, `jspdf`, `jspdf-autotable`).
- Optimasi async di `ApiService`:
  - broadcast notifikasi admin
  - approve status flow
  - report data pipeline

### Acceptance Criteria
- App tetap berjalan dengan flow bisnis yang sama.
- Build sukses.
- Chunk utama berkurang dibanding baseline.

### Risiko
- Route fallback loading state.
- Typing dynamic import.

### Mitigasi
- Fallback UI sederhana + stabil.
- Jaga kontrak return `ApiService` tetap sama.

---

## Sesi 2 — Data Fetching & Cache Integration

**Status:** `Done`

### Target
- Mengurangi refetch metadata berulang.
- Aktivasi nyata TanStack Query caching.

### Ruang Lingkup
- Standarisasi `queryKeys`.
- Konfigurasi `QueryClient` default (`staleTime`, `gcTime`, retry policy).
- Hook query untuk reference data (`users`, `units`, `etolls`, `activeEtolls`).
- Migrasi halaman yang sering fetch metadata berulang ke query hooks.
- Invalidasi query terarah saat mutasi data reference.

### Acceptance Criteria
- Data tetap konsisten setelah mutasi.
- Request metadata berulang turun.
- Tidak ada perubahan perilaku UI/fungsi bisnis.

### Risiko
- Stale data jika invalidation salah scope.

### Mitigasi
- Query key factory tunggal.
- Invalidasi eksplisit pasca mutasi.

---

## Sesi 3 — Quick Wins Runtime

**Status:** `Done`

### Target
- Perbaikan efisiensi runtime berisiko rendah.

### Ruang Lingkup
- Lookup map untuk data tabular besar.
- Single-pass aggregation pada statistik.
- Listener dokumen aktif hanya saat komponen popup terbuka.
- Guard debug logging agar tidak noisy di production.

### Acceptance Criteria
- Render tetap sama secara visual.
- Tidak ada perubahan output bisnis.
- Build/test tetap hijau.

---

## Test Plan (Per Sesi)

- **Build check:** `npm run build`
- **Unit test existing:** `npm run test:run`
- **Smoke manual:**
  - Login admin/driver
  - Admin logbook approve/reject
  - CRUD user/unit/etoll
  - Export Excel/PDF
  - Driver input/edit/history
  - Notification panel

---

## Rollback Strategy

- Setiap sesi dipisah per area file agar rollback granular.
- Jika regresi:
  1. Revert sesi terakhir.
  2. Jalankan build + smoke lagi.
  3. Re-apply subset perubahan yang aman.

---

## Progress Checklist

- [x] Sesi 1 selesai
- [x] Sesi 2 selesai
- [x] Sesi 3 selesai
- [x] Baseline & hasil akhir tercatat di changelog
