import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldSkill, validateSkill } from "../src/index.js";

test("valid fixture passes package validation", () => {
  assert.deepEqual(validateSkill("fixtures/valid-skill"), {
    ok: true,
    missing: [],
    failures: [],
    warnings: [],
  });
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

test("required package paths must be regular files", () => {
  for (const requiredPath of ["SKILL.md", "skill.json", "examples/basic.md", "tests/basic.test.md"]) {
    const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
    try {
      scaffoldSkill(dir, "demo-skill");
      rmSync(join(dir, requiredPath));
      mkdirSync(join(dir, requiredPath));

      const result = validateSkill(dir);
      assert.equal(result.ok, false, requiredPath);
      assert.deepEqual(result.missing, [], requiredPath);
      assert.ok(result.failures.some(({ path, code }) => path === requiredPath && code === "not_file"), requiredPath);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test("malformed and non-object manifests return structured failures", () => {
  const cases = [
    ["{broken", "invalid_json"],
    ["null\n", "invalid_manifest"],
    ["[]\n", "invalid_manifest"],
  ];

  for (const [manifest, code] of cases) {
    const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
    try {
      scaffoldSkill(dir, "demo-skill");
      writeFileSync(join(dir, "skill.json"), manifest);

      const result = validateSkill(dir);
      assert.equal(result.ok, false, manifest);
      assert.ok(result.failures.some(({ path, code: actual }) => path === "skill.json" && actual === code), manifest);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test("manifest requires the fields produced by the scaffold", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try {
    scaffoldSkill(dir, "demo-skill");
    writeFileSync(join(dir, "skill.json"), "{}\n");

    const result = validateSkill(dir);
    assert.equal(result.ok, false);
    assert.deepEqual(
      result.failures.filter(({ code }) => code === "missing_field").map(({ field }) => field),
      ["name", "version"],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scaffold refuses to overwrite a complete package by default", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try {
    scaffoldSkill(dir, "original");
    const original = readFileSync(join(dir, "SKILL.md"), "utf8");
    assert.throws(() => scaffoldSkill(dir, "replacement"), /refusing to overwrite.*SKILL\.md/);
    assert.equal(readFileSync(join(dir, "SKILL.md"), "utf8"), original);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scaffold refuses a partially existing package without creating other files", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try {
    mkdirSync(join(dir, "examples"));
    writeFileSync(join(dir, "examples/basic.md"), "keep me\n");
    assert.throws(() => scaffoldSkill(dir, "demo"), /examples\/basic\.md/);
    assert.equal(readFileSync(join(dir, "examples/basic.md"), "utf8"), "keep me\n");
    assert.equal(validateSkill(dir).missing.length, 3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scaffold overwrites package files only with force enabled", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try {
    scaffoldSkill(dir, "original");
    assert.equal(scaffoldSkill(dir, "replacement", { force: true }).ok, true);
    assert.match(readFileSync(join(dir, "SKILL.md"), "utf8"), /^# replacement$/m);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
