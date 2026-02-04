# .claude/ — Project Rules & Guidelines

## What This Is

The `.claude/` directory contains project-wide rules, standards, and guidelines that apply across all work on this project. This is **meta-documentation** — rules about how to code, design, and work, not operational documentation about specific subsystems.

## Structure

```
.claude/
├── rules/
│   ├── coding-standards.md    # Code organization, naming, TypeScript
│   ├── tdd.md                 # Test-Driven Development rules
│   ├── colors.md              # Color system and BJJ belt progression
│   ├── design-brief.md        # Brand identity and design philosophy
│   ├── design-system.md       # Component patterns and accessibility
│   ├── quality.md             # Code quality and "no broken windows" principle
│   ├── testing-flexibility.md # Testing best practices
│   ├── pr-verification.md     # Pull request review checklist
│   ├── commit-often.md        # Commit frequency and hygiene
│   ├── autonomous-work.md     # Work without stopping to ask permission
│   ├── etc-easy-to-change.md  # Easy To Change principle
│   ├── hero-gradients.md      # Design pattern for hero sections
│   └── inline-editing-state.md # State synchronization for inline editing
├── dev-workflow.md            # (TO BE MOVED to app/CLAUDE.md)
├── nightly-scheduler-checklist.md # (TO BE MOVED to app/CLAUDE.md)
└── CLAUDE.md                  # This file
```

## Purpose

These guidelines ensure consistent code quality, design, and development practices across the project. They answer questions like:
- How should I structure code files?
- What color should this button be?
- When should I commit?
- How do I handle errors?

## When to Update .claude/rules/

Add or update rules in `.claude/rules/` when you discover:
- A pattern that works well and should be used consistently
- A gotcha or pitfall that the team should know about
- A new standard or approach that improves code quality
- A decision that should guide future work

**Always explain the "why"** — rules without context are hard to follow.

## Key Rules Summary

| Rule | File | TL;DR |
|------|------|-------|
| Code quality | `quality.md` | Fix warnings and errors immediately |
| Testing | `tdd.md` | Write tests first, code second |
| Coding | `coding-standards.md` | One job per function, DRY principle |
| Colors | `colors.md` | BJJ belt progression: Green → Blue → Purple → Gold |
| Work style | `autonomous-work.md` | Don't ask permission, just do the work |
| Commits | `commit-often.md` | Small, focused commits frequently |
| Design | `design-system.md` | Accessibility first, consistent patterns |
| Changes | `etc-easy-to-change.md` | Code should be easy to change |

## Current Issues & Learnings

- The `dev-workflow.md` and `nightly-scheduler-checklist.md` files don't belong here — they're operational documentation that should be in `app/CLAUDE.md`. They will be moved and deleted from this directory.
- Rules should focus on "how to do things right" not "how to use specific features"

---

**Last updated:** (Check git log for recent changes)
