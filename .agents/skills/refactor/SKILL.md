---
name: refactor
description: Review a feature implementation for separation of concerns, explicit data flow, and long-term maintainability. Use when the user asks for refactor review, architecture quality review, or detection of hard-coded or hacky solutions in core architecture touch points.
---

# refactor

## Workflow

1. Read the feature implementation end to end.
2. Map component responsibilities and boundaries.
3. Evaluate separation of concerns across modules and functions.
4. Evaluate data flow clarity, ownership, and side effects.
5. Flag hard-coded logic and hacks in critical or core architecture touch points.

## Findings Format

1. List findings by severity, highest first.
2. Include file paths and precise locations.
3. Explain impact and concrete risk to maintainability.
4. Suggest a practical refactor direction for each issue.
5. State explicitly when no critical findings are present.
