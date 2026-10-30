// 3D product viewer. Everything is modelled procedurally in metres from the product photos' silhouettes.
// Light is physical (inverse-square, candela): the light inside a shade casts shadows through the shade, so
// it only leaves through the openings; linear LED profiles are made of RectAreaLights following the diffuser.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FIN, SHADE, RAL, RAL_METALLIC, kColor } from './data.js';
import { buildLamp, linenSet, loadKitTextures, tableWood } from './kit.js';
import { KIT } from './kit-specs.js';
import { forkGeometry, knifeGeometry } from './props.js';

RectAreaLightUniformsLib.init();

export const MODES = {
  gunduz: { label: 'Gündüz', env: .55, bg: '#b9b1a6', sun: 1.3, sunColor: '#fff6ec', exp: .8 },
  aksam:  { label: 'Akşam',  env: .14, bg: '#1b1e26', sun: .45, sunColor: '#93a7d8', exp: 2.3 },
  gece:   { label: 'Gece',   env: .004, bg: '#030303', sun: 0, sunColor: '#000000', exp: 3.1 },
};

const coarse = matchMedia('(pointer: coarse)').matches;
// Kit lamps: total output of the light leaving the shade (same 5 W class as Avior's main light)
const KIT_OUTPUT = 1.1;
// Share of it in the exit lights (the pool on the table and the room), relative to the shade's own glow: at 1 the
// table next to the foot came out hotter than in the product's table photo
const KIT_POOL = .78;
// Range of the exit lights' shadows: it covers the room; anything beyond it would read as shadowed. (The body is
// not in these maps, the table takes its shadow from the kit, so the bias only has to keep plates and napkins free
// of acne.)
const KIT_SHADOW_FAR = 4;
// Kit lamps at dusk: the lamp carries the scene (as in the product's own photos), so half the blue daylight and a
// little more exposure
const KIT_AKSAM = { ...MODES.aksam, env: .07, sun: .22, exp: 2.7 };
// Lamp output relative to daylight. Night/evening exposures compensate, so daylight can drown the lamp.
const LAMP = .4;
const luminance = c => .2126 * c.r + .7152 * c.g + .0722 * c.b;
const kLinear = k => new THREE.Color().setRGB(...kColor(k).map(v => v / 255), THREE.SRGBColorSpace);
const REF_LUM = luminance(kLinear(3000));

/* ---------- procedural textures (cached, shared between viewers) ---------- */
const texCache = {};
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }

