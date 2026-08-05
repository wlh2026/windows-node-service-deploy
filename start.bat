@echo off
title 四福车间管理系统
cd /d "%~dp0"
set NODE_SKIP_PLATFORM_CHECK=1
where node >nul 2>nul
if %errorlevel%==0 (
  node --experimental-sqlite server.js
) else (
  echo [ERROR] Node.js not found in PATH.
  echo         Please install Node.js 22 LTS from https://nodejs.org/ and ensure it is added to PATH,
  echo         or use the deploy/ scripts which auto-detect common install locations.
  pause
  exit /b 1
)
pause
