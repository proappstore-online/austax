import assert from "node:assert/strict";
import test from "node:test";
import { handlePagsChat, SENSITIVE_INPUT_REPLY } from "../src/server/pags-input.ts";

async function post(message, forward) {
  return handlePagsChat(
    new Request("http://localhost/api/pags/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),
    forward,
  );
}

test("formatted TFNs are rejected before the PAGS forwarder is called", async () => {
  for (const tfn of ["123-456-789", "123 456 789", "123456789"]) {
    let forwarded = false;
    const response = await post(`My TFN is ${tfn}`, async () => {
      forwarded = true;
      return { reply: "should never happen" };
    });
    assert.equal(response.status, 400);
    assert.equal(forwarded, false);
    assert.equal((await response.json()).reply, SENSITIVE_INPUT_REPLY);
  }
});

test("credential and identity wording is rejected before forwarding", async () => {
  const messages = [
    "My myGov username and password are alice and secret",
    "My bank login password is hunter2",
    "My BSB is 123-456",
    "My passport number is N1234567",
    "My driver's licence number is ABC12345",
    "My Medicare card number is 1234567890",
  ];
  for (const message of messages) {
    let forwardedText;
    const response = await post(message, async (_id, text) => {
      forwardedText = text;
      return { reply: "should never happen" };
    });
    assert.equal(response.status, 400, message);
    assert.equal(forwardedText, undefined, message);
  }
});

test("ordinary questions reach the forwarder unchanged", async () => {
  const message = "What records should I keep for working from home?";
  let forwarded;
  const response = await post(message, async (id, text) => {
    forwarded = { id, message: text };
    return { reply: "Keep a record of your hours." };
  });
  assert.equal(response.status, 200);
  assert.deepEqual(forwarded, {
    id: "00bf92c7-1cee-4fa4-823a-280f5206f755",
    message,
  });
  assert.equal((await response.json()).reply, "Keep a record of your hours.");
});
