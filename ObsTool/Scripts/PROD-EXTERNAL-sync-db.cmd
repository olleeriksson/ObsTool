@echo off
setlocal

REM This script updates the external SmarterASP.NET MySQL database with data
REM from the Local Prod SQLite database.
REM
REM Replace the SMARTERASP_* values below before running this script.
REM Keep --recreate-target-schema as an explicit command-line argument so a
REM normal run cannot accidentally drop the hosted database schema.

set "ASPNETCORE_ENVIRONMENT=Production"
set "Db__Provider=MySql"

set "SMARTERASP_HOST=YOUR_SMARTERASP_MYSQL_HOST"
set "SMARTERASP_PORT=3306"
set "SMARTERASP_DATABASE=YOUR_SMARTERASP_DATABASE"
set "SMARTERASP_USER=YOUR_SMARTERASP_USER"
set "SMARTERASP_PASSWORD=YOUR_SMARTERASP_PASSWORD"

set "Db__ConnectionString=server=%SMARTERASP_HOST%;port=%SMARTERASP_PORT%;database=%SMARTERASP_DATABASE%;user=%SMARTERASP_USER%;password=%SMARTERASP_PASSWORD%;SslMode=Required;"

set "SOURCE_SQLITE=G:\My Drive\Docs\Astronomy\Observations\ObsTool\obstool_database.db"

dotnet run --no-build --no-launch-profile --project "%~dp0..\ObsTool.csproj" -- db-sync --source-sqlite "%SOURCE_SQLITE%" --update-general-tables --replace-user-data=1,2,3 %*
