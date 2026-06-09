import { existsSync, readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const binPath = Object.values(pkg.bin || {})[0];
if (!binPath || !existsSync(new URL(`../${binPath}`, import.meta.url))) {
  throw new Error("package bin entry is missing");
}
if (!existsSync(new URL("../SKILL.md", import.meta.url))) {
  throw new Error("SKILL.md is required");
}
console.log("build metadata ok");
