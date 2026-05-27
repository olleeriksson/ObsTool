using NUnit.Framework;
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
    }
}
