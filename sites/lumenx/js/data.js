// Catalogue data. Finish names, variants, specs and prices come from the client's current store
// (frekanselektrikaydinlatma.com). Items marked "assumption" must be confirmed with the client.

export const PHONE = '905527000234';
export const PHONE_LABEL = '0552 700 02 34';
export const ADDRESS = 'Bereketzade Mah. Okçumusa Cad. İpek Çıkmazı Sk. Alkan İş Hanı No:2 Kat:4 İç Kapı No:25, Beyoğlu / İstanbul';

// Metallic plated finishes have no true RAL equivalent; the code shown is the nearest reference (assumption).
export const FIN = {
  gold:    { name: 'Gold',         hex: '#D8BE7E', metal: 1,   rough: .12, ral: '1036', ralName: 'İnci altın',      type: 'Metalik kaplama' },
  bronz:   { name: 'Bronz',        hex: '#9A5A35', metal: 1,   rough: .14, ral: '8029', ralName: 'İnci bakır',      type: 'Metalik kaplama' },
  rose:    { name: 'Rose',         hex: '#DCA690', metal: 1,   rough: .13, ral: null,   type: 'Metalik kaplama' },
  krom:    { name: 'Krom',         hex: '#E2E4E8', metal: 1,   rough: .05, ral: '9006', ralName: 'Beyaz alüminyum', type: 'Parlak kaplama' },
  nikel:   { name: 'Satine Nikel', hex: '#B9B5AC', metal: 1,   rough: .34, ral: '9007', ralName: 'Gri alüminyum',   type: 'Saten kaplama' },
  eskitme: { name: 'Eskitme',      hex: '#6B4E31', metal: .95, rough: .46, ral: null,   type: 'Patina kaplama' },
  siyah:   { name: 'Siyah',        hex: '#141415', metal: 0,   rough: .46, ral: '9005', ralName: 'Derin siyah',     type: 'Toz boya' },
  beyaz:   { name: 'Beyaz',        hex: '#EDECE6', metal: 0,   rough: .5,  ral: '9016', ralName: 'Trafik beyazı',   type: 'Toz boya' },
  // turned wood bodies: no RAL, the 3D model draws its own grain
  dogal:   { name: 'Doğal',        hex: '#C98A45', metal: 0,   rough: .42, ral: null, wood: true, type: 'Masif ahşap, doğal ton' },
  ceviz:   { name: 'Ceviz',        hex: '#6A3820', metal: 0,   rough: .4,  ral: null, wood: true, type: 'Masif ahşap, ceviz tonu' },
};

export const SHADE = {
  krem:    { name: 'Krem',    hex: '#D8D3B3' },
  kirmizi: { name: 'Kırmızı', hex: '#B0111F' },
  keten:   { name: 'Keten',   hex: '#E6DCC6' },
};

export const RAL = {
  '1013': ['İstiridye beyazı', '#EAE6CA'], '1015': ['Açık fildişi', '#E6D690'], '1019': ['Gri bej', '#9E9764'], '1023': ['Trafik sarısı', '#F7B500'],
  '1035': ['İnci bej', '#6A5D4D'], '1036': ['İnci altın', '#705335'],
  '3004': ['Mor kırmızı', '#75151E'], '3005': ['Şarap kırmızısı', '#5E2129'], '3020': ['Trafik kırmızısı', '#CC0605'],
  '5003': ['Safir mavisi', '#1E2460'], '5011': ['Çelik mavisi', '#1A2B3C'], '5024': ['Pastel mavi', '#5D9B9B'],
  '6003': ['Zeytin yeşili', '#424632'], '6005': ['Yosun yeşili', '#2F4538'], '6009': ['Köknar yeşili', '#31372B'], '6021': ['Soluk yeşil', '#89AC76'],
  '7015': ['Arduvaz gri', '#434750'], '7016': ['Antrasit gri', '#293133'], '7021': ['Siyah gri', '#23282B'], '7022': ['Umbra gri', '#332F2C'],
  '7024': ['Grafit gri', '#474A51'], '7030': ['Taş gri', '#8B8C7A'], '7032': ['Çakıl gri', '#B8B799'], '7035': ['Açık gri', '#D7D7D7'],
  '7037': ['Toz gri', '#7D7F7D'], '7039': ['Kuvars gri', '#6C6960'], '7040': ['Pencere grisi', '#9DA1AA'], '7044': ['İpek gri', '#CAC4B0'],
  '8014': ['Sepya kahve', '#382C1E'], '8017': ['Çikolata kahve', '#45322E'], '8019': ['Gri kahve', '#403A3A'], '8029': ['İnci bakır', '#763C28'],
  '9001': ['Krem', '#FDF4E3'], '9002': ['Gri beyaz', '#E7EBDA'], '9003': ['Sinyal beyazı', '#F4F4F4'], '9004': ['Sinyal siyahı', '#282828'],
  '9005': ['Derin siyah', '#0A0A0A'], '9006': ['Beyaz alüminyum', '#A5A5A5'], '9007': ['Gri alüminyum', '#8F8F8F'], '9010': ['Saf beyaz', '#FFFFFF'],
  '9011': ['Grafit siyahı', '#1C1C1C'], '9016': ['Trafik beyazı', '#F6F6F6'],
};
export const RAL_METALLIC = new Set(['1035', '1036', '8029', '9006', '9007']);

