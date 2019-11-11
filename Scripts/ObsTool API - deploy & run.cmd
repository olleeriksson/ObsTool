@echo off
echo ############################################################
echo #          Deploying and running ObsToolClient API         #
echo ############################################################

cd C:\Users\Olle\source\repos\ObsTool\ObsTool
dotnet publish -c Release -r win10-x64
cd C:\Users\Olle\source\repos\ObsTool\ObsTool\bin\Release\netcoreapp3.0\win10-x64
.\ObsTool.exe
