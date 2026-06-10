import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const host = "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json"]
]);

const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self' 'sha256-qi1hdlxyBgmfpUnnJSzClV1dXTbX0j5lf6VfR7i16p4='; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
};

function sendText(response, status, message) {
  response.writeHead(status, {
    ...securityHeaders,
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(message);
}

function resolveRequestPath(pathname) {
  const route = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = normalize(join(root, route));
  return filePath.startsWith(root) ? filePath : null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
  const requestedPath = resolveRequestPath(requestUrl.pathname);
  if (!requestedPath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  let filePath = requestedPath;
  if (!existsSync(filePath)) {
    filePath = join(root, "404.html");
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(filePath.endsWith("404.html") && requestedPath !== filePath ? 404 : 200, {
      ...securityHeaders,
      "Content-Type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream",
      "Content-Length": fileStat.size
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch (error) {
    sendText(response, 500, "Server error");
  }
});

server.listen(port, host, () => {
  console.log(`Brie Cakes preview running at http://${host}:${port}`);
});
