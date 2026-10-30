// Lamp kit: builds a lamp from a product spec (plain JSON, centimetres). Geometry is turned (lathe) from the
// silhouette measured on the product photos; materials are shared between all products.
import * as THREE from 'three';

const CM = .01;
const coarse = matchMedia('(pointer: coarse)').matches;
const v2 = (r, y) => new THREE.Vector2(r * CM, y * CM);

/* ---------- colour ---------- */

// Tanner Helland's blackbody fit, good enough for 1800–6500 K
export function kelvin(k) {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -.1332);
  const g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * Math.pow(t - 60, -.0755);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305;
  const c = x => Math.min(255, Math.max(0, x)) / 255;
  return new THREE.Color().setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

// What a camera white-balanced for warm interiors shows: the colour relative to 4500 K. Raw blackbody colours
// read far more orange on screen than lamps look to the eye or in the product photos.
export function lampColor(k) {
  const c = kelvin(k), w = kelvin(4500);
  return new THREE.Color(c.r / w.r, c.g / w.g, c.b / w.b);
}

/* ---------- textures ---------- */

// Loaded once before any lamp is built (a lamp built before its maps arrive renders without them); each use
// is a clone with its own repeat, sharing the uploaded image.
const LINEN = ['linen-diff', 'linen-nor-gl', 'linen-rough'];
const base = {};
let kitLoad = null;
export function loadKitTextures() {
  const loader = new THREE.TextureLoader();
  return kitLoad ||= Promise.all(LINEN.map((f, i) => loader.loadAsync(new URL(`../assets/tex/${f}.webp`, import.meta.url).href).then(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (i === 0) t.colorSpace = THREE.SRGBColorSpace;
    base[f] = t;
  }))).catch(err => { kitLoad = null; throw err; });
}

/* ---------- shader snippets ---------- */

const NOISE = /* glsl */`
  float h3(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + 1.), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * n3(p); p *= 2.03; a *= .5; } return s; }
`;

// The lamp's own parts take no light from the viewer's point and spot lights: those sit centimetres away inside
// the shade, where inverse square blows up and cuts hard terminators. Bodies are lit by the liner instead
// (linerLit), the fabric by its own transmitted glow. Daylight (directional, environment) still applies.
const NO_LOCAL = THREE.ShaderChunk.lights_fragment_begin
  .replace('#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')
  .replace('#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0');
const skipLocal = s => { s.fragmentShader = s.fragmentShader.replace('#include <lights_fragment_begin>', NO_LOCAL); };

