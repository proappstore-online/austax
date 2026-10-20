import { handlePagsChat } from "./pags-input.ts";

// Structural slices of node:http's IncomingMessage and ServerResponse, so this
// module needs no Node type package and tests can drive it directly.
type DevRequest = AsyncIterable<Uint8Array> & {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};
type DevResponse = {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  end(body?: string): unknown;
};

/** Connect middleware for /api/pags/chat on the Vite dev and preview servers. */
export async function pagsChatMiddleware(
  req: DevRequest,
  res: DevResponse,
  next: (error?: unknown) => void,
) {
  if (req.url?.split("?")[0] !== "/api/pags/chat") return next();
  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const body = new TextDecoder().decode(bytes);
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