export const KINFO = {
  2700: ['Sıcak beyaz', 'Restoran masası, otel odası, akşam yemeği'],
  3000: ['Yumuşak beyaz', 'Kafe, lobi, salon ve bekleme alanları'],
  4000: ['Doğal beyaz', 'Ofis, mağaza, çalışma ve toplantı alanı'],
  6500: ['Gün ışığı', 'Atölye, depo ve teknik alanlar'],
};

export const TABLE_SPECS = [
  ['Stil', 'Yan ve aşağı yönlü aydınlatma'], ['Malzeme', 'Alüminyum gövde, DKP boya ve özel kaplama'],
  ['Işık kaynağı', 'Samsung 2835 SMD LED'], ['Işık ayarı', 'Dokunmatik, 3 seviye: düşük, orta, yüksek'],
  ['Güç', '3 W (Ekonomik) / 5 W (Premium)'], ['Batarya', 'Li-ion 1×18650 1500 mAh / 2×18650 1500–2200 mAh'],
  ['Şarj süresi', 'Ortalama 8 saat'], ['Güç girişi', '5 V / 2 A'], ['Koruma sınıfı', 'IP20, iç mekân'],
  ['Ağırlık', '1 kg'], ['Sertifikalar', 'CE, ISO, RoHS, MSDS'],
  ['Şarj seçenekleri', 'Tekli kaset veya 9 / 18 / 27 / 36\'lı istasyon'], ['Garanti', 'Elektronik aksamda 2 yıl'], ['Menşei', 'Türkiye'],
];
export const ARM_SPECS = [
  ['Montaj', 'Sarkıt veya sıva üstü'], ['Materyal', 'Alüminyum ekstrüzyon'], ['Profil yüksekliği', 'H5 / H7,5 / H10'],
  ['Optik', 'Opal difüzör'], ['Boya', 'Elektrostatik toz boya, tüm RAL renkleri'], ['Driver', 'Tridonic / Osram'],
  ['LED tipi', 'Yüksek verimli SMD LED'], ['Renk sıcaklığı', '2700 K / 3000 K / 4000 K / 6500 K'],
  ['Giriş gerilimi', '230–240 V / 50–60 Hz'], ['Kontrol', 'On-Off / DALI'], ['Çalışma ömrü', '50.000 saat'],
  ['Acil aydınlatma kiti', '1 saat / 3 saat'], ['Garanti', '3 yıl'], ['Ölçü', 'Projeye göre üretilir'],
];

// Product-specific spec sheets replace TABLE_SPECS. Defne: from the supplier's page; its "aluminium body"
// line was copied from another product and is corrected to wood.
export const DEFNE_SPECS = [
  ['Stil', 'Abajurlu, yumuşak ve geniş yayılan ışık'], ['Malzeme', 'Masif ahşap gövde, keten abajur, pirinç dokunmatik düğme'],
  ['Ölçüler', 'Toplam yükseklik 22,5 cm · Gövde 13 cm · Abajur Ø10 / Ø8 cm, 10 cm'],
  ['Işık kaynağı', 'Samsung SMD LED'], ['Işık ayarı', 'Dokunmatik, 3 kademe dimmer'],
  ['Güç', '3 W (Ekonomik) / 5 W (Premium)'], ['Batarya', 'Li-ion 1×18650 1500 mAh / 2×18650 1500–2200 mAh'],
  ['Kullanım süresi', 'Tam şarjla 30 saate kadar'], ['Şarj süresi', 'Ortalama 8 saat'], ['Güç girişi', '5 V / 2 A, USB-C'],
  ['Koruma sınıfı', 'IP20, kapalı ve kuru iç mekân'],
  ['Şarj seçenekleri', 'Tekli kaset veya 9 / 18 / 27 / 36’lı istasyon'], ['Garanti', 'Elektronik aksamda 2 yıl'], ['Menşei', 'Türkiye'],
];

