import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../../mcp.json", import.meta.url), "utf8"));
const migrations = JSON.parse(readFileSync(new URL("../../migrations.json", import.meta.url), "utf8"));
const tools = Object.fromEntries(manifest.tools.map((tool) => [tool.name, tool]));

function database() {
  const db = new DatabaseSync(":memory:");
  for (const migration of migrations.migrations) db.exec(migration.sql);
  return db;
}

function call(db, toolName, userId, params = {}) {
  const tool = tools[toolName];
  const values = [];
  const sql = tool.sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    if (name === "__user_id") values.push(userId);
    else if (name === "__now") values.push(1_760_000_000_000);
    else if (name === "__uuid") values.push(randomUUID());
    else {
      const value = params[name] ?? tool.params[name]?.default ?? null;
      values.push(typeof value === "boolean" ? Number(value) : value);
    }
    return "?";
  });
  const statement = db.prepare(sql);
  return tool.operation === "query" ? statement.all(...values) : statement.run(...values).changes;
}

function draftParams(draftId) {
  return {
    draft_id: draftId,
    income_year: "2026-27",
    residency: "Yes",
    income_salary_wages: true,
    income_bank_interest: false,
    income_dividends: false,
    income_rental: false,
    income_sole_trader: false,
    income_shares_crypto: false,
    income_foreign: false,
    income_government_payments: false,
    deduction_work_from_home: true,
    deduction_work_related: false,
    deduction_work_travel: false,
    deduction_self_education: false,
    deduction_donations: false,
    deduction_tax_affairs: false,
    consideration_private_health: false,
    consideration_help_loan: false,
    consideration_rental_property: false,
    consideration_investments: false,
    consideration_foreign_residency: false,
    consideration_business_income: false,
    record_status: "Ready to review",
  };
}

test("PAS MCP manifest exposes only authenticated, caller-scoped tools", () => {
  assert.deepEqual(Object.keys(tools).sort(), [
    "delete_preparation_draft",
    "get_preparation_draft",
    "list_preparation_drafts",
    "save_preparation_draft",
  ]);
  for (const tool of manifest.tools) {
    assert.equal(tool.requires_auth, true, tool.name);
    assert.match(tool.sql, /:__user_id/, tool.name);
    assert.doesNotMatch(JSON.stringify(tool.params), /tfn|password|credential|identity.?document/i, tool.name);
  }
});

test("PAS MCP actions keep preparation drafts isolated by caller", () => {
  const db = database();
  const draftId = "draft-alice";

  assert.equal(call(db, "save_preparation_draft", "alice", draftParams(draftId)), 1);
  assert.equal(call(db, "save_preparation_draft", "bob", draftParams(draftId)), 0);
  assert.equal(call(db, "get_preparation_draft", "bob", { draft_id: draftId }).length, 0);
  assert.equal(call(db, "list_preparation_drafts", "bob", { limit: 20 }).length, 0);
  assert.equal(call(db, "delete_preparation_draft", "bob", { draft_id: draftId }), 0);
  assert.equal(call(db, "get_preparation_draft", "alice", { draft_id: draftId }).length, 1);
  assert.equal(call(db, "delete_preparation_draft", "alice", { draft_id: draftId }), 1);
});
