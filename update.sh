#!/bin/bash
# Update script for vscode-port-monitor project

set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTRUCTION_FILE="$PROJECT_DIR/.html/instruction.html"

# Get latest version from package.json
VERSION=$(grep '"version"' "$PROJECT_DIR/package.json" 2>/dev/null | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/v\1/' | head -1)

# Update version in instruction.html if it exists
if [ -f "$INSTRUCTION_FILE" ] && [ -n "$VERSION" ]; then
    # Update version in version span
    sed -i.bak -E "s|<span class=\"version\">[^<]+</span>|<span class=\"version\">$VERSION</span>|g" "$INSTRUCTION_FILE"
    
    # Also update version in the title if it appears there
    sed -i.bak -E "s|(VSCode Port Monitor) v[0-9]+\.[0-9]+\.[0-9]+|\1 $VERSION|g" "$INSTRUCTION_FILE"
    
    # Clean up backup
    rm -f "$INSTRUCTION_FILE.bak"
    
    echo "Updated vscode-port-monitor to $VERSION"
else
    echo "Warning: Could not update version for vscode-port-monitor"
fi