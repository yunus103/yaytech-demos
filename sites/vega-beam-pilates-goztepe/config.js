/* Business data for this site. Field reference and an annotated example: TEMPLATE.md and config.example.js.
   Every "__…__" value is a placeholder that must be replaced before publishing. */
const SITE = {
  business: {
    name: "Vega Beam Pilates Göztepe",
    shortName: "Vega Beam",
    phone: "0546 106 65 64",
    whatsapp: "905461066564",
    address: "Feneryolu, Çamlıtepe Sokak, 34730 Kadıköy/İstanbul, Türkiye",
    mapsQuery: "Vega Beam Pilates Feneryolu Kadıköy",
    instagram: "vegabeampilates_goztepe",
    rating: 5.0
  },
  // Monday first; [open, close] in whole hours, null = closed. Set hours: null when unknown.
  hours: [[8, 22], [8, 22], [8, 22], [8, 22], [8, 18], [9, 13], null],
  hoursText: "Pzt–Per 08:00–22:00 / Cuma 08:00–18:00 / Cmt 09:00–13:00 / Pazar Kapalı",
  theme: {
    bg: "#FAF8F5",
    surface: "#F3EFEA",
    accent: "#D4981E",
    onAccent: "#1E2226",
    ink: "#1E2226"
  },
  formats: ["Bireysel", "Grup", "Double"],
  programs: [],
  images: {
    logo: "assets/logo.webp",
    logoAlt: "Vega Beam Pilates Göztepe logosu",
    studio: "assets/studio.webp",
    studioMobile: "assets/studio-m.webp",
    studioAlt: "Vega Beam Pilates Göztepe stüdyosunda sıralanmış ahşap reformerlar ve aydınlık çalışma alanı"
  },
  copy: {
    beats: [
      { title: "Dengeni bul, kontrollü güçlen.", text: "Göztepe Feneryolu'nda aletli reformer pilates, mat pilates ve fonksiyonel antrenman. İlk adımı ücretsiz demo ders ile at." },
      { title: "Her yay, farklı bir direnç.", text: "Kırmızı en ağır, sarı en hafif. Aşağıdaki yaylarla direnci değiştirip taşıyıcıyı çektiğinde fark hemen hissediliyor. Derste bu ayarı eğitmenin yapar." },
      { title: "Birebir ilgi, doğru hareket.", text: "Bireysel, double ve küçük grup derslerinde her hareket eğitmen gözetiminde. Bedenine uygun tempo ve düzenli takip." }
    ],
    photo: { title: "Göztepe'de aydınlık ve ferah bir stüdyo.", text: "Feneryolu Çamlıtepe Sokak'ta ahşap reformerlar, geniş aynalar ve huzurlu bir antrenman ortamı." },
    team: { title: "", text: "" }
  },
  team: [],
  reviews: [
    { who: "Sena D.", text: "Ortam çok temiz, ferah ve huzurlu. Eğitmenler oldukça ilgili ve hareketleri doğru şekilde yapmamız için birebir ilgileniyorlar. Kendimi her dersten sonra çok iyi hissediyorum." },
    { who: "Cansu K.", text: "Hocaları çok tatlı, ilgileri ve hareketleri öğretme biçimleri de çok güzel. Güvenerek gelebilirsiniz; siz de güvenle başlayıp sporu hayatınızın bir noktasına koyabilirsiniz." },
    { who: "Naime V.", text: "1 senedir düzenli olarak gittiğim ve çok memnun kaldığım bir pilates stüdyosu. Çok güler yüzlü ve deneyimli hocaları var. Hem spor yaptığım hem de keyifli vakit geçirdiğim bir yer." },
    { who: "Aylin S.", text: "Senelerce kilo alıp vermek ile ilgilenip güçlenmeyi ihmal etmişim. Hocalarımın deneyim ve tecrübesiyle, bedensel ve mental olarak öylesine hızlı toparladım ki. İşinin en iyisini yapma gayretindeler." },
    { who: "Emine D.", text: "Yaklaşık 1 senedir düzenli devam ettiğim ve her açıdan çok memnun kaldığım bir stüdyo. Özellikle eğitimli ve dikkatli olmalarını takdir ediyorum; sıkılmadan eğlenceli vakit geçiriyorum." }
  ]
};
