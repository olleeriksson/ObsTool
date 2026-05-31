@echo off
setlocal

: This script updates the local MySQL database with data from the Local Prod SQLite database.

set "ASPNETCORE_ENVIRONMENT=Development"
set "Db__Provider=MySql"
set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;AllowPublicKeyRetrieval=True;"
set "SOURCE_SQLITE=G:\My Drive\Docs\Astronomy\Observations\ObsTool\obstool_database.db"
set "SYNC_OUTPUT=%TEMP%\ObsTool-db-sync-%RANDOM%%RANDOM%"

dotnet build "%~dp0..\ObsTool.csproj" --configuration Release --output "%SYNC_OUTPUT%"
set "SYNC_EXIT=%ERRORLEVEL%"
if not "%SYNC_EXIT%"=="0" goto sync_done

dotnet "%SYNC_OUTPUT%\ObsTool.dll" db-sync --source-sqlite "%SOURCE_SQLITE%" --update-general-tables --replace-user-data=1,2,3 %*
set "SYNC_EXIT=%ERRORLEVEL%"

:sync_done
rmdir /s /q "%SYNC_OUTPUT%" >nul 2>nul
exit /b %SYNC_EXIT%
