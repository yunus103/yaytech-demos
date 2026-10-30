import { PHONE, FIN, SHADE, RAL, RAL_METALLIC, KINFO, TABLE_SPECS, ARM_SPECS, P, photoFor, photoSrc, kColor } from './data.js';

document.documentElement.lang = 'tr'; // the artifact host supplies its own <html> element

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rgbStr = k => kColor(k).join(',');
const hexRgb = h => [0, 2, 4].map(i => parseInt(h.replace('#', '').slice(i, i + 2), 16));
const rgbHex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
const swatchBg = (hex, metal) => metal
  ? `radial-gradient(circle at 32% 28%, ${mix(hex, '#ffffff', .55)}, ${hex} 45%, ${mix(hex, '#000000', .45)} 100%)`
  : `radial-gradient(circle at 35% 30%, ${mix(hex, '#ffffff', .12)}, ${hex} 60%, ${mix(hex, '#000000', .2)})`;
const tl = n => n.toLocaleString('tr-TR') + ' ₺';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const setGlow = k => document.documentElement.style.setProperty('--glow', rgbStr(k));
const wa = text => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
const finSwatch = f => swatchBg(FIN[f].hex, FIN[f].metal > .5);
// wood bodies are a "gövde", painted/plated metal ones a "kasa"
const finWord = p => FIN[p.fin?.[0]]?.wood ? 'gövde' : 'kasa';
const ralSwatch = r => swatchBg(RAL[r][1], RAL_METALLIC.has(r));
const MODE_LABELS = { gunduz: 'Gündüz', aksam: 'Akşam', gece: 'Gece' };

// The skip link must not change the hash (that would route back to the home page).
$('.skip').addEventListener('click', e => { e.preventDefault(); const m = $('#main'); m.tabIndex = -1; m.focus(); });

/* ---------- header ---------- */
const hdr = $('#hdr');
function updateHeader() { hdr.classList.toggle('solid', scrollY > 40 || !$('#product').hidden); }
addEventListener('scroll', updateHeader, { passive: true });

/* ---------- hero: pre-rendered frames of the 3D scene, cross-faded ---------- */
(function hero() {
  const media = $('#heroMedia'), cap = $('#heroCap');
  const LEVELS = [0, .38, .68, 1], NAMES = ['Kapalı', 'Düşük', 'Orta', 'Yüksek'];
  let k = 2700, lv = 3, loaded = false;
  function loadRest() {
    if (loaded) return; loaded = true;
    $$('[data-src]', media).forEach(i => { i.src = i.dataset.src; i.removeAttribute('data-src'); });
    $$('[data-srcset]', media).forEach(s => { s.srcset = s.dataset.srcset; s.removeAttribute('data-srcset'); });
  }
  function paint() {
    media.style.setProperty('--lv', LEVELS[lv]);
    $$('.hero-frame', media).forEach(f => f.classList.toggle('on', f.dataset.k === String(k)));
    $$('#heroK button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.k === k));
    $$('#heroL button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.l === lv));
    cap.textContent = lv ? `Avior · Gold kasa, krem abajur · ${k} K · ${NAMES[lv].toLocaleLowerCase('tr')}` : 'Avior · Gold kasa, krem abajur · kapalı';
    setGlow(k);
  }
  $('#heroK').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; loadRest(); k = +b.dataset.k; if (!lv) lv = 3; paint(); });
  $('#heroL').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b) return; loadRest(); lv = +b.dataset.l; paint(); });
  $('#heroLamp').addEventListener('click', () => { loadRest(); lv = (lv + 3) % 4; paint(); });
  // the other light states preload only when the home page is showing and the visitor isn't saving data
  addEventListener('load', () => setTimeout(() => { if (!$('#home').hidden && !(navigator.connection && navigator.connection.saveData)) loadRest(); }, 600));
  paint();
})();

