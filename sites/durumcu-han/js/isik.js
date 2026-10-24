// One warm light shared by every lit surface on the page (the paper sheets and the menu niches).
// Desktop: the mouse moves it. Touch: a finger on a lit surface, or device tilt (Android; iOS
// needs a permission prompt we don't force). Otherwise it drifts slowly around the focus.
const Isik = (() => {
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dokunmatik = matchMedia('(pointer: coarse)').matches;

  const durum = { x: innerWidth * 0.35, y: innerHeight * 0.3, guc: azHareket ? 1 : 0 };
  const girdi = { x: 0, y: 0, zaman: -1e9, omur: 0, hiz: 7 };
  const egim = { aktif: false, g0: null, b0: null, x: 0, y: 0, zaman: -1e9 };
  const cizerler = new Set();
  let odak = () => null;
  let raf = 0;
  let son = performance.now();

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    Object.assign(girdi, { x: e.clientX, y: e.clientY, zaman: performance.now(), omur: 7000, hiz: 7 });
    iste();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { girdi.zaman = -1e9; });

  // Touch only steers the light on surfaces that opt in, so scrolling the menu doesn't drag it around.
  function dokunmaBagla(el) {
    const dokun = (e) => {
      const t = e.touches[0];
      if (!t) return;
      Object.assign(girdi, { x: t.clientX, y: t.clientY, zaman: performance.now(), omur: 2500, hiz: 9 });
      iste();
    };
    el.addEventListener('touchstart', dokun, { passive: true });
    el.addEventListener('touchmove', dokun, { passive: true });
  }

  if (!azHareket && dokunmatik && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null) return;
      const aci = (screen.orientation && screen.orientation.angle) || 0;
      let gx = e.gamma, gy = e.beta;
      if (aci === 90) { gx = e.beta; gy = -e.gamma; } else if (aci === 270) { gx = -e.beta; gy = e.gamma; }
      if (egim.g0 === null) { egim.g0 = gx; egim.b0 = gy; }
      // The baseline slowly follows how the phone is held, so any grip starts centred.
      egim.g0 += (gx - egim.g0) * 0.004;
      egim.b0 += (gy - egim.b0) * 0.004;
      const kirp = (v) => Math.max(-1.3, Math.min(1.3, v));
      const x = kirp((gx - egim.g0) / 18), y = kirp((gy - egim.b0) / 18);
      if (Math.abs(x - egim.x) + Math.abs(y - egim.y) > 0.01) {
        Object.assign(egim, { aktif: true, x, y, zaman: performance.now() });
        iste();
      }
    });
  }

  function hedef(simdi) {
    if (simdi - girdi.zaman < girdi.omur) return [girdi.x, girdi.y, girdi.hiz];
    const r = odak();
    if (!r) return null;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (egim.aktif && simdi - egim.zaman < 6000) return [cx + egim.x * r.width * 0.42, cy + egim.y * r.height * 0.42, 10];
    if (azHareket) return [cx - r.width * 0.2, cy - r.height * 0.24, 100];
    const s = simdi / 1000;
    // Slow Lissajous drift, biased to the upper half like a lamp above the table.
    return [cx + Math.cos(s * 0.23) * r.width * 0.34, cy - r.height * 0.08 + Math.sin(s * 0.31) * r.height * 0.24, 1.6];
  }

  function kare(simdi) {
    raf = 0;
    const dt = Math.min(0.05, (simdi - son) / 1000);
    son = simdi;
    const h = hedef(simdi);
    if (h) {
      const k = 1 - Math.exp(-dt * h[2]);
      durum.x += (h[0] - durum.x) * k;
      durum.y += (h[1] - durum.y) * k;
    }
    if (durum.guc < 1) durum.guc = Math.min(1, durum.guc + dt * 0.7);
    let devam = false;
    for (const c of cizerler) if (c(durum, simdi, dt)) devam = true;
    if (devam) iste();
  }

  function iste() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(kare);
  }
  document.addEventListener('visibilitychange', () => { son = performance.now(); iste(); });

  // Shading shared by every lit surface. Units: 1 = surface width (niches) or height (sheets).
  const GLSL = `
    uniform vec3 uIsik;
    uniform float uGuc;
    const vec3 ISIK_RENK = vec3(1.0, 0.66, 0.38);
    const float SPEC_GUC = 0.5;    // sheen strength; raise if highlights get too dull
    const float NORMAL_GUC = 1.0;  // bump strength of the normal maps
    vec3 dogrusal(vec3 c) { return pow(c, vec3(2.2)); }
    vec3 ekran(vec3 c) {
      vec3 x = max(c - 0.72, 0.0);
      c = min(c, 0.72) + x / (1.0 + x * 3.6);  // soft knee: highlights roll off like film
      return pow(c, vec3(1.0 / 2.2));
    }
    // taban: linear albedo. Returns linear colour.
    vec3 isikla(vec3 taban, vec3 n, vec3 P, float parlak, float ortam) {
      vec3 L = uIsik - P;
      float d = length(L);
      vec3 l = L / d;
      float ndl = max(dot(n, l), 0.0);
      float sarma = max((dot(n, l) + 0.3) / 1.3, 0.0);  // wrapped diffuse: light spreads softly, less embossed
      float att = 1.0 / (1.0 + 5.0 * d * d);
      vec3 hv = normalize(l + vec3(0.0, 0.0, 1.0));
      float sert = 10.0 + 120.0 * pow(parlak, 1.5);
      // parlak squared: matte areas (raw kofte, bread) get almost no sheen, only truly glossy spots do.
      float yan = parlak * parlak * pow(max(dot(n, hv), 0.0), sert) * (sert + 8.0) / 50.0 * att * sqrt(ndl);
      return taban * (ortam + ISIK_RENK * sarma * att * 1.8 * uGuc) + ISIK_RENK * yan * SPEC_GUC * uGuc;
    }`;

  return {
    durum, azHareket, dokunmatik, GLSL,
    ekle(fn) { cizerler.add(fn); iste(); },
    odakla(fn) { odak = fn; iste(); },
    dokunmaBagla,
    iste,
  };
})();

