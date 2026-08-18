# skill-packager

## When To Use

Use this skill when creating or reviewing an agent skill package that needs a manifest, examples, tests, and explicit side-effect boundaries.

## Required Inputs

- A local repo, fixture, or skill directory depending on the command.
- No network access is required for the default workflow.

## Side-Effect Boundaries

All commands operate only on the local filesystem. `init <dir>` creates `<dir>` and writes exactly `SKILL.md`, `skill.json`, `examples/basic.md`, and `tests/basic.test.md`.

By default, `init` refuses to run if any of those files already exists. `--force` explicitly authorizes replacing those four scaffold files; it does not delete or overwrite other files in the target directory. Before writing, forced replacement verifies every existing scaffold destination is a writable regular file. If preflight fails, the command exits nonzero without changing any scaffold file. `check <dir>` is read-only and never repairs or generates files.

Successful `init` and `check` commands write one JSON validation object to standard output. The CLI does not produce Markdown reports or accept an output-path option. It must not call live external APIs, publish content, or mutate third-party systems without explicit approval.

## Examples

```bash
skill-packager --help
skill-packager init ./my-skill --name my-skill
skill-packager check ./my-skill
```

## Validation

Run `npm test`, `npm run check`, `npm run build`, and `npm run smoke` before treating a package as release-ready.
