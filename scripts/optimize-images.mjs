// Usage: node scripts/optimize-images.mjs <slug>
// Reads inbox/<slug>/ (renamed by role, see the template's TEMPLATE.md) and writes sites/<slug>/assets/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif", ".tif", ".tiff", ".gif", ".svg"]);
const MAX_FILE_KB = 400;
const MAX_TOTAL_KB = 3 * 1024;
const TR = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

const toFileName = s => s.toLocaleLowerCase("tr").replace(/[çğıöşü]/g, c => TR[c]).replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : IMAGE_EXT.has(path.extname(e.name).toLowerCase()) ? [p] : [];
  });
}

// Hero photos keep more pixels; everything else is capped lower.
const isHero = name => /^(studio|hero)/.test(name) && !name.endsWith("-m");

async function writeLogo(src, outBase) {
  if (path.extname(src).toLowerCase() === ".svg") {
    fs.copyFileSync(src, `${outBase}.svg`);
    return `${outBase}.svg`;
  }
  const img = sharp(src).rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true });
  const { isOpaque } = await sharp(src).stats();
  if (isOpaque) {
    await img.webp({ quality: 85 }).toFile(`${outBase}.webp`);
    return `${outBase}.webp`;
  }
  await img.png({ compressionLevel: 9, palette: true }).toFile(`${outBase}.png`);
  return `${outBase}.png`;
}

async function writeOg(src, outBase) {
  await sharp(src).rotate().resize(1200, 630, { fit: "cover" }).jpeg({ quality: 80, mozjpeg: true }).toFile(`${outBase}.jpg`);
  return `${outBase}.jpg`;
}

async function writePhoto(src, outBase, name) {
  const max = isHero(name) ? 1920 : 1200;
  await sharp(src).rotate().resize(max, max, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${outBase}.webp`);
  return `${outBase}.webp`;
}

const slug = process.argv[2];
if (!slug) fail("usage: node scripts/optimize-images.mjs <slug>");
const inbox = path.join(ROOT, "inbox", slug);
const assets = path.join(ROOT, "sites", slug, "assets");
if (!fs.existsSync(inbox)) fail(`inbox/${slug} not found`);
if (!fs.existsSync(path.join(ROOT, "sites", slug))) fail(`sites/${slug} not found; run new-site.mjs first`);

const files = walk(inbox);
if (!files.length) fail(`no images in inbox/${slug}`);

const written = [];
let heroSource = null;
for (const src of files) {
  const rel = path.relative(inbox, src);
  const name = toFileName(path.basename(rel, path.extname(rel)));
  const outDir = path.join(assets, path.dirname(rel).split(path.sep).map(toFileName).join(path.sep));
  fs.mkdirSync(outDir, { recursive: true });
  const outBase = path.join(outDir, name);
  if (name === "logo") written.push(await writeLogo(src, outBase));
  else if (name === "og") written.push(await writeOg(src, outBase));
  else written.push(await writePhoto(src, outBase, name));
  if (!heroSource && isHero(name)) heroSource = src;
}

if (!written.some(f => path.basename(f) === "og.jpg")) {
  if (heroSource) written.push(await writeOg(heroSource, path.join(assets, "og")));
  else console.warn("warning: no og.* and no studio/hero photo to build og.jpg from");
}

let totalKb = 0;
for (const f of written) {
  const kb = Math.round(fs.statSync(f).size / 1024);
  totalKb += kb;
  const rel = path.relative(path.join(ROOT, "sites", slug), f).split(path.sep).join("/");
  console.log(`${rel.padEnd(36)} ${String(kb).padStart(5)} KB${kb > MAX_FILE_KB ? "  ← over 400 KB" : ""}`);
}
console.log(`total ${totalKb} KB${totalKb > MAX_TOTAL_KB ? "  ← over 3 MB" : ""}`);
