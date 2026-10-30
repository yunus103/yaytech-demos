import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Cutlery is lofted: a rounded-slab cross-section swept along -Z, so bends and
// tapers follow the surface exactly and normals stay smooth. Profiles are in mm,
// d = distance from the handle end; the result is scaled to metres at the end.

const clamp01 = (t) => Math.min(Math.max(t, 0), 1);
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// Quarter-ellipse closure: 0 at the very end, 1 once `dist` >= r.
const cap = (dist, r) => { const t = clamp01(dist / r); return Math.sqrt(t * (2 - t)); };

// Section for profile sample s = { x, y, a, b, k, c }: centre, half width, half thickness,
// edge roundness (edge x-radius = b * k) and top crown. Point count is fixed: 2(m + 1) + 2f.
function section(s, m, f) {
  // The 0.6a cap keeps the flats non-degenerate near tips, so no vertices coincide.
  const ra = Math.min(s.b * s.k, s.a * 0.6), cx = s.a - ra, pts = [];
  const arc = (ox, from) => {
    for (let i = 0; i <= m; i++) { const t = from + Math.PI * i / m; pts.push([ox + ra * Math.cos(t), s.b * Math.sin(t)]); }
  };
  const flat = (x0, x1, y) => { for (let i = 1; i <= f; i++) pts.push([lerp(x0, x1, i / (f + 1)), y]); };
  arc(cx, -Math.PI / 2); flat(cx, -cx, s.b); arc(-cx, Math.PI / 2); flat(-cx, cx, -s.b);
  return pts.map(([x, y]) => [s.x + x, s.y + (y > 0 ? y * (1 + s.c * (1 - (x / s.a) ** 2)) : y)]);
}

// Places rings by weighted arc length of the profile, so fast-changing parts
// (tip closures, the neck, the bolster) get dense rings and straight runs few.
function arcSamples(profile, d0, d1, segs) {
  const M = 4000, step = (d1 - d0) / M, cum = [0];
  let p = profile(d0);
  for (let i = 1; i <= M; i++) {
    const q = profile(d0 + step * i);
    cum.push(cum[i - 1] + Math.hypot(step, 2.5 * (q.a - p.a), 12 * (q.b - p.b), 2.5 * (q.x - p.x), 2.5 * (q.y - p.y)));
    p = q;
  }
  const out = [];
  for (let j = 0, i = 0; j <= segs; j++) {
    const target = cum[M] * j / segs;
    while (i < M - 1 && cum[i + 1] < target) i++;
    out.push(d0 + step * (i + clamp01((target - cum[i]) / (cum[i + 1] - cum[i]))));
  }
  return out;
}

function loft(profile, d0, d1, segs, m, f) {
  const ds = arcSamples(profile, d0, d1, segs), n = 2 * (m + 1) + 2 * f, rings = segs - 1;
  const pos = [], idx = [];
  for (let i = 1; i < segs; i++) for (const [x, y] of section(profile(ds[i]), m, f)) pos.push(x, y, -ds[i]);
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = i * n + (j + 1) % n;
    idx.push(a, a + n, b, b, a + n, b + n);
  }
  // End samples become poles that fan-close the first and last rings.
  for (const [k, ring, flip] of [[0, 0, false], [segs, rings - 1, true]]) {
    const p = profile(ds[k]), pole = pos.length / 3;
    pos.push(p.x, p.y, -ds[k]);
    for (let j = 0; j < n; j++) {
      const a = ring * n + j, b = ring * n + (j + 1) % n;
      if (flip) idx.push(pole, b, a); else idx.push(pole, a, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

function finish(parts, deform) {
  const g = mergeGeometries(parts);
  if (deform) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, deform(p.getX(i), p.getY(i), -p.getZ(i)));
  }
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  g.translate(-(min.x + max.x) / 2, -min.y, -(min.z + max.z) / 2);
  g.scale(0.001, 0.001, 0.001);
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

const FORK_LEN = 195, FORK_NECK = 118, FORK_HEAD_END = 156.5;

// Underside height: handle end and mid-tines touch the table, neck arches 5 mm, tips curl up.
function forkLift(d) {
  const touch = 168;
  if (d < FORK_NECK) return 5 * Math.sin(Math.PI / 2 * d / FORK_NECK) ** 2;
  if (d < touch) return 5 * Math.cos(Math.PI / 2 * (d - FORK_NECK) / (touch - FORK_NECK)) ** 2;
  return 1.2 * ((d - touch) / (FORK_LEN - touch)) ** 2;
}

function forkBody(d) {
  const a = d < FORK_NECK ? 3 + 8 * (1 - d / FORK_NECK) ** 1.3 : 3 + 9.5 * smooth(FORK_NECK, 147, d);
  const b = 1.25 + 0.1 * smooth(40, FORK_NECK, d) - 0.4 * smooth(FORK_NECK, 150, d);
  const end = FORK_HEAD_END - d;
  return {
    x: 0, y: forkLift(d) + b, k: 1.6, c: 0.15 * (1 - smooth(80, FORK_NECK, d)),
    a: a * cap(d, 7) * cap(end, 1.5), b: b * cap(d, 1.2) * cap(end, 0.9),
  };
}

// Tines start inside the head and stay a hair inside its surfaces there (thinner,
// 0.02 mm up, outer edge 12.45 vs 12.5) so the overlap never z-fights.
const forkTine = (x0) => (d) => {
  const u = (d - 149) / (FORK_LEN - 149), b = lerp(0.92, 0.65, u), tip = FORK_LEN - d;
  const drift = Math.abs(x0) > 5 ? Math.sign(x0) * 0.6 * u * u : 0;
  return { x: x0 - drift, y: forkLift(d) + b + 0.02, k: 1.5, c: 0, a: lerp(2.3, 1.5, u) * cap(tip, 3), b: b * cap(tip, 0.6) };
};

export function forkGeometry() {
  const parts = [loft(forkBody, 0, FORK_HEAD_END, 72, 6, 3)];
  for (const x0 of [-10.15, -3.4, 3.4, 10.15]) parts.push(loft(forkTine(x0), 149, FORK_LEN, 26, 4, 1));
  // Shallow transverse scoop across the head, applied to body and tines alike.
  return finish(parts, (x, y, d) => y + 0.7 * smooth(132, FORK_HEAD_END, d) * (x / 12.5) ** 2);
}

const KNIFE_LEN = 220, BLADE_START = 128;

function knifeProfile(d) {
  const s = clamp01((d - BLADE_START) / (KNIFE_LEN - BLADE_START));
  // Blade half width shrinks toward the tip on the edge side only: the spine stays at x = +10.
  const blade = 10 * (1 - 0.35 * s ** 2.2);
  const a = d < 112 ? 9 - 1.5 * smooth(20, 100, d) - 3 * smooth(96, 112, d) : lerp(4.5, blade, smooth(112, BLADE_START, d));
  const b = 2.75 - 1.05 * smooth(94, 110, d) - 1.1 * smooth(108, 126, d);
  const tip = KNIFE_LEN - d;
  return {
    x: 10 - blade, k: 1.4, c: 0.25 * (1 - smooth(80, 105, d)),
    // Handle lies flat; the blade (centred on the handle axis) eases down so its tip touches.
    y: 2.75 - 2.15 * smooth(118, 215, d),
    a: a * cap(d, 6) * cap(tip, 8), b: b * cap(d, 2.4) * cap(tip, 0.6),
  };
}

export function knifeGeometry() {
  return finish([loft(knifeProfile, 0, KNIFE_LEN, 90, 7, 4)]);
}
