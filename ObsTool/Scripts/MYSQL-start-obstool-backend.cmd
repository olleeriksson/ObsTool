@echo off
setlocal

echo ----------------------------------------------------------------------
echo(
echo After the Backend is running, run the frontend  in another terminal:
echo(
echo   cd .\ObsTool\ObsToolClient
echo   npm run dev
echo(
echo Then open:
echo(
echo   http://localhost:3000/
echo(
echo ----------------------------------------------------------------------

set "ASPNETCORE_ENVIRONMENT=Development"
set "ASPNETCORE_URLS=http://127.0.0.1:50996"
set "Db__Provider=MySql"
set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;"
set "EnableAuthentication=false"

dotnet run --no-launch-profile --project "%~dp0..\ObsTool.csproj"

