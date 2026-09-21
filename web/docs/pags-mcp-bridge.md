# AusTax ↔ PAGS MCP bridge

AusTax uses the private **AusTax Guide** instance as its AI companion.

| Setting | Value |
| --- | --- |
| PAGS agent | `dfd67189-3aff-4662-85f2-bf1bdaa0133b` |
| Private instance | `00bf92c7-1cee-4fa4-823a-280f5206f755` |
| Required MCP tool | `chat_with_instance` |
| Browser endpoint | `POST /api/pags/chat` |

## Security contract

The browser sends only a user question to `/api/pags/chat`. The server-side bridge authenticates to `https://mcp.proagentstore.online/mcp`, completes MCP initialisation, and calls:

```json
{
  "name": "chat_with_instance",
  "arguments": {
    "instance_id": "00bf92c7-1cee-4fa4-823a-280f5206f755",
    "message": "<user question>"
  }
}
```

The bridge returns a small `{ "reply": "…", "sources": [] }` object. It must not expose the MCP access token, instance token, raw tool response, or PAGS account identifiers to the browser.

## Guardrails enforced by the app and agent

- Accept only tax-preparation questions; reject credentials and TFNs before forwarding.
- Do not send documents, full financial account numbers, myGov credentials, or identity documents to PAGS.
- Do not provide a lodge/submit operation. The final user hand-off is to ATO online services (myTax) or a registered tax agent.
- Include the general-information disclaimer and official ATO source links in replies.

`src/lib/pags.ts` contains the browser client contract. Deployment needs a server-side MCP bridge and a PAGS service credential stored only as a server secret.