// The real source under the shade is the whole lit liner. It is sampled as patches on its lower part; each one is
// seen through the bottom opening and around the body (the neck hides the far side, tested against the turned
// profile), so the light wraps softly over the shoulders. Light bounced off the lit table fills the lower half.
const ROWS = coarse ? 2 : 3, COLS = coarse ? 6 : 8;
const LINER = /* glsl */`
  uniform vec3 uBase, uLampColor;
  uniform float uLampI, uBounce, uProf[17];
  uniform vec4 uShade; // bottom radius, top radius, bottom y, height (m, lamp-local)
  uniform float uTop;
  uniform ivec2 uGrid; // patch rows, columns
  varying vec3 vLinerW;
  // radius of the turned body at height y (0 above it)
  float bodyR(float y) { float f = clamp(y / uTop, 0., 1.) * 16.; int i = int(min(f, 15.)); return y > uTop ? 0. : mix(uProf[i], uProf[i + 1], f - float(i)); }
`;
// Diffuse is summed exactly over the patches; the specular highlight uses one light from their weighted mean
// direction (an area source gives one broad highlight anyway), which keeps the shader small: one BRDF evaluation
// instead of one per patch.
const LINER_LIGHT = /* glsl */`
  {
    vec3 P = vLinerW - uBase;
    vec3 nW = inverseTransformDirection(geometryNormal, viewMatrix);
    float rB = uShade.x, y0 = uShade.z, slope = (uShade.x - uShade.y) / uShade.w, span = uShade.w * .6;
    float irr = 0.; vec3 dir = vec3(0.);
    // uniform loop bounds: the compiler keeps the loop instead of unrolling it 24 times (seconds of compile on
    // Windows, where ANGLE translates to D3D)
    for (int j = 0; j < uGrid.x; j++) {
      float y = y0 + span * (float(j) + .5) / float(uGrid.x);
      float r = rB - slope * (y - y0) - .002;
      for (int i = 0; i < uGrid.y; i++) {
        float a = (float(i) + .5 * float(j)) * 6.2831853 / float(uGrid.y);
        vec3 S = vec3(cos(a) * r, y, sin(a) * r);
        vec3 nS = normalize(vec3(-cos(a), -slope, -sin(a)));
        vec3 d = S - P; float d2 = dot(d, d); vec3 L = d * inversesqrt(d2);
        float w = max(dot(-L, nS), 0.) * max(dot(nW, L), 0.);
        // branch-free on purpose: loops with branches take seconds to compile on Windows (ANGLE/D3D)
        vec2 q = P.xz + d.xz * max(y0 - P.y, 0.) / max(d.y, 1e-4);
        w *= 1. - smoothstep(rB - .004, rB + .001, length(q));
        vec3 X1 = P + d * .2, X2 = P + d * .4, X3 = P + d * .6;
        float gap = min(min(length(X1.xz) - bodyR(X1.y), length(X2.xz) - bodyR(X2.y)), length(X3.xz) - bodyR(X3.y));
        w *= smoothstep(-.001, .004, gap) / max(d2, 6e-3);
        irr += w; dir += L * w;
      }
    }
    if (irr > 0.) {
      directLight.direction = normalize((viewMatrix * vec4(dir, 0.)).xyz);
      float nl = max(dot(geometryNormal, directLight.direction), .05);
      directLight.color = uLampColor * (uLampI * irr / nl);
      vec3 keep = reflectedLight.directDiffuse;
      RE_Direct(directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight);
      reflectedLight.directDiffuse = keep + uLampColor * uLampI * irr * BRDF_Lambert(material.diffuseColor);
    }
    // close to the table a downward face only sees the table in the body's own shadow
    float under = max(-nW.y, 0.), seen = mix(1., smoothstep(0., .06, P.y), under);
    // the table is wood: what it bounces back is the lamp's colour filtered by its orange-brown
    reflectedLight.indirectDiffuse += uLampColor * vec3(1., .58, .32) * uLampI * uBounce * (.2 + .8 * under + .25 * (1. - abs(nW.y))) * seen * BRDF_Lambert(material.diffuseColor);
  }
`;
function linerLit(m, shade, prof, top) {
  const u = {
    uBase: { value: new THREE.Vector3() }, uLampColor: { value: new THREE.Color() }, uLampI: { value: 0 }, uBounce: { value: 0 },
    uShade: { value: new THREE.Vector4(shade.rBottom * CM, shade.rTop * CM, shade.y * CM, shade.h * CM) },
    uProf: { value: Array.from({ length: 17 }, (_, i) => radiusAt(prof, top * i / 16) + .0004) }, uTop: { value: top },
    uGrid: { value: new THREE.Vector2(ROWS, COLS) },
  };
  m.userData.liner = u;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => {
    prev.call(m, s, r);
    Object.assign(s.uniforms, u);
    s.vertexShader = 'varying vec3 vLinerW;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvLinerW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    s.fragmentShader = LINER + s.fragmentShader.replace('#include <lights_fragment_begin>', NO_LOCAL + LINER_LIGHT);
  };
  const key = m.customProgramCacheKey.call(m);
  m.customProgramCacheKey = () => key + '-liner';
  return m;
}

