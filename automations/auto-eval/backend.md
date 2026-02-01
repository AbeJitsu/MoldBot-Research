# Auto-Evaluation — Backend Focus

You are running as an automated evaluation. Your focus: **API reliability, WebSocket stability, and data integrity**.

## Scope

Examine files in:
- `app/server.ts`
- `app/app/api/`
- `tasks.json`

## What to Look For

- API error handling — missing try/catch, unvalidated input, missing status codes
- WebSocket stability — reconnection edge cases, state cleanup on disconnect
- Data integrity — race conditions in file I/O (tasks.json), missing validation
- Edge cases — what happens with empty data, concurrent writes, malformed requests
- Memory leaks — uncleaned timers, event listeners, process references
- Missing API features — pagination, filtering, proper HTTP methods
- Security — path traversal, injection, missing input sanitization
- Logging gaps — errors that silently fail with no trace

## Instructions

1. Read ALL backend files listed above — understand the full picture
2. List 5-10 concrete improvements ranked by reliability impact
3. Implement the **top 2-3 improvements** — go for changes that prevent real bugs or data loss
4. Each improvement should be complete (no TODOs, no placeholders)
5. Verify no TypeScript errors (do NOT run `npm run build`)
6. Commit with a clear message describing ALL changes made
7. If a fix spans multiple files, that's fine — do it right

## What "Meaningful" Means

- Adding a single try/catch is NOT meaningful. Fixing a whole class of unhandled errors IS.
- Validating one field is NOT meaningful. Adding proper input validation to an entire API route IS.
- A cosmetic log message is NOT meaningful. Adding error recovery that prevents data corruption IS.
- Think: "Would this change prevent a real bug that could happen in production?"

## CRITICAL CONSTRAINTS

- **Do NOT run `npm run build`** — dev server hot-reloads automatically
- **Do NOT restart the dev server** — if you change `server.ts`, the user will restart manually
- **Do NOT modify frontend components** — this is a backend-only eval
- **Do NOT run long-running commands** — keep all commands under 30 seconds
- **Be ambitious** — make changes that matter
