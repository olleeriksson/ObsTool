using Microsoft.EntityFrameworkCore;
using ObsTool.Database;
using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Xml;

namespace ObsTool.Services
{
    public class UserDataExportWorksheet
    {
        public string Name { get; set; }

        public string[] Headers { get; set; }

        public IEnumerable<string[]> Rows { get; set; }
    }

    public class UserDataExportFile
    {
        public string FileName { get; set; }

        public string ContentType { get; set; }

        public byte[] Contents { get; set; }
    }

    public class UserDataExportService
    {
        private const string ContentTypesNamespace = "http://schemas.openxmlformats.org/package/2006/content-types";
        private const string PackageRelationshipsNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";
        private const string OfficeRelationshipsNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
        private const string SpreadsheetNamespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

        private readonly MainDbContext _dbContext;

        public UserDataExportService(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Creates a compact text export from sessions that belong to the authenticated database user.
        /// </summary>
        public UserDataExportFile CreateSimpleExport(int userId)
        {
            var sessions = GetUserSessions(userId);
            var builder = new StringBuilder();

            foreach (var session in sessions)
            {
                AppendSimpleSession(builder, session);
            }

            return CreateFile(
                $"obstool-user-data-simple-{DateTime.UtcNow:yyyyMMdd-HHmmss}.txt",
                "text/plain; charset=utf-8",
                builder.ToString(),
                includeBom: false);
        }

        /// <summary>
        /// Creates a detailed Excel workbook with six worksheets derived only from the user's observation graph.
        /// </summary>
        public UserDataExportFile CreateAdvancedExport(int userId)
        {
            var sessions = GetUserSessions(userId);
            var observations = GetUserObservations(userId, sessions);
            var sessionById = sessions.ToDictionary(session => session.Id);
            var dsoRows = GetObservedDsoRows(observations);
            var firstSeenByDsoId = GetFirstSeenByDsoId(observations, sessionById);
            var constellationNamesByAbbreviation = GetConstellationNamesByAbbreviation();
            var worksheets = new[]
            {
                CreateSessionsWorksheet(sessions),
                CreateObservationsWorksheet(observations, sessionById),
                CreateObservationsExpandedWorksheet(observations, sessionById),
                CreateSacDeepSkyObjectsWorksheet(dsoRows),
                CreateResourcesWorksheet(observations, sessionById),
                CreateHerschelWorksheet(firstSeenByDsoId, constellationNamesByAbbreviation)
            };

            return CreateBinaryFile(
                $"obstool-user-data-advanced-{DateTime.UtcNow:yyyyMMdd-HHmmss}.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                CreateWorkbook(worksheets));
        }

        /// <summary>
        /// Loads sessions through a user-id predicate before including related display data.
        /// </summary>
        private List<ObsSession> GetUserSessions(int userId)
        {
            return _dbContext.ObsSessions
                .AsNoTracking()
                .Where(session => session.UserId == userId)
                .Include(session => session.Location)
                .Include(session => session.Instrument)
                .OrderBy(session => session.Date)
                .ThenBy(session => session.Id)
                .ToList();
        }

        /// <summary>
        /// Loads observations through the same user-id predicate and orders them by the user's session chronology.
        /// </summary>
        private List<Observation> GetUserObservations(int userId, List<ObsSession> sessions)
        {
            var sessionOrder = sessions
                .Select((session, index) => new { session.Id, Index = index })
                .ToDictionary(session => session.Id, session => session.Index);

            return _dbContext.Observations
                .AsNoTracking()
                .Where(observation => observation.UserId == userId)
                .Include(observation => observation.DsoObservations).ThenInclude(dsoObservation => dsoObservation.Dso)
                .Include(observation => observation.ObsResources)
                .Include(observation => observation.Instrument)
                .ToList()
                .OrderBy(observation => sessionOrder.ContainsKey(observation.ObsSessionId) ? sessionOrder[observation.ObsSessionId] : int.MaxValue)
                .ThenBy(observation => observation.DisplayOrder ?? int.MaxValue)
                .ThenBy(observation => observation.Id)
                .ToList();
        }

        /// <summary>
        /// Returns the distinct SAC objects referenced by the user's own observations.
        /// </summary>
        private static List<Dso> GetObservedDsoRows(IEnumerable<Observation> observations)
        {
            return observations
                .SelectMany(observation => observation.DsoObservations)
                .Select(dsoObservation => dsoObservation.Dso)
                .Where(dso => dso != null)
                .GroupBy(dso => dso.Id)
                .Select(group => group.First())
                .OrderBy(dso => dso.Catalog)
                .ThenBy(dso => dso.CatalogNumber)
                .ThenBy(dso => dso.Name)
                .ToList();
        }

        /// <summary>
        /// Uses the app's clean-detection rule to find the first date each linked DSO was actually seen by this user.
        /// </summary>
        private static Dictionary<int, DateTime?> GetFirstSeenByDsoId(IEnumerable<Observation> observations, Dictionary<int, ObsSession> sessionById)
        {
            return observations
                .Where(observation => !observation.NonDetection && sessionById.ContainsKey(observation.ObsSessionId))
                .SelectMany(observation => observation.DsoObservations
                    .Where(dsoObservation => !dsoObservation.NonDetection && dsoObservation.DsoId.HasValue)
                    .Select(dsoObservation => new
                    {
                        DsoId = dsoObservation.DsoId.Value,
                        Date = sessionById[observation.ObsSessionId].Date
                    }))
                .GroupBy(row => row.DsoId)
                .ToDictionary(group => group.Key, group => group
                    .Select(row => row.Date)
                    .OrderBy(date => date ?? DateTime.MaxValue)
                    .FirstOrDefault());
        }

        /// <summary>
        /// Builds a lookup from SAC/Herschel constellation abbreviations to the app's full constellation names.
        /// </summary>
        private Dictionary<string, string> GetConstellationNamesByAbbreviation()
        {
            return _dbContext.Constellations
                .AsNoTracking()
                .ToList()
                .GroupBy(constellation => NormalizeConstellationKey(constellation.Abbreviation))
                .ToDictionary(group => group.Key, group => group.First().Name);
        }

        /// <summary>
        /// Appends one readable text block for a session in the small export format.
        /// </summary>
        private static void AppendSimpleSession(StringBuilder builder, ObsSession session)
        {
            if (builder.Length > 0)
            {
                builder.AppendLine();
            }

            builder.AppendLine("========================================");
            builder.AppendLine($"Date: {FormatDate(session.Date)}");
            builder.AppendLine($"Title: {session.Title}");
            builder.AppendLine($"Location: {session.Location?.Name}");
            builder.AppendLine($"Summary: {session.Summary}");
            builder.AppendLine($"Conditions: {session.Conditions}");
            builder.AppendLine($"Seeing: {session.Seeing}");
            builder.AppendLine($"Transparency: {session.Transparency}");
            builder.AppendLine($"Limiting magnitude: {session.LimitingMagnitude}");
            builder.AppendLine($"Instrument: {session.Instrument?.Name}");
            builder.AppendLine("Report text:");
            builder.AppendLine(NormalizeMultilineText(session.ReportText));
        }

        /// <summary>
        /// Creates the session-level worksheet for the advanced workbook.
        /// </summary>
        private static UserDataExportWorksheet CreateSessionsWorksheet(IEnumerable<ObsSession> sessions)
        {
            return new UserDataExportWorksheet
            {
                Name = "Sessions",
                Headers = new[]
                {
                    "Date",
                    "Title",
                    "Location",
                    "Summary",
                    "Conditions",
                    "Seeing",
                    "Transparency",
                    "Limiting magnitude",
                    "Instrument",
                    "Report text"
                },
                Rows = sessions.Select(session => new[]
                {
                    FormatDate(session.Date),
                    session.Title,
                    session.Location?.Name,
                    session.Summary,
                    session.Conditions,
                    FormatNullable(session.Seeing),
                    FormatNullable(session.Transparency),
                    FormatNullable(session.LimitingMagnitude),
                    session.Instrument?.Name,
                    session.ReportText
                })
            };
        }

        /// <summary>
        /// Creates one row per observation with comma-separated object names split by detection state.
        /// </summary>
        private static UserDataExportWorksheet CreateObservationsWorksheet(IEnumerable<Observation> observations, Dictionary<int, ObsSession> sessionById)
        {
            return new UserDataExportWorksheet
            {
                Name = "Observations",
                Headers = new[]
                {
                    "Session date",
                    "Display order",
                    "Internal identifier",
                    "Report text",
                    "Detected",
                    "Instrument",
                    "Objects",
                    "Non-detected objects"
                },
                Rows = observations.Select(observation =>
                {
                    var observedObjects = observation.DsoObservations
                        .Where(dsoObservation => !dsoObservation.NonDetection)
                        .Select(dsoObservation => dsoObservation.Dso?.Name)
                        .Where(name => !string.IsNullOrWhiteSpace(name));
                    var nonDetectedObjects = observation.DsoObservations
                        .Where(dsoObservation => dsoObservation.NonDetection)
                        .Select(dsoObservation => dsoObservation.Dso?.Name)
                        .Where(name => !string.IsNullOrWhiteSpace(name));

                    return new[]
                    {
                        GetSessionDate(observation, sessionById),
                        FormatNullable(observation.DisplayOrder),
                        observation.Identifier,
                        observation.Text,
                        FormatBool(!observation.NonDetection),
                        observation.Instrument?.Name,
                        string.Join(", ", observedObjects),
                        string.Join(", ", nonDetectedObjects)
                    };
                })
            };
        }

        /// <summary>
        /// Creates one row per observation-to-DSO link so multi-object observations are expanded.
        /// </summary>
        private static UserDataExportWorksheet CreateObservationsExpandedWorksheet(IEnumerable<Observation> observations, Dictionary<int, ObsSession> sessionById)
        {
            return new UserDataExportWorksheet
            {
                Name = "Observations expanded",
                Headers = new[]
                {
                    "Session date",
                    "Display order",
                    "Internal identifier",
                    "Report text",
                    "All in group detected",
                    "Instrument",
                    "Detected",
                    "Name",
                    "Catalog",
                    "Catalog number",
                    "All common names",
                    "Type",
                    "Constellation",
                    "RA",
                    "DEC",
                    "mag",
                    "SB"
                },
                Rows = observations.SelectMany(observation => observation.DsoObservations
                    .OrderBy(dsoObservation => dsoObservation.DisplayOrder)
                    .Select(dsoObservation => new[]
                    {
                        GetSessionDate(observation, sessionById),
                        FormatNullable(observation.DisplayOrder),
                        observation.Identifier,
                        observation.Text,
                        FormatBool(!observation.NonDetection),
                        observation.Instrument?.Name,
                        FormatBool(!dsoObservation.NonDetection),
                        dsoObservation.Dso?.Name,
                        dsoObservation.Dso?.Catalog,
                        dsoObservation.Dso?.CatalogNumber,
                        dsoObservation.Dso?.AllCommonNames,
                        dsoObservation.Dso?.Type,
                        dsoObservation.Dso?.Con,
                        dsoObservation.Dso?.RA,
                        dsoObservation.Dso?.DEC,
                        dsoObservation.Dso?.Mag,
                        dsoObservation.Dso?.SB
                    }))
            };
        }

        /// <summary>
        /// Creates the distinct SAC object rows referenced by this user's observations.
        /// </summary>
        private static UserDataExportWorksheet CreateSacDeepSkyObjectsWorksheet(IEnumerable<Dso> dsoRows)
        {
            return new UserDataExportWorksheet
            {
                Name = "SacDeepSkyObjects",
                Headers = new[]
                {
                    "DSO Id",
                    "Name",
                    "Catalog",
                    "Catalog number",
                    "All common names",
                    "Type",
                    "Constellation",
                    "RA",
                    "DEC",
                    "Mag",
                    "SB"
                },
                Rows = dsoRows.Select(dso => new[]
                {
                    dso.Id.ToString(),
                    dso.Name,
                    dso.Catalog,
                    dso.CatalogNumber,
                    dso.AllCommonNames,
                    dso.Type,
                    dso.Con,
                    dso.RA,
                    dso.DEC,
                    dso.Mag,
                    dso.SB
                })
            };
        }

        /// <summary>
        /// Creates user-owned resources attached to the user's observations.
        /// </summary>
        private static UserDataExportWorksheet CreateResourcesWorksheet(IEnumerable<Observation> observations, Dictionary<int, ObsSession> sessionById)
        {
            return new UserDataExportWorksheet
            {
                Name = "Resources",
                Headers = new[]
                {
                    "Session date",
                    "Display order",
                    "Session-local internal identifier",
                    "Name",
                    "Type",
                    "URL"
                },
                Rows = observations.SelectMany(observation => observation.ObsResources
                    .Where(resource => resource.UserId == observation.UserId)
                    .OrderBy(resource => resource.Id)
                    .Select(resource => new[]
                    {
                        GetSessionDate(observation, sessionById),
                        FormatNullable(observation.DisplayOrder),
                        observation.Identifier,
                        resource.Name,
                        resource.Type,
                        resource.Url
                    }))
            };
        }

        /// <summary>
        /// Creates the Herschel checklist with current-user clean detection status and first-seen dates.
        /// </summary>
        private UserDataExportWorksheet CreateHerschelWorksheet(Dictionary<int, DateTime?> firstSeenByDsoId, Dictionary<string, string> constellationNamesByAbbreviation)
        {
            var rows = _dbContext.H2500
                .AsNoTracking()
                .Include(herschel => herschel.Dso)
                .OrderBy(herschel => herschel.HerschelId)
                .ToList()
                .Select(herschel =>
                {
                    var dsoId = herschel.SacDeepSkyObjectsId;
                    var observed = dsoId.HasValue && firstSeenByDsoId.ContainsKey(dsoId.Value);
                    var constellationKey = NormalizeConstellationKey(herschel.Const);

                    return new[]
                    {
                        herschel.HerschelNo,
                        herschel.Name,
                        FormatBool(herschel.H400),
                        herschel.Type,
                        herschel.Const,
                        constellationNamesByAbbreviation.ContainsKey(constellationKey) ? constellationNamesByAbbreviation[constellationKey] : null,
                        FormatNullable(herschel.SacDeepSkyObjectsId),
                        FormatBool(observed),
                        observed ? FormatDate(firstSeenByDsoId[dsoId.Value]) : null
                    };
                });

            return new UserDataExportWorksheet
            {
                Name = "Herschel",
                Headers = new[]
                {
                    "HerschelNo",
                    "Name",
                    "H400",
                    "Type",
                    "Const",
                    "Constellation",
                    "DSO id",
                    "Observed",
                    "First seen"
                },
                Rows = rows
            };
        }

        /// <summary>
        /// Creates the downloadable file payload with optional UTF-8 BOM for spreadsheet compatibility.
        /// </summary>
        private static UserDataExportFile CreateFile(string fileName, string contentType, string contents, bool includeBom)
        {
            var encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: includeBom);
            return new UserDataExportFile
            {
                FileName = fileName,
                ContentType = contentType,
                Contents = encoding.GetBytes(contents)
            };
        }

        /// <summary>
        /// Creates the downloadable binary file payload used by generated workbooks.
        /// </summary>
        private static UserDataExportFile CreateBinaryFile(string fileName, string contentType, byte[] contents)
        {
            return new UserDataExportFile
            {
                FileName = fileName,
                ContentType = contentType,
                Contents = contents
            };
        }

        /// <summary>
        /// Creates a minimal XLSX workbook package with one worksheet per export tab.
        /// </summary>
        private static byte[] CreateWorkbook(IEnumerable<UserDataExportWorksheet> worksheets)
        {
            var worksheetList = worksheets.ToList();

            using (var stream = new MemoryStream())
            {
                using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
                {
                    AddZipEntry(archive, "[Content_Types].xml", BuildContentTypesXml(worksheetList.Count));
                    AddZipEntry(archive, "_rels/.rels", BuildPackageRelationshipsXml());
                    AddZipEntry(archive, "xl/workbook.xml", BuildWorkbookXml(worksheetList));
                    AddZipEntry(archive, "xl/_rels/workbook.xml.rels", BuildWorkbookRelationshipsXml(worksheetList.Count));
                    AddZipEntry(archive, "xl/styles.xml", BuildStylesXml());

                    for (var index = 0; index < worksheetList.Count; index++)
                    {
                        AddZipEntry(archive, $"xl/worksheets/sheet{index + 1}.xml", BuildWorksheetXml(worksheetList[index]));
                    }
                }

                return stream.ToArray();
            }
        }

        /// <summary>
        /// Adds a UTF-8 XML part to the XLSX zip package.
        /// </summary>
        private static void AddZipEntry(ZipArchive archive, string path, string contents)
        {
            var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
            using (var entryStream = entry.Open())
            using (var writer = new StreamWriter(entryStream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false)))
            {
                writer.Write(contents);
            }
        }

