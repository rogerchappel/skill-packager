import { constants, accessSync, existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const requiredFiles = ["SKILL.md", "skill.json", "examples/basic.md", "tests/basic.test.md"];

export function scaffoldSkill(dir, name = "my-skill", { force = false } = {}) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("skill name must be a non-empty string");
  }

  const existing = requiredFiles.filter((file) => existsSync(join(dir, file)));
  if (existing.length > 0 && !force) {
    throw new Error(`refusing to overwrite existing scaffold files: ${existing.join(", ")}; pass force: true to overwrite`);
  }

  mkdirSync(join(dir, "examples"), { recursive: true });
  mkdirSync(join(dir, "tests"), { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `# ${name}\n\nUse when a local agent workflow needs this capability.\n\nApproval is required before external actions.\n`);
  writeFileSync(join(dir, "skill.json"), JSON.stringify({ name, version: "0.1.0" }, null, 2) + "\n");
  writeFileSync(join(dir, "examples/basic.md"), `# Basic\n\nRun ${name} locally.\n`);
  writeFileSync(join(dir, "tests/basic.test.md"), "# Test\n\nExpected: validates.\n");
  return validateSkill(dir);
}

export function validateSkill(dir) {
  const missing = [];
  const failures = [];
  const readableFiles = new Set();

  for (const file of requiredFiles) {
    const path = join(dir, file);
    try {
      const stats = statSync(path);
      if (!stats.isFile()) {
        failures.push({ path: file, code: "not_file", message: "required path must be a regular file" });
        continue;
      }
      accessSync(path, constants.R_OK);
      readableFiles.add(file);
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
        missing.push(file);
        failures.push({ path: file, code: "missing", message: "required file is missing" });
      } else {
        failures.push({ path: file, code: "unreadable", message: "required file is not readable" });
      }
    }
  }

  let skillText = "";
  if (readableFiles.has("SKILL.md")) {
    try {
      skillText = readFileSync(join(dir, "SKILL.md"), "utf8");
    } catch {
      failures.push({ path: "SKILL.md", code: "unreadable", message: "required file could not be read" });
    }
  }

  if (readableFiles.has("skill.json")) {
    try {
      const manifest = JSON.parse(readFileSync(join(dir, "skill.json"), "utf8"));
      if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
        failures.push({ path: "skill.json", code: "invalid_manifest", message: "manifest must be a JSON object" });
      } else {
        for (const field of ["name", "version"]) {
          if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
            failures.push({
              path: "skill.json",
              field,
              code: "missing_field",
              message: `manifest field ${field} must be a non-empty string`,
            });
          }
        }
      }
    } catch (error) {
      failures.push({
        path: "skill.json",
        code: error instanceof SyntaxError ? "invalid_json" : "unreadable",
        message: error instanceof SyntaxError ? "manifest contains invalid JSON" : "manifest could not be read",
      });
    }
  }

  const approvalStatements = skillText
    .split(/\r?\n/)
    .filter((line) => /approval|permission/i.test(line));
  const hasApproval = approvalStatements.some((line) => {
    const normalized = line.replace(/n['’]t\b/gi, " not");
    const statesRequirement = /(?:approval|permission).{0,40}\brequir(?:e|es|ed|ing)\b|\brequir(?:e|es|ed|ing)\b.{0,40}(?:approval|permission)/i.test(normalized);
    const negatesRequirement = /\b(?:no|not|never)\b.{0,30}(?:approval|permission)|(?:approval|permission).{0,30}\b(?:not|never)\s+required\b/i.test(normalized);
    const guardsWithoutApproval = /\b(?:(?:do|must|shall)\s+not|never)\b.{0,60}\bwithout\b.{0,30}(?:approval|permission)\b/i.test(normalized);
    return (statesRequirement && !negatesRequirement) || guardsWithoutApproval;
  });
  const warnings = hasApproval ? [] : ["SKILL.md should describe approval requirements"];
  return { ok: failures.length === 0 && warnings.length === 0, missing, failures, warnings };
}
