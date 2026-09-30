// Usage: node scripts/cleanup.mjs [--dry-run] [--days <n>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITES = path.join(ROOT, "sites");
const DAY_MS = 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const daysIdx = args.indexOf("--days");
const days = daysIdx === -1 ? 30 : Number(args[daysIdx + 1]);
if (!Number.isInteger(days) || days < 1) {
  console.error("Error: --days must be a positive integer");
  process.exit(1);
}

const now = Date.now();
const expired = [];
const skipped = [];

for (const slug of fs.existsSync(SITES) ? fs.readdirSync(SITES) : []) {
  const dir = path.join(SITES, slug);
  if (!fs.statSync(dir).isDirectory()) continue;

  const metaPath = path.join(dir, "site.json");
  if (!fs.existsSync(metaPath)) {
    skipped.push(`${slug} (no site.json)`);
    continue;
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch {
    skipped.push(`${slug} (invalid site.json)`);
    continue;
  }
  if (meta.keep === true) continue;

  const created = Date.parse(meta.createdAt);
  if (Number.isNaN(created)) {
    skipped.push(`${slug} (invalid createdAt)`);
    continue;
  }

  const age = Math.floor((now - created) / DAY_MS);
  if (age > days) expired.push({ slug, age });
}

for (const { slug, age } of expired) {
  if (!dryRun) fs.rmSync(path.join(SITES, slug), { recursive: true, force: true });
  console.log(`${dryRun ? "would delete" : "deleted"}: ${slug} (${age} days)`);
}
if (expired.length === 0) console.log(`No sites older than ${days} days.`);
for (const s of skipped) console.warn(`skipped: ${s}`);
