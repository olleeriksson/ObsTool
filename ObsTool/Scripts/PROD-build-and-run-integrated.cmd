@echo off
echo ############################################################
echo #               Deploying and running ObsTool              #
echo ############################################################

cd C:\Users\Olle\source\repos\olleeriksson\ObsTool\ObsTool
dotnet publish -c Release 
:: --self-contained :: /p:PublishSingleFile=true

REM Updated path from netcoreapp3.0 to net10.0 (post-upgrade)
cd C:\Users\Olle\source\repos\olleeriksson\ObsTool\ObsTool\bin\Release\net10.0\publish
.\ObsTool.exe
