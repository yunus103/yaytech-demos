// Site data. Prices are from the in-store menu boards (Oct 2026).
// `foto` is a slug under /img/ rendered as img/<slug>-<320|640|1200>.webp (all square).
// Photo sets are pixel-aligned: every `menu-*` and `tava-*` shot shares the same top-down
// layout (kraft paper, ayran top-left, halka tatlı top-right, çiğ köfte plate right);
// every `durum-*` / `han-*` shot shares the same 3/4 kraft-paper framing.

const ISLETME = {
  ad: 'Dürümcü Han',
  semt: 'Şirinevler',
  adres: 'Mahmutbey Cd. No:82A, Şirinevler, Bahçelievler / İstanbul',
  telefon: '0554 562 44 57',
  telLink: 'tel:+905545624457',
  instagram: 'https://www.instagram.com/durumcu_han',
  yolTarifi: 'https://www.google.com/maps/dir/?api=1&destination=D%C3%BCr%C3%BCmc%C3%BC+Han%2C+Mahmutbey+Cd.+No%3A82A%2C+Bah%C3%A7elievler%2C+%C4%B0stanbul',
  haritaEmbed: 'https://maps.google.com/maps?q=D%C3%BCr%C3%BCmc%C3%BC+Han+Mahmutbey+Cd.+No:82A+Bah%C3%A7elievler&z=15&output=embed',
  // Europe/Istanbul; closing is after midnight.
  saatler: { acilis: 11, kapanis: 2, metin: 'Her gün 11:00 – 02:00' },
};

