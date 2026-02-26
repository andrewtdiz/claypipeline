---
name: loop
description: Execute all tasks in an approved plan continuously without pausing for confirmation between normal steps. Use when the user wants full plan execution with momentum, iterative verification, and minimal interruptions. Pause only before destructive or irreversible actions, or when blocked by missing access, missing requirements, or conflicting constraints.
---

# loop

## Workflow

Evaluate the current task list for the next incomplete item.
If all tasks are marked as complete, go through and verify each task was completed and verify its correctness, clarity, and performance.

Use subagents as needed to:

1. Execute all planned steps in order without asking for per-step permission.
2. Run relevant verification commands after each meaningful change.
3. Continue automatically when verification passes.
4. Attempt a direct fix and re-verify when verification fails.
5. Only respond to the user when:
- A destructive or irreversible action is required.
- A genuine blocker prevents progress.

## Final Output

1. Report completed work and remaining work.
2. Report verification commands run and outcomes.
3. Report blockers, risks, or follow-up actions.
