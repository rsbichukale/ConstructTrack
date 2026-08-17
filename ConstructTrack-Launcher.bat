@echo off
title ConstructTrack - Local Site Network Hub & Desktop App
color 0b
cls

echo ================================================================
echo    CONSTRUCTTRACK - CONSTRUCTION SITE MANAGER
echo    Local Site Network Hub & Desktop Application Launcher
echo ================================================================
echo.
echo Starting local site server for host PC and all devices on site Wi-Fi...
echo.

cd /d "%~dp0"
node launch-site-server.js

pause
