#!/usr/bin/env bash
# 调试 ptool Android / Waydroid 日志
set -euo pipefail

waydroid adb connect 2>/dev/null || true

echo "监听 ptool / WebView / Tauri 相关日志 (Ctrl+C 退出)..."
echo "提示: 在 app 里点「保存」后看这里的报错"
echo ""

adb logcat -c 2>/dev/null || true
adb logcat -v brief \
  chromium:I RustWebView:I Tauri:I ptool:I AndroidRuntime:E \
  | rg -i "ptool|tauri|chromium|webview|fs|dialog|permission|error|panic|save|write"
