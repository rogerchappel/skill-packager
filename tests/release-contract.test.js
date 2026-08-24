import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CI enforces the documented frozen-install contract", async () => {
  const [workflow, packageJson, readme, contributing] = await Promise.all([
    readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../CONTRIBUTING.md", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(packageJson);

  assert.equal(manifest.engines.node, ">=22");
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /cache: npm/);
  assert.match(workflow, /cache-dependency-path: package-lock\.json/);
  assert.match(workflow, /run: npm ci/);
  assert.doesNotMatch(workflow, /run: npm install/);
  assert.match(readme, /Node\.js 22 or newer/);
  assert.match(readme, /npm ci/);
  assert.match(contributing, /Node\.js 22 or newer/);
  assert.match(contributing, /npm ci/);
});
