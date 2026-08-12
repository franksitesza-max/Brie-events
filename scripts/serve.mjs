import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const defaultPort = Number.parseInt(process.env.PORT ?? "8080", 10);
const defaultHost = "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json"]
]);

export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; style-src-attr 'none'; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'sha256-8kchyQBPEpdg5RTriWOoi3QVqY4KKzktPXiqg+jSDXU=' 'sha256-ag8QhAbX49PeCguplze/f1U6K3ZFZJ/bhbBwcBUg65I=' 'sha256-RMIR1tUWV0HgVeKwxBnCr/Fzgj12uL/U8GRe3V/rPMY=' 'sha256-tBhuDkR4IwTXjRTuLz+ZirWyoQAaJhFt/WoKcbpKx+g=' 'sha256-pzi2/t0nMhPYDnr5xdLVOmmzINMrSdWjkMF24lFQkvk=' 'sha256-cX4DxyB2VDmZV5be159jLWdYYgXsYxzymVf7v8RuBs8='; script-src-attr 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Origin-Agent-Cluster": "?1"
};

function sendText(response, status, message, extraHeaders = {}) {
  response.writeHead(status, {
    ...securityHeaders,
    ...extraHeaders,
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(message)
  });
  response.end(message);
}

function sendRedirect(response, destination) {
  response.writeHead(308, {
    ...securityHeaders,
    "Location": destination,
    "Content-Length": "0"
  });
  response.end();
}

export function resolveRequestPath(pathname, siteRoot = root) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return { status: 400, filePath: null };
  }

  const route = decodedPath === "/" ? "index.html" : decodedPath.replace(/^[/\\]+/, "");
  const filePath = resolve(siteRoot, route);
  const relativePath = relative(siteRoot, filePath);
  const escapesRoot = relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath);

  return escapesRoot
    ? { status: 403, filePath: null }
    : { status: 200, filePath };
}

async function resolveExistingFile(requestedPath) {
  if (existsSync(requestedPath)) return requestedPath;
  if (!extname(requestedPath) && existsSync(`${requestedPath}.html`)) {
    return `${requestedPath}.html`;
  }
  return null;
}

export function createPreviewServer({ host = defaultHost, port = defaultPort } = {}) {
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Method not allowed", { Allow: "GET, HEAD" });
      return;
    }

    let requestUrl;
    try {
      requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
    } catch {
      sendText(response, 400, "Bad request");
      return;
    }

    if (requestUrl.pathname === "/llm.txt" || requestUrl.pathname === "/llms.html") {
      sendRedirect(response, "/llms.txt");
      return;
    }

    const resolved = resolveRequestPath(requestUrl.pathname);
    if (!resolved.filePath) {
      sendText(response, resolved.status, resolved.status === 400 ? "Bad request" : "Forbidden");
      return;
    }

    const existingFile = await resolveExistingFile(resolved.filePath);
    const filePath = existingFile ?? join(root, "404.html");
    const status = existingFile ? 200 : 404;

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        sendText(response, 404, "Not found");
        return;
      }

      response.writeHead(status, {
        ...securityHeaders,
        "Content-Type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream",
        "Content-Length": fileStat.size
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      createReadStream(filePath).pipe(response);
    } catch {
      sendText(response, 500, "Server error");
    }
  });
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  const server = createPreviewServer();
  server.listen(defaultPort, defaultHost, () => {
    console.log(`Brie Events preview running at http://${defaultHost}:${defaultPort}`);
  });
}
