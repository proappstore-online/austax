import { handlePagsChat } from "./pags-input.ts";

// Structural slices of node:http's IncomingMessage and ServerResponse, so this
// module needs no Node type package and tests can drive it directly.
type Listener = (...args: never[]) => void;
type DevRequest = {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  on(event: string, listener: Listener): unknown;
  off(event: string, listener: Listener): unknown;
};
type DevResponse = {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  end(body?: string): unknown;
};

/**
 * A chat request carries one question of at most 2,000 characters, so a body
 * past this is refused before it is buffered.
 */
export const MAX_BODY_BYTES = 16 * 1024;

/**
 * Reads the request body, or resolves null as soon as it passes `limit` bytes.
 * Uses data events rather than `for await`, because leaving an async iterator
 * early destroys the stream and with it the socket the 413 must go out on.
 */
function readBody(req: DevRequest, limit: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    const settle = (finish: () => void) => {
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      req.off("close", onClose);
      finish();
    };
    const onData = (chunk: Uint8Array) => {
      size += chunk.length;
      if (size > limit) return settle(() => resolve(null));
      chunks.push(chunk);
    };
    const onEnd = () => {
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      settle(() => resolve(new TextDecoder().decode(bytes)));
    };
    const onError = (error: unknown) => settle(() => reject(error));
    const onClose = () => settle(() => reject(new Error("Request closed before its body ended")));
    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
    req.on("close", onClose);
  });
}

function refuseTooLarge(res: DevResponse) {
  res.statusCode = 413;
  res.setHeader("Content-Type", "application/json");
  // The unread rest of the body is still in flight; do not reuse the socket.
  res.setHeader("Connection", "close");
  res.end(JSON.stringify({ error: "Request is too large." }));
}

/** Connect middleware for /api/pags/chat on the Vite dev and preview servers. */
export async function pagsChatMiddleware(
  req: DevRequest,
  res: DevResponse,
  next: (error?: unknown) => void,
) {
  if (req.url?.split("?")[0] !== "/api/pags/chat") return next();
  try {
    if (Number(req.headers["content-length"]) > MAX_BODY_BYTES) return refuseTooLarge(res);
    const body = await readBody(req, MAX_BODY_BYTES);
    if (body === null) return refuseTooLarge(res);
    const contentType = req.headers["content-type"];
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: { "Content-Type": typeof contentType === "string" ? contentType : "application/json" },
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });
    // No server credential or production PAGS bridge is configured here.
    // A deployment must provide its authenticated forwarder to this handler.
    const response = await handlePagsChat(request, async () => {
      throw new Error("PAGS bridge is not configured");
    });
    res.statusCode = response.status;
    res.setHeader("Content-Type", "application/json");
    res.end(await response.text());
  } catch (error) {
    next(error);
  }
}
