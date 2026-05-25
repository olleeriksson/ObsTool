-- Generated seed data for production demo user 2.
-- This script resets user-owned observation/equipment rows for Users.Id = 2, then inserts generated demo data.
-- Resource URLs are stored only in ObsResources; ReportText intentionally contains no Link/Photo/Sketch tags.
PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

DELETE FROM ObsResources WHERE UserId = 2;
DELETE FROM DsoObservations WHERE ObservationId IN (SELECT Id FROM Observations WHERE UserId = 2);
DELETE FROM DsoExtra WHERE UserId = 2;
DELETE FROM Observations WHERE UserId = 2;
DELETE FROM ObsSessions WHERE UserId = 2;
DELETE FROM Eyepieces WHERE UserId = 2;
DELETE FROM Instruments WHERE UserId = 2;
DELETE FROM Locations WHERE UserId = 2;

CREATE TEMP TABLE __seed_locations (Seq INTEGER PRIMARY KEY, Id INTEGER NOT NULL);
INSERT INTO Locations (UserId, GoogleMapsAddress, Latitude, Longitude, Name) VALUES (2, 'Frostmyr Ridge, Halsingland, Sweden', '62.0917', '15.0432', 'Frostmyr Ridge');
INSERT INTO __seed_locations (Seq, Id) VALUES (1, last_insert_rowid());
INSERT INTO Locations (UserId, GoogleMapsAddress, Latitude, Longitude, Name) VALUES (2, 'Granebo dark field, Dalarna, Sweden', '60.3110', '14.9084', 'Granebo Dark Field');
INSERT INTO __seed_locations (Seq, Id) VALUES (2, last_insert_rowid());
INSERT INTO Locations (UserId, GoogleMapsAddress, Latitude, Longitude, Name) VALUES (2, 'Larkullen quarry road, Vastergotland, Sweden', '58.8276', '13.7251', 'Larkullen Quarry Road');
INSERT INTO __seed_locations (Seq, Id) VALUES (3, last_insert_rowid());
INSERT INTO Locations (UserId, GoogleMapsAddress, Latitude, Longitude, Name) VALUES (2, 'Skarviken shore meadow, Smaland, Sweden', '57.2418', '16.4689', 'Skarviken Shore Meadow');
INSERT INTO __seed_locations (Seq, Id) VALUES (4, last_insert_rowid());

CREATE TEMP TABLE __seed_instruments (Seq INTEGER PRIMARY KEY, Id INTEGER NOT NULL, Key TEXT NOT NULL);
INSERT INTO Instruments (UserId, Key, Name, DiameterMm, FocalLengthMm) VALUES (2, '8"f6', '8" f/6 Dob', 200, 1200);
INSERT INTO __seed_instruments (Seq, Id, Key) VALUES (1, last_insert_rowid(), '8"f6');
INSERT INTO Instruments (UserId, Key, Name, DiameterMm, FocalLengthMm) VALUES (2, 'ST-120', 'StarTravel-120', 120, 600);
INSERT INTO __seed_instruments (Seq, Id, Key) VALUES (2, last_insert_rowid(), 'ST-120');

INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'ES82 24mm', 'ES82 24mm', '24');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'ES92 17mm', 'ES92 17mm', '17');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'XW20', 'Pentax XW20', '20');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'XW10', 'Pentax XW10', '10');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'Morpheus14', 'Morpheus 14mm', '14');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'Morpheus9', 'Morpheus 9mm', '9');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'Morpheus12.5', 'Morpheus 12.5mm', '12.5');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'BHZ', 'Baader Hyperion Zoom', '24');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'HiFW12.5', 'APM Hi-FW 12.5mm', '12.5');
INSERT INTO Eyepieces (UserId, Key, Name, FocalLengthMm) VALUES (2, 'UFF30', 'APM UFF 30mm', '30');

CREATE TEMP TABLE __seed_sessions (Seq INTEGER PRIMARY KEY, Id INTEGER NOT NULL);
CREATE TEMP TABLE __seed_observations (SessionSeq INTEGER NOT NULL, DisplayOrder INTEGER NOT NULL, Id INTEGER NOT NULL, PRIMARY KEY (SessionSeq, DisplayOrder));

