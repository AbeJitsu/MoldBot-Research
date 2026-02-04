# scripts/ — Utility Tools

## What This Is

The `scripts/` directory contains utility scripts for managing the Bridgette development environment and server lifecycle. These scripts handle launchd service installation, starting/stopping, and development workflow management.

## Scripts Overview

| Script | Purpose |
|--------|---------|
| `dev-control.sh` | Development workflow helper (stop/start/dev/status) |
| `bridgette-install.sh` | Install launchd service for auto-start on login |
| `bridgette-start.sh` | Start the background service |
| `bridgette-stop.sh` | Stop the background service |
| `bridgette-restart.sh` | Restart the background service |
| `bridgette-disable-auto-start.sh` | Remove auto-start and uninstall service |

## dev-control.sh

**Purpose:** Manages the Bridgette server lifecycle for development and testing. Stops/starts the background launchd service and the dev server without port conflicts.

**Commands:**

| Command | Purpose |
|---------|---------|
| `./scripts/dev-control.sh stop` | Stop launchd service, kill any processes on port 3000 |
| `./scripts/dev-control.sh start` | Start launchd service |
| `./scripts/dev-control.sh dev` | Start dev server manually (one-time, foreground, not persistent) |
| `./scripts/dev-control.sh status` | Check service status and port 3000 usage |
| `./scripts/dev-control.sh help` | Show usage and examples |

**When to Use:**

| Scenario | Command |
|----------|---------|
| Before development | `./scripts/dev-control.sh stop` to free port 3000 |
| Start dev server | `./scripts/dev-control.sh dev` (runs in foreground) |
| After development | `./scripts/dev-control.sh start` to restore production behavior |
| Check what's running | `./scripts/dev-control.sh status` |

**Configuration:**

- `LABEL="com.bridgette.server"` — launchd service label (matches plist in launchd/)
- `PORT=3000` — development server port
- `PROJECT_ROOT` — auto-derived from script location

**Safety Features:**

- Uses `set -e` for error handling
- Gracefully handles missing service (no exit on stop failure)
- Safely kills processes with defensive error suppression (`|| true`)
- Includes sleep delays for process state transitions

## bridgette-install.sh

**Purpose:** First-time setup script that installs the Bridgette server as a macOS launchd service for auto-start on login.

**What It Does:**

1. Creates log directory at `~/Library/Logs/Bridgette/`
2. Copies plist from `launchd/com.bridgette.server.plist` to `~/Library/LaunchAgents/`
3. Loads the service with `launchctl load`
4. Verifies service is running

**When to Use:** Run once after cloning the repo or on a new machine.

```bash
./scripts/bridgette-install.sh
```

## bridgette-start.sh

**Purpose:** Start the Bridgette background service if it's installed but not running.

**What It Does:**

1. Checks if service is installed
2. Loads/starts the launchd service
3. Verifies it's running

```bash
./scripts/bridgette-start.sh
```

## bridgette-stop.sh

**Purpose:** Stop the Bridgette background service.

**What It Does:**

1. Checks if service is installed
2. Unloads the launchd service
3. Verifies it stopped

```bash
./scripts/bridgette-stop.sh
```

## bridgette-restart.sh

**Purpose:** Convenience script to restart the service (calls stop then start).

```bash
./scripts/bridgette-restart.sh
```

## bridgette-disable-auto-start.sh

**Purpose:** Completely disable the background service and remove auto-start.

**What It Does:**

1. Unloads the launchd service
2. Removes the plist from `~/Library/LaunchAgents/`
3. Service will no longer start on login

**When to Use:** If you want to stop using the background service entirely, or before uninstalling.

```bash
./scripts/bridgette-disable-auto-start.sh
```

## Full Development Workflow

For detailed instructions on using these scripts in a complete development workflow (testing nightly scheduler, verifying execution, etc.), see `../app/CLAUDE.md` → Development Workflow.

**Quick workflow:**

```bash
# 1. Stop production service before development
./scripts/dev-control.sh stop

# 2. Run dev server (stays in foreground)
./scripts/dev-control.sh dev

# 3. When done, restore production service
./scripts/dev-control.sh start
```

## Log Locations

After installation, logs are written to:
- Server output: `~/Library/Logs/Bridgette/server.log`
- Server errors: `~/Library/Logs/Bridgette/server-error.log`

## Adding New Scripts

When adding scripts to this directory:
1. Add a section to this CLAUDE.md documenting the script
2. Include purpose, commands, and when to use
3. Keep scripts focused on one task
4. Add help output to the script itself
5. Use `set -e` for error handling
6. Handle missing dependencies gracefully

## Current Issues & Learnings

- The scripts correctly use `com.bridgette.server` as the launchd label (verified against `launchd/com.bridgette.server.plist`)
- `dev-control.sh` uses `launchctl start/stop` while the bridgette-*.sh scripts use `launchctl load/unload` — both approaches work, load/unload is more traditional for macOS service management
- The `bridgette-*.sh` scripts check for plist existence before operating, providing better error messages
- `dev-control.sh` is more aggressive with port cleanup (`lsof -ti:$PORT | xargs kill -9`)

---

**Last updated:** Check git log for recent changes