// The body's shadow on the table, from the whole exit ring at once. The viewer's exit lights are a few points on
// that ring; shadow-mapped, each one cast its own hard copy of the body (three dark spokes). The body is left out
// of their shadow maps and the table takes the ring's visibility instead: each ring sample is tested against the
// turned profile at a few heights, like the liner. What the ring can't reach is still lit a little by the bounce
// off the lit table and body around it.
const RING_N = coarse ? 10 : 16;
const RING = /* glsl */`
  uniform vec3 uBase;
  uniform vec2 uExit; // ring radius, height (m, lamp-local)
  uniform float uProf[17], uTop, uFill;
  uniform int uRingN;
  varying vec3 vRingW;
  float bodyR(float y) { float f = clamp(y / uTop, 0., 1.) * 16.; int i = int(min(f, 15.)); return y > uTop ? 0. : mix(uProf[i], uProf[i + 1], f - float(i)); }
  float ringVis(vec3 P) {
    float v = 0.;
    for (int i = 0; i < uRingN; i++) {
      float a = float(i) * 6.2831853 / float(uRingN);
      vec3 d = vec3(cos(a) * uExit.x, uExit.y, sin(a) * uExit.x) - P;
      float gap = 1.;
      for (int k = 0; k < 6; k++) {
        float y = uTop * (.08 + .14 * float(k)), t = clamp((y - P.y) / d.y, 0., 1.);
        vec3 X = P + d * t;
        gap = min(gap, length(X.xz) - bodyR(y));
      }
      v += smoothstep(-.002, .005, gap);
    }
    return mix(uFill, 1., v / float(uRingN));
  }
`;
function ringShadowed(m, prof, top, exit) {
  const u = {
    uBase: { value: new THREE.Vector3() }, uExit: { value: new THREE.Vector2(exit.r, exit.y) }, uFill: { value: .14 },
    uProf: { value: Array.from({ length: 17 }, (_, i) => radiusAt(prof, top * i / 16) + .0004) }, uTop: { value: top },
    uRingN: { value: RING_N },
  };
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => {
    prev.call(m, s, r);
    Object.assign(s.uniforms, u);
    s.vertexShader = 'varying vec3 vRingW;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvRingW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    s.fragmentShader = RING + s.fragmentShader
      .replace('#include <lights_fragment_begin>', 'float kitVis = ringVis(vRingW - uBase);\n#include <lights_fragment_begin>')
      .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace(
        'getPointLightInfo( pointLight, geometryPosition, directLight );', 'getPointLightInfo( pointLight, geometryPosition, directLight );\n\t\tdirectLight.color *= kitVis;'));
  };
  const key = m.customProgramCacheKey.call(m);
  m.customProgramCacheKey = () => key + '-ring';
  return u;
}

