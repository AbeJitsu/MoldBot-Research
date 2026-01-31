#!/bin/bash
# Install Bridgette launchd plists
# Run from the launchd/ directory

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCH_DIR="$HOME/Library/LaunchAgents"

for plist in "$SCRIPT_DIR"/com.bridgette.*.plist; do
  name=$(basename "$plist")
  echo "Installing $name..."
  ln -sf "$plist" "$LAUNCH_DIR/$name"
  launchctl load "$LAUNCH_DIR/$name" 2>/dev/null
done

echo ""
echo "Installed. Verify with:"
echo "  launchctl list | grep bridgette"
