@echo off
echo ############################################################
echo #          Deploying and running ObsToolClient API         #
echo ############################################################

cd C:\Users\Olle\source\repos\ObsToolApi\ObsTool
dotnet publish -c Release -r win10-x64
cd C:\Users\Olle\source\repos\ObsToolApi\ObsTool\bin\Release\netcoreapp2.0\win10-x64\
.\ObsTool.exe
