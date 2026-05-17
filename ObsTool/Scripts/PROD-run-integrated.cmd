@echo off
echo ############################################################
echo #                      Running ObsTool                     #
echo ############################################################

set "ASPNETCORE_ENVIRONMENT=Production"
set "ASPNETCORE_URLS=http://localhost:5000"
set "ASPNETCORE_PATHBASE=/obstool"

set "PUBLISH_DIR=%~dp0..\bin\Release\net10.0\publish"
if not exist "%PUBLISH_DIR%\ObsTool.exe" (
  echo Published app not found at "%PUBLISH_DIR%".
  echo Run PROD-build-and-run-integrated.cmd first.
  exit /b 1
)

pushd "%PUBLISH_DIR%"
echo.
echo ObsTool local production URL: http://localhost:5000/obstool/
.\ObsTool.exe
popd
