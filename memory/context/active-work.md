# Active Work

## Current Project
- **Project:** Bridgette (Native Claude Code Dashboard)
- **Path:** ~/Projects/Personal/OpenClaw Research
- **Branch:** dev (all work happens here, merged to main when stable)
- **Status:** Core features complete, polish phase

## What's Done (Recent)
- Working directory persistence — Selection saved to localStorage, restored on page reload (Feb 1)
- Automation execution queue — POST /api/automations/{name} queues prompts, server executes on next message (Feb 1)
- Responsive task polling — Reduced from 3s to 1s, auto-eval tasks visible within 1s (Feb 1)
- Task-to-chat action — "Chat" button on tasks sends title + description to Claude as a message
- Keyboard shortcuts overlay — Cmd+/ toggles grouped shortcut reference panel, linked from input footer
- Backend hardening v3 — Directory validation, symlink protection, stale task cleanup

## Next Steps
- Approval buttons for tool use
- Multiple sessions support
- Design system refinements
