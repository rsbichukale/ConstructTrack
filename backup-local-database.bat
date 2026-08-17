@echo off
title ConstructTrack - Local Database Backup
color 0a

echo ================================================================
echo    CONSTRUCTTRACK - LOCAL DATABASE BACKUP UTILITY
echo ================================================================
echo.

set PGPASSWORD=Rutuja@987
set BACKUP_DIR=%~dp0database\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%

echo Creating backup of constructtrack_db to:
echo %BACKUP_DIR%\backup_%TIMESTAMP%.sql
echo.

"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h localhost -p 5432 -U postgres -d constructtrack_db -F p -f "%BACKUP_DIR%\backup_%TIMESTAMP%.sql" 2>nul
if %errorlevel% neq 0 (
  "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h localhost -p 5432 -U postgres -d constructtrack_db -F p -f "%BACKUP_DIR%\backup_%TIMESTAMP%.sql" 2>nul
)

echo.
echo ================================================================
echo   DATABASE BACKUP COMPLETE! Saved in database\backups\
echo ================================================================
echo.
pause
