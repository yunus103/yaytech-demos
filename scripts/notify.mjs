// Usage: node scripts/notify.mjs saved <slug>
//        node scripts/notify.mjs deleted <slug> [<slug> ...]
// Tells lead-finder about a published or removed demo. Reads LEAD_FINDER_URL and DEMOS_API_TOKEN from .env.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
  const { LEAD_FINDER_URL, DEMOS_API_TOKEN } = process.env;
  if (!LEAD_FINDER_URL || !DEMOS_API_TOKEN) throw new Error("LEAD_FINDER_URL and DEMOS_API_TOKEN must be set in .env");
  return { url: LEAD_FINDER_URL.replace(/\/+$/, ""), token: DEMOS_API_TOKEN };
}

async function post(payload) {
  const { url, token } = loadEnv();
  const res = await fetch(`${url}/api/demos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`lead-finder ${res.status}: ${body.error || res.statusText}`);
  return body;
}

export async function notifySaved(slug) {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "sites", slug, "site.json"), "utf8"));
  if (!meta.leadId) throw new Error(`sites/${slug}/site.json has no leadId`);
  await post({ action: "saved", leadId: meta.leadId, slug, template: meta.template });
}

export async function notifyDeleted(slugs) {
  const { updated } = await post({ action: "deleted", slugs });
  return updated;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, ...slugs] = process.argv.slice(2);
  try {
    if (action === "saved" && slugs.length === 1) {
      await notifySaved(slugs[0]);
      console.log(`lead-finder: ${slugs[0]} saved`);
    } else if (action === "deleted" && slugs.length > 0) {
      const updated = await notifyDeleted(slugs);
      console.log(`lead-finder: ${updated} lead(s) marked deleted`);
    } else {
      console.error("Usage: node scripts/notify.mjs saved <slug> | deleted <slug> [<slug> ...]");
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