/* ---------- collection ---------- */
function cardHTML(p) {
  const ph = photoSrc(p, photoFor(p, p.def).key);
  const dots = p.fin
    ? p.fin.map(f => `<button type="button" data-cfin="${f}" aria-pressed="${f === p.def.fin}" aria-label="${FIN[f].name} ${finWord(p)}" title="${FIN[f].name}"><i style="background:${finSwatch(f)}"></i></button>`).join('') + `<span>${p.fin.length} ${finWord(p)} rengi</span>`
    : p.rals.map(r => `<i style="width:16px;height:16px;border-radius:50%;margin:6px;background:${ralSwatch(r)};box-shadow:inset 0 0 0 1px rgba(0,0,0,.14)"></i>`).join('') + '<span>Tüm RAL renkleri</span>';
  const price = p.price ? `${tl(p.price)}’den` : 'Projeye özel';
  return `<div class="card${p.wide ? ' wide' : ''}" data-g="${p.group}" data-id="${p.id}">
    <div class="card-media">
      <a class="card-cover" href="#urun-${p.id}" tabindex="-1" aria-hidden="true"></a>
      <img class="ph" src="${ph}" alt="${esc(p.name)}, ${esc(p.meta)}" width="800" height="1000" loading="lazy" decoding="async">
      <img class="night" src="assets/renders/card-${p.id}.webp" alt="" width="800" height="1000" loading="lazy" decoding="async">
      <span class="card-tag">Gece · ${p.def.k} K</span>
      <button class="card-light" type="button" data-light aria-pressed="false" aria-label="${esc(p.name)} ışığını yak"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5a5.5 5.5 0 0 0-3.2 10c.5.4.8 1 .8 1.6v.4h4.8v-.4c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 10 2.5zM7.8 16.5h4.4M8.6 18.2h2.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
    </div>
    <div class="card-body"><h3><a href="#urun-${p.id}">${esc(p.name)}</a></h3><span class="price">${price}</span><span class="meta">${esc(p.meta)}</span><div class="dots">${dots}</div></div>
  </div>`;
}
$('#grid').innerHTML = P.map(cardHTML).join('');
$('#grid').addEventListener('click', e => {
  const l = e.target.closest('[data-light]');
  if (l) { e.preventDefault(); const on = l.getAttribute('aria-pressed') !== 'true'; l.setAttribute('aria-pressed', on); l.closest('.card').classList.toggle('lit', on); return; }
  const b = e.target.closest('[data-cfin]');
  if (!b) return;
  e.preventDefault();
  const card = b.closest('.card'), p = P.find(x => x.id === card.dataset.id);
  $('.ph', card).src = photoSrc(p, photoFor(p, { fin: b.dataset.cfin, shade: p.def.shade }).key);
  $$('[data-cfin]', card).forEach(x => x.setAttribute('aria-pressed', x === b));
});
$$('.filters button').forEach(b => b.addEventListener('click', () => {
  $$('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
  $$('#grid .card').forEach(c => { c.hidden = !(b.dataset.f === 'all' || c.dataset.g === b.dataset.f); });
}));

/* ---------- kelvin guide: six rendered frames, the slider blends neighbours ---------- */
(function kelvin() {
  const FR = [2700, 3000, 3500, 4000, 5000, 6500];
  const box = $('#kelFrames'), range = $('#kelRange'), kEl = $('#kelK'), nEl = $('#kelName'), uses = $('#kelUses');
  box.innerHTML = FR.map((k, i) => `<img data-k="${k}" ${i === 1 ? 'src' : 'data-src'}="assets/renders/kelvin-${k}.webp" alt="${i === 1 ? 'Altıgen LED armatürün yemek masası üzerindeki ışığı' : ''}" width="1800" height="1180" decoding="async">`).join('');
  const imgs = $$('img', box);
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return;
    imgs.forEach(i => { if (i.dataset.src) { i.src = i.dataset.src; i.removeAttribute('data-src'); } });
    io.disconnect();
  }, { rootMargin: '400px' }).observe($('#kelStage'));
  uses.innerHTML = Object.entries(KINFO).map(([k, [n, u]]) => `<button class="kuse" type="button" data-k="${k}"><b><i style="background:rgb(${rgbStr(+k)})"></i>${k} K</b><span>${n}. ${u}.</span></button>`).join('');
  const nameFor = k => KINFO[k < 2850 ? 2700 : k < 3500 ? 3000 : k < 5200 ? 4000 : 6500][0];
  const near = k => k < 2850 ? 2700 : k < 3500 ? 3000 : k < 5200 ? 4000 : 6500;
  function update() {
    const k = +range.value;
    let i = FR.findIndex(x => x >= k); if (i <= 0) i = 1;
    const a = FR[i - 1], b = FR[i], t = (k - a) / (b - a);
    imgs.forEach(img => { const v = +img.dataset.k; img.classList.toggle('base', v === a); img.style.opacity = v === a ? 1 : v === b ? t : 0; });
    kEl.innerHTML = `${k}<small>K</small>`;
    nEl.textContent = nameFor(k);
    range.setAttribute('aria-valuetext', `${k} Kelvin, ${nameFor(k)}`);
    range.style.setProperty('--kc', rgbStr(k));
    $$('.kuse', uses).forEach(x => x.setAttribute('aria-current', +x.dataset.k === near(k)));
  }
  range.style.setProperty('--track', `linear-gradient(90deg, ${[2700, 3000, 3500, 4000, 5000, 6500].map(k => `rgb(${rgbStr(k)}) ${((k - 2700) / 38).toFixed(1)}%`).join(', ')})`);
  range.addEventListener('input', update);
  uses.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { range.value = b.dataset.k; update(); } });
  update();
})();