        /// <summary>
        /// Builds the XLSX content type manifest for the workbook parts.
        /// </summary>
        private static string BuildContentTypesXml(int worksheetCount)
        {
            return WriteXml(writer =>
            {
                writer.WriteStartElement(null, "Types", ContentTypesNamespace);
                writer.WriteStartElement(null, "Default", ContentTypesNamespace);
                writer.WriteAttributeString("Extension", "rels");
                writer.WriteAttributeString("ContentType", "application/vnd.openxmlformats-package.relationships+xml");
                writer.WriteEndElement();
                writer.WriteStartElement(null, "Default", ContentTypesNamespace);
                writer.WriteAttributeString("Extension", "xml");
                writer.WriteAttributeString("ContentType", "application/xml");
                writer.WriteEndElement();
                WriteOverride(writer, "/xl/workbook.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml");
                WriteOverride(writer, "/xl/styles.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml");

                for (var index = 1; index <= worksheetCount; index++)
                {
                    WriteOverride(writer, $"/xl/worksheets/sheet{index}.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml");
                }

                writer.WriteEndElement();
            });
        }

        /// <summary>
        /// Builds the package-level relationship from the zip root to the workbook.
        /// </summary>
        private static string BuildPackageRelationshipsXml()
        {
            return WriteXml(writer =>
            {
                writer.WriteStartElement(null, "Relationships", PackageRelationshipsNamespace);
                WriteRelationship(writer, "rId1", $"{OfficeRelationshipsNamespace}/officeDocument", "xl/workbook.xml");
                writer.WriteEndElement();
            });
        }

