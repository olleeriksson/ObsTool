-- Adds database-user ownership to the protected SQLite database.
--
-- Intended owner for existing data: Users.Id = 1.
-- Run this only on a backup/copy first, then run verify-sqlite-user-ownership.py.
--
-- This script intentionally keeps the original tables as *_old_user_migration.
-- Drop those old tables manually only after verification has passed.

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

ALTER TABLE "Locations" RENAME TO "Locations_old_user_migration";
ALTER TABLE "Instruments" RENAME TO "Instruments_old_user_migration";
ALTER TABLE "Eyepieces" RENAME TO "Eyepieces_old_user_migration";
ALTER TABLE "ObsSessions" RENAME TO "ObsSessions_old_user_migration";
ALTER TABLE "Observations" RENAME TO "Observations_old_user_migration";
ALTER TABLE "DsoExtra" RENAME TO "DsoExtra_old_user_migration";
ALTER TABLE "ObsResources" RENAME TO "ObsResources_old_user_migration";
ALTER TABLE "DsoObservations" RENAME TO "DsoObservations_old_user_migration";

CREATE TABLE "Locations" (
    "Id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "GoogleMapsAddress" ntext NOT NULL,
    "Latitude" nvarchar(250) NOT NULL COLLATE NOCASE,
    "Longitude" nvarchar(250) NOT NULL COLLATE NOCASE,
    "Name" nvarchar(250) NOT NULL COLLATE NOCASE,
    CONSTRAINT "FK_Locations_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "AK_Locations_Id_UserId" ON "Locations" ("Id", "UserId");
CREATE INDEX "IX_Locations_UserId" ON "Locations" ("UserId");

INSERT INTO "Locations" ("Id", "UserId", "GoogleMapsAddress", "Latitude", "Longitude", "Name")
SELECT "Id", 1, "GoogleMapsAddress", "Latitude", "Longitude", "Name"
FROM "Locations_old_user_migration";

CREATE TABLE "Instruments" (
    "Id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Key" nvarchar(50) NOT NULL,
    "Name" nvarchar(200) NOT NULL,
    "DiameterMm" INTEGER NOT NULL,
    "FocalLengthMm" INTEGER NOT NULL,
    CONSTRAINT "FK_Instruments_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "AK_Instruments_Id_UserId" ON "Instruments" ("Id", "UserId");
CREATE INDEX "IX_Instruments_UserId" ON "Instruments" ("UserId");

INSERT INTO "Instruments" ("Id", "UserId", "Key", "Name", "DiameterMm", "FocalLengthMm")
SELECT "Id", 1, "Key", "Name", "DiameterMm", "FocalLengthMm"
FROM "Instruments_old_user_migration";

CREATE TABLE "Eyepieces" (
    "Id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Key" nvarchar(50) NOT NULL,
    "Name" nvarchar(150) NOT NULL,
    "FocalLengthMm" nvarchar(20),
    CONSTRAINT "FK_Eyepieces_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE INDEX "IX_Eyepieces_UserId" ON "Eyepieces" ("UserId");

INSERT INTO "Eyepieces" ("Id", "UserId", "Key", "Name", "FocalLengthMm")
SELECT "Id", 1, "Key", "Name", "FocalLengthMm"
FROM "Eyepieces_old_user_migration";

CREATE TABLE "ObsSessions" (
    "Id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Conditions" nvarchar(4000) NULL COLLATE NOCASE,
    "Date" datetime NULL,
    "LimitingMagnitude" numeric(18,2) NULL,
    "LocationId" int NULL,
    "ReportText" ntext NULL,
    "Seeing" int NULL,
    "Summary" nvarchar(4000) NULL COLLATE NOCASE,
    "Title" nvarchar(500) NULL COLLATE NOCASE,
    "Transparency" int NULL,
    "InstrumentId" INTEGER NULL,
    CONSTRAINT "FK_ObsSessions_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "FK_ObsSessions_Locations_LocationId_UserId"
        FOREIGN KEY ("LocationId", "UserId") REFERENCES "Locations" ("Id", "UserId")
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "FK_ObsSessions_Instruments_InstrumentId_UserId"
        FOREIGN KEY ("InstrumentId", "UserId") REFERENCES "Instruments" ("Id", "UserId")
        ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "AK_ObsSessions_Id_UserId" ON "ObsSessions" ("Id", "UserId");
CREATE INDEX "IX_ObsSessions_UserId" ON "ObsSessions" ("UserId");
CREATE INDEX "IX_ObsSessions_LocationId_UserId" ON "ObsSessions" ("LocationId", "UserId");
CREATE INDEX "IX_ObsSessions_InstrumentId_UserId" ON "ObsSessions" ("InstrumentId", "UserId");

INSERT INTO "ObsSessions" (
    "Id", "UserId", "Conditions", "Date", "LimitingMagnitude", "LocationId", "ReportText",
    "Seeing", "Summary", "Title", "Transparency", "InstrumentId")
SELECT
    "Id", 1, "Conditions", "Date", "LimitingMagnitude", "LocationId", "ReportText",
    "Seeing", "Summary", "Title", "Transparency", "InstrumentId"
FROM "ObsSessions_old_user_migration";

CREATE TABLE "Observations" (
    "Id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Identifier" nvarchar(200) COLLATE NOCASE,
    "ObsSessionId" int NOT NULL,
    "Text" nvarchar(4000) COLLATE NOCASE,
    "DisplayOrder" int,
    "NonDetection" bit NOT NULL DEFAULT 0,
    "InstrumentId" INTEGER NULL,
    CONSTRAINT "FK_Observations_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "FK_Observations_ObsSessions_ObsSessionId_UserId"
        FOREIGN KEY ("ObsSessionId", "UserId") REFERENCES "ObsSessions" ("Id", "UserId")
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "FK_Observations_Instruments_InstrumentId_UserId"
        FOREIGN KEY ("InstrumentId", "UserId") REFERENCES "Instruments" ("Id", "UserId")
        ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "AK_Observations_Id_UserId" ON "Observations" ("Id", "UserId");
CREATE INDEX "IX_Observations_UserId" ON "Observations" ("UserId");
CREATE INDEX "IX_Observations_ObsSessionId_UserId" ON "Observations" ("ObsSessionId", "UserId");
CREATE INDEX "IX_Observations_InstrumentId_UserId" ON "Observations" ("InstrumentId", "UserId");

INSERT INTO "Observations" (
    "Id", "UserId", "Identifier", "ObsSessionId", "Text", "DisplayOrder", "NonDetection", "InstrumentId")
SELECT
    "Id", 1, "Identifier", "ObsSessionId", "Text", "DisplayOrder", "NonDetection", "InstrumentId"
FROM "Observations_old_user_migration";

CREATE TABLE "DsoExtra" (
    "Id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "DsoId" int NOT NULL,
    "Rating" int,
    "FollowUp" bit,
    "ObsSessionId" int NOT NULL,
    CONSTRAINT "FK_DsoExtra_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "FK_DsoExtra_Dso"
        FOREIGN KEY ("DsoId") REFERENCES "SacDeepSkyObjects" ("Id")
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "FK_DsoExtra_ObsSessions_ObsSessionId_UserId"
        FOREIGN KEY ("ObsSessionId", "UserId") REFERENCES "ObsSessions" ("Id", "UserId")
        ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "IX_DsoExtra_UserId_DsoId" ON "DsoExtra" ("UserId", "DsoId");
CREATE INDEX "IX_DsoExtra_ObsSessionId_UserId" ON "DsoExtra" ("ObsSessionId", "UserId");

INSERT INTO "DsoExtra" ("Id", "UserId", "DsoId", "Rating", "FollowUp", "ObsSessionId")
SELECT "Id", 1, "DsoId", "Rating", "FollowUp", "ObsSessionId"
FROM "DsoExtra_old_user_migration";

CREATE TABLE "ObsResources" (
    "Id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Name" nvarchar(250) NULL COLLATE NOCASE,
    "ObservationId" int NOT NULL,
    "Type" nvarchar(20) NULL COLLATE NOCASE,
    "Url" nvarchar(500) NULL COLLATE NOCASE,
    "Rotation" int DEFAULT 0 NOT NULL,
    "Inverted" bit DEFAULT 0 NOT NULL,
    "BackgroundColor" int DEFAULT 0 NOT NULL,
    "ZoomLevel" int DEFAULT 100 NOT NULL,
    CONSTRAINT "FK_ObsResources_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "FK_ObsResources_Observations_ObservationId_UserId"
        FOREIGN KEY ("ObservationId", "UserId") REFERENCES "Observations" ("Id", "UserId")
        ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "IX_ObsResources_UserId" ON "ObsResources" ("UserId");
CREATE INDEX "IX_ObsResources_ObservationId_UserId" ON "ObsResources" ("ObservationId", "UserId");

INSERT INTO "ObsResources" (
    "Id", "UserId", "Name", "ObservationId", "Type", "Url", "Rotation", "Inverted", "BackgroundColor", "ZoomLevel")
SELECT
    "Id", 1, "Name", "ObservationId", "Type", "Url", "Rotation", "Inverted", "BackgroundColor", "ZoomLevel"
FROM "ObsResources_old_user_migration";

CREATE TABLE "DsoObservations" (
    "CustomObjectName" nvarchar(200) NOT NULL,
    "ObservationId" int NOT NULL,
    "DsoId" int NOT NULL,
    "DisplayOrder" int,
    "NonDetection" bit NOT NULL DEFAULT 0,
    CONSTRAINT "PK_DsoObservations" PRIMARY KEY ("ObservationId", "DsoId", "CustomObjectName"),
    CONSTRAINT "FK_DsoObservations_Observations_ObservationId"
        FOREIGN KEY ("ObservationId") REFERENCES "Observations" ("Id")
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "FK_DsoObservations_SacDeepSkyObjects"
        FOREIGN KEY ("DsoId") REFERENCES "SacDeepSkyObjects" ("Id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX "IX_DsoObservations_DsoId" ON "DsoObservations" ("DsoId");

INSERT INTO "DsoObservations" ("CustomObjectName", "ObservationId", "DsoId", "DisplayOrder", "NonDetection")
SELECT "CustomObjectName", "ObservationId", "DsoId", "DisplayOrder", "NonDetection"
FROM "DsoObservations_old_user_migration";

INSERT INTO "sqlite_sequence" ("name", "seq")
SELECT 'Locations', COALESCE(MAX("Id"), 0) FROM "Locations"
WHERE NOT EXISTS (SELECT 1 FROM "sqlite_sequence" WHERE "name" = 'Locations');
UPDATE "sqlite_sequence" SET "seq" = COALESCE((SELECT MAX("Id") FROM "Locations"), 0) WHERE "name" = 'Locations';

INSERT INTO "sqlite_sequence" ("name", "seq")
SELECT 'Instruments', COALESCE(MAX("Id"), 0) FROM "Instruments"
WHERE NOT EXISTS (SELECT 1 FROM "sqlite_sequence" WHERE "name" = 'Instruments');
UPDATE "sqlite_sequence" SET "seq" = COALESCE((SELECT MAX("Id") FROM "Instruments"), 0) WHERE "name" = 'Instruments';

INSERT INTO "sqlite_sequence" ("name", "seq")
SELECT 'Eyepieces', COALESCE(MAX("Id"), 0) FROM "Eyepieces"
WHERE NOT EXISTS (SELECT 1 FROM "sqlite_sequence" WHERE "name" = 'Eyepieces');
UPDATE "sqlite_sequence" SET "seq" = COALESCE((SELECT MAX("Id") FROM "Eyepieces"), 0) WHERE "name" = 'Eyepieces';

INSERT INTO "sqlite_sequence" ("name", "seq")
SELECT 'ObsSessions', COALESCE(MAX("Id"), 0) FROM "ObsSessions"
WHERE NOT EXISTS (SELECT 1 FROM "sqlite_sequence" WHERE "name" = 'ObsSessions');
UPDATE "sqlite_sequence" SET "seq" = COALESCE((SELECT MAX("Id") FROM "ObsSessions"), 0) WHERE "name" = 'ObsSessions';

INSERT INTO "sqlite_sequence" ("name", "seq")
SELECT 'Observations', COALESCE(MAX("Id"), 0) FROM "Observations"
WHERE NOT EXISTS (SELECT 1 FROM "sqlite_sequence" WHERE "name" = 'Observations');
UPDATE "sqlite_sequence" SET "seq" = COALESCE((SELECT MAX("Id") FROM "Observations"), 0) WHERE "name" = 'Observations';

INSERT INTO "sqlite_sequence" ("name", "seq")
SELECT 'DsoExtra', COALESCE(MAX("Id"), 0) FROM "DsoExtra"
WHERE NOT EXISTS (SELECT 1 FROM "sqlite_sequence" WHERE "name" = 'DsoExtra');
UPDATE "sqlite_sequence" SET "seq" = COALESCE((SELECT MAX("Id") FROM "DsoExtra"), 0) WHERE "name" = 'DsoExtra';

INSERT INTO "sqlite_sequence" ("name", "seq")
SELECT 'ObsResources', COALESCE(MAX("Id"), 0) FROM "ObsResources"
WHERE NOT EXISTS (SELECT 1 FROM "sqlite_sequence" WHERE "name" = 'ObsResources');
UPDATE "sqlite_sequence" SET "seq" = COALESCE((SELECT MAX("Id") FROM "ObsResources"), 0) WHERE "name" = 'ObsResources';

COMMIT;

PRAGMA foreign_keys = ON;
PRAGMA foreign_key_check;

-- Manual cleanup after verify-sqlite-user-ownership.py passes:
-- DROP TABLE "DsoObservations_old_user_migration";
-- DROP TABLE "ObsResources_old_user_migration";
-- DROP TABLE "DsoExtra_old_user_migration";
-- DROP TABLE "Observations_old_user_migration";
-- DROP TABLE "ObsSessions_old_user_migration";
-- DROP TABLE "Eyepieces_old_user_migration";
-- DROP TABLE "Instruments_old_user_migration";
-- DROP TABLE "Locations_old_user_migration";
