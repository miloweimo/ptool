#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/android-env.sh"

APK="$ROOT/dist/android/ptool-debug.apk"
GRADLE_DEBUG="$ROOT/src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk"

build() {
  cd "$ROOT"
  pnpm run tauri:android:build:debug
  mkdir -p "$ROOT/dist/android"
  cp "$GRADLE_DEBUG" "$APK"
  echo "APK: $APK"
  ls -lh "$APK"
}

install_apk() {
  if [[ ! -f "$APK" ]]; then
    build
  fi
  adb install -r "$APK"
}

case "${1:-build}" in
  build) build ;;
  install) install_apk ;;
  *)
    echo "Usage: $0 [build|install]"
    exit 1
    ;;
esac