        /// <summary>
        /// Builds the workbook part with the visible worksheet tabs.
        /// </summary>
        private static string BuildWorkbookXml(IReadOnlyList<UserDataExportWorksheet> worksheets)
        {
            return WriteXml(writer =>
            {
                writer.WriteStartElement(null, "workbook", SpreadsheetNamespace);
                writer.WriteAttributeString("xmlns", "r", null, OfficeRelationshipsNamespace);
                writer.WriteStartElement(null, "sheets", SpreadsheetNamespace);

                for (var index = 0; index < worksheets.Count; index++)
                {
                    writer.WriteStartElement(null, "sheet", SpreadsheetNamespace);
                    writer.WriteAttributeString("name", NormalizeWorksheetName(worksheets[index].Name));
                    writer.WriteAttributeString("sheetId", (index + 1).ToString());
                    writer.WriteAttributeString("r", "id", null, $"rId{index + 1}");
                    writer.WriteEndElement();
                }

                writer.WriteEndElement();
                writer.WriteEndElement();
            });
        }

        /// <summary>
        /// Builds workbook relationships for worksheets and the shared styles part.
        /// </summary>
        private static string BuildWorkbookRelationshipsXml(int worksheetCount)
        {
            return WriteXml(writer =>
            {
                writer.WriteStartElement(null, "Relationships", PackageRelationshipsNamespace);

                for (var index = 1; index <= worksheetCount; index++)
                {
                    WriteRelationship(writer, $"rId{index}", $"{OfficeRelationshipsNamespace}/worksheet", $"worksheets/sheet{index}.xml");
                }

                WriteRelationship(writer, $"rId{worksheetCount + 1}", $"{OfficeRelationshipsNamespace}/styles", "styles.xml");
                writer.WriteEndElement();
            });
        }