-- Session 1: Late summer nebula circuit
INSERT INTO ObsSessions (UserId, Conditions, Date, LimitingMagnitude, LocationId, ReportText, Seeing, Summary, Title, Transparency, InstrumentId)
SELECT 2, 'Very transparent after sunset, warm at first, then damp grass and a light ground mist.', '2024-08-23 00:00:00', 5.90, L.Id, NULL, 3, 'A transparent late-summer run through Sagittarius, Scutum, and Cygnus.', 'Late summer nebula circuit', 5, I.Id
FROM __seed_locations L JOIN __seed_instruments I ON I.Seq = 1 WHERE L.Seq = 2;
INSERT INTO __seed_sessions (Seq, Id) VALUES (1, last_insert_rowid());
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8389', S.Id, 'With ES82 24mm, M 8 came into view after a careful hop and looked like a soft oval glow, a cluster with nebulosity that needed a measured look. The name Lagoon Nebula suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.', 0, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 1;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (1, 0, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8389 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 1 AND O.DisplayOrder = 0;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 8 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=M%208&fov=1.29&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 1 AND O.DisplayOrder = 0;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8381', S.Id, 'With XW10, M 20 came into view after a careful hop and looked like a wide low-contrast haze, a cluster with nebulosity that needed a measured look. The name Trifid Nebula suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.', 1, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 1;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (1, 1, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8381 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 1 AND O.DisplayOrder = 1;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8398', S.Id, 'With Morpheus12.5, NGC 6530 came into view after a careful hop and looked like a loose star spray, a open cluster that needed a measured look. The name Herschel 36 suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.', 2, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 1;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (1, 2, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8398 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 1 AND O.DisplayOrder = 2;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 6530 reused field sketch', O.Id, 'sketch', '13aKMVEMlGQYsotOguZjlkV30BqpF7-Hc&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 1 AND O.DisplayOrder = 2;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8202-8489-8465', S.Id, 'M 16 in UFF30 showed as a uneven glow; Averted vision helped frame the shape. M 17 in XW20 showed as a compact misty knot; It held after a few steady seconds. NGC 6603 in Morpheus9 showed as a grainy unresolved patch; It was modest, but distinct enough to trust.', 3, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 1;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (1, 3, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8202 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 8489 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 8465 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 1 AND O.DisplayOrder = 3;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 6603 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=NGC%206603&fov=0.30&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 1 AND O.DisplayOrder = 3;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8525-8495-8507', S.Id, 'M 22 in HiFW12.5 showed as a small brightening; The best view came while the field drifted. NGC 6624 in ES92 17mm showed as a thin washed streak; Averted vision helped frame the shape. NGC 6638 in Morpheus14 showed as a soft oval glow; It held after a few steady seconds.', 4, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 1;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (1, 4, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8525 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 8495 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 8507 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 1 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 6624 reused field sketch', O.Id, 'sketch', '1uHCqNLiDXlEuRfSskhzmYmQhdauxWYmH&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 1 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 6624 SIMBAD reference', O.Id, 'link', 'https://simbad.u-strasbg.fr/simbad/sim-id?Ident=NGC%206624', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 1 AND O.DisplayOrder = 4;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8511-8386-8564', S.Id, 'M 25 in BHZ showed as a wide low-contrast haze; It was modest, but distinct enough to trust. NGC 6520 in ES82 24mm showed as a loose star spray; The best view came while the field drifted. NGC 6818 in XW10 showed as a uneven glow; Averted vision helped frame the shape.', 5, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 1;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (1, 5, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8511 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 8386 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 8564 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 1 AND O.DisplayOrder = 5;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 6520 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=NGC%206520&fov=0.30&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 1 AND O.DisplayOrder = 5;
UPDATE ObsSessions
SET ReportText = 'Granebo was open and quiet, with Sagittarius already clear of the trees when I finished aligning the finder. I began with the dob because the first targets needed aperture and filters, while the small refractor waited for the wider second half.

With ES82 24mm, M 8 came into view after a careful hop and looked like a soft oval glow, a cluster with nebulosity that needed a measured look. The name Lagoon Nebula suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.
#' || S.Id || '-8389

With XW10, M 20 came into view after a careful hop and looked like a wide low-contrast haze, a cluster with nebulosity that needed a measured look. The name Trifid Nebula suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.
#' || S.Id || '-8381

With Morpheus12.5, NGC 6530 came into view after a careful hop and looked like a loose star spray, a open cluster that needed a measured look. The name Herschel 36 suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.
#' || S.Id || '-8398

M 16 in UFF30 showed as a uneven glow; Averted vision helped frame the shape. M 17 in XW20 showed as a compact misty knot; It held after a few steady seconds. NGC 6603 in Morpheus9 showed as a grainy unresolved patch; It was modest, but distinct enough to trust.
#' || S.Id || '-8202-8489-8465

Halfway through I changed to ST-120 and kept the session moving with wider fields and lower power sweeps.

M 22 in HiFW12.5 showed as a small brightening; The best view came while the field drifted. NGC 6624 in ES92 17mm showed as a thin washed streak; Averted vision helped frame the shape. NGC 6638 in Morpheus14 showed as a soft oval glow; It held after a few steady seconds.
#' || S.Id || '-8525-8495-8507

M 25 in BHZ showed as a wide low-contrast haze; It was modest, but distinct enough to trust. NGC 6520 in ES82 24mm showed as a loose star spray; The best view came while the field drifted. NGC 6818 in XW10 showed as a uneven glow; Averted vision helped frame the shape.
#' || S.Id || '-8511-8386-8564

I packed up after the Cygnus fields started to sink into the damp air. The notes were still easy to read, the filters were dry, and the night felt efficient without becoming rushed.'
FROM __seed_sessions S WHERE ObsSessions.Id = S.Id AND S.Seq = 1;

-- Session 2: Autumn fields around Andromeda
INSERT INTO ObsSessions (UserId, Conditions, Date, LimitingMagnitude, LocationId, ReportText, Seeing, Summary, Title, Transparency, InstrumentId)
SELECT 2, 'Still, cold, and dry with occasional thin cloud bands moving through the northeast.', '2024-10-11 00:00:00', 5.75, L.Id, NULL, 4, 'Autumn galaxy and cluster work from a roadside field with stable seeing.', 'Autumn fields around Andromeda', 4, I.Id
FROM __seed_locations L JOIN __seed_instruments I ON I.Seq = 1 WHERE L.Seq = 3;
INSERT INTO __seed_sessions (Seq, Id) VALUES (2, last_insert_rowid());
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-60', S.Id, 'With Morpheus12.5, M 31 came into view after a careful hop and looked like a compact misty knot, a galaxy that needed a measured look. The name Andromeda Galaxy suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.', 0, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 2;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (2, 0, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 60 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 2 AND O.DisplayOrder = 0;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 31 reused field sketch', O.Id, 'sketch', '1Cl4q2zhn8HhQHBnGNQxrcP0Fnhm5l4zj&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 2 AND O.DisplayOrder = 0;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-59', S.Id, 'With UFF30, M 32 came into view after a careful hop and looked like a grainy unresolved patch, a galaxy that needed a measured look. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.', 1, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 2;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (2, 1, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 59 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 2 AND O.DisplayOrder = 1;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-135', S.Id, 'With XW20, NGC 891 came into view after a careful hop and looked like a small brightening, a galaxy that needed a measured look. The best view came while the field drifted. I checked the surrounding stars before moving on.', 2, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 2;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (2, 2, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 135 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 2 AND O.DisplayOrder = 2;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8726-121-1321', S.Id, 'M 33 in Morpheus9 showed as a thin washed streak; Averted vision helped frame the shape. NGC 752 in HiFW12.5 showed as a soft oval glow; It held after a few steady seconds. NGC 457 in ES92 17mm showed as a wide low-contrast haze; It was modest, but distinct enough to trust.', 3, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 2;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (2, 3, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8726 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 121 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 1321 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 2 AND O.DisplayOrder = 3;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 33 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=M%2033&fov=1.96&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 2 AND O.DisplayOrder = 3;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 457 reused field sketch', O.Id, 'sketch', '1FnfFqllvhVakYmP9_V50IqAqnAf3Ps9_&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 2 AND O.DisplayOrder = 3;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-7044-4487-4485', S.Id, 'M 34 in Morpheus14 showed as a loose star spray; The best view came while the field drifted. M 35 in BHZ showed as a uneven glow; Averted vision helped frame the shape. NGC 2158 in ES82 24mm showed as a compact misty knot; It held after a few steady seconds.', 4, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 2;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (2, 4, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 7044 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 4487 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 4485 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 2 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 2158 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=NGC%202158&fov=0.30&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 2 AND O.DisplayOrder = 4;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-690-1400-6791', S.Id, 'M 36 in XW10 showed as a grainy unresolved patch; It was modest, but distinct enough to trust. NGC 7789 in Morpheus12.5 showed as a small brightening; The best view came while the field drifted. NGC 7331 in UFF30 showed as a thin washed streak; Averted vision helped frame the shape.', 5, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 2;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (2, 5, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 690 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 1400 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 6791 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 2 AND O.DisplayOrder = 5;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 7789 reused field sketch', O.Id, 'sketch', '1uB7mk5YPABL42h8nOpDodXLzRTF8kT_Y&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 2 AND O.DisplayOrder = 5;
UPDATE ObsSessions
SET ReportText = 'Larkullen was darker than expected after the village lights dropped behind the trees. I started with the dob on the autumn galaxies and kept the chair low so the long hops through Andromeda and Triangulum stayed comfortable.

With Morpheus12.5, M 31 came into view after a careful hop and looked like a compact misty knot, a galaxy that needed a measured look. The name Andromeda Galaxy suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.
#' || S.Id || '-60

With UFF30, M 32 came into view after a careful hop and looked like a grainy unresolved patch, a galaxy that needed a measured look. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.
#' || S.Id || '-59

With XW20, NGC 891 came into view after a careful hop and looked like a small brightening, a galaxy that needed a measured look. The best view came while the field drifted. I checked the surrounding stars before moving on.
#' || S.Id || '-135

M 33 in Morpheus9 showed as a thin washed streak; Averted vision helped frame the shape. NGC 752 in HiFW12.5 showed as a soft oval glow; It held after a few steady seconds. NGC 457 in ES92 17mm showed as a wide low-contrast haze; It was modest, but distinct enough to trust.
#' || S.Id || '-8726-121-1321

For the later groups I moved over to ST-120, mostly to enjoy the brighter clusters in their surrounding star fields.

M 34 in Morpheus14 showed as a loose star spray; The best view came while the field drifted. M 35 in BHZ showed as a uneven glow; Averted vision helped frame the shape. NGC 2158 in ES82 24mm showed as a compact misty knot; It held after a few steady seconds.
#' || S.Id || '-7044-4487-4485

M 36 in XW10 showed as a grainy unresolved patch; It was modest, but distinct enough to trust. NGC 7789 in Morpheus12.5 showed as a small brightening; The best view came while the field drifted. NGC 7331 in UFF30 showed as a thin washed streak; Averted vision helped frame the shape.
#' || S.Id || '-690-1400-6791

Thin cloud reached Pegasus just as I was closing the last case. I spent a few minutes checking the object identifiers under the red light, then left with a clean set of autumn notes.'
FROM __seed_sessions S WHERE ObsSessions.Id = S.Id AND S.Seq = 2;

-- Session 3: Cold Orion and winter clusters
INSERT INTO ObsSessions (UserId, Conditions, Date, LimitingMagnitude, LocationId, ReportText, Seeing, Summary, Title, Transparency, InstrumentId)
SELECT 2, 'Sub-zero, transparent between small cloud fragments, with seeing average but usable.', '2024-12-07 00:00:00', 5.55, L.Id, NULL, 3, 'A cold winter session moving from Auriga into Orion and Monoceros.', 'Cold Orion and winter clusters', 4, I.Id
FROM __seed_locations L JOIN __seed_instruments I ON I.Seq = 1 WHERE L.Seq = 4;
INSERT INTO __seed_sessions (Seq, Id) VALUES (3, last_insert_rowid());
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-703', S.Id, 'With XW20, M 37 came into view after a careful hop and looked like a soft oval glow, a open cluster that needed a measured look. The name January Salt-and-Pepper Cluster suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.', 0, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 3;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (3, 0, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 703 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 3 AND O.DisplayOrder = 0;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-688', S.Id, 'With Morpheus9, M 38 came into view after a careful hop and looked like a wide low-contrast haze, a open cluster that needed a measured look. The name Starfish Cluster suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.', 1, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 3;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (3, 1, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 688 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 3 AND O.DisplayOrder = 1;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 38 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=M%2038&fov=0.60&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 3 AND O.DisplayOrder = 1;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-6578', S.Id, 'With HiFW12.5, NGC 2024 came into view after a careful hop and looked like a loose star spray, a bright nebula that needed a measured look. The name Flame Nebula suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.', 2, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 3;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (3, 2, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 6578 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 3 AND O.DisplayOrder = 2;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-6326-6342-6562', S.Id, 'M 42 in ES92 17mm showed as a uneven glow; Averted vision helped frame the shape. NGC 1977 in Morpheus14 showed as a compact misty knot; It held after a few steady seconds. NGC 1981 in BHZ showed as a grainy unresolved patch; It was modest, but distinct enough to trust.', 3, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 3;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (3, 3, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 6326 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 6342 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 6562 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 3 AND O.DisplayOrder = 3;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 42 reused field sketch', O.Id, 'sketch', '1yahsh8na5gbhdqpKxUg64NS_uc7kDVC6&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 3 AND O.DisplayOrder = 3;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8596-8658-6195', S.Id, 'M 45 in ES82 24mm showed as a small brightening; The best view came while the field drifted. M 1 in XW10 showed as a thin washed streak; Averted vision helped frame the shape. NGC 2264 in Morpheus12.5 showed as a soft oval glow; It held after a few steady seconds.', 4, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 3;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (3, 4, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8596 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 8658 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 6195 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 3 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 45 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=M%2045&fov=2.80&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 3 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 2264 reused field sketch', O.Id, 'sketch', '1SOn-xxNNFv5-zzzADgBrwE3C6T51tfwp&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 3 AND O.DisplayOrder = 4;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-7638-2235-7640', S.Id, 'M 46 in UFF30 showed as a wide low-contrast haze; It was modest, but distinct enough to trust. NGC 2362 in XW20 showed as a loose star spray; The best view came while the field drifted. NGC 2440 in Morpheus9 showed as a uneven glow; Averted vision helped frame the shape.', 5, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 3;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (3, 5, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 7638 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 2235 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 7640 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 3 AND O.DisplayOrder = 5;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 2440 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=NGC%202440&fov=1.54&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 3 AND O.DisplayOrder = 5;
UPDATE ObsSessions
SET ReportText = 'Skarviken was frozen hard enough that the tripod feet barely marked the grass. I used the dob first while Orion climbed, keeping gloves on between every note and eyepiece change.

With XW20, M 37 came into view after a careful hop and looked like a soft oval glow, a open cluster that needed a measured look. The name January Salt-and-Pepper Cluster suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.
#' || S.Id || '-703

With Morpheus9, M 38 came into view after a careful hop and looked like a wide low-contrast haze, a open cluster that needed a measured look. The name Starfish Cluster suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.
#' || S.Id || '-688

With HiFW12.5, NGC 2024 came into view after a careful hop and looked like a loose star spray, a bright nebula that needed a measured look. The name Flame Nebula suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.
#' || S.Id || '-6578

M 42 in ES92 17mm showed as a uneven glow; Averted vision helped frame the shape. NGC 1977 in Morpheus14 showed as a compact misty knot; It held after a few steady seconds. NGC 1981 in BHZ showed as a grainy unresolved patch; It was modest, but distinct enough to trust.
#' || S.Id || '-6326-6342-6562

Later I changed to ST-120 because the large winter fields deserved more space than the dob was giving them.

M 45 in ES82 24mm showed as a small brightening; The best view came while the field drifted. M 1 in XW10 showed as a thin washed streak; Averted vision helped frame the shape. NGC 2264 in Morpheus12.5 showed as a soft oval glow; It held after a few steady seconds.
#' || S.Id || '-8596-8658-6195

M 46 in UFF30 showed as a wide low-contrast haze; It was modest, but distinct enough to trust. NGC 2362 in XW20 showed as a loose star spray; The best view came while the field drifted. NGC 2440 in Morpheus9 showed as a uneven glow; Averted vision helped frame the shape.
#' || S.Id || '-7638-2235-7640

The session ended with frost on both notebooks and caps. I took one last unaimed sweep through Gemini before packing, then warmed the eyepieces in the case during the drive home.'
FROM __seed_sessions S WHERE ObsSessions.Id = S.Id AND S.Seq = 3;

-- Session 4: Virgo chain with a refractor finish
INSERT INTO ObsSessions (UserId, Conditions, Date, LimitingMagnitude, LocationId, ReportText, Seeing, Summary, Title, Transparency, InstrumentId)
SELECT 2, 'Dry spring night, mild breeze, good transparency after a hazy sunset.', '2025-04-26 00:00:00', 5.80, L.Id, NULL, 3, 'A galaxy-heavy Virgo and Coma session, with the telescope changed midway.', 'Virgo chain with a refractor finish', 4, I.Id
FROM __seed_locations L JOIN __seed_instruments I ON I.Seq = 1 WHERE L.Seq = 2;
INSERT INTO __seed_sessions (Seq, Id) VALUES (4, last_insert_rowid());
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-9697', S.Id, 'With HiFW12.5, M 84 came into view after a careful hop and looked like a compact misty knot, a galaxy that needed a measured look. The name Markarian''s Chain suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.', 0, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 4;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (4, 0, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 9697 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 4 AND O.DisplayOrder = 0;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-9709', S.Id, 'With ES92 17mm, M 86 came into view after a careful hop and looked like a grainy unresolved patch, a galaxy that needed a measured look. The name Faust V051 suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.', 1, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 4;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (4, 1, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 9709 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 4 AND O.DisplayOrder = 1;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 86 reused field sketch', O.Id, 'sketch', '1iLwuvyx0nLkmiDrb6bZodpykSFkDoHci&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 4 AND O.DisplayOrder = 1;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-9739', S.Id, 'With Morpheus14, NGC 4438 came into view after a careful hop and looked like a small brightening, a galaxy that needed a measured look. The name The Eyes suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.', 2, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 4;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (4, 2, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 9739 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 4 AND O.DisplayOrder = 2;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-9768-9764-9762', S.Id, 'M 87 in BHZ showed as a thin washed streak; Averted vision helped frame the shape. NGC 4478 in ES82 24mm showed as a soft oval glow; It held after a few steady seconds. NGC 4476 in XW10 showed as a wide low-contrast haze; It was modest, but distinct enough to trust.', 3, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 4;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (4, 3, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 9768 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 9764 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 9762 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 4 AND O.DisplayOrder = 3;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 4478 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=NGC%204478&fov=0.30&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 4 AND O.DisplayOrder = 3;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-2581-9815-9817', S.Id, 'M 88 showed as a loose star spray; The best view came while the field drifted. NGC 4567 showed as a uneven glow; Averted vision helped frame the shape. NGC 4568 showed as a compact misty knot; It held after a few steady seconds.', 4, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 4;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (4, 4, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 2581 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 9815 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 9817 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 4 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 88 reused field sketch', O.Id, 'sketch', '1y0Hng5J8lU7GbMECAtBgOPRftAHPpLhE&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 4 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 4567 SIMBAD reference', O.Id, 'link', 'https://simbad.u-strasbg.fr/simbad/sim-id?Ident=NGC%204567', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 4 AND O.DisplayOrder = 4;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-2517-2538-2527', S.Id, 'M 99 showed as a grainy unresolved patch; It was modest, but distinct enough to trust. M 100 showed as a small brightening; The best view came while the field drifted. NGC 4298 showed as a thin washed streak; Averted vision helped frame the shape.', 5, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 4;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (4, 5, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 2517 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 2538 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 2527 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 4 AND O.DisplayOrder = 5;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 99 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=M%2099&fov=0.30&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 4 AND O.DisplayOrder = 5;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 4298 reused field sketch', O.Id, 'sketch', '1SEkWcDcsxjVqJVtjuVhlBCUjxaYf7mqv&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 4 AND O.DisplayOrder = 5;
UPDATE ObsSessions
SET ReportText = 'Granebo was quiet except for distant cranes, and Virgo was already high when I finished setting up. I began with the dob and moved slowly so the galaxy fields stayed oriented against the atlas.

With HiFW12.5, M 84 came into view after a careful hop and looked like a compact misty knot, a galaxy that needed a measured look. The name Markarian''s Chain suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.
#' || S.Id || '-9697

With ES92 17mm, M 86 came into view after a careful hop and looked like a grainy unresolved patch, a galaxy that needed a measured look. The name Faust V051 suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.
#' || S.Id || '-9709

With Morpheus14, NGC 4438 came into view after a careful hop and looked like a small brightening, a galaxy that needed a measured look. The name The Eyes suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.
#' || S.Id || '-9739

M 87 in BHZ showed as a thin washed streak; Averted vision helped frame the shape. NGC 4478 in ES82 24mm showed as a soft oval glow; It held after a few steady seconds. NGC 4476 in XW10 showed as a wide low-contrast haze; It was modest, but distinct enough to trust.
#' || S.Id || '-9768-9764-9762

After the first two groups I switched to ST-120, accepting less depth in exchange for a calmer view of the larger Messier context.

M 88 showed as a loose star spray; The best view came while the field drifted. NGC 4567 showed as a uneven glow; Averted vision helped frame the shape. NGC 4568 showed as a compact misty knot; It held after a few steady seconds.
#' || S.Id || '-2581-9815-9817

M 99 showed as a grainy unresolved patch; It was modest, but distinct enough to trust. M 100 showed as a small brightening; The best view came while the field drifted. NGC 4298 showed as a thin washed streak; Averted vision helped frame the shape.
#' || S.Id || '-2517-2538-2527

I finished by letting the refractor drift through Coma while checking the written identifiers. The air stayed dry all evening, and the optics were still clean when I packed.'
FROM __seed_sessions S WHERE ObsSessions.Id = S.Id AND S.Seq = 4;

-- Session 5: Ursa Major galaxy loop
INSERT INTO ObsSessions (UserId, Conditions, Date, LimitingMagnitude, LocationId, ReportText, Seeing, Summary, Title, Transparency, InstrumentId)
SELECT 2, 'Clear, cold, and steady enough for galaxy structure with careful averted vision.', '2026-03-14 00:00:00', 5.85, L.Id, NULL, 3, 'A March galaxy loop through Ursa Major and Canes Venatici.', 'Ursa Major galaxy loop', 4, I.Id
FROM __seed_locations L JOIN __seed_instruments I ON I.Seq = 1 WHERE L.Seq = 1;
INSERT INTO __seed_sessions (Seq, Id) VALUES (5, last_insert_rowid());
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8856', S.Id, 'M 81 came into view after a careful hop and looked like a soft oval glow, a galaxy that needed a measured look. The name Bode''s Galaxy suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.', 0, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 5;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (5, 0, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8856 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 5 AND O.DisplayOrder = 0;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8958', S.Id, 'M 82 came into view after a careful hop and looked like a wide low-contrast haze, a galaxy that needed a measured look. The name Cigar Galaxy suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.', 1, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 5;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (5, 1, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8958 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 5 AND O.DisplayOrder = 1;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-8965', S.Id, 'NGC 3077 came into view after a careful hop and looked like a loose star spray, a galaxy that needed a measured look. The name The Garland Galaxy suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.', 2, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 5;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (5, 2, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 8965 AS DsoId, 0 AS DisplayOrder) D WHERE O.SessionSeq = 5 AND O.DisplayOrder = 2;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 3077 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=NGC%203077&fov=0.30&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 5 AND O.DisplayOrder = 2;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-9074-9069-8963', S.Id, 'M 97 showed as a uneven glow; Averted vision helped frame the shape. M 108 showed as a compact misty knot; It held after a few steady seconds. NGC 3079 showed as a grainy unresolved patch; It was modest, but distinct enough to trust.', 3, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 1 WHERE S.Seq = 5;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (5, 3, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 9074 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 9069 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 8963 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 5 AND O.DisplayOrder = 3;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 108 reused field sketch', O.Id, 'sketch', '1--N-pbYTzkhx5T9bgP4mSRtJ688Zg7Fl&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 5 AND O.DisplayOrder = 3;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-9355-9361-9374', S.Id, 'M 101 showed as a small brightening; The best view came while the field drifted. NGC 5474 showed as a thin washed streak; Averted vision helped frame the shape. NGC 5585 showed as a soft oval glow; It held after a few steady seconds.', 4, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 5;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (5, 4, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 9355 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 9361 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 9374 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 5 AND O.DisplayOrder = 4;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 5474 DSS2 color photo', O.Id, 'image', 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&object=NGC%205474&fov=0.30&width=900&height=900&projection=TAN&coordsys=icrs&format=jpg&stretch=asinh', 0, 0, 0, 100 FROM __seed_observations O WHERE O.SessionSeq = 5 AND O.DisplayOrder = 4;
INSERT INTO Observations (UserId, Identifier, ObsSessionId, Text, DisplayOrder, NonDetection, InstrumentId)
SELECT 2, S.Id || '-9231-9211-2995', S.Id, 'M 109 showed as a wide low-contrast haze; It was modest, but distinct enough to trust. NGC 3953 showed as a loose star spray; The best view came while the field drifted. NGC 4217 showed as a uneven glow; Averted vision helped frame the shape.', 5, 0, I.Id
FROM __seed_sessions S JOIN __seed_instruments I ON I.Seq = 2 WHERE S.Seq = 5;
INSERT INTO __seed_observations (SessionSeq, DisplayOrder, Id) VALUES (5, 5, last_insert_rowid());
INSERT INTO DsoObservations (CustomObjectName, ObservationId, DsoId, DisplayOrder, NonDetection)
SELECT '', O.Id, D.DsoId, D.DisplayOrder, 0 FROM __seed_observations O JOIN (SELECT 9231 AS DsoId, 0 AS DisplayOrder UNION ALL SELECT 9211 AS DsoId, 1 AS DisplayOrder UNION ALL SELECT 2995 AS DsoId, 2 AS DisplayOrder) D WHERE O.SessionSeq = 5 AND O.DisplayOrder = 5;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'M 109 reused field sketch', O.Id, 'sketch', '1aKDO0kPvsJTMi8lgg6yqKvubuAwrnDW3&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 5 AND O.DisplayOrder = 5;
INSERT INTO ObsResources (UserId, Name, ObservationId, Type, Url, Rotation, Inverted, BackgroundColor, ZoomLevel)
SELECT 2, 'NGC 3953 reused field sketch', O.Id, 'sketch', '1mEuwhnTwokMh3d3roGD1Np3iJalH1w4R&usp=drive_fs', 0, 0, 255, 100 FROM __seed_observations O WHERE O.SessionSeq = 5 AND O.DisplayOrder = 5;
UPDATE ObsSessions
SET ReportText = 'Frostmyr Ridge had a hard spring chill and a dark northern horizon. I set up the dob first and worked through the brighter galaxy pairs while Ursa Major was high and easy to navigate.

M 81 came into view after a careful hop and looked like a soft oval glow, a galaxy that needed a measured look. The name Bode''s Galaxy suited the impression. It held after a few steady seconds. I checked the surrounding stars before moving on.
#' || S.Id || '-8856

M 82 came into view after a careful hop and looked like a wide low-contrast haze, a galaxy that needed a measured look. The name Cigar Galaxy suited the impression. It was modest, but distinct enough to trust. I checked the surrounding stars before moving on.
#' || S.Id || '-8958

NGC 3077 came into view after a careful hop and looked like a loose star spray, a galaxy that needed a measured look. The name The Garland Galaxy suited the impression. The best view came while the field drifted. I checked the surrounding stars before moving on.
#' || S.Id || '-8965

M 97 showed as a uneven glow; Averted vision helped frame the shape. M 108 showed as a compact misty knot; It held after a few steady seconds. NGC 3079 showed as a grainy unresolved patch; It was modest, but distinct enough to trust.
#' || S.Id || '-9074-9069-8963

For the final half I used ST-120 to place the galaxies in broader fields and slow the pace before packing.

M 101 showed as a small brightening; The best view came while the field drifted. NGC 5474 showed as a thin washed streak; Averted vision helped frame the shape. NGC 5585 showed as a soft oval glow; It held after a few steady seconds.
#' || S.Id || '-9355-9361-9374

M 109 showed as a wide low-contrast haze; It was modest, but distinct enough to trust. NGC 3953 showed as a loose star spray; The best view came while the field drifted. NGC 4217 showed as a uneven glow; Averted vision helped frame the shape.
#' || S.Id || '-9231-9211-2995

I stopped while the galaxy fields were still well placed, mostly because my hands were getting too cold for careful notes. The last view was not the deepest, but it gave the whole loop useful context.'
FROM __seed_sessions S WHERE ObsSessions.Id = S.Id AND S.Seq = 5;

COMMIT;
