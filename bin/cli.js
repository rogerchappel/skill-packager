#!/usr/bin/env node
import { scaffoldSkill, validateSkill } from "../src/index.js";
import { requireLocalPath } from "../src/safety.js";

const usage = "Usage: skill-packager <init|check> <dir> [--name my-skill] [--force]";
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--help") {
  console.log(usage);
  process.exit(0);
}

try {
  const [cmd, dirArg, ...options] = args;
  if (!["init", "check"].includes(cmd)) {
    throw new Error(cmd ? `unknown command: ${cmd}` : "command is required");
  }
  const dir = requireLocalPath(dirArg, "skill directory");
  if (cmd === "check" && options.length > 0) {
    throw new Error(`check does not accept options: ${options.join(" ")}`);
  }

  let name = "my-skill";
  let force = false;
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option === "--force") {
      force = true;
    } else if (option === "--name" && options[index + 1] && !options[index + 1].startsWith("--")) {
      name = options[index + 1];
      index += 1;
    } else {
      throw new Error(option === "--name" ? "--name requires a value" : `unknown option: ${option}`);
    }
  }

  const result = cmd === "init" ? scaffoldSkill(dir, name, { force }) : validateSkill(dir);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error(usage);
  process.exitCode = 1;
}
