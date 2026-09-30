# YayTech Demos — Uygulama Planı

Sep 30, 2026 · @Yunus

## Amaç ve alınan kararlar

Sektöre özel, etkileyici (3D, scroll, video) prototip siteleri bir kez hazırlayıp, lead-finder'daki bir işletmeye 5–10 dakikada uyarlamak ve kişisel bir subdomain'de (`isletme.yaytechstudio.com`) yayınlayıp satış mesajıyla iletmek. Hız template'in ne kadar config'e bağlı olduğundan gelir; AI yalnızca yaratıcı kısmı (renk, metin, görsel yerleşimi) yapar.

| Konu | Karar | Neden |
| --- | --- | --- |
| Repo | Yeni, ayrı repo: `C:\PROJECTS\WebProject\yaytech-demos` | Lead-finder bir Next.js uygulaması, demolar saf statik dosya; farklı deploy, farklı yaşam döngüsü. Lead-finder'ın içinde olsa her demo lead-finder'ı yeniden deploy eder ve repo şişer. |
| Hosting | Vercel, tek proje (`yaytech-demos`) | Nameserver zaten Vercel'de; wildcard SSL otomatik. |
| Domain | `*.yaytechstudio.com` wildcard bu projeye; ana site (`yaytechstudio.com`, `www`) kendi projesinde kalır | Domain proje bazında atanır, iki repo birbirinden bağımsız. |
| Build | Build adımı yok; repo olduğu gibi statik sunulur | En basit, en hızlı deploy (30–60 sn). |
| Demo modeli | Her demo, template'in tam kopyası (`sites/<slug>/`) | Template sonradan değişince eski demolar bozulmaz; agent işletmeye özel ek yapabilir; satış olursa klasör gerçek sitenin başlangıcı olur. |
| Config şeması | Ortak şema yok; `her template kendi TEMPLATE.md + config.example.js dosyasıyla` | Template'ler zamanla ayrışacak; ortak şema dayatmak onları kısıtlar. |
| Ağır medya | Template içinde kalır, demolar `/_t/<template>/...` yoluyla referans verir | 3D model ve videolar her demoda kopyalanmaz. |
| Agent | Lokal: Claude Code veya Gemini CLI (abonelikle), repo içindeki prosedür dosyasıyla | API maliyeti yok; lead-finder Vercel'de olduğu için lokal dosya yazamaz zaten. |
| Deploy tetikleyici | Agent `git push` yapar, Vercel otomatik deploy eder (push öncesi kullanıcı onayı) | Geçmiş git'te kalır, ekstra araç yok. |
| Satış mesajı | Agent en sonda işletmeye özel WhatsApp mesajı önerir; gönderimi sen yaparsın | Neyi özelleştirdiğini agent biliyor; otomatik gönderim yok. |
| Yaşam döngüsü | 30 gün sonra silinir, `keep: true` olanlar kalır; agent her yeni demoda temizliği çalıştırır | İzinsiz logo/foto'yu süresiz yayında tutmamak, repo'yu şişirmemek. |
| İçerik dürüstlüğü | Uydurma yorum, ekip, rakam yok; veri yoksa bölüm gizlenir | Sahte içerik satışı öldürür ve hukuki risk. |
| Görünürlük | Her demoda `noindex` + "Tasarım önizlemesi – YayTech Studio" etiketi | Taklit algısını ve Google'da indekslenmeyi önler. |

## Mimari ve repo yapısı

Repo üç katmandan oluşur: `templates/` (bir kez yapılır, nadiren değişir), `sites/` (her işletme için bir kopya) ve `_shared/` (her demoya enjekte edilen küçük ortak parçalar).

