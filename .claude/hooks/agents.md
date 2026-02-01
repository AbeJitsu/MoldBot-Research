# Hooks Folder

Three working hooks for session lifecycle management.

## Active Hooks

| File | Purpose | Provides feedback to Claude? |
|------|---------|------------------------------|
| `session-start.sh` | Shows git branch, uncommitted files, and task kanban summary | YES - visible at session start |
| `pre-compact.sh` | Saves work state before compression | YES - same pattern |
| `stop-check.sh` | Blocks Claude from stopping if build is failing | YES - forces iteration until passing |

## What's Broken (Tested)

| Hook Type | Status | Tested How |
|-----------|--------|------------|
| PreToolUse | Doesn't fire | Debug output never appeared |
| PostToolUse | Doesn't fire | GitHub issues #6403, #6305, #3148 |

## Rule

If Claude can't see the output, delete the hook. No point in broken code.
