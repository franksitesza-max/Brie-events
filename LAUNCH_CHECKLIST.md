# Brie Events launch checklist

Use this checklist for the `codex/brie-seo-security-legal` preview branch before promoting it to production.

## Safe rollback

- The exact pre-upgrade website is preserved in commit `4c1d277`.
- The same snapshot is tagged `brie-baseline-2026-08-11`.
- Do not delete that tag after launch.
- If the new site must be withdrawn, redeploy the tagged snapshot or revert the upgrade commit. Do not rewrite `main` history.

## Business facts

- Confirm the phone number, email address, Facebook page, and WhatsApp link against `site-facts.json`.
- Confirm that Polite Ndoro is the owner, baker, and Information Officer contact.
- Confirm the published hours, service areas, starting prices, 50% deposit, and seven-day minimum notice.
- Confirm that the public location should remain Somerset West without a street address.

## Content and legal review

- Read the homepage and all five cake guides on desktop and mobile.
- Check the privacy notice and terms against the way orders are actually handled.
- Confirm the retention approach and the process for access, correction, objection, deletion, and gallery takedown requests.
- Confirm that no analytics, advertising pixels, forms, or cookies were added before keeping the current no-cookie wording.
- Obtain South African legal review if the policies will be relied on for a dispute or a material change to business operations.

## Visual and interaction review

- Test the Gooey navigation with a mouse, keyboard, and reduced-motion enabled.
- Swipe the cake carousel on a real phone and operate its previous/next controls with a keyboard.
- Confirm the service-area ribbon still moves and becomes static when reduced-motion is enabled.
- Check that cake photographs are sharp, correctly cropped, and accurately described.
- Test at 390 px, 768 px, 1024 px, and a wide desktop viewport.

## Automated checks

Run:

```bash
npm test
npm run check:launch
npm run check:smoke
```

All three commands must pass before promotion. GitHub Actions runs the same checks for pushed branches.

## Search and AI discovery

- Open `/robots.txt`, `/robots-ai.txt`, `/llms.txt`, `/ai.txt`, `/ai.json`, and `/identity.json` in the preview deployment.
- Confirm `/llm.txt` and `/llms.html` redirect permanently to `/llms.txt`.
- Confirm `/ai-visibility-verify.txt` contains only the verification token.
- Validate the homepage structured data with Google Rich Results Test and Schema.org Validator.
- Submit the sitemap in Google Search Console after production promotion.
- Request indexing for the homepage and the five new cake guides after production promotion.

## Deployment behavior

- Confirm the preview returns the CSP, HSTS, frame denial, referrer, permissions, and MIME-sniffing headers.
- Confirm an unknown route returns HTTP 404 and the 404 page contains `noindex, follow`.
- Confirm the `www` hostname permanently redirects to `https://brieevents.co.za/`.
- Confirm no response sets a cookie.
- Promote only after the preview is approved. Keep the baseline tag available for rollback.
