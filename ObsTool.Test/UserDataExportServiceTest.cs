using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using ObsTool;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;

namespace TestProject
{
    [TestFixture]
    public class UserDataExportServiceTest
    {
        private const int TestUserId = 1;
        private const int OtherUserId = 2;
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private UserDataExportService _service;

        [SetUp]
        public void Setup()
        {
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["Db:Migrate"]).Returns("false");
            Startup.Configuration = configMock.Object;

            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = "PRAGMA foreign_keys = OFF";
                cmd.ExecuteNonQuery();
            }

            var options = new DbContextOptionsBuilder<MainDbContext>()
                .UseSqlite(_connection)
                .Options;

            _dbContext = new MainDbContext(options, new Mock<ILogger<MainDbContext>>().Object);
            _dbContext.Database.EnsureCreated();
            _service = new UserDataExportService(_dbContext);
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void CreateSimpleExport_OnlyIncludesCurrentUserSessions()
        {
            SeedExportData();

            var exportFile = _service.CreateSimpleExport(TestUserId);
            var text = Encoding.UTF8.GetString(exportFile.Contents);

            Assert.That(exportFile.FileName, Does.EndWith(".txt"));
            Assert.That(text, Does.Contain("Title: Current user session"));
            Assert.That(text, Does.Contain("Instrument: Current scope"));
            Assert.That(text, Does.Contain("Current user report\r\nImage: https://example.test/photo\r\nLink: https://example.test/article\r\nSketch: https://drive.google.com/open?id=drive-sketch-id\r\nReport ending\r\n"));
            Assert.That(text, Does.Not.Contain("Current user report\r\n\r\nImage:"));
            Assert.That(text, Does.Not.Contain("#1-1-2"));
            Assert.That(text, Does.Not.Contain("Other user session"));
            Assert.That(text, Does.Not.Contain("Other user report"));
        }

