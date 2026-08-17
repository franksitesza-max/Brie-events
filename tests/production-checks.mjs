import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveRequestPath, securityHeaders } from "../scripts/serve.mjs";
import { getJsonLdHash, getJsonLdHashes, replaceCspHashes, replaceJsonLdCspHash } from "../scripts/sync-csp-hash.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const htmlFileNames = (await readdir(root))
  .filter((name) => name.endsWith(".html"))
  .sort();
const htmlFiles = new Map(await Promise.all(
  htmlFileNames.map(async (name) => [name, await read(name)])
));

const index = htmlFiles.get("index.html");
const notFound = htmlFiles.get("404.html");
const css = await read("styles.css");
const robots = await read("robots.txt");
const loadingScript = await read("scripts/loading.js");
const robotsAi = await read("robots-ai.txt");
const llms = await read("llms.txt");
const aiText = await read("ai.txt");
const sitemap = await read("sitemap.xml");
const vercel = JSON.parse(await read("vercel.json"));
const manifest = JSON.parse(await read("site.webmanifest"));
const facts = JSON.parse(await read("site-facts.json"));
const identity = JSON.parse(await read("identity.json"));
const ai = JSON.parse(await read("ai.json"));
const packageJson = JSON.parse(await read("package.json"));
const seoMap = JSON.parse(await read("seo-map.json"));

