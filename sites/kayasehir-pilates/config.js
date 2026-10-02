/* Business data for this site. Field reference and an annotated example: TEMPLATE.md and config.example.js.
   Every "__…__" value is a placeholder that must be replaced before publishing. */
const SITE = {
  business: {
    name: "Kayaşehir Pilates Studio",
    shortName: "Kayaşehir",
    phone: "0552 229 92 13",
    whatsapp: "905522299213",
    address: "Kayabaşı Mah. Kuzey Yakası Ofis B3 No: 19 Kat: 2, Başakşehir / İstanbul",
    mapsQuery: "Fizyopilates Kayaşehir",
    instagram: "kayasehirpilatesstudio",
    rating: 5.0
  },
  // Monday first; [open, close] in whole hours, null = closed.
  hours: [[9, 20], [9, 20], [9, 20], [9, 20], [9, 20], [9, 20], null],
  hoursText: "Pazartesi – Cumartesi 08:30 – 20:30, Pazar kapalı",
  theme: {
    bg: "#FAF5F5",
    surface: "#EED9DA",
    accent: "#96484E",
    onAccent: "#FFFFFF",
    ink: "#2E191C"
  },
  formats: ["Bireysel", "Double", "Grup"],
  programs: ["prenatal", "back", "neck", "injury"],
  images: {
    logo: "assets/logo.png",
    logoAlt: "Kayaşehir Pilates Studio logosu",
    studio: "assets/studio.webp",
    studioMobile: "assets/studio-m.webp",
    studioAlt: "Kayaşehir Pilates stüdyosunda ahşap reformerlar, kemerli aynalar ve ferah salon"
  },
  copy: {
    beats: [
      { title: "Kadınlara özel. Fizyoterapist eşliğinde.", text: "Kayaşehir Kuzey Yakası'nda, fizyoterapist eşliğinde kadınlara özel reformer, mat ve hamile pilatesi." },
      { title: "Her yay, farklı bir direnç.", text: "Kırmızı en ağır, sarı en hafif. Aşağıdaki yaylarla direnci değiştirip taşıyıcıyı çektiğinde fark hemen hissediliyor. Derste bu ayarı eğitmenin yapar." },
      { title: "Kişiye özel, bilinçli egzersiz.", text: "Bireysel, duo ve küçük gruplarda her hareket kontrol altında. Ezber yok, omurga ve bel sağlığına odaklı yaklaşım var." }
    ],
    photo: { title: "Ferah, sakin ve sana özel bir alan.", text: "Kuzey Yakası Ofis B3'te gün ışığı alan aydınlık bir stüdyo. Kemerli aynalar, ahşap reformerlar ve haftanın altı günü randevulu dersler." },
    team: { title: "", text: "" }
  },
  team: [],
  reviews: [
    { who: "Hatice T.", text: "Temiz, sakin, samimi bir ortam ve birebir ilgi. Kübra hocamla dersler ayrı bir keyifle geçiyor, zamanın nasıl geçtiğini anlamıyorsunuz." },
    { who: "Selma Y.", text: "İlgi ve alakanız çok güzel. Her şeyden önce bel ve sırt ağrılarım azaldı, kısa sürede etkisini hissettim." },
    { who: "Merve", text: "İyi bir pilates deneyimi yaşamak isteyenlere tavsiye olunur. Ferah, temiz ve hijyenik bir pilates salonu." },
    { who: "Pelda G.", text: "Günün yorgunluğunu attığım sıcak ve samimi bir ortam, iyi ki sizinle yollarımız kesişti." }
  ]
};
