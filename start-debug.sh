#!/bin/bash

# VS Code Extension Development Host を手動で起動するスクリプト

echo "Compiling extension..."
npm run compile

echo "Starting Extension Development Host..."
code --extensionDevelopmentPath=/Users/kurokawadaisuke/projects/vscode-port-monitor --new-window

echo "Extension Development Host started!"
echo "新しいVS Codeウィンドウで拡張機能がロードされます。"
echo "ステータスバーにPort Monitorが表示されることを確認してください。"
