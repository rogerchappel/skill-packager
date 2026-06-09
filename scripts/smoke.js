import { execFileSync } from "node:child_process";
const out = execFileSync("node", ["bin/cli.js", "check", "fixtures/valid-skill"], { encoding: "utf8" });
if (!out.includes('"ok": true')) throw new Error("skill package smoke failed");
console.log("smoke ok");
