@echo off
setlocal

set "ASPNETCORE_ENVIRONMENT=Development"
set "Db__Provider=MySql"
set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;"

dotnet run --no-build --no-launch-profile --project "%~dp0..\ObsTool.csproj" -- db-bootstrap --source-sqlite "C:\Users\Olle\source\obstool_database_dev.db"
