@echo off
title ConstructTrack - Site Management System
color 0B

echo ================================================================
echo          CONSTRUCTTRACK - SITE MANAGEMENT SYSTEM
echo ================================================================
echo.
echo [*] Checking Node.js environment...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [!] ERROR: Node.js is not installed or not in PATH.
    echo [!] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

cd /d "%~dp0"

:: Detect Local IPv4 Address
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.0"') do (
    set "LOCAL_IP=%%a"
    goto :ip_found
)
:ip_found
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

echo [*] Starting Backend API (Port 5000) and Frontend App (Port 3000)...
echo.
echo ----------------------------------------------------------------
echo  CONNECTIVITY ACCESS URLS:
echo ----------------------------------------------------------------
echo  [This PC / Host]:        http://localhost:3000
echo  [Other PCs on LAN]:      http://%LOCAL_IP%:3000
echo  [Site Tablets / Wi-Fi]:  http://%LOCAL_IP%:3000
echo  [Backend REST API]:      http://%LOCAL_IP%:5000
echo ----------------------------------------------------------------
echo.
echo ================================================================
echo  Press Ctrl+C anytime to stop both servers
echo ================================================================
echo.

:: Open default browser after 3 seconds in the background
start /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Start both frontend and backend concurrently
npm run dev

pause
