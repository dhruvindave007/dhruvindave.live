#!/usr/bin/env bash
# Installs upstream skills into the checked-out repository. Use a terminal with Git access.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/.agents/skills"
mkdir -p "$DEST"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git clone -q --depth 1 --filter=blob:none --sparse https://github.com/Leonxlnx/taste-skill.git "$TMP/taste"
git -C "$TMP/taste" sparse-checkout set skills/taste-skill
cp -a "$TMP/taste/skills/taste-skill" "$DEST/design-taste-frontend"
cp "$TMP/taste/LICENSE" "$DEST/design-taste-frontend/LICENSE"
git clone -q --depth 1 --filter=blob:none --sparse https://github.com/emilkowalski/skills.git "$TMP/emil"
git -C "$TMP/emil" sparse-checkout set skills/emil-design-eng
cp -a "$TMP/emil/skills/emil-design-eng" "$DEST/emil-design-eng"
cp "$TMP/emil/LICENSE" "$DEST/emil-design-eng/LICENSE"
echo "Installed design-taste-frontend and emil-design-eng into $DEST"
