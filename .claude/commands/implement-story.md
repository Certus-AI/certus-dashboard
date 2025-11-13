---
name: implement-story
description: Implement an approved story
---

# Implement Story Command

Invokes **dev-implementer** to build the story.

## Usage
```
/implement EP1-S1
```

## What it does
1. Reads story file
2. Creates/modifies code
3. Updates story status to review
4. Logs changes

## Prerequisites
- Story must be approved
- WIP limit not exceeded
