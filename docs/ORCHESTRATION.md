# Orchestration

Agents should run this project in three phases:

1. Inspect local input files only.
2. Generate a deterministic report or plan.
3. Ask for explicit approval before any external action outside this package.

The CLI defaults to read-only behavior. Commands that prepare writes emit JSON or Markdown plans rather than calling external services.