/* ---------- stations ---------- */
$('#stRow').innerHTML = [1, 9, 18, 27, 36].map(n => `<div class="st"><span class="st-dots" style="grid-template-columns:repeat(${Math.min(n, 6)},auto)">${'<i></i>'.repeat(n)}</span><b>${n}</b><small>${n === 1 ? 'tekli kaset' : 'lamba'}</small></div>`).join('');

/* ---------- quote list ---------- */
const byId = id => P.find(p => p.id === id);
// Saved lists from older versions or hand-edited storage must never break the page.
function validItem(it) {
  const p = it && byId(it.id);
  if (!p || !Number.isInteger(it.qty) || it.qty < 1 || !KINFO[it.k]) return false;
  return p.group === 'table' ? !!FIN[it.fin] && (!it.shade || !!SHADE[it.shade]) : !!RAL[it.ral];
}
const savedQuote = store.get('lumenx-quote', []);
let quote = (Array.isArray(savedQuote) ? savedQuote : []).filter(validItem);
function describe(it) {
  const p = byId(it.id), a = [];
  if (p.group === 'table') {
    a.push(`${FIN[it.fin].name} ${FIN[it.fin].wood ? 'ahşap gövde' : 'kasa'}`);
    if (it.shade) a.push(`${SHADE[it.shade].name} abajur`);
    a.push(`${it.k} K`, it.power === 'premium' ? 'Premium 5 W' : 'Ekonomik 3 W');
  } else {
    a.push(`RAL ${it.ral}${RAL[it.ral] ? ' ' + RAL[it.ral][0] : ''}`, `${it.k} K`, `Profil ${it.prof}`, it.ctrl);
    if (it.emg !== 'Yok') a.push(`Acil kit ${it.emg}`);
  }
  return a.join(' · ');
}
function quoteText() {
  const f = id => $('#' + id).value.trim();
  let t = 'Merhaba, aşağıdaki ürünler için teklif almak istiyorum.\n\n';
  quote.forEach((it, i) => { t += `${i + 1}) ${byId(it.id).name}, ${it.qty} adet\n   ${describe(it)}\n`; });
  const info = [['Ad soyad', f('fName')], ['Firma', f('fCo')], ['Telefon', f('fTel')], ['Şehir', f('fCity')], ['Not', f('fNote')]].filter(x => x[1]);
  if (info.length) t += '\n' + info.map(x => `${x[0]}: ${x[1]}`).join('\n');
  return t;
}
function updateWa() { $('#sendWa').href = wa(quote.length ? quoteText() : 'Merhaba, ürünleriniz hakkında bilgi almak istiyorum.'); }
function renderQuote() {
  const n = quote.reduce((s, x) => s + x.qty, 0), c = $('#qCount');
  c.textContent = n; n ? c.removeAttribute('data-zero') : c.setAttribute('data-zero', '');
  $('#qItems').innerHTML = quote.length
    ? quote.map((it, i) => { const p = byId(it.id); return `<div class="qi"><img src="${photoSrc(p, photoFor(p, it).key)}" alt=""><div><b>${esc(p.name)}</b> <span class="qn">× ${it.qty}</span><p>${esc(describe(it))}</p></div><button type="button" data-rm="${i}">Çıkar</button></div>`; }).join('')
    : '<div class="empty">Listeniz boş. Bir ürün sayfasında seçimlerinizi yapıp “Teklif listesine ekle”ye dokunun.</div>';
  updateWa();
  store.set('lumenx-quote', quote);
}
$('#qItems').addEventListener('click', e => {
  const b = e.target.closest('[data-rm]'); if (!b) return;
  const i = +b.dataset.rm;
  quote.splice(i, 1); renderQuote();
  const rest = $$('[data-rm]', drawer);
  (rest[Math.min(i, rest.length - 1)] || $('.x', drawer)).focus();
});
$('#qForm').addEventListener('input', updateWa);
$('#qForm').addEventListener('submit', e => e.preventDefault());
$('#copyQuote').addEventListener('click', async () => {
  const b = $('#copyQuote');
  try { await navigator.clipboard.writeText(quoteText()); b.textContent = 'Kopyalandı'; } catch { b.textContent = 'Kopyalanamadı; WhatsApp ile gönderin'; }
  setTimeout(() => { b.textContent = 'Talep metnini kopyala'; }, 2200);
});

