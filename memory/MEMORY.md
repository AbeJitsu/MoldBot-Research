# MEMORY.md - Curated Persistent Facts

*Things worth remembering. Actively maintained — remove what's stale, add what matters.*

## Project Decisions

- **Jan 31, 2026:** Decided to replace OpenClaw with native PTY-based dashboard. Reason: eliminates $30/mo API cost, gives full interactive Claude session instead of headless `claude -p`, removes Telegram dependency.
- **Jan 31, 2026:** Chose node-pty + xterm.js + WebSocket for terminal in browser. Industry standard, battle-tested. Custom Next.js server needed for WebSocket upgrade.
- **Jan 31, 2026:** Auth strategy: terminal session for Keychain access (Max subscription). LaunchAgents can't access Keychain. launchd only triggers curl commands to the running dashboard.

## Technical Learnings

- LaunchAgent daemons cannot access macOS Keychain — must run in interactive terminal session
- `claude -p` needs `< /dev/null` to prevent hanging on stdin in non-interactive mode
- VS Code can use 30+ GB RAM, causing macOS to SIGKILL `claude -p`
- `PI_BASH_YIELD_MS=120000` needed for OpenClaw to not background long commands (no longer needed with native approach)

## About Abe

- BJJ purple belt — brand colors follow belt progression (green → blue → purple → gold)
- Prefers concise communication
- Timezone: America/New_York
- Main project: Need_This_Done (Next.js ecommerce, 388 source files)
