# skill-packager

Scaffold and validate reusable agent skill packages.

## Quickstart

```bash
npm test
npm run smoke
skill-packager --help
skill-packager init ./my-skill --name my-skill
skill-packager check ./my-skill
```

## What It Does

Package agent skills with manifests, examples, tests, and docs so they are reusable instead of loose prompt snippets.

The package is local-first: it reads fixtures or project files and emits deterministic JSON/Markdown output. It does not publish, post, sync, or write to external accounts.

`init` will not overwrite any existing scaffold file. If you intentionally want to replace the generated files in an existing package, pass `--force`:

```bash
skill-packager init ./my-skill --name my-skill --force
```

Only `SKILL.md`, `skill.json`, `examples/basic.md`, and `tests/basic.test.md` are replaced. Other files are left untouched.

## Examples

See [examples/basic.md](examples/basic.md) and the fixture-backed tests in [tests/core.test.js](tests/core.test.js).

## Limitations

- V1 uses local fixtures and static checks only.
- Live provider integrations require a separate approval and adapter layer.
- Generated plans are review artifacts, not authorization to perform external writes.

## Verification

```bash
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

## Release Package Contents

`npm run package:smoke` verifies that the package includes the CLI, source modules, validation scripts, docs, examples, fixtures, and maintainer policy files while excluding development-only build output.
