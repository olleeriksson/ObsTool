#=============================================
# Four environments:
#=============================================

- Local Dev SQLite                            - http://localhost:3000/obstool
- Local Prod: SQLite                          - http://localhost:5000/obstool
- Local MySQL via Docker (for testing MySQL)  - http://localhost:3000/obstool
- External Prod (MySQL) at SmarterASP.NET     - https://www.olle-eriksson.com/obstool


#=============================================
# Run Local Development
#=============================================

For development it seems the integrated solution in Visual Studio with dotnet publish doesn't run the frontend.
So you have to run the frontend manually with npm start, but the backend can be run from the Play button in Visual Studio.

Backend
---------------------
  Run:
    1. Run the project from Visual Studio in Debug mode.
    2. Development API routes are below http://localhost:50996/obstool/api/

Frontend
---------------------
  Run:
    1. cd <git root>\ObsTool\ObsToolClient
    2. npm start
    3. Open http://localhost:3000/obstool/

Super admins
---------------------
In appsettings.json, legacy but usable, and only superadmin:
  "AdminUser": {
    "Username": "admin",
    "HashedPassword": "..."    # is "admin"
  }


#=======================================================================
# To test MySQL locally
#=======================================================================

Run
---------------
<Start Docker Desktop>
Scripts\LOCAL-MYSQL-start-mysql-via-docker.cmd
Scripts\LOCAL-MYSQL-start-obstool-backend.cmd
Scripts\LOCAL-DEV-build-and-run-FE.cmd

Transfer data
---------------
  ./Scripts/LOCAL-MYSQL-sync-db.cmd                                                   (Updates all data)
  ./Scripts/LOCAL-MYSQL-sync-db.cmd --exclude-sac-data and --exclude-h2500-data       (Excludes the heavy tables)
  ./Scripts/LOCAL-MYSQL-sync-db.cmd --recreate-target-schema                          (Recreates the schema)



#=============================================
# Run Local Production
#=============================================

Run:
--------------------
   Run LOCAL-PROD-build-and-run-integrated.cmd     (will start both backend and frontend)

Super admins:
--------------------
  In LOCAL-PROD-build-and-run-integrated.cmd:
    set "Authentication__Users__0__Username=admin"
    set "Authentication__Users__0__HashedPassword=AQAAAAIAAYagAAAAECiTyk6FWkhb22kiREgy/FD4sv5phUmrXiNRWAYYl47K4bJnMjrx+EXVtgvJk8QSWw=="     # is "admin"
    set "Authentication__Users__1__Username=test"
    set "Authentication__Users__1__HashedPassword=AQAAAAIAAYagAAAAEAhi498U2xmW2gvkYChrI77klzS6xNoJQ1e5KiQubBaLd71GyzbqMT0mpsgFoBin7Q=="     # is "test"


#=======================================================
# Production Externally via GitHub to SmarterASP.NET
#=======================================================

Release
---------------------
  Just push a new commit on the 'release' branch to github and it will deploy it.

Transfer data
---------------
  ./Scripts/PROD-EXTERNAL-sync-db.cmd                                                   (Updates all data)
  ./Scripts/PROD-EXTERNAL-sync-db.cmd --exclude-sac-data and --exclude-h2500-data       (Excludes the heavy tables)
  ./Scripts/PROD-EXTERNAL-sync-db.cmd --recreate-target-schema                          (Recreates the schema)

Manage super admins
---------------------
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
    App__PublicBaseUrl=https://www.olle-eriksson.com/obstool
    MailService__SmtpPassword=<google-app-password-or-oauth-compatible-secret>

    App__PublicBaseUrl is optional if the host forwards the public Origin and /obstool path correctly,
    but setting it explicitly makes confirmation and password-reset email links deterministic.

    The other mail settings are non-secret and live in appsettings.json:
      MailService:MailTo
      MailService:MailFrom
      MailService:SenderName
      MailService:SmtpHost
      MailService:SmtpPort
      MailService:SmtpUsername
      MailService:SecureSocketOption

    To generate a hash:
      dotnet run --project .\ObsTool\ObsTool.csproj -- hash-password "your-password-here"

    On SmarterASP.NET: recycle/restart the app pool after changing environment variables:
      Control Panel V5 > Hosting Control Panel > Advance > Pool Manager > Actions > Restart






**************************************************************************************************************
**************************************************** OLD *****************************************************
**************************************************************************************************************


#=======================================================================
# production locally integrated in visual studio / via dotnet publish
# (NOT TESTED IN A WHILE)
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

  Local production reads .NET user-secrets for this project, even though the runtime environment is Production.
  Store local-only secrets there instead of appsettings.json:

    dotnet user-secrets set "MailService:SmtpPassword" "<google-app-password-without-spaces>" --project .\ObsTool\ObsTool.csproj
