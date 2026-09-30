# YayTech Demos — agent procedure

This file is the **demo production procedure**: a prompt (usually copied from lead-finder) asks for a new demo site for one business.
For building or changing a template, read `templates/README.md` instead; the rules below about `sites/` still apply.

## Repo in one minute
- `templates/<t>/`: a template. `TEMPLATE.md` is its contract and customisation guide; read it before touching a site made from it.
- `sites/<slug>/`: one demo = a full copy of a template + filled `config.js` + `assets/` + `site.json`. Served at `https://<slug>.yaytechstudio.com`.
- `_shared/`: files every demo loads by absolute path (`/_shared/preview-badge.js`). `templates/<t>/media/` is shared heavy media, served at `/_t/<t>/media/...`.
- `inbox/<slug>/`: raw images from the user. Not in git.
- `scripts/`: `new-site.mjs`, `optimize-images.mjs`, `cleanup.mjs`. Plain Node; images need `npm install` once (sharp).
- Deploy: push to `main`, Vercel deploys in ~1 minute. No build step.

## Procedure
1. **Cleanup.** `node scripts/cleanup.mjs`. Tell the user which sites were deleted (they go into this demo's commit).
2. **Prepare.** Read `templates/<template>/TEMPLATE.md`. Check the slug from the prompt: lowercase `a-z 0-9 -`, ≤ 40 chars, Turkish letters transliterated, derived from the business name without filler words ("SVD Pilates Stüdyo" → `svd-pilates`). If `sites/<slug>` exists, append the district (`svd-pilates-kadikoy`).
3. **Copy.** `node scripts/new-site.mjs <template> <slug> --lead <leadId> --name "<business name>"`.
4. **Data.** Fill `sites/<slug>/config.js` from the prompt: name, phone, WhatsApp, address, Maps, Instagram, hours, rating. Leave unknown fields empty so their sections hide.
5. **Ask for images.** From the image table in `TEMPLATE.md`, give the user a concrete list: "`inbox/<slug>/` klasörüne şunları koy: …". Wait until they say it is done.
6. **Images.** Look at each file in `inbox/<slug>/`, rename it to its role (`logo`, `studio`, `studio-m`, `team/<name>`, `og`), ask if unsure. Then `node scripts/optimize-images.mjs <slug>` and fix `SITE.images` paths if needed (e.g. logo became `.png`).
7. **Theme.** Derive the palette from the logo following the colour rules in `TEMPLATE.md`. Check contrast.
8. **Copy.** Write the texts the template asks for, only from facts in the prompt, the user's notes and what is visible in the photos. Fill the `<head>` placeholders in `index.html`.
9. **Optional touch.** If the business has a distinctive trait (e.g. "sadece kadınlara", "fizyoterapist eşliğinde"), bring it into the hero. Do not touch the areas `TEMPLATE.md` marks as careful.
10. **Check.** Go through the `TEMPLATE.md` checklist item by item. Report anything that could not be satisfied.
11. **Publish.** `git add sites/<slug>` (plus cleanup deletions) and `git commit -m "demo: <slug>"`. Show the user the changed files and ask before `git push`, every time. If anything outside `sites/` changed (`templates/`, `_shared/`, `scripts/`, `vercel.json`), say so explicitly.
12. **Hand over.**
    - Link: `https://<slug>.yaytechstudio.com` (ready ~1 minute after push; ask the user to open and check it on a phone).
    - WhatsApp message suggestion (rules below).
    - The link to paste into lead-finder.

## Content honesty (never break)
- No invented reviews, team members, numbers ("500+ üye"), certificates, awards, prices or schedules. No data = hidden section, never placeholder text.
- Reviews are real Google reviews, shortened without changing the meaning.
- Every demo keeps `noindex` and the preview badge.

## WhatsApp message
- Turkish, 3–5 sentences, "siz" form, warm but professional. No capitals for emphasis, no exclamation piles, no campaign language.
- One detail specific to this business (location, something seen on their Instagram/Maps, the state of their current website: "sitenizin olmadığını gördüm", "mevcut siteniz mobilde zor açılıyor"). Base it on the prompt's "Satış açısı" line.
- Say why you are writing: a preview was prepared for them, here is the link.
- No-pressure close: "Beğenirseniz konuşalım, beğenmezseniz kaldırırım."
- No prices.
- Give two versions: short and a bit more detailed. The user picks and sends; never send anything yourself.

## Maintenance requests
- "<slug>'i tut" → `keep: true` in `sites/<slug>/site.json`, commit, ask before push.
- "<slug>'i hemen kaldır" → delete `sites/<slug>/`, commit, ask before push. Same day if the business asks.
- "<slug>'i template'in son haliyle yenile" → re-copy the template files over the site, keeping `config.js`, `assets/`, `site.json` and the filled `<head>` tags.
