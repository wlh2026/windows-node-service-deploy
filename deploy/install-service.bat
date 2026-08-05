@echo off
:: FourFu Workshop Management System - install as Windows service
:: (auto-start on boot, no console window, auto-restart on crash)
:: Target OS: Windows Server 2012 R2 or above
:: Requires: Node.js 22.x LTS (node:sqlite built-in, 22.5+)
:: Note: On first run it downloads NSSM automatically; if offline, place nssm.exe here manually.
::
:: Usage (run as Administrator in CMD):
::   cd /d C:\factory-app\deploy
::   install-service.bat
::   (or to keep a log: install-service.bat > install.log 2>&1)
::
:: On Server 2012 R2 newer Node does a platform check (requires Win10/Server2016+).
:: NODE_SKIP_PLATFORM_CHECK=1 is the official bypass so node:sqlite runs on R2.
setlocal EnableExtensions
set SVC=FourFuApp
set NSSM=%~dp0nssm.exe
set START_CMD=%~dp0start-node.cmd
set CMD_EXE=%SystemRoot%\System32\cmd.exe
set NODE_VER_FILE=%TEMP%\node_ver_%RANDOM%.txt

echo ============================================================
echo  FourFu Workshop System - install as Windows service
echo ============================================================

:: 1) Locate app root (parent of deploy dir)
pushd "%~dp0.." 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot resolve app directory.
  goto :end
)
set APP_DIR=%CD%
popd
echo [INFO] App directory : %APP_DIR%

:: 2) Find node.exe - first PATH, then common install locations
set NODE_EXE=
for /f "delims=" %%i in ('where node 2^>nul') do set NODE_EXE=%%i
if not defined NODE_EXE (
  echo [WARN] node.exe not in PATH, checking common locations ...
  if exist "C:\Program Files\nodejs\node.exe"        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
  if not defined NODE_EXE if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
  if not defined NODE_EXE if exist "C:\nodejs\node.exe"                    set "NODE_EXE=C:\nodejs\node.exe"
)
if not defined NODE_EXE (
  echo.
  echo [ERROR] node.exe not found.
  echo         Install Node.js 22.x LTS from https://nodejs.org
  echo         ^(important: on the custom setup screen, leave "Add to PATH" checked^).
  echo         Then open a NEW CMD window and run this script again.
  goto :end
)
echo [INFO] Node executable: %NODE_EXE%

:: 3) Check version via temp file (avoid for /f quoting issues with spaces in path)
"%NODE_EXE%" -v > "%NODE_VER_FILE%" 2>nul
if errorlevel 1 (
    echo [ERROR] Failed to run "%NODE_EXE%" -v.
    echo         Common fix: uninstall and reinstall Node 22 LTS, this time
    echo         check "Add to PATH" on the custom setup screen.
    del "%NODE_VER_FILE%" 2>nul
    goto :end
)
set /p VERSION_LINE= < "%NODE_VER_FILE%"
del "%NODE_VER_FILE%" 2>nul
set NMAJOR=0
set VL=%VERSION_LINE%
if "%VL:~0,1%"=="v" set VL=%VL:~1%
for /f "tokens=1 delims=." %%v in ("%VL%") do set /a NMAJOR=%%v 2>nul
if %NMAJOR% LSS 22 (
  echo [ERROR] Node version too low or unparseable: %VERSION_LINE%
  echo         Need Node 22.5+ ^(built-in node:sqlite^).
  echo         Uninstall the old version, then install Node 22 LTS.
  goto :end
)
echo [INFO] Node version OK ^(detected %VERSION_LINE%^)

:: 4) Get NSSM (download if missing)
if exist "%NSSM%" goto :nssm_ok
echo [INFO] NSSM not found, downloading ...
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%~dp0nssm.zip' -UseBasicParsing"
if errorlevel 1 (
  echo [ERROR] Download failed. Server may have no internet. Copy nssm.exe into this folder manually, then re-run.
  del "%~dp0nssm.zip" 2>nul
  goto :end
)
powershell -NoProfile -Command "Expand-Archive -Path '%~dp0nssm.zip' -DestinationPath '%~dp0nssm_tmp' -Force"
if exist "%~dp0nssm_tmp\nssm-2.24\win64\nssm.exe" copy /Y "%~dp0nssm_tmp\nssm-2.24\win64\nssm.exe" "%NSSM%" >nul
rd /s /q "%~dp0nssm_tmp" 2>nul
del "%~dp0nssm.zip" 2>nul
:nssm_ok
if not exist "%NSSM%" (
  echo [ERROR] NSSM not available. Copy nssm.exe into this folder manually, then re-run.
  goto :end
)
echo [INFO] NSSM ready: %NSSM%

:: 5) Generate start-node.cmd with absolute node.exe path (so service does not depend on PATH)
>  "%START_CMD%" echo @echo off
>> "%START_CMD%" echo setlocal
>> "%START_CMD%" echo set NODE_SKIP_PLATFORM_CHECK=1
>> "%START_CMD%" echo cd /d "%APP_DIR%"
>> "%START_CMD%" echo "%NODE_EXE%" --experimental-sqlite server.js
>> "%START_CMD%" echo endlocal
echo [INFO] Wrote %START_CMD%

:: 6) Register and start service
echo [INFO] Stopping/Removing old service %SVC% if any ...
"%NSSM%" stop %SVC% >nul 2>&1
"%NSSM%" remove %SVC% confirm >nul 2>&1

echo [INFO] Registering service %SVC% ...
"%NSSM%" install %SVC% "%CMD_EXE%"
if errorlevel 1 (
  echo [ERROR] nssm install failed. Make sure you are running as Administrator.
  goto :end
)
"%NSSM%" set %SVC% AppParameters /c "%START_CMD%"
"%NSSM%" set %SVC% AppDirectory "%APP_DIR%"
"%NSSM%" set %SVC% DisplayName "FourFu Workshop System"
"%NSSM%" set %SVC% Description "FourFu Workshop Management backend (Node.js + built-in node:sqlite)"
"%NSSM%" set %SVC% Start SERVICE_AUTO_START
"%NSSM%" set %SVC% AppExit Default Restart
"%NSSM%" set %SVC% AppRestartDelay 5000
"%NSSM%" set %SVC% AppStdout "%APP_DIR%\server.out.log"
"%NSSM%" set %SVC% AppStderr "%APP_DIR%\server.err.log"
"%NSSM%" set %SVC% AppRotateFiles 1
"%NSSM%" set %SVC% AppRotateBytes 1048576

echo [INFO] Starting service ...
"%NSSM%" start %SVC%
if errorlevel 1 (
  echo [ERROR] nssm start failed. Check %APP_DIR%\server.err.log
  goto :end
)

echo.
echo ============================================================
echo  Service %SVC% installed and started!
echo  Local access : http://localhost:8090
echo  LAN access   : http://^<SERVER_IP^>:8090
echo ============================================================
echo  Logs        : %APP_DIR%\server.out.log
echo                 %APP_DIR%\server.err.log
echo  Management  : nssm stop ^| start ^| edit ^| remove %SVC% confirm
echo ============================================================
echo.
echo  REMEMBER: run open-firewall.bat (as Admin) so LAN devices can connect.
:end
endlocal
pause
