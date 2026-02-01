# Active Work

## Current Project
- **Project:** Bridgette (Native Claude Code Dashboard)
- **Path:** ~/Projects/Personal/OpenClaw Research
- **Branch:** dev (all work happens here, merged to main when stable)
- **Status:** Core features complete, polish phase

## What's Done (Recent)
- Chat UI with streaming, tool cards, markdown, cost tracking, session resume
- Three-panel task management layout
- Five-tab dashboard: Chat, Memory, Automations, Eval Logs, Status
- Auto-iteration system with four-eval rotation
- Backend hardening: graceful shutdown, atomic eval-log writes, process lifecycle
- Reconnection UX: disconnect banner, retry button, auto-reconnect
- Tool card copy buttons (input + result sections)
- Diff syntax highlighting in tool results (green/red/blue)
- ARIA tab accessibility fixes (proper tabpanel roles)
- Shared `lib/format.ts` — consolidated formatRelativeTime, formatBytes, formatUptime, formatInterval
- Reusable `TabEmptyState` component with loading/error/empty variants

## Next Steps
- Responsive layout refinements
- File diff viewer for edit tool results
- Code syntax highlighting in markdown
