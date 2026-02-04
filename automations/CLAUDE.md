# Automations — Directory Notes

## What This Is

Prompt templates and configuration for scheduled automations. Each subdirectory is one automation.

## Directory Structure

```
automations/
├── CLAUDE.md               # This file
├── auto-eval/              # Nightly eval prompts (5-eval rotation)
│   ├── prompt.md           # Overview/fallback prompt
│   ├── frontend.md         # Index 0: UI/UX focus
│   ├── backend.md          # Index 1: API/reliability focus
│   ├── functionality.md    # Index 2: Fix broken features
│   ├── features.md         # Index 3: Implement new features
│   └── memory.md           # Index 4: Documentation updates
├── content-creation/       # Daily content automation
│   └── prompt.md
├── codebase-eval/          # Weekly codebase analysis
│   └── prompt.md
└── job-search/             # Daily job search automation
    └── prompt.md
```

## Scheduled Automations

| Name | Schedule | Description |
|------|----------|-------------|
| `content-creation/` | Daily 5 AM | Trending AI topics → 3 post options with Gemini images |
| `job-search/` | Daily 5 AM | Job boards → filtered matches → resume + cover letter |
| `codebase-eval/` | Weekly | Analyze needthisdone.com → prioritized report |

## How Automations Are Used

### 1. Browser UI (Automations Tab)
- View and copy prompt templates
- "Send to Terminal" button injects prompt directly into PTY
- Click-to-copy curl examples for manual execution

### 2. Scheduled Execution (launchd)
1. launchd fires at scheduled time
2. Curls `POST localhost:3000/api/automations/<name>`
3. API route reads prompt template from this directory
4. Sends prompt to PTY session (or spawns claude -p for background)
5. Results saved to `results/` subdirectory with date

### 3. Direct Execution
```bash
# Trigger an automation manually
curl -X POST localhost:3000/api/automations/content-creation
```

## Prompt Template Convention

Each automation has a `prompt.md` that defines what Claude should do. The API route reads this file and sends it as the prompt.

## Auto-Eval Prompts

The `auto-eval/` subdirectory contains prompts for the nightly eval system (5-eval rotation):

| Prompt | Index | Eval Type | Purpose |
|--------|-------|-----------|---------|
| `frontend.md` | 0 | Frontend | Find & fix 5-10 UI/UX issues with TDD |
| `backend.md` | 1 | Backend | Find & fix 5-10 API/reliability issues with TDD |
| `functionality.md` | 2 | Functionality | Find & fix 5-10 broken flows and missing features |
| `features.md` | 3 | Features | Implement 1-2 useful new features |
| `memory.md` | 4 | Memory | Find & fix 5-10 documentation issues |
| `prompt.md` | — | Overview | General fallback/overview prompt |

### How They Work

1. Nightly scheduler triggers at configured time (default 3 AM EST)
2. Each eval type runs sequentially with configurable interval (default 1 hour)
3. Prompt instructs Claude to:
   - Read `.nightly-eval-fixes.md` to avoid duplication
   - Find top 5-10 issues by impact
   - Fix each using TDD (test → implement → commit)
   - Append fixes to `.nightly-eval-fixes.md` log
   - Run `npm run build` to verify clean state

### Maintenance

- **Fixes log** (`.nightly-eval-fixes.md`) — Auto-appended by evals, tracks what's been fixed to prevent duplication
- **Prompt updates** — Edit files here to change eval behavior; changes apply to next scheduled run

## Adding New Automations

1. Create a new subdirectory: `automations/<automation-name>/`
2. Add a `prompt.md` with the prompt template
3. (Optional) Add to launchd for scheduling — see `launchd/CLAUDE.md`
4. Test manually: `curl -X POST localhost:3000/api/automations/<name>`

## Current Issues & Learnings

- **Features eval** — Added index 3 to implement new features (not just fix issues)
- **Eval rotation** — Index stored in `.auto-eval-index` at project root, wraps 0→4→0
- **Failed evals** — Log as "error" status, no task creation or chaining on failure
