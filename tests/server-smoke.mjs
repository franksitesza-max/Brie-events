import assert from "node:assert/strict";
import { once } from "node:events";
import { createPreviewServer } from "../scripts/serve.mjs";

const server = createPreviewServer({ port: 0 });
server.listen(0, "127.0.0.1");
await once(server, "listening");

const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
}

try {
  for (const path of [
    "/",
    "/privacy",
    "/terms",
    "/birthday-cakes-somerset-west",
    "/kids-themed-cakes-somerset-west",
    "/cake-prices-somerset-west",
    "/cake-delivery-collection-helderberg",
    "/bento-cakes-cupcakes-somerset-west",
    "/llms.txt",
    "/ai.json",
    "/identity.json",
    "/robots-ai.txt"
  ]) {
    const response = await request(path);
    assert.equal(response.status, 200, `${path} should return 200.`);
    assert.ok(response.headers.get("content-security-policy"), `${path} needs CSP.`);
    assert.equal(response.headers.get("set-cookie"), null, `${path} must not set a cookie.`);
  }

  for (const path of ["/llm.txt", "/llms.html"]) {
    const response = await request(path);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), "/llms.txt");
  }

  const missing = await request("/missing-cake-page");
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /noindex, follow/);

  const malformed = await request("/%E0%A4%A");
  assert.equal(malformed.status, 400);

  const post = await request("/", { method: "POST" });
  assert.equal(post.status, 405);

  const head = await request("/privacy", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");

  console.log("Static server smoke test passed.");
} finally {
  server.close();
  await once(server, "close");
}
