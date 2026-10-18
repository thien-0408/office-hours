# Codex working conventions

Prioritize focused changes, fast turnaround, and minimal tool use. Complete the requested work, then stop.

## Scope

- Make the smallest complete change that satisfies the request.
- Avoid unrelated refactors, cleanup, formatting, dependency upgrades, and speculative improvements.
- Preserve existing patterns and the user's uncommitted changes.
- For straightforward tasks, implement directly without formal plans or delegation.
- Ask questions only when missing information blocks a correct implementation; otherwise use the existing code and reasonable defaults.

## Tests and verification

- Do not run tests unless the user explicitly requests them. Do not add or update tests unless requested or tests are the task itself.
- Do not automatically run builds, linters, type checks, formatters, coverage, benchmarks, security audits, or browser automation.
- Default verification is reading the changed code and reviewing the relevant diff for obvious mistakes.
- If the user requests verification, run only the smallest relevant check. Do not expand to full suites or repeat successful checks without a concrete reason.
- Do not ask whether to run optional checks. Briefly state that checks were not run when reporting code changes; never imply they passed.

## Tool use

- Read only task-relevant files and required repository guidance. Use targeted `rg` searches instead of broad repository scans.
- Batch independent reads and avoid rereading unchanged files or polling commands unnecessarily.
- Do not install dependencies, start servers, launch browsers, generate previews, or run background processes unless the requested task requires them.
- Use local code and documentation first. Browse only when current external information is needed or explicitly requested.
- Do not create extra documentation, reports, screenshots, or temporary scripts unless needed for the requested deliverable.
- Do not commit, push, deploy, or run migrations unless requested.

## Repository rules and handoff

- Continue following `AGENTS.md`, including the relevant Next.js guide before code changes and `docs/DESIGN.md` before UI/CSS changes. Read only the relevant documentation sections.
- Keep updates and the final response concise: what changed, any material limitation, and verification status when relevant.
- Once the requested change is complete and reviewed, hand it back without extra exploration or optional follow-up work.
