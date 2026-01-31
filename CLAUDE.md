# Bridgette — Project Memory

## What This Project Is

**Bridgette** is a native replacement for OpenClaw. A Next.js dashboard that wraps a live interactive Claude Code session via PTY (node-pty + xterm.js + WebSocket). Authenticated through macOS Keychain with Max subscription. Runs on the Mac Mini at localhost:3000.

## Current State

### What's Built
- **Memory system** — All personality, identity, and context files merged from ~/claude-memory into `memory/`
- **Terminal core** — Custom Next.js server with WebSocket, node-pty spawns `claude` in a PTY, xterm.js renders it in the browser. Session persists across browser refreshes.
- **Dashboard shell** — Header with tab navigation (Terminal, Memory), status indicator for connection state
- **Build passes** — `next build` clean, dev server runs on localhost:3000

### What's Left
- **Memory editor UI** — Read/edit memory/*.md files from the dashboard
- **API routes** — `/api/memory/*` for CRUD, `/api/automations/*` for triggers, `/api/health`
- **Automation prompt templates** — Content creation, job search, codebase eval in `automations/`
- **launchd plists** — Scheduled curl triggers in `launchd/`
- **Log viewer** — View automation run history
- **Status page** — launchd job status, memory file timestamps, server health

## Architecture

- **Terminal core:** node-pty spawns `claude` in PTY, WebSocket pipes to xterm.js in browser
- **Dashboard:** Next.js app with memory editor, automation triggers, log viewer
- **Memory:** Markdown files in `memory/` — curated, not automated
- **Scheduling:** launchd plists curl API routes on schedule
- **Auth:** Keychain via PTY session (Max subscription, no API key)

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `memory/` | Personality, identity, persistent facts, context |
| `app/` | Next.js dashboard (Bridgette) |
| `automations/` | Prompt templates for scheduled tasks |
| `launchd/` | launchd plist files for scheduling |

## Decisions Made

- Named the dashboard **Bridgette** after the assistant personality
- PTY + xterm.js over `claude -p` — need interactive session for Max auth via Keychain
- Terminal session over LaunchAgent — LaunchAgents can't access Keychain
- Next.js API routes for orchestration — automations trigger via REST
- Markdown as database — memory files are the source of truth, no DB
- Merged ~/claude-memory into this repo under `memory/`
- Custom server.ts required — Next.js API routes can't do raw WebSocket upgrade

## Things Discovered During Build

- `create-next-app` interactive prompts block in non-TTY — had to scaffold manually
- xterm CSS can't be dynamically imported in Next.js — must go in globals.css
- @next/swc version mismatch warning is cosmetic, doesn't affect functionality
- node-pty must be in `serverExternalPackages` in next.config.ts to avoid webpack bundling

## Commands

```bash
cd app && npm run dev    # Start Bridgette (includes WebSocket server)
cd app && npm run build  # Production build
```