function canvasTex(w, h, fn, srgb) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); const img = g.createImageData(w, h); const d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, gg, b] = fn(x, y); const i = (y * w + x) * 4;
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Walnut planks (albedo + a height map reused for bump and roughness) and wall plaster are baked by
// tools/bake-textures.py: computing them here blocked the page for ~1.5 s when a product opened.
// Must resolve before the first build().
let texLoad = null;
export function loadTextures() {
  const W = coarse ? 512 : 1024, loader = new THREE.TextureLoader();
  const get = (name, srgb) => loader.loadAsync(new URL(`../assets/tex/${name}`, import.meta.url).href).then(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
  return texLoad ||= Promise.all([get(`wood-${W}.webp`, true), get(`wood-bump-${W}.webp`), get('plaster.webp'), loadKitTextures()])
    .then(([albedo, bump, plaster]) => { texCache.wood = { albedo, bump }; texCache.plaster = plaster; })
    .catch(err => { texLoad = null; throw err; });
}

/* ---------- restaurant room (kit table lamps) ---------- */
// Built and baked once in Blender (tools/room), shared by every kit table lamp: geometry in room.glb, albedo
// textures, and one lightmap per mode. Drawn unlit (albedo x lightmap), so it costs a texture fetch per pixel and
// no lights. open() waits for it (app.js starts it with the textures) and it stays cached across products.
const ROOM_URL = new URL('../assets/room/', import.meta.url).href;
const ROOM_RES = coarse ? 'lo' : 'hi';
// material: [albedo texture, linear colour]. The same values the bake used for its bounce light.
const ROOM_ALBEDO = {
  plaster: ['plaster'], ceiling: ['plaster'], walnut: ['walnut'], panel: ['walnut', [.62, .55, .5]], parquet: ['parquet'],
  fabric: ['fabric'], art1: ['art1'], art2: ['art2'], paint: [null, [.66, .62, .55]], brass: [null, [.8, .6, .32]],
  ceramic: [null, [.86, .85, .82]], napkin: [null, [.035, .033, .031]], soil: [null, [.05, .035, .025]],
  potted_plant_01_leaves: ['potted_plant_01_leaves'], potted_plant_01_pot: ['potted_plant_01_pot'],
  potted_plant_02_leaves: ['potted_plant_02_leaves'], potted_plant_02_pot: ['potted_plant_02_pot'],
};
// what isn't lightmapped, per mode (before exposure): the street outside, the sheer curtains it backlights, the
// sconces' frosted glass (and the black 'void' behind the wainscot, which stays black)
const ROOM_FX = {
  gunduz: { view: 1, curtain: .6, glass: 1.2 },
  aksam: { view: .45, curtain: .04, glass: 2.5 },
  gece: { view: .32, curtain: .035, glass: 2.5 },
};
let roomLoad = null, roomData = null;

function roomTex(name, srgb = true) {
  return new THREE.TextureLoader().loadAsync(`${ROOM_URL}${name}-${ROOM_RES}.webp`).then(t => {
    // glTF UVs: no flip
    t.flipY = false; t.anisotropy = 8;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

function loadRoom(mode) {
  return roomLoad ||= (async () => {
    const draco = new DRACOLoader().setDecoderPath(new URL('libs/draco/gltf/', import.meta.resolve('three/addons/')).href);
    const names = [...new Set(Object.values(ROOM_ALBEDO).map(a => a[0]).filter(Boolean))];
    const lm = {}, view = {}, pending = {};
    // per-mode maps: the current mode's first, the others right after (a switch then finds them loaded)
    const perMode = m => (pending[m] ||= Promise.all([roomTex(`lm-${m}`), roomTex(`view-${m}`)]).then(([l, v]) => {
      l.channel = 1; l.wrapS = l.wrapT = THREE.ClampToEdgeWrapping; v.wrapS = v.wrapT = THREE.ClampToEdgeWrapping;
      // the atlas's islands sit a few texels apart: smaller mips would blend neighbours (light is smooth anyway)
      l.generateMipmaps = false; l.minFilter = THREE.LinearFilter;
      lm[m] = l; view[m] = v;
    }));
    const [gltf, meta, texs] = await Promise.all([
      new GLTFLoader().setDRACOLoader(draco).loadAsync(`${ROOM_URL}room.glb`),
      fetch(`${ROOM_URL}room.json`).then(r => r.json()),
      Promise.all(names.map(n => roomTex(n))),
      perMode(mode),
    ]);
    draco.dispose();
    const tex = Object.fromEntries(names.map((n, i) => [n, texs[i]]));
    const mats = {}, fx = {};
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const key = o.material.name.replace(/\.\d+$/, '');
      o.geometry.deleteAttribute('normal');
      if (key in ROOM_ALBEDO) {
        const [t, c] = ROOM_ALBEDO[key];
        // created with a lightmap: swapping it per mode then never changes the shader
        o.material = mats[key] ||= new THREE.MeshBasicMaterial({ name: key, map: t ? tex[t] : null, lightMap: lm[mode], color: c ? new THREE.Color().setRGB(...c, THREE.LinearSRGBColorSpace) : 0xffffff });
      } else {
        // 'void': the black board behind the wainscot (build.py)
        o.material = fx[key] ||= new THREE.MeshBasicMaterial({ name: key, color: key === 'void' ? 0 : 0xffffff, map: key === 'view' ? view[mode] : null, side: THREE.DoubleSide, transparent: key === 'curtain', opacity: .88, depthWrite: key !== 'curtain' });
      }
    });
    for (const m of ['gunduz', 'aksam', 'gece']) perMode(m).catch(() => { delete pending[m]; });
    return (roomData = { group: gltf.scene, meta, mats: Object.values(mats), fx, lm, view, perMode });
  })().catch(err => { roomLoad = null; throw err; });
}

// Starts the room's download (or joins it). Never rejects: without the room a kit lamp opens in the placeholder.
export function preloadRoom(mode = 'gece') {
  return loadRoom(mode).catch(err => { console.warn('room', err); });
}

// Pleat texture for the backlit shade: alternate facets transmit differently, fabric fibres add grain.
function pleatTex() {
  if (texCache.pleat) return texCache.pleat;
  return (texCache.pleat = canvasTex(128, 256, (x, y) => {
    const facet = x < 64 ? 1 : .62;
    const edge = 1 - .35 * Math.pow(Math.abs((x % 64) - 32) / 32, 6);
    const vert = .7 + .3 * Math.sin(Math.min(1, (1 - y / 255) * 1.1) * Math.PI * .92);
    const fibre = .9 + .1 * hash(x * .3, y);
    const v = 255 * facet * edge * vert * fibre;
    return [v, v, v];
  }));
}

function glowTex() {
  if (texCache.glow) return texCache.glow;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return (texCache.glow = new THREE.CanvasTexture(c));
}

/* ---------- geometry helpers ---------- */
const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// a smooth curve through the points: straight segments showed as kinks in the glass's reflections
const spline = (pts, n) => new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(n).map(v => [v.x, v.y]);

// Tableware profiles (metres, radius and height), each a closed solid turned from the axis under it, outside
// first, back to the axis inside or on top.
function tableware() {
  // dinner plate, Ø27 cm: a foot ring, a shallow well, the cavetto rising to a wide rim with a rolled edge
  const plate = [[0, .003], [.06, .003], [.062, 0], [.068, 0], [.07, .003], [.085, .008], [.1, .0155], [.128, .0195], [.134, .0205],
    [.1365, .022], [.1358, .0238], [.133, .0245], [.1, .0205], [.09, .017], [.083, .0115], [.078, .009], [0, .0085]];
  // wine glass: foot, drawn stem, tulip bowl with a 1.5 mm wall and a rounded rim
  const outer = spline([[.0062, .088], [.02, .095], [.038, .115], [.045, .15], [.043, .185], [.0398, .205]], 40);
  const inner = spline([[.0384, .205], [.0415, .185], [.0435, .15], [.0365, .116], [.019, .0975], [.004, .093]], 40);
  const wineGlass = [[0, 0], [.036, 0], [.0366, .0012], [.035, .0026], [.012, .0045], [.005, .009], [.0036, .016], [.0034, .075], [.0045, .084],
    ...outer, [.0393, .2058], ...inner, [0, .0925]];
  // the wine fills the bowl to 13 cm: its inner wall, a hair inside, closed by the surface
  const level = .13, wall = inner.filter(([, y]) => y < level).reverse().map(([r, y]) => [r - .0004, y]);
  const r = wall[wall.length - 1][0];
  const wine = [[0, .0932], ...wall, [r, level], [0, level]];
  // water tumbler: a heavy base and walls flaring a little to the rim
  const tumbler = [[0, 0], [.031, 0], [.0322, .0015], [.0345, .095], [.0345, .0965], [.0332, .0968], [.0318, .095], [.0296, .013], [.025, .011], [0, .0105]];
  // napkin folded in three: the top layer stops short, so its fold shows as a step along the long side
  const nap = (w, y, dx) => new RoundedBoxGeometry(w, .005, .2, 2, .0022).translate(dx, y, 0);
  const napkin = mergeGeometries([nap(.12, .0026, 0), nap(.084, .0076, .016)]);
  return {
    plate: lathe(plate), bread: lathe(plate.map(([r, y]) => [r * .6, y * .8])), napkin,
    wineGlass: lathe(wineGlass), wine: lathe(wine, 64), tumbler: lathe(tumbler),
  };
}

// Pleated (accordion) shade as an open frustum: n pleats, each two flat facets.
function pleatedShade(rt, rb, h, n, depth) {
  const pos = [], uv = [], N = n * 2;
  const pt = (i, top) => {
    const a = i / N * Math.PI * 2, inner = i % 2 === 1;
    const r = (top ? rt : rb) * (inner ? 1 - depth * (top ? .5 : 1) : 1);
    const y = top ? h : (inner ? .004 : 0);
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (let i = 0; i < N; i++) {
    const u0 = i % 2 ? .5 : 0, u1 = u0 + .5;
    const a = pt(i, false), b = pt(i + 1, false), c = pt(i + 1, true), d = pt(i, true);
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// Regular polygon frame (hexagon, square) as a flat shape with a hole.
function frameShape(n, R, w, rot) {
  const ri = R - w / Math.cos(Math.PI / n);
  const s = new THREE.Shape(), hole = new THREE.Path();
  for (let i = 0; i <= n; i++) {
    const a = rot + i / n * Math.PI * 2, f = i ? 'lineTo' : 'moveTo';
    s[f](Math.cos(a) * R, Math.sin(a) * R); hole[f](Math.cos(a) * ri, Math.sin(a) * ri);
  }
  s.holes.push(hole);
  return s;
}

function pointLight(dist, x, y, z) { const l = new THREE.PointLight(0xffffff, 0, dist, 2); l.position.set(x, y, z); return l; }

// Camera-like response for kit lamps: exposure, linear up to a soft knee, per channel. Per channel on purpose: a
// bright warm shade rolls off to yellow the way it does in the product photos instead of washing out to white,
// and below the knee colours stay exactly as authored. Output stays linear; OutputPass encodes it.
const KNEE = {
  uniforms: { tDiffuse: { value: null }, exposure: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float exposure; varying vec2 vUv;
    void main() {
      vec3 x = texture2D(tDiffuse, vUv).rgb * exposure;
      const float k = .72;
      x = mix(x, k + (1. - k) * (1. - exp(-(x - k) / (1. - k))), step(k, x));
      gl_FragColor = vec4(x, 1.);
    }`,
};

// Tiny specular points from close lights reach huge HDR values; bloom would smear them into blocks.
// Clamping (hue-preserving) far above display white changes nothing after tone mapping.
const CLAMP = {
  uniforms: { tDiffuse: { value: null }, maxv: { value: 4 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float maxv; varying vec2 vUv; void main() { vec4 c = texture2D(tDiffuse, vUv); float m = max(max(c.r, c.g), max(c.b, 1e-4)); gl_FragColor = vec4(c.rgb * min(1.0, maxv / m), c.a); }',
};

/* ---------- viewer ---------- */
export class Viewer {
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = { interactive: true, preserve: false, ...opts };
    const r = this.r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: this.opts.preserve, powerPreference: 'high-performance' });
    r.setPixelRatio(this.dpr = Math.min(devicePixelRatio || 1, this.opts.maxDpr || (coarse ? 1.5 : 1.75)));
    r.toneMapping = this.tone = { aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping }[this.opts.tone] || THREE.NeutralToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.shadowMap.autoUpdate = false;
    host.prepend(r.domElement);
    // iOS drops the GL context of background tabs; shadows and the probe must be rebuilt afterwards
    r.domElement.addEventListener('webglcontextlost', e => e.preventDefault());
    r.domElement.addEventListener('webglcontextrestored', () => { this.shadowsStale = true; if (this.lastState) this.apply(this.lastState); });

    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, 1, .02, 60);
    this.pm = new THREE.PMREMGenerator(r);
    const room = new RoomEnvironment();
    this.roomEnv = this.pm.fromScene(room, .04).texture;
    room.dispose();
    this.scene.environment = this.roomEnv;
    // Probe: the lit scene is captured into a cube map and used as the environment, so metal reflects the
    // glowing shade and the warm table, and walls/ceiling receive one bounce of the lamp's light.
    this.cubeRT = new THREE.WebGLCubeRenderTarget(coarse ? 64 : 128, { type: THREE.HalfFloatType });
    this.cubeCam = new THREE.CubeCamera(.01, 30, this.cubeRT);
    this.probe = new THREE.Vector3();
    this.shadeProbe = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

    this.sun = new THREE.DirectionalLight(0xffffff, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -.0004;
    this.sun.shadow.normalBias = .02;
    Object.assign(this.sun.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: .5, far: 14 });
    this.scene.add(this.sun, this.sun.target);
    this.bounce = new THREE.HemisphereLight(0xffffff, 0xffffff, 0);
    this.scene.add(this.bounce);

    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.composer.addPass(new ShaderPass(CLAMP));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .32, .4, 1.0);
    this.composer.addPass(this.bloom);
    this.knee = new ShaderPass(KNEE);
    this.knee.enabled = false;
    this.composer.addPass(this.knee);
    this.composer.addPass(new OutputPass());

    if (this.opts.interactive) {
      const c = this.ctl = new OrbitControls(this.cam, r.domElement);
      c.enableDamping = true; c.dampingFactor = .08; c.enablePan = false; c.rotateSpeed = .65; c.zoomSpeed = .8;
      c.addEventListener('start', () => { this.moved = true; host.classList.add('touched'); });
      // Pointer and wheel handlers move the camera themselves, so update() in the loop only sees the damping
      // remainder and often reports "unchanged". The change event catches every real move.
      c.addEventListener('change', () => { this.camMoved = true; });
    }

    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.mats = []; this.lamps = [];
    this.dirty = true;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.vis = true;
    // entries are queued oldest first; the last one is the current state
    this.io = new IntersectionObserver(es => { this.vis = es[es.length - 1].isIntersecting; if (this.vis) this.dirty = true; });
    this.io.observe(host);
    this.alive = true;
    this.ready = false; this.slow = 0;
    let last = 0, prevMoved = false;
    const loop = now => {
      if (!this.alive) return;
      this.raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(.1, (now - last) / 1000) : 1 / 60;
      last = now;
      // until the scene is built and its shaders compiled, a render would compile them synchronously
      if (!this.ready || !this.vis || document.hidden) return;
      // damping per second instead of per frame (same feel at 60 fps); on slow frames a drag would crawl
      if (this.ctl) { this.ctl.dampingFactor = 1 - Math.pow(1 - .08, dt * 60); this.ctl.update(); }
      const moved = this.camMoved;
      this.camMoved = false;
      if (moved || this.dirty) { this.dirty = false; this.composer.render(); }
      // dt only measures render cost when the previous frame rendered too
      if (moved && prevMoved) this.adapt(dt);
      // a still view can afford full resolution again
      else if (!moved && prevMoved && this.r.getPixelRatio() < this.dpr) { this.r.setPixelRatio(this.dpr); this.resize(); this.dirty = true; }
      prevMoved = moved;
    };
    if (this.opts.interactive) this.raf = requestAnimationFrame(loop);
  }

  // Weak GPUs: after half a second of dragging below ~35 fps, render fewer pixels. It never steps back up during
  // a drag, so the resolution can't oscillate; the loop restores it once the camera stops.
  adapt(dt) {
    this.slow = dt > .028 ? this.slow + dt : 0;
    const pr = this.r.getPixelRatio();
    if (this.slow < .5 || pr <= .75) return;
    this.slow = 0;
    this.r.setPixelRatio(Math.max(.75, pr - .25));
    this.resize();
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.r.setSize(w, h, false);
    this.composer.setPixelRatio(this.r.getPixelRatio());
    this.composer.setSize(w, h);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    this.fit();
    this.dirty = true;
  }

  // Narrow viewports pull the camera back so the product stays in frame, until the user takes over.
  fit() {
    if (!this.base || this.moved) return;
    const k = Math.max(1, Math.pow(this.fitAspect / Math.max(this.cam.aspect, .3), .8));
    this.cam.position.copy(this.target).add(this.base.clone().multiplyScalar(k));
    this.cam.lookAt(this.target);
    if (this.ctl) { this.ctl.target.copy(this.target); this.ctl.update(); }
  }

  setCamera(pos, target, fov) {
    if (this.keepCam) return;
    this.cam.fov = fov || this.cam.fov; this.cam.updateProjectionMatrix();
    this.target = new THREE.Vector3(...target);
    this.base = new THREE.Vector3(...pos).sub(this.target);
    this.moved = false;
    this.fit();
    this.dirty = true;
  }

  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect();
    this.clear();
    if (this.ctl) this.ctl.dispose();
    this.composer.passes.forEach(p => p.dispose && p.dispose());
    this.composer.dispose();
    this.roomEnv.dispose(); this.cubeRT.dispose(); this.pm.dispose(); this.shadeProbe.dispose();
    if (this.capEnv) this.capEnv.dispose();
    this.r.dispose();
    this.r.forceContextLoss();
    this.r.domElement.remove();
  }

  clear() {
    this.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose(); });
    this.mats.forEach(m => m.dispose());
    (this.texs || []).forEach(x => x.dispose());
    this.texs = [];
    this.root.clear();
    this.mats = []; this.lamps = []; this.emitters = []; this.kit = null; this.bodyMat = null; this.neckMat = null; this.steelMat = null; this.shadeMats = []; this.bgShades = []; this.probeHide = [];
    this.scene.fog = null;
    // the baked room is shared: detached, never disposed
    if (this.room_) { this.scene.remove(this.room_.group); this.room_ = null; }
    this.placeholder = []; this.bgKits = [];
  }

  mat(o, phys) {
    const m = new (phys ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)(o);
    this.mats.push(m);
    return m;
  }

  mesh(geo, mat, { cast = true, recv = true, parent = this.root } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast; m.receiveShadow = recv;
    parent.add(m);
    return m;
  }

  // role: 'main' follows the lamp level directly, 'glow' is tinted by the shade, 'fill' is a small local fill.
  addLight(light, base, role = 'main') {
    light.userData = { base, role };
    this.root.add(light);
    if (light.target) this.root.add(light.target);
    this.lamps.push(light);
    return light;
  }

  /* ----- build ----- */
  build(p, s, variant = 'detail') {
    this.setup(p, s, variant);
    this.apply(s);
    this.ready = true;
  }

  // Product page entry. Shaders compile in parallel (KHR_parallel_shader_compile) instead of freezing the
  // page on the first frames, and the first frame is drawn before the caller reveals the canvas.
  async open(p, s) {
    // kit table lamps open in the baked room in one step: the room is part of the first compile and frame
    if (p.kit && p.group === 'table') await preloadRoom(s.mode);
    if (!this.alive) return;
    this.setup(p, s, 'detail');
    // the reflecting materials get the probe's (not yet captured) map now, so this first round compiles their
    // final variants too, not a second round after the capture
    if (this.p.group === 'table') {
      this.capEnv ||= this.pm.fromCubemap(this.cubeRT.texture);
      this.reflectors().forEach(m => { m.envMap = this.capEnv.texture; });
    }
    await this.compile(); // variants the probe capture renders with
    if (!this.alive) return;
    this.apply(s);
    await this.compile(); // anything the capture changed
    if (!this.alive) return;
    this.composer.render();
    this.dirty = false;
    this.ready = true;
    if (this.placeholder.length) this.withRoom(s.mode || 'gece').catch(err => console.warn('room', err));
  }

  // The baked restaurant replaces the placeholder room once it has loaded: only when it wasn't ready at open() (a
  // failed download is retried here), or in the harness, whose build() doesn't wait for it.
  async withRoom(mode) {
    const id = this.buildId, R = await loadRoom(mode);
    if (!this.alive || id !== this.buildId || !this.placeholder.length) return;
    this.attachRoom(R);
    // its materials are new, the lamp copies reuse the hero lamp's programs; no frame until they're compiled
    this.ready = false;
    await this.compile();
    if (!this.alive || id !== this.buildId) return;
    this.ready = true;
    this.apply(this.lastState);
  }

  // Every background table gets a copy of the lamp, always on at 2700 K like the other scenes' background lamps.
  // Their light on the tables and the banquette is in the bake (a generic shaded lamp): the copies only glow.
  attachRoom(R) {
    for (const o of this.placeholder) { o.removeFromParent(); o.geometry.dispose(); }
    this.placeholder = [];
    this.scene.add(R.group);
    this.room_ = R;
    this.bgKits = R.meta.tables.map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = i * 2.4; this.root.add(g);
      const { lamp } = this.kitLamp(this.p, g, true);
      // receiveShadow stays: switching it would be another shader variant to compile
      lamp.group.traverse(o => { o.castShadow = false; });
      return { lamp, pos: new THREE.Vector3(x, lamp.lampPos.y, z) };
    });
    if (this.ctl) this.ctl.maxDistance = 2;
  }

  applyRoom(key, fin) {
    const R = this.room_;
    // a mode whose maps are still loading keeps the previous mode's until they arrive
    if (R.lm[key]) {
      const k = R.meta.lightmap[key] * Math.PI * (R.meta.gain?.[key] ?? 1);
      R.mats.forEach(m => { m.lightMap = R.lm[key]; m.lightMapIntensity = k; });
      R.fx.view.map = R.view[key];
    } else R.perMode(key).then(() => { if (this.room_ === R && this.lastState?.mode === key) this.apply(this.lastState); });
    const fx = ROOM_FX[key], warm = kLinear(2700);
    R.fx.view.color.setScalar(fx.view);
    R.fx.curtain.color.setRGB(.86, .82, .74, THREE.LinearSRGBColorSpace).multiplyScalar(fx.curtain);
    R.fx.sconce_glass.color.copy(warm).multiplyScalar(fx.glass);
    this.bgKits.forEach(({ lamp, pos }) => { lamp.setFinish(fin); lamp.setLight(KIT_OUTPUT * LAMP, pos, warm); });
  }

  // Programs depend on the target they draw into: the scene is only ever drawn into linear render targets
  // (composer, probe), never straight to the canvas, so compile for one. Compiled for the canvas (sRGB output),
  // every material would be compiled a second time, synchronously, on the first frame.
  compile() {
    this.r.setRenderTarget(this.composer.readBuffer);
    const done = this.r.compileAsync(this.scene, this.cam);
    this.r.setRenderTarget(null);
    return done;
  }

  setup(p, s, variant) {
    this.buildId = (this.buildId || 0) + 1;
    // rebuilding the same product (profile height) keeps the angle the visitor turned to
    this.keepCam = this.moved && this.p === p;
    this.clear();
    this.p = p; this.variant = variant;
    this.shadowsStale = true;
    // kit lamps use the camera-like knee instead of the renderer's tone mapping (render targets aren't tone
    // mapped, so switching it only rebuilds the output pass, never the scene's materials)
    this.knee.enabled = !!p.kit;
    this.r.toneMapping = p.kit ? THREE.NoToneMapping : this.tone;
    if (p.group === 'table') this.buildTableScene(p, variant);
    else this.buildRoomScene(p, s);
  }

  materials() {
    const wood = texCache.wood;
    const woodMat = (rep) => {
      const a = wood.albedo.clone(), b = wood.bump.clone();
      a.repeat.set(...rep); b.repeat.set(...rep); // clones share the uploaded image; no re-upload needed
      this.texs.push(a, b);
      return this.mat({ map: a, bumpMap: b, bumpScale: .25, roughnessMap: b, roughness: .58, clearcoat: .35, clearcoatRoughness: .28 }, true);
    };
    const plaster = texCache.plaster;
    return {
      woodMat,
      wall: this.mat({ color: '#6a625a', roughness: .95, bumpMap: plaster, bumpScale: 2 }),
      // a touch under paper white: in the sun it stays porcelain instead of a blooming disc
      ceramic: this.mat({ color: '#e6e2da', roughness: .35, clearcoat: 1, clearcoatRoughness: .12 }, true),
      // transmission costs a full extra scene pass per frame; phones get a plain transparent glass. Glass has no
      // diffuse colour of its own: a white one read as milk under a nearby lamp
      glass: coarse
        ? this.mat({ color: '#1c2026', metalness: 0, roughness: .05, transparent: true, opacity: .14, depthWrite: false, clearcoat: 1 }, true)
        : this.mat({ color: '#ffffff', metalness: 0, roughness: .03, transmission: 1, thickness: .004, ior: 1.5, specularIntensity: 1 }, true),
      steel: this.mat({ color: '#d9d9d6', metalness: 1, roughness: .18 }),
      // opaque: a transmissive wine would be missing from the glass's transmission pass (it only sees opaque objects)
      wine: this.mat({ color: '#1c0206', roughness: .08, clearcoat: 1, clearcoatRoughness: .03 }, true),
      linen: this.mat({ color: '#5e1424', roughness: .92, sheen: 1, sheenRoughness: .6, sheenColor: '#b04a5c' }, true),
      floor: this.mat({ color: '#2a2420', roughness: .7 }),
      rubber: this.mat({ color: '#111111', roughness: .9 }),
    };
  }

  // A diner's place (seated at +z): dinner and bread plates, folded napkin under the fork, knife, a wine glass with
  // wine and a water tumbler. Plates and glasses are closed solids with real wall thickness, rim and foot.
  placeSetting(M, x, z, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; this.root.add(g);
    // built once (tens of ms each); a disposed geometry is simply uploaded again on the next build
    const cut = this.cutlery ||= { fork: forkGeometry(), knife: knifeGeometry() };
    const w = this.ware ||= tableware();
    this.mesh(w.plate, M.ceramic, { parent: g });
    this.mesh(w.bread, M.ceramic, { parent: g }).position.set(-.215, 0, -.2);
    const nap = this.mesh(w.napkin, M.linen, { parent: g }); nap.position.set(-.2, 0, .01);
    this.mesh(cut.fork, M.steel, { parent: g }).position.set(-.2, .0105, 0);
    this.mesh(cut.knife, M.steel, { parent: g }).position.set(.165, 0, 0);
    const wine = new THREE.Group(); wine.position.set(.12, 0, -.19); g.add(wine);
    this.mesh(w.wineGlass, M.glass, { parent: wine, cast: false });
    this.mesh(w.wine, M.wine, { parent: wine, cast: false });
    this.mesh(w.tumbler, M.glass, { parent: g, cast: false }).position.set(.215, 0, -.13);
  }

  buildTableScene(p, variant) {
    const M = this.materials();
    // cutlery is polished steel: it shows the lit table and shade, not the (near black) night environment
    this.steelMat = M.steel;
    const hero = variant === 'hero';
    // kit lamps light the table from a few centimetres up and are seen close: a solid walnut veneer (no repeating
    // planks) under a satin lacquer, which keeps their reflection soft instead of a blown-out dot
    const kitTop = p.kit && !hero;
    const topMat = kitTop ? tableWood() : M.woodMat([1.6, 1.2]);
    if (kitTop) { this.mats.push(topMat); Object.assign(topMat, { clearcoatRoughness: .75, specularIntensity: .25 }); }
    const top = this.mesh(new THREE.BoxGeometry(hero ? 1.5 : 1.3, .04, hero ? .9 : 1.05), topMat);
    top.position.set(0, -.02, hero ? 0 : -.1);
    const legGeo = new THREE.BoxGeometry(.05, .71, .05);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = this.mesh(legGeo, M.floor); l.position.set(a * .55, -.395, b * .33 - (hero ? 0 : .1)); });
    const floor = this.mesh(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), M.woodMat([12, 12]), { cast: false });
    floor.position.y = -.75;

    if (hero) {
      // restaurant depth: far wall and other lit tables, out of focus in the final render
      const wall = this.mesh(new THREE.PlaneGeometry(16, 5), M.wall, { cast: false }); wall.position.set(0, 1.5, -4.2);
      [[-1.9, -1.4], [1.7, -2.6], [-.6, -3.3]].forEach(([x, z]) => {
        const t = this.mesh(new THREE.BoxGeometry(1.2, .04, .8), M.woodMat([1.4, 1])); t.position.set(x, -.02, z);
        const g = new THREE.Group(); g.position.set(x + .1, 0, z); this.root.add(g);
        const n0 = this.shadeMats.length, e0 = this.emitters.length;
        const info = this.buildLamp(p, g, M, true);
        this.bgShades.push(...this.shadeMats.splice(n0));
        this.emitters.slice(e0).forEach(e => { e.bg = true; });
        this.addLight(pointLight(5, x + .1, info.bulbY, z), 1.4, 'bg');
      });
      this.placeSetting(M, -.36, .14, .15); this.placeSetting(M, .38, .16, -.15);
      this.scene.fog = new THREE.Fog(0x000000, 3, 9);
    } else {
      // kit lamps stand in a room with the table away from the wall: the lit shade reads against a dim background,
      // as in the product's table photo
      const inRoom = kitTop && variant !== 'card', back = variant === 'card' ? -1.3 : inRoom ? -1.5 : -.625;
      const wall = this.mesh(new THREE.PlaneGeometry(8, 4), M.wall, { cast: false }); wall.position.set(0, 1.2, back);
      if (inRoom) {
        // the baked restaurant if it's loaded, else a plain closed room until it is
        this.placeholder = [floor, wall, ...this.room(M, back)];
        if (roomData) this.attachRoom(roomData);
        // charcoal linen napkins, as in the product's own table photo, instead of the wine-red ones
        M.linen.color.set('#2f2c29'); M.linen.sheenColor.set('#6b655d');
        // the shade's weave, so they read as cloth rather than a painted slab
        const weave = linenSet([1.3, 2.2]);
        this.texs.push(weave.normalMap, weave.roughnessMap);
        Object.assign(M.linen, { normalMap: weave.normalMap, roughnessMap: weave.roughnessMap, normalScale: new THREE.Vector2(.8, .8) });
      }
      if (variant !== 'card') { this.placeSetting(M, -.38, .12, .12); this.placeSetting(M, .4, .15, -.1); }
    }
    const info = this.buildLamp(p, this.root, M, false);
    if (kitTop) this.kit.receive(topMat);
    this.lampInfo = info;
    this.probe.set(0, .07, .09);
    this.probeHide = [];
    this.root.traverse(o => { if (o.material === this.bodyMat || o.material === this.neckMat || this.emitters.some(e => e.m === o.material)) this.probeHide.push(o); });
    if (this.kit) this.probeHide.push(this.kit.body);

    // before setCamera: fit() uses it, and a NaN camera there sticks in OrbitControls' change detection
    this.fitAspect = 1.25;
    if (variant === 'card') this.setCamera([.0, info.h * .62, 1.05], [0, info.h * .5, 0], 26);
    else if (hero) this.setCamera([.62, .42, 1.0], [-.06, .17, 0], 34);
    // a longer lens than the other lamps: seen from close, a wide one makes the shade look oversized
    else if (p.kit) this.setCamera([.46, .25, .78], [0, info.h * .47, 0], 25);
    else this.setCamera([.48, .34, .82], [0, info.h * .52, 0], 32);
    // kit lamps are modelled down to the stitching, so they can be inspected from close up
    if (this.ctl) Object.assign(this.ctl, { minDistance: p.kit ? .14 : .4, maxDistance: this.room_ ? 2 : p.kit ? 1.25 : 2.4, maxPolarAngle: 1.52, minPolarAngle: .2 });
    // in the restaurant the sun comes in through the window front right of the table, as in the room's bake
    // (tools/room/bake.py); from higher up the wall above the windows would shade the table
    if (this.placeholder.length || this.room_) this.sun.position.set(2.7, 1.75, 1.3); else this.sun.position.set(2.2, 2.8, 1.6);
    this.sun.target.position.set(0, 0, 0);
  }

  // Kit lamps can be turned all the way round: a closed room instead of a wall floating in the void (until the
  // baked restaurant has loaded). The orbit range keeps the camera inside it. Returns its meshes.
  room(M, z0) {
    const x = 2.2, z1 = 2.2, y0 = -.75, y1 = 1.85, h = y1 - y0, d = z1 - z0;
    const wall = (w, rot, px, pz) => { const m = this.mesh(new THREE.PlaneGeometry(w, h).rotateY(rot), M.wall, { cast: false }); m.position.set(px, y0 + h / 2, pz); return m; };
    const ceil = this.mesh(new THREE.PlaneGeometry(2 * x, d).rotateX(Math.PI / 2), this.mat({ color: '#8a827a', roughness: .95 }), { cast: false });
    ceil.position.set(0, y1, (z0 + z1) / 2);
    return [wall(2 * x, Math.PI, 0, z1), wall(d, Math.PI / 2, -x, (z0 + z1) / 2), wall(d, -Math.PI / 2, x, (z0 + z1) / 2), ceil];
  }

  // Lamp geometry + its own lights. `dummy` lamps (background tables) only get a glowing shade.
  buildLamp(p, parent, M, dummy) {
    if (p.kit) return this.kitLamp(p, parent, dummy);
    const body = this.bodyMat || (this.bodyMat = this.mat({ color: '#ffffff', metalness: 1, roughness: .3 }, true));
    // the neck sits centimetres under the LED; a slightly satin finish keeps its highlight from blowing out
    const neck = this.neckMat || (this.neckMat = this.mat({ color: '#ffffff', metalness: 1, roughness: .4 }, true));
    const add = (geo, m, o = {}) => this.mesh(geo, m, { parent, ...o });
    let info;
    if (p.model === 'avior') {
      add(new THREE.CylinderGeometry(.064, .064, .005, 48), M.rubber).position.y = .0025;
      // the LED module is wider than the neck, so only the bell casts a (real) shadow
      add(lathe([[0, .005], [.061, .005], [.0655, .008], [.0667, .016], [.0667, .064], [.065, .069], [.06, .074], [.05, .08], [.039, .089], [.033, .098], [0, .098]]), body);
      add(lathe([[.033, .098], [.028, .108], [.0205, .13], [.0168, .15], [.016, .172], [.0175, .175], [.0175, .19], [0, .19]]), neck, { cast: false });
      info = this.shade(parent, { y0: .172, h: .124, rb: .122, rt: .056, n: 30, depth: .085, bulbY: .212 }, dummy);
      info.h = .3;
    } else if (p.model === 'alderamin') {
      add(new THREE.CylinderGeometry(.062, .062, .005, 48), M.rubber).position.y = .0025;
      add(lathe([[0, .005], [.059, .005], [.0635, .009], [.064, .018], [.064, .06], [.061, .066], [.053, .071], [.037, .077], [.0236, .083], [.018, .089], [0, .089]]), body);
      add(lathe([[.018, .089], [.0148, .095], [.0118, .101], [.0099, .107], [.0075, .115], [.0062, .125], [.0062, .238], [.009, .24], [.009, .262], [0, .262]]), neck, { cast: false });
      add(new THREE.SphereGeometry(.011, 24, 12), body, { cast: false }).position.y = .125;
      info = this.shade(parent, { y0: .248, h: .127, rb: .119, rt: .055, n: 30, depth: .085, bulbY: .285 }, dummy);
      info.h = .38;
    } else {
      // capella: cylindrical base, thin stem, conical metal hat with a downward LED ring
      add(lathe([[0, 0], [.056, 0], [.0587, .003], [.0587, .072], [.057, .0765], [.05, .079], [.012, .08], [0, .08]], 72), body);
      add(new THREE.CylinderGeometry(.0097, .0097, .176, 24), body, { cast: false }).position.y = .168;
      const hat = add(lathe([[.064, .257], [.0645, .259], [.0447, .343], [.033, .347], [.012, .3505], [0, .351]], 72), body);
      hat.material = body; hat.geometry.computeVertexNormals();
      const inner = this.mat({ color: '#efe9df', roughness: .5, emissive: '#ffffff', emissiveIntensity: 0, side: THREE.BackSide });
      add(lathe([[.0625, .258], [.0435, .341], [0, .343]], 72), inner, { cast: false });
      add(new THREE.CylinderGeometry(.0105, .0105, .016, 24), body).position.y = .358;
      add(new THREE.SphereGeometry(.0105, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), body).position.y = .366;
      const led = this.mat({ color: '#f4efe6', roughness: .6, emissive: '#ffffff', emissiveIntensity: 0 });
      add(new THREE.RingGeometry(.012, .036, 48).rotateX(Math.PI / 2), led, { cast: false }).position.y = .3395;
      this.emitters.push({ m: led, gain: 9, kind: 'led' }, { m: inner, gain: 1.1, kind: 'led' });
      info = { bulbY: .339, h: .36 };
      if (!dummy) {
        const spot = new THREE.SpotLight(0xffffff, 0, 4, .7, .6, 2);
        spot.position.set(0, .337, 0); spot.target.position.set(0, -1, 0);
        spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0003; spot.shadow.normalBias = .004; spot.shadow.radius = 4;
        spot.shadow.camera.near = .01; spot.shadow.camera.far = 4;
        this.addLight(spot, 2.6, 'main');
        this.addLight(pointLight(.16, 0, .3, 0), .08, 'fill');
      }
    }
    return info;
  }

  // Lamps built by the kit from a photo-measured spec. Light leaving the shade's bottom opening comes off the
  // whole lit liner, not a point on the axis (the neck would shadow the body), so shadowed points on a ring just
  // inside the opening carry it. The lamp's own parts ignore them: the kit lights its body from the liner and
  // computes the fabric's glow in its shader, from the same intensity.
  kitLamp(p, parent, dummy) {
    const lamp = buildLamp(KIT[p.model]);
    parent.add(lamp.group);
    const seen = new Set();
    lamp.group.traverse(o => {
      if (!o.material || seen.has(o.material)) return;
      seen.add(o.material); this.mats.push(o.material);
      ['map', 'normalMap', 'roughnessMap'].forEach(k => { if (o.material[k]) this.texs.push(o.material[k]); });
    });
    const info = { bulbY: lamp.lampPos.y, h: lamp.height, lamp };
    if (dummy) return info;
    this.kit = lamp;
    // Three points on the opening plane. Below it they make the pool; above it they get out through the walls (the
    // fabric casts its shadow from its outer faces only), which is the light the shade transmits into the room, so
    // no separate glow light is needed. All of them shadowed: the body must shade the table under it. Six looked
    // the same and doubled the shader size of every material in the scene (cold compile time).
    const n = 3, res = coarse ? 256 : 512;
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n + .5;
      const l = pointLight(6, Math.sin(a) * lamp.exit.r, lamp.exit.y, Math.cos(a) * lamp.exit.r);
      l.castShadow = true; l.shadow.mapSize.set(res, res);
      l.shadow.bias = -.0002; l.shadow.normalBias = .0008; l.shadow.radius = 8; l.shadow.camera.near = .004; l.shadow.camera.far = KIT_SHADOW_FAR;
      this.addLight(l, KIT_OUTPUT * KIT_POOL / n, 'main');
    }
    return info;
  }

  // Pleated shade with its frame. The main point light casts shadows so light only escapes top and bottom;
  // a second unshadowed light tinted by the fabric stands in for light transmitted through the shade.
  shade(parent, { y0, h, rb, rt, n, depth, bulbY }, dummy) {
    const sm = this.mat({ color: '#ffffff', roughness: .9, side: THREE.DoubleSide, flatShading: true, emissive: '#ffffff', emissiveMap: pleatTex(), emissiveIntensity: 0, shadowSide: THREE.DoubleSide });
    this.shadeMats.push(sm);
    const m = this.mesh(pleatedShade(rt, rb, h, n, depth), sm, { parent, recv: false });
    m.position.y = y0;
    const wire = this.bodyMat;
    const ring = this.mesh(new THREE.TorusGeometry(rt * .93, .0015, 6, 48).rotateX(Math.PI / 2), wire, { parent, cast: false });
    ring.position.y = y0 + h - .003;
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI * 2, len = rt * .93;
      const arm = this.mesh(new THREE.CylinderGeometry(.0012, .0012, len, 6).rotateZ(Math.PI / 2), wire, { parent, cast: false });
      arm.position.set(Math.cos(a) * len / 2, y0 + h - .003, Math.sin(a) * len / 2); arm.rotation.y = -a;
    }
    const ledM = this.mat({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0 });
    this.mesh(new THREE.CylinderGeometry(.012, .012, .008, 24), ledM, { parent, cast: false }).position.y = bulbY;
    this.emitters.push({ m: ledM, gain: 12, kind: 'led' });
    if (!dummy) {
      const main = new THREE.PointLight(0xffffff, 0, 6, 2);
      main.position.set(0, bulbY, 0); main.castShadow = true;
      main.shadow.mapSize.set(coarse ? 512 : 1024, coarse ? 512 : 1024); main.shadow.bias = -.002; main.shadow.normalBias = .002; main.shadow.radius = 5;
      main.shadow.camera.near = .005; main.shadow.camera.far = 6;
      this.addLight(main, 1.1, 'main');
      this.addLight(pointLight(6, 0, y0 + h * .45, 0), .18, 'glow');
    }
    return { bulbY };
  }

  // Architectural luminaires: dining table under a pendant / ceiling fixture in a room.
  buildRoomScene(p, s) {
    const M = this.materials();
    const prof = { H5: .05, 'H7,5': .075, H10: .1 }[s.prof] || .075;
    const ceilY = 2.75;
    this.mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), M.woodMat([7, 7]), { cast: false });
    const back = this.mesh(new THREE.PlaneGeometry(14, ceilY), M.wall, { cast: false }); back.position.set(0, ceilY / 2, -2.2);
    // Lambert ignores RectAreaLights, which in three.js emit from both faces and would flood the ceiling
    const ceilM = new THREE.MeshLambertMaterial({ color: '#d8d3ca' }); this.mats.push(ceilM);
    const ceil = this.mesh(new THREE.PlaneGeometry(14, 14).rotateX(Math.PI / 2), ceilM, { cast: false });
    ceil.position.y = ceilY;

    // table, chairs, settings
    const tW = p.model === 'kare' ? 2.1 : 1.8, tD = p.model === 'kare' ? 1.0 : .92;
    const top = this.mesh(new THREE.BoxGeometry(tW, .045, tD), M.woodMat([2, 1])); top.position.y = .7525;
    const legM = this.mat({ color: '#1b1917', roughness: .5, metalness: .4 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = this.mesh(new THREE.BoxGeometry(.05, .73, .05), legM); l.position.set(a * (tW / 2 - .1), .365, b * (tD / 2 - .1)); });
    const chairM = this.mat({ color: '#4a3a30', roughness: .78, sheen: .8, sheenRoughness: .5, sheenColor: '#8a6a58' }, true);
    const seatGeo = new RoundedBoxGeometry(.46, .07, .45, 3, .025), backGeo = new RoundedBoxGeometry(.46, .3, .06, 3, .025);
    const chair = (x, z, ry) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.root.add(g);
      this.mesh(seatGeo, chairM, { parent: g }).position.y = .47;
      const back = this.mesh(backGeo, chairM, { parent: g }); back.position.set(0, .76, -.21); back.rotation.x = -.1;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = this.mesh(new THREE.CylinderGeometry(.011, .009, .45, 10), legM, { parent: g }); l.position.set(a * .19, .225, b * .19); });
    };
    // back wall: low sideboard and a framed print give the room scale
    const sideM = this.mat({ color: '#2a211c', roughness: .5, clearcoat: .4, clearcoatRoughness: .3 }, true);
    const sb = this.mesh(new RoundedBoxGeometry(1.8, .78, .42, 3, .01), sideM); sb.position.set(-.2, .39, -1.98);
    const art = this.mesh(new THREE.BoxGeometry(1.0, .7, .03), this.mat({ color: '#15120f', roughness: .4, metalness: .3 })); art.position.set(-.9, 1.65, -2.18);
    const print = this.mesh(new THREE.PlaneGeometry(.88, .58), this.mat({ color: '#8f7e66', roughness: .9 }), { cast: false }); print.position.set(-.9, 1.65, -2.163);
    const n = p.model === 'kare' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * (tW / n);
      chair(x, -tD / 2 - .18, 0);
      const g = new THREE.Group(); g.position.y = .775; this.root.add(g);
      this.placeSettingOn(g, M, x, -tD / 2 + .2, 0); this.placeSettingOn(g, M, x, tD / 2 - .2, Math.PI);
    }
    const vaseM = this.mat({ color: '#7d7166', roughness: .75 });
    this.mesh(lathe([[0, 0], [.06, 0], [.075, .05], [.07, .14], [.04, .2], [.032, .26], [.036, .28], [0, .28]], 96), vaseM).position.set(.12, .775, .02);
    const runner = this.mesh(new THREE.BoxGeometry(tW * .8, .003, .3), M.linen); runner.position.set(0, .7765, 0);

    // luminaire
    // Lambert: three.js RectAreaLights emit from both faces and would light the profiles from inside
    const body = this.bodyMat = new THREE.MeshLambertMaterial({ color: '#111111' }); this.mats.push(body);
    const diff = this.mat({ color: '#f5f3ee', roughness: .8, emissive: '#ffffff', emissiveIntensity: 0, side: THREE.DoubleSide });
    this.emitters.push({ m: diff, gain: 5, kind: 'diffuser' });
    this.diffMat = diff;
    const w = .05;
    const frame = (nSides, R, rot, y, cx = 0, cz = 0) => {
      const g = new THREE.ExtrudeGeometry(frameShape(nSides, R, w, rot), { depth: prof, bevelEnabled: false, curveSegments: 1 });
      g.rotateX(-Math.PI / 2);
      const b = this.mesh(g, body); b.position.set(cx, y, cz);
      const d = this.mesh(new THREE.ShapeGeometry(frameShape(nSides, R - .004, w - .008, rot)).rotateX(Math.PI / 2), diff, { cast: false, recv: false });
      d.position.set(cx, y - .0008, cz);
      // one area light per straight run of diffuser, facing down. Phones get one square light per square
      // frame (same total output) because every area light is evaluated for every pixel.
      const rm = R - w / 2 / Math.cos(Math.PI / nSides);
      if (coarse && nSides === 4) {
        const side = 2 * rm * Math.cos(Math.PI / 4), ra = new THREE.RectAreaLight(0xffffff, 0, side, side);
        ra.rotation.set(-Math.PI / 2, 0, 0); ra.position.set(cx, y - .002, cz);
        this.addLight(ra, 150 * 4 * (w - .01) * .96 / side, 'main');
        return;
      }
      for (let i = 0; i < nSides; i++) {
        const a0 = rot + i / nSides * Math.PI * 2, a1 = rot + (i + 1) / nSides * Math.PI * 2;
        const x0 = Math.cos(a0) * rm, z0 = -Math.sin(a0) * rm, x1 = Math.cos(a1) * rm, z1 = -Math.sin(a1) * rm;
        const len = Math.hypot(x1 - x0, z1 - z0);
        const ra = new THREE.RectAreaLight(0xffffff, 0, len * .96, w - .01);
        ra.rotation.order = 'YXZ';
        ra.rotation.set(-Math.PI / 2, -Math.atan2(z1 - z0, x1 - x0), 0);
        ra.position.set(cx + (x0 + x1) / 2, y - .002, cz + (z0 + z1) / 2);
        this.addLight(ra, 150, 'main');
      }
    };
    const wireM = this.mat({ color: '#8d8b86', metalness: .9, roughness: .3 });
    const wire = (x, y0, z) => {
      const len = ceilY - y0;
      const c = this.mesh(new THREE.CylinderGeometry(.0008, .0008, len, 5), wireM, { cast: false }); c.position.set(x, y0 + len / 2, z);
      this.mesh(new THREE.CylinderGeometry(.04, .04, .012, 24), body, { cast: false }).position.set(x, ceilY - .006, z);
    };
    let center;
    this.fitAspect = 1.3; // before setCamera, see buildTableScene
    if (p.model === 'altigen') {
      const R = .46, y = 1.52;
      frame(6, R, 0, y);
      [0, 2, 3, 5].forEach(i => { const a = i / 6 * Math.PI * 2 + Math.PI / 6; wire(Math.cos(a) * (R - .06), y + prof, -Math.sin(a) * (R - .06)); });
      center = [0, y, 0];
      this.setCamera([1.5, 1.12, 2.55], [0, 1.16, 0], 40);
    } else {
      const S = .62, R = S / Math.SQRT2, d = .2, gap = prof + .012;
      const sq = [[-d, -d, 0], [d, -d, 1], [d, d, 2], [-d, d, 3]];
      const topY = ceilY - .09;
      sq.forEach(([x, z, lvl]) => {
        const y = topY - lvl * gap;
        frame(4, R, Math.PI / 4, y, x, z);
        const rod = this.mesh(new THREE.CylinderGeometry(.004, .004, ceilY - y - prof, 8), wireM, { cast: false });
        rod.position.set(x - S / 2 + .04, (ceilY + y + prof) / 2, z - S / 2 + .04);
      });
      center = [0, topY - 2 * gap, 0];
      this.setCamera([2.1, 1.22, 3.1], [0, 1.6, 0], 42);
    }
    // a soft shadow-casting downlight so objects on the table ground themselves
    const spot = new THREE.SpotLight(0xffffff, 0, 6, 1.25, 1, 2);
    spot.position.set(center[0], center[1] - .02, center[2]); spot.target.position.set(center[0], 0, center[2]);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0004; spot.shadow.radius = 6;
    spot.shadow.camera.near = .05; spot.shadow.camera.far = 6;
    this.addLight(spot, 12, 'main');
    this.probe.set(.4, 1.7, 1.2);
    this.root.traverse(o => { if (o.material === diff) this.probeHide.push(o); });
    if (this.ctl) Object.assign(this.ctl, { minDistance: 1.2, maxDistance: 5.5, maxPolarAngle: 1.75, minPolarAngle: .45 });
    this.sun.position.set(2.5, 4, 3); this.sun.target.position.set(0, .7, 0);
  }

  placeSettingOn(g, M, x, z, rot) {
    const saved = this.root; this.root = g;
    this.placeSetting(M, x, z, rot);
    this.root = saved;
  }

  /* ----- state ----- */
  apply(s) {
    const p = this.p, mode = p.kit && s.mode === 'aksam' ? KIT_AKSAM : MODES[s.mode || 'gece'];
    // same lumen output at every colour temperature: normalise luminance to the 3000 K colour
    const lc = kLinear(s.k);
    lc.multiplyScalar(REF_LUM / luminance(lc));
    const isT = p.group === 'table';
    const f = LAMP * (s.on ? (isT ? [.32, .62, 1][s.lvl] * (s.power === 'premium' ? 1 : .72) : 1) : 0);

    this.scene.background = new THREE.Color(mode.bg);
    if (this.scene.fog) this.scene.fog.color.set(mode.bg);
    this.scene.environmentIntensity = mode.env;
    this.r.toneMappingExposure = mode.exp;
    this.knee.uniforms.exposure.value = mode.exp;
    this.lastState = s;
    this.sun.intensity = mode.sun; this.sun.color.set(mode.sunColor);
    // window light: soft edged
    this.sun.shadow.radius = p.kit ? 4 : 1;
    // castShadow stays on at night (intensity 0): toggling it recompiles every material, a multi-second freeze

    if (this.bodyMat) {
      if (isT) {
        const fi = FIN[s.fin];
        this.bodyMat.color.set(fi.hex); this.bodyMat.metalness = fi.metal; this.bodyMat.roughness = fi.rough;
        this.bodyMat.clearcoat = fi.metal > .5 ? 0 : .25; this.bodyMat.clearcoatRoughness = .4;
        if (this.neckMat) { this.neckMat.color.set(fi.hex); this.neckMat.metalness = fi.metal; this.neckMat.roughness = Math.min(.6, fi.rough + .25); }
      } else {
        this.bodyMat.color.set(RAL[s.ral] ? RAL[s.ral][1] : '#0a0a0a');
      }
    }

    const shade = p.shades ? SHADE[s.shade] || SHADE.krem : null;
    const tint = shade ? new THREE.Color(shade.hex) : new THREE.Color(1, 1, 1);
    const glowC = lc.clone().multiply(tint).multiplyScalar(shade && s.shade === 'kirmizi' ? 1.6 : 1.1);
    this.shadeMats.forEach(m => { m.color.copy(tint); m.emissive.copy(glowC); m.emissiveIntensity = 1.7 * f; });
    this.shadeProbe.color.copy(glowC).multiplyScalar(1.1 * f).add(tint.clone().multiplyScalar(mode.env * .5));
    // background-table lamps (hero scene) stay on at 2700 K whatever the main lamp does
    const bgC = kLinear(2700);
    const bgGlow = bgC.clone().multiply(tint).multiplyScalar(1.1);
    this.bgShades.forEach(m => { m.color.copy(tint); m.emissive.copy(bgGlow); m.emissiveIntensity = 1.7 * LAMP; });
    this.emitters.forEach(e => { e.m.emissive.copy(e.bg ? bgC : lc); e.m.emissiveIntensity = e.gain * (e.bg ? LAMP : f); });
    if (this.kit) { this.kit.setFinish(s.fin); this.kit.setLight(KIT_OUTPUT * f, this.kit.lampPos, lc); }
    this.lamps.forEach(l => {
      const role = l.userData.role;
      l.color.copy(role === 'glow' ? glowC : role === 'bg' ? bgGlow : lc);
      l.intensity = l.userData.base * (role === 'bg' ? LAMP : f);
    });
    // crude bounce: light reflected off the lit table/floor reaches the walls and ceiling
    const warmGrey = new THREE.Color('#8a7a6a');
    this.bounce.color.copy(lc).multiply(warmGrey);
    this.bounce.groundColor.copy(lc).multiply(warmGrey);
    // kit lamps sit low: most of their light lands on the table right around them and bounces back up onto the
    // lower body, which no direct ray reaches
    this.bounce.intensity = (isT ? (p.kit ? .25 : .06) : .3) * f;
    if ((!isT || p.kit) && mode.env > .3) {
      // daylight in a room: neutral sky from the windows, warm bounce from the floor. Kit rooms have no windows
      // modelled, so it is their only daylight besides the sun (without it the body was black off its sunlit side).
      this.bounce.color.set('#e9eef5'); this.bounce.groundColor.set('#cdbfae'); this.bounce.intensity = mode.env * (isT ? 3.6 : 2.2);
    }

    if (this.room_) this.applyRoom(s.mode || 'gece', s.fin);
    this.capture(mode);
    this.dirty = true;
  }

  // table scenes: what reflects the probe capture
  reflectors() { return [this.bodyMat, this.neckMat, this.steelMat, ...(this.kit?.reflect || [])].filter(Boolean); }

  capture(mode) {
    // A single probe is only valid near where it was taken: table lamps use it for the body's reflections
    // only; rooms use it (emitters hidden, their light is already direct) as one-bounce ambient light.
    const sc = this.scene, hide = this.probeHide || [], table = this.p.group === 'table';
    sc.environment = this.roomEnv; sc.environmentIntensity = mode.env;
    // their previous reflections stay out of the capture; a zero intensity rather than no map, which would be a
    // different shader variant to compile (synchronously, inside the capture)
    if (table) this.reflectors().forEach(m => { m.envMapIntensity = 0; });
    // Shadows are rendered with everything visible, then reused for the capture. They depend only on geometry and
    // light positions, so a finish, level or colour change reuses them (dozens of shadow renders saved per click).
    if (this.shadowsStale) {
      this.shadowsStale = false;
      this.r.shadowMap.needsUpdate = true;
      this.r.setRenderTarget(this.composer.readBuffer);
      this.r.render(sc, this.cam);
      this.r.setRenderTarget(null);
    }
    // the shade's inside is lit from millimetres away; for reflections only its outer glow matters
    const swaps = [], glass = [];
    this.root.traverse(o => {
      if (!o.isMesh) return;
      if (this.shadeMats.includes(o.material)) { swaps.push([o, o.material]); o.material = this.shadeProbe; }
      else if (o.material.transmission > 0 || o.material.transparent) glass.push(o);
    });
    hide.push(...glass);
    hide.forEach(o => { o.visible = false; });
    this.cubeCam.position.copy(this.probe);
    this.cubeCam.update(this.r, sc);
    hide.forEach(o => { o.visible = true; });
    hide.length -= glass.length;
    swaps.forEach(([o, m]) => { o.material = m; });
    this.capEnv = this.pm.fromCubemap(this.cubeRT.texture, this.capEnv || null);
    if (table) this.reflectors().forEach(m => { m.envMap = this.capEnv.texture; m.envMapIntensity = m.userData.envI ?? .45; });
    else { sc.environment = this.capEnv.texture; sc.environmentIntensity = 1; }
  }

  render() { this.r.shadowMap.needsUpdate = true; this.composer.render(); }
}