const MENU = [
  {
    id: 'durumler', ad: 'Dürümler', kapak: 'durum-kuzu-sis',
    gruplar: [
      {
        ad: 'Ekonomik dürümler',
        urunler: [
          { id: 'durum-tavuk-100', ad: 'Tavuk Dürüm', gram: '100 gr', fiyat: 125 },
          { id: 'durum-adana-90', ad: 'Adana Dürüm', gram: '90 gr', fiyat: 225 },
          { id: 'durum-urfa-90', ad: 'Urfa Dürüm', gram: '90 gr', fiyat: 225 },
        ],
      },
      {
        ad: 'Dürümler',
        urunler: [
          { id: 'durum-tavuk', ad: 'Tavuk Dürüm', gram: '120 gr', fiyat: 149 },
          { id: 'durum-ciger-kavurma', ad: 'Ciğer Kavurma Dürüm', gram: '120 gr', fiyat: 149, foto: 'durum-ciger-kavurma' },
          { id: 'durum-adana', ad: 'Adana Dürüm', gram: '120 gr', fiyat: 249 },
          { id: 'durum-urfa', ad: 'Urfa Dürüm', gram: '120 gr', fiyat: 249 },
          { id: 'durum-sucuk', ad: 'Sucuk Dürüm', gram: '120 gr', fiyat: 249 },
          { id: 'durum-kanat', ad: 'Kanat Dürüm', gram: '280 gr', fiyat: 229, foto: 'durum-kanat' },
          { id: 'durum-ciger-sis', ad: 'Ciğer Şiş Dürüm', gram: '120 gr', fiyat: 369, foto: 'durum-ciger-sis' },
          { id: 'durum-kuzu-sis', ad: 'Kuzu Şiş Dürüm', gram: '120 gr', fiyat: 369, foto: 'durum-kuzu-sis' },
        ],
      },
      {
        ad: 'Han dürümler', not: 'Özel soslu, patates kızartmalı',
        urunler: [
          // In-store price not on the boards yet
          { id: 'han-kebap', ad: 'Han Kebap Dürüm', gram: '90 gr', fiyat: null, foto: 'han-kebap-durum' },
          { id: 'han-tavuk', ad: 'Han Tavuk Dürüm', gram: '90 gr', fiyat: null, foto: 'han-tavuk-durum' },
        ],
      },
    ],
  },
  {
    id: 'menuler', ad: 'Menüler', kapak: 'menu-adana',
    gruplar: [
      {
        not: 'Çiğ köfte, halka tatlı ve ayran dahil',
        urunler: [
          { id: 'menu-tavuk-sis', ad: 'Tavuk Şiş Menü', fiyat: 199, foto: 'menu-tavuk-sis' },
          { id: 'menu-ciger-kavurma', ad: 'Ciğer Kavurma Menü', fiyat: 199, foto: 'menu-ciger-kavurma' },
          { id: 'menu-adana', ad: 'Adana Menü', fiyat: 349, foto: 'menu-adana' },
          { id: 'menu-urfa', ad: 'Urfa Menü', fiyat: 349, foto: 'menu-urfa' },
          { id: 'menu-sucuk', ad: 'Sucuk Menü', fiyat: 349, foto: 'menu-sucuk' },
          { id: 'menu-ciger-sis', ad: 'Ciğer Şiş Menü', fiyat: 349, foto: 'menu-ciger-sis' },
          { id: 'menu-kanat', ad: 'Kanat Menü', fiyat: 349, foto: 'menu-kanat' },
          { id: 'menu-kuzu-sis', ad: 'Kuzu Şiş Menü', fiyat: 469, foto: 'menu-kuzu-sis' },
        ],
      },
    ],
  },
  {
    id: 'tavalar', ad: 'Tavalar', kapak: 'tava-kilis',
    gruplar: [
      {
        not: 'Çiğ köfte, halka tatlı ve ayran dahil',
        urunler: [
          { id: 'tava-urfa', ad: 'Urfa Tava Menü', fiyat: 469, foto: 'tava-urfa' },
          { id: 'tava-adana', ad: 'Adana Tava Menü', fiyat: 469, foto: 'tava-adana' },
          { id: 'tava-kilis', ad: 'Kilis Tava Menü', fiyat: 469, foto: 'tava-kilis' },
        ],
      },
    ],
  },
  {
    id: 'iki-kisilik', ad: '2 kişilik menüler', kapak: '2li-adana',
    gruplar: [
      {
        not: '2 adet 90 gr dürüm, 2 halka tatlı, çiğ köfte, 1 litre içecek',
        urunler: [
          { id: '2li-urfa', ad: "2'li Urfa", fiyat: 649, foto: '2li-urfa' },
          { id: '2li-adana', ad: "2'li Adana", fiyat: 649, foto: '2li-adana' },
          { id: '2li-tavuk', ad: "2'li Tavuk", fiyat: 649, foto: '2li-tavuk' },
        ],
      },
    ],
  },
  {
    id: 'porsiyon', ad: 'Porsiyon ızgaralar', kapak: null,
    gruplar: [
      {
        not: 'Meyhane pilavı, köz biber ve garnitür ile',
        urunler: [
          { id: 'porsiyon-tavuk-sis', ad: 'Tavuk Şiş', gram: '200 gr', fiyat: 299 },
          { id: 'porsiyon-adana', ad: 'Adana Kebap', gram: '180 gr', fiyat: 499 },
          { id: 'porsiyon-urfa', ad: 'Urfa Kebap', gram: '180 gr', fiyat: 499 },
          { id: 'porsiyon-sucuk', ad: 'Sucuk Kebap', gram: '180 gr', fiyat: 499 },
          { id: 'porsiyon-karisik', ad: 'Karışık Izgara', fiyat: 500 },
          { id: 'porsiyon-ciger-sis', ad: 'Ciğer Şiş', gram: '180 gr', fiyat: 469 },
          { id: 'porsiyon-kanat', ad: 'Kanat', gram: '480 gr', fiyat: 520 },
          { id: 'porsiyon-kuzu-sis', ad: 'Kuzu Şiş', gram: '180 gr', fiyat: 699 },
          { id: 'porsiyon-kanat-kg', ad: 'Kanat', gram: '1 kg', fiyat: 650 },
          { id: 'porsiyon-karisik-2', ad: '2 Kişilik Karışık Izgara', fiyat: 900 },
        ],
      },
    ],
  },
  {
    id: 'yan', ad: 'Yan ürünler ve içecekler', kapak: 'corba', liste: true,
    gruplar: [
      {
        urunler: [
          { id: 'corba', ad: 'Çorba', fiyat: 99, foto: 'corba' },
          { id: 'az-corba', ad: 'Az çorba', fiyat: 75 },
          { id: 'menuye-corba', ad: 'Menüye ek çorba', fiyat: 75 },
          { id: 'cig-kofte', ad: 'Çiğ köfte', fiyat: 120 },
          { id: 'halka-tatli', ad: 'Halka tatlı', fiyat: 40 },
          { id: 'ayran', ad: 'Ayran (açık / kapalı)', fiyat: 45 },
          { id: 'kutu-icecek', ad: 'Kutu içecek', fiyat: 75 },
          { id: 'litre-icecek', ad: '1 litre içecek', fiyat: 120 },
          { id: 'su', ad: 'Su', fiyat: 25 },
          { id: 'soda', ad: 'Soda', fiyat: 30 },
          { id: 'ilk-cay', ad: 'İlk çay', fiyat: 0 },
          { id: 'sonraki-cay', ad: 'Sonraki çay', fiyat: 20 },
        ],
      },
    ],
  },
];

function fiyatYaz(fiyat) {
  if (fiyat === null) return 'Sorunuz';
  if (fiyat === 0) return 'İkram';
  return `${fiyat}₺`;
}

// Paths are relative to final/index.html.
function fotoYolu(slug, w = 640, kok = '') {
  return `${kok}img/${slug}-${w}.webp`;
}

function acikMi(simdi = new Date()) {
  const saat = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h23' }).format(simdi));
  return saat >= ISLETME.saatler.acilis || saat < ISLETME.saatler.kapanis;
}
