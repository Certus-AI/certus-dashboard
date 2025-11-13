---
name: shard-docs
description: Break PRD into epics and stories
---

# Shard Docs Command

Invokes **po-owner** agent to decompose PRD into actionable work items.

## Usage
```
/shard-docs
```

## What it does
1. Reads docs/prd.md and docs/architecture.md
2. Creates epic files in /epics
3. Creates story files in /stories (EP{X}-S{Y} format)
4. Each story ≤ 1 day of work

## Output
- epics/ep1.md, ep2.md, etc.
- stories/ep1_s1.md, ep1_s2.md, etc.
