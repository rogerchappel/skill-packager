import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

test("negated approval fixture fails package validation", () => {
  const result = validateSkill("fixtures/negated-approval-skill");
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.failures, []);
  assert.match(result.warnings[0], /approval requirements/);
});

test("scaffold creates a valid skill", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try { assert.equal(scaffoldSkill(dir, "demo-skill").ok, true); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test("scaffold rejects blank names before creating the target", () => {
  const parent = mkdtempSync(join(tmpdir(), "skill-packager-"));
  const dir = join(parent, "new-skill");
  try {
    for (const name of ["", "   ", "\t\n"]) {
      assert.throws(() => scaffoldSkill(dir, name), /skill name must be a non-empty string/);
      assert.equal(existsSync(dir), false, JSON.stringify(name));
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("invalid names do not overwrite an existing scaffold even with force", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
  try {
    scaffoldSkill(dir, "original");
    const original = readFileSync(join(dir, "skill.json"), "utf8");
    assert.throws(() => scaffoldSkill(dir, " ", { force: true }), /skill name must be a non-empty string/);
    assert.equal(readFileSync(join(dir, "skill.json"), "utf8"), original);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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

test("approval language distinguishes negations from affirmative guards", () => {
  const cases = [
    ["No approval or permission is required.", false],
    ["Approval is not required before publishing.", false],
    ["Approval isn't required before publishing.", false],
    ["Permission isn’t required before publishing.", false],
    ["Approval is required before publishing.", true],
    ["Permission is required before publishing.", true],
    ["Do not publish without explicit approval.", true],
  ];

  for (const [statement, expected] of cases) {
    const dir = mkdtempSync(join(tmpdir(), "skill-packager-"));
    try {
      scaffoldSkill(dir, "demo-skill");
      writeFileSync(join(dir, "SKILL.md"), `# Safety\n\n${statement}\n`);

      const result = validateSkill(dir);
      assert.equal(result.ok, expected, statement);
      assert.equal(result.warnings.length, expected ? 0 : 1, statement);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
