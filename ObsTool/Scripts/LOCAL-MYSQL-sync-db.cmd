@echo off
setlocal

: This script updates the local MySQL database with data from the Local Prod SQLite database.

set "ASPNETCORE_ENVIRONMENT=Development"
set "Db__Provider=MySql"
set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;AllowPublicKeyRetrieval=True;"
set "SOURCE_SQLITE=G:\My Drive\Docs\Astronomy\Observations\ObsTool\obstool_database.db"

dotnet run --no-build --no-launch-profile --project "%~dp0..\ObsTool.csproj" -- db-sync --source-sqlite "%SOURCE_SQLITE%" --update-general-tables --replace-user-data=1,2,3 %*
