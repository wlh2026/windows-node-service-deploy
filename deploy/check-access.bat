@echo off
:: FourFu Workshop System - LAN access diagnostic + auto firewall fix
:: Run as Administrator in CMD.
setlocal
set PORT=8090
set SVC=FourFuApp
set RULE=FourFu-TCP-8090

echo ============================================================
echo  FourFu LAN Access Diagnostic
echo ============================================================

echo.
echo [1/4] Service status:
sc query %SVC% | findstr /I "STATE"
if errorlevel 1 (
  echo       [WARN] Service %SVC% NOT FOUND. Run install-service.bat first.
) else (
  for /f "tokens=3" %%s in ('sc query %SVC% ^| findstr /I "STATE"') do echo       state=%%s
)

echo.
echo [2/4] Who is listening on port %PORT%:
netstat -ano | findstr /R ":%PORT% .*LISTEN"
if errorlevel 1 (
  echo       [WARN] Nothing is listening on %PORT%. Service may not be running.
) else (
  echo       (0.0.0.0:%PORT% means reachable from LAN; 127.0.0.1:%PORT% means LOCAL ONLY)
)

echo.
echo [3/4] Firewall rule:
netsh advfirewall firewall show rule name=%RULE% >nul 2>&1
if errorlevel 1 (
  echo       [WARN] Firewall rule %RULE% missing. Adding it now...
  netsh advfirewall firewall add rule name=%RULE% dir=in action=allow protocol=TCP localport=%PORT%
  if errorlevel 1 (
    echo       [ERROR] Failed to add rule. Run this file as Administrator.
  ) else (
    echo       [OK] Firewall rule %RULE% added.
  )
) else (
  echo       [OK] Firewall rule %RULE% exists (TCP %PORT% inbound allowed).
)

echo.
echo [4/4] Server IPv4 addresses (use these for LAN access):
ipconfig | findstr /R "IPv4"

echo.
echo ============================================================
echo  How to test from a remote PC:
echo    ping ^<one of the IPv4 above^>
echo    telnet ^<IPv4^> %PORT%
echo  If ping works but telnet fails, a network device (router/switch)
echo  or company ACL is blocking port %PORT%. Contact your network admin.
echo ============================================================

:end
endlocal
pause
