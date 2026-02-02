#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting Bridgette..."

# Stop the service
"$SCRIPT_DIR/bridgette-stop.sh"

# Wait a moment
sleep 1

# Start the service
"$SCRIPT_DIR/bridgette-start.sh"

echo "✅ Bridgette restarted"
