using ObsTool.Controllers;
using NUnit.Framework;
using System;
using ObsTool.Entities;
using ObsTool.Utils;
using System.Linq;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using ObsTool;
using ObsTool.Database;
using ObsTool.Models;
using ObsTool.Services;

namespace TestProject
{
    [TestFixture]
    public class ObsSessionsControllerTests
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private ObsSessionsController _controller;

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
            _controller = CreateController();
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        //[Test]
        //public void testDummyMethod()
        //{
            //ObsSessionsController obsSessionsController = new ObsSessionsController(null, null, null, null, null, null, null, null);
            //string result = obsSessionsController.dummyMethod();

            //Assert.AreEqual(expected, result);
            //Assert.That(result, Is.EqualTo(expected));
        //}

        [Test]
        public void Post_ReturnsHerschelBadgesForParsedReportObjects()
        {
            SeedUser();
            SeedDsoWithHerschelObject();

            var result = (CreatedAtRouteResult)_controller.Post(new ObsSessionDtoForCreation
            {
                Date = DateTime.Today,
                Title = "New session",
                ReportText = "NGC 6440 was obvious tonight."
            });

            var obsSession = (ObsSessionDto)result.Value;
            var dso = obsSession.Observations.Single().DsoObservations.Single().Dso;

            Assert.That(dso.HerschelObjects, Has.Length.EqualTo(1));
            Assert.That(dso.HerschelObjects[0].HerschelNo, Is.EqualTo("H I-150"));
        }

        [Test]
        public void Put_ReturnsHerschelBadgesForParsedReportObjects()
        {
            SeedUser();
            SeedDsoWithHerschelObject();
            var obsSessionId = SeedObsSession();

            var result = (OkObjectResult)_controller.Put(obsSessionId, new ObsSessionDtoForUpdate
            {
                Date = DateTime.Today,
                Title = "Updated session",
                ReportText = "NGC 6440 was obvious tonight."
            });

            var obsSession = (ObsSessionDto)result.Value;
            var dso = obsSession.Observations.Single().DsoObservations.Single().Dso;

            Assert.That(dso.HerschelObjects, Has.Length.EqualTo(1));
            Assert.That(dso.HerschelObjects[0].HerschelNo, Is.EqualTo("H I-150"));
        }

        [Test]
        public void Put_ThrowsWhenIdentifiedObservationWithResourcesNoLongerMatches()
        {
            SeedUser();
            SeedDso(1234, "NGC", "1234", "NGC 1234");
            var obsSessionId = SeedObsSession();
            var identifier = $"{obsSessionId}-1234";
            var reportText = $"NGC 9999 used to resolve through an old alias.\n#{identifier}";

            SeedObservation(
                obsSessionId,
                identifier,
                "NGC 9999 used to resolve through an old alias.",
                new[] { 1234 },
                new ObsResource { UserId = 1, Type = "image", Url = "https://example.com/old-resource.jpg" });

            var exception = Assert.Throws<ObsToolException>(() => _controller.Put(obsSessionId, new ObsSessionDtoForUpdate
            {
                Date = DateTime.Today,
                Title = "Updated session",
                ReportText = reportText
            }));

            Assert.That(exception.Message, Does.Contain("Save aborted"));
            Assert.That(_dbContext.Observations.Count(), Is.EqualTo(1));
            Assert.That(_dbContext.DsoObservations.Count(), Is.EqualTo(1));
            Assert.That(_dbContext.ObsResources.Count(), Is.EqualTo(1));
            Assert.That(_dbContext.Observations.Single().Identifier, Is.EqualTo(identifier));
        }

        [Test]
        public void Put_RetainsIdentifiedObservationWithoutResourcesAsUnmatchedWhenReportDsoNoLongerMatches()
        {
            SeedUser();
            SeedDso(1234, "NGC", "1234", "NGC 1234");
            var obsSessionId = SeedObsSession();
            var identifier = $"{obsSessionId}-1234";
            var reportText = $"NGC 9999 used to resolve through an old alias.\n#{identifier}";

            SeedObservation(
                obsSessionId,
                identifier,
                "NGC 9999 used to resolve through an old alias.",
                new[] { 1234 });

            _controller.Put(obsSessionId, new ObsSessionDtoForUpdate
            {
                Date = DateTime.Today,
                Title = "Updated session",
                ReportText = reportText
            });

            Assert.That(_dbContext.Observations.Count(), Is.EqualTo(1));
            Assert.That(_dbContext.DsoObservations.Count(), Is.EqualTo(0));
            Assert.That(_dbContext.Observations.Single().Identifier, Is.EqualTo(identifier));
        }

