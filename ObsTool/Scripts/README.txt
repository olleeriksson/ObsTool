

Usually what you do is build the frontend with npm run build and then deploy it with npm run deploy. But right now the
deploy command does nothing. Instead, everything is built using dotnet publish and the Visual Studio project file.


#=============================================
# Local Development
#=============================================

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



#=======================================================
# Production Externally via GitHub to SmarterASP.NET
#=======================================================

  Just push a new commit on the 'release' branch to github and it will deploy it.


  To set up users in external production:

    SmarterASP:
      Control Panel > Advance > Pool Manager > Actions > Environment Variables

    Those variables are set at the IIS application-pool level, so they’re available to ASP.NET Core apps running in that pool. They also document the web.config fallback under
    <aspNetCore><environmentVariables>...</environmentVariables>.

    For ObsTool, the clean hosted setup should be environment variables like:

    Db__Provider=MySql
    Db__ConnectionString=server=...;port=3306;database=...;user=...;password=...;
    EnableAuthentication=true
    Authentication__Users__0__Username=...
    Authentication__Users__0__HashedPassword=...

    To generate a hash:
      dotnet run --project .\ObsTool\ObsTool.csproj -- hash-password "your-password-here"

    On SmarterASP.NET: recycle/restart the app pool after changing environment variables:
      Control Panel V5 > Hosting Control Panel > Advance > Pool Manager > Actions > Restart



#=======================================================================
# To test External Production at SmarterASP.NET but with local MySQL
#=======================================================================

Scripts\MYSQL-start-local-docker.cmd
Scripts\MYSQL-start-obstool-backend.cmd
Scripts\DEV-build-and-run-FE.cmd


#=======================================================================
# production locally integrated in visual studio / via dotnet publish
#=======================================================================

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

