# skill-packager

## When To Use

Use this skill when creating or reviewing an agent skill package that needs a manifest, examples, tests, and explicit side-effect boundaries.

## Required Inputs

- A local repo, fixture, or skill directory depending on the command.
- No network access is required for the default workflow.

## Side-Effect Boundaries

This skill reads local files and writes reports only when an output path is provided. It must not call live external APIs, publish content, or mutate third-party systems without explicit approval.

## Examples

```bash
skill-packager --help
npm run smoke
```

## Validation

Run `npm test`, `npm run check`, `npm run build`, and `npm run smoke` before treating a package as release-ready.
