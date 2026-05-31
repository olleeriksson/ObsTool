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
    public class LocationsControllerTests
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private LocationsController _controller;

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
        public void Get_ReturnsLocationSessionReferenceCounts()
        {
            var referencedLocationId = SeedLocation("Used site");
            var unusedLocationId = SeedLocation("Unused site");
            SeedObsSession(referencedLocationId, DateTime.Today.AddDays(-1));
            SeedObsSession(referencedLocationId, DateTime.Today);

            var result = (OkObjectResult)_controller.Get();
            var locations = ((IEnumerable<LocationDto>)result.Value).ToArray();

            Assert.That(locations.Single(location => location.Id == referencedLocationId).NumReferences, Is.EqualTo(2));
            Assert.That(locations.Single(location => location.Id == unusedLocationId).NumReferences, Is.EqualTo(0));
        }

        [Test]
        public void Delete_ReturnsBadRequestWhenLocationHasSessionReferences()
        {
            var locationId = SeedLocation("Used site");
            SeedObsSession(locationId, DateTime.Today);

            var result = (BadRequestObjectResult)_controller.Delete(locationId);

            Assert.That(result.Value, Is.EqualTo("There is 1 observation session referring to this location. Can not delete."));
            Assert.That(_dbContext.Locations.Any(location => location.Id == locationId), Is.True);
        }

        [Test]
        public void Delete_RemovesUnreferencedLocation()
        {
            var locationId = SeedLocation("Unused site");

            var result = _controller.Delete(locationId);

            Assert.That(result, Is.TypeOf<OkResult>());
            Assert.That(_dbContext.Locations.Any(location => location.Id == locationId), Is.False);
        }

        // Creates the controller with real repositories so location/session reference behavior is tested through EF.
        private LocationsController CreateController()
        {
            var mapper = new MapperConfiguration(c => c.AddProfile<AutoMapperProfile>(), NullLoggerFactory.Instance).CreateMapper();
            return new LocationsController(
                new LocationsRepo(_dbContext),
                new ObsSessionsRepo(_dbContext),
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

        // Seeds the authenticated user required by the location/session foreign keys.
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

        // Adds one user-owned location and returns its generated id.
        private int SeedLocation(string name)
        {
            var location = new Location
            {
                UserId = 1,
                Name = name
            };
            _dbContext.Locations.Add(location);
            _dbContext.SaveChanges();
            return location.Id;
        }

        // Adds one session referencing the supplied location id.
        private void SeedObsSession(int locationId, DateTime date)
        {
            _dbContext.ObsSessions.Add(new ObsSession
            {
                UserId = 1,
                LocationId = locationId,
                Date = date,
                Title = "Session",
                ReportText = ""
            });
            _dbContext.SaveChanges();
        }
    }
}
