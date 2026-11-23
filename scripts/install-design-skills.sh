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
mkdir -p "$DEST/design-taste-frontend"
cp -a "$TMP/taste/skills/taste-skill/." "$DEST/design-taste-frontend/"
cp "$TMP/taste/LICENSE" "$DEST/design-taste-frontend/LICENSE"
git clone -q --depth 1 --filter=blob:none --sparse https://github.com/emilkowalski/skills.git "$TMP/emil"
git -C "$TMP/emil" sparse-checkout set skills/emil-design-eng skills/choreograph
for skill in emil-design-eng choreograph; do
  mkdir -p "$DEST/$skill"
  cp -a "$TMP/emil/skills/$skill/." "$DEST/$skill/"
  cp "$TMP/emil/LICENSE" "$DEST/$skill/LICENSE"
done
echo "Installed design-taste-frontend, emil-design-eng, and choreograph into $DEST"
