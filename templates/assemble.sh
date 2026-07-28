#!/bin/bash
# Assembles a page from: <head fragment> + shared assets/head + <body fragment> + shared header/footer
set -e
BASE="/c/Users/paul/ishmar-halal-expo"
OUT="$1"
HEADFRAG="$2"
BODYFRAG="$3"

{
  echo '<!DOCTYPE html>'
  echo '<html lang="en">'
  echo '<head>'
  echo '<meta charset="UTF-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
  cat "$HEADFRAG"
  cat "$BASE/templates/partial-assets-head.html"
  echo '</head>'
  cat "$BASE/templates/partial-body-start.html"
  cat "$BASE/templates/partial-header.html"
  cat "$BODYFRAG"
  cat "$BASE/templates/partial-footer.html"
} > "$OUT"

echo "Built: $OUT"
