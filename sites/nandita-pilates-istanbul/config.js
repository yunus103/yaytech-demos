/* Business data for this site. Field reference and an annotated example: TEMPLATE.md and config.example.js.
   Every "__…__" value is a placeholder that must be replaced before publishing. */
const SITE = {
  business: {
    name: "Nandita Pilates Studio - İSTANBUL",
    shortName: "Nandita",
    phone: "0543 316 06 73",
    whatsapp: "905433160673",
    address: "19 mayıs mahallesi, Kozyatağı, Şelale Sk. 27/A, 34742 Kadıköy/İstanbul, Türkiye",
    mapsQuery: "Nandita Pilates Studio Kozyatağı Kadıköy",
    instagram: "nanditapilates",
    rating: 4.9
  },
  // Monday first; [open, close] in whole hours, null = closed. Set hours: null when unknown.
  hours: [[9, 23], [10, 23], [9, 23], [10, 23], [9, 21], [9, 17], null],
  hoursText: "Pzt, Çar 09:00–23:00 / Salı, Per 10:00–23:00 / Cuma 09:00–21:00 / Cmt 09:00–17:00",
  theme: {
    bg: "#FAF8FC",
    surface: "#EDE6F5",
    accent: "#5B2C8E",
    onAccent: "#FFFFFF",
    ink: "#261638"
  },
  formats: ["Bireysel", "Grup"],
  programs: ["prenatal"],
  images: {
    logo: "assets/logo.webp",
    logoAlt: "Nandita Pilates Studio logosu",
    studio: "assets/studio.webp",
    studioMobile: "assets/studio-m.webp",
    studioAlt: "Nandita Pilates stüdyo alanı ve renkli stüdyo duvarları"
  },
  copy: {
    beats: [
      { title: "Bedenini tanı. Dengeni bul.", text: "Kozyatağı'nda Özlem Hoca eşliğinde aletli pilates, bireysel dersler ve hamile pilatesi." },
      { title: "Her yay, farklı bir direnç.", text: "Kırmızı en ağır, sarı en hafif. Aşağıdaki yaylarla direnci değiştirip taşıyıcıyı çektiğinde fark hemen hissediliyor. Derste bu ayarı eğitmenin yapar." },
      { title: "Kişiye özel ilgi, doğru hareket.", text: "Birebir veya küçük gruplarla çalışırken her hareket kontrol altında. İhtiyacına uygun tempo, sabırlı ve motive edici yönlendirme." }
    ],
    photo: { title: "Kozyatağı'nda samimi bir alan.", text: "Renkli, enerjik ve tertemiz bir atmosfer. Haftanın 6 günü açık kapılar ve esnek ders planlaması." },
    team: { title: "", text: "" }
  },
  team: [],
  reviews: [
    { who: "Arzu Ç.", text: "Hocamızın ilgisi, profesyonelliği ve herkesin ihtiyaçlarına göre yaklaşımı sayesinde dersler hem verimli hem de keyifli geçiyor. Stüdyonun temizliği ve sıcak ortamı da çok güzel." },
    { who: "Ayşe K.", text: "Pilates yapmak çok keyifli ama en güzeli hocamızın enerjisiyle pilates yapmak. Herkesin en azından bir kere denemesini tavsiye ediyorum." },
    { who: "Gül Ö.", text: "Nandita’ya gelmeye başladığınızda Özlem hocanın güler yüzünü ve enerjisini görecek, bir daha buradan kopamayacaksınız. Ders saatlerini haftalık belirleyebilmek de büyük kolaylık." },
    { who: "Kamer Ö.", text: "Düzenli spor yapmaya alışkın olmamama rağmen, 4 aydır Özlem hocanın enerjisi ve ilgisiyle devam ediyorum. MultiSport ile rahatça grup derslerine dahil olabiliyorum." },
    { who: "mehmet C.", text: "Hem profesyonel hem de samimi bir atmosferi var. Eğitmenlerin her hareketi tek tek anlatmaları ve sabırla yönlendirmeleri çok değerli. Stüdyo tertemiz ve motive edici." }
  ]
};