const drawer = $('#drawer');
const outside = () => [$('#hdr'), $('#main'), $('#iletisim')];
let lastFocus = null, drawerT;
function openDrawer() {
  clearTimeout(drawerT);
  $('#toast').classList.remove('show');
  lastFocus = document.activeElement;
  drawer.hidden = false;
  void drawer.offsetWidth; // commit the closed position so the panel slides in
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
  outside().forEach(el => { el.inert = true; });
  setTimeout(() => $('.x', drawer).focus(), 60);
}
function closeDrawer() {
  if (drawer.hidden || !drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  document.body.style.overflow = '';
  outside().forEach(el => { el.inert = false; });
  drawerT = setTimeout(() => { drawer.hidden = true; }, 400);
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
}
$('#openQuote').addEventListener('click', openDrawer);
$$('[data-open-quote]').forEach(b => b.addEventListener('click', openDrawer));
$$('[data-close]', drawer).forEach(b => b.addEventListener('click', closeDrawer));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDrawer();
  if (e.key === 'Tab' && !drawer.hidden) {
    const f = $$('button, a[href], input, textarea', drawer).filter(x => x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
let toastT;
function toast(msg) {
  $('#toastTxt').textContent = msg;
  const t = $('#toast'); t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3800);
  const q = $('#openQuote'); q.classList.remove('bump'); void q.offsetWidth; q.classList.add('bump');
}
$('#toastBtn').addEventListener('click', () => { $('#toast').classList.remove('show'); openDrawer(); });
renderQuote();

/* ---------- product page ---------- */
let viewer = null, state = null, cur = null, viewerMod = null, lastVKey = '';
const loadViewer = () => (viewerMod ||= import('./viewer.js').catch(err => { viewerMod = null; throw err; }));
const ICON_PWR = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M8 1.8v5.4"/><path d="M4.6 4a5 5 0 1 0 6.8 0"/></svg>';

function finInfo(p, s) {
  if (p.group === 'table') {
    const f = FIN[s.fin];
    if (f.wood) return {
      hex: f.hex, metal: false, title: `${f.name} ahşap`, hexLabel: null, line: f.type,
      note: 'Ahşap doğal bir malzemedir; damar ve ton her üründe biraz farklıdır.', copy: `${f.name} ahşap`,
    };
    // Plated metals are not RAL colours: show the nearest reference without pretending to a hex value.
    if (f.metal > .5) return {
      hex: f.hex, metal: true, title: f.name, hexLabel: null,
      line: f.ral ? `${f.type} · en yakın referans RAL ${f.ral} ${f.ralName}` : `${f.type} · RAL karşılığı yok`,
      note: 'Kaplama tonu ekranda tam yansımaz; numune kartelayla doğrulanır.',
      copy: f.ral ? `${f.name} (en yakın RAL ${f.ral})` : `${f.name} kaplama`,
    };
    return { hex: RAL[f.ral][1], metal: false, title: `RAL ${f.ral}`, hexLabel: RAL[f.ral][1], line: `${f.ralName} · ${f.type}`, note: 'Ekran rengi yaklaşık değerdir; üretim fiziksel kartelaya göre yapılır.', copy: `RAL ${f.ral}` };
  }
  const r = RAL[s.ral];
  return { hex: r[1], hexLabel: r[1], metal: RAL_METALLIC.has(s.ral), title: `RAL ${s.ral}`, line: `${r[0]} · Elektrostatik toz boya`, note: 'Ekran rengi yaklaşık değerdir; üretim fiziksel kartelaya göre yapılır.', copy: `RAL ${s.ral}` };
}

function productHTML(p) {
  const isT = p.group === 'table';
  const swatches = isT
    ? p.fin.map(f => `<button type="button" data-fin="${f}" aria-label="${FIN[f].name}" title="${FIN[f].name}" style="background:${finSwatch(f)}"></button>`).join('')
    : p.rals.map(r => `<button type="button" data-ral="${r}" aria-label="RAL ${r} ${RAL[r][0]}" title="RAL ${r} ${RAL[r][0]}" style="background:${ralSwatch(r)}"></button>`).join('')
      + '<button type="button" class="custom" data-custom aria-expanded="false" aria-controls="ralInline"><i></i><span>RAL kodu girin</span></button>';
  const qtyHTML = id => `<div class="qty"><button type="button" data-q="-1" aria-label="Azalt">−</button><input id="${id}" type="number" inputmode="numeric" min="1" value="${state.qty}" aria-label="Adet"><button type="button" data-q="1" aria-label="Artır">+</button></div>`;
  return `<div class="wrap pv">
    <nav class="crumbs" aria-label="Konum"><a href="#koleksiyon" data-home>Koleksiyon</a><span aria-hidden="true">/</span><span>${isT ? 'Şarjlı masa lambaları' : 'LED armatürler'}</span><span aria-hidden="true">/</span><span style="color:var(--fg)">${esc(p.name)}</span></nav>
    <div class="pv-grid">
      <div class="viewer" id="viewer">
        <div class="v-load" id="vLoad"><span>3D sahne hazırlanıyor</span></div>
        <figure class="v-photo" id="vPhoto" hidden><img id="vPhotoImg" alt=""><figcaption id="vPhotoCap"></figcaption></figure>
        <div class="v-top">
          <div class="seg" role="group" aria-label="Görünüm"><button type="button" data-view="3d" aria-pressed="true">3D</button><button type="button" data-view="photo" aria-pressed="false">Fotoğraf</button></div>
          <div class="seg" id="modeSeg" role="group" aria-label="Ortam">${Object.entries(MODE_LABELS).map(([k, l]) => `<button type="button" data-mode="${k}" aria-pressed="false">${l}</button>`).join('')}</div>
        </div>
        <div class="v-bot">
          <div class="power">
            <button class="pwr" type="button" id="pwr" aria-pressed="true" aria-label="Işık"><i>${ICON_PWR}</i><span id="pwrTxt" aria-hidden="true">Açık</span></button>
            ${isT ? `<div class="dim" id="dim" role="group" aria-label="Işık seviyesi">${['Düşük', 'Orta', 'Yüksek'].map((n, i) => `<button type="button" data-l="${i}" aria-label="${n}" title="${n}"><b style="height:${5 + i * 5}px"></b></button>`).join('')}</div>` : ''}
          </div>
          <span class="v-hint">Sürükleyerek çevirin, tekerlekle yakınlaştırın</span>
        </div>
      </div>
      <div class="cfg">
        <div class="cfg-head"><h1>${esc(p.name)}</h1><span class="meta">${esc(p.meta)}</span><p>${esc(p.desc)}</p>
          <div class="price">${p.price ? `${tl(p.price)}’den başlayan fiyatlar<span> · adet ve kaplamaya göre değişir</span>` : '<span>Ölçü, adet ve seçeneklere göre projeye özel fiyatlandırılır</span>'}</div></div>
        <div class="opt"><div class="opt-h"><h2>${isT && FIN[p.fin[0]].wood ? 'Ahşap rengi' : 'Kasa rengi'}</h2><span id="finName"></span></div><div class="sw" id="sw">${swatches}</div>
          ${isT ? '' : '<div class="ral-inline" id="ralInline" hidden><div class="inp"><span>RAL</span><input id="pRal" inputmode="numeric" maxlength="4" placeholder="7016" aria-label="RAL kodu" aria-describedby="pRalMsg" autocomplete="off"></div><span class="msg" id="pRalMsg" aria-live="polite">Dört haneli RAL Classic kodu</span></div>'}
          <div class="code-card" id="codeCard"></div></div>
        ${p.shades ? `<div class="opt"><div class="opt-h"><h2>Abajur</h2><span id="shadeName"></span></div><div class="sw" id="shadeSw">${p.shades.map(s => `<button type="button" data-shade="${s}" aria-label="${SHADE[s].name} abajur" title="${SHADE[s].name}" style="background:${swatchBg(SHADE[s].hex, false)}"></button>`).join('')}</div></div>` : ''}
        <div class="opt"><div class="opt-h"><h2>Işık rengi</h2><span id="kName"></span></div>
          <div class="kopts" id="kopts" style="--n:${p.ks.length}">${p.ks.map(k => `<button type="button" class="kopt" data-k="${k}"><span class="sw-k" style="background:rgb(${rgbStr(k)})"></span><b>${k} K</b><span>${KINFO[k][0]}</span></button>`).join('')}</div>
          <p class="kdesc" id="kDesc"></p></div>
        ${isT ? `<div class="opt"><div class="opt-h"><h2>Batarya</h2><span>3D'de parlaklık farkını görün</span></div><div class="chips" id="pwrOpt">
            <button type="button" data-power="ekonomik">Ekonomik · 3 W<small>1×18650, 1500 mAh</small></button>
            <button type="button" data-power="premium">Premium · 5 W<small>2×18650, 1500–2200 mAh</small></button></div></div>`
          : `<div class="opt"><div class="opt-h"><h2>Profil yüksekliği</h2></div><div class="chips" id="profOpt">${['H5', 'H7,5', 'H10'].map(h => `<button type="button" data-prof="${h}">${h}<small>${{ H5: '5 cm', 'H7,5': '7,5 cm', H10: '10 cm' }[h]} gövde</small></button>`).join('')}</div></div>
          <div class="opt"><div class="opt-h"><h2>Kontrol ve acil kit</h2></div><div class="chips" id="ctrlOpt">${['On-Off', 'DALI'].map(c => `<button type="button" data-ctrl="${c}">${c}<small>${c === 'DALI' ? 'Dimlenebilir, otomasyon' : 'Anahtarla aç / kapa'}</small></button>`).join('')}</div>
          <div class="chips" id="emgOpt">${['Yok', '1 saat', '3 saat'].map(c => `<button type="button" data-emg="${c}">${c === 'Yok' ? 'Acil kit yok' : 'Acil kit · ' + c}</button>`).join('')}</div></div>`}
        <div class="opt actions-main"><div class="opt-h"><h2>Adet</h2></div><div class="actions">${qtyHTML('qty')}</div></div>
        <div class="summary"><h2>Seçiminiz</h2><dl id="sumList"></dl></div>
        <div class="actions actions-main"><button class="btn btn-amber" type="button" data-add>Teklif listesine ekle</button><a class="btn btn-line" data-ask href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg>WhatsApp'tan sorun</a></div>
      </div>
    </div>
    <div class="specs"><h2>Teknik özellikler</h2><dl class="spec-table">${(p.specs || (isT ? TABLE_SPECS : ARM_SPECS)).map(([a, b]) => `<div class="spec-row"><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></div>
    <div class="related"><h2>Diğer ürünler</h2><div class="rel-row">${P.filter(x => x.id !== p.id).map(o => `<a class="rel" href="#urun-${o.id}"><img src="${photoSrc(o, photoFor(o, o.def).key)}" alt="" loading="lazy"><div><b>${esc(o.name)}</b><span>${esc(o.meta)}</span></div></a>`).join('')}</div></div>
  </div>
  <div class="pbar">${qtyHTML('qty2')}<button class="btn btn-amber" type="button" data-add><span class="pb-l">Teklif listesine ekle<small id="pbSum"></small></span></button><a class="btn btn-line wa-mini" data-ask href="#" target="_blank" rel="noopener" aria-label="WhatsApp'tan sorun"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg></a></div>`;
}

function renderProduct(id) {
  const p = byId(id);
  cur = p;
  state = { fin: p.def.fin, shade: p.def.shade, ral: p.def.ral, k: p.def.k, power: 'premium', prof: 'H7,5', ctrl: 'On-Off', emg: 'Yok', qty: p.group === 'table' ? 10 : 1, on: true, lvl: 2, mode: 'aksam', view: '3d' };
  document.title = `${p.name} · LUMENX`;
  $('#product').innerHTML = productHTML(p);
  bindProduct();
  updateUI();
  initViewer(p);
}

function setQty(v) { state.qty = Math.max(1, Math.min(9999, v | 0)); $$('#qty, #qty2').forEach(i => { if (+i.value !== state.qty) i.value = state.qty; }); }

$('#product').addEventListener('click', e => {
  const p = cur; if (!p || !state) return;
  const t = e.target.closest('button, a'); if (!t) return;
  const d = t.dataset;
  if (d.fin) state.fin = d.fin;
  else if (d.ral) { state.ral = d.ral; const ri = $('#ralInline'); if (ri) ri.hidden = true; }
  else if ('custom' in d) { const ri = $('#ralInline'); ri.hidden = !ri.hidden; t.setAttribute('aria-expanded', !ri.hidden); if (!ri.hidden) $('#pRal').focus(); return; }
  else if (d.shade) state.shade = d.shade;
  else if (d.k) { state.k = +d.k; state.on = true; }
  else if (d.power) state.power = d.power;
  else if (d.prof) { state.prof = d.prof; if (viewer) { viewer.build(p, state); lastVKey = visualKey(state); } updateUI(); return; }
  else if (d.ctrl) state.ctrl = d.ctrl;
  else if (d.emg) state.emg = d.emg;
  else if (d.mode) state.mode = d.mode;
  else if (d.view) state.view = d.view;
  else if (d.l !== undefined && t.closest('#dim')) { state.lvl = +d.l; state.on = true; }
  else if (t.id === 'pwr') state.on = !state.on;
  else if (d.q) setQty(state.qty + +d.q);
  else if ('add' in d) { addToQuote(p); return; }
  else return;
  updateUI();
});

function bindProduct() {
  $$('#qty, #qty2').forEach(i => {
    i.addEventListener('input', () => { const v = parseInt(i.value, 10); if (v > 0) { setQty(v); updateUI(); } });
    i.addEventListener('change', () => { setQty(parseInt(i.value, 10) || 1); updateUI(); });
  });
  const pr = $('#pRal');
  if (pr) pr.addEventListener('input', () => {
    pr.value = pr.value.replace(/\D/g, '');
    const c = pr.value, msg = $('#pRalMsg');
    if (c.length < 4) { msg.textContent = 'Dört haneli RAL Classic kodu'; return; }
    if (RAL[c]) { state.ral = c; msg.textContent = `${RAL[c][0]}: modele uygulandı`; updateUI(); }
    else msg.textContent = 'Bu kod listemizde yok; teklif notunda belirtin, numuneyle doğrulayalım.';
  });
}

const visualKey = s => [s.fin, s.shade, s.ral, s.k, s.on, s.lvl, s.power, s.mode].join('|');
function updateUI() {
  const p = cur, s = state, isT = p.group === 'table';
  const press = (sel, key, val) => $$(sel).forEach(b => b.setAttribute('aria-pressed', b.dataset[key] === String(val)));
  press('#sw [data-fin]', 'fin', s.fin);
  press('#sw [data-ral]', 'ral', s.ral);
  const cb = $('#sw [data-custom]');
  if (cb) {
    const inList = p.rals.includes(s.ral);
    cb.classList.toggle('on', !inList);
    $('i', cb).style.background = inList ? '' : ralSwatch(s.ral);
    $('span', cb).textContent = inList ? 'RAL kodu girin' : `RAL ${s.ral}`;
  }
  const fi = finInfo(p, s);
  $('#finName').textContent = isT ? FIN[s.fin].name : `RAL ${s.ral} · ${RAL[s.ral][0]}`;
  $('#codeCard').innerHTML = `<i style="background:${swatchBg(fi.hex, fi.metal)}"></i><div><b>${fi.title}</b><p>${esc(fi.line)}</p><small>${esc(fi.note)}</small></div><button class="copy" type="button" id="copyCode">Kodu kopyala</button>`;
  $('#copyCode').onclick = async ev => {
    const b = ev.currentTarget;
    try { await navigator.clipboard.writeText(fi.copy); b.textContent = 'Kopyalandı'; } catch { b.textContent = fi.copy; }
    setTimeout(() => { if (b.isConnected) b.textContent = 'Kodu kopyala'; }, 1800);
  };
  if (p.shades) { press('#shadeSw [data-shade]', 'shade', s.shade); $('#shadeName').textContent = SHADE[s.shade].name; }
  press('#kopts [data-k]', 'k', s.k);
  $('#kName').textContent = `${s.k} K · ${KINFO[s.k][0]}`;
  $('#kDesc').textContent = `Önerilen kullanım: ${KINFO[s.k][1]}.`;
  press('#pwrOpt [data-power]', 'power', s.power);
  press('#profOpt [data-prof]', 'prof', s.prof);
  press('#ctrlOpt [data-ctrl]', 'ctrl', s.ctrl);
  press('#emgOpt [data-emg]', 'emg', s.emg);
  press('#modeSeg [data-mode]', 'mode', s.mode);
  press('[data-view]', 'view', s.view);
  updatePhoto(p, s);
  $('#pwr').setAttribute('aria-pressed', s.on);
  $('#pwrTxt').textContent = s.on ? 'Açık' : 'Kapalı';
  $$('#dim [data-l]').forEach(b => { const i = +b.dataset.l; b.classList.toggle('lit', s.on && i <= s.lvl); b.setAttribute('aria-pressed', s.on && i === s.lvl); });
  setGlow(s.k);
  const rows = isT
    ? [[FIN[s.fin].wood ? 'Gövde' : 'Kasa', FIN[s.fin].name + (FIN[s.fin].ral ? ` (RAL ${FIN[s.fin].ral})` : '')], ...(p.shades ? [['Abajur', SHADE[s.shade].name]] : []), ['Işık', `${s.k} K · ${KINFO[s.k][0]}`], ['Batarya', s.power === 'premium' ? 'Premium 5 W' : 'Ekonomik 3 W'], ['Adet', s.qty]]
    : [['Gövde', `RAL ${s.ral} · ${RAL[s.ral][0]}`], ['Işık', `${s.k} K · ${KINFO[s.k][0]}`], ['Profil', s.prof], ['Kontrol', s.ctrl], ['Acil kit', s.emg], ['Adet', s.qty]];
  $('#sumList').innerHTML = rows.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('');
  $('#pbSum').textContent = isT ? [FIN[s.fin].name, p.shades && SHADE[s.shade].name, `${s.k} K`].filter(Boolean).join(' · ') : `RAL ${s.ral} · ${s.k} K · ${s.prof}`;
  const href = wa(`Merhaba, ${p.name} hakkında bilgi almak istiyorum.\n${describe(snapshot(p))}, ${s.qty} adet`);
  $$('[data-ask]').forEach(a => { a.href = href; });
  // the 3D scene only re-lights when something it shows has changed (each apply re-renders shadows + probe)
  const vkey = visualKey(s);
  if (viewer && vkey !== lastVKey) { lastVKey = vkey; viewer.apply(s); }
}

function updatePhoto(p, s) {
  const box = $('#vPhoto');
  box.hidden = s.view !== 'photo';
  $('#viewer').classList.toggle('photo', !box.hidden);
  if (box.hidden) return;
  const ph = photoFor(p, s), img = $('#vPhotoImg'), src = photoSrc(p, ph.key);
  if (!img.src.endsWith(src)) { img.src = src; img.alt = `${p.name} stüdyo fotoğrafı`; }
  let cap = 'Stüdyo fotoğrafı';
  if (p.group === 'table') {
    const [f, sh] = ph.key.split('-');
    const pictured = FIN[f].name + (sh ? `, ${SHADE[sh].name.toLocaleLowerCase('tr')} abajur` : '');
    cap = ph.exact ? `Stüdyo fotoğrafı · ${pictured}` : `Fotoğraftaki: ${pictured}. Seçtiğiniz renk 3D görünümde.`;
  }
  $('#vPhotoCap').textContent = cap;
}

function snapshot(p) {
  const s = state;
  return p.group === 'table'
    ? { id: p.id, fin: s.fin, shade: p.shades ? s.shade : null, k: s.k, power: s.power, qty: s.qty }
    : { id: p.id, ral: s.ral, k: s.k, prof: s.prof, ctrl: s.ctrl, emg: s.emg, qty: s.qty };
}
function addToQuote(p) {
  const it = snapshot(p), key = JSON.stringify({ ...it, qty: 0 });
  const ex = quote.find(x => JSON.stringify({ ...x, qty: 0 }) === key);
  if (ex) ex.qty += it.qty; else quote.push(it);
  renderQuote();
  toast(`${p.name} · ${it.qty} adet eklendi`);
}

function initViewer(p) {
  const host = $('#viewer'), load = $('#vLoad');
  let v = null;
  loadViewer().then(async m => {
    // let the product page paint before the scene is built
    await new Promise(r => requestAnimationFrame(() => setTimeout(r)));
    await Promise.all([m.loadTextures(), p.kit && p.group === 'table' && m.preloadRoom(state.mode)]);
    if (cur !== p || !host.isConnected) return;
    const s = { ...state };
    v = new m.Viewer(host);
    await v.open(p, s);
    if (cur !== p || !host.isConnected) { v.dispose(); return; }
    viewer = v;
    lastVKey = visualKey(s);
    // options picked while the scene was loading
    if (state.prof !== s.prof) viewer.build(p, state);
    updateUI();
    load.classList.add('done');
  }).catch(err => {
    console.error(err);
    if (v) { try { v.dispose(); } catch { /* half-built */ } if (viewer === v) viewer = null; }
    if (cur !== p || !host.isConnected) return;
    load.classList.add('done');
    state.view = 'photo';
    $$('[data-view="3d"]').forEach(b => { b.disabled = true; b.title = 'Tarayıcınız 3D önizlemeyi desteklemiyor'; });
    updateUI();
  });
}

/* ---------- routing ---------- */
function route() {
  let h = location.hash.slice(1);
  try { h = decodeURIComponent(h); } catch { h = ''; }
  const prodId = h.startsWith('urun-') && byId(h.slice(5)) ? h.slice(5) : null;
  if (viewer) { viewer.dispose(); viewer = null; }
  closeDrawer();
  if (prodId) {
    $('#home').hidden = true; $('#product').hidden = false;
    document.body.classList.add('on-product');
    renderProduct(prodId);
    const h1 = $('.cfg-head h1'); h1.tabIndex = -1; h1.focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: 'instant' });
  } else {
    document.body.classList.remove('on-product');
    $('#product').hidden = true; $('#product').innerHTML = ''; $('#home').hidden = false; cur = null;
    document.title = 'LUMENX · Şarjlı masa lambaları ve LED armatürler';
    const el = h && document.getElementById(h);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));
    else scrollTo({ top: 0, behavior: 'instant' });
  }
  updateHeader();
}
// Same-hash clicks (e.g. "Koleksiyon" while already there) still scroll.
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-home]'); if (!a) return;
  const h = a.getAttribute('href').slice(1);
  if (location.hash === '#' + h && !$('#home').hidden) { e.preventDefault(); const el = document.getElementById(h); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
});
addEventListener('hashchange', route);
route();

// Warm up the 3D code in the background so the first product page opens fast (skipped on data saver). The kit
// lamps' restaurant is most of a product page's download, so it is fetched too (in the default mode, 'aksam').
if (!location.hash.startsWith('#urun-') && !(navigator.connection && navigator.connection.saveData)) {
  addEventListener('load', () => setTimeout(() => { (window.requestIdleCallback || setTimeout)(() => loadViewer().then(m => Promise.all([m.loadTextures(), m.preloadRoom('aksam')])).catch(() => {})); }, 2500));
}
