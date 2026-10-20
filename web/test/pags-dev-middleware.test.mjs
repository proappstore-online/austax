import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createServer, request } from "node:http";
import test from "node:test";
import { MAX_BODY_BYTES, pagsChatMiddleware } from "../src/server/pags-dev-middleware.ts";

async function withServer(run) {
  const server = createServer((req, res) =>
    pagsChatMiddleware(req, res, (error) => {
      res.statusCode = error ? 500 : 404;
      res.end();
    }),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

// Sends the body as chunked writes with no Content-Length, so only the
// streaming cap (not the header check) can stop it.
function postChunked(base, chunks) {
  return new Promise((resolve, reject) => {
    const req = request(`${base}/api/pags/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Transfer-Encoding": "chunked" },
    });
    req.on("response", (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (part) => (text += part));
      res.on("end", () => resolve({ status: res.statusCode, text }));
    });
    // The server may close the socket while chunks are still being written.
    req.on("error", (error) => (error.code === "ECONNRESET" || error.code === "EPIPE" ? undefined : reject(error)));
    for (const chunk of chunks) req.write(chunk);
    req.end();
  });
}

test("a small chat request reaches the PAGS handler", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/pags/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What records should I keep?" }),
    });
    // No bridge is configured on dev servers, so the handler answers 502.
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, "The assistant is temporarily unavailable.");
  });
});

test("a declared Content-Length over the cap is refused with 413", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/pags/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "a".repeat(MAX_BODY_BYTES) }),
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error, "Request is too large.");
  });
});

test("a chunked body that grows past the cap is refused with 413", async () => {
  await withServer(async (base) => {
    const chunk = "a".repeat(8 * 1024);
    const response = await postChunked(base, ['{"message":"', ...Array(16).fill(chunk), '"}']);
    assert.equal(response.status, 413);
    assert.equal(JSON.parse(response.text).error, "Request is too large.");
  });
});

test("a body at the cap is still handed to the PAGS handler", async () => {
  await withServer(async (base) => {
    const wrapper = '{"message":""}'.length;
    const response = await postChunked(base, [`{"message":"${"a".repeat(MAX_BODY_BYTES - wrapper)}"}`]);
    // The handler, not the size cap, rejects this as too long a question.
    assert.equal(response.status, 400);
    assert.equal(JSON.parse(response.text).error, "Message is too long.");
  });
});

test("the reader stops listening once the body passes the cap", async () => {
  const req = Object.assign(new EventEmitter(), {
    url: "/api/pags/chat",
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  const res = { statusCode: 0, headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; } };
  const done = pagsChatMiddleware(req, res, () => assert.fail("next should not be called"));
  req.emit("data", new Uint8Array(MAX_BODY_BYTES));
  req.emit("data", new Uint8Array(1));
  await done;
  assert.equal(res.statusCode, 413);
  assert.equal(res.headers.Connection, "close");
  assert.equal(req.listenerCount("data"), 0);
});

test("other paths are passed through untouched", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/somewhere-else`, { method: "POST", body: "x" });
    assert.equal(response.status, 404);
  });
});
