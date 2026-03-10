# Feature PRD: Premium Card Redesign (Mobile & Desktop)

## 1. Feature Name

**Premium Card Component Redesign — Google-Inspired Clean Cards**

## 2. Epic

- Parent Project: Andin-Amena Logbook System
- Design Reference: Google App Store-style cards (screenshot attached)
- Skills Referenced:
  - `frontend-design` — Bold aesthetics, distinctive typography, cohesive color, no "AI slop"
  - `web-design-guidelines` — Vercel Web Interface Guidelines compliance

## 3. Goal

### Problem
Saat ini card di halaman admin dan driver terlihat **"vibe coded"** — menggunakan pattern yang generik dan repetitif:
- Layout horizontal key-value yang datar dan membosankan (`Driver — Nama`, `User — Client`)
- Background biru solid yang monoton untuk semua cost section
- Border dan shadow yang tidak konsisten antar halaman
- Typography yang seragam tanpa hierarchy yang jelas
- Tidak ada elemen visual yang membuat card terasa premium atau memorable

### Solution
Redesign semua card component mengadaptasi **Google App Store card style** dari screenshot reference:
- **Typography-first hierarchy**: Label kecil uppercase di atas, value besar bold di bawah — vertikal, bukan horizontal
- **Clean whitespace**: Lebih banyak ruang napas, padding yang generous
- **Metadata grid**: Informasi disusun dalam grid yang rapi, bukan list horizontal
- **Subtle visual accents**: Badge/pill berwarna untuk status, icon kecil sebagai aksen
- **No heavy background boxes**: Hapus background biru yang berat, ganti dengan separator atau layout yang lebih bersih

### Impact
- **Visual quality**: Card terlihat premium, modern, dan intentionally designed
- **Readability**: Hierarchy informasi lebih jelas — user langsung tahu mana yang penting
- **Consistency**: Semua card di admin dan driver menggunakan design language yang sama
- **Mobile UX**: Card terasa native dan nyaman di mobile

## 4. User Personas

### Admin
- Melihat list laporan harian, user, unit, e-toll, budget, transaction logs
- Perlu scan informasi dengan cepat di tabel (desktop) dan card (mobile)

### Driver
- Melihat riwayat laporan harian sendiri
- Mayoritas akses via mobile — card adalah primary view

## 5. User Stories

### US-1: Clean Card Layout
> Sebagai **Admin/Driver**, saya ingin card yang menampilkan informasi dengan **hierarchy visual yang jelas**, sehingga saya bisa scan informasi penting dengan cepat tanpa effort.

### US-2: Consistent Design Language
> Sebagai **User**, saya ingin semua card di seluruh halaman menggunakan **design language yang konsisten**, sehingga web terasa cohesive dan premium.

### US-3: Mobile-First Experience
> Sebagai **Driver**, saya ingin card yang dioptimalkan untuk **mobile experience**, dengan touch target yang nyaman dan layout yang memanfaatkan layar kecil dengan baik.

## 6. Requirements

### Functional Requirements

#### FR-1: Card Design System (Berdasarkan Screenshot Reference)

**Typography Hierarchy** (terinspirasi Google card):
- **Category label**: Kecil, uppercase, tracking lebar, warna muted (contoh dari screenshot: "Task", "Location", "Marketing")
- **Primary title**: Besar, bold/black, dominan — ini yang pertama di-scan mata (contoh: "Calendar", "Google Earth")
- **Metadata values**: Ukuran medium, bold, dengan label kecil di atas masing-masing

**Layout Pattern**:
- Tiap card memiliki **header area** (category + title + status badge)
- Diikuti **metadata grid** (2-3 kolom informasi ringkas)
- Optional: **action area** di bagian bawah

**Visual Elements**:
- Status badge/pill berwarna (green approved, amber pending, rose rejected) — mirip "Free" badge di screenshot
- Separator tipis atau spacing antar section, **bukan** box-in-box
- Subtle shadow + border, hover effect yang halus
- Clean white background — tidak ada background biru berat

#### FR-2: Halaman yang Akan Diubah (Card Mobile)

| No | Halaman | File | Card Content |
|----|---------|------|-------------|
| 1 | **Laporan Harian (Admin)** | `LogbookList.tsx` | Tanggal, Unit, Driver, User, Rute, Biaya, Status, Actions |
| 2 | **Riwayat Laporan (Driver)** | `LogbookHistory.tsx` | Tanggal, Unit, Penyewa, Rute, Catatan, Biaya, Status, Actions |
| 3 | **Kelola User** | `UserList.tsx` | Nama, Username, Role, Status, Actions |
| 4 | **Kelola Unit** | `UnitList.tsx` | Nama, Plat, Status, Actions |
| 5 | **Kelola E-Toll** | `EtollList.tsx` | Nama Kartu, Nomor, Saldo, Status, Actions |
| 6 | **Saldo Operasional** | `OperationalBudgetPage.tsx` | Driver, Saldo, Actions |
| 7 | **Log Transaksi** | `TransactionLogsPage.tsx` | Tanggal, Tipe, Amount, Description |
| 8 | **Rekap Driver** | `DriverSummary.tsx` | Driver, Total Trip, Total Biaya |

