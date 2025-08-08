#!/bin/bash

# Script to manually start VS Code Extension Development Host

echo "Compiling extension..."
npm run compile

echo "Starting Extension Development Host..."
EXT_PATH="$(cd "$(dirname "$0")/.."; pwd)"
code --extensionDevelopmentPath="$EXT_PATH" --new-window

echo "Extension Development Host started!"
echo "The extension will be loaded in a new VS Code window."
echo "Please verify that Port Monitor is displayed in the status bar."
