import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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

test("negated approval language does not satisfy the safety requirement", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try {
    mkdirSync(join(dir, "examples"));
    mkdirSync(join(dir, "tests"));
    writeFileSync(join(dir, "SKILL.md"), "# Unsafe\n\nNo approval or permission is required.\n");
    writeFileSync(join(dir, "skill.json"), "{}\n");
    writeFileSync(join(dir, "examples/basic.md"), "# Example\n");
    writeFileSync(join(dir, "tests/basic.test.md"), "# Test\n");

    const result = validateSkill(dir);
    assert.equal(result.ok, false);
    assert.deepEqual(result.missing, []);
    assert.match(result.warnings[0], /approval requirements/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
