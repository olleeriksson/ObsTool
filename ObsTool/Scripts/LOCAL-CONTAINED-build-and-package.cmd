@echo off

cd C:\Users\Olle\source\repos\olleeriksson\ObsTool\ObsTool\

dotnet publish .\ObsTool.csproj --configuration Release --runtime win-x64 --self-contained true --output C:\tmp\ObsTool-portable /p:EnvironmentName=Production

copy scripts\Run-ObsTool.cmd C:\tmp\ObsTool-portable\Run-ObsTool.cmd

REM Package the portable build and copy the archive to Google Drive.
powershell.exe -NoProfile -Command "Compress-Archive -Path 'C:\tmp\ObsTool-portable' -DestinationPath 'C:\tmp\ObsTool-portable.zip' -Force"
copy /Y C:\tmp\ObsTool-portable.zip "G:\My Drive\Docs\Astronomy\Observations\ObsTool\ObsTool-portable.zip"

REM Keep the window open until the user presses a key.
pause
