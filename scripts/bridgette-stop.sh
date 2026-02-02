#!/bin/bash
set -e

PLIST_DEST="$HOME/Library/LaunchAgents/com.bridgette.server.plist"

if [ ! -f "$PLIST_DEST" ]; then
    echo "❌ Bridgette service not installed."
    exit 1
fi

echo "⏹️  Stopping Bridgette..."
launchctl unload "$PLIST_DEST" 2>/dev/null || launchctl stop com.bridgette.server

sleep 1

if ! launchctl list | grep -q com.bridgette.server; then
    echo "✅ Bridgette stopped"
else
    echo "⚠️  Failed to stop service"
    exit 1
fi
