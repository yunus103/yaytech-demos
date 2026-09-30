// Usage: node scripts/new-site.mjs <template> <slug> [--lead <leadId>] [--name "<business name>"]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RESERVED = new Set(["www", "app", "api", "mail", "demo", "admin", "static"]);
// Template-only files: heavy media is served from /_t/<template>/media, docs stay with the template.
const SKIP = new Set(["media", "TEMPLATE.md", "config.example.js"]);

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = argv[++i];
    else positional.push(argv[i]);
  }
  return { positional, flags };
}

function validateSlug(slug) {
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    fail(`invalid slug "${slug}" (a-z, 0-9, "-"; must not start or end with "-")`);
  }
  if (slug.length > 40) fail(`slug is ${slug.length} chars, max 40`);
  if (RESERVED.has(slug)) fail(`slug "${slug}" is reserved`);
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const [template, slug] = positional;
if (!template || !slug) {
  fail('usage: node scripts/new-site.mjs <template> <slug> [--lead <leadId>] [--name "<name>"]');
}

validateSlug(slug);

const templateDir = path.join(ROOT, "templates", template);
const siteDir = path.join(ROOT, "sites", slug);
if (!fs.existsSync(templateDir)) fail(`template "${template}" not found`);
if (fs.existsSync(siteDir)) fail(`sites/${slug} already exists`);

fs.cpSync(templateDir, siteDir, {
  recursive: true,
  filter: (src) => src === templateDir || !SKIP.has(path.relative(templateDir, src)),
});

// OG tags need the absolute URL, which is known here; templates mark it with __SITE_URL__.
const indexPath = path.join(siteDir, "index.html");
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, "utf8");
  fs.writeFileSync(indexPath, html.replaceAll("__SITE_URL__", `https://${slug}.yaytechstudio.com`));
}

const siteJson = {
  slug,
  template,
  leadId: flags.lead ?? "",
  businessName: flags.name ?? "",
  createdAt: new Date().toISOString().slice(0, 10),
  keep: false,
  note: "",
};
fs.writeFileSync(path.join(siteDir, "site.json"), JSON.stringify(siteJson, null, 2) + "\n");

console.log(`Created sites/${slug} from templates/${template}`);
console.log(`URL: https://${slug}.yaytechstudio.com`);