        /// <summary>
        /// Builds simple workbook styles with a bold header row style.
        /// </summary>
        private static string BuildStylesXml()
        {
            return WriteXml(writer =>
            {
                writer.WriteStartElement(null, "styleSheet", SpreadsheetNamespace);
                writer.WriteStartElement(null, "fonts", SpreadsheetNamespace);
                writer.WriteAttributeString("count", "2");
                writer.WriteStartElement(null, "font", SpreadsheetNamespace);
                writer.WriteEndElement();
                writer.WriteStartElement(null, "font", SpreadsheetNamespace);
                writer.WriteStartElement(null, "b", SpreadsheetNamespace);
                writer.WriteEndElement();
                writer.WriteEndElement();
                writer.WriteEndElement();

                writer.WriteStartElement(null, "fills", SpreadsheetNamespace);
                writer.WriteAttributeString("count", "2");
                WritePatternFill(writer, "none");
                WritePatternFill(writer, "gray125");
                writer.WriteEndElement();

                writer.WriteStartElement(null, "borders", SpreadsheetNamespace);
                writer.WriteAttributeString("count", "1");
                writer.WriteStartElement(null, "border", SpreadsheetNamespace);
                writer.WriteEndElement();
                writer.WriteEndElement();

                writer.WriteStartElement(null, "cellStyleXfs", SpreadsheetNamespace);
                writer.WriteAttributeString("count", "1");
                WriteXf(writer, "0");
                writer.WriteEndElement();

                writer.WriteStartElement(null, "cellXfs", SpreadsheetNamespace);
                writer.WriteAttributeString("count", "2");
                WriteXf(writer, "0");
                writer.WriteStartElement(null, "xf", SpreadsheetNamespace);
                writer.WriteAttributeString("numFmtId", "0");
                writer.WriteAttributeString("fontId", "1");
                writer.WriteAttributeString("fillId", "0");
                writer.WriteAttributeString("borderId", "0");
                writer.WriteAttributeString("xfId", "0");
                writer.WriteAttributeString("applyFont", "1");
                writer.WriteEndElement();
                writer.WriteEndElement();

                writer.WriteEndElement();
            });
        }

