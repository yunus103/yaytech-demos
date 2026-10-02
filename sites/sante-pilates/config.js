/* Business data for this site. Field reference and an annotated example: TEMPLATE.md and config.example.js.
   Every "__…__" value is a placeholder that must be replaced before publishing. */
const SITE = {
  business: {
    name: "Sante Pilates",
    shortName: "Sante",
    phone: "0530 201 58 88",
    whatsapp: "905302015888",
    address: "Steel Gyo Rezidans, Arnavutköy Merkez, Yenibayır Sk. No:25, Arnavutköy / İstanbul",
    mapsQuery: "Sante Pilates Steel Gyo Rezidans Arnavutköy",
    instagram: "seldasante_pilatess",
    rating: 5.0
  },
  // Monday first; [open, close] in whole hours, null = closed. Set hours: null when unknown.
  hours: [[9, 22], [9, 22], [9, 22], [9, 22], [9, 22], [9, 22], [9, 22]],
  hoursText: "Her gün 09:00 – 22:00",
  theme: {
    bg: "#F5F8F8",
    surface: "#DCE6E7",
    accent: "#395F67",
    onAccent: "#FFFFFF",
    ink: "#1A272A"
  },
  formats: ["Grup", "Bireysel", "Double"],
  programs: ["prenatal"],
  images: {
    logo: "assets/logo.png",
    logoAlt: "Sante Pilates logosu",
    studio: "assets/studio.webp",
    studioMobile: "assets/studio-m.webp",
    studioAlt: "Sante Pilates stüdyosunda ahşap reformerlar, ışıklı kemerli aynalar ve ferah salon"
  },
  copy: {
    beats: [
      { title: "Kadınlara özel. Güçlen, yenilen, dengede kal.", text: "Arnavutköy Merkez'de, Steel Gyo Rezidans'ta kadınlara özel reformer, cadillac ve hamile pilatesi." },
      { title: "Her yay, farklı bir direnç.", text: "Kırmızı en ağır, sarı en hafif. Aşağıdaki yaylarla direnci değiştirip taşıyıcıyı çektiğinde fark hemen hissediliyor. Derste bu ayarı eğitmenin yapar." },
      { title: "Bilinçli egzersiz, birebir özen.", text: "Grup, düet ve bireysel derslerde hareketleri doğru formda yapman için yakın ilgi ve sakin bir stüdyo ortamı." }
    ],
    photo: { title: "Aydınlık, ferah ve sana özel bir stüdyo.", text: "Steel Gyo Rezidans'ta kemerli aynalar, ahşap reformerlar ve haftanın her günü 09:00'dan 22:00'ye açık randevulu dersler." },
    team: { title: "", text: "" }
  },
  team: [],
  reviews: [
    { who: "Burcu G.", text: "Konumunun ulaşılabilir olması ve eğitmenlerinin profesyonel olması harika. Güler yüzlü eğitmenlerle dersler çok keyifli ve verimli geçiyor." },
    { who: "Naciye A.", text: "Ekipmanından tutun hocanın ince ilgisine kadar her şey çok özenli ve profesyonel. Sonunda düzenli devam edebileceğim salonu buldum." },
    { who: "Gültaç A.", text: "Tertemiz çok güzel bir yer, hocaları da çok ilgili. Çok memnun kaldım, herkese tavsiye ederim." }
  ]
};
