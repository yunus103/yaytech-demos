/* Annotated example: the original SVD Pilates demo this template was built from.
   Use it as a reference for tone and structure only. Never copy its data into another site. */
const SITE = {
  business: {
    name: "SVD Pilates Stüdyo",                  // full name, used in footer, messages, alt texts
    shortName: "SVD",                            // next to the logo in the nav; keep it short (≤ 12 chars)
    phone: "0545 344 55 83",                     // shown as-is; the tel: link is derived from it
    whatsapp: "905453445583",                    // digits only, starting with 90
    address: "Evinpark Çarşı, Fikirtepe, Mandıra Cd. No:189, 34744 Kadıköy / İstanbul",
    mapsQuery: "SVD Pilates Studio Evinpark Çarşı Fikirtepe",   // what "Yol tarifi" searches on Google Maps
    instagram: "svdpilatesstudio",               // without @; "" hides the row
    rating: 5.0                                  // Google rating; null hides the stars
  },
  // Monday first; [open, close] in whole hours, null = closed that day. hours: null when unknown.
  hours: [[8, 22], [8, 22], [8, 22], [8, 22], [8, 22], [8, 22], [8, 22]],
  hoursText: "Her gün 08:00 – 22:00",            // display text; "" hides the row
  theme: {
    bg: "#FBF6F1",        // page background (light)
    surface: "#EBD6C8",   // hero, cards, team tiles; usually the logo's background colour
    accent: "#A9644A",    // buttons, highlights
    onAccent: "#FFFFFF",  // text on accent buttons
    ink: "#33211C"        // text and the dark sections (quiz, contact)
  },
  formats: ["Grup", "Bireysel", "Double"],      // any of these three; the first is the default
  programs: ["prenatal", "back", "neck", "injury"],   // special programs the studio really offers
  images: {
    logo: "assets/logo.webp",
    logoAlt: "SVD Pilates Stüdyo logosu",
    studio: "assets/studio.webp",               // landscape, desktop
    studioMobile: "assets/studio-m.webp",       // portrait crop for phones; "" uses studio
    studioAlt: "SVD Pilates stüdyosunda sıralanmış ahşap reformerlar ve kemerli aynalar"
  },
  copy: {
    beats: [
      { title: "Güçlen. Sıkılaş. Doğru hareket et.", text: "Fikirtepe'de, Sevda Hoca ve ekibiyle reformer, cadillac ve chair üzerinde grup, bireysel ve double pilates." },
      { title: "Her yay, farklı bir direnç.", text: "Kırmızı en ağır, sarı en hafif. Aşağıdaki yaylarla direnci değiştirip taşıyıcıyı çektiğinde fark hemen hissediliyor. Derste bu ayarı eğitmenin yapar." },
      { title: "Az tekrar, doğru tekrar.", text: "Küçük gruplarda ve birebir derslerde her hareket kontrol altında. Acele yok, ezber yok." }
    ],
    photo: { title: "Aynı reformerlar, gerçek hâliyle.", text: "Evinpark Çarşı'da ferah, aydınlık bir stüdyo. Kemerli aynalar, ahşap aletler ve her gün 08:00'den 22:00'ye açık kapılar." },
    team: { title: "Sevda Hoca ve ekibi.", text: "Yayını, tekrarını ve temponu sana göre ayarlayan eğitmenler." }
  },
  // Members without a photo are not rendered; no members with photos = section hidden.
  team: [
    { name: "Sevda Ulusinan", role: "Kurucu, pilates eğitmeni ve hareket uzmanı", photo: "assets/team/sevda.webp" },
    { name: "Hayrunisa Erdoğan", role: "Pilates eğitmeni ve hareket uzmanı", photo: "assets/team/nisa.webp" },
    { name: "Elif Demirata", role: "Pilates eğitmeni ve hareket uzmanı", photo: "assets/team/elif.webp" }
  ],
  // Real Google reviews only, shortened without changing their meaning. [] hides the section.
  reviews: [
    { who: "Sena", text: "Şu an 20 dersi tamamladım ve kendimde gözle görülür bir fark hissediyorum." },
    { who: "Zeynep B.", text: "Bu güzel yer şimdi annem için de şifa oldu. Skolyoz kaynaklı sırt ağrıları belirgin şekilde azaldı." },
    { who: "Cansel A.", text: "Henüz 10 ders almama rağmen gözle görülür bir fark var vücudumda. Keşke daha önceden başlasaymışım." },
    { who: "İdil", text: "Kendinizi güvende hissedeceğiniz, bir dersin nasıl geçtiğini anlamayacağınız bir stüdyo." },
    { who: "Tuğba Ç.", text: "Hareketleri doğru ve güvenli şekilde yaptırmaya özen gösteriyor, bireysel ihtiyaçlara göre ilgileniyor." },
    { who: "Bilal B.", text: "Temiz, ferah ve çok özenle hazırlanmış bir stüdyo. Sevda Hoca gerçekten işini biliyor." }
  ]
};
