#!/usr/bin/env bash
# 统一 Android 构建入口，确保使用 JDK 17（系统默认 Java 26 会导致 Gradle buildSrc 失败）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/android-env.sh"

if [[ ! -d "$JAVA_HOME" ]]; then
  echo "错误: 未找到 JDK 17，请安装: sudo pacman -S jdk17-openjdk"
  exit 1
fi

cd "$ROOT"
exec pnpm tauri android "$@"