        /// <summary>
        /// Builds a worksheet XML part with headers, rows, column widths, filters, and a frozen header row.
        /// </summary>
        private static string BuildWorksheetXml(UserDataExportWorksheet worksheet)
        {
            var rows = worksheet.Rows.ToList();
            var columnCount = worksheet.Headers.Length;
            var lastColumn = GetColumnName(columnCount);
            var lastRow = rows.Count + 1;

            return WriteXml(writer =>
            {
                writer.WriteStartElement(null, "worksheet", SpreadsheetNamespace);
                writer.WriteStartElement(null, "sheetViews", SpreadsheetNamespace);
                writer.WriteStartElement(null, "sheetView", SpreadsheetNamespace);
                writer.WriteAttributeString("workbookViewId", "0");
                writer.WriteStartElement(null, "pane", SpreadsheetNamespace);
                writer.WriteAttributeString("ySplit", "1");
                writer.WriteAttributeString("topLeftCell", "A2");
                writer.WriteAttributeString("activePane", "bottomLeft");
                writer.WriteAttributeString("state", "frozen");
                writer.WriteEndElement();
                writer.WriteStartElement(null, "selection", SpreadsheetNamespace);
                writer.WriteAttributeString("pane", "bottomLeft");
                writer.WriteEndElement();
                writer.WriteEndElement();
                writer.WriteEndElement();
                WriteColumnWidths(writer, worksheet.Headers, rows);
                writer.WriteStartElement(null, "sheetData", SpreadsheetNamespace);
                WriteRow(writer, 1, worksheet.Headers, headerStyle: true);

                for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
                {
                    WriteRow(writer, rowIndex + 2, rows[rowIndex], headerStyle: false);
                }

                writer.WriteEndElement();
                writer.WriteStartElement(null, "autoFilter", SpreadsheetNamespace);
                writer.WriteAttributeString("ref", $"A1:{lastColumn}{lastRow}");
                writer.WriteEndElement();
                writer.WriteEndElement();
            });
        }

