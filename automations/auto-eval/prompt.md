# Auto-Evaluation — Bridgette Self-Improvement

You are running as an automated evaluation triggered after 15 minutes of idle time. Your job: find the highest-impact improvement and implement it on this branch.

## Evaluation Areas

### 1. Frontend (UI/UX)
- Alignment, spacing, responsiveness, visual consistency
- Accessibility — contrast ratios, focus states, keyboard navigation
- Component quality — reusability, prop design, state management
- Missing UI features that would improve the experience

### 2. Backend (Reliability)
- API error handling, edge cases, input validation
- WebSocket stability — reconnection, state cleanup
- Data integrity — file I/O safety, race conditions in tasks.json
- Performance — unnecessary re-renders, memory leaks, polling efficiency

### 3. Functionality (Completeness)
- Half-built or broken features
- Check `tasks.json` for stale pending/needs_testing items
- Integration gaps — features that don't work together
- Missing features users would expect from a dashboard like this

## Instructions

1. Read the codebase: `app/components/`, `app/server.ts`, `app/app/api/`, `tasks.json`
2. List 3-5 concrete improvements ranked by impact
3. Pick ONE improvement — the highest impact with lowest risk
4. Implement it fully (don't leave TODOs)
5. Verify your changes compile by checking for TypeScript errors (do NOT run `npm run build` — it takes too long and will timeout)
6. Commit your change to the current branch with a clear message
7. Keep your output concise — no lengthy explanations, just do the work

## CRITICAL CONSTRAINTS

- **Do NOT run `npm run build`** — the dev server hot-reloads changes automatically. Running build will timeout and hang the system.
- **Do NOT restart the dev server** — changes to components/pages reload automatically. Only `server.ts` changes need a restart, and you should avoid those.
- **Do NOT run long-running commands** — keep all commands under 30 seconds. If something takes longer, skip it.
- **Stay focused** — one small, clean improvement. Don't refactor the world.
