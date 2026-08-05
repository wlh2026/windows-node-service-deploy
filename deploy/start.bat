@echo off
:: FourFu Workshop System - launch in foreground (debug only; close window to stop)
:: Requires: Node.js 22.x LTS, server.js in app root
setlocal
set NODE_SKIP_PLATFORM_CHECK=1
pushd "%~dp0.." 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot resolve app directory.
  pause
  exit /b 1
)
set APP_DIR=%CD%
popd
echo ============================================================
echo  FourFu Workshop System - foreground mode
echo  App dir : %APP_DIR%
echo  Press Ctrl+C to stop
echo ============================================================

set NODE_EXE=
for /f "delims=" %%i in ('where node 2^>nul') do set NODE_EXE=%%i
if not defined NODE_EXE if exist "C:\Program Files\nodejs\node.exe"        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\nodejs\node.exe"                    set "NODE_EXE=C:\nodejs\node.exe"
if not defined NODE_EXE set NODE_EXE=node
echo [INFO] Node: %NODE_EXE%

"%NODE_EXE%" --experimental-sqlite "%APP_DIR%\server.js"
set RC=%ERRORLEVEL%
echo.
echo [INFO] node exited with code %RC%
endlocal
pause
