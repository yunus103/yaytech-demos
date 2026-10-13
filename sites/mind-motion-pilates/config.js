/* Business data for this site. Field reference and an annotated example: TEMPLATE.md and config.example.js.
   Every "__…__" value is a placeholder that must be replaced before publishing. */
const SITE = {
  business: {
    name: "Mind Motion Pilates Studio",
    shortName: "Mind Motion",
    phone: "0531 267 07 53",
    whatsapp: "905312670753",
    address: "İçerenköy, Karslı Ahmet Cd. no81, 34752 Ataşehir / İstanbul",
    mapsQuery: "Mind Motion Pilates Studio İçerenköy Ataşehir",
    instagram: "mindmotionpilates",
    rating: 5.0
  },
  // Monday first; [open, close] in whole hours, null = closed. Set hours: null when unknown.
  hours: [[9, 21], [9, 21], [9, 21], [9, 21], [9, 21], null, null],
  hoursText: "Hafta içi 09:00 – 21:00, Hafta sonu kapalı",
  theme: {
    bg: "#FAF7F2",
    surface: "#ECE5DC",
    accent: "#4B5542",
    onAccent: "#FFFFFF",
    ink: "#27231F"
  },
  formats: ["Bireysel", "Grup", "Double"],
  programs: [],
  images: {
    logo: "assets/logo.webp",
    logoAlt: "Mind Motion Pilates Studio logosu",
    studio: "assets/studio.webp",
    studioMobile: "assets/studio-m.webp",
    studioAlt: "Mind Motion Pilates stüdyosunda ahşap reformerlar, kemerli ışıklı aynalar ve aydınlık ferah salon"
  },
  copy: {
    beats: [
      { title: "Hareketin gücünü keşfet, dengeni yakala.", text: "Ataşehir İçerenköy'de bireysel ve grup reformer seanslarıyla bedenine ve zihnine iyi gelen bir alan." },
      { title: "Her yay, farklı bir direnç.", text: "Kırmızı en ağır, sarı en hafif. Aşağıdaki yaylarla direnci değiştirip taşıyıcıyı çektiğinde fark hemen hissediliyor. Derste bu ayarı eğitmenin yapar." },
      { title: "Disiplinli egzersiz, yüksek enerji.", text: "Bireysel, düet ve grup derslerinde doğru form, akıcı tempo ve her derste motivasyonunu artıran birebir ilgi." }
    ],
    photo: { title: "Güneş alan, ferah ve huzurlu bir stüdyo.", text: "İçerenköy Karslı Ahmet Caddesi'nde doğal ışık alan ahşap reformerlar, ışıklı kemerli aynalar ve hafta içi 09:00'dan 21:00'e randevulu seanslar." },
    team: { title: "", text: "" }
  },
  team: [],
  reviews: [
    { who: "Gizem Y.", text: "Açıldığı ilk günden beri derslere geliyorum. Disiplinli, akıcı ve çok eğlenceli geçiyor. Salonun temizliği ve hocaların ilgisi harika." },
    { who: "Şebnem D.", text: "Güler yüzü, kalbinin sıcaklığı ve asıl derslerdeki disiplini, haftalık farklı ders programları için çok teşekkür ederim." },
    { who: "Zehra Ö.", text: "Hazırlanan dersler hem çok keyifli hem de gerçekten verimli. Spor yaparken vücudumdaki değişimi hissedebiliyorum. Salon ferah ve tertemiz." },
    { who: "Merve U.", text: "Hem bedenime hem ruhuma çok iyi gelen bir yer. Enerjisi ve ilgisi sayesinde dersler çok keyifli. Salon da çok ferah, temiz ve huzurlu." },
    { who: "Eda E.", text: "Devam etmekten büyük keyif aldığım tatlış bir stüdyo. Eğlendirirken çalıştırıp forma sokan harika bir ekip." }
  ]
};
