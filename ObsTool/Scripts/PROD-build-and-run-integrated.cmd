@echo off
echo ############################################################
echo #               Deploying and running ObsTool              #
echo ############################################################

cd C:\Users\Olle\source\repos\olleeriksson\ObsTool\ObsTool
rmdir /s /q "bin"
dotnet clean
dotnet publish --configuration Release -verbosity detailed
:: --self-contained :: /p:PublishSingleFile=true

REM Updated path from netcoreapp3.0 to net10.0 (post-upgrade)
cd C:\Users\Olle\source\repos\olleeriksson\ObsTool\ObsTool\bin\Release\net10.0\publish
.\ObsTool.exe
