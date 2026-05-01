# CMS Panel Claude — Ana Talimatlar

Sen bu projenin **CMS panel frontend geliştiricisin**.
Backend koduna (Node.js, Express, MongoDB, Mongoose) dokunmuyorsun.
Web sitesi koduna (Next.js, taku/) dokunmuyorsun.
Sadece bu repo: React + Tailwind CSS CMS yönetim paneli.

---

## Sistem İçindeki Rolün

```
┌──────────────────────────────────────────────────┐
│  CMS PANEL (bu repo) ← SEN BURADASIN           │
│  React + Tailwind + Vite                         │
│  Firma sahipleri buradan içerik yönetir          │
└──────────────┬───────────────────────────────────┘
               │ JWT Bearer + x-tenant-id header
               │ Axios → /api/*
┌──────────────▼───────────────────────────────────┐
│  Backend (ayrı repo — Node.js/Express/MongoDB)   │
│  Sadece API çağrısı yaparsın, içine girme        │
└──────────────────────────────────────────────────┘
```

---

## Stack (Kesin — Değiştirilemez)

| Katman | Teknoloji |
|---|---|
| UI | React 18 |
| Stil | Tailwind CSS |
| Dil | JavaScript (TypeScript yok) |
| HTTP | Axios (`src/api/client.js`) |
| Build | Vite |
| Routing | React Router DOM |

---

## Proje Yapısı

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js              # Axios instance — token + tenantId interceptor
│   ├── context/
│   │   ├── AuthContext.jsx        # user, activeTenantId, activeCompany, login/logout/switchTenant
│   │   ├── ThemeContext.jsx       # dark/light mode
│   │   └── ToastContext.jsx       # Bildirim sistemi
│   ├── components/
│   │   ├── layout/
│   │   │   ├── PanelLayout.jsx    # Sidebar + Topbar sarmalayıcı
│   │   │   ├── Sidebar.jsx        # Navigasyon menüsü (sektöre + yetkiye göre)
│   │   │   └── Topbar.jsx         # Firma seçici + kullanıcı menüsü
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx          # font-size min 16px zorunlu
│   │       ├── Modal.jsx
│   │       ├── MediaPickerModal.jsx
│   │       ├── RichTextEditor.jsx
│   │       ├── Skeleton.jsx
│   │       └── EmptyState.jsx
│   ├── pages/                     # Her panel ekranı için bir sayfa
│   └── styles/
│       └── globals.css
```

---

## Temel Mimari Kurallar

### 1. API İstemcisi — `src/api/client.js`

Tüm backend çağrıları `api` instance'ı üzerinden yapılır:

```js
import api from '../api/client';

// GET
const { data } = await api.get('/pages');

// POST
const { data } = await api.post('/pages', payload);

// PUT
const { data } = await api.put(`/pages/${id}`, payload);

// DELETE
await api.delete(`/pages/${id}`);
```

**Interceptor otomatik ekler:**
- `Authorization: Bearer <accessToken>` (localStorage'dan)
- `x-tenant-id: <activeTenantId>` (localStorage'dan)
- 401 gelirse refresh token ile otomatik yenileme
- Refresh başarısız → logout + login sayfasına yönlendir

### 2. Auth & Tenant Sistemi — `AuthContext`

```js
import { useAuth } from '../context/AuthContext';

const { user, activeTenantId, activeCompany, login, logout, switchTenant } = useAuth();

// user.isSuperAdmin         → tüm firmalara erişim
// user.companyRoles         → [{ tenantId, roleId }]
// activeTenantId            → localStorage'daki aktif firma ID'si
// activeCompany             → GET /api/companies/:id sonucu (branding, sector vb.)
// switchTenant(tenantId)    → firma değiştir
```

**Login akışı:**
1. `api.post('/auth/login', { email, password })`
2. `accessToken + refreshToken` → localStorage
3. `user.companyRoles[0].tenantId` → `activeTenantId` → localStorage
4. `api.get('/companies/:id')` → `activeCompany`

### 3. Yetki Bazlı UI — RBAC

Panel içeriği kullanıcının rolüne göre filtrelenir. Sidebar, sayfa erişimleri ve butonlar buna göre gösterilir/gizlenir.

```js
// Kullanıcının aktif firmadaki rolünü bul
const userRole = user?.companyRoles
  ?.find(cr => cr.tenantId === activeTenantId)
  ?.roleId?.name; // veya lookup ile

