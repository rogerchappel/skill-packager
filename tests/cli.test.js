import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(...args) {
  return spawnSync(process.execPath, ["bin/cli.js", ...args], { encoding: "utf8" });
}

test("CLI rejects unknown commands without a stack trace", () => {
  const result = run("frobnicate", "fixtures/valid-skill");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Error: unknown command: frobnicate/);
  assert.match(result.stderr, /Usage:/);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
});

test("CLI rejects commands with missing directories without a stack trace", () => {
  for (const command of ["init", "check"]) {
    const result = run(command);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: skill directory is required/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
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
