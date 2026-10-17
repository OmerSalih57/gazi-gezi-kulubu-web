# Gazi Gezi Kulübü

Gazi Üniversitesi Gezi Kulübü için öğrenci platformu. Açık geziler, başvuru ve dekont, dijital bilet, galeri, gezi rehberleri, ekip başvurusu ve kampüs içi bir bilgi yarışması aynı yerde durur.

**Geliştirici:** Ömer Salih Aydın

## Mimari

- **Next.js 16** App Router, Cache Components ve Partial Prerendering
- **React 19**
- **Supabase**: kimlik, Postgres, satır düzeyi güvenlik ve `gallery` depolama kovası
- **Tailwind CSS v4**: sınıf tabanlı karanlık mod (`dark` sınıfı)
- **Framer Motion**: üst menüdeki kayan kapsül
- **Zod** ile form doğrulama, **jose** ile bilet imzası

Sayfalar üç kabuğa ayrılır:

| Kabuk | Rotalar |
| --- | --- |
| Genel | `/`, `/geziler`, `/blog`, `/galeri`, `/hakkimizda`, `/yarisma`, `/basvuru` |
| Üye | `/giris`, `/profil`, `/biletlerim/[id]` |
| Yönetim | `/yonetim` ve altındaki gezi, dekont, blog, galeri, başvuru ve yoklama ekranları |

Menüdeki **Rehberler** bağlantısı `/blog` adresine gider. Ayrı bir `/rehberler` rotası yoktur.

## Özellikler

- **Aydınlık / karanlık mod.** Üst menüdeki güneş ve ay düğmesi temayı değiştirir. Seçim `gezi-theme` anahtarıyla tarayıcıda saklanır.
- **Instagram vitrini.** Ana sayfada `@gazi.gezi` için üç kart. `INSTAGRAM_ACCESS_TOKEN` tanımlıysa gönderiler Graph API’den gelir; video ve Reels kartları Instagram CDN adresinden sessiz, döngüsel ve otomatik oynar. Akış veya video adresi yoksa kart kapak görselini gösterir. Sonuç beş saat önbellekte tutulur ve en yeni gönderi başa gelir.
- **Gazi Gezgin Quizi.** `/yarisma` üzerinde 12 soruluk tur, rozet ve liderlik tablosu. Doğru şık tarayıcıya gönderilmez.
- **Ekip başvurusu.** `/basvuru` formu ve `/yonetim/basvurular` inceleme ekranı. Haftalık süre, mevcut yanıtların içine yazılır.
- **Kapak sıkıştırma.** Galeri kapağı yüklemeden önce tuvalde WebP’ye indirilir (en geniş kenar yaklaşık 1200 piksel, kalite 0.8).
- **Hız sınırı.** `supabase/migrations/0007_rate_limits.sql` ve `0009_security_hardening.sql` yarışma gönderimi, ekip başvurusu ve gezi kaydı için Postgres tarafında sınır koyar. Kullanıcı ve IP birlikte boşsa istek reddedilir. Fonksiyon yoksa uygulama da isteği geçirmez. Kayıtlar yaklaşık 30 gün tutulur ve istemciye açılmaz.
- **90 günlük arşiv.** `0008_archive_old_data.sql` içindeki `archive_old_data()` eski yarışma turlarını `quiz_scores_archive` tablosuna taşır. Her kullanıcının en iyi puanı canlı tabloda kalır. 90 günden eski hız kayıtları silinir.

## Yerel kurulum

Gerekenler: Node.js 20 veya üzeri, bir Supabase projesi.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde açılır.

Üretim derlemesi:

```bash
npm run build
npm start
```

### Ortam değişkenleri

`.env.example` içindeki adlar şunlardır. Değerleri depoya koymayın. `.gitignore`, `.env.example` dışında kalan `.env*` dosyalarını dışlar.

