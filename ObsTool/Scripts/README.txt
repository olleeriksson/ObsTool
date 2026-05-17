

Usually what you do is build the frontend with npm run build and then deploy it with npm run deploy. But right now the
deploy command does nothing. Instead, everything is built using dotnet publish and the Visual Studio project file.


====================================
|            DEVELOPMENT           |
====================================

For development it seems the integrated solution in Visual Studio with dotnet publish doesn't run the frontend.
So you have to run the frontend manually with npm start, but the backend can be run from the Play button in Visual Studio.

Frontend
---------------------
  Run:
    1. cd <git root>\ObsTool\ObsToolClient
    2. npm start

Backend
---------------------
  Run:
    1. Run the project from Visual Studio in Debug mode.

========================================================================
|  PRODUCTION LOCALLY INTEGRATED IN VISUAL STUDIO / VIA DOTNET PUBLISH |
========================================================================

Backend & Frontend together
----------------------------
  Build/publish:
    1. cd <git root>\ObsTool
    2. dotnet publish -c Release        (or Publish to a directory from Visual Studio)
  
  Run (BE & hosted FE together):
    1. cd <git root>\ObsTool\bin\Release\net10.0\publish
    2. set ASPNETCORE_URLS=http://localhost:5000
    3. set ASPNETCORE_PATHBASE=/obstool
    4. .\ObsTool.exe

  Local production URL:
    http://localhost:5000/obstool/

  The production React build uses /obstool/ for static assets and /obstool/api for API calls,
  matching the SmarterASP.NET subdirectory deployment target.

====================================
|      PRODUCTION EXTERNALLY       |
====================================

  Deploy to a server from Visual Studio's publish functionality.
  It does an automatic build and publish of the BE and FE.


=================================================
|  PRODUCTION LOCALLY WITH FE VIA NODE EXPRESS  |
=================================================

  Build backend (the commands in the .csproj file can be removed because building and shipping the FE together with BE is not needed):
    1. cd <git root>\ObsTool
    2. dotnet publish -c Release        (or Publish to a directory from Visual Studio)

  Build and run frontend:
    1. cd <git root>\ObsTool\ObsToolClient
    2. npm run build      # Builds the FE.
    2. npm run deploy     # To copy the files to the directory used by the webserver.
                          # This step calls batch file under ObsTool\ObsTool\ObsToolClient\scripts\deploy.cmd.
                          # This file would be modified in case I decide to stop building the FE with dotnet publish.
    3. cd ObsToolWebserver
    4. npm start

