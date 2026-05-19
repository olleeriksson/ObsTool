@echo off
setlocal

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
set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;"
set "EnableAuthentication=true"
set "Authentication__Users__0__Username=test"
set "Authentication__Users__0__HashedPassword=AQAAAAIAAYagAAAAEAhi498U2xmW2gvkYChrI77klzS6xNoJQ1e5KiQubBaLd71GyzbqMT0mpsgFoBin7Q=="
set "Authentication__Users__1__Username=sagittarius"
set "Authentication__Users__1__HashedPassword=AQAAAAIAAYagAAAAEAy4Q/bH+H7URRHd6d51Nbg4PQGKAUqHu3ymMJc3s1UE+nTKUv8igrnHbJrctxSb0w=="
set "Authentication__Users__2__Username=leoträffen"
set "Authentication__Users__2__HashedPassword=AQAAAAIAAYagAAAAEGezACMMHXz1KgjNO76LqBz9zk7ad7YyrrHc1GzpoGVnnr7LPPBCDiYiCHO1jRF/+Q=="
set "Authentication__Users__3__Username=leotraffen"
set "Authentication__Users__3__HashedPassword=AQAAAAIAAYagAAAAEKAcuAgXZPVQCIgwZkFCP0uJHGMLXQ2LYZXdQL5sDB+smLEHGVeji99k6gaSkbqQHg=="

echo(
echo Login with username "test" and password "test" if authentication is enabled. See EnableAuthentication.
echo(
echo ----------------------------------------------------------------------

REM The hash AQAAAAIAAYagAAAAEAhi498U2xmW2gvkYChrI77klzS6xNoJQ1e5KiQubBaLd71GyzbqMT0mpsgFoBin7Q== corresponds to the password "test"
REM To generate hash:
REM   dotnet run --project .\ObsTool\ObsTool.csproj -- hash-password "test"

dotnet run --no-launch-profile --project "%~dp0..\ObsTool.csproj"

