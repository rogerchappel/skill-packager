import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldSkill, validateSkill } from "../src/index.js";

test("valid fixture passes package validation", () => {
  assert.equal(validateSkill("fixtures/valid-skill").ok, true);
});

test("invalid fixture reports missing package files", () => {
  const result = validateSkill("fixtures/invalid-skill");
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("skill.json"));
});

test("scaffold creates a valid skill", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try { assert.equal(scaffoldSkill(dir, "demo-skill").ok, true); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});