        /// <summary>
        /// Writes a worksheet row using inline string cells so no shared string table is needed.
        /// </summary>
        private static void WriteRow(XmlWriter writer, int rowNumber, IReadOnlyList<string> values, bool headerStyle)
        {
            writer.WriteStartElement(null, "row", SpreadsheetNamespace);
            writer.WriteAttributeString("r", rowNumber.ToString());

            for (var columnIndex = 0; columnIndex < values.Count; columnIndex++)
            {
                writer.WriteStartElement(null, "c", SpreadsheetNamespace);
                writer.WriteAttributeString("r", $"{GetColumnName(columnIndex + 1)}{rowNumber}");
                writer.WriteAttributeString("t", "inlineStr");
                if (headerStyle)
                {
                    writer.WriteAttributeString("s", "1");
                }

                writer.WriteStartElement(null, "is", SpreadsheetNamespace);
                writer.WriteStartElement(null, "t", SpreadsheetNamespace);
                writer.WriteAttributeString("xml", "space", null, "preserve");
                writer.WriteString(NormalizeSpreadsheetText(values[columnIndex]));
                writer.WriteEndElement();
                writer.WriteEndElement();
                writer.WriteEndElement();
            }

            writer.WriteEndElement();
        }

        /// <summary>
        /// Writes estimated column widths to keep exported worksheets readable when opened.
        /// </summary>
        private static void WriteColumnWidths(XmlWriter writer, IReadOnlyList<string> headers, IEnumerable<string[]> rows)
        {
            writer.WriteStartElement(null, "cols", SpreadsheetNamespace);

            for (var columnIndex = 0; columnIndex < headers.Count; columnIndex++)
            {
                var maxLength = Math.Max(
                    headers[columnIndex]?.Length ?? 0,
                    rows.Select(row => columnIndex < row.Length ? NormalizeSpreadsheetText(row[columnIndex]).Length : 0).DefaultIfEmpty(0).Max());
                var width = Math.Min(Math.Max(maxLength + 2, 12), 60);

                writer.WriteStartElement(null, "col", SpreadsheetNamespace);
                writer.WriteAttributeString("min", (columnIndex + 1).ToString());
                writer.WriteAttributeString("max", (columnIndex + 1).ToString());
                writer.WriteAttributeString("width", width.ToString());
                writer.WriteAttributeString("customWidth", "1");
                writer.WriteEndElement();
            }

            writer.WriteEndElement();
        }

