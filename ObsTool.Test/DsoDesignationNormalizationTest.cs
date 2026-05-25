using System;
using System.Linq;
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

namespace TestProject
{
    [TestFixture]
    public class DsoDesignationNormalizationTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private DsoRepo _repo;

        [SetUp]
        public void Setup()
        {
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["Db:Migrate"]).Returns("false");
            Startup.Configuration = configMock.Object;

            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<MainDbContext>()
                .UseSqlite(_connection)
                .Options;

            _dbContext = new MainDbContext(options, new Mock<ILogger<MainDbContext>>().Object);
            _dbContext.Database.EnsureCreated();
            _repo = new DsoRepo(_dbContext);
            SeedDsoRows();
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [TestCase("Sh2-276")]
        [TestCase("Sh2 276")]
        [TestCase("Sh 2-276")]
        [TestCase("sh2-276")]
        public void GetDsoByName_MatchesFlexibleSh2Formats(string name)
        {
            Dso dso = _repo.GetDsoByName(name);

            Assert.That(dso?.Id, Is.EqualTo(1));
        }

        [TestCase("M3-4")]
        [TestCase("M3- 4")]
        [TestCase("M 3-4")]
        public void GetDsoByName_MatchesMinkowskiAliasWithoutReturningMessier(string name)
        {
            Dso dso = _repo.GetDsoByName(name);

            Assert.That(dso?.Id, Is.EqualTo(2));
        }

        [TestCase("MCG 5-1-66", 4)]
        [TestCase("MCG 5- 1- 66", 4)]
        [TestCase("MCG +05-01-066", 4)]
        [TestCase("ESO 434-6", 5)]
        [TestCase("ESO 434- 6", 5)]
        [TestCase("ESO 434-006", 5)]
        [TestCase("ESO 373-G 8", 6)]
        [TestCase("ESO 284-8A", 8)]
        public void GetDsoByName_MatchesMcgAndEsoFormats(string name, int expectedId)
        {
            Dso dso = _repo.GetDsoByName(name);

            Assert.That(dso?.Id, Is.EqualTo(expectedId));
        }

        [TestCase("PK 241-7.1", 9)]
        [TestCase("Haro 2-7", 10)]
        [TestCase("He2-180", 11)]
        public void GetDsoByName_MatchesRemainingWhitespaceOnlyAliases(string name, int expectedId)
        {
            Dso dso = _repo.GetDsoByName(name);

            Assert.That(dso?.Id, Is.EqualTo(expectedId));
        }

        [TestCase("Sh2", 1)]
        [TestCase("Sh 2-276", 1)]
        [TestCase("M 3-4", 2)]
        [TestCase("MCG 5-1-66", 4)]
        [TestCase("ESO 434-6", 5)]
        public void GetMultipleDsoByQueryString_MatchesFlexibleFormats(string query, int expectedId)
        {
            var ids = _repo.GetMultipleDsoByQueryString(query)
                .Select(dso => dso.Id)
                .ToList();

            Assert.That(ids, Does.Contain(expectedId));
        }

        [Test]
        public void GetMultipleDsoByQueryString_DoesNotTreatMinkowskiAliasAsMessierObject()
        {
            var ids = _repo.GetMultipleDsoByQueryString("M 3-4")
                .Select(dso => dso.Id)
                .ToList();

            Assert.That(ids, Does.Contain(2));
            Assert.That(ids, Does.Not.Contain(3));
        }

        [Test]
        public void ReportTextParser_MatchesFlexibleCatalogFormats()
        {
            var reportTextManager = new ReportTextManager(null, null, _repo, null, null);
            var obsSession = new ObsSession
            {
                Id = 99,
                Date = DateTime.Now,
                ReportText = "Sh2-276, M 3-4, MCG 5- 1- 66, ESO 434- 6, ESO 373-G 8, and NGC 6845C were observed."
            };

            var observationsMap = reportTextManager.Parse(obsSession);
            Assert.That(observationsMap.Count, Is.EqualTo(1));

            var dsoIds = observationsMap.Single().Value.DsoObservations
                .Select(dsoObservation => dsoObservation.DsoId)
                .ToList();

            Assert.That(dsoIds, Is.EquivalentTo(new[] { 1, 2, 4, 5, 6, 8 }));
        }

        /// <summary>
        /// Seeds compact catalog rows that exercise designation formatting without relying on the real dev database.
        /// </summary>
        private void SeedDsoRows()
        {
            _dbContext.Dso.AddRange(new[]
            {
                CreateDso(1, "Sh2", "276", "Sh2-276"),
                CreateDso(2, "PK", "241+2.1", "PK 241+2.1", "M3-4"),
                CreateDso(3, "M", "34", "M 34", "NGC 1039"),
                CreateDso(4, "NGC", "69", "NGC 69", "MCG +05-01-066"),
                CreateDso(5, "NGC", "2904", "NGC 2904", "ESO 434-006"),
                CreateDso(6, "ESO", "373-G008", "ESO 373-G008"),
                CreateDso(7, "MCG", "+00-00-001", "MCG +00-00-001"),
                CreateDso(8, "NGC", "6845C", "NGC 6845C", "ESO 284-008A"),
                CreateDso(9, "PK", "241-7.1", "PK 241-7.1", "PK 241- 7.1"),
                CreateDso(10, "Haro", "2-7", "Haro 2-7", "Haro 2- 7"),
                CreateDso(11, "He", "2-180", "He 2-180", "He 2-180")
            });
            _dbContext.SaveChanges();
        }

        /// <summary>
        /// Creates the minimum valid DSO entity needed by the EF model for lookup tests.
        /// </summary>
        private static Dso CreateDso(int id, string catalog, string catalogNumber, string name, string otherNames = null)
        {
            return new Dso
            {
                Id = id,
                Catalog = catalog,
                CatalogNumber = catalogNumber,
                Name = name,
                OtherNames = otherNames,
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
    }
}
