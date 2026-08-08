@echo off
setlocal
cd /d "%~dp0"

set "ASPNETCORE_ENVIRONMENT=Production"
set "ASPNETCORE_URLS=http://127.0.0.1:5000"
set "ASPNETCORE_PATHBASE=/obstool"
set "Db__Provider=Sqlite"
set "Db__ConnectionString=Data Source=%~dp0Data\obstool_database.db;"

echo.
echo ObsTool is available at:
echo http://127.0.0.1:5000/obstool/
echo.
echo Leave this window open while using ObsTool.
echo Press Ctrl+C to stop it.
echo.

ObsTool.exe
