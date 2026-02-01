# Bridgette — Roadmap

*Last updated: January 31, 2026*

---

## What This Is

**Bridgette** is a Next.js dashboard on the Mac Mini that wraps Claude Code in a custom chat UI. No iTerm window, no raw terminal — a polished interface powered by `claude --print --output-format=stream-json` with streaming responses, tool use cards, and session continuity. Memory management, automation triggers, and scheduling built around it.

**Cost:** $0 beyond your existing Claude Max subscription.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Bridgette (localhost:3000)                              │
│                                                          │
│  ┌─────────────────────┐  ┌───────────────────────────┐  │
│  │  Dashboard UI        │  │  Chat Panel              │  │
│  │  - Memory editor     │  │  claude --print           │  │
│  │  - Automation triggers│  │  --stream-json            │  │
│  │  - Log viewer        │  │  Streaming responses,     │  │
│  │  - Status/health     │  │  tool use cards, costs    │  │
│  └─────────────────────┘  └────────────┬──────────────┘  │
│                                        │                  │
│  Custom Server (Next.js + WebSocket)   │                  │
│  ├── WS /ws/chat ← child_process  ←───┘                  │
│  │   spawn claude --print --stream-json                   │
│  │   stdin/stdout piped over WebSocket                    │
│  ├── REST: /api/memory/*                                  │
│  ├── REST: /api/automations/*                             │
│  └── REST: /api/health                                    │
└──────────────────────────────────────────────────────────┘
               │ stdio pipes (no PTY needed)
               ▼
┌──────────────────────────────────────────────────────────┐
│  claude --print --output-format=stream-json              │
│  Keychain auth via Max subscription                      │
│  NDJSON event stream: text, tool_use, result, costs      │
└──────────────────────────────────────────────────────────┘
               │ reads/writes
               ▼
┌──────────────────────────────────────────────────────────┐
│  memory/  (personality, context, persistent facts)       │
│  SOUL.md, IDENTITY.md, USER.md, AGENTS.md, ...          │
└──────────────────────────────────────────────────────────┘
```

---

## What's Built

- **Memory system** — merged from ~/claude-memory (SOUL.md, IDENTITY.md, USER.md, AGENTS.md, MEMORY.md, TOOLS.md, HEARTBEAT.md, context/)
- **Memory editor** — sidebar file browser, monospace editor, Cmd+S save, unsaved indicator
- **Automations panel** — view/copy prompt templates with BJJ belt color coding
- **API routes** — memory CRUD, automations list/trigger, health check
- **Prompt templates** — content creation, job search, codebase evaluation
- **launchd plists** — daily at 5 AM (content + jobs), weekly Monday 6 AM (codebase eval)
- **Three-tab dashboard** — Terminal (emerald), Memory (blue), Automations (purple)
- **Server** — custom HTTP + WebSocket on port 3000

---

## Roadmap

### Phase 1: Chat UI (Next)

Replace the xterm.js terminal with a chat interface powered by `claude --print --output-format=stream-json`. No PTY needed — works everywhere.

| Step | What | Files |
|------|------|-------|
| 1 | Test `--resume` for multi-turn, map stream-json event types | — |
| 2 | `/ws/chat` WebSocket handler: spawn claude, parse NDJSON, forward events | `server.ts` |
| 3 | Chat UI: message bubbles, streaming text, tool use cards, input box, costs | `components/ChatSession.tsx` |
| 4 | Replace Terminal tab with Chat tab | `app/page.tsx` |

**Stream-JSON events to handle:**

| Event | Render As |
|-------|-----------|
| `system/init` | Store session ID, show model badge |
| `assistant` | Streaming text bubble |
| `tool_use` | Collapsible card: "Reading file X..." |
| `tool_result` | Result inside tool card |
| `result` | Cost badge, completion indicator |

### Phase 2: Enhanced Chat UX

- File diff viewer for edit tool results
- Approval buttons for tool use
- Markdown rendering + code syntax highlighting
- Search/filter conversation history
- Multiple sessions support

### Phase 3: Operations

- Log viewer for automation run history
- Status page (launchd jobs, server health)
- Working directory selector
- New session button
- Design polish

---

## Project Structure

```
OpenClaw Research/
├── memory/                  ← shared memory (markdown files)
├── app/                     ← Bridgette (Next.js dashboard)
│   ├── server.ts            ← custom HTTP + WebSocket server
│   ├── components/
│   │   ├── ChatSession.tsx  ← chat UI (Phase 1)
│   │   ├── MemoryEditor.tsx
│   │   └── Automations.tsx
│   ├── app/
│   │   ├── page.tsx         ← dashboard home (tabs)
│   │   └── api/             ← REST endpoints
│   └── package.json
├── automations/             ← prompt templates
├── launchd/                 ← scheduling plists
└── bridging-claude-code-and-openclaw.md  ← this roadmap
```

---

## Mac Mini Requirements

- Always on, never sleeps
- `npm run dev` running (from real terminal or launchd)
- `~/.local/bin` in PATH (where `claude` lives)
- Chrome open for browser automation tasks
