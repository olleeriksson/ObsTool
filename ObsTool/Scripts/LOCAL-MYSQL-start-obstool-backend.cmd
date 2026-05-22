@echo off
setlocal

: This script starts the backend configured to connect to the local MySQL database.

echo ----------------------------------------------------------------------
echo(
echo After the Backend is running, run the frontend  in another terminal:
echo   cd .\ObsTool\ObsToolClient
echo   npm run dev
echo(
echo Then open:
echo   http://localhost:3000/

set "ASPNETCORE_ENVIRONMENT=Development"
set "ASPNETCORE_URLS=http://127.0.0.1:50996"
set "Db__Provider=MySql"
set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;AllowPublicKeyRetrieval=True;"
set "EnableAuthentication=true"
set "Authentication__Users__0__Username=admin"
set "Authentication__Users__0__HashedPassword=AQAAAAIAAYagAAAAECiTyk6FWkhb22kiREgy/FD4sv5phUmrXiNRWAYYl47K4bJnMjrx+EXVtgvJk8QSWw=="
set "Authentication__Users__1__Username=test"
set "Authentication__Users__1__HashedPassword=AQAAAAIAAYagAAAAEAhi498U2xmW2gvkYChrI77klzS6xNoJQ1e5KiQubBaLd71GyzbqMT0mpsgFoBin7Q=="

echo(
echo Login with username "test" and password "test" if authentication is enabled. See EnableAuthentication.
echo(
echo ----------------------------------------------------------------------

REM The hash AQAAAAIAAYagAAAAEAhi498U2xmW2gvkYChrI77klzS6xNoJQ1e5KiQubBaLd71GyzbqMT0mpsgFoBin7Q== corresponds to the password "test"
REM To generate hash:
REM   dotnet run --project .\ObsTool\ObsTool.csproj -- hash-password "test"

dotnet run --no-launch-profile --project "%~dp0..\ObsTool.csproj"