```
yaytech-demos/
├─ CLAUDE.md                  ← agent prosedürü (Claude Code okur)
├─ GEMINI.md                  ← aynı prosedür (Gemini CLI okur; CLAUDE.md'ye yönlendirir)
├─ vercel.json                ← subdomain → klasör yönlendirmesi + başlıklar
├─ .vercelignore              ← scripts/, inbox/, *.md dışarıda
├─ .gitignore                 ← inbox/ (ham görseller git'e girmez)
├─ (kökte index.html YOK — bölüm 3)
├─ 404.html                   ← "Bu önizleme artık yayında değil" sayfası
├─ _shared/
│  ├─ preview-badge.js        ← "Tasarım önizlemesi – YayTech Studio" etiketi
│  └─ preview.js              ← görüntülenme takibi (Faz 4)
├─ templates/
│  ├─ pilates/
│  │  ├─ TEMPLATE.md          ← bu template'in sözleşmesi (bölüm 4)
│  │  ├─ config.example.js
│  │  ├─ index.html, styles.css, app.js, reformer.js, config.js
│  │  ├─ assets/              ← yer tutucu görseller (kopyalanır, sonra değiştirilir)
│  │  └─ media/               ← ağır ortak medya: 3D, video (kopyalanmaz)
│  └─ <sektör>/ …
├─ sites/
│  └─ svd-pilates/
│     ├─ site.json            ← meta: template, createdAt, keep, leadId
│     ├─ config.js            ← işletme verisi (template'in beklediği formatta)
│     ├─ index.html, styles.css, app.js … ← template kopyası
│     └─ assets/              ← logo, fotoğraflar (sıkıştırılmış)
├─ inbox/                     ← senin bıraktığın ham görseller (git'e girmez)
│  └─ svd-pilates/
└─ scripts/
   ├─ new-site.mjs            ← template'i sites/<slug>'a kopyalar, site.json yazar
   ├─ optimize-images.mjs     ← inbox → sites/<slug>/assets (WebP, boyut sınırı)
   ├─ cleanup.mjs             ← 30 günü geçen siteleri siler
   └─ notify.mjs              ← yayınlanan / silinen demoyu lead-finder'a bildirir (Faz 4)
```

**Kopya modeli nasıl işler**

1. `scripts/new-site.mjs pilates svd-pilates` → `templates/pilates/` içeriğini (`media/`, `TEMPLATE.md`, `config.example.js` hariç) `sites/svd-pilates/` altına kopyalar ve `site.json` oluşturur.
2. Agent kopyadaki `config.js`'i doldurur, gerekirse HTML/CSS'te işletmeye özel küçük düzenleme yapar.
3. Template'e sonradan yapılan iyileştirmeler eski demolara yansımaz (bilinçli tercih). İstersen agent'a "svd-pilates'i template'in son haliyle güncelle" dersin.

**Ortak medya**: Template içindeki `media/` klasörü sadece bir kez deploy'a girer. Demo HTML'i buna mutlak yolla erişir: `/_t/pilates/media/hero.mp4`. `vercel.json` bu yolu `templates/pilates/media/` klasörüne bağlar (bölüm 3).

**`_shared/` parçaları** her demonun `index.html`'ine tek satırla eklenir: `<script src="/_shared/preview-badge.js" defer></script>`. Etiketin metni veya stili değişince tüm demolar tek seferde güncellenir.

**Script'ler** saf Node (`fs`, `path`), npm bağımlılığı yok. Tek istisna görsel sıkıştırma: `sharp` paketi gerekir (onaylandı).

## Domain ve Vercel

Tek Vercel projesi, tek wildcard domain kaydı. Subdomain'ler tek tek oluşturulmaz; `*.yaytechstudio.com` altındaki her isim bu projeye düşer ve `vercel.json` ismi `sites/<isim>/` klasörüne bağlar. Klasör yoksa 404.

**Kurulum adımları (bir kerelik)**

1. GitHub'da `yaytech-demos` reposunu aç (private olabilir).
2. Vercel → New Project → repo'yu bağla. Framework: *Other*, Build Command: boş, Output Directory: boş (kök).
3. Proje → Settings → Domains → `*.yaytechstudio.com` ekle. Nameserver Vercel'de olduğu için wildcard SSL otomatik çıkar.
4. Ana site projesinde yalnızca `yaytechstudio.com` ve `www.yaytechstudio.com` kalsın. Açık tanımlı subdomain'ler her zaman wildcard'dan önceliklidir, çakışma olmaz.
5. Ayrılmış isimler: `www`, `app`, `api`, `mail`, `demo` gibi isimler slug olarak kullanılmaz (`new-site.mjs` reddeder).

