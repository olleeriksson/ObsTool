using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using Moq;
using ObsTool;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Data.Sqlite;

namespace TestProject
{
    [TestFixture]
    public class StatisticsServiceCatalogProgressTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private StatisticsService _statisticsService;
        private const int TestUserId = 1;

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

            _statisticsService = new StatisticsService(_dbContext);
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void GetCatalogProgressStatistics_SeparatesDetectedObjectsFromNonDetectedObjects()
        {
            SeedConstellationsAndDsos();
            SeedHerschelObjects();
            SeedObservations();

            var statistics = _statisticsService.GetCatalogProgressStatistics(TestUserId);

            Assert.That(statistics.H2500.Total, Is.EqualTo(5));
            Assert.That(statistics.H2500.Observed, Is.EqualTo(2));
            Assert.That(statistics.H2500.NonDetections, Is.EqualTo(2));

            Assert.That(statistics.H400.Total, Is.EqualTo(2));
            Assert.That(statistics.H400.Observed, Is.EqualTo(1));
            Assert.That(statistics.H400.NonDetections, Is.EqualTo(1));
        }

        [Test]
        public void GetCatalogProgressStatistics_IncludesGeneralObservedObjectsByConstellation()
        {
            SeedConstellationsAndDsos();
            SeedHerschelObjects();
            SeedObservations();

            var constellations = _statisticsService.GetCatalogProgressStatistics(TestUserId).Constellations.ToList();

            Assert.That(constellations[0].Constellation, Is.EqualTo("Orion"));
            Assert.That(constellations[0].H2500.Total - constellations[0].H2500.Observed, Is.EqualTo(2));
            Assert.That(constellations.Count(c => c.Constellation == "Orion"), Is.EqualTo(1));
            Assert.That(constellations.Single(c => c.Constellation == "Cygnus").Observed, Is.EqualTo(1));
            Assert.That(constellations.Single(c => c.Constellation == "Lyra").Observed, Is.EqualTo(1));
        }

        [Test]
        public void GetNumObservedH2500Objects_ExcludesLegacySectionNonDetections()
        {
            SeedConstellationsAndDsos();
            SeedHerschelObjects();
            SeedObservations();

            Assert.That(_statisticsService.GetNumObservedH2500Objects(TestUserId, includeNonDetections: false), Is.EqualTo(2));
            Assert.That(_statisticsService.GetNumObservedH2500Objects(TestUserId, includeNonDetections: true), Is.EqualTo(4));
        }

        [Test]
        public void GetH2500ObjectsForConstellationMap_ReturnsLinkedObjectsWithCoordinates()
        {
            SeedConstellationsAndDsos();
            SeedHerschelObjects();
            SeedObservations();

            var objects = _statisticsService.GetH2500ObjectsForConstellationMap("Orion", TestUserId).ToList();

            Assert.That(objects.Select(o => o.HerschelId), Is.EqualTo(new[] { 1, 2 }));
            Assert.That(objects[0].Name, Is.EqualTo("NGC 1"));
            Assert.That(objects[0].RA, Is.EqualTo("00 00"));
            Assert.That(objects[0].DEC, Is.EqualTo("+00 00"));
            Assert.That(objects[0].HerschelNo, Is.EqualTo("H 1"));
            Assert.That(objects[0].IsObserved, Is.True);
            Assert.That(objects[1].IsObserved, Is.False);
        }

        private void SeedConstellationsAndDsos()
        {
            _dbContext.Constellations.AddRange(
                new Constellation("Orion", "Ori"),
                new Constellation("Andromeda", "And"),
                new Constellation("Cygnus", "Cyg"),
                new Constellation("Lyra", "Lyr")
            );
            _dbContext.Dso.AddRange(
                CreateDso(1, "ORI"),
                CreateDso(2, "ORI"),
                CreateDso(3, "AND"),
                CreateDso(4, "CYG"),
                CreateDso(6, "LYR")
            );
            _dbContext.SaveChanges();
        }

        private void SeedHerschelObjects()
        {
            _dbContext.H2500.AddRange(
                CreateH2500Object(1, 1, true, "Orion"),
                CreateH2500Object(2, 2, false, "Orion"),
                CreateH2500Object(3, 3, true, "Andromeda"),
                CreateH2500Object(4, 1, false, "Cygnus"),
                CreateH2500Object(5, null, false, "Orion")
            );
            _dbContext.SaveChanges();
        }

        private void SeedObservations()
        {
            _dbContext.Observations.AddRange(
                new Observation
                {
                    Identifier = "1-1",
                    ObsSessionId = 1,
                    UserId = TestUserId,
                    NonDetection = false,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 1, CustomObjectName = "", NonDetection = false }
                    }
                },
                new Observation
                {
                    Identifier = "1-2",
                    ObsSessionId = 1,
                    UserId = TestUserId,
                    NonDetection = false,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 2, CustomObjectName = "", NonDetection = true }
                    }
                },
                new Observation
                {
                    Identifier = "1-3",
                    ObsSessionId = 1,
                    UserId = TestUserId,
                    NonDetection = true,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 3, CustomObjectName = "", NonDetection = false }
                    }
                },
                new Observation
                {
                    Identifier = "1-6",
                    ObsSessionId = 1,
                    UserId = TestUserId,
                    NonDetection = false,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 4, CustomObjectName = "", NonDetection = false },
                        new DsoObservation { DsoId = 6, CustomObjectName = "", NonDetection = false }
                    }
                }
            );
            _dbContext.SaveChanges();
        }

        private static H2500 CreateH2500Object(int herschelId, int? sacDeepSkyObjectsId, bool h400, string constellation)
        {
            return new H2500
            {
                HerschelId = herschelId,
                HerschelNo = $"H {herschelId}",
                Cat = "NGC",
                CatNo = herschelId,
                H400 = h400,
                Const = constellation.Substring(0, 3),
                SacDeepSkyObjectsId = sacDeepSkyObjectsId
            };
        }

        private static Dso CreateDso(int id, string constellation)
        {
            return new Dso
            {
                Id = id,
                Catalog = "NGC",
                CatalogNumber = id.ToString(),
                Name = $"NGC {id}",
                Type = "GALXY",
                Con = constellation,
                RA = "00 00",
                DEC = "+00 00",
                Mag = "10",
                SB = "10",
                U2K = 1,
                TI = 1
            };
        }
    }
}
