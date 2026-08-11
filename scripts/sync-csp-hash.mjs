import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = new URL("..", import.meta.url);
const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const scriptHashPattern = /(script-src\s+[^;]*?)'sha256-[A-Za-z0-9+/=]+'/g;
const filesToSync = ["index.html", "vercel.json", "scripts/serve.mjs"];

export function normalizeLf(source) {
  return source.replace(/\r\n?/g, "\n");
}

export function getJsonLdHash(html) {
  const match = normalizeLf(html).match(jsonLdPattern);
  if (!match) {
    throw new Error("Could not find JSON-LD script in index.html.");
  }

  return `sha256-${createHash("sha256").update(match[1]).digest("base64")}`;
}

export function replaceJsonLdCspHash(source, currentHash, fileName = "source") {
  let replacementCount = 0;
  const nextSource = source.replace(scriptHashPattern, (match, prefix) => {
    replacementCount += 1;
    return `${prefix}'${currentHash}'`;
  });

  if (replacementCount !== 1) {
    throw new Error(`Expected one JSON-LD CSP hash in ${fileName}; found ${replacementCount}.`);
  }

  return nextSource;
}

export async function syncCspHashes() {
  const indexHtml = await readFile(new URL("index.html", root), "utf8");
  const currentHash = getJsonLdHash(indexHtml);
  let changedCount = 0;

  for (const fileName of filesToSync) {
    const fileUrl = new URL(fileName, root);
    const source = await readFile(fileUrl, "utf8");
    const nextSource = replaceJsonLdCspHash(source, currentHash, fileName);

    if (nextSource !== source) {
      await writeFile(fileUrl, nextSource);
      changedCount += 1;
      console.log(`Updated CSP hash in ${fileName}`);
    }
  }

  if (changedCount === 0) {
    console.log("CSP hashes already match the current JSON-LD.");
  }
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  await syncCspHashes();
}