// Rol bazlı render
{userRole === 'company_admin' && <AdminOnlySection />}
```

Rol hiyerarşisi (backend RBAC ile eşleşmeli):
- `super_admin` → her şeye erişir
- `agency_admin` → tüm firmaları yönetir
- `company_admin` → kendi firmasını yönetir
- `seo_specialist` → sadece SEO ekranları
- `content_editor` → sayfa ve içerik yönetimi
- `media_manager` → sadece medya kütüphanesi
- `reservation_manager` → rezervasyonlar ve formlar
- `viewer` → sadece okuma

### 4. Multi-Tenant Farkındalığı

- Her API çağrısında `x-tenant-id` otomatik eklenir (interceptor)
- Firma değiştirildiğinde (`switchTenant`) tüm state refresh edilir
- Farklı firmanın verisi asla karıştırılmaz
- `activeCompany.sector` → hangi menü öğelerinin gösterileceğini belirler

### 5. Dark/Light Mode

Her bileşen her iki modda çalışmalı. Token sistemi:

```js
// ThemeContext'ten
const { theme, toggleTheme } = useTheme(); // 'light' | 'dark'

// CSS değişkenleri:
// --bg-base, --bg-surface, --bg-muted
// --border
// --text-primary, --text-secondary, --text-muted
// --brand-primary, --brand-primary-hover
// --state-success, --state-error, --state-warning
```

Tailwind dark mode sınıfları yerine CSS variable kullan:
```jsx
// DOĞRU
<div style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>

// YANLIŞ (dark mode'da çalışmaz)
<div className="bg-white text-gray-900">
```

---

## Renk Tokenları

### Light Mode
| Token | Hex | Kullanım |
|---|---|---|
| `--bg-base` | `#F8FAFC` | Sayfa arka planı |
| `--bg-surface` | `#FFFFFF` | Kart, modal |
| `--bg-muted` | `#F1F5F9` | Alternating row |
| `--border` | `#E2E8F0` | Border, divider |
| `--text-primary` | `#0F172A` | Ana metin |
| `--text-secondary` | `#475569` | İkincil metin |
| `--text-muted` | `#64748B` | Yardımcı metin |

### Dark Mode
| Token | Hex | Kullanım |
|---|---|---|
| `--bg-base` | `#0B1120` | Sayfa arka planı |
| `--bg-surface` | `#111827` | Kart, modal |
| `--bg-muted` | `#1F2937` | Alternating row |
| `--border` | `#334155` | Border, divider |
| `--text-primary` | `#F8FAFC` | Ana metin |

### Marka Renkleri
| Token | Hex |
|---|---|
| `--brand-primary` | `#2563EB` |
| `--brand-primary-hover` | `#1D4ED8` |
| `--state-success` | `#16A34A` |
| `--state-error` | `#DC2626` |
| `--state-warning` | `#F97316` |

---

## Panel Sayfaları (Mevcut)

| Sayfa | Dosya | Açıklama |
|---|---|---|
| Login | `LoginPage.jsx` | JWT login |
| Şifremi Unuttum | `ForgotPasswordPage.jsx` | Email ile sıfırlama |
| Dashboard | `DashboardPage.jsx` | Genel bakış |
| Firmalar | `CompaniesPage.jsx` | Firma listesi (super/agency admin) |
| Firma Ayarları | `CompanySettingsPage.jsx` | Logo, marka rengi, iletişim |
| Kullanıcılar | `UsersPage.jsx` | Kullanıcı yönetimi |
| Roller | `RolesPage.jsx` | Rol yönetimi |
| Sayfalar Listesi | `PagesListPage.jsx` | Tüm sayfalar |
| Sayfa Düzenleyici | `PageEditorPage.jsx` | Sayfa içeriği + SEO |
| Blog Listesi | `BlogListPage.jsx` | Blog yazıları |
| Blog Düzenleyici | `BlogEditorPage.jsx` | Blog yazısı içeriği |
| Medya | `MediaPage.jsx` | S3 medya kütüphanesi |
| Menüler | `MenusPage.jsx` | Navigasyon yönetimi |
| SEO | `SeoPage.jsx` | Meta, OG, schema |
| Hizmetler/Ürünler | `DentalServicesPage.jsx` | Service modeli yönetimi |
| Rezervasyonlar | `ReservationsPage.jsx` | Gelen rezervasyon/randevular |
| Formlar | `FormsPage.jsx` | İletişim form başvuruları |
| SSS | `FaqManagePage.jsx` | SSS yönetimi |
| Restoran Menüsü | `RestaurantMenuPage.jsx` | Kategori + ürün |
| İlanlar | `PropertiesManagePage.jsx` | Gayrimenkul ilanları |
| Yönlendirmeler | `RedirectsPage.jsx` | URL redirect yönetimi |
| Diller | `LanguagesPage.jsx` | Dil ayarları |
| Profil | `ProfilePage.jsx` | Kullanıcı profili |

---

## Backend API — Sık Kullanılan Endpoint'ler

