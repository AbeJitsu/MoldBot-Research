#!/bin/bash
# Stop hook: checks if all tasks are complete before allowing Claude to stop.
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

# Check 1: Does the build pass?
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  if ! npm run build > /dev/null 2>&1; then
    REASONS="${REASONS}Build is failing — fix build errors. "
  fi
fi

# If there are reasons to block, return them
if [ -n "$REASONS" ]; then
  # Escape for JSON
  ESCAPED=$(echo "$REASONS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"decision\": \"block\", \"reason\": \"Stop hook: ${ESCAPED}\"}"
  exit 0
fi

# All clear — allow stopping
echo '{}'
exit 0
