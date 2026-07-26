import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const requiredFiles = ["SKILL.md", "skill.json", "examples/basic.md", "tests/basic.test.md"];

export function scaffoldSkill(dir, name = "my-skill", { force = false } = {}) {
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
  const missing = requiredFiles.filter((file) => !existsSync(join(dir, file)));
  const skillText = existsSync(join(dir, "SKILL.md")) ? readFileSync(join(dir, "SKILL.md"), "utf8") : "";
  const approvalStatements = skillText
    .split(/\r?\n/)
    .filter((line) => /approval|permission/i.test(line));
  const hasApproval = approvalStatements.some(
    (line) => /(?:approval|permission).{0,40}\brequir(?:e|es|ed|ing)\b|\brequir(?:e|es|ed|ing)\b.{0,40}(?:approval|permission)/i.test(line)
      && !/\b(?:no|not|never|without)\b.{0,30}(?:approval|permission)|(?:approval|permission).{0,30}\b(?:not|never)\s+required\b/i.test(line),
  );
  return { ok: missing.length === 0 && hasApproval, missing, warnings: hasApproval ? [] : ["SKILL.md should describe approval requirements"] };
}
