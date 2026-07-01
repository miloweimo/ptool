#!/usr/bin/env bash
# 把本机测试图写入 Waydroid（DCIM + Download，选图器/Gallery 更容易识别）
# 用法: ./scripts/waydroid-share.sh [sync|wake|open|status]
set -euo pipefail

HOST_DIR="${PTOOL_WAYDROID_SHARE_HOST:-$HOME/Pictures/ptool-test}"
DCIM_REMOTE="/sdcard/DCIM/Camera"
DOWNLOAD_REMOTE="/sdcard/Download/ptool-test"

wake_waydroid() {
  if waydroid status 2>/dev/null | grep -q "Container:.*FROZEN"; then
    echo "Waydroid 容器已冻结，正在唤醒..."
    waydroid show-full-ui >/dev/null 2>&1 &
    sleep 3
  fi
  if ! waydroid status 2>/dev/null | grep -q "Session:.*RUNNING"; then
    echo "启动 Waydroid session..."
    waydroid session start 2>/dev/null || true
    sleep 2
  fi
}

ensure_adb() {
  waydroid adb connect 2>/dev/null || true
  if ! adb devices 2>/dev/null | grep -q "device$"; then
    echo "adb 未连接。先执行: waydroid show-full-ui"
    adb devices
    exit 1
  fi
}

scan_file() {
  local remote="$1"
  adb shell "am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d 'file://$remote' 2>/dev/null" || true
}

sync_files() {
  wake_waydroid
  ensure_adb
  mkdir -p "$HOST_DIR"

  adb shell "mkdir -p '$DCIM_REMOTE' '$DOWNLOAD_REMOTE'" 2>/dev/null || true

  local count=0
  shopt -s nullglob
  for f in "$HOST_DIR"/*; do
    [[ -f "$f" ]] || continue
    [[ "$(basename "$f")" == ".gitkeep" ]] && continue
    local name
    name=$(basename "$f")
    adb push "$f" "$DCIM_REMOTE/$name"
    adb push "$f" "$DOWNLOAD_REMOTE/$name"
    scan_file "$DCIM_REMOTE/$name"
    echo "已写入: $name"
    count=$((count + 1))
  done
  shopt -u nullglob

  if [[ "$count" -eq 0 ]]; then
    echo "本机目录为空: $HOST_DIR"
    echo "示例: cp ~/Pictures/*.jpg $HOST_DIR/"
    exit 1
  fi

  echo ""
  echo "共 $count 张图已写入 Waydroid:"
  echo "  - 相册/Gallery: DCIM/Camera"
  echo "  - 文件/选图器: Download/ptool-test"
  adb shell "ls '$DCIM_REMOTE'" 2>/dev/null | head -8
}

open_gallery() {
  wake_waydroid
  sync_files
  waydroid app launch com.android.gallery3d 2>/dev/null \
    || waydroid app launch com.android.documentsui 2>/dev/null \
    || waydroid show-full-ui >/dev/null 2>&1 &
  if waydroid app list 2>/dev/null | grep -q "com.weimo.ptool"; then
    echo ""
    echo "启动 ptool..."
    waydroid app launch com.weimo.ptool 2>/dev/null || true
    echo "选图路径: Download/ptool-test 或 DCIM/Camera"
  fi
}

status_share() {
  wake_waydroid
  waydroid status 2>/dev/null || true
  echo ""
  echo "本机: $HOST_DIR"
  if ensure_adb 2>/dev/null; then
    echo ""
    echo "DCIM/Camera:"
    adb shell "ls -la '$DCIM_REMOTE'" 2>/dev/null | head -8 || echo "(空)"
    echo ""
    echo "Download/ptool-test:"
    adb shell "ls -la '$DOWNLOAD_REMOTE'" 2>/dev/null | head -8 || echo "(空)"
  fi
}

case "${1:-sync}" in
  sync|push) sync_files ;;
  wake) wake_waydroid; waydroid show-full-ui & ;;
  open) open_gallery ;;
  status) status_share ;;
  mount|umount|unmount)
    echo "bind mount 在 Waydroid 里经常不可见，请用: $0 sync"
    exit 1
    ;;
  *)
    echo "用法: $0 [sync|wake|open|status]"
    exit 1
    ;;
esac
