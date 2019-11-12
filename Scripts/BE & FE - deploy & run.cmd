@echo off
echo ############################################################
echo #          Deploying and running ObsToolClient API         #
echo ############################################################

cd C:\Users\Olle\source\repos\ObsTool\ObsTool
dotnet publish -c Release

cd C:\Users\Olle\source\repos\ObsTool\ObsTool\bin\Release\netcoreapp3.0\publish
.\ObsTool.exe