**`vercel.json` (taslak)**

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/_t/:tpl/media/:path*", "destination": "/templates/:tpl/media/:path*" },
    { "source": "/_shared/:path*", "destination": "/_shared/:path*" },
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "(?<slug>[a-z0-9-]+)\\.yaytechstudio\\.com" }],
      "destination": "/sites/:slug/:path*"
    }
  ],
  "headers": [
    { "source": "/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow" }] }
  ]
}
```

- Kural sırası önemli: ortak medya ve `_shared` yolları host kuralından önce gelir, yoksa onlar da `sites/<slug>/` altında aranır.
- Vercel statik dosyayı rewrite'tan önce kontrol eder. Bu yüzden **repo kökünde site dosyasıyla çakışan isim olmamalı** (`index.html`, `assets/`, `styles.css` yok). Kökte sadece `_shared/`, `templates/`, `sites/`, `404.html` ve yapılandırma dosyaları durur. Faz 1'de ilk deploy'da bu davranış doğrulanacak.
- Demolar içindeki göreli yollar (`assets/logo.webp`) aynen çalışır: `/assets/logo.webp` → `/sites/svd-pilates/assets/logo.webp`.
- `X-Robots-Tag: noindex` tüm projeye uygulanır; HTML'deki `<meta name="robots">` ikinci güvence.

**Sınırlar ve riskler**

| Konu | Durum |
| --- | --- |
| Subdomain sayısı | Pratikte sınırsız; hiçbiri tek tek kayıtlı değil. |
| Trafik | İşletme sahiplerinin açacağı sayfalar; ücretsiz kotanın çok altında. Videolar template'te tek kopya. |
| Deploy dosya sayısı | Vercel'in deploy başına dosya limiti var; demo başı \~20–40 dosya ile yüzlerce demo sorun olmaz, cleanup zaten sınırlı tutar. |
| Git repo boyutu | Asıl sınır bu. Silinen görseller geçmişte kalır. Görsel başı 200–400 KB, demo başı 2–3 MB hedef; ham görseller (`inbox/`) git'e girmez. |
| Vercel Hobby planı | Hobby'de kalınıyor. |

## Template standardı

Bir template, işletmeye özel hiçbir veriyi HTML'de tutmaz: tüm işletme verisi, metinler ve renkler `config.js`'ten gelir. Ortak şema yok, ama her template aşağıdaki kurallara uyar ve kendi sözleşmesini `TEMPLATE.md`'de yazar.

**Kurallar (her template için zorunlu)**

1. **Veri tek yerde:** `config.js` içinde `const SITE = { ... }`. JSON değil JS, çünkü dosya `file://` ile açıldığında da (lokal önizleme) `fetch` gerektirmeden çalışır. Pilates'teki mevcut yaklaşımın devamı.
2. **HTML'de işletme metni yok:** Başlık, slogan, bölüm metinleri, fotoğraf alt yazıları, `<title>`, meta description, OG etiketleri config'ten doldurulur (`data-text="hero.title"` gibi basit bağlama; kütüphane yok).
3. **Tema CSS değişkeniyle:** `SITE.theme` → `--brand`, `--accent`, `--bg`, `--ink` vb. Template'in bütün renkleri bu değişkenlerden türer; sabit hex renk yok.
4. **Boş veri = gizli bölüm:** Yorum, ekip, galeri, fiyat gibi bölümler verisi yoksa hiç render edilmez. Yer tutucu metin veya uydurma içerik asla yayına çıkmaz.
5. **İletişim her zaman çalışır:** WhatsApp, telefon ve harita linkleri config'ten üretilir; işletme sahibi butona basınca kendi numarasına gittiğini görür (etkileyici bir detay).
6. **Ortak parçalar:** `<meta name="robots" content="noindex, nofollow">` ve `/_shared/preview-badge.js` her template'in `index.html`'inde hazır bulunur.
7. **Ağır medya `media/` altında:** 3D modeller ve videolar `/_t/<template>/media/...` mutlak yoluyla kullanılır, kopyalanmaz.
8. **Mobil önce:** Linki işletme sahibi WhatsApp'tan telefonda açacak.
   - Düşük güçlü cihaz veya `prefers-reduced-motion` → 3D/video yerine poster görsel.
   - Videolar ve 3D sahne tembel yüklenir; ilk ekran görsel + metinle anında gelir.
   - Hedef: 4G'de ilk anlamlı ekran 2,5 sn altı, ilk yükleme (tembel medya hariç) 3 MB altı.
9. **Npm yok, build yok:** Gerekirse kütüphaneler (Three.js, GSAP) CDN'den veya template içine vendor edilmiş dosyadan gelir.

**`TEMPLATE.md` formatı** (agent'ın okuduğu sözleşme; her template'te aynı başlıklar):

