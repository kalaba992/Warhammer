#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="artifacts"
OUT_ZIP="$OUT_DIR/repo-docs.zip"

mkdir -p "$OUT_DIR"

# Repo-local documentation only (no external downloads).
# Excludes: node_modules, dist/build outputs, git metadata.
zip -r "$OUT_ZIP" \
  . \
  -i "*.md" "*.txt" "config/**" \
  -x "**/node_modules/**" "**/dist/**" "**/.git/**" "**/.turbo/**" "**/.vite/**" "**/coverage/**" "**/.DS_Store"

echo "Wrote $OUT_ZIP"