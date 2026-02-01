#!/bin/bash
# SessionStart Hook: Sync shared memory + show git status
# What: Runs when session starts, resumes, or after compacting
# Why: Pull latest memory from git, show current branch context

# Sync shared memory repo
MEMORY_DIR="$HOME/claude-memory"
if [[ -d "$MEMORY_DIR/.git" ]]; then
  cd "$MEMORY_DIR" && git pull --rebase 2>/dev/null
  MEMORY_STATUS="synced"
else
  MEMORY_STATUS="not found"
fi

_GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [[ -z "$_GIT_ROOT" ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Memory: $MEMORY_STATUS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 0
fi

cd "$_GIT_ROOT"

BRANCH=$(git branch --show-current 2>/dev/null)
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# Task kanban summary
TASKS_FILE="$_GIT_ROOT/tasks.json"
KANBAN=""
if [[ -f "$TASKS_FILE" ]]; then
  PENDING=$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(sum(1 for t in d if t.get('status')=='pending'))" "$TASKS_FILE" 2>/dev/null || echo "?")
  IN_PROGRESS=$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(sum(1 for t in d if t.get('status')=='in_progress'))" "$TASKS_FILE" 2>/dev/null || echo "?")
  COMPLETED=$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(sum(1 for t in d if t.get('status')=='completed'))" "$TASKS_FILE" 2>/dev/null || echo "?")
  KANBAN="Kanban: ${PENDING} pending, ${IN_PROGRESS} in progress, ${COMPLETED} completed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Branch: $BRANCH"
if [[ "$UNCOMMITTED" -gt 0 ]]; then
  echo "Uncommitted changes: $UNCOMMITTED files"
fi
echo "Memory: $MEMORY_STATUS"
if [[ -n "$KANBAN" ]]; then
  echo "$KANBAN"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
