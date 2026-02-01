#!/bin/bash
# Stop hook: kills dev server, rebuilds, restarts, and checks localhost:3000.
# Returns {"decision": "block", "reason": "..."} to force continuation.
# Returns {} to allow stopping.

set -e

# Read stdin for hook input (contains stop_hook_active flag)
INPUT=$(cat)

# Prevent infinite loops: if we're already in a stop-hook-triggered continuation, allow stopping
STOP_HOOK_ACTIVE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('stop_hook_active', False))" 2>/dev/null || echo "False")

if [ "$STOP_HOOK_ACTIVE" = "True" ] || [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  echo '{}'
  exit 0
fi

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$PROJECT_DIR/app"

REASONS=""

if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"

  # Check 1: Does the build pass?
  if ! npm run build > /dev/null 2>&1; then
    REASONS="${REASONS}Build is failing — fix build errors. "
  else
    # Check 2: Kill existing dev server, restart, and verify it responds
    # Kill anything on port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1

    # Start dev server in background
    npm run dev > /dev/null 2>&1 &
    DEV_PID=$!

    # Wait up to 15 seconds for server to respond
    READY=false
    for i in $(seq 1 15); do
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
      if [ "$HTTP_CODE" = "200" ]; then
        READY=true
        break
      fi
      sleep 1
    done

    if [ "$READY" = "false" ]; then
      # Kill the server we started if it didn't come up
      kill $DEV_PID 2>/dev/null || true
      REASONS="${REASONS}Dev server failed to start — localhost:3000 not responding. "
    fi
  fi
fi

# If there are reasons to block, return them
if [ -n "$REASONS" ]; then
  ESCAPED=$(echo "$REASONS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"decision\": \"block\", \"reason\": \"Stop hook: ${ESCAPED}\"}"
  exit 0
fi

# All clear — server is running and healthy
echo '{}'
exit 0