        /// <summary>
        /// Writes one content type override element.
        /// </summary>
        private static void WriteOverride(XmlWriter writer, string partName, string contentType)
        {
            writer.WriteStartElement(null, "Override", ContentTypesNamespace);
            writer.WriteAttributeString("PartName", partName);
            writer.WriteAttributeString("ContentType", contentType);
            writer.WriteEndElement();
        }

        /// <summary>
        /// Writes one Open XML relationship element.
        /// </summary>
        private static void WriteRelationship(XmlWriter writer, string id, string type, string target)
        {
            writer.WriteStartElement(null, "Relationship", PackageRelationshipsNamespace);
            writer.WriteAttributeString("Id", id);
            writer.WriteAttributeString("Type", type);
            writer.WriteAttributeString("Target", target);
            writer.WriteEndElement();
        }

        /// <summary>
        /// Writes one fill style entry for the workbook styles part.
        /// </summary>
        private static void WritePatternFill(XmlWriter writer, string patternType)
        {
            writer.WriteStartElement(null, "fill", SpreadsheetNamespace);
            writer.WriteStartElement(null, "patternFill", SpreadsheetNamespace);
            writer.WriteAttributeString("patternType", patternType);
            writer.WriteEndElement();
            writer.WriteEndElement();
        }

        /// <summary>
        /// Writes one basic cell format entry for the workbook styles part.
        /// </summary>
        private static void WriteXf(XmlWriter writer, string fontId)
        {
            writer.WriteStartElement(null, "xf", SpreadsheetNamespace);
            writer.WriteAttributeString("numFmtId", "0");
            writer.WriteAttributeString("fontId", fontId);
            writer.WriteAttributeString("fillId", "0");
            writer.WriteAttributeString("borderId", "0");
            writer.WriteEndElement();
        }

