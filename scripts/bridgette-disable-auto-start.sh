#!/bin/bash
set -e

PLIST_DEST="$HOME/Library/LaunchAgents/com.bridgette.server.plist"

if [ ! -f "$PLIST_DEST" ]; then
    echo "❌ Bridgette service not installed."
    exit 1
fi

echo "⏸️  Disabling auto-start..."

# Unload the service (stops it and prevents auto-start)
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Remove the plist to fully disable
rm "$PLIST_DEST"

echo "✅ Auto-start disabled"
echo ""
echo "Bridgette will no longer start automatically on login."
echo "To start manually: ./scripts/bridgette-start.sh"
echo "To re-enable auto-start: ./scripts/bridgette-install.sh"
