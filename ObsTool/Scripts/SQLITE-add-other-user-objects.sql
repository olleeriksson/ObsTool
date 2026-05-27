-- Adds shared OtherObjects, user-owned UserObjects, and rewires DsoObservations
-- so each observation target points to exactly one SAC, Other, or User object.
--
-- Legacy note: CustomObjectName is intentionally not carried forward. Any old
-- custom-name-only observation data is discarded here because the app no longer
-- supports that legacy path.

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "OtherObjects" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_OtherObjects" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "OtherNames" TEXT NULL,
    "CommonName" TEXT NULL,
    "AllCommonNames" TEXT NULL,
    "Notes" TEXT NULL,
    "Type" TEXT NULL,
    "Const" TEXT NULL,
    "RA" TEXT NULL,
    "DEC" TEXT NULL,
    "Mag" TEXT NULL
);

CREATE TABLE IF NOT EXISTS "UserObjects" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_UserObjects" PRIMARY KEY AUTOINCREMENT,
    "UserId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "OtherNames" TEXT NULL,
    "CommonName" TEXT NULL,
    "AllCommonNames" TEXT NULL,
    "Notes" TEXT NULL,
    "Type" TEXT NULL,
    "Const" TEXT NULL,
    "RA" TEXT NULL,
    "DEC" TEXT NULL,
    "Mag" TEXT NULL,
    CONSTRAINT "FK_UserObjects_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserObjects_UserId_Name" ON "UserObjects" ("UserId", "Name");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_OtherObjects_Name" ON "OtherObjects" ("Name");

CREATE TABLE "DsoObservations_new" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_DsoObservations" PRIMARY KEY AUTOINCREMENT,
    "ObservationId" INTEGER NOT NULL,
    "DsoId" INTEGER NULL,
    "OtherObjectId" INTEGER NULL,
    "UserObjectId" INTEGER NULL,
    "DisplayOrder" INTEGER NOT NULL,
    "NonDetection" INTEGER NOT NULL,
    CONSTRAINT "CK_DsoObservations_ExactlyOneObject" CHECK (
        ("DsoId" IS NOT NULL AND "OtherObjectId" IS NULL AND "UserObjectId" IS NULL)
        OR ("DsoId" IS NULL AND "OtherObjectId" IS NOT NULL AND "UserObjectId" IS NULL)
        OR ("DsoId" IS NULL AND "OtherObjectId" IS NULL AND "UserObjectId" IS NOT NULL)
    ),
    CONSTRAINT "FK_DsoObservations_Observations_ObservationId" FOREIGN KEY ("ObservationId") REFERENCES "Observations" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_DsoObservations_SacDeepSkyObjects_DsoId" FOREIGN KEY ("DsoId") REFERENCES "SacDeepSkyObjects" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_DsoObservations_OtherObjects_OtherObjectId" FOREIGN KEY ("OtherObjectId") REFERENCES "OtherObjects" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_DsoObservations_UserObjects_UserObjectId" FOREIGN KEY ("UserObjectId") REFERENCES "UserObjects" ("Id") ON DELETE RESTRICT
);

INSERT INTO "DsoObservations_new" ("ObservationId", "DsoId", "OtherObjectId", "UserObjectId", "DisplayOrder", "NonDetection")
SELECT "ObservationId", "DsoId", NULL, NULL, "DisplayOrder", "NonDetection"
FROM "DsoObservations"
WHERE "DsoId" IS NOT NULL;

DROP TABLE "DsoObservations";

ALTER TABLE "DsoObservations_new" RENAME TO "DsoObservations";

CREATE INDEX "IX_DsoObservations_DsoId" ON "DsoObservations" ("DsoId");
CREATE INDEX "IX_DsoObservations_ObservationId" ON "DsoObservations" ("ObservationId");
CREATE INDEX "IX_DsoObservations_OtherObjectId" ON "DsoObservations" ("OtherObjectId");
CREATE INDEX "IX_DsoObservations_UserObjectId" ON "DsoObservations" ("UserObjectId");

COMMIT;

PRAGMA foreign_keys = ON;
