# Building a template

A template is made once, carefully, with a strong model; every demo is a copy of it. Quality is decided here.
Demo production (the procedure in `/CLAUDE.md`) must never need to understand the template's code, only its `TEMPLATE.md`.

## Workflow: design first, template second
1. **Design for one real business.** Plain HTML/CSS/JS in a scratch folder, real name, real photos, real copy. No config, no abstractions. Iterate until the design is approved. Rules that already apply: no npm, no build, libraries from a CDN (cdnjs preferred) or vendored; mobile first.
2. **Convert** into `templates/<sector>/` (steps below). The original design folder stays untouched.
3. **Rehearse**: produce the original business again as `sites/<slug>/` by following `/CLAUDE.md` from scratch. Anything that needed a judgement call not covered by `TEMPLATE.md` goes into `TEMPLATE.md`.
4. **Register** the sector in lead-finder's `src/data/demo-templates.ts` (Phase 3).

## Conversion checklist
Use `templates/pilates/` as the reference implementation for each step.

1. **Data into `config.js`.** One `const SITE = { … }` (JS, not JSON, so the page also opens from `file://`). Group it: `business`, `theme`, `images`, `copy`, then section data (`team`, `reviews`, …). Loaded without `defer` in `<head>`.
2. **No business text in `<body>`.** Bind with `data-text="copy.photo.title"` and one small fill function; render lists (team, reviews) from arrays. Generic template copy (section headings that fit any business in the sector) may stay in HTML.
3. **`<head>` stays static.** Crawlers (WhatsApp) do not run JS. Use `__TITLE__`, `__DESCRIPTION__` placeholders and `__SITE_URL__` for absolute OG URLs (`new-site.mjs` fills it). OG image: `assets/og.jpg`, 1200×630.
4. **Theme from a few base colours.** Put the base colours on `:root`, apply `SITE.theme` with an inline script right after `config.js` (no flash), derive every other colour with `color-mix()`. No hex or rgba literals elsewhere, except colours that are part of the subject (pilates spring colours).
5. **Empty data hides the section**, including its nav links. Never placeholder text, never invented content. Watch for claims hidden in logic (the pilates quiz only offers programs listed in `SITE.programs`).
6. **Contact always works.** WhatsApp, `tel:` and Maps links are generated from config.
7. **Shared parts.** `<meta name="robots" content="noindex, nofollow">`, `<script src="/_shared/preview-badge.js" defer></script>`, `<script src="/_shared/preview.js" defer></script>` (view tracking for lead-finder), and a footer slot `<span data-yt-preview>Tasarım: <a href="https://yaytechstudio.com">YayTech Studio</a></span>`. The script turns the slot into "Tasarım önizlemesi · YayTech Studio"; without the script (a sold site) the normal credit remains. Style the slot like the rest of the footer.
8. **Heavy media in `media/`**, referenced as `/_t/<sector>/media/...`; it is not copied into demos. `assets/` holds only per-business images and ships empty in the template.
9. **Lightweight on phones.** First screen = image + text immediately; 3D/video lazy. Provide a poster fallback for no WebGL, Save-Data and low-memory devices; respect `prefers-reduced-motion`. Target: first meaningful paint < 2.5 s on 4G, initial load (lazy media excluded) < 3 MB.
10. **Placeholders in the template's `config.js`** are `__UPPER_CASE__` so the checklist grep finds leftovers. `config.example.js` holds the original business, fully commented.
11. **Write `TEMPLATE.md`** with the same headings as `templates/pilates/TEMPLATE.md`: Target, Config fields, Images, Head tags, How to customise, Colours, Customisation limits, Checklist.

## Image naming
`optimize-images.mjs` decides by file name in `inbox/<slug>/`: `logo` (PNG if transparent, else WebP, ≤ 512 px), `og` (1200×630 JPEG), names starting with `studio`/`hero` without `-m` (WebP ≤ 1920 px), everything else WebP ≤ 1200 px. Sub-folders are kept (`team/ayse.jpg` → `assets/team/ayse.webp`). Name a new template's images to fit these rules rather than adding new ones.
