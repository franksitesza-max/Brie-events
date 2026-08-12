import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = new URL("..", import.meta.url);
const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const scriptSrcPattern = /(script-src\s+[^;]*?)(?=;)/g;
const hashTokenPattern = /\s*'sha256-[A-Za-z0-9+/=]+'/g;
const htmlFilesToSync = [
  "index.html",
  "birthday-cakes-somerset-west.html",
  "kids-themed-cakes-somerset-west.html",
  "cake-prices-somerset-west.html",
  "cake-delivery-collection-helderberg.html",
  "bento-cakes-cupcakes-somerset-west.html"
];
const globalFilesToSync = ["vercel.json", "scripts/serve.mjs"];

export function normalizeLf(source) {
  return source.replace(/\r\n?/g, "\n");
}

export function getJsonLdHashes(html, fileName = "HTML source") {
  const normalized = normalizeLf(html);
  const scripts = [...normalized.matchAll(jsonLdPattern)];

  if (scripts.length === 0) {
    throw new Error(`Could not find JSON-LD in ${fileName}.`);
  }

  return scripts.map((match) =>
    `sha256-${createHash("sha256").update(match[1]).digest("base64")}`
  );
}

export function getJsonLdHash(html, fileName = "HTML source") {
  const hashes = getJsonLdHashes(html, fileName);

  if (hashes.length !== 1) {
    throw new Error(`Expected one JSON-LD block in ${fileName}; found ${hashes.length}.`);
  }

  return hashes[0];
}

export function replaceCspHashes(source, hashes, fileName = "source") {
  let replacementCount = 0;
  const uniqueHashes = [...new Set(hashes)];
  const hashList = uniqueHashes.map((hash) => ` '${hash}'`).join("");

  const nextSource = source.replace(scriptSrcPattern, (directive) => {
    replacementCount += 1;
    return `${directive.replace(hashTokenPattern, "")}${hashList}`;
  });

  if (replacementCount !== 1) {
    throw new Error(`Expected one script-src directive in ${fileName}; found ${replacementCount}.`);
  }

  return nextSource;
}

export function replaceJsonLdCspHash(source, currentHash, fileName = "source") {
  return replaceCspHashes(source, [currentHash], fileName);
}

export async function syncCspHashes() {
  const pageSources = new Map();
  const pageHashes = new Map();

  for (const fileName of htmlFilesToSync) {
    const source = await readFile(new URL(fileName, root), "utf8");
    pageSources.set(fileName, source);
    pageHashes.set(fileName, getJsonLdHashes(source, fileName));
  }

  const globalHashes = [...new Set([...pageHashes.values()].flat())];
  let changedCount = 0;

  for (const fileName of htmlFilesToSync) {
    const fileUrl = new URL(fileName, root);
    const source = pageSources.get(fileName);
    const nextSource = replaceCspHashes(source, pageHashes.get(fileName), fileName);

    if (nextSource !== source) {
      await writeFile(fileUrl, nextSource);
      changedCount += 1;
      console.log(`Updated CSP hash in ${fileName}`);
    }
  }

  for (const fileName of globalFilesToSync) {
    const fileUrl = new URL(fileName, root);
    const source = await readFile(fileUrl, "utf8");
    const nextSource = replaceCspHashes(source, globalHashes, fileName);

    if (nextSource !== source) {
      await writeFile(fileUrl, nextSource);
      changedCount += 1;
      console.log(`Updated CSP hashes in ${fileName}`);
    }
  }

  if (changedCount === 0) {
    console.log("CSP hashes already match all current JSON-LD blocks.");
  }
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  await syncCspHashes();
}