// photos: "<fin>-<shade>" (or "<fin>") -> assets/products/<id>/<key>.webp. Missing variants fall back to the
// closest available photo and the page says which finish is pictured.
export const P = [
  {
    // model: kit spec in kit-specs.js (photo-measured, turned geometry); ks are an assumption, to confirm
    id: 'defne', name: 'Defne', group: 'table', model: 'defne', kit: true, price: null,
    meta: 'Şarjlı masa lambası · Ahşap gövde, keten abajur',
    desc: 'Tornada şekillenmiş masif ahşap gövdesi ve keten abajuruyla sıcak, dağınık bir ışık verir. Işık abajurdan süzülür, masaya geniş ve yumuşak bir halka bırakır. Kablosuzdur; üç kademeli dokunmatik dimmerle kısılır.',
    fin: ['dogal', 'ceviz'], shades: ['keten'], ks: [2700, 3000, 4000],
    def: { fin: 'dogal', shade: 'keten', k: 3000 },
    photos: ['dogal-keten'], specs: DEFNE_SPECS,
  },
  {
    id: 'avior', name: 'Avior', group: 'table', model: 'avior', price: 3609,
    meta: 'Şarjlı masa lambası · Pliseli abajur',
    desc: 'Konik gövdesi ve pliseli abajuruyla masaya geniş, yumuşak bir ışık havuzu bırakır. Kablosuzdur; dokunarak açılır, üç kademede kısılır.',
    fin: ['gold', 'bronz', 'rose', 'nikel', 'krom', 'siyah', 'beyaz'], shades: ['krem', 'kirmizi'], ks: [2700, 3000, 4000],
    def: { fin: 'gold', shade: 'krem', k: 2700 },
    photos: ['gold-krem', 'gold-kirmizi', 'bronz-krem', 'rose-kirmizi', 'nikel-krem', 'krom-krem', 'krom-kirmizi'],
  },
  {
    id: 'alderamin', name: 'Alderamin', group: 'table', model: 'alderamin', price: 3609,
    meta: 'Şarjlı masa lambası · İnce gövde',
    desc: 'İnce gövdesi abajuru göz hizasına taşır; ışık masaya ve yanlara eşit yayılır. Restoran ve otel masaları için.',
    fin: ['gold', 'nikel', 'eskitme', 'rose', 'bronz'], shades: ['krem', 'kirmizi'], ks: [2700, 3000, 4000],
    def: { fin: 'gold', shade: 'krem', k: 3000 },
    photos: ['gold-krem', 'gold-kirmizi', 'nikel-krem', 'nikel-kirmizi', 'eskitme-krem', 'eskitme-kirmizi', 'rose-krem', 'rose-kirmizi'],
  },
  {
    id: 'capella', name: 'Capella', group: 'table', model: 'capella', price: 3007,
    meta: 'Şarjlı masa lambası · Metal şapka',
    desc: 'Metal şapkası ışığı yalnızca aşağıya, masanın üzerine verir; karşıdakinin gözünü almaz. Bar ve restoran masalarında servis alanını aydınlatır.',
    fin: ['siyah', 'beyaz', 'gold', 'bronz', 'rose', 'nikel', 'eskitme'], shades: null, ks: [2700, 3000, 4000],
    def: { fin: 'siyah', k: 2700 },
    photos: ['siyah', 'beyaz', 'gold', 'bronz', 'rose', 'nikel'],
  },
  {
    id: 'kare', name: 'Dörtlü Kare', group: 'arm', model: 'kare', price: null,
    meta: 'LED armatür · Dört kare profil',
    desc: 'Farklı yüksekliklerde iç içe geçen dört kare profil, tavanda tek parça bir ışık kompozisyonu kurar. Alt yüzeydeki opal difüzör ışığı göz almadan, homojen dağıtır.',
    rals: ['9005', '9016', '7016', '9006', '1036'], ks: [2700, 3000, 4000, 6500],
    def: { ral: '9005', k: 4000 }, photos: ['photo'], wide: true,
  },
  {
    id: 'altigen', name: 'Altıgen', group: 'arm', model: 'altigen', price: null,
    meta: 'Sarkıt LED armatür · Altıgen profil',
    desc: 'Altıgen profilin alt yüzü baştan sona yanar; masanın üzerinde net, geometrik bir ışık çizgisi bırakır. Yemek ve toplantı masaları için.',
    rals: ['9005', '9016', '7016', '9006', '1036'], ks: [2700, 3000, 4000, 6500],
    def: { ral: '9005', k: 3000 }, photos: ['photo'], wide: true,
  },
];

export function photoFor(p, s) {
  const exact = p.group === 'table' ? (p.shades ? `${s.fin}-${s.shade}` : s.fin) : 'photo';
  if (p.photos.includes(exact)) return { key: exact, exact: true };
  const sameFin = p.photos.find(k => k.split('-')[0] === s.fin);
  if (sameFin) return { key: sameFin, exact: false };
  const sameShade = p.shades && p.photos.find(k => k.endsWith('-' + s.shade));
  return { key: sameShade || p.photos[0], exact: false };
}
export const photoSrc = (p, key) => `assets/products/${p.id}/${key}.webp`;

export function k2rgb(k) {
  const t = k / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
  else { r = 329.698727446 * Math.pow(t - 60, -.1332047592); g = 288.1221695283 * Math.pow(t - 60, -.0755148492); b = 255; }
  return [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))));
}

// Light colour as a camera white-balanced to about 4800 K shows it (and as the eye adapts to it):
// 2700 K stays clearly warm, 4000 K reads close to neutral, 6500 K reads cool. Used for renders and UI.
const WB = k2rgb(4800);
export function kColor(k) {
  const c = k2rgb(k).map((v, i) => v / WB[i]), m = Math.max(...c);
  return c.map(v => Math.round(255 * v / m));
}
