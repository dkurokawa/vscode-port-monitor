#!/bin/bash

# Post version script - run after npm version
# This script generates docs and creates VSIX package

echo "📝 Generating documentation..."
./scripts/generate-docs.sh

echo "📦 Building VSIX package..."
npm run package

echo "✅ Version release preparation complete!"
echo ""
echo "Next steps:"
echo "1. Review the generated files:"
echo "   - .html/instruction.html"
echo "   - vscode-port-monitor-*.vsix"
echo "2. Commit and push changes"
echo "3. Create GitHub release"
echo "4. Publish to VS Code Marketplace: npm run publish"