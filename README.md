# skill-packager

Scaffold and validate reusable agent skill packages.

## Quickstart

```bash
npm test
npm run smoke
skill-packager --help
```

## What It Does

Package agent skills with manifests, examples, tests, and docs so they are reusable instead of loose prompt snippets.

The package is local-first: it reads fixtures or project files and emits deterministic JSON/Markdown output. It does not publish, post, sync, or write to external accounts.

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
bash scripts/validate.sh
```
