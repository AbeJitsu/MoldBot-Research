#!/bin/bash
# ARCHIVED: This bridge script was used by OpenClaw to dispatch tasks to claude -p.
# Kept for reference. The native dashboard now uses node-pty to spawn claude directly.
#
# Usage: claude-bridge.sh <project-dir> <prompt>

PROJECT_DIR="$1"
shift
PROMPT="$*"

cd "$PROJECT_DIR" || exit 1

# Run claude -p and capture output directly
OUTPUT=$(claude -p "$PROMPT" --output-format json --allowedTools "Bash,Read,Edit,Write" 2>&1 < /dev/null)

# Extract just the result text from JSON
echo "$OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result','no result'))" 2>/dev/null || echo "$OUTPUT"
