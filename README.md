# Brie Events website

Dependency-free static website for Brie Events, marketed to customers as Brie Cakes. Polite Ndoro owns the business and makes custom cakes from Somerset West.

## Business identity

`site-facts.json` is the public factual source of truth. Update it first when the business name, owner, contact details, hours, service areas, starting prices, notice periods, or ordering rules change. Then update the matching website copy, JSON-LD, and AI discovery files. Automated tests check the key identity fields for drift.

Canonical identity:

- Business name: Brie Events
- Customer-facing cake brand: Brie Cakes
- Alternate name: Brie Events Cakes and More
- Canonical URL: https://brieevents.co.za/
- Owner and baker: Polite Ndoro

## Main files

- `index.html`: homepage, cake carousel, service-area ribbon, FAQs, contact details, and JSON-LD
- Five cake guide HTML files: unique local ordering guidance and search landing pages
- `privacy.html` and `terms.html`: POPIA-aligned privacy notice and formal customer terms
- `404.html`: noindex fallback served with a real HTTP 404
- `styles.css`: responsive design system and accessible interaction states
- `scripts/loading.js`: shared page and image skeleton readiness controller used by every HTML route
- `assets/featured/`: approved presentation imagery used in hero and guide-page compositions
- `scripts/gooey-nav.js`: dependency-free active navigation effect adapted from the supplied React Bits concept
- `scripts/carousel.js`: swipe, button, scroll, and keyboard cake-carousel behavior
- `site-facts.json`: public business facts
- `identity.json`: canonical machine-readable identity
- `llms.txt`, `ai.txt`, `ai.json`, `brand.txt`, `faq-ai.txt`, `developer-ai.txt`, and `robots-ai.txt`: AI discovery suite
- `robots.txt`: authoritative crawler policy
- `vercel.json`: clean URLs, redirects, and deployed security headers
- `tests/production-checks.mjs`: identity, SEO, HTML, crawler, CSP, and path-resolution checks
- `tests/server-smoke.mjs`: live local HTTP status, route, redirect, header, and cookie checks
- `.github/workflows/site-checks.yml`: CI validation

## Local preview

Use Node.js 20 or newer.

```bash
npm run serve
```

The local server supports Vercel-style clean HTML routes, the AI compatibility redirects, security headers, and the branded 404 page.

## Validation

Run all checks before deployment:

```bash
npm test
npm run check:launch
npm run check:smoke
```

The project has no npm dependencies and requires no install step.

## CSP hash workflow

The homepage contains one inline JSON-LD block. Its SHA-256 hash must match the policies in `index.html`, `vercel.json`, and `scripts/serve.mjs`.

After editing the JSON-LD:

```bash
npm run sync:csp
npm test
```

The synchronisation script normalises line endings before hashing and changes only the hash inside `script-src`.

## Crawler policy

Search engines, AI search crawlers, and user-request retrieval agents may access public pages. The root `robots.txt` blocks documented model-training and general dataset crawlers. `robots-ai.txt` mirrors that decision and advertises the AI discovery files. Root `robots.txt` remains authoritative.

Review crawler names against first-party documentation before changing the policy.

## Privacy and contact architecture

The website has no form, account, checkout, database, analytics service, advertising tracker, or site cookie. Customers choose an external channel: WhatsApp, telephone, email, or Facebook. Vercel hosts the static files, and Google Fonts supplies web fonts.

## Deployment and rollback

Vercel should deploy this repository as a static site with `vercel.json` at the root. Keep clean URLs enabled and verify that missing routes return 404.

The exact pre-project state is commit `4c1d277`, tagged `brie-baseline-2026-08-11`. Restore that tag on a separate branch if the new version needs to be abandoned. Do not move `main` until the preview passes the launch checklist.

See `LAUNCH_CHECKLIST.md` for the release sequence.
