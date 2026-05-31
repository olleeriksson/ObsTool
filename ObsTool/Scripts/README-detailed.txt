MySQL Sync And Maintenance
==========================

Normal local ObsTool runs still use SQLite. Use MySQL locally only when testing
the hosted database provider path or when maintaining the hosted MySQL database.

The db-sync command reads from a local SQLite database and writes to the
target database configured through Db:Provider and Db:ConnectionString. For
MySQL targets, set Db:Provider=MySql and point Db:ConnectionString at either the
local Docker MySQL database or the SmarterASP.NET MySQL database.

Schema behavior
---------------

db-sync uses EF Core EnsureCreated to create the target schema from the
current MainDbContext model. It does not translate the SQLite schema into MySQL
DDL and it does not use EF migrations.

EnsureCreated only creates tables when the target database has no tables. When
the target schema must be deliberately rebuilt, add:

    --recreate-target-schema

This is destructive. It drops all existing target tables before EF Core
recreates the schema. The command prints a warning and requires this exact
confirmation text:

    RECREATE TARGET SCHEMA

Only for deliberate non-interactive maintenance, add:

    --confirm-recreate-target-schema

Operations
----------

Choose one or both of these operations:

    --update-general-tables
    --exclude-sac-data
    --exclude-h2500-data
    --replace-user-data=1
    --replace-user-data=2
    --replace-user-data=3
    --replace-user-data=1,2,3

--update-general-tables
-----------------------

--update-general-tables updates the shared read-only catalog tables from the
source SQLite database:

    Constellations
    SacDeepSkyObjects
    OtherObjects
    H2500

It upserts by stable primary key:

    Constellations.Id
    SacDeepSkyObjects.Id
    OtherObjects.Id
    H2500.HerschelId

For each source row, the command inserts the row if it is missing in MySQL, or
updates all non-key columns if the row already exists. It does not delete MySQL
rows that are missing from the source SQLite database.

This operation is intended to be safe after multiple users exist because it does
not touch user-owned observation data.

For routine sync runs, add these optional flags to skip large catalog table data:

    --exclude-sac-data
    --exclude-h2500-data

The exclude flags only apply to normal --update-general-tables runs. They are
ignored when --recreate-target-schema is supplied, because a recreated target
schema needs the full reference data set to satisfy foreign-key relationships.

--replace-user-data={userid}
----------------------------

--replace-user-data={userid} replaces user-owned data for one allowlisted
database user, or for multiple allowlisted users when passed as a comma-separated list:

    Users.Id = 1
    Users.Id = 2
    Users.Id = 3

The user id value is required. The bare --replace-user-data flag is invalid.
Comma-separated values may only contain 1, 2, and/or 3, so another user's data
cannot be replaced accidentally.

The operation validates that every selected Users.Id exists in the source
SQLite database. If a selected user does not exist in the target MySQL database,
it inserts that single Users row. If the target user already exists, the account
row is left unchanged.

Then, for each selected UserId, it deletes and reimports only rows owned by that
user from these tables:

    ObsResources
    DsoObservations linked through selected-user Observations
    DsoExtra
    Observations
    ObsSessions
    Eyepieces
    Instruments
    Locations

It does not delete or update any other user's rows.

Typical local MySQL flow
------------------------

Start local MySQL:

    ./LOCAL-MYSQL-start-mysql-via-docker.cmd

Build the app:

    dotnet build ..\..\ObsTool.sln

For a clean local MySQL rebuild from the local production SQLite database:

    ./LOCAL-MYSQL-sync-db.cmd --recreate-target-schema

The helper script runs both operations:

    --update-general-tables --replace-user-data=1,2,3

Equivalent local MySQL environment overrides:

    set "ASPNETCORE_ENVIRONMENT=Development"
    set "Db__Provider=MySql"
    set "Db__ConnectionString=server=127.0.0.1;port=3306;database=obstool;user=obstool;password=obstool_dev_password;SslMode=Disabled;AllowPublicKeyRetrieval=True;"
    dotnet run --no-build --no-launch-profile --project ..\ObsTool.csproj -- db-sync --source-sqlite "G:\My Drive\Docs\Astronomy\Observations\ObsTool\obstool_database.db" --update-general-tables --replace-user-data=1,2,3

AllowPublicKeyRetrieval=True is only for this local Docker setup. It lets the MySQL 8
caching_sha2_password handshake work over the intentionally insecure local connection.

SmarterASP.NET MySQL flow
-------------------------

Run PROD-EXTERNAL-sync-db.cmd locally, after filling in the SmarterASP.NET MySQL
connection-string values inside that script.

    ./PROD-EXTERNAL-sync-db.cmd

For a deliberate hosted schema rebuild, add:

    ./PROD-EXTERNAL-sync-db.cmd --recreate-target-schema

Do not add --confirm-recreate-target-schema for the hosted database unless the
run is intentionally scripted and you have already verified the target
connection string.

Runtime configuration
---------------------

Generate a password hash locally:

    dotnet run --project ..\ObsTool.csproj -- hash-password "temporary-local-password"
