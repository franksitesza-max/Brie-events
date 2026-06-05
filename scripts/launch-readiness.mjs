import { readFile, readdir } from "node:fs/promises";
import { extname } from "node:path";

const root = new URL("..", import.meta.url);
const htmlFiles = ["index.html", "404.html"];
const blockingItems = [];
const placeholderPattern = /\[[A-Za-z0-9][A-Za-z0-9 '&.,:/-]*\]/g;
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function collectPlaceholders(fileName, source) {
  const items = [];
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    const matches = line.match(placeholderPattern) ?? [];
    for (const placeholder of new Set(matches)) {
      items.push(`${fileName}:${index + 1}: replace ${placeholder}`);
    }
  });

  return items;
}

for (const fileName of htmlFiles) {
  const source = await readFile(new URL(fileName, root), "utf8");
  const lines = source.split(/\r?\n/);
  blockingItems.push(...collectPlaceholders(fileName, source));

  lines.forEach((line, index) => {
    const whatsappLinks = [...line.matchAll(/https:\/\/wa\.me\/([^?"]*)\?/g)];
    for (const match of whatsappLinks) {
      const recipient = match[1];
      if (!recipient) {
        blockingItems.push(`${fileName}:${index + 1}: add WhatsApp recipient number to wa.me link`);
      } else if (!/^\d{8,15}$/.test(recipient)) {
        blockingItems.push(`${fileName}:${index + 1}: use 8 to 15 digits for the WhatsApp recipient number`);
      }
    }

    const emailLinks = [...line.matchAll(/href="mailto:([^"]*)"/g)];
    for (const match of emailLinks) {
      const email = match[1];
      if (email.includes("[") || email.includes("%5B")) {
        blockingItems.push(`${fileName}:${index + 1}: replace placeholder mailto address`);
      } else if (!emailPattern.test(email)) {
        blockingItems.push(`${fileName}:${index + 1}: use a valid email address in the mailto link`);
      }
    }
  });
}

const assetsPath = new URL("assets/", root);
const assetFiles = await readdir(assetsPath);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const realGalleryImages = assetFiles.filter((fileName) => {
  const lowerName = fileName.toLowerCase();
  return imageExtensions.has(extname(lowerName)) && !lowerName.includes("logo") && !lowerName.includes("favicon");
});

if (realGalleryImages.length === 0) {
  blockingItems.push("assets: add real Brie Cakes gallery photos before launch");
}

if (blockingItems.length > 0) {
  console.error("Launch readiness check failed. Resolve these items before publishing:");
  for (const item of blockingItems) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("Launch readiness check passed.");
