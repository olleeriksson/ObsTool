using System;
using System.Collections.Generic;
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
using Moq;
using NUnit.Framework;
using ObsTool;
using ObsTool.Controllers;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;

namespace TestProject
{
    [TestFixture]
    public class InstrumentsControllerTests
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private InstrumentsController _controller;

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
            SeedUser();
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void Get_ReturnsInstrumentReferenceCounts()
        {
            var referencedInstrumentId = SeedInstrument("Used scope");
            var unusedInstrumentId = SeedInstrument("Unused scope");
            var obsSessionId = SeedObsSession(referencedInstrumentId);
            SeedObservation(obsSessionId, referencedInstrumentId);
            SeedObservation(obsSessionId, referencedInstrumentId);

            var result = (OkObjectResult)_controller.Get();
            var instruments = ((IEnumerable<InstrumentDto>)result.Value).ToArray();

            var referencedInstrument = instruments.Single(instrument => instrument.Id == referencedInstrumentId);
            Assert.That(referencedInstrument.NumObservationReferences, Is.EqualTo(2));
            Assert.That(referencedInstrument.NumObsSessionReferences, Is.EqualTo(1));
            Assert.That(referencedInstrument.NumReferences, Is.EqualTo(3));
            Assert.That(instruments.Single(instrument => instrument.Id == unusedInstrumentId).NumReferences, Is.EqualTo(0));
        }

        [Test]
        public void Delete_ReturnsBadRequestWhenInstrumentHasObservationReferences()
        {
            var instrumentId = SeedInstrument("Used scope");
            var obsSessionId = SeedObsSession();
            SeedObservation(obsSessionId, instrumentId);

            var result = (BadRequestObjectResult)_controller.Delete(instrumentId);

            Assert.That(result.Value, Is.EqualTo("There is 1 observation referring to this instrument. Cannot delete."));
            Assert.That(_dbContext.Instruments.Any(instrument => instrument.Id == instrumentId), Is.True);
        }

        [Test]
        public void Delete_ReturnsBadRequestWhenInstrumentHasObsSessionReferences()
        {
            var instrumentId = SeedInstrument("Session scope");
            SeedObsSession(instrumentId);

            var result = (BadRequestObjectResult)_controller.Delete(instrumentId);

            Assert.That(result.Value, Is.EqualTo("There is 1 observation session referring to this instrument. Cannot delete."));
            Assert.That(_dbContext.Instruments.Any(instrument => instrument.Id == instrumentId), Is.True);
        }

        [Test]
        public void Delete_RemovesUnreferencedInstrument()
        {
            var instrumentId = SeedInstrument("Unused scope");

            var result = _controller.Delete(instrumentId);

            Assert.That(result, Is.TypeOf<OkResult>());
            Assert.That(_dbContext.Instruments.Any(instrument => instrument.Id == instrumentId), Is.False);
        }

        // Creates the controller with a real repository so reference behavior is tested through EF.
        private InstrumentsController CreateController()
        {
            var mapper = new MapperConfiguration(c => c.AddProfile<AutoMapperProfile>(), NullLoggerFactory.Instance).CreateMapper();
            return new InstrumentsController(
                new InstrumentsRepo(_dbContext),
                CreateCurrentUserService(),
                mapper);
        }

        // Builds an authenticated request context scoped to the seeded test user.
        private static CurrentUserService CreateCurrentUserService()
        {
            var httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(AuthClaimTypes.UserId, "1") }))
                }
            };
            return new CurrentUserService(httpContextAccessor);
        }

        // Seeds the authenticated user required by the instrument/session/observation foreign keys.
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

        // Adds one user-owned instrument and returns its generated id.
        private int SeedInstrument(string name)
        {
            var instrument = new Instrument
            {
                UserId = 1,
                Name = name
            };
            _dbContext.Instruments.Add(instrument);
            _dbContext.SaveChanges();
            return instrument.Id;
        }

        // Adds one session so observations satisfy the composite session foreign key.
        private int SeedObsSession(int? instrumentId = null)
        {
            var obsSession = new ObsSession
            {
                UserId = 1,
                InstrumentId = instrumentId,
                Date = DateTime.Today,
                Title = "Session",
                ReportText = ""
            };
            _dbContext.ObsSessions.Add(obsSession);
            _dbContext.SaveChanges();
            return obsSession.Id;
        }

        // Adds one observation that directly references the supplied instrument.
        private void SeedObservation(int obsSessionId, int instrumentId)
        {
            _dbContext.Observations.Add(new Observation
            {
                UserId = 1,
                ObsSessionId = obsSessionId,
                InstrumentId = instrumentId,
                Text = "Observed target"
            });
            _dbContext.SaveChanges();
        }
    }
}
