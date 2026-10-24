// Boot: contact details, open/closed status, and wiring between the paper, the menu and the light.
(() => {
  const $$ = (s) => [...document.querySelectorAll(s)];
  const kac = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  $$('[data-tel]').forEach((a) => { a.href = ISLETME.telLink; });
  $$('[data-tel-metin]').forEach((e) => { e.textContent = ISLETME.telefon; });
  $$('[data-yol]').forEach((a) => { a.href = ISLETME.yolTarifi; });
  $$('[data-insta]').forEach((a) => { a.href = ISLETME.instagram; });
  $$('[data-saat]').forEach((e) => { e.textContent = ISLETME.saatler.metin; });
  $$('[data-adres]').forEach((e) => { e.textContent = ISLETME.adres; });
  const [cadde, ...semt] = ISLETME.adres.split(', ');
  $$('[data-adres-iki]').forEach((e) => {
    e.innerHTML = `<span class="adres-cadde">${kac(cadde)}</span><span class="adres-semt">${kac(semt.join(', '))}</span>`;
  });

  // The map is heavy; load it only when the address section gets close.
  const harita = document.querySelector('[data-harita]');
  new IntersectionObserver((g, io) => {
    if (!g[0].isIntersecting) return;
    harita.src = ISLETME.haritaEmbed;
    io.disconnect();
  }, { rootMargin: '800px 0px' }).observe(harita);

  // Turkish case suffix follows how the hour is read aloud: 02 "iki" -> 'ye kadar / 'de açılır.
  const okunus = (s) => ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'][s % 10];
  const YONELME = { sıfır: 'a', bir: 'e', iki: 'ye', üç: 'e', dört: 'e', beş: 'e', altı: 'ya', yedi: 'ye', sekiz: 'e', dokuz: 'a' };
  const BULUNMA = { sıfır: 'da', bir: 'de', iki: 'de', üç: 'te', dört: 'te', beş: 'te', altı: 'da', yedi: 'de', sekiz: 'de', dokuz: 'da' };
  const ONLAR = { 10: ['a', 'da'], 20: ['ye', 'de'] };
  const ek = (s, tablo, sira) => (s % 10 === 0 && ONLAR[s] ? ONLAR[s][sira] : tablo[okunus(s)]);
  const saat = (s) => `${String(s).padStart(2, '0')}:00`;

  function durumYaz() {
    const { acilis, kapanis } = ISLETME.saatler;
    const acik = acikMi();
    const metin = acik
      ? `Açık · ${saat(kapanis)}'${ek(kapanis, YONELME, 0)} kadar`
      : `Kapalı · ${saat(acilis)}'${ek(acilis, BULUNMA, 1)} açılır`;
    $$('[data-durum]').forEach((e) => {
      e.textContent = metin;
      e.classList.toggle('acik', acik);
    });
  }
  durumYaz();
  setInterval(durumYaz, 60_000);

  Menu.kur();

  // Light focus: the whole screen while the paper is up, otherwise the niche in view.
  Isik.odakla(() => (Kagit.aktif()
    ? { left: 0, top: 0, width: innerWidth, height: innerHeight * 0.7 }
    : Menu.odak()));

  // Cheap light response for the arch thumbnails: a soft warm pool that follows the same light.
  let sonX = 0, sonY = 0;
  const kok = document.documentElement.style;
  Isik.ekle((isik) => {
    if (Math.abs(isik.x - sonX) + Math.abs(isik.y - sonY) < 2) return false;
    sonX = isik.x;
    sonY = isik.y;
    kok.setProperty('--isik-x', `${isik.x.toFixed(0)}px`);
    kok.setProperty('--isik-y', `${isik.y.toFixed(0)}px`);
    return false;
  });

  // Logo goes back to the first sheet when the paper is available, else to the top.
  $$('[data-basa]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (Kagit.basaDon) Kagit.basaDon();
    else scrollTo({ top: 0, behavior: 'smooth' });
  }));
})();
