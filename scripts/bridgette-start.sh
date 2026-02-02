#!/bin/bash
set -e

PLIST_DEST="$HOME/Library/LaunchAgents/com.bridgette.server.plist"

if [ ! -f "$PLIST_DEST" ]; then
    echo "❌ Bridgette service not installed. Run ./scripts/bridgette-install.sh first."
    exit 1
fi

echo "🚀 Starting Bridgette..."
launchctl load "$PLIST_DEST" 2>/dev/null || launchctl start com.bridgette.server

sleep 2

if launchctl list | grep -q com.bridgette.server; then
    echo "✅ Bridgette is running at http://localhost:3000"
else
    echo "⚠️  Failed to start. Check logs at ~/Library/Logs/Bridgette/"
    exit 1
fi