// Turned wood: the growth rings are solid (distance from a pith line, computed in object space), so the turning
// shows what the real piece does: near-vertical lines on the neck and elongated bullseyes where the bulb passes
// closest to the pith. Fine fibre streaks and pores run along the grain, oak rays cross it.
function woodMaterial(f, grain) {
  const m = new THREE.MeshPhysicalMaterial({ roughness: f.rough, clearcoat: f.clearcoat, clearcoatRoughness: .38 });
  const u = {
    uEarly: { value: new THREE.Color(f.early) }, uLate: { value: new THREE.Color(f.late) },
    uPith: { value: new THREE.Vector3(...grain.pith) }, uGrain: { value: new THREE.Vector3(...grain.dir).normalize() },
    uRing: { value: grain.ring }, uRings: { value: grain.contrast ?? .38 }, uPores: { value: grain.pores ?? 1 },
    uRelief: { value: grain.relief ?? 1 },
  };
  m.userData.uniforms = u;
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, u);
    s.vertexShader = 'varying vec3 vLocal;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position * 100.;');
    s.fragmentShader = 'varying vec3 vLocal;\nuniform vec3 uEarly, uLate, uPith, uGrain;\nuniform float uRing, uRings, uPores, uRelief;\n' + NOISE +
      s.fragmentShader
        .replace('#include <color_fragment>', /* glsl */`
          vec3 p = vLocal, r = p - uPith;
          float along = dot(r, uGrain);
          vec3 radial = r - along * uGrain;
          float rho = length(radial);
          // rings wander: a broad sway plus a finer wobble, so neighbouring rings are never quite parallel
          float d = rho + (fbm(p * .16) - .5) * .5 + (fbm(p * .7 + 9.) - .5) * .12 + .08 * sin(along * .45);
          // growth differs from year to year: rings of uneven width
          d += uRing * .6 * n3(vec3(d / uRing * .5, 0., 0.));
          float ring = fract(d / uRing), year = floor(d / uRing);
          // latewood darkens gradually through the year; the boundary is the sharp step to next spring's wood
          // pores (dashes ~.8 x .15 mm), rays and fibres are finer than a pixel from most viewpoints, where they only
          // alias (shimmer, visible pixels on phones): each fades to its average as the pixel footprint (cm) grows.
          // The rings themselves get close to that from afar, so the latewood edge widens and then fades out too.
          float fw = length(fwidth(p));
          float late = smoothstep(.3, .97, ring) * (1. - smoothstep(1. - max(.03, fw / uRing), 1., ring)) * (.45 + .55 * n3(vec3(year * 3.1)));
          late = mix(late, .25, smoothstep(.6, 1.2, fw / uRing));
          // the spring wood opens with a band of pores: the ring reads as rows of short dashes, not a drawn line
          float zone = 1. - smoothstep(.04, .3, ring);
          float dens = zone * (.45 + .55 * n3(along * 1.5 * uGrain + radial * 6.)) + .15;
          float fibre = mix(fbm(along * .35 * uGrain + radial * 9.), .47, smoothstep(.03, .09, fw));
          float pore = mix(smoothstep(.62, .78, n3(along * 12. * uGrain + radial * 60.)) * dens * 1.6, dens * .25, smoothstep(.008, .03, fw));
          // oak rays: thin sheets fanning out from the pith, a few mm tall along the grain; where the turning cuts
          // them they show as short ticks across the grain
          vec3 e1 = normalize(cross(uGrain, abs(uGrain.z) < .9 ? vec3(0., 0., 1.) : vec3(1., 0., 0.))), e2 = cross(uGrain, e1);
          float arc = atan(dot(radial, e2), dot(radial, e1)) * rho;
          float ray = mix(smoothstep(.66, .82, n3(vec3(arc * 28., along * 1.6, rho * 2.5))), .1, smoothstep(.012, .04, fw));
          // broad streaks along the grain, patches the oil soaked into unevenly, and a drift between golden and
          // redder wood across the piece
          float figure = n3(along * .12 * uGrain + radial * 1.2 + 11.), oil = fbm(p * .5 + 5.);
          float tone = (.9 + .2 * fbm(p * .18 + 3.)) * (.94 + .12 * figure);
          vec3 c = mix(uEarly, uLate, late * uRings) * (.9 + .2 * fibre) * mix(vec3(1.03, 1., .92), vec3(.97, 1., 1.08), fbm(p * .25 + 17.));
          diffuseColor.rgb = mix(c, uLate * .6, (pore * .32 + ray * .4) * uPores) * tone;
          // rays are dense and polish glossier than the open spring wood
          float woodRough = late * .04 + (pore * .2 - ray * .1) * uPores + (oil - .5) * .16;
          // the wood's own relief (cm, then m): open pores sink, fibres stand up a little, sanding takes the soft
          // spring wood a little lower than the dense latewood (a ripple along each ring that shows in the highlight;
          // smooth, since a step at the ring boundary reads as a pale stitched line in the liner's grazing light),
          // and a hand-sanded turning is never quite true, so the highlight breaks up instead of sliding like plastic
          // (deeper pores catch the liner's grazing light on their upper rims: pale nicks at night)
          float woodH = (-pore * .0012 + (fibre - .47) * .004 + ray * .001) * uPores
            + ((.5 - .5 * cos(6.2832 * ring)) * .002 + (fbm(p * .9 + 2.) - .5) * .016) * uRelief;
          woodH *= .01;
        `)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + woodRough, 0., 1.);')
        // bump from the screen-space derivatives of the height (as three's bump map does); the clearcoat keeps the
        // unperturbed normal
        .replace('#include <normal_fragment_maps>', /* glsl */`
          #include <normal_fragment_maps>
          {
            vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
            vec3 R1 = cross(sy, normal), R2 = cross(normal, sx);
            float det = dot(sx, R1);
            normal = normalize(abs(det) * normal - sign(det) * (dFdx(woodH) * R1 + dFdy(woodH) * R2));
          }
        `);
  };
  m.customProgramCacheKey = () => 'wood';
  return m;
}

