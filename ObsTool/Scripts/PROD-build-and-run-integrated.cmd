@echo off
echo ############################################################
echo #               Building and running ObsTool               #
echo ############################################################

set "ASPNETCORE_ENVIRONMENT=Production"
set "ASPNETCORE_URLS=http://localhost:5000"
set "ASPNETCORE_PATHBASE=/obstool"
set "VITE_API_URL=/obstool/api"
set "VITE_BASE_PATH=/obstool/"

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