assert.equal(facts.canonicalName, "Brie Events");
assert.equal(facts.marketedName, "Brie Cakes");
assert.equal(identity.name, facts.canonicalName);
assert.equal(ai.name, facts.canonicalName);
assert.equal(ai.url, facts.canonicalUrl);
assert.equal(seoMap.lastReviewed, facts.lastReviewed);
assert.equal(seoMap.pages.length, 6);
assert.equal(new Set(seoMap.pages.map((page) => page.path)).size, seoMap.pages.length);
assert.equal(new Set(seoMap.pages.map((page) => page.primaryIntent.toLowerCase())).size, seoMap.pages.length);
assert.ok(seoMap.pages.every((page) => page.supportingIntents.length >= 2));
assert.equal(identity.url, facts.canonicalUrl);
assert.equal(identity.description, facts.description);
assert.ok(identity.alternateNames.includes(facts.marketedName));
assert.deepEqual(identity.areaServed, facts.serviceAreas);
assert.equal(identity.metadata.lastUpdated, facts.lastReviewed);
assert.equal(ai.metadata.lastUpdated, facts.lastReviewed);
assert.ok(llms.startsWith("# Brie Events\n"));
assert.match(llms, /## Contact/);
assert.match(llms, /## Verified Buyer Answers/);
assert.match(llms, /## Preferred Sources by Question/);
assert.match(llms, /https:\/\/brieevents\.co\.za\/identity\.json/);
assert.match(aiText, /Do not use this website's content for model training/);

for (const file of ["ai.json", "identity.json", "site-facts.json", "seo-map.json", "site.webmanifest", "vercel.json"]) {
  const source = await read(file);
  assert.doesNotThrow(() => JSON.parse(source), `${file} must contain valid JSON`);
}

assert.ok(index.includes("Custom Cakes Somerset West"));
assert.ok(index.includes("Custom birthday cakes in Somerset West, made by Polite Ndoro."));
assert.ok(!/<meta\s+name="keywords"/i.test(index), "Obsolete meta keywords tag must stay removed.");
assert.ok(index.includes('data-carousel'), "Swipeable cake carousel must remain.");
assert.ok(index.includes('service-ribbon-track'), "Moving location ribbon must remain.");
assert.ok(index.includes('data-gooey-nav'), "Gooey navigation structure is missing.");
assert.ok(index.includes('scripts/gooey-nav.js'), "Gooey navigation script is missing.");
assert.ok(index.includes('scripts/molten-metal.js'), "Molten Metal promise background is missing.");
assert.ok(index.includes('data-molten-metal'), "Molten Metal canvas mount is missing.");
assert.ok(css.includes("@keyframes nav-particle"));
assert.ok(css.includes("@keyframes service-ribbon-scroll"));
assert.ok(css.includes("scroll-snap-type: inline mandatory"));
assert.match(css, /scroll-behavior:\s*smooth/, "CSS smooth scrolling must remain enabled.");
assert.ok(index.includes("assets/featured/brie-butterfly-cake-hero-transparent.png"));
assert.ok(index.includes("assets/gallery/briecakesproductimg-15-cocomelon-first-birthday-cake-real.webp"));
assert.doesNotMatch(index, /AI-enhanced presentation/, "Featured image banners must stay removed.");
const kidsPage = htmlFiles.get("kids-themed-cakes-somerset-west.html");
assert.ok(kidsPage.includes("assets/featured/brie-cocomelon-cake-ai-upscale.webp"));
assert.doesNotMatch(kidsPage, /AI-enhanced presentation/, "Kids featured image banner must stay removed.");
assert.ok(css.includes(".skeleton-media"));
assert.ok(css.includes(".skeleton-media.media-ready"));
assert.ok(css.includes("prefers-reduced-motion"), "Animated effects need a reduced-motion fallback.");
assert.ok(loadingScript.includes("prepareImageSkeleton"));
for (const [name, html] of htmlFiles) {
  assert.ok(html.includes("scripts/loading.js"), `${name} must load the shared skeleton controller.`);
}
for (const asset of [
  "assets/featured/brie-butterfly-cake-hero-transparent.png",
  "assets/featured/brie-cocomelon-cake-ai-upscale.webp",
  "assets/gallery/briecakesproductimg-15-cocomelon-first-birthday-cake-real.webp"
]) {
  const bytes = await readFile(new URL(asset, root));
  assert.ok(bytes.length > 40_000, `${asset} appears incomplete.`);
}
assert.ok(index.includes('href="#cakes-title"'));
assert.ok(index.includes('href="#pricing-content"'));
assert.ok(index.includes('href="#gallery-title"'));
assert.ok(index.includes('href="#contact-title"'));
assert.doesNotMatch(index, /hero-stamp|Made to order/, "Removed hero badge must stay removed.");
const whatsappTemplates = {
  "index.html": ["custom cake quote", "Cake type and servings", "Budget"],
  "birthday-cakes-somerset-west.html": ["custom birthday cake quote", "Birthday person's age", "Guest count"],
  "kids-themed-cakes-somerset-west.html": ["kids themed birthday cake quote", "Child's age", "character inspiration"],
  "cake-prices-somerset-west.html": ["price guide", "Cake format I am considering", "what you recommend"],
  "cake-delivery-collection-helderberg.html": ["collection or delivery", "Preferred handover time", "delivery fee"],
  "bento-cakes-cupcakes-somerset-west.html": ["bento cake and cupcakes quote", "Cupcake quantity", "Bento cake flavour"],
  "404.html": ["custom cake enquiry", "Guest count", "Collection or delivery area"]
};
for (const [fileName, phrases] of Object.entries(whatsappTemplates)) {
  const html = htmlFiles.get(fileName);
  const whatsappLinks = [...html.matchAll(/href="(https:\/\/wa\.me\/27685533304\?text=[^"]+)"/g)];
  assert.ok(whatsappLinks.length > 0, `${fileName} needs a WhatsApp quote link.`);
  for (const link of whatsappLinks) {
    const message = decodeURIComponent(new URL(link[1]).searchParams.get("text"));
    for (const phrase of phrases) {
      assert.match(message, new RegExp(phrase, "i"), `${fileName} WhatsApp template is missing ${phrase}.`);
    }
  }
}
for (const phrase of [
  "Birthday cakes made for your people",
  "A custom quote for every cake brief",
  "Useful answers for a smoother cake order",
  "Every order is shaped around"
]) {
  assert.ok(!index.includes(phrase), `Vague marketing phrase returned: ${phrase}`);
}

const jsonLdMatch = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(jsonLdMatch, "Homepage JSON-LD is missing.");
const graph = JSON.parse(jsonLdMatch[1])["@graph"];
const bakery = graph.find((entry) => entry["@type"] === "Bakery");
assert.equal(bakery.name, "Brie Events");
assert.ok(bakery.alternateName.includes("Brie Cakes"));
assert.equal(bakery.address.addressLocality, "Somerset West");
assert.equal(bakery.address.addressRegion, "Western Cape");
assert.equal(bakery.address.addressCountry, "ZA");
assert.equal(bakery.telephone, facts.contact.telephone);
assert.equal(bakery.email, facts.contact.email);

const guidePages = [
  ["birthday-cakes-somerset-west.html", "birthday-cakes-somerset-west", "Birthday cakes"],
  ["kids-themed-cakes-somerset-west.html", "kids-themed-cakes-somerset-west", "Kids themed cakes"],
  ["cake-prices-somerset-west.html", "cake-prices-somerset-west", "Cake prices"],
  ["cake-delivery-collection-helderberg.html", "cake-delivery-collection-helderberg", "Delivery and collection"],
  ["bento-cakes-cupcakes-somerset-west.html", "bento-cakes-cupcakes-somerset-west", "Bento cakes and cupcakes"]
];
const allJsonLdHashes = [...getJsonLdHashes(index, "index.html")];
for (const [fileName, slug, breadcrumbName] of guidePages) {
  const html = htmlFiles.get(fileName);
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, `${fileName} needs JSON-LD.`);
  const pageGraph = JSON.parse(match[1])["@graph"];
  const webPage = pageGraph.find((entry) => entry["@type"] === "WebPage");
  const breadcrumbs = pageGraph.find((entry) => entry["@type"] === "BreadcrumbList");
  const canonical = `https://brieevents.co.za/${slug}`;
  assert.equal(webPage.url, canonical);
  assert.equal(webPage.about["@id"], "https://brieevents.co.za/#brie-events");
  assert.equal(webPage.dateModified, facts.lastReviewed);
  assert.equal(breadcrumbs.itemListElement[1].name, breadcrumbName);
  assert.equal(breadcrumbs.itemListElement[1].item, canonical);
  assert.match(html, /class="breadcrumbs" aria-label="Breadcrumb"/);
  assert.match(html, new RegExp(`href="/${slug}" aria-current="page"`));
  const pageHashes = getJsonLdHashes(html, fileName);
  assert.equal(pageHashes.length, 1);
  assert.ok(html.includes(pageHashes[0]), `${fileName} CSP needs its JSON-LD hash.`);
  allJsonLdHashes.push(...pageHashes);
}

const cspHash = getJsonLdHash(index);
assert.equal(cspHash, `sha256-${createHash("sha256").update(jsonLdMatch[1].replace(/\r\n?/g, "\n")).digest("base64")}`);
assert.ok(index.includes(cspHash));
const deployedCsp = vercel.headers[0].headers.find((header) => header.key === "Content-Security-Policy")?.value;
assert.equal(deployedCsp, securityHeaders["Content-Security-Policy"]);
for (const hash of new Set(allJsonLdHashes)) {
  assert.ok(deployedCsp.includes(`'${hash}'`), `Global CSP is missing ${hash}.`);
}
for (const directive of ["object-src 'none'", "connect-src 'none'", "media-src 'none'", "frame-src 'none'", "worker-src 'none'", "script-src-attr 'none'", "style-src-attr 'none'", "manifest-src 'self'", "frame-ancestors 'none'"]) {
  assert.ok(deployedCsp.includes(directive), `Missing CSP directive: ${directive}`);
}
assert.ok(!deployedCsp.includes("*.vercel.app"));
assert.ok(!index.includes("*.vercel.app"));
for (const [header, expected] of Object.entries({
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Origin-Agent-Cluster": "?1"
})) {
  assert.equal(vercel.headers[0].headers.find((entry) => entry.key === header)?.value, expected);
  assert.equal(securityHeaders[header], expected);
}

const hashFixture = "style-src 'sha256-stylehash='; script-src 'self' 'sha256-oldhash='; object-src 'none'";
const replacedFixture = replaceJsonLdCspHash(hashFixture, "sha256-newhash=", "fixture");
assert.ok(replacedFixture.includes("'sha256-stylehash='"));
assert.ok(replacedFixture.includes("'sha256-newhash='"));
assert.ok(!replacedFixture.includes("'sha256-oldhash='"));
const multiHashFixture = replaceCspHashes(hashFixture, ["sha256-one=", "sha256-two="], "fixture");
assert.ok(multiHashFixture.includes("'sha256-one='"));
assert.ok(multiHashFixture.includes("'sha256-two='"));
assert.ok(!multiHashFixture.includes("'sha256-oldhash='"));

const fixtureRoot = resolve("fixture-root");
assert.equal(resolveRequestPath("/assets/logo.svg", fixtureRoot).status, 200);
assert.equal(resolveRequestPath("/%E0%A4%A", fixtureRoot).status, 400);
assert.equal(resolveRequestPath("/%2e%2e/fixture-root-sibling/secret.txt", fixtureRoot).status, 403);

assert.match(notFound, /name="robots" content="noindex, follow"/);
assert.match(notFound, /href="\/"/);

for (const [name, html] of htmlFiles) {
  assert.match(html, /name="viewport"/, `${name} needs a viewport meta tag.`);
  assert.match(html, /Content-Security-Policy/, `${name} needs a CSP meta tag.`);
  if (name !== "404.html") {
    assert.match(html, /name="description"[\s\S]*?content="[^"]+"/, `${name} needs a meta description.`);
    assert.match(html, /rel="canonical" href="https:\/\/brieevents\.co\.za\/[^"]*"/, `${name} needs an absolute canonical URL.`);
    assert.match(html, /property="og:image:secure_url" content="https:\/\/brieevents\.co\.za\/[^"]+"/, `${name} needs a secure Open Graph image URL.`);
    assert.match(html, /property="og:image:width" content="\d+"/, `${name} needs Open Graph image width.`);
    assert.match(html, /property="og:image:height" content="\d+"/, `${name} needs Open Graph image height.`);
  }
  const blankTargets = html.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? [];
  for (const anchor of blankTargets) {
    assert.match(anchor, /rel="[^"]*noopener[^"]*noreferrer[^"]*"/, `${name} has an unsafe blank-target link.`);
  }
  const images = html.match(/<img\b[^>]*>/g) ?? [];
  for (const image of images) {
    assert.match(image, /\balt="[^"]*"/, `${name} has an image without alt text.`);
  }
}

for (const page of ["privacy.html", "terms.html"]) {
  assert.ok(htmlFiles.has(page), `${page} is missing.`);
}
assert.match(htmlFiles.get("privacy.html"), /POPIA/);
assert.match(htmlFiles.get("privacy.html"), /does not set website cookies/);
assert.match(htmlFiles.get("terms.html"), /50% deposit/);
assert.match(htmlFiles.get("terms.html"), /Consumer Protection Act/);

const publicSlugs = [
  "",
  "birthday-cakes-somerset-west",
  "kids-themed-cakes-somerset-west",
  "cake-prices-somerset-west",
  "cake-delivery-collection-helderberg",
  "bento-cakes-cupcakes-somerset-west",
  "privacy",
  "terms"
];
for (const slug of publicSlugs) {
  assert.ok(sitemap.includes(`<loc>https://brieevents.co.za/${slug}</loc>`));
}
const sitemapDates = [...sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map((match) => match[1]);
assert.equal(sitemapDates.length, publicSlugs.length);
assert.ok(sitemapDates.every((date) => date <= facts.lastReviewed));
assert.equal(sitemapDates.filter((date) => date === facts.lastReviewed).length, 6);

for (const agent of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"]) {
  assert.match(robots, new RegExp(`User-agent: ${agent}\\nAllow: /`));
}
for (const agent of ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Bytespider", "meta-externalagent", "Amazonbot", "Applebot-Extended", "cohere-ai", "Diffbot"]) {
  assert.match(robots, new RegExp(`User-agent: ${agent}\\nDisallow: /`));
  assert.match(robotsAi, new RegExp(`User-agent: ${agent}\\nDisallow: /`));
}
assert.match(robotsAi, /Discovery: https:\/\/brieevents\.co\.za\/identity\.json/);

const redirects = vercel.redirects;
assert.ok(redirects.some((entry) => entry.source === "/llm.txt" && entry.destination === "/llms.txt"));
assert.ok(redirects.some((entry) => entry.source === "/llms.html" && entry.destination === "/llms.txt"));
assert.ok(redirects.some((entry) => entry.destination === "https://brieevents.co.za/:path*"));
assert.equal(vercel.cleanUrls, true);

assert.equal(packageJson.dependencies, undefined);
assert.equal(packageJson.devDependencies, undefined);
assert.equal(manifest.name, "Brie Cakes by Brie Events");
assert.equal(manifest.theme_color, "#F4D8D8");

console.log(`Production checks passed across ${htmlFiles.size} HTML files.`);