```markdown
# Template: pilates

## Hedef
Pilates / reformer stüdyoları. Ton: sakin, premium. İmza öğe: scroll ile dönen 3D reformer.

## Config alanları
| Alan | Zorunlu | Kaynak | Not |
| business.name | evet | lead-finder | |
| business.phone / whatsapp | evet | lead-finder | whatsapp: 90 ile başlayan rakamlar |
| business.address / mapsQuery | evet | lead-finder | |
| business.instagram | hayır | lead-finder | |
| business.hours | hayır | lead-finder / sen | yoksa bölüm gizli |
| theme.* | evet | agent (logodan) | kontrast kuralı aşağıda |
| copy.hero.* , copy.beats[] | evet | agent | işletmeye özel, uydurma iddia yok |
| formats[] | hayır | sen / web sitesi | Grup, Bireysel, Double... |
| team[] | hayır | sen | fotoğrafı olmayan kişi gösterilmez |
| reviews[] | hayır | Google yorumları (gerçek) | yoksa bölüm gizli |

## Görseller
| Dosya | Zorunlu | Oran / boyut | Not |
| logo | evet | kare veya yatay, şeffaf tercih | renk paleti buradan çıkar |
| studio-1..3 | evet (en az 1) | 3:2, en az 1600px | hero ve galeri |
| team/<isim> | hayır | 4:5 | |
| og | hayır | 1200x630 | yoksa studio-1'den üretilir |

## Özelleştirme sınırları
- Serbest: metinler, tema renkleri, bölüm sırası, bir bölümü gizlemek.
- Dikkat: 3D sahnenin kamerası, scroll zaman çizelgesi (bozmak kolay).
- Yasak: uydurma yorum, ekip, rakam, sertifika, ödül.

## Renk kuralları
Metin/arka plan kontrastı en az 4.5:1. Logo rengi çok açık/doğal değilse --brand yerine --accent olarak kullan.

## Kontrol listesi (yayından önce)
- [ ] Tüm zorunlu alanlar dolu, placeholder kalmadı
- [ ] WhatsApp / telefon / harita linkleri doğru
- [ ] Görseller sıkıştırılmış, assets/ toplamı < 3 MB
- [ ] <title>, description, OG işletmeye göre
```

**Yeni template eklemek**: `templates/<sektör>/` klasörü, yukarıdaki kurallara uyan bir site, `TEMPLATE.md` ve `config.example.js`. Lead-finder'daki template listesine sektör adı eklenir (bölüm 7). Template'ler önceden, güçlü bir modelle ve dikkatle yapılır; kalite burada belirlenir.

## Site standardı

Her demo `sites/<slug>/` altında, template kopyası + doldurulmuş `config.js` + sıkıştırılmış `assets/` + bir `site.json` meta dosyasıdır.

