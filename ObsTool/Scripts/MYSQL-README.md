# Local MySQL Testing

Normal local ObsTool runs still use SQLite. Use MySQL locally only when testing the hosted database provider path.

Recommended Windows setup: Docker Desktop with the official `mysql:8.4` image. It is easier to start, stop, and remove than a machine-wide MySQL Server install. If you do not want Docker Desktop, install MySQL Community Server 8.4 LTS and create a database/user matching the connection string below.

Start local MySQL:

```bat
MYSQL-start-local-docker.cmd
```

Bootstrap the local MySQL schema and reference data from the development SQLite database:

```bat
dotnet build ..\..\ObsTool.sln
MYSQL-bootstrap-local.cmd
```

Run the backend against local MySQL:

```bat
MYSQL-start-obstool-backend.cmd
```

Then start the frontend separately from `ObsTool/ObsToolClient` with `npm run dev`.

The bootstrap command creates the schema if needed and imports only `Constellations`, `SacDeepSkyObjects`, and `H2500`. If one of those target tables already contains rows, that table is skipped. Add `--replace-reference-data` only when you intentionally want to delete and reload those reference tables.

Equivalent environment overrides:

```bat
set "ASPNETCORE_ENVIRONMENT=Development"
set "Db__Provider=MySql"
set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;AllowPublicKeyRetrieval=True;"
dotnet run --no-build --no-launch-profile --project ..\ObsTool.csproj -- db-bootstrap --source-sqlite "C:\Users\Olle\source\obstool_database_dev.db"
```

`AllowPublicKeyRetrieval=True` is only for this local Docker setup. It lets the MySQL 8 `caching_sha2_password` handshake work over the intentionally insecure local connection.

For SmarterASP.NET, use the same configuration shape but set the connection string to the hosted MySQL database. Also set `EnableAuthentication=true` on the hosted app. Keep local `appsettings.Production.json` on SQLite so local integrated production runs do not require MySQL.

Preferred secret storage order:

1. SmarterASP.NET runtime app settings/environment variables, if the control panel supports them.
2. A server-side `web.config` environment variable section generated during deploy from GitHub Secrets.
3. A manually uploaded server-only config file that is never committed.

GitHub Secrets alone are not runtime configuration; the running app cannot read them directly. They only help if the deployment workflow writes them into the published server configuration.

Hosted users can be configured without adding a users table:

```text
Authentication__Users__0__Username=olle
Authentication__Users__0__HashedPassword=<ASP.NET password hasher output>
Authentication__Users__1__Username=<another-user>
Authentication__Users__1__HashedPassword=<ASP.NET password hasher output>
```

Generate a password hash locally:

```bat
dotnet run --project ..\ObsTool.csproj -- hash-password "temporary-local-password"
```