// Backlit fabric: besides the usual reflection, the shade glows with the light it transmits. The glow is
// computed per pixel from the lamp position (inverse square, cosine), so it falls off naturally towards the
// rims, and thin spots of the weave let more light through than the threads.
function fabricMaterial(o) {
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color, roughness: .92, sheen: 1, sheenColor: new THREE.Color(o.sheen || '#fff8ec'), sheenRoughness: .75,
    map: o.map, normalMap: o.normalMap, roughnessMap: o.roughnessMap, normalScale: new THREE.Vector2(.35, .35),
    side: o.side || THREE.FrontSide,
  });
  const u = m.userData.uniforms = {
    uLamp: { value: new THREE.Vector3() }, uLampI: { value: 0 }, uLampColor: { value: new THREE.Color() },
    uT: { value: o.transmission }, uFlip: { value: o.inward ? 1 : -1 },
  };
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, u);
    skipLocal(s);
    s.vertexShader = 'varying vec3 vWPos, vWNrm;\n' + s.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.)).xyz;\nvWNrm = normalize(mat3(modelMatrix) * objectNormal);');
    s.fragmentShader = 'varying vec3 vWPos, vWNrm;\nuniform vec3 uLamp, uLampColor;\nuniform float uLampI, uT, uFlip;\n' +
      s.fragmentShader.replace('#include <emissivemap_fragment>', /* glsl */`
        #include <emissivemap_fragment>
        {
          vec3 toL = uLamp - vWPos;
          // light bounces around inside the shade many times before it gets through, which evens out the
          // inverse square of the direct path
          float d2 = mix(max(dot(toL, toL), 1e-5), .0025, .7);
          float c = max(dot(normalize(toL), uFlip * vWNrm), 0.);
          float weave = 1.;
          #ifdef USE_ROUGHNESSMAP
            // how much of the light the threads block (R of the roughness map, see tools/make-linen.py),
            // normalised to the tile's mean so the overall glow doesn't depend on the weave
            weave = (1. - .45 * texture2D(roughnessMap, vRoughnessMapUv).r) / (1. - .45 * ${LINEN_DENSITY});
          #endif
          // the fabric filters what it lets through, more strongly than what it reflects (light scatters through
          // several fibres), so the glow is a warmer version of its colour; seen edge-on it reads darker
          float facing = .7 + .3 * saturate(dot(normal, normalize(vViewPosition)));
          totalEmissiveRadiance += uLampColor * pow(diffuse, vec3(1.5)) * uLampI * (.35 + .65 * c) / d2 * uT * weave * facing * RECIPROCAL_PI;
        }
      `);
  };
  m.customProgramCacheKey = () => 'fabric' + (o.map ? 1 : 0);
  return m;
}

// Table top for kit scenes, in the same solid wood: a flat-sawn walnut veneer, the pith far under the top and
// tilted a little, so the rings cut the surface into long cathedral arches running front to back. Centimetres,
// box centred on its origin. The pores are filled under the lacquer: at table distance open ones read as sand.
export function tableWood() {
  return woodMaterial({ early: '#7a4a2b', late: '#3d2112', rough: .5, clearcoat: .15 }, { pith: [25, -60, 0], dir: [.05, .025, 1], ring: 1.5, contrast: .2, pores: .2, relief: .3 });
}

/* ---------- material library ---------- */

export const WOOD = {
  // oiled, satin: a thin clearcoat, never 0 (that would switch the program on a finish change)
  dogal: { name: 'Doğal', swatch: '#c98745', early: '#c97f3b', late: '#94501f', rough: .55, clearcoat: .12 },
  ceviz: { name: 'Ceviz', swatch: '#5a3420', early: '#6b4128', late: '#33190c', rough: .52, clearcoat: .15 },
};

// one linen tile covers this many centimetres (threads ~0.6 mm apart); mean light blocking of the tile, as
// printed by tools/make-linen.py
const LINEN_TILE = 8.7, LINEN_DENSITY = .528;

export function linenSet(repeat) {
  const set = LINEN.map(f => { const t = base[f].clone(); t.repeat.set(...repeat); return t; });
  return { map: set[0], normalMap: set[1], roughnessMap: set[2] };
}

/* ---------- geometry ---------- */

// Smooth Catmull-Rom through the measured points; corners at the ends stay where they are.
function smoothProfile(pts, n = 220) {
  const curve = new THREE.SplineCurve(pts.map(([r, y]) => v2(r, y)));
  return curve.getSpacedPoints(n);
}

function radiusAt(pts, y) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) return a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y);
  }
  return 0;
}

// One face of the conical wall, offset from the mid-surface. Point order sets the normal: bottom-up faces out.
function wallPoints(rB, rT, y0, y1, off, inward) {
  const pts = [v2(rB + off, y0), v2(rT + off, y1)];
  return inward ? pts.reverse() : pts;
}

// Binding tape folded over a rim: a U around the wall edge, slightly proud of both faces.
function tapePoints(rAt, yEdge, len, t, top) {
  const s = top ? -1 : 1;
  const pad = t / 2 + .08;
  const pts = [];
  pts.push(v2(rAt(yEdge + s * len) - pad + .01, yEdge + s * len));
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * i / 10;
    pts.push(v2(rAt(yEdge) - Math.cos(a) * pad, yEdge - s * Math.sin(a) * pad));
  }
  pts.push(v2(rAt(yEdge + s * len) + pad - .01, yEdge + s * len));
  return top ? pts.reverse() : pts;
}

