#!/usr/bin/env bash
set -e

echo "==> Installing Python 3.12..."
uv python install 3.12

echo "==> Installing Transcrypt (Python 3.12)..."
uv tool install transcrypt --python 3.12 --force

echo "==> Installing Node dependencies..."
npm install
(cd scripts && npm install)
(cd web && npm install)

echo ""
echo "Setup complete. Run 'npm run next' to start the web dev server."
