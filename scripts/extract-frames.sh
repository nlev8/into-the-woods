#!/usr/bin/env bash
# Usage: scripts/extract-frames.sh path/to/journey.mp4 [frameCount] [width] [height]
set -euo pipefail
SRC="${1:?usage: extract-frames.sh <video> [frames] [w] [h]}"
N="${2:-180}"; W="${3:-1600}"; H="${4:-900}"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
FPS=$(python3 -c "print(${N}/${DUR})")

emit () { # dir width height
  local dir="$1" w="$2" h="$3"
  mkdir -p "$dir/frames"
  ffmpeg -y -i "$SRC" -vf "fps=${FPS},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}" \
    -vframes "$N" -c:v libwebp -q:v 80 "$dir/frames/%04d.webp"
  printf '{"frameCount":%d,"width":%d,"height":%d,"ext":"webp","fps":30}\n' "$N" "$w" "$h" > "$dir/manifest.json"
  echo "wrote $N frames -> $dir"
}

emit public/cottage "$W" "$H"
emit public/cottage/mobile "$((W/2))" "$((H/2))"
