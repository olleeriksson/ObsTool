@echo off
echo ############################################################
echo #               Building and running ObsTool               #
echo ############################################################

set "ASPNETCORE_ENVIRONMENT=Production"
set "ASPNETCORE_URLS=http://localhost:5000"
set "ASPNETCORE_PATHBASE=/obstool"
set "VITE_API_URL=/obstool/api"
set "VITE_BASE_PATH=/obstool/"

REM In appsettings.json, legacy but usable, and only superadmin:
REM   "AdminUser": {
REM     "Username": "admin",
REM     "HashedPassword": "..."    # is "admin"
REM   }
REM 
REM Can be extended with admin:admin or test:test below
REM 
REM set "Authentication__Users__0__Username=admin"
REM set "Authentication__Users__0__HashedPassword=AQAAAAIAAYagAAAAECiTyk6FWkhb22kiREgy/FD4sv5phUmrXiNRWAYYl47K4bJnMjrx+EXVtgvJk8QSWw=="
REM set "Authentication__Users__1__Username=test"
REM set "Authentication__Users__1__HashedPassword=AQAAAAIAAYagAAAAEAhi498U2xmW2gvkYChrI77klzS6xNoJQ1e5KiQubBaLd71GyzbqMT0mpsgFoBin7Q=="

pushd "%~dp0.."
if exist "bin" rmdir /s /q "bin"
dotnet clean
dotnet publish --configuration Release -verbosity detailed
if errorlevel 1 (
  popd
  exit /b %errorlevel%
)

cd bin\Release\net10.0\publish
echo.
echo ObsTool local production URL: http://localhost:5000/obstool/
.\ObsTool.exe
popd
