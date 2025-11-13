---
name: review-story
description: Review and test story implementation
---

# Review Story Command

Invokes **qa-reviewer** to validate implementation.

## Usage
```
/review EP1-S1
```

## What it does
1. Checks acceptance criteria
2. Runs unit tests
3. Runs E2E tests if needed
4. Updates status to done if passing

## Options
```
/review EP1-S1 --autofix
```
Attempts to fix trivial issues automatically.
