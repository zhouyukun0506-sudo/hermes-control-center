#!/bin/bash
set -e

echo ""
echo "  Workbench with Hermes Agent — Installer"
echo "  ========================================"
echo ""

# Check Git
if ! command -v git &> /dev/null; then
  echo "  [!] Git is not installed." >&2
  echo ""
  echo "  Install Git first:" >&2
  echo "    macOS:  xcode-select --install" >&2
  echo "    Ubuntu: sudo apt install git" >&2
  echo "    Fedora: sudo dnf install git" >&2
  exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "  [!] Node.js is not installed." >&2
  echo ""
  echo "  Install Node.js first:" >&2
  echo "    macOS:  brew install node" >&2
  echo "    Ubuntu: sudo apt install nodejs npm" >&2
  echo "    or download from: https://nodejs.org" >&2
  exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
  echo "  [!] npm is not installed (usually comes with Node.js)." >&2
  exit 1
fi

echo "  Git: $(git --version)"
echo "  Node: $(node --version)"
echo ""

REPO="https://github.com/zhouyukun0506-sudo/hermes-control-center.git"
INSTALL_DIR="$HOME/.hermes-control"

echo "  Cloning Workbench with Hermes Agent..."
if [ -d "$INSTALL_DIR" ]; then
  echo "  Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --ff-only
else
  git clone "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "  Installing dependencies..."
npm install

echo "  Building frontend..."
npm run build

echo ""
echo "  Done! Installed to $INSTALL_DIR"
echo ""
echo "  Start the desktop app:"
echo "    cd $INSTALL_DIR && npm run electron"
echo ""
echo "  Or run in browser:"
echo "    cd $INSTALL_DIR && npm run dev"
echo ""
