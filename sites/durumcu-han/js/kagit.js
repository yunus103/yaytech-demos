// The opening: a stack of full-screen paper sheets laid over the page. One gesture rolls the top
// sheet up into a tube (kraft paper on the outside) and reveals the next; the last one uncovers
// the menu. Each sheet is a 2D-canvas composition (photo + type) plus matching normal/material
// maps, so the shared warm light (isik.js) plays over the food while the sheet lies flat.
//
// The sheet is a strip mesh in "roll space" (rows parallel to the roll axis). The vertex shader
// wraps every row behind the contact line onto an Archimedean spiral, so the roll thickens as it goes.
const Kagit = (() => {
  const kok = document.documentElement;
  const katman = document.querySelector('.kagit');
  const tuval = katman.querySelector('.kagit-tuval');
  const adimlar = [...katman.querySelectorAll('.kagit-adim li')];
  const zorlaStatik = new URLSearchParams(location.search).has('statik');
  const gl = Isik.azHareket || zorlaStatik ? null
    : tuval.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });

  const URUN = new Map(MENU.flatMap((k) => k.gruplar.flatMap((g) => g.urunler.map((u) => [u.id, u]))));
  const YAPRAKLAR = [
    { foto: 'han-kebap-durum', giris: true },
    { foto: 'durum-kuzu-sis', etiket: 'Dürümler', urun: 'durum-kuzu-sis', not: '120 gr' },
    { foto: 'menu-adana', etiket: 'Menüler', urun: 'menu-adana', not: 'Çiğ köfte, halka tatlı ve ayran dahil' },
    { foto: 'tava-kilis', etiket: 'Tavalar', urun: 'tava-kilis', not: 'Çiğ köfte, halka tatlı ve ayran dahil' },
    { foto: '2li-adana', etiket: '2 kişilik', urun: '2li-adana', not: '2 dürüm, 2 halka tatlı, çiğ köfte, 1 lt içecek' },
  ];
  for (const y of YAPRAKLAR) {
    if (y.giris) continue;
    const u = URUN.get(y.urun);
    y.baslik = u.ad;
    y.fiyat = fiyatYaz(u.fiyat);
  }
  const N = YAPRAKLAR.length;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    katman.querySelector('.kagit-ipucu-yazi').textContent = 'Kaydırın ya da ↓ tuşuna basın';
  }

  // Screen-reader copy of the sheets; also what crawlers see.
  katman.querySelector('.kagit-metin').innerHTML = YAPRAKLAR.map((y) => y.giris
    ? `<h1>Dürümcü Han</h1><p>Ocakbaşı dürüm. ${ISLETME.adres}. ${ISLETME.saatler.metin}.</p>`
    : `<h2>${y.baslik}</h2><p>${y.etiket}. ${y.not}. ${y.fiyat}</p>`).join('');

  if (!gl) {
    kok.classList.add('kagit-yok');
    return { aktif: () => false };
  }
  kok.classList.add('kagit-acik');

  const KAMERA = 3.2;             // camera distance; the z=0 plane spans exactly the viewport (height 2)
  const ACI = 7 * Math.PI / 180;  // roll axis tilt, so it reads as hand-rolled
  const R_IC = 0.035;             // innermost radius of the spiral
  const R_DIS = 0.15;             // outer radius once the whole sheet is rolled
  const SATIR = 900;

  const VS = `
    attribute vec2 aPos;
    uniform vec2 uYari;
    uniform float uF, uL, uK, uRIc, uSar, uAspect, uKamera;
    uniform mat2 uDon;
    uniform mat4 uProj;
    varying vec2 vUv, vArka;
    varying vec3 vNormal, vPos;
    varying float vBoy, vTeta;
    void main() {
      float xr = aPos.x * uYari.x;
      float u = aPos.y * uL;
      float sarilan = min(uF, uL);
      float ro = sqrt(uRIc * uRIc + 2.0 * uK * sarilan);
      float boy = u, z = 0.0, teta = 0.0;
      vec2 n = vec2(0.0, 1.0);
      if (uSar > 0.5 && u < sarilan) {
        float a = sarilan - u;
        teta = (ro - sqrt(max(ro * ro - 2.0 * uK * a, uRIc * uRIc))) / uK;
        float th = teta + max(uF - uL, 0.0) / ro;
        float r = ro - uK * teta;
        boy = uF - r * sin(th);
        z = ro - r * cos(th);
        n = vec2(sin(th), cos(th));
      }
      vec2 duz = uDon * vec2(xr, u - uYari.y);
      vec3 p = vec3(uDon * vec2(xr, boy - uYari.y), z);
      vNormal = vec3(uDon * vec2(0.0, n.x), n.y);
      vUv = vec2(duz.x / (2.0 * uAspect) + 0.5, duz.y * 0.5 + 0.5);
      vArka = vec2(xr, u);
      vPos = p;
      vBoy = boy;
      vTeta = teta;
      gl_Position = uProj * vec4(p.xy, p.z - uKamera, 1.0);
    }`;

  const FS = `
    precision highp float;
    uniform sampler2D uRenk, uNorm, uMalz, uBaski;
    uniform float uDokuVar, uF, uRo, uKamera, uGolge, uAspect;
    varying vec2 vUv, vArka;
    varying vec3 vNormal, vPos;
    varying float vBoy, vTeta;
    ${Isik.GLSL}

    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p), w = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), w.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), w.x), w.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
      return v;
    }
    // Back of the sheet: the shop's kraft wrapping paper, fibres and all, with the logo printed on it.
    vec3 kraft(vec2 p) {
      vec2 q = p * 9.0;
      vec3 c = mix(vec3(0.73, 0.56, 0.37), vec3(0.83, 0.67, 0.47), fbm(q * 0.5));
      c *= 0.91 + 0.09 * noise(vec2(q.x * 30.0, q.y * 1.7)) + 0.05 * noise(vec2(q.x * 1.2 + 5.0, q.y * 32.0));
      c = mix(c, vec3(0.5, 0.36, 0.22), smoothstep(0.88, 0.97, noise(q * 15.0)) * 0.35);
      vec3 baski = texture2D(uBaski, p * vec2(0.85, 0.85) + vec2(0.13, 0.4)).rgb;
      return c * mix(vec3(1.0), baski, 0.55);
    }

    void main() {
      vec3 L = normalize(vec3(-0.25, 0.8, 0.55));
      vec3 V = normalize(vec3(0.0, 0.0, uKamera) - vPos);
      vec3 n = normalize(vNormal);
      vec3 renk;
      float alfa = 1.0;
      if (uDokuVar < 0.5) {
        renk = vec3(0.0);
        alfa = 0.0;
      } else if (gl_FrontFacing) {
        vec3 taban = dogrusal(texture2D(uRenk, vUv).rgb);
        vec3 m = texture2D(uMalz, vUv).rgb;
        vec3 nm = texture2D(uNorm, vUv).rgb * 2.0 - 1.0;
        nm = normalize(vec3(nm.xy * 1.4, nm.z));
        float yemek = smoothstep(0.05, 0.35, m.b);
        // Lit in screen-height units; the curl itself is shaded by the roll's own normal.
        vec3 P = vec3(vUv.x * uAspect, vUv.y, m.r * 0.05 + vPos.z * 0.5);
        renk = isikla(taban, nm, P, m.g * yemek, mix(0.86, 0.66, yemek));
        if (vTeta > 0.0) {
          float kivrim = clamp(dot(n, L) / L.z, 0.15, 1.15);
          renk *= kivrim * (1.0 - 0.75 * smoothstep(1.4, 3.2, vTeta));
        }
        renk = ekran(renk);
      } else {
        renk = kraft(vArka);
        n = -n;
        vec3 H = normalize(L + V);
        float dif = max(dot(n, L), 0.0);
        float kenar = pow(1.0 - max(dot(n, V), 0.0), 2.0);
        renk = renk * (0.24 + 0.9 * dif) + pow(max(dot(n, H), 0.0), 18.0) * 0.07;
        renk *= 1.0 - 0.6 * kenar;
      }
      // Contact shadow of the roll: tight ahead of it, longer below it (light comes from the top).
      if (vTeta == 0.0 && uRo > 0.0) {
        float d = vBoy - uF;
        float g = d > 0.0
          ? 0.5 * exp(-pow(d / (0.5 * uRo), 2.0))
          : 0.72 * exp(-pow((d + 0.9 * uRo) / (1.3 * uRo), 2.0));
        g *= uGolge;
        if (uDokuVar < 0.5) alfa = g;
        else renk *= 1.0 - g;
      }
      gl_FragColor = vec4(renk * alfa, alfa);
    }`;

  const program = programKur(gl, FS, VS);
  if (!program) {
    kok.classList.remove('kagit-acik');
    kok.classList.add('kagit-yok');
    return { aktif: () => false };
  }
  const U = {};
  for (const ad of ['uYari', 'uF', 'uL', 'uK', 'uRIc', 'uSar', 'uAspect', 'uKamera', 'uDon', 'uProj',
    'uRenk', 'uNorm', 'uMalz', 'uBaski', 'uDokuVar', 'uRo', 'uGolge', 'uIsik', 'uGuc']) {
    U[ad] = gl.getUniformLocation(program, ad);
  }

  {
    const kose = [];
    for (let j = 0; j <= SATIR; j++) for (let i = 0; i <= 2; i++) kose.push(i - 1, j / SATIR);
    const dizin = [];
    for (let j = 0; j < SATIR; j++) {
      for (let i = 0; i < 2; i++) {
        const a = j * 3 + i, b = a + 1, c = a + 3, d = c + 1;
        dizin.push(a, b, c, b, d, c);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(kose), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dizin), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }
  const DIZIN_SAYISI = SATIR * 2 * 6;

  gl.uniform1f(U.uKamera, KAMERA);
  gl.uniform1f(U.uRIc, R_IC);
  gl.uniformMatrix2fv(U.uDon, false, [Math.cos(ACI), Math.sin(ACI), -Math.sin(ACI), Math.cos(ACI)]);
  gl.uniform1i(U.uRenk, 0);
  gl.uniform1i(U.uNorm, 1);
  gl.uniform1i(U.uMalz, 2);
  gl.uniform1i(U.uBaski, 3);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // ---------- Sheet compositions ----------
  const RENK = { kemik: '#efe7d7', kul: '#8f9c95', altin: '#dcb96f', cizgi: '#c9a45c' };
  const BAS = '"Big Shoulders Display", "Arial Narrow", sans-serif';
  const MET = '"Hanken Grotesk", system-ui, sans-serif';

  function sar(x, metin, genislik) {
    const satirlar = [];
    let s = '';
    for (const k of metin.split(' ')) {
      const d = s ? `${s} ${k}` : k;
      if (s && x.measureText(d).width > genislik) { satirlar.push(s); s = k; } else s = d;
    }
    if (s) satirlar.push(s);
    // Two lines: move the break to where both halves are closest in width.
    if (satirlar.length === 2) {
      const kelimeler = metin.split(' ');
      let enIyi = null;
      for (let k = 1; k < kelimeler.length; k++) {
        const a = kelimeler.slice(0, k).join(' '), b = kelimeler.slice(k).join(' ');
        const en = Math.max(x.measureText(a).width, x.measureText(b).width);
        if (en <= genislik && (!enIyi || en < enIyi[0])) enIyi = [en, a, b];
      }
      if (enIyi) return [enIyi[1], enIyi[2]];
    }
    return satirlar;
  }

  function yazi(x, font, renk, aralik = '0px') {
    x.font = font;
    x.fillStyle = renk;
    if ('letterSpacing' in x) x.letterSpacing = aralik;
  }

  // The two-square star from the grill's cast panel, as on the menu.
  function yildiz(x, cx, cy, r, renk, kalin) {
    x.save();
    x.translate(cx, cy);
    x.strokeStyle = renk;
    x.lineWidth = kalin;
    for (const a of [0, Math.PI / 4]) {
      x.save();
      x.rotate(a);
      x.strokeRect(-r, -r, r * 2, r * 2);
      x.restore();
    }
    x.restore();
  }

  // Draws an image with all four edges feathered to transparent.
  function yumusakCiz(x, img, px, py, s) {
    const t = document.createElement('canvas');
    t.width = t.height = Math.max(1, Math.round(s));
    const c = t.getContext('2d');
    c.drawImage(img, 0, 0, t.width, t.height);
    c.globalCompositeOperation = 'destination-in';
    for (const [x0, y0, x1, y1] of [[0, 0, 0, t.height], [0, 0, t.width, 0]]) {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.14, '#000');
      g.addColorStop(0.86, '#000');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, t.width, t.height);
    }
    x.drawImage(t, px, py);
  }

  function tuvalYap(w, h, zemin) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    if (zemin) { x.fillStyle = zemin; x.fillRect(0, 0, w, h); }
    return [c, x];
  }

  async function yaprakCiz(y, o) {
    const [[foto, norm, malz], logo] = await Promise.all([haritaYukle(y.foto, 1200), resimYukle('img/logo.svg')]);
    const [renk, x] = tuvalYap(o.W, o.H);
    const zemin = x.createRadialGradient(o.W * 0.5, o.H * 0.4, 0, o.W * 0.5, o.H * 0.4, Math.hypot(o.W, o.H) * 0.6);
    zemin.addColorStop(0, '#08201a');
    zemin.addColorStop(1, '#030e0b');
    x.fillStyle = zemin;
    x.fillRect(0, 0, o.W, o.H);
    x.textBaseline = 'alphabetic';

    const yatay = o.W > o.H * 1.15;
    const yerlesim = yatay ? yatayYerlesim(x, y, o) : dikeyYerlesim(x, y, o);
    const { px, py, s } = yerlesim.foto;
    yumusakCiz(x, foto, px, py, s);
    yerlesim.ciz(logo);

    // Maps at half resolution, laid out exactly like the photo: flat and matte everywhere else.
    const [normal, nx] = tuvalYap(o.W >> 1, o.H >> 1, 'rgb(128,128,255)');
    yumusakCiz(nx, norm, px / 2, py / 2, s / 2);
    const [malzeme, mx] = tuvalYap(o.W >> 1, o.H >> 1, '#000');
    yumusakCiz(mx, malz, px / 2, py / 2, s / 2);
    return [renk, normal, malzeme];
  }

  function dikeyYerlesim(x, y, o) {
    const { W } = o;
    const pad = W * 0.07;
    const taban = o.gorunur - o.alt;
    const ust = o.ust;
    if (y.giris) {
      const bPx = W * 0.15, nPx = W * 0.036;
      const notlar = [ISLETME.adres.split(',').slice(0, 2).join(','), ISLETME.saatler.metin];
      const notY = taban - nPx * 1.5;
      const cizgiY = notY - nPx * 2.2;
      const bY = cizgiY - W * 0.06;
      const lw = W * 0.5, lh = lw * 222 / 330;
      const alanUst = ust + lh + W * 0.02, alanAlt = bY - bPx * 0.95;
      const s = Math.min(W * 1.2, (alanAlt - alanUst) * 1.15);
      return {
        foto: { px: (W - s) / 2, py: alanUst + (alanAlt - alanUst - s) / 2, s },
        ciz(logo) {
          x.drawImage(logo, (W - lw) / 2, ust, lw, lh);
          x.textAlign = 'center';
          yazi(x, `800 ${bPx}px ${BAS}`, RENK.kemik, '0.01em');
          x.fillText('OCAKBAŞI DÜRÜM', W / 2, bY);
          x.strokeStyle = 'rgba(201,164,92,.55)';
          x.lineWidth = Math.max(1, W * 0.0025);
          x.beginPath();
          x.moveTo(W * 0.2, cizgiY); x.lineTo(W * 0.45, cizgiY);
          x.moveTo(W * 0.55, cizgiY); x.lineTo(W * 0.8, cizgiY);
          x.stroke();
          yildiz(x, W / 2, cizgiY, W * 0.018, RENK.cizgi, Math.max(1, W * 0.003));
          yazi(x, `500 ${nPx}px ${MET}`, RENK.kul);
          notlar.forEach((s2, k) => x.fillText(s2, W / 2, notY + k * nPx * 1.5));
        },
      };
    }
    const fPx = W * 0.2, bPx = W * 0.175, nPx = W * 0.037, ePx = W * 0.032;
    yazi(x, `800 ${bPx}px ${BAS}`, RENK.kemik);
    const bSatir = sar(x, y.baslik.toLocaleUpperCase('tr-TR'), W - pad * 2);
    yazi(x, `500 ${nPx}px ${MET}`, RENK.kul);
    const nSatir = sar(x, y.not, W * 0.5);
    const bAlt = taban - fPx * 0.92 - W * 0.04;
    const bUst = bAlt - (bSatir.length - 1) * bPx * 1.02;
    const eY = bUst - bPx * 0.95;
    const alanAlt = eY - ePx * 1.6;
    const s = Math.min(W * 1.2, (alanAlt - ust) * 1.12);
    return {
      foto: { px: (W - s) / 2, py: ust + (alanAlt - ust - s) / 2, s },
      ciz() {
        x.textAlign = 'right';
        yazi(x, `800 ${fPx}px ${BAS}`, RENK.altin);
        x.fillText(y.fiyat, W - pad, taban);
        x.textAlign = 'left';
        yazi(x, `500 ${nPx}px ${MET}`, RENK.kul);
        nSatir.forEach((s2, k) => x.fillText(s2, pad, taban - (nSatir.length - 1 - k) * nPx * 1.4));
        yazi(x, `800 ${bPx}px ${BAS}`, RENK.kemik);
        bSatir.forEach((s2, k) => x.fillText(s2, pad, bUst + k * bPx * 1.02));
        yildiz(x, pad + ePx * 0.5, eY - ePx * 0.35, ePx * 0.42, RENK.cizgi, Math.max(1, W * 0.0028));
        yazi(x, `600 ${ePx}px ${MET}`, RENK.cizgi, '0.16em');
        x.fillText(y.etiket.toLocaleUpperCase('tr-TR'), pad + ePx * 1.6, eY);
      },
    };
  }

  function yatayYerlesim(x, y, o) {
    const { W, H } = o;
    const pad = Math.max(W * 0.06, H * 0.09);
    const s = Math.min(H * 1.06, W * 0.6);
    const foto = { px: W * 0.68 - s / 2, py: (H - s) / 2 + H * 0.02, s };
    // Text column ends before the photo's visible part (its outer 12% is feathered away).
    const kolon = Math.min(W * 0.38, foto.px + s * 0.12 - pad - W * 0.02);
    if (y.giris) {
      return {
        foto,
        ciz(logo) {
          const lw = Math.min(kolon * 0.75, H * 0.5), lh = lw * 222 / 330;
          x.textAlign = 'left';
          x.drawImage(logo, pad, H * 0.5 - lh - H * 0.06, lw, lh);
          // Fit the title to the text column so it never runs into the photo.
          yazi(x, `800 ${H * 0.11}px ${BAS}`, RENK.kemik, '0.01em');
          const olcek = Math.min(1, kolon / x.measureText('OCAKBAŞI DÜRÜM').width);
          yazi(x, `800 ${H * 0.11 * olcek}px ${BAS}`, RENK.kemik, '0.01em');
          x.fillText('OCAKBAŞI DÜRÜM', pad, H * 0.5 + H * 0.08);
          yildiz(x, pad + H * 0.012, H * 0.5 + H * 0.14, H * 0.011, RENK.cizgi, Math.max(1, H * 0.002));
          yazi(x, `500 ${H * 0.024}px ${MET}`, RENK.kul);
          x.fillText(ISLETME.adres.split(',').slice(0, 2).join(','), pad + H * 0.04, H * 0.5 + H * 0.148);
          x.fillText(ISLETME.saatler.metin, pad + H * 0.04, H * 0.5 + H * 0.188);
        },
      };
    }
    return {
      foto,
      ciz() {
        const bPx = H * 0.13;
        yazi(x, `800 ${bPx}px ${BAS}`, RENK.kemik);
        const bSatir = sar(x, y.baslik.toLocaleUpperCase('tr-TR'), kolon);
        const blokH = H * 0.04 + bSatir.length * bPx * 1.02 + H * 0.17;
        let yy = H * 0.5 - blokH / 2;
        x.textAlign = 'left';
        yildiz(x, pad + H * 0.011, yy - H * 0.008, H * 0.01, RENK.cizgi, Math.max(1, H * 0.002));
        yazi(x, `600 ${H * 0.022}px ${MET}`, RENK.cizgi, '0.16em');
        x.fillText(y.etiket.toLocaleUpperCase('tr-TR'), pad + H * 0.036, yy);
        yy += H * 0.03 + bPx * 0.82;
        yazi(x, `800 ${bPx}px ${BAS}`, RENK.kemik);
        for (const s2 of bSatir) { x.fillText(s2, pad, yy); yy += bPx * 1.02; }
        yy += H * 0.1;
        yazi(x, `800 ${H * 0.14}px ${BAS}`, RENK.altin);
        x.fillText(y.fiyat, pad, yy);
        yazi(x, `500 ${H * 0.024}px ${MET}`, RENK.kul);
        sar(x, y.not, kolon * 0.85).forEach((s2, k) => x.fillText(s2, pad, yy + H * 0.06 + k * H * 0.034));
      },
    };
  }

  // Logo printed once per tile on the kraft side, slightly rotated, like the shop's wrapping paper.
  async function baskiYap() {
    const logo = await resimYukle('img/logo.svg');
    const [c, x] = tuvalYap(512, 512, '#fff');
    x.translate(256, 256);
    x.rotate(-0.12);
    x.globalAlpha = 0.85;
    x.drawImage(logo, -110, -74, 220, 148);
    const doku = gl.createTexture();
    dokuYukle(gl, doku, 3, c, true);
  }

  // ---------- Layout ----------
  const dokular = [];
  let olcu = null;
  let L = 2, K = 0.01, fSon = 2.5, aspect = 1, fDinlen = 0.2;
  let hazir = false;

  function olcuAl() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = tuval.clientWidth, h = tuval.clientHeight;
    const mobil = innerWidth < 820;
    return {
      w, h, dpr,
      W: Math.round(w * dpr), H: Math.round(h * dpr),
      gorunur: Math.round(h * dpr),
      ust: Math.round((mobil ? 72 : 96) * dpr),
      alt: Math.round((mobil ? 112 : 96) * dpr),
    };
  }

  async function kur() {
    const yeni = olcuAl();
    olcu = yeni;
    tuval.width = yeni.W;
    tuval.height = yeni.H;
    gl.viewport(0, 0, yeni.W, yeni.H);
    aspect = yeni.w / yeni.h;
    const c = Math.cos(ACI), s = Math.sin(ACI);
    const yari = [(aspect * c + s) * 1.02, (aspect * s + c) * 1.02];
    L = yari[1] * 2;
    K = (R_DIS * R_DIS - R_IC * R_IC) / (2 * L);
    fSon = L + R_DIS * 3.4;
    // The tilted sheet overhangs the screen bottom; rest the curl just inside the visible edge.
    fDinlen = yari[1] - 1 + 0.12;
    const f = KAMERA, yak = 0.1, uzak = 20;
    gl.uniformMatrix4fv(U.uProj, false, [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (uzak + yak) / (yak - uzak), -1,
      0, 0, (2 * uzak * yak) / (yak - uzak), 0,
    ]);
    gl.uniform2f(U.uYari, yari[0], yari[1]);
    gl.uniform1f(U.uL, L);
    gl.uniform1f(U.uK, K);
    gl.uniform1f(U.uAspect, aspect);

    const setler = await Promise.all(YAPRAKLAR.map((y) => yaprakCiz(y, yeni)));
    if (olcu !== yeni) return;  // a newer resize superseded this one
    setler.forEach((set, i) => {
      dokular[i] ??= [gl.createTexture(), gl.createTexture(), gl.createTexture()];
      set.forEach((cv, k) => dokuYukle(gl, dokular[i][k], k, cv));
    });
    hazir = true;
    kok.classList.add('kagit-hazir');
    Isik.iste();
  }

  // ---------- State: which sheet, how far rolled ----------
  let indeks = 0;       // sheet on top; N = all rolled away
  let anim = null;      // { j, f0, f1, t0, sure, bitince }
  let surukle = null;   // { j, yon, y0, f, ornek: [[t, y]] }
  let etkilesim = false;
  const baslangic = performance.now();

  const yumusat = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // At rest the top sheet's bottom edge stays curled a little and breathes, so it reads as paper.
  // Until the first gesture it also lifts higher every few seconds, in step with the hint.
  function dinlenme(simdi) {
    const s = (simdi - baslangic) / 1000;
    let f = fDinlen + 0.025 * Math.sin(s * 1.7);
    if (!etkilesim && indeks === 0) {
      const p = ((simdi - baslangic - 900) % 4200) / 1400;
      if (simdi - baslangic > 900 && p < 1) f += Math.sin(Math.PI * yumusat(p)) * 0.34;
    }
    return f;
  }

  function anlik(simdi) {
    if (anim) {
      const t = Math.min(1, (simdi - anim.t0) / anim.sure);
      const f = anim.f0 + (anim.f1 - anim.f0) * yumusat(t);
      const j = anim.j;
      if (t >= 1) { const b = anim.bitince; anim = null; b(); }
      return [j, f];
    }
    if (surukle) return [surukle.j, surukle.f];
    if (indeks < N) return [indeks, dinlenme(simdi)];
    return null;
  }

  function oynat(j, f0, f1, sure, bitince) {
    anim = { j, f0, f1, t0: performance.now(), sure, bitince };
    Isik.iste();
  }

  function sayaciYaz() {
    adimlar.forEach((li, k) => li.classList.toggle('dolu', k < indeks));
    adimlar.forEach((li, k) => li.classList.toggle('su', k === indeks));
    kok.classList.toggle('kagit-ilk', indeks === 0);
  }

  function ileri(hizli = false, sonra = null) {
    if (anim || surukle || indeks >= N) return false;
    etkilesim = true;
    const simdi = performance.now();
    oynat(indeks, anlik(simdi)[1], fSon, hizli ? 420 : 780, () => {
      indeks++;
      sayaciYaz();
      if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(6);
      if (indeks >= N) bitir();
      sonra?.();
    });
    return true;
  }

  function geri() {
    if (anim || surukle || indeks === 0) return false;
    etkilesim = true;
    if (kok.classList.contains('kagit-bitti')) ac();
    oynat(indeks - 1, fSon, dinlenme(performance.now() + 780), 780, () => {
      indeks--;
      sayaciYaz();
    });
    return true;
  }

  function bitir() {
    kok.classList.add('kagit-bitti');
    kok.classList.remove('kagit-acik');
    scrollTo({ top: 0, behavior: 'instant' });
    document.dispatchEvent(new CustomEvent('kagit:bitti'));
  }

  function ac() {
    scrollTo({ top: 0, behavior: 'instant' });
    kok.classList.remove('kagit-bitti');
    kok.classList.add('kagit-acik');
    Isik.iste();
  }

  // Back to the first sheet in one go (logo tap).
  function basaDon() {
    anim = surukle = null;
    indeks = 0;
    sayaciYaz();
    ac();
  }

  // Rolls every remaining sheet quickly, one after another.
  function hepsiniGec() {
    if (indeks >= N) return;
    if (anim) { setTimeout(hepsiniGec, 120); return; }
    ileri(true, () => { if (indeks < N) hepsiniGec(); });
  }

  // ---------- Input ----------
  // Touch: the curl follows the finger; on release it completes or falls back. One sheet per gesture.
  katman.addEventListener('touchstart', (e) => {
    if (anim || e.touches.length > 1) return;
    const y = e.touches[0].clientY;
    surukle = null;
    katman._y0 = y;
    katman._ornek = [[performance.now(), y]];
  }, { passive: true });

  katman.addEventListener('touchmove', (e) => {
    if (anim || katman._y0 == null) return;
    const y = e.touches[0].clientY;
    const dy = katman._y0 - y;
    const h = tuval.clientHeight;
    katman._ornek.push([performance.now(), y]);
    if (katman._ornek.length > 6) katman._ornek.shift();
    if (!surukle) {
      if (dy > 8 && indeks < N) surukle = { j: indeks, yon: 1, f0: anlik(performance.now())[1] };
      else if (dy < -8 && indeks > 0) surukle = { j: indeks - 1, yon: -1 };
      else return;
      etkilesim = true;
    }
    const yol = (Math.abs(dy) / h) * 2.3;
    surukle.f = surukle.yon === 1
      ? Math.min(fSon, surukle.f0 + yol)
      : Math.max(0, fSon - yol);
    Isik.iste();
  }, { passive: true });

  function birak() {
    const s = surukle;
    katman._y0 = null;
    if (!s) return;
    const o = katman._ornek;
    const [t0, y0] = o[0], [t1, y1] = o[o.length - 1];
    const hiz = t1 > t0 ? (y0 - y1) / (t1 - t0) : 0;  // px/ms, positive = upwards
    surukle = null;
    if (s.yon === 1) {
      const tamam = s.f / fSon > 0.3 || hiz > 0.35;
      const hedef = tamam ? fSon : dinlenme(performance.now());
      oynat(s.j, s.f, hedef, 220 + 520 * Math.abs(hedef - s.f) / fSon, () => {
        if (!tamam) return;
        indeks++;
        sayaciYaz();
        if (navigator.vibrate) navigator.vibrate(6);
        if (indeks >= N) bitir();
      });
    } else {
      const tamam = 1 - s.f / fSon > 0.3 || hiz < -0.35;
      const hedef = tamam ? dinlenme(performance.now()) : fSon;
      oynat(s.j, s.f, hedef, 220 + 520 * Math.abs(hedef - s.f) / fSon, () => {
        if (!tamam) return;
        indeks--;
        sayaciYaz();
      });
    }
  }
  katman.addEventListener('touchend', birak);
  katman.addEventListener('touchcancel', birak);

  // Wheel / trackpad: one step per gesture. Inertia keeps firing events, so the next step needs
  // a short pause in the stream (and the roll to have finished).
  let tekerKilit = false, tekerZaman = 0, birikim = 0;
  addEventListener('wheel', (e) => {
    const simdi = performance.now();
    const ara = simdi - tekerZaman;
    tekerZaman = simdi;
    const acik = kok.classList.contains('kagit-acik');
    if (!acik) {
      // Scrolling up past the top of the page brings the last sheet back down.
      if (scrollY > 0 || e.deltaY >= 0 || !hazir) return;
      e.preventDefault();
      if (tekerKilit && ara < 220) return;
      tekerKilit = true;
      geri();
      return;
    }
    e.preventDefault();
    if (tekerKilit) {
      if (ara > 220 && !anim) tekerKilit = false;
      else return;
    }
    if (ara > 220) birikim = 0;
    birikim += e.deltaY;
    if (Math.abs(birikim) > 30) {
      if (birikim > 0) ileri(); else geri();
      tekerKilit = true;
      birikim = 0;
    }
  }, { passive: false });

  // Pulling down at the very top of the page also brings the last sheet back.
  let cekY = null;
  addEventListener('touchstart', (e) => {
    cekY = kok.classList.contains('kagit-bitti') && scrollY <= 0 ? e.touches[0].clientY : null;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (cekY === null || scrollY > 0) return;
    if (e.touches[0].clientY - cekY > 90) { cekY = null; geri(); }
  }, { passive: true });

  addEventListener('keydown', (e) => {
    if (!kok.classList.contains('kagit-acik') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ileri(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); geri(); }
  });

  katman.querySelector('.kagit-gec').addEventListener('click', (e) => { e.preventDefault(); hepsiniGec(); });
  Isik.dokunmaBagla(katman);

  // ---------- Drawing ----------
  function sayfaCiz(j, f, isik) {
    const ro = Math.sqrt(R_IC * R_IC + 2 * K * Math.min(f, L));
    const golge = Math.min(1, (fSon - f) / (R_DIS * 2));
    gl.uniform1f(U.uF, f);
    gl.uniform1f(U.uRo, f > 0 ? ro : 0);
    gl.uniform1f(U.uGolge, golge);
    gl.uniform3f(U.uIsik, isik.x / olcu.h, 1 - isik.y / olcu.h, 0.42);
    gl.uniform1f(U.uGuc, 1 - (1 - isik.guc) ** 3);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Next sheet (or nothing, for the last one) lies flat underneath and catches the roll's shadow.
    const bagla = (set) => set.forEach((d, k) => { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, d); });
    gl.disable(gl.DEPTH_TEST);
    gl.uniform1f(U.uSar, 0);
    const alttaki = dokular[j + 1];
    gl.uniform1f(U.uDokuVar, alttaki ? 1 : 0);
    if (alttaki) bagla(alttaki);
    gl.drawElements(gl.TRIANGLES, DIZIN_SAYISI, gl.UNSIGNED_SHORT, 0);

    gl.enable(gl.DEPTH_TEST);
    gl.uniform1f(U.uSar, 1);
    gl.uniform1f(U.uDokuVar, 1);
    bagla(dokular[j]);
    gl.drawElements(gl.TRIANGLES, DIZIN_SAYISI, gl.UNSIGNED_SHORT, 0);
  }

  Isik.ekle((isik, simdi) => {
    if (!hazir || !kok.classList.contains('kagit-acik')) return false;
    const a = anlik(simdi);
    if (!a) { gl.clear(gl.COLOR_BUFFER_BIT); return false; }
    const [j, f] = a;
    sayfaCiz(j, f, isik);
    return true;
  });

  let sonW = 0, sonH = 0, zamanlayici = 0;
  addEventListener('resize', () => {
    const w = innerWidth, h = innerHeight;
    if (w === sonW && Math.abs(h - sonH) < 140) return;
    sonW = w;
    sonH = h;
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(kur, 180);
  });

  // A deep link (e.g. #adres) skips the sheets.
  if (location.hash && location.hash !== '#') {
    indeks = N;
    kok.classList.add('kagit-bitti');
    kok.classList.remove('kagit-acik');
  }
  sayaciYaz();
  // The paper sits over the top of the page; a restored scroll position would hide the menu's start.
  if (kok.classList.contains('kagit-acik')) {
    history.scrollRestoration = 'manual';
    scrollTo({ top: 0, behavior: 'instant' });
  }

  Promise.all([
    document.fonts.load(`800 40px ${BAS}`),
    document.fonts.load(`500 20px ${MET}`),
    document.fonts.load(`600 20px ${MET}`),
  ]).catch(() => {}).finally(() => {
    sonW = innerWidth;
    sonH = innerHeight;
    baskiYap().then(kur);
  });

  return {
    aktif: () => kok.classList.contains('kagit-acik'),
    basaDon,
    // Test hook: freeze sheet j at roll f (null releases it).
    dondur(j, f) { surukle = j === null ? null : { j, f, yon: 1 }; Isik.iste(); },
  };
})();