        /// <summary>
        /// Runs a compact XmlWriter action and returns the generated XML string.
        /// </summary>
        private static string WriteXml(Action<XmlWriter> write)
        {
            var builder = new StringBuilder();
            var settings = new XmlWriterSettings
            {
                Encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
                OmitXmlDeclaration = true
            };

            using (var writer = XmlWriter.Create(builder, settings))
            {
                writer.WriteStartDocument();
                write(writer);
                writer.WriteEndDocument();
            }

            return builder.ToString();
        }

        /// <summary>
        /// Converts a 1-based column number to Excel's A1 column letters.
        /// </summary>
        private static string GetColumnName(int columnNumber)
        {
            var name = string.Empty;
            while (columnNumber > 0)
            {
                columnNumber--;
                name = (char)('A' + columnNumber % 26) + name;
                columnNumber /= 26;
            }

            return name;
        }

        /// <summary>
        /// Keeps worksheet names valid for Excel while preserving the requested tab labels.
        /// </summary>
        private static string NormalizeWorksheetName(string name)
        {
            var invalidChars = new HashSet<char> { ':', '\\', '/', '?', '*', '[', ']' };
            var normalized = new string((name ?? "Sheet").Select(c => invalidChars.Contains(c) ? ' ' : c).ToArray()).Trim();

            if (string.IsNullOrWhiteSpace(normalized))
            {
                normalized = "Sheet";
            }

            return normalized.Length <= 31 ? normalized : normalized.Substring(0, 31);
        }

        /// <summary>
        /// Reads the parent session date for an observation from the pre-filtered user session dictionary.
        /// </summary>
        private static string GetSessionDate(Observation observation, Dictionary<int, ObsSession> sessionById)
        {
            return sessionById.ContainsKey(observation.ObsSessionId)
                ? FormatDate(sessionById[observation.ObsSessionId].Date)
                : null;
        }

        /// <summary>
        /// Formats nullable dates consistently for text and CSV exports.
        /// </summary>
        private static string FormatDate(DateTime? date)
        {
            return date?.ToString("yyyy-MM-dd");
        }

        /// <summary>
        /// Formats nullable values without culture-specific display decoration.
        /// </summary>
        private static string FormatNullable<T>(T? value) where T : struct
        {
            return value?.ToString();
        }

        /// <summary>
        /// Formats booleans as text that reads naturally in exported spreadsheets.
        /// </summary>
        private static string FormatBool(bool value)
        {
            return value ? "Yes" : "No";
        }

        /// <summary>
        /// Normalizes null strings and preserves multi-line values inside CSV fields.
        /// </summary>
        private static string NormalizeMultilineText(string value)
        {
            return (value ?? string.Empty).Replace("\r\n", "\n").Replace("\n", "\r\n");
        }

        /// <summary>
        /// Normalizes text for Excel XML cells by removing invalid XML characters and respecting Excel's cell length limit.
        /// </summary>
        private static string NormalizeSpreadsheetText(string value)
        {
            value = (value ?? string.Empty).Replace("\r\n", "\n").Replace("\r", "\n");
            var builder = new StringBuilder(value.Length);

            foreach (var c in value)
            {
                if (XmlConvert.IsXmlChar(c))
                {
                    builder.Append(c);
                }
            }

            const int maxExcelCellLength = 32767;
            if (builder.Length > maxExcelCellLength)
            {
                return builder.ToString(0, maxExcelCellLength - 3) + "...";
            }

            return builder.ToString();
        }

        /// <summary>
        /// Normalizes constellation keys for joining H2500 rows to the constellation table.
        /// </summary>
        private static string NormalizeConstellationKey(string constellation)
        {
            return string.IsNullOrWhiteSpace(constellation) ? string.Empty : constellation.Trim().ToUpperInvariant();
        }
    }
}
