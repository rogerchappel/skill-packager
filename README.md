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

The package is local-only. `init <dir>` creates the target directory and writes `SKILL.md`, `skill.json`, `examples/basic.md`, and `tests/basic.test.md`. It does not publish, post, sync, or write to external accounts.

The `--name` value must be a non-empty string containing at least one non-whitespace character. Invalid names are rejected before the target directory or any scaffold file is created, including when `--force` is supplied.

`init` refuses to run if any scaffold file already exists. If you intentionally want to replace the generated files in an existing package, pass `--force`:

```bash
skill-packager init ./my-skill --name my-skill --force
```

Only `SKILL.md`, `skill.json`, `examples/basic.md`, and `tests/basic.test.md` are replaced. Other files are left untouched.

`check` is read-only: it never repairs or generates files. It requires those four paths to be readable regular files and `skill.json` to be a JSON object with non-empty string `name` and `version` fields.

Both successful commands print one JSON validation object to standard output. There is no Markdown output mode or output-path option. Validation failures are printed as JSON in the `failures` array and make the command exit with status 1; invalid packages do not produce filesystem or JSON stack traces.

```json
{
  "ok": false,
  "missing": [],
  "failures": [
    { "path": "skill.json", "code": "invalid_json", "message": "manifest contains invalid JSON" }
  ],
  "warnings": []
}
```

## Examples

See [examples/basic.md](examples/basic.md), the fixture-backed tests in [tests/core.test.js](tests/core.test.js), and the executable documentation tests in [tests/cli-docs.test.js](tests/cli-docs.test.js).

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
