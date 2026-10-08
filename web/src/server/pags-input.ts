/** User-safe response for questions containing sensitive personal information. */
export const SENSITIVE_INPUT_REPLY =
  "For your safety, don’t share TFNs, passwords, bank login details, or identity-document numbers here. Remove those details and ask a general question, or use the official ATO service directly.";

const SENSITIVE_PATTERNS = [
  // TFNs in common written formats. Requiring boundaries avoids matching a
  // nine-digit substring inside a longer account or reference number.
  /(?<!\d)(?:\d[ -]?){8}\d(?!\d)/,
  /\b(?:tax file number|TFN)\b/i,
  /\bmy\s*gov\b/i,
  /\b(?:mygov|my\s*gov)\s+(?:password|passphrase|username|login|credentials?)\b/i,
  /\b(?:bank|banking|online banking)\s+(?:login|log-in|password|passphrase|credentials?)\b/i,
  /\b(?:BSB|bank state\s+branch)\s*(?:is\s*)?[:#-]?\s*\d{3}[- ]?\d{3}\b/i,
  /\b(?:passport|driver'?s licence|driving licence|Medicare card)\s*(?:number|no\.?|#)\s*[:#-]?\s*[A-Z0-9-]{4,}\b/i,
  /\b(?:passport|driver'?s licence|driving licence|Medicare card)\b/i,
  /\b(?:password|passphrase|login credentials?)\b/i,
];

export function containsSensitiveInput(message: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Server boundary for POST /api/pags/chat. The forwarder is called only after
 * the request shape and sensitive-input checks pass.
 */
export async function handlePagsChat(
  request: Request,
  forward: (instanceId: string, message: string) => Promise<unknown>,
): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("message" in body) ||
    typeof body.message !== "string" ||
    !body.message.trim()
  ) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (containsSensitiveInput(body.message)) {
    return Response.json({ reply: SENSITIVE_INPUT_REPLY }, { status: 400 });
  }

  try {
    const result = await forward(
      "00bf92c7-1cee-4fa4-823a-280f5206f755",
      body.message,
    );
    if (
      result &&
      typeof result === "object" &&
      "reply" in result &&
      typeof result.reply === "string"
    ) {
      return Response.json({ reply: result.reply });
    }
  } catch {
    // Do not send provider errors or upstream payloads to the browser.
  }
  return Response.json(
    { error: "The assistant is temporarily unavailable." },
    { status: 502 },
  );
}