```
# Auth
POST   /api/auth/login                     { email, password }
POST   /api/auth/refresh                   { refreshToken }
POST   /api/auth/logout                    { refreshToken }
GET    /api/auth/me

# Firma
GET    /api/companies
POST   /api/companies                      Firma oluştur
GET    /api/companies/:id
PUT    /api/companies/:id                  Firma güncelle

# Sayfalar (x-tenant-id gerekli)
GET    /api/pages                          Sayfa listesi
POST   /api/pages                          Yeni sayfa
GET    /api/pages/:id
PUT    /api/pages/:id
DELETE /api/pages/:id

# Blog
GET    /api/blog                           Blog listesi
POST   /api/blog                           Yeni yazı
GET    /api/blog/:id
PUT    /api/blog/:id
DELETE /api/blog/:id

# Medya
GET    /api/media                          Medya listesi
POST   /api/media/upload                   Dosya yükle (multipart)
DELETE /api/media/:id                      Sil

# Hizmetler / Ürünler
GET    /api/services
POST   /api/services
PUT    /api/services/:id
DELETE /api/services/:id

# Rezervasyonlar
GET    /api/reservations                   Gelen rezervasyonlar
PUT    /api/reservations/:id               Durum güncelle

# Formlar
GET    /api/forms                          Form başvuruları

# Navigasyon
GET    /api/menus
POST   /api/menus
PUT    /api/menus/:id
DELETE /api/menus/:id

# SEO
GET    /api/seo/:pageId
PUT    /api/seo/:pageId

# SSS
GET    /api/faqs
POST   /api/faqs
PUT    /api/faqs/:id
DELETE /api/faqs/:id

# Kullanıcılar
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

# Roller
GET    /api/roles

# Restoran
GET    /api/restaurant/categories
POST   /api/restaurant/categories
GET    /api/restaurant/items
POST   /api/restaurant/items
```

---

## Ortam Değişkenleri (`.env`)

```bash
VITE_API_URL=http://localhost:5001        # dev; prod'da Railway/Render URL'i
```

---

## Sidebar — Sektöre Göre Menü Filtresi

`activeCompany.sector` değerine göre bazı menü öğeleri gösterilir/gizlenir:

```js
const sector = activeCompany?.sector;

// Sadece restaurant'ta
const showRestaurantMenu = sector === 'restaurant';
const showReservations   = ['restaurant', 'hotel'].includes(sector);

// Sadece real_estate'de
const showProperties = sector === 'real_estate';

// Hep görünür
// Dashboard, Sayfalar, Blog, Medya, Menüler, SEO, İletişim Formları, Kullanıcılar
```

---

## Zorunlu Kurallar

### UI
- Input font-size minimum **16px** (iOS zoom prevention) — asla düşürme
- Her iki mod (light + dark) her bileşende çalışmalı — birini atlayarak geliştirme yapma
- Türkçe panel arayüzünde İngilizce buton/label metni kullanma ("Submit" → "Kaydet", "Cancel" → "İptal")
- Hata mesajları sert veya suçlayıcı dil içermemeli

### Güvenlik
- `accessToken` ve `refreshToken` sadece localStorage'da — state'e koyma, URL'ye ekleme
- API çağrıları her zaman `api` instance'ı üzerinden — bare `fetch` veya `axios.create` tekrar
- Tenant ID'yi formdan/URL'den alma — her zaman `activeTenantId` context'inden

### Erişilebilirlik
- WCAG 2.1 AA minimum
- Form label'ları `htmlFor` ile input'a bağlı
- Modal'larda focus trap + ESC ile kapatma
- Tablo ve listelerde semantik HTML

### Performans
- Liste sayfalarında `loading` skeleton göster
- Büyük listelerde pagination veya infinite scroll (varsa backend desteği)
- Medya yükleme: progress bar göster

---

## Firma Bazlı Branding (Panel İçi)

Her firma kendi logo ve renk değerlerine sahip. Panel içinde firma seçildiğinde:

```js
// activeCompany.branding'den al
const { logoLight, logoDark, primaryColor, accentColor } = activeCompany?.branding || {};

// Firma adı için fallback
const companyName = activeCompany?.name || 'Firma';
```

Panel'in kendi renk sistemi (`--brand-primary: #2563EB`) firmaya göre **değişmez** — sadece firma web sitesinde firma renkleri kullanılır. Panel her zaman kendi marka renklerinde kalır.

---

## Kaçınılacaklar

- Backend dosyalarını okuma veya düzenleme
- Web sitesi (taku/, Next.js) dosyalarını okuma veya düzenleme
- `bare fetch()` ile backend çağrısı yapma — her zaman `api` instance'ı
- Hard-coded tenant ID, şirket adı, renk
- Sadece light veya sadece dark mode için tasarım
- İngilizce panel metni (Türkçe zorunlu)
- `console.log` production kodunda bırakma
