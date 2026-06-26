import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const cspHashPattern = /sha256-[A-Za-z0-9+/=]+/g;
const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const filesToSync = ["index.html", "vercel.json", "scripts/serve.mjs"];

function getJsonLdHash(html) {
  const match = html.match(jsonLdPattern);
  if (!match) {
    throw new Error("Could not find JSON-LD script in index.html.");
  }

  return `sha256-${createHash("sha256").update(match[1]).digest("base64")}`;
}

const indexHtml = await readFile(new URL("index.html", root), "utf8");
const currentHash = getJsonLdHash(indexHtml);
let changedCount = 0;

for (const fileName of filesToSync) {
  const fileUrl = new URL(fileName, root);
  const source = await readFile(fileUrl, "utf8");
  const nextSource = source.replace(cspHashPattern, currentHash);

  if (nextSource !== source) {
    await writeFile(fileUrl, nextSource);
    changedCount += 1;
    console.log(`Updated CSP hash in ${fileName}`);
  }
}

if (changedCount === 0) {
  console.log("CSP hashes already match the current JSON-LD.");
}
