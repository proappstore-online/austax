import assert from "node:assert/strict";
import test from "node:test";
import { askAusTaxGuide } from "../src/lib/pags.ts";
import { SENSITIVE_INPUT_REPLY } from "../src/server/pags-input.ts";

function stubFetch(response) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => response;
  return () => {
    globalThis.fetch = original;
  };
}

test("the server's sensitive-input reply reaches the user on a 400", async () => {
  const restore = stubFetch(
    Response.json({ reply: SENSITIVE_INPUT_REPLY }, { status: 400 }),
  );
  try {
    // No sensitive keyword, so the local fallback would give a generic answer.
    const result = await askAusTaxGuide("my number is 123 456 789");
    assert.equal(result.reply, SENSITIVE_INPUT_REPLY);
  } finally {
    restore();
  }
});

test("a 502 without a reply falls back to the local guidance", async () => {
  const restore = stubFetch(
    Response.json({ error: "The assistant is temporarily unavailable." }, { status: 502 }),
  );
  try {
    const result = await askAusTaxGuide("What is a deduction?");
    assert.match(result.reply, /can’t determine eligibility/);
  } finally {
    restore();
  }
});
