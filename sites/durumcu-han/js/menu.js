// The menu: an arcade of arched niches (one per category) and a "room" per category whose niche
// shows the dish you're on. Photos in a set are pixel-aligned, so swapping them changes only the
// dish; the side items stay put and are labelled. Niche photos are relit by the shared light.
const Menu = (() => {
  const genis = matchMedia('(min-width: 900px)');
  const $ = (s, k = document) => k.querySelector(s);
  const $$ = (s, k = document) => [...k.querySelectorAll(s)];
  const srcset = (slug) => [320, 640, 1200].map((w) => `${fotoYolu(slug, w)} ${w}w`).join(', ');
  const kac = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const YILDIZ_IKON = '<svg class="yildiz-ikon" viewBox="-12 -12 24 24" aria-hidden="true"><rect x="-7.8" y="-7.8" width="15.6" height="15.6"/><rect x="-7.8" y="-7.8" width="15.6" height="15.6" transform="rotate(45)"/></svg>';

  function aralik(kat) {
    const f = kat.gruplar.flatMap((g) => g.urunler.map((u) => u.fiyat)).filter((v) => v > 0);
    const a = Math.min(...f), b = Math.max(...f);
    return a === b ? fiyatYaz(a) : `${fiyatYaz(a)} – ${fiyatYaz(b)}`;
  }

  // Callouts exploit the pixel alignment: side items sit at the same spot in every photo of a set.
  // [label, pointX%, pointY%, labelX%, labelY%] in photo coordinates.
  const MENU_ETIKET = [['Ayran', 13.5, 28, 13.5, 5], ['Halka tatlı', 80, 19, 56, 5], ['Çiğ köfte', 83, 67, 83, 95]];
  const ETIKETLER = {
    menuler: MENU_ETIKET,
    tavalar: MENU_ETIKET,
    'iki-kisilik': [['Çiğ köfte', 21, 19, 21, -5], ['1 litre içecek', 88, 30, 66, -5], ['Halka tatlı', 77, 59, 77, 82]],
  };

  const KEMER_DIS = 'M0 126V60A60 60 0 0 1 50 .84A60 60 0 0 1 100 60V126';
  const KEMER_IC = 'M4 126V60A56 56 0 0 1 50 4.9A56 56 0 0 1 96 60V126';

  function revakYaz() {
    $('#revak').innerHTML = MENU.map((k, i) => `
      <a class="kemer" href="#${k.id}" style="--i:${i}">
        <span class="kemer-cerceve">
          ${k.kapak
            ? `<img src="${fotoYolu(k.kapak, 320)}" srcset="${srcset(k.kapak)}" sizes="(min-width: 900px) 210px, 31vw" width="320" height="320" loading="lazy" decoding="async" alt="">`
            : `<span class="kemer-bos"><svg viewBox="-50 -70 100 140" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g transform="translate(0 12)"><rect x="-22" y="-22" width="44" height="44"/><rect x="-22" y="-22" width="44" height="44" transform="rotate(45)"/><circle r="31.1"/><circle r="16.5"/></g></svg></span>`}
          <svg class="kemer-cizgi" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 140V60A60 60 0 0 1 50 .84A60 60 0 0 1 100 60V140"/></svg>
        </span>
        <span class="kemer-ad">${kac(k.ad)}</span>
        <span class="kemer-fiyat">${aralik(k)}</span>
      </a>`).join('');
  }

  function etiketYaz(liste) {
    if (!liste) return '';
    const cizgi = liste.map(([, x, y, lx, ly]) => `<line x1="${x}" y1="${y}" x2="${lx}" y2="${ly}"/>`).join('');
    const halka = liste.map(([, x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('');
    const yazi = liste.map(([ad, , , lx, ly]) => `<span class="etiket" style="--x:${lx}%;--y:${ly}%">${kac(ad)}</span>`).join('');
    return `<div class="etiketler" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${cizgi}${halka}</svg>${yazi}</div>`;
  }

  function kalemYaz(u) {
    const fiyat = fiyatYaz(u.fiyat);
    const soru = u.fiyat === null || u.fiyat === 0;
    const ic = `
      <span class="kalem-isaret">${u.foto ? YILDIZ_IKON : ''}</span>
      <span class="kalem-metin"><span class="kalem-ad">${kac(u.ad)}</span>${u.gram ? `<span class="kalem-gram">${kac(u.gram)}</span>` : ''}</span>
      <span class="kalem-fiyat${soru ? ' soru' : ''}">${fiyat}</span>`;
    return u.foto
      ? `<li class="kalem"><button class="kalem-ic" type="button" aria-pressed="false" data-foto="${u.foto}" data-ad="${kac(u.ad)}" data-fiyat="${fiyat}" data-gram="${kac(u.gram || '')}">${ic}</button></li>`
      : `<li class="kalem"><div class="kalem-ic">${ic}</div></li>`;
  }

  function odaYaz(kat) {
    const urunler = kat.gruplar.flatMap((g) => g.urunler);
    const fotolu = urunler.filter((u) => u.foto);
    const ilk = fotolu[0];
    const tekNot = kat.gruplar.length === 1 && kat.gruplar[0].not;

    const sahne = ilk ? `
      <figure class="sahne${fotolu.length < 2 ? ' sabit' : ''}">
        <div class="nis" data-ciz>
          <div class="nis-foto">
            <img class="aktif" src="${fotoYolu(ilk.foto, 640)}" srcset="${srcset(ilk.foto)}" sizes="(min-width: 900px) 410px, 47vw" width="640" height="640" loading="lazy" decoding="async" alt="${kac(ilk.ad)}">
            <img src="data:," sizes="(min-width: 900px) 410px, 47vw" width="640" height="640" alt="">
            <canvas class="nis-isik" aria-hidden="true"></canvas>
            ${etiketYaz(ETIKETLER[kat.id])}
          </div>
          <svg class="nis-cizgi" viewBox="0 0 100 126" preserveAspectRatio="none" aria-hidden="true">
            <path class="dis" d="${KEMER_DIS}"/>
            <path class="ic" d="${KEMER_IC}"/>
            <g transform="translate(50 17)"><rect x="-4.6" y="-4.6" width="9.2" height="9.2"/><rect x="-4.6" y="-4.6" width="9.2" height="9.2" transform="rotate(45)"/></g>
          </svg>
        </div>
        <figcaption class="sahne-yazi">
          <span class="sahne-ad">${kac(ilk.ad)}</span>
          <span class="sahne-fiyat${ilk.fiyat > 0 ? '' : ' soru'}">${fiyatYaz(ilk.fiyat)}</span>
          <span class="sahne-gram">${kac(ilk.gram || '')}</span>
        </figcaption>
      </figure>` : '';

    const gruplar = kat.gruplar.map((g) => `
      ${g.ad && kat.gruplar.length > 1 ? `<h3 class="grup">${kac(g.ad)}</h3>` : ''}
      ${g.not && !tekNot ? `<p class="grup-not">${kac(g.not)}</p>` : ''}
      <ul>${g.urunler.map(kalemYaz).join('')}</ul>`).join('');

    return `
      <section class="oda" id="${kat.id}" aria-labelledby="b-${kat.id}">
        <header class="bolum-bas">
          <div class="oda-ust">
            <h2 class="baslik" id="b-${kat.id}">${kac(kat.ad)}</h2>
            <span class="oda-aralik">${aralik(kat)}</span>
          </div>
          <div class="ayrac" data-ciz aria-hidden="true"><i></i><svg viewBox="-12 -12 24 24"><rect x="-7.8" y="-7.8" width="15.6" height="15.6" pathLength="1"/><rect x="-7.8" y="-7.8" width="15.6" height="15.6" transform="rotate(45)" pathLength="1"/></svg><i></i></div>
          ${tekNot ? `<p class="oda-not">${kac(tekNot)}</p>` : ''}
        </header>
        <div class="oda-govde${ilk ? ' sahneli' : ''}">
          ${sahne}
          <div class="liste${ilk ? '' : ' liste-iki'}">${gruplar}</div>
        </div>
      </section>`;
  }

  /* ---------- Stage: aligned cross-fade, relit ---------- */

  const sahneler = [];

  function sahneKur(oda) {
    const sahne = $('.sahne', oda);
    if (!sahne) return;
    const imgs = $$('.nis-foto > img', sahne);
    const dugmeler = $$('[data-foto]', oda);
    const ad = $('.sahne-ad', sahne), fiyat = $('.sahne-fiyat', sahne), gram = $('.sahne-gram', sahne);
    const isikli = Isik.azHareket ? null : new IsikliFoto($('.nis-isik', sahne), (slug) => haritaYukle(slug, 640));
    let gorunen = 0, istek = 0, aktif = dugmeler[0];
    aktif.setAttribute('aria-pressed', 'true');

    function goster(btn) {
      if (btn === aktif) return;
      aktif.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-pressed', 'true');
      aktif = btn;
      ad.textContent = btn.dataset.ad;
      fiyat.textContent = btn.dataset.fiyat;
      fiyat.classList.toggle('soru', !/\d/.test(btn.dataset.fiyat));
      gram.textContent = btn.dataset.gram;
      isikli?.goster(btn.dataset.foto);
      const no = ++istek;
      const sonraki = imgs[1 - gorunen];
      sonraki.srcset = srcset(btn.dataset.foto);
      sonraki.src = fotoYolu(btn.dataset.foto, 640);
      sonraki.alt = btn.dataset.ad;
      const bitir = () => {
        if (no !== istek) return;
        sonraki.classList.add('aktif');
        imgs[gorunen].classList.remove('aktif');
        gorunen = 1 - gorunen;
      };
      sonraki.decode ? sonraki.decode().then(bitir, bitir) : bitir();
    }

    let kilitY = null;
    dugmeler.forEach((b) => {
      b.addEventListener('click', () => { kilitY = scrollY; goster(b); });
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { kilitY = scrollY; goster(b); } });
    });

    // Warm the cache (and the light maps) once the room is near, so swaps are instant.
    let isindi = false;
    const isit = () => {
      if (isindi) return;
      isindi = true;
      isikli?.goster(aktif.dataset.foto);
      dugmeler.forEach((b) => {
        const i = new Image();
        i.sizes = imgs[0].sizes;
        i.srcset = srcset(b.dataset.foto);
        if (isikli) haritaYukle(b.dataset.foto, 640);
      });
    };

    sahneler.push({
      oda, sahne, dugmeler, isit, isikli,
      nis: $('.nis', sahne),
      kaydir() {
        if (dugmeler.length < 2) return;
        if (kilitY !== null && Math.abs(scrollY - kilitY) < 140) return;
        kilitY = null;
        const cizgi = genis.matches ? innerHeight * 0.5 : sahne.getBoundingClientRect().bottom + 36;
        let secilen = dugmeler[0];
        for (const b of dugmeler) {
          if (b.getBoundingClientRect().top <= cizgi) secilen = b; else break;
        }
        goster(secilen);
      },
    });
  }

  function sahneTakip() {
    const gorunur = new Set();
    const yakin = new IntersectionObserver((girdiler) => {
      girdiler.forEach((g) => {
        const s = sahneler.find((x) => x.oda === g.target);
        if (g.isIntersecting) { gorunur.add(s); s.isit(); } else gorunur.delete(s);
      });
    }, { rootMargin: '600px 0px' });
    sahneler.forEach((s) => yakin.observe(s.oda));

    // Only niches actually on screen are redrawn.
    const ekranda = new IntersectionObserver((girdiler) => {
      girdiler.forEach((g) => {
        const s = sahneler.find((x) => x.nis === g.target);
        if (s.isikli) { s.isikli.gorunur = g.isIntersecting; s.isikli.kirli = true; }
      });
      Isik.iste();
    });
    sahneler.forEach((s) => ekranda.observe(s.nis));

    let bekliyor = false;
    addEventListener('scroll', () => {
      if (bekliyor) return;
      bekliyor = true;
      requestAnimationFrame(() => { bekliyor = false; gorunur.forEach((s) => s.kaydir()); });
      Isik.iste();
    }, { passive: true });

    sahneler.forEach((s) => s.isikli && Isik.dokunmaBagla(s.nis));
    Isik.ekle((isik, simdi) => {
      let devam = false;
      for (const s of sahneler) if (s.isikli && s.isikli.ciz(isik, simdi)) devam = true;
      return devam;
    });
    addEventListener('resize', () => sahneler.forEach((s) => s.isikli?.gl && s.isikli.boyutla()));
  }

  // The light drifts around the niche closest to the middle of the screen.
  function odak() {
    let en = null, uzak = Infinity;
    const orta = innerHeight / 2;
    for (const s of sahneler) {
      const r = s.nis.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const d = Math.abs(r.top + r.height / 2 - orta);
      if (d < uzak) { uzak = d; en = r; }
    }
    return en;
  }

  /* ---------- Line drawing on reveal ---------- */

  // These outlines use non-scaling strokes, where Chrome applies dashes in screen pixels,
  // so pathLength="1" can't normalise them; measure the on-screen length instead.
  function cizgiOlc() {
    $$('.nis-cizgi path, .nis-cizgi rect, .kemer-cizgi path, .harita-cizgi path').forEach((e) => {
      const m = e.getScreenCTM();
      if (!m) return;
      const olcek = Math.hypot(m.a, m.b) / 2 + Math.hypot(m.c, m.d) / 2;
      e.style.setProperty('--len', `${Math.ceil(e.getTotalLength() * olcek) + 2}px`);
    });
  }

  function cizimTakip() {
    const hedefler = $$('[data-ciz], .revak');
    if (Isik.azHareket || !('IntersectionObserver' in window)) {
      hedefler.forEach((e) => e.classList.add('cizildi'));
      return;
    }
    const io = new IntersectionObserver((girdiler) => {
      girdiler.forEach((g) => {
        if (g.isIntersecting) { g.target.classList.add('cizildi'); io.unobserve(g.target); }
      });
    }, { threshold: 0.25 });
    hedefler.forEach((e) => io.observe(e));
  }

  function kur() {
    revakYaz();
    $('#odalar').innerHTML = MENU.map(odaYaz).join('');
    $$('.oda').forEach(sahneKur);
    sahneTakip();
    cizgiOlc();
    let olcZaman;
    addEventListener('resize', () => { clearTimeout(olcZaman); olcZaman = setTimeout(cizgiOlc, 200); });
    // While the paper still covers the menu, hold the line drawing until it's revealed.
    if (document.documentElement.classList.contains('kagit-acik')) {
      document.addEventListener('kagit:bitti', () => requestAnimationFrame(() => { cizgiOlc(); cizimTakip(); }), { once: true });
    } else cizimTakip();
  }

  return { kur, odak };
})();
