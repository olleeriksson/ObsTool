rmdir /s /q ..\..\..\ObsToolWebserver\build 
xcopy /ievy build ..\..\..\ObsToolWebserver\build

:: Disable the lines above and enable the lines below to change so that frontend deployment is taken care
:: of by running "npm run deploy" instead of through dotnet publish and special commands in the .csproj file.
:: This would make the deployment to a remote system dependent on manually deploying the frontend first into
:: a directory from which the backend would then deploy from.

:: rmdir /s /q ..\wwwroot
:: xcopy /ievy build ..\wwwroot
