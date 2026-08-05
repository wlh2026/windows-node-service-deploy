@echo off
:: Wrapper script for the FourFuApp Windows service.
::
:: install-service.bat regenerates this file with the absolute path of node.exe
:: and the absolute path of the app directory, so the service does NOT depend
:: on the system PATH.
::
:: This file is also safe to run manually: it will try PATH, then common
:: install dirs, then fall back to a bare "node" command.
setlocal
set NODE_SKIP_PLATFORM_CHECK=1
pushd "%~dp0.." 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot resolve app directory.
  exit /b 1
)
set APP_DIR=%CD%
popd
echo [INFO] App directory : %APP_DIR%
set NODE_EXE=
for /f "delims=" %%i in ('where node 2^>nul') do set NODE_EXE=%%i
if not defined NODE_EXE if exist "C:\Program Files\nodejs\node.exe"        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\nodejs\node.exe"                    set "NODE_EXE=C:\nodejs\node.exe"
if not defined NODE_EXE set NODE_EXE=node
echo [INFO] Node executable: %NODE_EXE%
"%NODE_EXE%" --experimental-sqlite "%APP_DIR%\server.js"
endlocal
