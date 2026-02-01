# Auto-Evaluation — Functionality Focus

You are running as an automated evaluation. Your focus: **missing features, broken flows, and integration gaps**.

## Scope

Examine all project files:
- `app/components/`
- `app/server.ts`
- `app/app/api/`
- `tasks.json`
- `CLAUDE.md` (for planned but unbuilt features — check "What's Left" section)
- `roadmap.md` (for roadmap items not yet implemented)

## What to Look For

- Half-built or broken features — things that render but don't work end-to-end
- Features listed in "What's Left" or roadmap that could be implemented now
- Integration issues — features that should work together but don't
- Broken user flows — click paths that dead-end or error
- Missing functionality users would expect from a dashboard like this
- State sync issues — UI not reflecting server state, stale data after actions
- Missing keyboard shortcuts or accessibility flows

## Instructions

1. Read the codebase files, CLAUDE.md, and roadmap.md — understand what exists and what's missing
2. List 5-10 concrete improvements ranked by user impact
3. Implement the **top 2-3 improvements** — go for features or fixes users will actually notice
4. Each improvement should be complete and working (no TODOs, no placeholders)
5. Verify no TypeScript errors (do NOT run `npm run build`)
6. Commit with a clear message describing ALL changes made
7. Cross-cutting changes that touch frontend + backend are welcome here

## What "Meaningful" Means

- Cleaning up a stale task in tasks.json is NOT meaningful. Building a missing feature from the roadmap IS.
- Adding a comment is NOT meaningful. Fixing a broken user flow end-to-end IS.
- Renaming a variable is NOT meaningful. Connecting two features that should work together IS.
- Think: "Would a user say 'oh nice, that actually works now'?"

## CRITICAL CONSTRAINTS

- **Do NOT run `npm run build`** — dev server hot-reloads automatically
- **Do NOT restart the dev server**
- **Do NOT run long-running commands** — keep all commands under 30 seconds
- **Be ambitious** — make changes that matter
