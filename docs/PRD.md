# PRD: skill-packager

Status: release-candidate

## Pitch

Package agent skills with manifests, examples, tests, and docs so they are reusable instead of loose prompt snippets.

## Goals

- Provide a local-first CLI and library API.
- Keep external writes out of scope for v1.
- Make outputs deterministic enough for fixture-backed tests.

## Non-goals

- Live provider writes.
- Secret storage.
- Publishing packages or releases from this repo.
