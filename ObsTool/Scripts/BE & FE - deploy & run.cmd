@echo off
echo ############################################################
echo #               Deploying and running ObsTool              #
echo ############################################################

cd C:\Users\Olle\source\repos\ObsTool\ObsTool
dotnet publish -c Release 
:: --self-contained :: /p:PublishSingleFile=true

cd C:\Users\Olle\source\repos\ObsTool\ObsTool\bin\Release\netcoreapp3.0\publish
.\ObsTool.exe