**`site.json`** (template'ten bağımsız, her sitede aynı; cleanup ve takip bunu okur):

```json
{
  "slug": "svd-pilates",
  "template": "pilates",
  "leadId": "<lead-finder business id>",
  "businessName": "SVD Pilates Stüdyo",
  "createdAt": "2026-10-02",
  "keep": false,
  "note": ""
}
```

**Slug kuralları**

- Küçük harf, `a-z 0-9 -`, en fazla 40 karakter. Türkçe karakterler dönüştürülür (ş→s, ı→i, ğ→g, ü→u, ö→o, ç→c).
- İşletme adından türetilir, gereksiz ekler atılır: "SVD Pilates Stüdyo" → `svd-pilates`.
- Çakışma varsa ilçe eklenir: `svd-pilates-kadikoy`.
- Ayrılmış isimler reddedilir: `www`, `app`, `api`, `mail`, `demo`, `admin`, `static`.
- Lead-finder prompt'ta slug önerir; `new-site.mjs` geçerliliği ve benzersizliği kontrol eder.

**Görseller**

1. Sen ham görselleri `inbox/<slug>/` klasörüne bırakırsın (isimleri önemli değil; agent hangisinin ne olduğuna bakarak karar verir veya sana sorar).
2. `optimize-images.mjs` bunları `sites/<slug>/assets/` altına yazar:
   - Fotoğraflar: WebP, kalite \~78, en geniş kenar hero için 1920 px, diğerleri 1200 px.
   - Logo: şeffaflık varsa PNG/SVG olarak kalır, yoksa WebP.
   - EXIF silinir (konum bilgisi dahil).
   - Hedef: görsel başı 200–400 KB, `assets/` toplamı 3 MB altı.
3. `inbox/` git'e girmez, iş bitince boşaltılabilir.

**Paylaşım önizlemesi (WhatsApp kartı)**

Linki WhatsApp'ta gönderdiğinde çıkan kart, işletme sahibinin ilk gördüğü şey. Bu yüzden her demoda:

- `og:title` = işletme adı, `og:description` = tek cümle değer önerisi, `og:image` = 1200x630 işletme görseli (mutlak URL: `https://<slug>.yaytechstudio.com/assets/og.webp`).
- `noindex` WhatsApp önizlemesini engellemez; sadece arama motorlarını engeller.

**Önizleme etiketi (`_shared/preview-badge.js`)**

- Sol altta küçük, sade bir hap: "Tasarım önizlemesi · YayTech Studio", `yaytechstudio.com`'a link.
- Kapatılabilir; CTA ve WhatsApp butonunun üstüne binmez.
- Amaç: sayfanın işletmenin resmi sitesi sanılmaması ve imzanın görünmesi.

**Olmayacaklar**: Sahte yorum, uydurma ekip üyesi, işletmenin söylemediği rakam ("500+ mutlu üye"), sertifika, ödül. Veri yoksa bölüm gizli.

## Agent prosedürü

Repo kökündeki `CLAUDE.md` agent'ın iş tarifidir; `GEMINI.md` aynı içeriği gösterir ("CLAUDE.md'deki prosedürü uygula"). Böylece Claude Code ve Gemini CLI aynı kurallarla çalışır. Lead-finder'dan gelen prompt sadece veriyi ve görevi taşır; "nasıl" bilgisi repo'da durur, prompt kısa kalır.

**Prosedür adımları** (`CLAUDE.md` bu sırayla yazılır):

1. **Temizlik:** `node scripts/cleanup.mjs` çalıştır; silinen siteleri kullanıcıya listele.
2. **Hazırlık:** Prompt'taki template için `templates/<t>/TEMPLATE.md`'yi oku. Slug'ı kontrol et.
3. **Kopya:** `node scripts/new-site.mjs <template> <slug> --lead <leadId> --name "<ad>"` → `sites/<slug>/` ve `site.json` oluşur.
4. **Veri:** Prompt'taki işletme verisiyle `config.js`'i doldur (isim, telefon, WhatsApp, adres, harita, Instagram, saatler).
5. **Görsel iste:** `TEMPLATE.md`'deki görsel listesine göre kullanıcıya somut bir liste ver: "`inbox/<slug>/` klasörüne şunları koy: logo, en az 1 stüdyo fotoğrafı (3:2), varsa ekip fotoğrafları ve isimleri." Kullanıcı "tamam" diyene kadar bekle.
6. **Görseller:** `node scripts/optimize-images.mjs <slug>`. Hangi dosyanın logo, hangisinin hero olduğuna bakarak karar ver; emin değilsen sor.
7. **Tema:** Logodan palet çıkar (ana renk, vurgu, nötr). `TEMPLATE.md`'deki kontrast kuralına uy.
8. **Metin:** Hero ve bölüm metinlerini işletmeye göre yaz (konum, hizmet türleri, prompt'taki notlar). Sadece verilen bilgiye dayan, iddia uydurma.
9. **Opsiyonel özel dokunuş:** İşletmenin öne çıkan bir özelliği varsa (örn. "sadece kadınlara", "fizyoterapist eşliğinde") bunu hero'ya taşı. `TEMPLATE.md`'deki "dikkat" alanlarına dokunma.
10. **Kontrol:** `TEMPLATE.md` kontrol listesini tek tek geç; kalan placeholder, yanlış link, büyük dosya olmamalı.
11. **Yayın:** `git add sites/<slug>` (+ cleanup silmeleri) → `git commit -m "demo: <slug>"` → `git push`. (Push yetkisi: aşağıda.)
12. **Teslim:** Kullanıcıya şunları ver:
    - Demo linki: `https://<slug>.yaytechstudio.com` (Vercel deploy'u \~1 dk; linki açıp kontrol etmesini söyle).
    - WhatsApp mesajı önerisi (aşağıdaki kurallarla).
    - Kontrol linki `?me=1` ile (kendi açılışın sayılmaz); işletmeye gönderilecek link temiz. Link lead-finder'a `notify.mjs` ile kendiliğinden yazılır.

**Push yetkisi**: Agent commit'i hazırlar, değişen dosyaların özetini gösterir ve push için **her seferinde onay ister**. `sites/` dışında bir dosyaya (`templates/`, `_shared/`, `scripts/`, `vercel.json`) dokunduysa bunu ayrıca belirtir.

**WhatsApp mesajı kuralları**

- 3–5 cümle, "siz" hitabı, samimi ama profesyonel. Spam kokusu yok: büyük harf, ünlem yığını, "kampanya" dili yok.
- İşletmeye özel bir detay içerir (konum, gördüğümüz bir özellik, mevcut sitelerinin durumu: "sitenizin olmadığını gördüm" / "mevcut siteniz mobilde zor açılıyor").
- Neden yazıldığını söyler: sizin için bir önizleme hazırladım, bakın.
- Baskısız kapanış: "Beğenirseniz konuşalım, beğenmezseniz kaldırırım." Bu cümle aynı zamanda izin/görsel kaygısını da karşılar.
- Fiyat vermez (fiyat konuşmada).
- İki versiyon önerir: kısa ve biraz daha detaylı; sen seçersin.

**Agent seçimi**: Claude Code veya Gemini CLI, ikisi de aboneliğinle çalışır. Bu iş dar ve tarif edilmiş olduğu için hızlı model (Gemini Flash / Sonnet) yeterli. Template üretimi ve template düzeltmeleri ise güçlü bir modelle yapılır.

## Lead-finder entegrasyonu

Lead-finder site üretmez; lead sayfasında tek tıkla kopyalanan bir prompt üretir ve demo linkini/durumunu saklar. Faz 3'te değişiklik küçük: bir migration, bir veri dosyası, bir kart bileşeni, bir server action.

**1. Veritabanı (`supabase/migrations/20261001000000_add_demo_fields.sql`)**

`businesses` tablosuna kolonlar (lead başına tek aktif demo yeterli; ayrı tablo gereksiz):

| Kolon | Tip | Ne için |
| --- | --- | --- |
| `demo_template` | text | Hangi template kullanıldı |
| `demo_slug` | text | Subdomain adı |
| `demo_url` | text | Tam link |
| `demo_created_at` | timestamptz | Demo ne zaman yapıldı (30 gün sayımı için de görünür) |
| `demo_sent_at` | timestamptz | İşletmeye ne zaman gönderildi |
| `demo_view_count` | int, default 0 | Faz 4: kaç kez açıldı |
| `demo_last_viewed_at` | timestamptz | Faz 4: son açılış |

**2. Template listesi (`src/data/demo-templates.ts`)**

Sabit bir dizi: `{ id: "pilates", label: "Pilates stüdyosu", categories: ["pilates", "yoga", "reformer"] }`. Lead'in `category` alanı eşleşirse template otomatik seçili gelir. Yeni template eklenince buraya bir satır eklenir.

**3. Lead detay sayfasına "Demo" kartı (`src/app/leads/[id]/demo-card.tsx`)**

- Template seçimi (kategoriye göre önceden seçili).
- Slug alanı (isimden otomatik, düzenlenebilir).
- **"Prompt'u kopyala"** butonu → aşağıdaki şablonu lead verisiyle doldurup panoya kopyalar.
- Demo linki alanı + kaydet (agent'ın verdiği link yapıştırılır).
- **"Gönderildi"** butonu → `demo_sent_at` yazar; CRM'de aktivite kaydı varsa oraya da düşer.
- Durum satırı: "Oluşturuldu 2 Eki · Gönderildi 2 Eki · 3 kez açıldı, son 10 dk önce · 28 gün sonra silinir".
- Kaydetme işlemleri `src/app/leads/actions.ts` içine tek bir server action (`saveDemo`) olarak eklenir.

**4. Prompt şablonu**

Prompt kısa tutulur; "nasıl" bilgisi demos repo'sunun `CLAUDE.md`'sinde. Boş alanlar prompt'a hiç yazılmaz.

```text
Yeni demo: pilates template'i, slug: svd-pilates
CLAUDE.md'deki demo prosedürünü uygula.

İşletme (lead-finder, leadId: 8f3c…):
- Ad: SVD Pilates Stüdyo
- Kategori: Pilates stüdyosu
- Telefon: 0545 344 55 83 (WhatsApp: 905453445583)
- Adres: Evinpark Çarşı, Fikirtepe, Mandira Cd. No:189, Kadıköy / İstanbul
- Google Maps: https://maps.google.com/?cid=…
- Instagram: @svdpilatesstudio
- Mevcut web sitesi: yok
- Google puanı: 4.9 (87 yorum)

Satış açısı (mesaj için): web sitesi yok; Instagram aktif.
Notlar: <lead'deki CRM notları, varsa>
```

"Satış açısı" satırı lead-finder'ın mevcut website analizinden ve skor gerekçelerinden otomatik üretilir (site yok / mobilde kötü / SSL yok vb.). Agent WhatsApp mesajını buna dayandırır.

**5. Faz 4 eklemeleri**

- **Görüntülenme takibi:** `src/app/api/demo-view/route.ts`, `{ slug }` alır, `demo_view_count`'u artırır ve `demo_last_viewed_at`'i yazar. CORS sadece `*.yaytechstudio.com`.
  - `_shared/preview.js` (reklam engelleyiciler `track.js` adını engellediği için bu isim) açılışta, sekme gizlenince (süre + kaydırma) ve WhatsApp / arama / harita / Instagram tıklamasında `sendBeacon` ile ping atar. WhatsApp'ın link önizleme botu JS çalıştırmadığı için sayılmaz.
  - Kayıtlar `demo_views` tablosunda: şehir/ülke (Vercel IP başlıkları), cihaz, işletim sistemi, tarayıcı, tekil ziyaretçi (tarayıcıdaki rastgele kimlik; ham IP saklanmaz). Bir trigger `demo_view_count` ve `demo_last_viewed_at`'i günceller.
  - Kendi açılışların sayılmasın: herhangi bir demoyu bir kez `?me=1` ile açınca `.yaytechstudio.com` çerezi yazılır, o tarayıcıdan hiçbir demo sayılmaz (`?me=0` geri alır). Lead-finder'daki demo linki zaten `?me=1` ile açılır.
- **Agent'ın linki kendisi yazması:** `POST /api/demos` (Bearer token, `DEMOS_API_TOKEN` env). Agent push'tan sonra `{ leadId, slug, url, template }` gönderir; elle yapıştırma adımı kalkar. Cleanup silince aynı endpoint'e silindi bilgisi gider.

## Temizlik ve yaşam döngüsü

Bir demo 30 gün yaşar; `keep: true` işaretlenmedikçe bir sonraki demo üretiminde otomatik silinir. Cron veya ek altyapı yok.

| Durum | Nasıl anlaşılır | Ne olur |
| --- | --- | --- |
| Aktif | `createdAt` 30 günden yeni | Yayında |
| Tutuluyor | `site.json`'da `keep: true` | Süresiz yayında (ilgilenen, görüşme süren işletme) |
| Süresi dolmuş | 30 günü geçmiş, `keep` yok | Sonraki `cleanup.mjs` çalışmasında silinir |
| Silinmiş | Klasör yok | Link `404.html` gösterir: "Bu önizleme artık yayında değil · yaytechstudio.com" |
| Satıldı | Sen karar verirsin | Gerçek siteye taşınır (aşağıda) |

**`scripts/cleanup.mjs`**

1. `sites/*/site.json` dosyalarını okur.
2. `keep` olmayan ve `createdAt` üzerinden 30 gün geçen klasörleri siler.
3. Silinenleri ekrana listeler; agent bunları yeni demonun commit'ine dahil eder.
4. `--dry-run` ile sadece listeler, silmez. Süre `--days 45` ile değiştirilebilir.

**Elle işlemler (agent'a tek cümleyle)**

- "svd-pilates'i tut" → `keep: true`, commit + push.
- "svd-pilates'i hemen kaldır" → klasör silinir, push. İşletme "görsellerimi kaldırın" derse aynı gün yapılır.
- "svd-pilates'i template'in son haliyle yenile" → template yeniden kopyalanır, `config.js` ve `assets/` korunur.

**Git geçmişi**: Silinen görseller yayından kalkar ama git geçmişinde kalır. Repo private olduğu için bu yayın sayılmaz. Nadiren geçmişten de silmek gerekirse `git filter-repo` ile yapılır; rutin değil.

**Satış olursa**

1. `sites/<slug>/` klasörü yeni bir repo'ya (örn. `client-svd-pilates`) kopyalanır; gerçek site buradan gelişir.
2. Önizleme etiketi, `noindex` ve takip script'i kaldırılır; `/_t/...` ortak medya yolları sitenin kendi dosyalarına çevrilir.
3. Müşterinin kendi domain'i bağlanır (ayrı Vercel projesi).
4. Demo, geçiş bitene kadar `keep: true` kalır, sonra silinir.
5. Lead-finder'da lead "kazanıldı" aşamasına alınır.

## Uçtan uca akış

Görseller elindeyse bir demo 5–10 dakika sürer; agent'ın kısmı 2–3 dakika, gerisi görsel toplamak ve kontrol.

&#91;embedded content: uçtan uca demo akışı · 10 adım, 4'ü senin\]

Senin dokunduğun adımlar 1, 2, 5 ve 9; aradaki her şey repo'daki prosedürle agent'ta. 10. adım Faz 4 ile gelir.

## Fazlar ve yapılacaklar

Faz 1 ve 2 tamamlandığında sistem lead-finder olmadan da çalışır (prompt elle yazılır). Faz 3 hız kazandırır, Faz 4 satış sinyali ekler. Her faz ayrı onayla başlar.

**Faz 1 — Repo iskeleti ve yayın altyapısı**

- [x] `C:\PROJECTS\WebProject\yaytech-demos` klasörü, `git init`, GitHub'da yunus103/yaytech-demos (private)
- [x] `vercel.json`, `.vercelignore`, `.gitignore` (`inbox/`), `404.html`
- [x] `_shared/preview-badge.js`
- [x] `scripts/new-site.mjs` (kopya + `site.json` + slug doğrulama) ve `scripts/cleanup.mjs` (`--dry-run`, `--days`)
- [x] Vercel projesi + `*.yaytechstudio.com` domain'i (senin tarafında, dashboard'dan)
- [x] Doğrulama: `sites/test/` → `test.yaytechstudio.com` açılıyor; `/_t/...` ve `/_shared/...` yolları çalışıyor; kök dosya önceliği sorun çıkarmıyor; `X-Robots-Tag` başlığı geliyor

**Faz 2 — Pilates template'i ve agent prosedürü**

- [x] `pilates/` → `templates/pilates/` kopyası (orijinal klasöre dokunulmaz)
- [x] `index.html`'deki SVD'ye özel metinleri (beat'ler, fotoğraf alt yazısı, `<title>`, meta, OG) config'e taşı
- [x] Renkleri CSS değişkenlerine bağla, `SITE.theme` ekle
- [x] Ağır medyayı `media/` altına al, `/_t/pilates/media/...` yollarına çevir
- [x] Mobil yedek: düşük güçlü cihaz ve `prefers-reduced-motion` için 3D reformer yerine poster
- [x] Robots meta + preview badge script'i
- [x] `TEMPLATE.md` ve `config.example.js`
- [x] `scripts/optimize-images.mjs` (sharp ile)
- [x] `CLAUDE.md` + `GEMINI.md` prosedürü (bölüm 6)
- [x] Prova: SVD Pilates'i sıfırdan prosedürle `sites/svd-pilates/` olarak üret, süreyi ölç, takılan adımları düzelt

**Faz 3 — Lead-finder entegrasyonu**

- [x] Migration: `demo_*` kolonları
- [x] `src/data/demo-templates.ts`
- [x] Prompt oluşturucu (satış açısı website analizinden; saatler ve yorumlar Google Place Details'tan anlık)
- [x] `demo-card.tsx` + `saveDemo` server action
- [x] `Business` tipine yeni alanlar

**Faz 4 — Takip ve otomasyon**

- [x] `/api/demo-view` + `_shared/preview.js` (kendi açılışlarını hariç tutma)
- [x] `/api/demos` (token'lı) → agent linki kendisi yazar, cleanup silmeleri lead-finder'a yansır
- [x] Lead listesinde "demo açıldı" sıralaması / filtresi

**Faz 5 — Yeni sektörler (sürekli)**

Ertelenen fikir: demo açıldığı anda telefona anlık bildirim (ntfy.sh, `/api/demo-view` içinde tek `fetch`).

- [ ] Lead-finder'da "site yok / kötü" skoru en yüksek sektörleri çıkar; sıradaki template'leri buna göre seç
- [ ] Her yeni template bölüm 4'teki kurallarla, güçlü bir modelle

**Kararlar (açık sorular cevaplandı)**

1. **Görsel sıkıştırma:** `sharp` eklenecek (sadece demos repo'sunda, script için).
2. **Push:** Her zaman push öncesi kullanıcı onayı.
3. **Vercel planı:** Hobby'de kalınıyor.
4. **Demo ömrü:** 30 gün.
5. **Önizleme etiketi:** "Tasarım önizlemesi · YayTech Studio".
6. **Repo:** `yunus103/yaytech-demos` (private).
7. **Çalışma düzeni:** Faz 1–2 yeni repoda ayrı bir oturumda yapılır; lead-finder değişiklikleri (Faz 3–4) sırası gelince lead-finder reposunda yapılır.
