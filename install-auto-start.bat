@echo off
title ConstructTrack - Auto-Start Setup
color 0B

echo ================================================================
echo       CONSTRUCTTRACK - WINDOWS AUTO-START CONFIGURATOR
echo ================================================================
echo.
echo [*] This will configure ConstructTrack to start automatically in the
echo     background whenever this Host PC boots up or logs in.
echo.

set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ConstructTrack.lnk"
set "TARGET_BAT=%~dp0start.bat"

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%TARGET_BAT%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.WindowStyle = 7; $Shortcut.Save()"

if %ERRORLEVEL% equ 0 (
    echo ================================================================
    echo [SUCCESS] ConstructTrack is now configured to Auto-Start on Boot!
    echo ================================================================
    echo.
    echo  Shortcut created in Windows Startup Folder:
    echo  "%SHORTCUT_PATH%"
    echo.
    echo  To remove auto-start anytime, simply delete that shortcut.
    echo ================================================================
) else (
    echo [!] Failed to create Windows Startup shortcut.
)

echo.
pause
