@echo off
setlocal

: This script starts a local MySQL database in a Docker container.
: The database is used to verify the MySQL database before deploying to hosting provider.
: Run this before running the backend with MYSQL-start-obstoll-backend.cmd.

docker start obstool-mysql >nul 2>nul
if %ERRORLEVEL% EQU 0 goto running

docker run --name obstool-mysql ^
  -e MYSQL_ROOT_PASSWORD=obstool_root_password ^
  -e MYSQL_DATABASE=obstool ^
  -e MYSQL_USER=obstool ^
  -e MYSQL_PASSWORD=obstool_dev_password ^
  -p 3306:3306 ^
  -d mysql:8.4
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

:running
echo Local MySQL is available at 127.0.0.1:3306 with database obstool.
echo User: obstool
echo Password: obstool_dev_password
