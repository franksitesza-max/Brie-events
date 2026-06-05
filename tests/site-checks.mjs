import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const notFoundHtml = await readFile(new URL("../404.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
const hostHeaders = await readFile(new URL("../_headers", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../site.webmanifest", import.meta.url), "utf8"));
const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const previewServer = await readFile(new URL("../scripts/serve.mjs", import.meta.url), "utf8");
const launchReadiness = await readFile(new URL("../scripts/launch-readiness.mjs", import.meta.url), "utf8");
const cspSync = await readFile(new URL("../scripts/sync-csp-hash.mjs", import.meta.url), "utf8");
const contentChecklist = await readFile(new URL("../CONTENT_CHECKLIST.md", import.meta.url), "utf8");

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

const requiredSections = ["home", "cakes", "pricing", "about", "gallery", "faq", "contact"];
for (const section of requiredSections) {
  assert(html.includes(`id="${section}"`), `Missing #${section} section.`);
}

const requiredSecurityHeaders = [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security"
];

assert(html.includes('name="viewport"'), "Missing viewport meta tag.");
assert(html.includes("Content-Security-Policy"), "Missing Content Security Policy meta tag.");
assert(html.includes("frame-ancestors 'none'"), "CSP must block framing.");
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(Boolean(jsonLdMatch), "Missing JSON-LD structured data.");
if (jsonLdMatch) {
  const jsonLdHash = `sha256-${createHash("sha256").update(jsonLdMatch[1]).digest("base64")}`;
  assert(html.includes(jsonLdHash), "CSP hash must match the inline JSON-LD.");
}
assert(html.includes("Brie Cakes"), "Missing customer brand name.");
assert(html.includes("Polite Ndoro"), "Missing owner name.");
assert(html.includes("https://wa.me/27685533304?text="), "WhatsApp pre-filled message link is missing.");
assert(html.includes("Hi%20Polite"), "WhatsApp message should address Polite.");
assert(html.includes("politendoro@gmail.com"), "Supplied customer email is missing.");
assert(html.includes("068 553 3304"), "Supplied customer phone number is missing.");
assert(html.includes("franksites.co.za"), "Designer credit is missing.");
assert(html.includes("Can Brie Cakes bake a custom birthday cake?"), "SEO FAQ content is missing.");
assert(html.includes("How early should I order a cake?"), "Cake ordering FAQ content is missing.");
assert(html.includes('rel="manifest" href="site.webmanifest"'), "Missing manifest link.");
assert(html.includes('name="theme-color"'), "Missing theme-color meta tag.");
assert(!/lorem ipsum/i.test(html), "Found lorem ipsum placeholder text.");
assert(countMatches(html, /<img\b/gi) >= 2, "Expected meaningful image usage.");
assert(countMatches(html, /alt="[^"]+"/gi) === countMatches(html, /<img\b/gi), "Every image needs alt text.");
assert(countMatches(html, /class="button button-primary"/g) >= 2, "Expected primary CTAs in hero and contact.");

assert(notFoundHtml.includes("Page Not Found | Brie Cakes"), "404 page title is missing.");
assert(notFoundHtml.includes("Content-Security-Policy"), "404 page is missing CSP.");
assert(notFoundHtml.includes("index.html"), "404 page must link back home.");
assert(notFoundHtml.includes("https://wa.me/27685533304?text="), "404 page must preserve WhatsApp fallback.");
assert(countMatches(notFoundHtml, /alt="[^"]+"/gi) === countMatches(notFoundHtml, /<img\b/gi), "Every 404 image needs alt text.");

assert(packageJson.scripts?.test === "node tests/site-checks.mjs", "package.json test script is missing or incorrect.");
assert(packageJson.scripts?.serve === "node scripts/serve.mjs", "package.json serve script is missing or incorrect.");
assert(packageJson.scripts?.["check:launch"] === "node scripts/launch-readiness.mjs", "package.json launch check script is missing or incorrect.");
assert(packageJson.scripts?.["sync:csp"] === "node scripts/sync-csp-hash.mjs", "package.json CSP sync script is missing or incorrect.");
assert(packageJson.private === true, "package.json should be private.");
assert(robots.includes("User-agent: *"), "robots.txt missing user agent rule.");
assert(robots.includes("Allow: /"), "robots.txt should allow crawling.");

for (const header of requiredSecurityHeaders) {
  assert(hostHeaders.includes(header), `_headers missing ${header}.`);
}
assert(hostHeaders.includes("nosniff"), "_headers should set nosniff.");
assert(hostHeaders.includes("camera=(), microphone=()"), "_headers should disable sensitive browser permissions.");

const vercelHeaders = vercelConfig.headers?.[0]?.headers ?? [];
const vercelHeaderNames = new Set(vercelHeaders.map((header) => header.key));
for (const header of requiredSecurityHeaders) {
  assert(vercelHeaderNames.has(header), `vercel.json missing ${header}.`);
}
const vercelCsp = vercelHeaders.find((header) => header.key === "Content-Security-Policy")?.value;
assert(Boolean(vercelCsp), "vercel.json missing CSP value.");
if (vercelCsp && jsonLdMatch) {
  const jsonLdHash = `sha256-${createHash("sha256").update(jsonLdMatch[1]).digest("base64")}`;
  assert(html.includes(jsonLdHash), "index.html CSP hash must match inline JSON-LD.");
  assert(vercelCsp.includes(jsonLdHash), "vercel.json CSP hash must match inline JSON-LD.");
  assert(hostHeaders.includes(jsonLdHash), "_headers CSP hash must match inline JSON-LD.");
  assert(previewServer.includes(jsonLdHash), "Preview server CSP hash must match inline JSON-LD.");
}
assert(vercelConfig.cleanUrls === true, "vercel.json should enable clean URLs.");

assert(manifest.name === "Brie Cakes", "Manifest name is incorrect.");
assert(manifest.theme_color === "#E8BCC1", "Manifest theme color should match the brand palette.");
assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, "Manifest needs at least one icon.");

assert(previewServer.includes("Method not allowed"), "Preview server should reject unsupported methods.");
assert(previewServer.includes("filePath.startsWith(root)"), "Preview server should guard against path traversal.");
for (const header of requiredSecurityHeaders.slice(0, 5)) {
  assert(previewServer.includes(header), `Preview server missing ${header}.`);
}
assert(launchReadiness.includes("Launch readiness check failed"), "Launch readiness script should report blocking items.");
assert(launchReadiness.includes("add real Brie Cakes gallery photos"), "Launch readiness script should require real gallery photos.");
assert(launchReadiness.includes("add WhatsApp recipient number"), "Launch readiness script should require WhatsApp recipient numbers.");
assert(launchReadiness.includes("\\d{8,15}"), "Launch readiness script should validate WhatsApp number length.");
assert(launchReadiness.includes("emailPattern"), "Launch readiness script should validate mailto addresses.");
assert(launchReadiness.includes("${fileName}:${index + 1}"), "Launch readiness script should report line-numbered findings.");
assert(!launchReadiness.includes("\\[[^\\]]+\\]"), "Launch readiness placeholder matching should not catch JSON arrays.");
assert(cspSync.includes("sync-csp-hash") || cspSync.includes("CSP hashes"), "CSP sync script should report its work.");
assert(cspSync.includes("scripts/serve.mjs"), "CSP sync script should update the preview server policy.");
assert(cspSync.includes("vercel.json"), "CSP sync script should update Vercel policy.");
assert(contentChecklist.includes("WhatsApp number in international format"), "Content checklist should request WhatsApp number format.");
assert(contentChecklist.includes("27685533304"), "Content checklist should include the supplied WhatsApp number.");
assert(contentChecklist.includes("Avoid stock images"), "Content checklist should require real photography.");

assert(css.includes("@media (max-width: 680px)"), "Missing mobile breakpoint.");
assert(css.includes("prefers-reduced-motion"), "Missing reduced-motion handling.");
assert(css.includes(":focus-visible"), "Missing visible focus states.");
assert(css.includes("min-height: 44px") || css.includes("min-height: 48px"), "Touch targets should be at least 44px high.");
assert(!/letter-spacing:\s*-\d/.test(css), "Negative letter spacing is not allowed.");

if (failures.length) {
  console.error("Site checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Site checks passed.");