const lathe = (pts, seg = 160) => new THREE.LatheGeometry(pts, seg);

/* ---------- build ---------- */

// Returns { group, setFinish, setLight, lampPos, ... } — the viewer only talks to the lamp through these.
export function buildLamp(spec) {
  const g = new THREE.Group();
  const mats = [];
  const add = (geo, mat, cast = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast; m.receiveShadow = true;
    g.add(m);
    return m;
  };

  /* body */
  const b = spec.body;
  const prof = smoothProfile(b.profile);
  const top = Math.max(...prof.map(p => p.y));
  const lit = [];
  const byLiner = m => { lit.push(linerLit(m, spec.shade, prof, top)); return m; };
  const wood = byLiner(woodMaterial(WOOD[b.finishes[0]], b.grain));
  // the body stays out of the exit lights' shadow maps (point lights render distance materials); the table takes
  // its shadow from ringShadowed. Daylight shadows are unaffected.
  const noRing = new THREE.MeshDistanceMaterial({ colorWrite: false, depthWrite: false });
  // a satin lacquer: the lit table shows in it towards the silhouette, as in the photos, but only faintly
  wood.userData.envI = .2;
  const bodyMesh = add(lathe(prof, 200), wood);
  bodyMesh.customDistanceMaterial = noRing;
  const rubber = new THREE.MeshStandardMaterial({ color: '#141312', roughness: .85 });
  const foot = add(new THREE.CylinderGeometry(b.foot.r * CM, b.foot.r * CM * .97, b.foot.h * CM, 64), rubber);
  foot.position.y = b.foot.h * CM / 2; foot.customDistanceMaterial = noRing;

  /* details on the body surface */
  const brass = new THREE.MeshPhysicalMaterial({ color: '#d9b26a', metalness: 1, roughness: .28 });
  const black = byLiner(new THREE.MeshStandardMaterial({ color: '#0c0c0d', roughness: .55 }));
  const steel = byLiner(new THREE.MeshStandardMaterial({ color: '#8d9096', metalness: 1, roughness: .35 }));
  const bodyBrass = byLiner(brass.clone());
  for (const d of spec.details || []) {
    const y = d.y * CM, r = radiusAt(prof, y);
    const ang = Math.asin(Math.min(1, d.x * CM / r)) + (d.side === 'back' ? Math.PI : 0);
    const dy = .002, slope = (radiusAt(prof, y + dy) - radiusAt(prof, y - dy)) / (2 * dy);
    const n = new THREE.Vector3(Math.sin(ang), -slope, Math.cos(ang)).normalize();
    const holder = new THREE.Group();
    holder.position.set(Math.sin(ang) * r, y, Math.cos(ang) * r);
    holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    g.add(holder);
    const rr = d.r * CM;
    if (d.type === 'button') {
      const geo = lathe([v2(0, -.3), v2(d.r, -.3), v2(d.r, .02), v2(d.r * .92, .06), v2(0, .06)], 48);
      holder.add(new THREE.Mesh(geo, bodyBrass));
    } else if (d.type === 'usbc') {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, .006, 48), black); disc.position.y = -.0028; holder.add(disc);
      const slot = new THREE.Mesh(new THREE.CapsuleGeometry(rr * .14, rr * .62, 4, 12), steel);
      slot.rotation.z = Math.PI / 2; slot.scale.x = .45; slot.position.y = .0003;
      holder.add(slot);
    } else if (d.type === 'hole') {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, .004, 24), black); hole.position.y = -.0019; holder.add(hole);
    }
  }

  /* shade */
  const s = spec.shade;
  const y0 = s.y, y1 = s.y + s.h;
  const circ = Math.PI * (s.rBottom + s.rTop);
  const outer = fabricMaterial({ color: '#eee4cc', transmission: s.transmission, ...linenSet([Math.round(circ / LINEN_TILE), s.h / LINEN_TILE]) });
  const inner = fabricMaterial({ color: '#efe6d2', transmission: s.liner, inward: true });
  // the tape is folded over the rim: three layers of fabric, so lit from inside it reads as a band a little darker
  // and warmer than the wall (~0.7x in the photos), not grey. Same weave scale as the wall, across the U.
  const tapeLen = 2 * s.tape + Math.PI * (s.thickness / 2 + .08);
  const tape = fabricMaterial({ color: '#e6d6b6', transmission: s.transmission * .6, ...linenSet([Math.round(circ / LINEN_TILE), tapeLen / LINEN_TILE]) });
  mats.push(outer, inner, tape);
  // The fabric casts shadows from its outer faces only: daylight from outside is blocked, but the glow light inside
  // still gets out through the walls, as the light the fabric transmits does
  // (tape and cap, a few millimetres of fabric, cast none: lit from inside they glow too)
  outer.shadowSide = THREE.FrontSide;
  const t2 = s.thickness / 2;
  const rAt = y => s.rBottom + (s.rTop - s.rBottom) * (y - y0) / s.h;
  add(lathe(wallPoints(s.rBottom, s.rTop, y0, y1, t2, false)), outer);
  add(lathe(wallPoints(s.rBottom, s.rTop, y0, y1, -t2, true)), inner, false);
  add(lathe(tapePoints(rAt, y0, s.tape, s.thickness, false)), tape, false);
  add(lathe(tapePoints(rAt, y1, s.tape, s.thickness, true)), tape, false);
  if (s.cap) {
    const capT = s.thickness;
    const capGeo = lathe([v2(0, y1 - capT / 2), v2(s.rTop - .05, y1 - capT / 2), v2(s.rTop - .05, y1 + capT / 2), v2(0, y1 + capT / 2)], 120);
    const cap = fabricMaterial({ color: '#eee4cc', transmission: s.transmission * 1.6, ...linenSet([2 * s.rTop / LINEN_TILE, 2 * s.rTop / LINEN_TILE]) });
    mats.push(cap);
    add(capGeo, cap, false);
    // Planar UVs for the disc so the weave doesn't pinch towards the centre
    const pos = capGeo.attributes.position, uv = capGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (s.rTop * CM) * .5 + .5, pos.getZ(i) / (s.rTop * CM) * .5 + .5);
    const tb = spec.topButton;
    const btn = add(lathe([v2(0, 0), v2(tb.r, 0), v2(tb.r, tb.h * .2), v2(tb.r * .9, tb.h * .6), v2(tb.r * .55, tb.h * .92), v2(0, tb.h)], 64), brass);
    btn.position.y = (y1 + capT / 2) * CM;
  }

  /* light */
  const L = spec.light;
  const lampPos = new THREE.Vector3(0, L.y * CM, 0);
  const color = lampColor(L.kelvin);
  const cd = L.lumen / (4 * Math.PI);
  const exit = { y: (s.y - .05) * CM, r: s.rBottom * .86 * CM };
  const rings = [];

  return {
    group: g, lampPos, color, cd, dimmer: L.dimmer,
    // the metals and the lacquered wood reflect the lit scene, so the viewer hands them its probe capture (taken
    // with the body hidden: the probe sits in front of it)
    reflect: [brass, bodyBrass, steel, wood], body: bodyMesh,
    footprint: Math.max(...prof.map(p => p.x)),
    // where the viewer puts the light leaving the opening: just inside it and near the wall. Low enough that the
    // rim doesn't cut the pool into petals (the liner spreads the light, there is no sharp cut-off), far enough
    // from the neck that it isn't lit from millimetres.
    exit,
    height: (y1 + s.thickness + (spec.topButton?.h || 0)) * CM,
    // a surface under the lamp (the table) takes the body's shadow from the whole exit ring
    receive(m) { rings.push(ringShadowed(m, prof, top, exit)); },
    setFinish(key) {
      const f = WOOD[key];
      wood.userData.uniforms.uEarly.value.set(f.early);
      wood.userData.uniforms.uLate.value.set(f.late);
      wood.roughness = f.rough; wood.clearcoat = f.clearcoat;
    },
    // intensity in the viewer's light units (0 = off), position in world space; colour defaults to the spec's
    setLight(intensity, worldPos, c = color) {
      for (const m of mats) {
        const u = m.userData.uniforms;
        u.uLampI.value = intensity; u.uLamp.value.copy(worldPos); u.uLampColor.value.copy(c);
      }
      for (const m of lit) {
        const u = m.userData.liner;
        u.uLampI.value = intensity * L.body; u.uBounce.value = L.bounce; u.uLampColor.value.copy(c);
        u.uBase.value.copy(worldPos).sub(lampPos);
      }
      for (const u of rings) u.uBase.value.copy(worldPos).sub(lampPos);
    },
  };
}
