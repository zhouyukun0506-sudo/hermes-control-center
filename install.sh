#!/bin/bash
set -e

REPO="https://github.com/zhouyukun0506-sudo/hermes-control-center.git"
INSTALL_DIR="$HOME/.hermes-control"

echo "⏳ Cloning Workbench with Hermes Agent..."
if [ -d "$INSTALL_DIR" ]; then
  echo "   Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --ff-only
else
  git clone "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "⏳ Installing dependencies..."
npm install

echo "⏳ Building frontend..."
npm run build

echo ""
echo "✅ Installed to $INSTALL_DIR"
echo ""
echo "   Start the app:"
echo "     cd $INSTALL_DIR && npm run electron"
echo ""
echo "   Or run in browser:"
echo "     cd $INSTALL_DIR && npm run dev"
echo ""
