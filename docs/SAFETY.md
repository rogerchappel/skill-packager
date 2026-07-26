# Safety Notes

- Default commands are local-first and deterministic.
- Scaffolding is non-destructive by default. `init` stops if any generated file exists; `--force` is the explicit overwrite opt-in.
- External systems are represented as plans or fixtures.
- Treat generated actions as review material, not authorization.
- Keep secrets out of fixtures, examples, and reports.
