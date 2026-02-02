#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLIST_SOURCE="$PROJECT_ROOT/launchd/com.bridgette.server.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.bridgette.server.plist"
LOG_DIR="$HOME/Library/Logs/Bridgette"

echo "🚀 Installing Bridgette background service..."

# Create log directory
mkdir -p "$LOG_DIR"
echo "✓ Created log directory: $LOG_DIR"

# Copy plist to LaunchAgents
cp "$PLIST_SOURCE" "$PLIST_DEST"
echo "✓ Installed service configuration"

# Load the service
launchctl load "$PLIST_DEST" 2>/dev/null || true
echo "✓ Service loaded"

# Wait a moment for service to start
sleep 2

# Check if service is running
if launchctl list | grep -q com.bridgette.server; then
    echo "✅ Bridgette is now running in the background!"
    echo ""
    echo "   • Server available at: http://localhost:3000"
    echo "   • Logs: $LOG_DIR/server.log"
    echo "   • Errors: $LOG_DIR/server-error.log"
    echo ""
    echo "To manage the service:"
    echo "   ./scripts/bridgette-stop.sh       - Stop the service"
    echo "   ./scripts/bridgette-start.sh      - Start the service"
    echo "   ./scripts/bridgette-restart.sh    - Restart the service"
    echo "   ./scripts/bridgette-disable-auto-start.sh - Disable auto-start"
else
    echo "⚠️  Service installed but not running. Check logs at $LOG_DIR"
    exit 1
fi
