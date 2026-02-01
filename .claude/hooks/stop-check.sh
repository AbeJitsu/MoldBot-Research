#!/bin/bash
# Stop hook: verifies dev server is healthy. If not, builds and starts it.
# Returns {"decision": "block", "reason": "..."} to force continuation.
# Returns {} to allow stopping.

# Read stdin for hook input
INPUT=$(cat)

# Prevent infinite loops
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

  # Check: Is dev server responding with 200?
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    # Server healthy — do a TypeScript check only (no build, avoids corrupting .next)
    TS_OUTPUT=$(npx tsc --noEmit 2>&1)
    if [ $? -ne 0 ]; then
      REASONS="${REASONS}TypeScript errors found — fix before stopping. "
    fi
  else
    # Server not healthy — try build + start
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1

    BUILD_OUTPUT=$(npx next build 2>&1)
    if echo "$BUILD_OUTPUT" | grep -q "Compiled successfully"; then
      # Build OK — start dev server
      npm run dev > /dev/null 2>&1 &
      DEV_PID=$!

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
        kill $DEV_PID 2>/dev/null || true
        REASONS="${REASONS}Dev server failed to start — localhost:3000 not responding. "
      fi
    else
      REASONS="${REASONS}Build is failing — fix build errors. "
    fi
  fi
fi

if [ -n "$REASONS" ]; then
  ESCAPED=$(echo "$REASONS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"decision\": \"block\", \"reason\": \"Stop hook: ${ESCAPED}\"}"
  exit 0
fi

echo '{}'
exit 0
