#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/android-env.sh"

APK="$ROOT/dist/android/ptool-debug.apk"
WAYDROID_APK="$ROOT/dist/android/ptool-debug-waydroid.apk"
GRADLE_DEBUG="$ROOT/src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk"

build() {
  local target="${1:-aarch64}"
  local out="$APK"
  if [[ "$target" == "x86_64" ]]; then
    out="$WAYDROID_APK"
  fi
  cd "$ROOT"
  pnpm tauri android build --apk --debug --target "$target"
  mkdir -p "$ROOT/dist/android"
  cp "$GRADLE_DEBUG" "$out"
  echo "APK: $out"
  ls -lh "$out"
}

install_apk() {
  local apk="${1:-$APK}"
  if [[ ! -f "$apk" ]]; then
    if [[ "$apk" == "$WAYDROID_APK" ]]; then
      build x86_64
    else
      build aarch64
    fi
  fi
  adb install -r "$apk"
}

install_waydroid() {
  build x86_64
  waydroid adb connect 2>/dev/null || true
  if adb devices 2>/dev/null | grep -q "device$"; then
    adb install -r "$WAYDROID_APK"
  else
    waydroid app install "$WAYDROID_APK"
  fi
  waydroid app launch com.weimo.ptool
}

case "${1:-build}" in
  build) build "${2:-aarch64}" ;;
  install) install_apk ;;
  waydroid) install_waydroid ;;
  *)
    echo "Usage: $0 [build [aarch64|x86_64]|install|waydroid]"
    exit 1
    ;;
esac
