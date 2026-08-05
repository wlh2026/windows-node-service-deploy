@echo off
:: FourFu Workshop System - uninstall the Windows service (does not delete data)
setlocal
set SVC=FourFuApp
set NSSM=%~dp0nssm.exe
if not exist "%NSSM%" (
  echo [INFO] nssm.exe not in deploy folder. Will try sc.exe to delete the service.
  sc stop %SVC% >nul 2>&1
  sc delete %SVC% >nul 2>&1
  echo Service %SVC% removed (via sc.exe).
  goto :end
)
"%NSSM%" stop %SVC% 2>nul
"%NSSM%" remove %SVC% confirm
echo.
echo Service %SVC% uninstalled.
echo Data files (data.db, backups) are NOT deleted.
:end
endlocal
pause
