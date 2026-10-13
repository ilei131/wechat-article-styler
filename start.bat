@echo off
chcp 65001 >nul
setlocal

set "PORT=5500"
cd /d "%~dp0"

echo ============================================
echo   公众号文章美化工具 - 本地启动
echo ============================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    echo 使用 Python 启动本地服务： http://localhost:%PORT%
    echo 按 Ctrl+C 可停止服务。
    echo.
    start "" "http://localhost:%PORT%"
    python -m http.server %PORT%
    goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo 使用 Python 启动本地服务： http://localhost:%PORT%
    echo 按 Ctrl+C 可停止服务。
    echo.
    start "" "http://localhost:%PORT%"
    py -m http.server %PORT%
    goto :end
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo 使用 Node.js 启动本地服务： http://localhost:%PORT%
    echo 按 Ctrl+C 可停止服务。
    echo.
    npx --yes serve . -l %PORT%
    goto :end
)

echo 未检测到 Python 或 Node.js，无法启动本地服务。
echo 请安装其中之一后重试：
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo 或直接双击打开 index.html 预览（剪贴板功能可能受限）。
pause

:end
endlocal
