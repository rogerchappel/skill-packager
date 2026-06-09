#!/usr/bin/env node
import { scaffoldSkill, validateSkill } from "../src/index.js";
import { requireLocalPath } from "../src/safety.js";
const args = process.argv.slice(2);
if (args.includes("--help") || args.length === 0) {
  console.log("Usage: skill-packager <init|check> <dir> [--name my-skill]");
  process.exit(0);
}
const cmd = args[0];
const dir = requireLocalPath(args[1], "skill directory");
const get = (flag, fallback = "") => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const result = cmd === "init" ? scaffoldSkill(dir, get("--name", "my-skill")) : validateSkill(dir);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