        [Test]
        public void CreateAdvancedExport_UsesCurrentUserObservationGraphAndCleanHerschelDetection()
        {
            SeedExportData();

            var exportFile = _service.CreateAdvancedExport(TestUserId);
            var entries = ReadWorkbookEntries(exportFile.Contents);
            var workbookXml = entries["xl/workbook.xml"];
            var sessionsWorksheetXml = entries["xl/worksheets/sheet1.xml"];
            var allWorksheetXml = string.Join("\n", entries
                .Where(entry => entry.Key.StartsWith("xl/worksheets/"))
                .Select(entry => entry.Value));

            Assert.That(exportFile.FileName, Does.EndWith(".xlsx"));
            Assert.That(exportFile.ContentType, Is.EqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            Assert.That(workbookXml, Does.Contain("Sessions"));
            Assert.That(workbookXml, Does.Contain("Observations"));
            Assert.That(workbookXml, Does.Contain("Observations expanded"));
            Assert.That(workbookXml, Does.Contain("SacDeepSkyObjects"));
            Assert.That(workbookXml, Does.Contain("Resources"));
            Assert.That(workbookXml, Does.Contain("Herschel"));
            Assert.That(allWorksheetXml, Does.Contain("Current user session"));
            Assert.That(allWorksheetXml, Does.Contain("Display order"));
            Assert.That(allWorksheetXml, Does.Contain("Objects"));
            Assert.That(allWorksheetXml, Does.Contain("All in group detected"));
            Assert.That(allWorksheetXml, Does.Contain("Detected"));
            Assert.That(allWorksheetXml, Does.Not.Contain("Observed objects"));
            Assert.That(allWorksheetXml, Does.Not.Contain("DsoObservation detection"));
            Assert.That(allWorksheetXml, Does.Contain("Current observation text"));
            Assert.That(allWorksheetXml, Does.Contain("Observation scope"));
            Assert.That(allWorksheetXml, Does.Contain("Observed object"));
            Assert.That(allWorksheetXml, Does.Contain("Non-detected object"));
            Assert.That(allWorksheetXml, Does.Contain("Session-local internal identifier"));
            Assert.That(allWorksheetXml, Does.Contain("Sketch one"));
            Assert.That(sessionsWorksheetXml, Does.Contain("Current user report"));
            Assert.That(sessionsWorksheetXml.Replace("\r\n", "\n"), Does.Contain("Current user report\nReport ending"));
            Assert.That(sessionsWorksheetXml, Does.Not.Contain("#1-1-2"));
            Assert.That(allWorksheetXml, Does.Contain("H I-1"));
            Assert.That(allWorksheetXml, Does.Contain("Herschel one"));
            Assert.That(allWorksheetXml, Does.Contain("2024-01-02"));
            Assert.That(allWorksheetXml, Does.Contain("H II-2"));
            Assert.That(allWorksheetXml, Does.Not.Contain("Other user session"));
            Assert.That(allWorksheetXml, Does.Not.Contain("Other user object"));
        }

        /// <summary>
        /// Opens the generated XLSX package and returns XML parts for content assertions.
        /// </summary>
        private static Dictionary<string, string> ReadWorkbookEntries(byte[] workbookContents)
        {
            using (var stream = new MemoryStream(workbookContents))
            using (var archive = new ZipArchive(stream, ZipArchiveMode.Read))
            {
                return archive.Entries
                    .Where(entry => entry.FullName.EndsWith(".xml"))
                    .ToDictionary(entry => entry.FullName, entry =>
                    {
                        using (var reader = new StreamReader(entry.Open(), Encoding.UTF8))
                        {
                            return reader.ReadToEnd();
                        }
                    });
            }
        }

        /// <summary>
        /// Seeds two users' sessions and observations so export tests can verify user-boundary filtering.
        /// </summary>
        private void SeedExportData()
        {
            var currentLocation = new Location { Id = 1, UserId = TestUserId, Name = "Current site" };
            var otherLocation = new Location { Id = 2, UserId = OtherUserId, Name = "Other site" };
            var currentInstrument = new Instrument { Id = 1, UserId = TestUserId, Key = "current", Name = "Current scope" };
            var observationInstrument = new Instrument { Id = 2, UserId = TestUserId, Key = "observation", Name = "Observation scope" };
            var otherInstrument = new Instrument { Id = 3, UserId = OtherUserId, Key = "other", Name = "Other scope" };

            _dbContext.Locations.AddRange(currentLocation, otherLocation);
            _dbContext.Instruments.AddRange(currentInstrument, observationInstrument, otherInstrument);
            _dbContext.Constellations.Add(new Constellation("Orion", "Ori"));
            _dbContext.Dso.AddRange(
                CreateDso(1, "Observed object"),
                CreateDso(2, "Non-detected object"),
                CreateDso(3, "Other user object"));
            _dbContext.H2500.AddRange(
                CreateHerschelObject(1, "H I-1", "Herschel one", true, 1),
                CreateHerschelObject(2, "H II-2", "Herschel two", false, 2),
                CreateHerschelObject(3, "H III-3", "Other Herschel", false, 3));
            _dbContext.ObsSessions.AddRange(
                new ObsSession
                {
                    Id = 1,
                    UserId = TestUserId,
                    Date = new DateTime(2024, 1, 2),
                    LocationId = currentLocation.Id,
                    InstrumentId = currentInstrument.Id,
                    Location = currentLocation,
                    Instrument = currentInstrument,
                    Title = "Current user session",
                    Summary = "Current summary",
                    Conditions = "Current conditions",
                    Seeing = 3,
                    Transparency = 4,
                    LimitingMagnitude = 5.5m,
                    ReportText = "Current user report\r\n#1-1-2\r\nReport ending"
                },
                new ObsSession
                {
                    Id = 2,
                    UserId = OtherUserId,
                    Date = new DateTime(2024, 1, 3),
                    LocationId = otherLocation.Id,
                    InstrumentId = otherInstrument.Id,
                    Location = otherLocation,
                    Instrument = otherInstrument,
                    Title = "Other user session",
                    ReportText = "Other user report"
                });
            _dbContext.Observations.AddRange(
                new Observation
                {
                    Id = 1,
                    UserId = TestUserId,
                    ObsSessionId = 1,
                    Identifier = "#1-1-2",
                    Text = "Current observation text",
                    DisplayOrder = 7,
                    InstrumentId = observationInstrument.Id,
                    Instrument = observationInstrument,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { ObservationId = 1, DsoId = 1, DisplayOrder = 1, NonDetection = false },
                        new DsoObservation { ObservationId = 1, DsoId = 2, DisplayOrder = 2, NonDetection = true }
                    },
                    ObsResources = new List<ObsResource>
                    {
                        new ObsResource { Id = 1, UserId = TestUserId, ObservationId = 1, Name = "Photo one", Type = "image", Url = "https://example.test/photo" },
                        new ObsResource { Id = 2, UserId = TestUserId, ObservationId = 1, Name = "Article one", Type = "link", Url = "https://example.test/article" },
                        new ObsResource { Id = 3, UserId = TestUserId, ObservationId = 1, Name = "Sketch one", Type = "sketch", Url = "drive-sketch-id" }
                    }
                },
                new Observation
                {
                    Id = 2,
                    UserId = OtherUserId,
                    ObsSessionId = 2,
                    Identifier = "#2-3",
                    Text = "Other user observation",
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { ObservationId = 2, DsoId = 3, DisplayOrder = 1, NonDetection = false }
                    }
                });
            _dbContext.SaveChanges();
        }

        /// <summary>
        /// Creates a minimal SAC object with all required columns populated for SQLite tests.
        /// </summary>
        private static Dso CreateDso(int id, string name)
        {
            return new Dso
            {
                Id = id,
                Catalog = "NGC",
                CatalogNumber = id.ToString(),
                Name = name,
                Type = "GALXY",
                Con = "ORI",
                RA = "00 00",
                DEC = "+00 00",
                Mag = "10",
                SB = "10",
                U2K = 1,
                TI = 1
            };
        }

        /// <summary>
        /// Creates a minimal Herschel row linked to a SAC object for export status checks.
        /// </summary>
        private static H2500 CreateHerschelObject(int id, string herschelNo, string name, bool h400, int dsoId)
        {
            return new H2500
            {
                HerschelId = id,
                HerschelNo = herschelNo,
                Cat = "NGC",
                CatNo = id,
                Name = name,
                Type = "GALXY",
                H400 = h400,
                Const = "ORI",
                SacDeepSkyObjectsId = dsoId
            };
        }
    }
}
