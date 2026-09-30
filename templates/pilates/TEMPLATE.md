# Template: pilates

## Target
Pilates / reformer studios (also fits yoga studios that use reformers). Tone: calm, premium, warm; never clinical or anatomical.
Signature: a 3D reformer the visitor can pull and re-spring; scrolling orbits the camera through three text beats.

Page order: 3D hero (3 beats) → studio photo → team (optional) → quiz + WhatsApp time picker → Google reviews (optional) → contact.
All business data lives in `config.js` (`const SITE`). Only `<head>` meta tags are edited in `index.html` (see "Head tags").

## Config fields
Field reference with a filled example: `config.example.js`. Placeholders in `config.js` look like `__NAME__`.

| Field | Required | Source | Notes |
| --- | --- | --- | --- |
| business.name | yes | lead-finder | Full official name as on Google. |
| business.shortName | yes | agent | Next to the logo in the nav, ≤ 12 chars. Often the brand word in the logo ("SVD"). |
| business.phone | yes | lead-finder | Displayed as given; `tel:` link is derived. |
| business.whatsapp | yes | lead-finder | Digits only, starts with `90`. All booking buttons depend on it. If the lead has only a landline, ask the user. |
| business.address | yes | lead-finder | |
| business.mapsQuery | yes | lead-finder | Name + neighbourhood, as you would type it into Google Maps. |
| business.instagram | no | lead-finder | Handle without `@`. `""` hides the row. |
| business.rating | no | lead-finder | Google rating (e.g. `4.9`). `null` hides the stars. Show only if ≥ 4.5. |
| hours | no | lead-finder / user | Monday-first array of `[open, close]` (whole hours) or `null` for a closed day. Whole field `null` when unknown: the time picker then asks for free slots. |
| hoursText | no | agent | Human text for the contact block, e.g. `"Hafta içi 09:00 – 21:00, Cumartesi 10:00 – 16:00"`. `""` hides it. |
| theme.* | yes | agent (from logo) | See "Colours". |
| formats | yes | user / website / Instagram | Any of `"Grup"`, `"Bireysel"`, `"Double"`. First = default. Only list what the studio really offers. |
| programs | no | user / Instagram | Any of `"prenatal"`, `"back"`, `"neck"`, `"injury"`. Only programs the studio explicitly advertises. `[]` is safe: the quiz then gives general plans and asks visitors to tell the instructor about their condition. |
| images.* | yes | inbox | Paths written by `optimize-images.mjs`. Alt texts describe what is actually in the photo. |
| copy.beats[0] | yes | agent | Hero. `title` = short promise (≤ 8 words), `text` = where + who + what, one sentence. |
| copy.beats[1] | no | template | Generic spring explanation; keep it unless the studio does not use reformers with springs. |
| copy.beats[2] | yes | agent | Their way of teaching (small groups, private lessons, focus on form). Based on formats and what they say about themselves. |
| copy.photo | yes | agent | Caption over the studio photo: what the space feels like, where it is. |
| copy.team | if team | agent | `title` like "<Name> Hoca ve ekibi." |
| team[] | no | user | `{ name, role, photo }`. Only real people with a real photo; members without a photo are not rendered. |
| reviews[] | no | Google reviews | `{ who, text }`. Real reviews only: first name + initial, shortened without changing the meaning. 3–6 items. `[]` hides the section. |

## Images
Drop raw files into `inbox/<slug>/`, rename them to the names below, then run `node scripts/optimize-images.mjs <slug>`.

| Name in inbox | Required | Shape / size | Used for |
| --- | --- | --- | --- |
| `logo.*` | yes | any; transparent PNG preferred | Nav (44 px circle) and favicon. Palette comes from here. |
| `studio.*` | yes | landscape, ≥ 1600 px wide | Full-width photo section (desktop). Pick the brightest, widest shot of the room with equipment. |
| `studio-m.*` | no | portrait, ≥ 900 px tall | Same section on phones. Without it, `studio` is cropped to the centre. |
| `team/<first-name>.*` | no | square, face centred | Round portraits. |
| `og.*` | no | 1200×630 | WhatsApp link card. Generated from `studio` when missing. |

Output: `assets/logo.png|webp`, `assets/studio.webp`, `assets/studio-m.webp`, `assets/team/<name>.webp`, `assets/og.jpg`. Update `SITE.images` if the logo came out as `.png`.
The logo sits in a circle with `object-fit: cover`. For a wide or text-only logo, override `.brand img` in the site's `styles.css` with `object-fit: contain; background: var(--surface)`.

## Head tags
WhatsApp and other crawlers do not run JS, so these are written directly into the site's `index.html`:
- `__TITLE__` (twice: `<title>`, `og:title`): `<Business name> · <Neighbourhood>`
- `__DESCRIPTION__` (twice): one sentence, ≤ 155 chars: what, where, for whom.
- `__SITE_URL__` is filled by `new-site.mjs`. `og:image` expects `assets/og.jpg`.

## How to customise
1. Fill `business`, `hours`, `formats`, `programs` from the prompt. Missing data stays empty; the section hides itself.
2. Colours from the logo (below). Check contrast.
3. Copy: beat 0, beat 2, photo caption, team title. Write in Turkish, "sen" form (the site talks to the visitor), short sentences, no exclamation marks, no superlatives ("en iyi", "1 numara"). Use only facts from the prompt: location, equipment seen in photos, formats, instructors' names, what reviews repeatedly praise.
4. The user's extra notes (e.g. "sadece kadınlara", "fizyoterapist eşliğinde") belong in beat 0 or beat 2, stated plainly.
5. Site-specific HTML/CSS edits are allowed in `sites/<slug>/` when the data needs it (e.g. logo fit, a longer name in the nav). Keep them small.

## Colours
- `surface`: the logo's background colour or its lightest brand tone. Must be light.
- `accent`: the logo's strongest colour. If it is very light or neon, darken it until white text on it reaches 4.5:1, or set `onAccent` to `ink`.
- `ink`: a very dark tone of the brand hue (near-black brown, navy, green), never pure `#000`.
- `bg`: near-white, slightly tinted toward `surface`.
- Contrast ≥ 4.5:1 for `ink` on `bg` and `surface`, and `onAccent` on `accent`. This template is light-only: `bg` light, `ink` dark.
- The spring colours (red, green, blue, yellow) are equipment standards and never change.

## Customisation limits
- Free: all copy, theme colours, hiding sections, logo fit, small spacing tweaks.
- Careful: `reformer.js` (camera `SHOTS`, framing functions, physics) and the beat scroll thresholds. Easy to break, hard to verify. Do not change them in a demo.
- Forbidden: invented reviews, team members, numbers ("500+ üye"), certificates, awards, prices, schedules the studio has not published. Programs not in `programs`.
- No eyebrow labels (small uppercase tags above headings). The design rejects them on purpose.

## Checklist (before publishing)
- [ ] `grep -r "__" sites/<slug>/index.html sites/<slug>/config.js` finds nothing
- [ ] WhatsApp number digits start with `90`; phone and Maps query belong to this business
- [ ] `formats` and `programs` contain only what the studio offers
- [ ] Every review is real; every team member is real and has a photo
- [ ] `assets/` exists with `logo`, `studio`, `og.jpg`; total < 3 MB; no image > 400 KB
- [ ] Title and description name this business and neighbourhood
- [ ] Contrast rules above hold
