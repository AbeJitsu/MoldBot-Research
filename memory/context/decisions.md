# Decisions Log

## 2026-01-31: Replace OpenClaw with native dashboard
- **Decision:** Build a Next.js dashboard with PTY terminal instead of using OpenClaw
- **Reason:** Eliminates API cost, gives interactive session, removes third-party dependency
- **Trade-off:** No mobile messaging (Telegram) — acceptable, can add webhooks later

## 2026-01-31: PTY + xterm.js for terminal
- **Decision:** Use node-pty to spawn claude, WebSocket to pipe to xterm.js in browser
- **Reason:** Full interactive session with Keychain auth, industry standard approach
- **Trade-off:** Requires custom Next.js server for WebSocket upgrade

## 2026-01-31: Terminal session for auth
- **Decision:** Run dashboard in terminal session, not as LaunchAgent
- **Reason:** LaunchAgents can't access macOS Keychain needed for Max subscription
- **Trade-off:** Must manually start in terminal (or use tmux/screen for persistence)
