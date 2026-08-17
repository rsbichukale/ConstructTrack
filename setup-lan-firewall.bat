@echo off
title ConstructTrack - LAN Firewall Configuration
color 0B

echo ================================================================
echo       CONSTRUCTTRACK - SITE LAN FIREWALL CONFIGURATOR
echo ================================================================
echo.

:: 1. Check for Administrator Privileges
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [*] Requesting Administrator Privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo [*] Administrator Privileges Confirmed.
echo [*] Configuring Windows Defender Firewall Rules for Ports 3000 & 5000...
echo.

:: 2. Remove any outdated duplicate rules
powershell -Command "Remove-NetFirewallRule -DisplayName 'ConstructTrack*' -ErrorAction SilentlyContinue" >nul 2>&1

:: 3. Create Inbound Rules (Port 3000: Frontend, Port 5000: Backend API)
echo [*] Adding Inbound Rules...
powershell -Command "New-NetFirewallRule -DisplayName 'ConstructTrack Frontend (Inbound)' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any" >nul
powershell -Command "New-NetFirewallRule -DisplayName 'ConstructTrack Backend API (Inbound)' -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any" >nul

:: 4. Create Outbound Rules (Port 3000: Frontend, Port 5000: Backend API)
echo [*] Adding Outbound Rules...
powershell -Command "New-NetFirewallRule -DisplayName 'ConstructTrack Frontend (Outbound)' -Direction Outbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any" >nul
powershell -Command "New-NetFirewallRule -DisplayName 'ConstructTrack Backend API (Outbound)' -Direction Outbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any" >nul

echo.
echo ================================================================
echo  ACTIVE CONSTRUCTTRACK FIREWALL RULES:
echo ================================================================
powershell -Command "Get-NetFirewallRule -DisplayName 'ConstructTrack*' | Select-Object DisplayName, Direction, Action, Enabled | Format-Table -AutoSize"

echo.
echo ================================================================
echo [SUCCESS] Firewall is now configured for Site LAN & Multi-PC access!
echo ================================================================
echo.
pause
