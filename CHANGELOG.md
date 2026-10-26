# Changelog

## 0.1.0 — 2026-10-26

Production release of AusTax to https://austax.proappstore.online, deployed by the `Deploy to R2` GitHub Actions workflow on push to `main`.

Included:

- Preparation checklist workspace for an Australian individual tax return (income, deductions, documents), scoped by income year.
- Account-backed preparation drafts, with a notice when a draft was only saved in the browser.
- Preferences dialog, and an accessible, focus-stable draft wizard.
- Server-side bridge to the AusTax Guide PAGS instance, with sensitive-input rejection and a 16 KB request body cap on the dev/preview middleware.
- Authenticated, caller-scoped app tools (`mcp.json`) and the `return_drafts` schema (`migrations.json`).
- Deploy-workflow and manifest structure tests.

The assistant gives general information only. It does not give tax advice or lodge returns.
