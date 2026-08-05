@echo off
:: FourFu Workshop System - open Windows firewall for port 8090 (LAN access)
:: Run as Administrator.
netsh advfirewall firewall delete rule name="FourFu-TCP-8090" >nul 2>&1
netsh advfirewall firewall add rule name="FourFu-TCP-8090" dir=in action=allow protocol=TCP localport=8090
if errorlevel 1 (
  echo [ERROR] Failed to add firewall rule. Right-click this file and choose "Run as administrator".
  goto :end
)
echo ============================================================
echo  Firewall rule added: TCP 8090 (inbound)
echo  LAN devices can now reach http://^<SERVER_IP^>:8090
echo ============================================================
echo.
echo  Find your server IP:
ipconfig | findstr /R "IPv4"
:end
pause
