# Brie Cakes Website

Single-page website for Brie Cakes, a local custom cake business owned by Polite Ndoro.

## Project Structure

- `index.html` - full website markup, navigation, content sections, SEO FAQ, WhatsApp CTAs, and structured data
- `404.html` - branded fallback page for missing routes
- `styles.css` - responsive styling, brand tokens, accessibility states, and layout rules
- `assets/` - customer-provided brand assets
- `tests/site-checks.mjs` - lightweight production checks for structure, accessibility, and security basics
- `scripts/serve.mjs` - dependency-free local preview server with security headers
- `scripts/launch-readiness.mjs` - pre-launch audit for missing customer content
- `scripts/sync-csp-hash.mjs` - updates CSP hashes after editing the inline JSON-LD
- `CONTENT_CHECKLIST.md` - final customer detail checklist for launch
- `package.json` - repeatable validation scripts
- `robots.txt` - crawl rule for static hosting
- `site.webmanifest` - browser install and theme metadata
- `_headers` - host-level security headers for Netlify and Cloudflare-style static hosting
- `vercel.json` - Vercel security headers and clean URL configuration
- `PROJECT_BRIEF.md` - customer strategy and design brief

## Content Still Needed

The site still keeps unfinished business content as bracketed placeholders:

- Facebook page or profile URL
- Professional photograph of Polite Ndoro
- Real gallery photos

## How To Run

Open `index.html` in a browser, or run the dependency-free local preview server:

```bash
npm run serve
```

On Windows PowerShell, if script execution is restricted, run:

```bash
cmd.exe /c npm.cmd run serve
```

## How To Test

Run the built-in checks with Node.js:

```bash
npm test
```

On Windows PowerShell, if script execution is restricted, run:

```bash
cmd.exe /c npm.cmd test
```

The test checks required sections, WhatsApp pre-filled messaging, missing alt text, CSP framing protection, JSON-LD hash integrity, reduced-motion support, focus states, mobile breakpoint coverage, the 404 page, and crawl rules.

Run the launch-readiness audit before publishing:

```bash
npm run check:launch
```

That command fails while bracketed placeholders, invalid contact links, or missing gallery photos remain. It reports file names and line numbers so fixes are easy to find.

If you edit the structured data in `index.html`, update the CSP hashes before testing:

```bash
npm run sync:csp
```

On Windows PowerShell, use:

```bash
cmd.exe /c npm.cmd run sync:csp
```

## Deployment Notes

Upload the full folder to any static host. Keep `index.html`, `404.html`, `styles.css`, `robots.txt`, `site.webmanifest`, `assets/`, and the favicon image path together.

If the host supports `_headers` or `vercel.json`, keep those files at the project root so the security headers deploy with the site.

Before launch, work through `CONTENT_CHECKLIST.md`, replace bracketed placeholders with real business information, add the Facebook link, and add actual Brie Cakes photography. Use optimized image formats where possible, and keep original filenames descriptive.
