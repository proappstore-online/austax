import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const workflow = read(".github/workflows/deploy.yml");
const manifest = JSON.parse(read("mcp.json"));
const migrations = JSON.parse(read("migrations.json"));

test("the deploy workflow runs on every push to main", () => {
  assert.match(workflow, /on:\s*\n\s+push:\s*\n\s+branches:\s*\[main\]/);
});

test("the deploy workflow builds with the commit SHA and uses keyless OIDC auth", () => {
  assert.match(workflow, /VITE_COMMIT_SHA:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /run:\s*pnpm build/);
});

test("the deploy workflow applies migrations before uploading and registering tools", () => {
  const migrate = workflow.indexOf("/migrate/oidc");
  const upload = workflow.indexOf("aws s3 sync web/dist");
  const register = workflow.indexOf("/tools/oidc");
  assert.ok(migrate > -1 && upload > -1 && register > -1, "migrate, upload and register steps must all exist");
  assert.ok(migrate < upload, "migrations must run before the upload");
  assert.ok(upload < register, "tools must be registered after the upload");
});

test("the deploy workflow syncs the built site to this app's R2 prefix", () => {
  assert.match(workflow, /s3:\/\/pas-apps\/apps\/\$\{\{\s*github\.event\.repository\.name\s*\}\}\//);
});

test("migrations.json holds named, non-empty migrations with unique names", () => {
  assert.ok(Array.isArray(migrations.migrations) && migrations.migrations.length > 0);
  for (const migration of migrations.migrations) {
    assert.equal(typeof migration.name, "string");
    assert.equal(typeof migration.sql, "string");
    assert.ok(migration.sql.trim().length > 0);
  }
  const names = migrations.migrations.map((migration) => migration.name);
  assert.equal(new Set(names).size, names.length);
});

test("mcp.json declares authenticated tools with the fields the platform requires", () => {
  assert.ok(Array.isArray(manifest.tools) && manifest.tools.length > 0);
  for (const tool of manifest.tools) {
    assert.match(tool.name, /^[a-z][a-z0-9_]*$/);
    assert.equal(typeof tool.description, "string");
    assert.ok(["query", "execute"].includes(tool.operation), `${tool.name} has an unknown operation`);
    assert.equal(typeof tool.sql, "string");
    assert.equal(tool.requires_auth, true, `${tool.name} must require auth`);
  }
});
