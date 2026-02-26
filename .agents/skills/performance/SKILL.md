---
name: performance
description: Review a feature implementation for critical or high-severity performance and memory management issues. Use when the user asks for performance review, memory review, bottleneck analysis, or runtime scalability risk assessment in implementation code.
---

# performance

## Workflow

1. Read the implementation and identify runtime-critical paths.
2. Inspect allocation patterns, ownership, and lifetime behavior.
3. Inspect loops, hot code paths, and unnecessary copying.
4. Inspect for unbounded growth, leak risks, and expensive repeated work.
5. Focus findings on critical and high severity issues.

## Findings Format

1. List findings by severity, highest first.
2. Include file paths and precise locations.
3. Explain runtime or memory impact in concrete terms.
4. Suggest a direct fix or mitigation path for each issue.
5. State explicitly when no critical or high findings are present.