| Değişken | Zorunlu | Nerede durur |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Evet | Tarayıcı ve sunucu |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Evet | Tarayıcı ve sunucu. Service role anahtarı değildir. |
| `TICKET_SECRET` | Evet | Yalnızca sunucu. Bilet QR imzası ve yarışma tur jetonu. En az 32 karakter, rastgele. |
| `INSTAGRAM_ACCESS_TOKEN` | Hayır | Yalnızca sunucu. Vitrin için Graph API jetonu. |
| `INSTAGRAM_USER_ID` | Hayır | Yalnızca sunucu. Jetonun bağlı olduğu Instagram kullanıcı kimliği. |
| `NEXT_PUBLIC_SITE_URL` | Hayır | Şu anda kod bu değişkeni okumaz. Dağıtım adresini not etmek için örnekte durur. |

`TICKET_SECRET` boşsa imza fonksiyonu hata verir. Kodda yedek gizli dize yoktur. Service role anahtarını uygulamaya eklemeyin.

### Veritabanı

`supabase/migrations` altındaki dosyaları Supabase SQL Editor’da sayı sırasıyla çalıştırın:

1. `0002_blog_posts.sql`
2. `0003_gallery.sql`
3. `0004_event_story.sql`
4. `0005_quiz_gamification.sql`
5. `0006_profile_team_reviews.sql`
6. `0007_rate_limits.sql`
7. `0008_archive_old_data.sql`
8. `0009_security_hardening.sql`

Bu dosyalar blog, galeri, gezi hikâyesi, yarışma, profil ayrıntıları, ekip başvurusu, hız sınırı ve çekirdek tablo satır politikalarını ekler. `profiles`, `events` ve `registrations` tablolarının projede önceden var olduğu varsayılır. Depoda `0001` dosyası yoktur. `0009` bu tabloların politikasını yeniden kurar: profil satırı yalnızca sahibine ve yöneticiye açıktır, ad ve avatar `profiles_public` görünümünden okunur, kontenjan sayısı `registration_occupancy` görünümünden gelir. Dekont kovası (`receipts`) anonim okumaya kapalıdır.

Google ile giriş için Supabase Auth içinde Google sağlayıcısını açın ve yönlendirme adresine `http://localhost:3000/auth/callback` ekleyin. Üretim adresini de aynı listeye yazın.

## Doğrulama

Bu depoda ayrı bir birim test betiği yoktur. Yayın öncesi kontrol `npx tsc --noEmit` ve `npm run build` ile yapılır.

Son çalıştırmada:

- `npx tsc --noEmit` hatasız bitti.
- `npm run build` (Next.js 16.4.1, Turbopack) derlemeyi tamamladı. Sayfalar kısmi önizleme ile üretildi.
- `npx eslint src --max-warnings 0` geçmedi. Kalan uyarılar `any` kullanımı, yarışma zamanlayıcısındaki `Date.now()`, arama kutusundaki etki içi durum güncellemesi, tema düğmesinin ilk boyama koruması ve bazı `<img>` öğeleridir. Üretim derlemesi bu ESLint kurallarında durmuyor.

`src` altında `console.log` bırakılmadı.

## Görseller

Galeri kapağı yüklemesi WebP akışına sıkıştırılır. Ana sayfadaki Instagram yedeği `public/media/instagram` altındaki JPEG dosyalarıdır. Gezi kapağı, rehber, galeri ve avatar görselleri uzak adreslerden geldiği için şu anda `<img>` ile çizilir; `next/image` kullanılmaz. Lighthouse bu etiketler için uyarı verebilir.

`public/file.svg`, `public/window.svg` ve `public/vercel.svg` başlangıç şablonundan kalmıştır ve uygulama içinde kullanılmaz.

## Bilinen sınırlar

- Yönetim panelindeki bazı tablolar hâlâ açık kart kullanır. Ziyaretçi sayfaları, başvuru formu, yarışma, vitrin, üst menü ve alt bilgi temayı izler.