        [Test]
        public void Put_RemovesExistingDsoObservationWithoutResourcesWhenIdentifiedSectionHasUnmatchedDsoName()
        {
            SeedUser();
            SeedDso(6440, "NGC", "6440", "NGC 6440");
            SeedDso(9998, "NGC", "9998", "NGC 9998");
            var obsSessionId = SeedObsSession();
            var identifier = $"{obsSessionId}-6440-9998";
            var reportText = $"NGC 6440 and NGC 9999 were observed together.\n#{identifier}";

            SeedObservation(
                obsSessionId,
                identifier,
                "NGC 6440 and NGC 9999 were observed together.",
                new[] { 6440, 9998 });

            _controller.Put(obsSessionId, new ObsSessionDtoForUpdate
            {
                Date = DateTime.Today,
                Title = "Updated session",
                ReportText = reportText
            });

            var dsoIds = _dbContext.DsoObservations
                .AsNoTracking()
                .Select(dsoObservation => dsoObservation.DsoId)
                .OrderBy(id => id)
                .ToArray();

            Assert.That(dsoIds, Is.EqualTo(new[] { 6440 }));
        }

        [Test]
        public void Put_ThrowsWhenIdentifiedSectionWithResourcesHasUnmatchedDsoName()
        {
            SeedUser();
            SeedDso(6440, "NGC", "6440", "NGC 6440");
            SeedDso(9998, "NGC", "9998", "NGC 9998");
            var obsSessionId = SeedObsSession();
            var identifier = $"{obsSessionId}-6440-9998";
            var reportText = $"NGC 6440 and NGC 9999 were observed together.\n#{identifier}";

            SeedObservation(
                obsSessionId,
                identifier,
                "NGC 6440 and NGC 9999 were observed together.",
                new[] { 6440, 9998 },
                new ObsResource { UserId = 1, Type = "image", Url = "https://example.com/group-resource.jpg" });

            var exception = Assert.Throws<ObsToolException>(() => _controller.Put(obsSessionId, new ObsSessionDtoForUpdate
            {
                Date = DateTime.Today,
                Title = "Updated session",
                ReportText = reportText
            }));

            var dsoIds = _dbContext.DsoObservations
                .AsNoTracking()
                .Select(dsoObservation => dsoObservation.DsoId)
                .OrderBy(id => id)
                .ToArray();

            Assert.That(exception.Message, Does.Contain("Save aborted"));
            Assert.That(dsoIds, Is.EqualTo(new[] { 6440, 9998 }));
            Assert.That(_dbContext.ObsResources.Count(), Is.EqualTo(1));
        }

        [Test]
        public void Put_PreservesResourcesWhenIdentifierRemovedFromLowercaseCatalogSection()
        {
            SeedUser();
            SeedDso(100, "M", "100", "M 100");
            SeedDso(101, "M", "101", "M 101");
            var obsSessionId = SeedObsSession();
            var identifier = $"{obsSessionId}-100-101";
            var observationId = SeedObservation(
                obsSessionId,
                identifier,
                "klsdlk m100 sdflkj m101",
                new[] { 100, 101 },
                new ObsResource { UserId = 1, Type = "sketch", Url = "https://example.com/sketch.jpg" });

            _controller.Put(obsSessionId, new ObsSessionDtoForUpdate
            {
                Date = DateTime.Today,
                Title = "Updated session",
                ReportText = "klsdlk m100 sdflkj m101"
            });

            var observation = _dbContext.Observations
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations)
                .Single();

