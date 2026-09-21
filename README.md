# AusTax

An AI-assisted workspace for preparing an Australian individual tax return. This first version is a front-end prototype with return progress, deduction tracking, document selection, and a clearly scoped general-information assistant.

## PAGS companion

AusTax is linked to the private **AusTax Guide** PAGS instance through a server-side MCP bridge. The implementation contract and guardrails are in [web/docs/pags-mcp-bridge.md](web/docs/pags-mcp-bridge.md); the current ATO research used by both the product and knowledge base is in [web/docs/ato-lodgement-research.md](web/docs/ato-lodgement-research.md).

## Run locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

The assistant copy intentionally avoids providing tax advice or lodging returns. Any production version should be reviewed for ATO compliance, privacy obligations, data residency, authentication, and registered tax-agent requirements.