// A lit product photo in a menu niche: draws one photo with its maps and cross-fades to the next.
class IsikliFoto {
  static FS = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uRenkA, uNormA, uMalzA, uRenkB, uNormB, uMalzB;
    uniform float uKarisim;
    uniform vec3 uZemin;
    ${Isik.GLSL}
    vec3 golgele(sampler2D renk, sampler2D norm, sampler2D malz) {
      vec3 m = texture2D(malz, vUv).rgb;
      vec3 n = texture2D(norm, vUv).rgb * 2.0 - 1.0;
      n = normalize(vec3(n.xy * NORMAL_GUC, n.z));
      vec3 taban = dogrusal(texture2D(renk, vUv).rgb);
      vec3 P = vec3(vUv, m.r * 0.1);
      // Short march through the height field towards the light for soft contact shadows.
      vec3 l = normalize(uIsik - P);
      float golge = 1.0, t = 0.012;
      for (int i = 0; i < 10; i++) {
        vec3 q = P + l * t;
        golge = min(golge, clamp(5.0 * (q.z - texture2D(malz, q.xy).r * 0.1) / t + 1.0, 0.0, 1.0));
        t += 0.02;
      }
      vec3 renkli = isikla(taban, n, P, m.g, 0.5) * mix(0.62, 1.0, golge);
      // m.b is the subject mask: the photo's noisy black backdrop becomes the page colour.
      return mix(uZemin, renkli, smoothstep(0.05, 0.35, m.b));
    }
    void main() {
      vec3 a = golgele(uRenkA, uNormA, uMalzA);
      vec3 b = uKarisim > 0.0 ? golgele(uRenkB, uNormB, uMalzB) : a;
      gl_FragColor = vec4(ekran(mix(a, b, uKarisim)), 1.0);
    }`;

  constructor(canvas, yukle) {
    this.canvas = canvas;
    this.yukle = yukle;  // slug -> Promise<[renk, normal, malzeme] images>
    this.gorunur = false;
    this.slug = null;
    this.karisim = 0;
    this.kirli = true;
    this.son = { x: NaN, y: NaN, guc: NaN };
  }

  kur() {
    if (this.gl !== undefined) return this.gl;
    const gl = this.canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
    this.gl = gl;
    if (!gl) return null;
    const prg = programKur(gl, IsikliFoto.FS);
    if (!prg) { this.gl = null; return null; }
    this.u = (ad) => gl.getUniformLocation(prg, ad);
    ['uRenkA', 'uNormA', 'uMalzA', 'uRenkB', 'uNormB', 'uMalzB'].forEach((ad, i) => gl.uniform1i(this.u(ad), i));
    gl.uniform3fv(this.u('uZemin'), [3, 14, 11].map((v) => (v / 255) ** 2.2));
    this.uIsik = this.u('uIsik');
    this.uGuc = this.u('uGuc');
    this.uKarisim = this.u('uKarisim');
    this.dokular = [0, 1, 2, 3, 4, 5].map(() => gl.createTexture());
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.canvas.hidden = true; });
    return gl;
  }

  boyutla() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.min(1024, Math.round(r.width * Math.min(devicePixelRatio || 1, 2))));
    if (this.canvas.width !== w) { this.canvas.width = this.canvas.height = w; this.kirli = true; }
  }

  // Load into slot B and fade over; the first photo goes straight to slot A.
  goster(slug) {
    if (slug === this.slug) return;
    this.slug = slug;
    const gl = this.kur();
    if (!gl) return;
    this.boyutla();
    this.yukle(slug).then((resimler) => {
      if (this.slug !== slug || gl.isContextLost()) return;
      const ilk = !this.hazir;
      resimler.forEach((img, i) => dokuYukle(gl, this.dokular[(ilk ? 0 : 3) + i], i + (ilk ? 0 : 3), img));
      this.hazir = true;
      this.canvas.classList.add('canli');
      if (ilk) { this.kirli = true; Isik.iste(); return; }
      this.gecis = performance.now();
      Isik.iste();
    }).catch(() => {});
  }

  ciz(isik, simdi) {
    if (!this.hazir || !this.gorunur) return false;
    const gl = this.gl;
    let gecisVar = false;
    if (this.gecis) {
      this.karisim = Math.min(1, (simdi - this.gecis) / 450);
      gecisVar = true;
      if (this.karisim >= 1) {
        // B becomes A: swap texture objects so the next photo loads into the free slot.
        for (let i = 0; i < 3; i++) [this.dokular[i], this.dokular[i + 3]] = [this.dokular[i + 3], this.dokular[i]];
        this.dokular.forEach((d, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, d); });
        this.karisim = 0;
        this.gecis = 0;
      }
    }
    const degisti = Math.abs(isik.x - this.son.x) + Math.abs(isik.y - this.son.y) > 0.1 || isik.guc !== this.son.guc;
    if (!(this.kirli || degisti || gecisVar)) return true;
    const r = this.canvas.getBoundingClientRect();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform3f(this.uIsik, (isik.x - r.left) / r.width, 1 - (isik.y - r.top) / r.height, 0.34);
    gl.uniform1f(this.uGuc, 1 - (1 - isik.guc) ** 3);
    gl.uniform1f(this.uKarisim, this.karisim);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.son = { x: isik.x, y: isik.y, guc: isik.guc };
    this.kirli = false;
    return true;
  }
}

// Full-screen quad program with the shared vertex shader.
function programKur(gl, fs, vs = 'attribute vec2 p; varying vec2 vUv; void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }') {
  const derle = (tur, kaynak) => {
    const s = gl.createShader(tur);
    gl.shaderSource(s, kaynak);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  try {
    const prg = gl.createProgram();
    gl.attachShader(prg, derle(gl.VERTEX_SHADER, vs));
    gl.attachShader(prg, derle(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prg);
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prg));
    gl.useProgram(prg);
    if (vs.includes('attribute vec2 p;')) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prg, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
    return prg;
  } catch (hata) {
    console.warn('Shader:', hata);
    return null;
  }
}

function dokuYukle(gl, doku, birim, kaynak, tekrar = false) {
  gl.activeTexture(gl.TEXTURE0 + birim);
  gl.bindTexture(gl.TEXTURE_2D, doku);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const sar = tekrar ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sar);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sar);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, kaynak);
}

function resimYukle(src) {
  return new Promise((tamam, hata) => {
    const img = new Image();
    img.onload = () => tamam(img);
    img.onerror = hata;
    img.src = src;
  });
}

// Colour photo + its normal and material maps for a slug.
const haritalar = new Map();
function haritaYukle(slug, renkW = 640) {
  const anahtar = `${slug}@${renkW}`;
  if (!haritalar.has(anahtar)) {
    haritalar.set(anahtar, Promise.all([
      resimYukle(fotoYolu(slug, renkW)),
      resimYukle(`assets/isik/${slug}-n.webp`),
      resimYukle(`assets/isik/${slug}-m.webp`),
    ]));
  }
  return haritalar.get(anahtar);
}