#### FR-3: Design Tokens yang Digunakan

```css
/* Card Design Tokens */
--card-radius: 1.25rem;        /* 20px — rounded-[20px] */
--card-padding: 1.5rem;        /* 24px */
--card-padding-md: 2rem;       /* 32px on desktop */
--card-shadow: 0 1px 3px rgba(0,0,0,0.04);
--card-shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
--card-border: 1px solid rgba(0,0,0,0.04);

/* Typography */
--label-size: 0.625rem;        /* 10px */
--label-weight: 800;           /* font-extrabold */
--label-tracking: 0.1em;       /* tracking-widest */
--title-size: 1.25rem;         /* 20px */
--title-weight: 900;           /* font-black */
--value-size: 0.875rem;        /* 14px */
--value-weight: 700;           /* font-bold */
```

### Non-Functional Requirements

#### NFR-1: Performance
- Card redesign **tidak boleh** menambah component baru yang berat
- CSS-only untuk semua animasi (no JS animation library)

#### NFR-2: Responsiveness
- Card layout harus optimal di 320px–768px (mobile)
- Desktop view (table) **tidak berubah** — redesign fokus mobile card

#### NFR-3: Accessibility
- Touch target minimal 44x44px untuk semua action button
- Color contrast ratio minimal 4.5:1
- Proper `aria-label` untuk semua interactive elements

#### NFR-4: Consistency
- Semua 8 halaman HARUS menggunakan design pattern yang sama
- Perbedaan hanya di content, bukan di styling approach

## 7. Acceptance Criteria

### AC-1: Typography Hierarchy
- [ ] Card memiliki **3 level** typography yang jelas: label → title → value
- [ ] Label menggunakan uppercase, small, tracking lebar, warna muted
- [ ] Title/primary value menggunakan font-black, ukuran dominan

### AC-2: Clean Layout (Terinspirasi Screenshot)
- [ ] Metadata disusun dalam **grid vertikal** (label di atas, value di bawah), bukan horizontal key-value
- [ ] Tidak ada background box-in-box yang berat (hapus bg-blue-50 section)
- [ ] Generous whitespace antara sections

### AC-3: Status Badge
- [ ] Status menggunakan **pill/badge** berwarna kecil yang rapi
- [ ] Approved = emerald, Pending = amber, Rejected = rose

### AC-4: Action Buttons
- [ ] Buttons di card terlihat clean dan tidak terlalu banyak
- [ ] Touch target ≥ 44px
- [ ] Icon + text pada mobile

### AC-5: Consistent Design
- [ ] Semua 8 halaman menggunakan card pattern yang sama
- [ ] Spacing, radius, shadow, typography hierarchy konsisten

### AC-6: Build & Performance
- [ ] `npm run build` pass tanpa error
- [ ] No new dependencies added
- [ ] CSS-only animations

## 8. Out of Scope

| Item | Alasan |
|------|--------|
| Redesign desktop table view | Fokus pada mobile card, table tetap seperti sekarang |
| Dark mode redesign | Akan dilakukan terpisah |
| New reusable Card component | Inline styling per page, bukan extract ke shared component (kecuali jika diminta) |
| Admin Dashboard charts | Dashboard stat cards / chart bukan bagian dari redesign ini |
| Decorative illustrations | Screenshot reference memiliki illustrasi, tapi kita tidak perlu ini untuk logbook system |

---

## Design Reference Analysis

Dari screenshot Google App Store cards, elemen kunci yang diadaptasi:

| Elemen Screenshot | Adaptasi ke Project |
|---|---|
| Small category label ("Task", "Location") | → Label uppercase: "Laporan Harian", "Unit Kendaraan" |
| Large bold title ("Calendar", "Google Earth") | → Tanggal bold besar, atau nama driver/unit |
| Colored pill badge ("Free") | → Status badge (Pending, Disetujui, Ditolak) |
| Metadata grid (Rating, Size, Downloads) | → Grid: Biaya Tol, Biaya Opr, Total |
| Clean white card, minimal shadow | → White bg, subtle shadow, thin border |
| Generous padding & whitespace | → p-6 padding, comfortable spacing |
