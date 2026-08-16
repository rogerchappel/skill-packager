import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(...args) {
  return spawnSync(process.execPath, ["bin/cli.js", ...args], { encoding: "utf8" });
}

test("CLI rejects unknown commands without a stack trace", () => {
  for (const args of [["frobnicate", "fixtures/valid-skill"], ["frobnicate", "--help"]]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: unknown command: frobnicate/);
    assert.match(result.stderr, /Usage:/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});

test("CLI rejects commands with missing directories without a stack trace", () => {
  for (const command of ["init", "check"]) {
    const result = run(command);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: skill directory is required/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});

test("CLI rejects a missing command while standalone help succeeds", () => {
  const missing = run();
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Error: command is required/);
  assert.doesNotMatch(missing.stderr, /\n\s+at /);

  const help = run("--help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
});

test("CLI init refuses existing scaffold files unless --force is passed", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-cli-"));
  try {
    execFileSync(process.execPath, ["bin/cli.js", "init", dir, "--name", "original"]);
    const rejected = run("init", dir, "--name", "replacement");
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /refusing to overwrite/);
    assert.match(readFileSync(join(dir, "SKILL.md"), "utf8"), /^# original$/m);

    const forced = run("init", dir, "--name", "replacement", "--force");
    assert.equal(forced.status, 0);
    assert.match(readFileSync(join(dir, "SKILL.md"), "utf8"), /^# replacement$/m);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI init rejects blank names without creating the target", () => {
  const parent = mkdtempSync(join(tmpdir(), "skill-packager-cli-"));
  const dir = join(parent, "new-skill");
  try {
    const result = run("init", dir, "--name", "   ");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: skill name must be a non-empty string/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
    assert.equal(existsSync(dir), false);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("CLI check prints structured validation failures as JSON", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-packager-cli-"));
  try {
    execFileSync(process.execPath, ["bin/cli.js", "init", dir, "--name", "demo-skill"]);
    writeFileSync(join(dir, "skill.json"), "{broken");

    const result = run("check", dir);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.deepEqual(JSON.parse(result.stdout).failures, [{
      path: "skill.json",
      code: "invalid_json",
      message: "manifest contains invalid JSON",
    }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI check rejects contracted approval negation", () => {
  const result = run("check", "fixtures/negated-approval-skill");
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), {
    ok: false,
    missing: [],
    failures: [],
    warnings: ["SKILL.md should describe approval requirements"],
  });
});
