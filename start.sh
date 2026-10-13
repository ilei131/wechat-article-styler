#!/usr/bin/env bash
set -e

PORT=5500
cd "$(dirname "$0")"

echo "============================================"
echo "  公众号文章美化工具 - 本地启动"
echo "============================================"
echo

open_browser() {
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:$PORT"
  fi
}

if command -v python3 >/dev/null 2>&1; then
  echo "使用 Python 启动本地服务： http://localhost:$PORT"
  echo "按 Ctrl+C 可停止服务。"
  echo
  open_browser
  exec python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  echo "使用 Python 启动本地服务： http://localhost:$PORT"
  echo "按 Ctrl+C 可停止服务。"
  echo
  open_browser
  exec python -m http.server "$PORT"
elif command -v npx >/dev/null 2>&1; then
  echo "使用 Node.js 启动本地服务： http://localhost:$PORT"
  echo "按 Ctrl+C 可停止服务。"
  echo
  open_browser
  exec npx --yes serve . -l "$PORT"
else
  echo "未检测到 Python 或 Node.js，无法启动本地服务。"
  echo "请安装其中之一后重试："
  echo "  - Python: https://www.python.org/downloads/"
  echo "  - Node.js: https://nodejs.org/"
  echo
  echo "或直接在浏览器中打开 index.html 预览（剪贴板功能可能受限）。"
  exit 1
fi