            Assert.That(observation.Id, Is.EqualTo(observationId));
            Assert.That(observation.Identifier, Is.EqualTo(identifier));
            Assert.That(observation.ObsResources.Count, Is.EqualTo(1));
            Assert.That(observation.DsoObservations.Select(dsoObservation => dsoObservation.DsoId).OrderBy(id => id).ToArray(), Is.EqualTo(new[] { 100, 101 }));
        }

        [Test]
        public void Put_ThrowsWhenObservationWithResourcesWouldBeDeletedAfterIdentifierRemoval()
        {
            SeedUser();
            SeedDso(100, "M", "100", "M 100");
            var obsSessionId = SeedObsSession();
            var staleIdentifier = $"{obsSessionId}-9999";
            SeedObservation(
                obsSessionId,
                staleIdentifier,
                "M 100 used to be stored under a stale identifier.",
                new[] { 100 },
                new ObsResource { UserId = 1, Type = "sketch", Url = "https://example.com/stale-sketch.jpg" });

            var exception = Assert.Throws<ObsToolException>(() => _controller.Put(obsSessionId, new ObsSessionDtoForUpdate
            {
                Date = DateTime.Today,
                Title = "Updated session",
                ReportText = "M 100 used to be stored under a stale identifier."
            }));

            Assert.That(exception.Message, Does.Contain("would be removed or replaced"));
            Assert.That(_dbContext.Observations.Count(), Is.EqualTo(1));
            Assert.That(_dbContext.ObsResources.Count(), Is.EqualTo(1));
            Assert.That(_dbContext.Observations.Single().Identifier, Is.EqualTo(staleIdentifier));
        }

        [Test]
        public void testPrintPoco()
        {
            ObsSession obsSession = new ObsSession
            {
                Id = 5,
                Date = DateTime.Now,
                Location = new Location
                {
                    Id = 6,
                    Name = "Some location",
                    GoogleMapsAddress = "Some address"
                },
                LocationId = 10,
                Title = "A great title",
                Summary = "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary "
                    + "Summary Summary Summary Summary Summary Summary Summary Summary Summary Summary ",
                ReportText = "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text "
                    + "Report text Report text Report text Report text Report text Report text Report text ",
            };

            string text = PocoPrinter.ToString(obsSession);
            Console.WriteLine(text);
        }

        private ObsSessionsController CreateController()
        {
            // The controller save endpoints are tested through the real parser/repos so the response shape matches runtime behavior.
            var mapper = new MapperConfiguration(c => c.AddProfile<AutoMapperProfile>(), NullLoggerFactory.Instance).CreateMapper();
            var obsSessionsRepo = new ObsSessionsRepo(_dbContext);
            var locationsRepo = new LocationsRepo(_dbContext);
            var instrumentsRepo = new InstrumentsRepo(_dbContext);
            var dsoRepo = new DsoRepo(_dbContext);
            var h2500Repo = new H2500Repo(_dbContext);
            var observationsRepo = new ObservationsRepo(_dbContext);
            var dsoObservationsRepo = new DsoObservationsRepo(_dbContext);
            var reportTextManager = new ReportTextManager(
                _dbContext,
                observationsRepo,
                dsoRepo,
                NullLogger<ReportTextManager>.Instance,
                dsoObservationsRepo,
                instrumentsRepo);
            var observationsService = new ObservationsService(observationsRepo, obsSessionsRepo, _dbContext, mapper);
            var systemEventService = new SystemEventService(
                _dbContext,
                Mock.Of<IMailService>(),
                Options.Create(new AdminNotificationOptions()),
                NullLogger<SystemEventService>.Instance);

            return new ObsSessionsController(
                NullLogger<ObsSessionsController>.Instance,
                _dbContext,
                obsSessionsRepo,
                locationsRepo,
                instrumentsRepo,
                dsoRepo,
                h2500Repo,
                reportTextManager,
                observationsService,
                CreateCurrentUserService(),
                systemEventService,
                mapper);
        }

        private static CurrentUserService CreateCurrentUserService()
        {
            // Save endpoints require the authenticated user id claim to scope created and updated sessions.
            var httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(AuthClaimTypes.UserId, "1") }))
                }
            };
            return new CurrentUserService(httpContextAccessor);
        }

        private void SeedUser()
        {
            _dbContext.Users.Add(new AppUser
            {
                Id = 1,
                Email = "user@example.com",
                NormalizedEmail = "USER@EXAMPLE.COM",
                Username = "user",
                NormalizedUsername = "USER",
                FullName = "Test User",
                PasswordHash = "hash",
                CreatedUtc = DateTime.UtcNow
            });
            _dbContext.SaveChanges();
        }

        private int SeedObsSession()
        {
            var obsSession = new ObsSession
            {
                UserId = 1,
                Date = DateTime.Today,
                Title = "Existing session",
                ReportText = ""
            };
            _dbContext.ObsSessions.Add(obsSession);
            _dbContext.SaveChanges();
            return obsSession.Id;
        }

        private void SeedDsoWithHerschelObject()
        {
            SeedDso(6440, "NGC", "6440", "NGC 6440");
            _dbContext.H2500.Add(new H2500
            {
                HerschelId = 150,
                HerschelNo = "H I-150",
                Cat = "NGC",
                CatNo = 6440,
                H400 = true,
                SacDeepSkyObjectsId = 6440
            });
            _dbContext.SaveChanges();
        }

        private void SeedDso(int id, string catalog, string catalogNumber, string name)
        {
            // Tests only need the required catalog fields, but the real entity maps several SAC columns as required.
            _dbContext.Dso.Add(new Dso
            {
                Id = id,
                Catalog = catalog,
                CatalogNumber = catalogNumber,
                Name = name,
                OtherNames = "",
                CommonName = "",
                AllCommonNames = "",
                Type = "GLOCL",
                Con = "SGR",
                RA = "17 48",
                DEC = "-20 21",
                Mag = "10",
                SB = "10",
                U2K = 1,
                TI = 1
            });
            _dbContext.SaveChanges();
        }

        private int SeedObservation(
            int obsSessionId,
            string identifier,
            string text,
            int[] dsoIds,
            ObsResource obsResource = null)
        {
            // Seed through the aggregate shape used at runtime so EF creates the child rows with the observation.
            var observation = new Observation
            {
                UserId = 1,
                ObsSessionId = obsSessionId,
                Identifier = identifier,
                Text = text,
                DisplayOrder = 0
            };

            for (int index = 0; index < dsoIds.Length; index++)
            {
                observation.DsoObservations.Add(new DsoObservation
                {
                    DsoId = dsoIds[index],
                    DisplayOrder = index
                });
            }

            if (obsResource != null)
            {
                observation.ObsResources.Add(obsResource);
            }

            _dbContext.Observations.Add(observation);
            _dbContext.SaveChanges();
            return observation.Id;
        }
    }
}
