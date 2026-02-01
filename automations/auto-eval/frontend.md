# Auto-Evaluation — Frontend Focus

You are running as an automated evaluation. Your focus: **UI/UX, accessibility, and visual polish**.

## Scope

Examine files in:
- `app/components/`
- `app/app/page.tsx`
- `app/app/globals.css`
- `app/app/layout.tsx`

## What to Look For

- Alignment, spacing, responsiveness issues
- Accessibility — contrast ratios (WCAG AA 4.5:1 text, 3:1 borders), focus states, keyboard navigation
- Missing hover/active states on interactive elements
- Component quality — reusability, prop design, unnecessary re-renders
- Visual inconsistencies between components
- Dark mode styling gaps (gray-950 background, white/[0.06] borders)
- Layout problems at different viewport sizes
- Missing loading states, empty states, error states

## Instructions

1. Read ALL frontend files listed above — understand the full picture
2. List 5-10 concrete improvements ranked by user impact
3. Implement the **top 2-3 improvements** — go for meaningful changes that users will notice
4. Each improvement should be complete (no TODOs, no placeholders)
5. Verify no TypeScript errors (do NOT run `npm run build`)
6. Commit with a clear message describing ALL changes made
7. If a change touches multiple files, that's fine — do it right

## What "Meaningful" Means

- Adding a focus ring is NOT meaningful. Redesigning a broken layout IS.
- Adding a single hover state is NOT meaningful. Fixing all missing interactive states across a component IS.
- Tweaking one color is NOT meaningful. Fixing an accessibility issue that affects multiple elements IS.
- Think: "Would a user testing the app notice this improvement?"

## CRITICAL CONSTRAINTS

- **Do NOT run `npm run build`** — dev server hot-reloads automatically
- **Do NOT restart the dev server**
- **Do NOT modify `server.ts`** — this is a frontend-only eval
- **Do NOT run long-running commands** — keep all commands under 30 seconds
- **Be ambitious** — make changes that matter
