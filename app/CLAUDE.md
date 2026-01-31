# Bridgette App — Directory Notes

## What This Is

**Bridgette** — a Next.js dashboard wrapping a live interactive Claude Code session in the browser. Custom server with WebSocket support for the terminal PTY connection.

## Current State

### Built
- `server.ts` — Custom HTTP + WebSocket server on port 3000. Spawns `claude` via node-pty. Handles reconnection (PTY stays alive when browser disconnects).
- `components/Terminal.tsx` — xterm.js terminal with fit addon, web links addon, Tokyo Night theme. Connects via WebSocket, sends keystrokes, renders output.
- `app/page.tsx` — Dashboard home with tab navigation (Terminal, Memory). Memory tab is a placeholder.
- `app/layout.tsx` — Root layout with metadata, Tailwind CSS.
- `app/globals.css` — Tailwind + xterm.js CSS imports.

### Not Yet Built
- `app/api/memory/` — REST endpoints for reading/writing memory files
- `app/api/automations/` — REST endpoints for triggering automations
- `app/api/health/` — Health check endpoint
- Memory editor component — markdown editor with preview
- Automation panel — trigger buttons, result viewer
- Log viewer — automation run history

## Key Architecture

- **Custom server (`server.ts`):** Handles HTTP + WebSocket upgrade on same port. One active PTY session — reconnects on browser refresh rather than spawning new.
- **Terminal component:** Dynamic imports for xterm.js (browser-only). Sends resize events to server. Status indicator (connected/connecting/disconnected).
- **Session lifecycle:** PTY persists independently of WebSocket. Browser close doesn't kill the session. "New session" button (not yet built) will kill and respawn.

## Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `node-pty` | PTY spawning | Installed, working |
| `@xterm/xterm` + addons | Terminal rendering | Installed, working |
| `ws` | WebSocket server | Installed, working |
| `next` + `react` + `tailwindcss` | UI framework | Installed, working |
| `tsx` | Run TypeScript server | Installed, working |

## API Routes (Planned)

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/ws/terminal` | WebSocket | PTY ↔ browser | Built |
| `/api/memory` | GET | List all memory .md files | Not built |
| `/api/memory/[file]` | GET/PUT | Read/write memory file | Not built |
| `/api/automations/[name]` | POST | Trigger automation | Not built |
| `/api/health` | GET | Health check | Not built |

## Design System

Follow BJJ belt color progression (emerald → blue → purple → gold). See `.claude/rules/colors.md` and `.claude/rules/design-brief.md`.

## Things Discovered

- xterm CSS must be imported in globals.css, not dynamically — Next.js build fails on dynamic CSS imports
- node-pty needs `serverExternalPackages` in next.config.ts to avoid webpack trying to bundle native modules
- @next/swc version mismatch warning (15.5.7 vs 15.5.11) is cosmetic
- tsx works well for running the custom TypeScript server in dev
