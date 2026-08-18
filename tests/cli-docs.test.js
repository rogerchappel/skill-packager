import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const cli = new URL("../bin/cli.js", import.meta.url);
const scaffoldFiles = ["SKILL.md", "skill.json", "examples/basic.md", "tests/basic.test.md"];

function run(...args) {
  return spawnSync(process.execPath, [cli.pathname, ...args], { encoding: "utf8" });
}

function filesBelow(dir, current = dir) {
  return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    return entry.isDirectory() ? filesBelow(dir, path) : [relative(dir, path)];
  }).sort();
}

function contents(dir) {
  return Object.fromEntries(filesBelow(dir).map((file) => [file, readFileSync(join(dir, file), "utf8")]));
}

test("documented init and check examples have bounded effects and JSON-only output", () => {
  const root = mkdtempSync(join(tmpdir(), "skill-packager-cli-docs-"));
  const dir = join(root, "my-skill");
  try {
    const initialized = run("init", dir, "--name", "my-skill");
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.equal(initialized.stderr, "");
    assert.equal(JSON.parse(initialized.stdout).ok, true);
    assert.deepEqual(filesBelow(dir), scaffoldFiles.slice().sort());

    const beforeCheck = contents(dir);
    const checked = run("check", dir);
    assert.equal(checked.status, 0, checked.stderr);
    assert.equal(checked.stderr, "");
    assert.deepEqual(JSON.parse(checked.stdout), JSON.parse(initialized.stdout));
    assert.deepEqual(contents(dir), beforeCheck);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("documented force example overwrites only scaffold files", () => {
  const root = mkdtempSync(join(tmpdir(), "skill-packager-cli-force-"));
  const dir = join(root, "my-skill");
  try {
    assert.equal(run("init", dir, "--name", "original").status, 0);
    writeFileSync(join(dir, "notes.txt"), "preserve me\n");

    const refused = run("init", dir, "--name", "replacement");
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /refusing to overwrite/);
    assert.match(readFileSync(join(dir, "SKILL.md"), "utf8"), /^# original$/m);

    const forced = run("init", dir, "--name", "replacement", "--force");
    assert.equal(forced.status, 0, forced.stderr);
    assert.equal(forced.stderr, "");
    assert.equal(JSON.parse(forced.stdout).ok, true);
    assert.deepEqual(filesBelow(dir), [...scaffoldFiles, "notes.txt"].sort());
    assert.equal(readFileSync(join(dir, "notes.txt"), "utf8"), "preserve me\n");
    assert.match(readFileSync(join(dir, "SKILL.md"), "utf8"), /^# replacement$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("force reports an unusable destination without partially replacing the package", () => {
  const root = mkdtempSync(join(tmpdir(), "skill-packager-cli-preflight-"));
  const dir = join(root, "my-skill");
  try {
    assert.equal(run("init", dir, "--name", "original").status, 0);
    rmSync(join(dir, "tests/basic.test.md"));
    mkdirSync(join(dir, "tests/basic.test.md"));
    const before = contents(dir);

    const forced = run("init", dir, "--name", "replacement", "--force");
    assert.notEqual(forced.status, 0);
    assert.match(forced.stderr, /cannot replace scaffold path tests\/basic\.test\.md: destination must be a regular file/);
    assert.equal(forced.stdout, "");
    assert.deepEqual(contents(dir), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
