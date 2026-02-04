# Bridgette — Project Documentation

**Bridgette** is a Next.js dashboard with a real interactive terminal (xterm.js + node-pty), memory editor, and automations panel. Runs on localhost:3000 via launchd.

## Documentation Structure

Each directory has its own `CLAUDE.md` with relevant context. **Load only what you need** — don't read everything to work on one part.

| Directory | Purpose | When to Read |
|-----------|---------|--------------|
| [`app/`](app/CLAUDE.md) | Next.js dashboard, components, API routes, dev workflow | Working on the app |
| [`memory/`](memory/CLAUDE.md) | Personality, identity, persistent facts | Updating memory files |
| [`launchd/`](launchd/CLAUDE.md) | Scheduled eval triggers, plist configuration | Working on scheduling |
| [`automations/`](automations/CLAUDE.md) | Prompt templates for evals | Adding/modifying automations |
| [`scripts/`](scripts/CLAUDE.md) | Utility scripts (dev-control.sh, etc.) | Using helper scripts |
| [`.claude/`](.claude/CLAUDE.md) | Project rules and coding standards | Learning conventions |

## Quick Navigation

- **First time?** → [`app/CLAUDE.md`](app/CLAUDE.md)
- **Testing nightly scheduler?** → [`app/CLAUDE.md`](app/CLAUDE.md) → Development Workflow
- **Working on scheduling?** → [`launchd/CLAUDE.md`](launchd/CLAUDE.md)
- **Updating personality/memory?** → [`memory/CLAUDE.md`](memory/CLAUDE.md)
- **Project standards?** → [`.claude/rules/`](.claude/rules/)
- **Using scripts?** → [`scripts/CLAUDE.md`](scripts/CLAUDE.md)

---

## Branch Workflow

This project uses a **three-branch workflow** for stable releases:

| Branch | Purpose | Merge Target |
|--------|---------|--------------|
| `dev` | All new coding happens here | → `testing` |
| `testing` | Verify changes, run objective tests | → `production` |
| `production` | Stable releases, deployed code | — |

### Development Flow

1. **Code on dev:** Make all changes and commits on `dev` branch
2. **Test on testing:** Merge `dev` → `testing` and run test suite (see below)
3. **Release to production:** After tests pass, merge `testing` → `production`
4. **Sync dev:** After production merge, sync `dev` with `production`

### Testing Checklist

Before merging `testing` → `production`, verify:

```bash
# Unit tests (no server needed)
cd app && npm run test:run

# Integration tests (start server in separate terminal)
cd app && npm run dev  # Terminal 1
cd app && npm run test:run  # Terminal 2

# Critical system tests (see TEST_RESULTS.md for full checklist)
# - Launchd service loads without auto-starting
# - Manual start/stop works
# - Server restart and cleanup verified
```

### Commands

**Work on a feature:**
```bash
git checkout dev
# make changes
git add .
git commit -m "feat: description"
git push origin dev
```

**Test a feature:**
```bash
git checkout testing
git merge dev
# run test suite
```

**Release to production (after tests pass):**
```bash
git checkout production
git merge testing --no-ff
git push origin production

# Sync dev with production
git checkout dev
git merge production --ff-only
git push origin dev
```

### Test Results

See [`TEST_RESULTS.md`](TEST_RESULTS.md) for the most recent verification results.

---

## Documentation Maintenance

**Keep documentation current.** When you learn something new about a subsystem, **update that subsystem's CLAUDE.md immediately**.

### When to Update

Update the appropriate CLAUDE.md when you:
- Discover how something actually works (docs may be wrong)
- Learn about a gotcha or limitation
- Change how something works
- Find a pattern worth documenting
- Realize documentation is missing

### How to Update

1. **Identify the subsystem** — What does this relate to? (app, memory, launchd, automations, scripts, or rules?)
2. **Edit that CLAUDE.md** — Add or update information in that directory's file
3. **Include context** — Explain "why" not just "what"
4. **Commit** — `git commit -m "docs: [what you updated] in [which]/CLAUDE.md"`

### Documentation Standards

- **Accuracy first** — Keep in sync with actual code
- **Complete examples** — Copy-paste ready commands
- **Clear sections** — Headers and tables
- **No duplication** — Link instead of repeat

---

## Current State

- **Running:** launchd service (`com.bridgette.server`) on localhost:3000
- **Features:** Terminal, Memory editor, Automations, 5-tab dashboard, Auto-eval (5-type rotation), Nightly scheduler
- **Dev tools:** `scripts/dev-control.sh` for lifecycle management

## Project Structure

```
bridgette-automation/
├── CLAUDE.md              ← You are here (navigation)
├── app/                   ← Next.js dashboard
│   └── CLAUDE.md
├── memory/                ← Persistent memory files
│   └── CLAUDE.md
├── launchd/               ← Scheduled tasks
│   └── CLAUDE.md
├── automations/           ← Prompt templates
│   └── CLAUDE.md
├── scripts/               ← Utility scripts
│   └── CLAUDE.md
└── .claude/               ← Project rules
    ├── CLAUDE.md
    └── rules/
```
