using NUnit.Framework;
using System;
using System.Collections.Generic;
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
    public class StatisticsServiceObservationCountsTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private StatisticsService _statisticsService;
        private const int TestUserId = 1;

        [SetUp]
        public void Setup()
        {
            // MainDbContext reads Startup.Configuration in its constructor
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["Db:Migrate"]).Returns("false");
            Startup.Configuration = configMock.Object;

            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            // FK enforcement is irrelevant here — we're testing counting logic,
            // not referential integrity, so skip the need to insert Dso/ObsSession rows.
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
        public void testNonDetectionCount_ObservervationSectionWithTwoGroúps()
        {
            // Non-detected section with 2 DSOs — both DSOs count as non-detections.
            // Normal section with 1 DSO — does not count.
            _dbContext.Observations.AddRange(
                new Observation
                {
                    Identifier = "1-1-2",
                    NonDetection = true,
                    UserId = TestUserId,
                    ObsSessionId = 1,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 1 },
                        new DsoObservation { DsoId = 2 }
                    }
                },
                new Observation
                {
                    Identifier = "1-3",
                    NonDetection = false,
                    UserId = TestUserId,
                    ObsSessionId = 1,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 3 }
                    }
                }
            );
            _dbContext.SaveChanges();

            Assert.That(_statisticsService.GetNumNonDetections(TestUserId), Is.EqualTo(2));
        }

        [Test]
        public void testNonDetectionCount_ObservationGroupAndIndividualDso()
        {
            // Non-detected section with 2 DSOs — contributes 2.
            // Normal section with 2 DSOs, one of which is individually non-detected — contributes 1.

            // Expected total: 3.
            _dbContext.Observations.AddRange(
                new Observation
                {
                    Identifier = "1-1-2",
                    NonDetection = true,
                    UserId = TestUserId,
                    ObsSessionId = 1,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 1 },
                        new DsoObservation { DsoId = 2 }
                    }
                },
                new Observation
                {
                    Identifier = "1-3-4",
                    NonDetection = false,
                    UserId = TestUserId,
                    ObsSessionId = 1,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 3, NonDetection = true },
                        new DsoObservation { DsoId = 4, NonDetection = false }
                    }
                }
            );
            _dbContext.SaveChanges();

            Assert.That(_statisticsService.GetNumNonDetections(TestUserId), Is.EqualTo(3));
        }

        [Test]
        public void testDetectionAndNonDetectionCounts_DetectionWinsForSameDso()
        {
            _dbContext.Observations.AddRange(
                new Observation
                {
                    Identifier = "1-1-nondetection",
                    NonDetection = true,
                    UserId = TestUserId,
                    ObsSessionId = 1,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 1 }
                    }
                },
                new Observation
                {
                    Identifier = "1-1-detection",
                    NonDetection = false,
                    UserId = TestUserId,
                    ObsSessionId = 2,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 1 }
                    }
                },
                new Observation
                {
                    Identifier = "1-2-nondetection",
                    NonDetection = false,
                    UserId = TestUserId,
                    ObsSessionId = 3,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { DsoId = 2, NonDetection = true }
                    }
                }
            );
            _dbContext.SaveChanges();

            Assert.That(_statisticsService.GetNumDetections(TestUserId), Is.EqualTo(1));
            Assert.That(_statisticsService.GetNumNonDetections(TestUserId), Is.EqualTo(1));
        }

        [Test]
        public void GetStatistics_ExcludesMostRecentSessionsByDate()
        {
            // The session exclusion is date-based, so the newest user session is ignored while older sessions remain counted.
            _dbContext.ObsSessions.AddRange(
                CreateObsSession(1, TestUserId, new DateTime(2024, 1, 1), 10),
                CreateObsSession(2, TestUserId, new DateTime(2024, 1, 3), 11),
                CreateObsSession(3, TestUserId, new DateTime(2024, 1, 2), 10),
                CreateObsSession(4, 2, new DateTime(2024, 1, 4), 12)
            );
            _dbContext.Dso.AddRange(
                CreateDso(1, "M", "GALXY"),
                CreateDso(2, "NGC", "GALXY"),
                CreateDso(3, "NGC", "OPNCL")
            );
            _dbContext.Observations.AddRange(
                CreateObservation(1, 1),
                CreateObservation(3, 2),
                CreateObservation(2, 3)
            );
            _dbContext.SaveChanges();

            var statistics = _statisticsService.GetStatistics(TestUserId, statsExcludeLastSessions: 1);

            Assert.That(statistics.NumObsSessions, Is.EqualTo(2));
            Assert.That(statistics.NumObservations, Is.EqualTo(2));
            Assert.That(statistics.NumObservedObjects, Is.EqualTo(2));
            Assert.That(statistics.NumObservedGalaxies, Is.EqualTo(2));
            Assert.That(statistics.NumObservedOpenClusters, Is.EqualTo(0));
            Assert.That(statistics.NumObservedMessierObjects, Is.EqualTo(1));
            Assert.That(statistics.NumObservedNGCObjects, Is.EqualTo(1));
            Assert.That(statistics.NumLocations, Is.EqualTo(1));
        }

        // Creates a dated session row for statistics exclusion tests.
        private static ObsSession CreateObsSession(int id, int userId, DateTime date, int locationId)
        {
            return new ObsSession
            {
                Id = id,
                UserId = userId,
                Date = date,
                LocationId = locationId,
                Title = $"Session {id}"
            };
        }

        // Creates a single detected observation linked to one DSO.
        private static Observation CreateObservation(int obsSessionId, int dsoId)
        {
            return new Observation
            {
                Identifier = $"{obsSessionId}-{dsoId}",
                NonDetection = false,
                UserId = TestUserId,
                ObsSessionId = obsSessionId,
                DsoObservations = new List<DsoObservation>
                {
                    new DsoObservation { DsoId = dsoId }
                }
            };
        }

        // Creates the minimum DSO row needed for type and catalog statistics.
        private static Dso CreateDso(int id, string catalog, string type)
        {
            return new Dso
            {
                Id = id,
                Catalog = catalog,
                CatalogNumber = id.ToString(),
                Name = $"{catalog} {id}",
                Type = type,
                Con = "ORI",
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
