/* Business data for this site. Field reference and an annotated example: TEMPLATE.md and config.example.js.
   Every "__…__" value is a placeholder that must be replaced before publishing. */
const SITE = {
  business: {
    name: "__BUSINESS_NAME__",
    shortName: "__SHORT_NAME__",
    phone: "__PHONE__",
    whatsapp: "__WHATSAPP__",
    address: "__ADDRESS__",
    mapsQuery: "__MAPS_QUERY__",
    instagram: "",
    rating: null
  },
  // Monday first; [open, close] in whole hours, null = closed. Set hours: null when unknown.
  hours: null,
  hoursText: "",
  theme: {
    bg: "#FBF6F1",
    surface: "#EBD6C8",
    accent: "#A9644A",
    onAccent: "#FFFFFF",
    ink: "#33211C"
  },
  formats: ["Grup", "Bireysel"],
  programs: [],
  images: {
    logo: "assets/logo.webp",
    logoAlt: "__BUSINESS_NAME__ logosu",
    studio: "assets/studio.webp",
    studioMobile: "",
    studioAlt: "__STUDIO_PHOTO_ALT__"
  },
  copy: {
    beats: [
      { title: "__HERO_TITLE__", text: "__HERO_TEXT__" },
      { title: "Her yay, farklı bir direnç.", text: "Kırmızı en ağır, sarı en hafif. Aşağıdaki yaylarla direnci değiştirip taşıyıcıyı çektiğinde fark hemen hissediliyor. Derste bu ayarı eğitmenin yapar." },
      { title: "__BEAT_3_TITLE__", text: "__BEAT_3_TEXT__" }
    ],
    photo: { title: "__PHOTO_TITLE__", text: "__PHOTO_TEXT__" },
    team: { title: "", text: "" }
  },
  team: [],
  reviews: []
};
