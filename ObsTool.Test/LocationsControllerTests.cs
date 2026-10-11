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

        // Confirms report recency overrides frequency while the management ranking stays unchanged.
        [TestCase(false)]
        [TestCase(true)]
        public void Get_UsesRequestedLocationOrdering(bool recentFirst)
        {
            var oldestId = SeedLocation("Oldest site");
            var popularId = SeedLocation("Popular site");
            var newestId = SeedLocation("Newest site");
            var unusedId = SeedLocation("Unused site");
            var date = new DateTime(2026, 10, 10);
            SeedObsSession(oldestId, date.AddDays(-1000));
            for (var i = 0; i < 10; i++)
            {
                SeedObsSession(popularId, date.AddDays(-1));
            }
            SeedObsSession(newestId, date);

            var result = (OkObjectResult)_controller.Get(recentFirst);
            var ids = ((IEnumerable<LocationDto>)result.Value).Select(location => location.Id).ToArray();

            Assert.That(ids, Is.EqualTo(recentFirst
                ? new[] { newestId, popularId, oldestId, unusedId }
                : new[] { popularId, newestId, oldestId, unusedId }));
        }

        // Equal dates use frequency and then descending id; unused sites keep descending id too.
        [Test]
        public void Get_RecentFirstPreservesExistingTieBreakers()
        {
            var popularId = SeedLocation("Popular site");
            var olderId = SeedLocation("Equal-date site A");
            var newerId = SeedLocation("Equal-date site B");
            var unusedOlderId = SeedLocation("Unused site A");
            var unusedNewerId = SeedLocation("Unused site B");
            var date = new DateTime(2026, 10, 10);
            SeedObsSession(popularId, date);
            SeedObsSession(popularId, date);
            SeedObsSession(olderId, date);
            SeedObsSession(newerId, date);

            var result = (OkObjectResult)_controller.Get(recentFirst: true);
            var ids = ((IEnumerable<LocationDto>)result.Value).Select(location => location.Id).ToArray();

            Assert.That(ids, Is.EqualTo(new[] { popularId, newerId, olderId, unusedNewerId, unusedOlderId }));
        }

        // Excludes another user's location and newer session from the current user's results.
        [Test]
        public void Get_RecentFirstUsesOnlyCurrentUserSessions()
        {
            SeedUser(2);
            var oldId = SeedLocation("Old site");
            var recentId = SeedLocation("Recent site");
            var otherUserLocationId = SeedLocation("Other user site", userId: 2);
            var date = new DateTime(2026, 10, 10);
            SeedObsSession(oldId, date.AddDays(-1));
            SeedObsSession(recentId, date);
            SeedObsSession(otherUserLocationId, date.AddDays(1), userId: 2);

            var result = (OkObjectResult)_controller.Get(recentFirst: true);
            var locations = ((IEnumerable<LocationDto>)result.Value).ToArray();

            Assert.That(locations.Select(location => location.Id), Is.EqualTo(new[] { recentId, oldId }));
            Assert.That(locations.All(location => location.NumReferences == 1), Is.True);
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

        // Name-only creation fills required columns, and renaming preserves their existing values.
        [Test]
        public void NameOnlyLocation_CreateAndRenameRetainDatabaseFields()
        {
            var result = (CreatedAtRouteResult)_controller.Post(new LocationDtoForCreation { Name = "New site" });
            var locationId = ((LocationDto)result.Value).Id;
            _dbContext.ChangeTracker.Clear();

            var savedLocation = _dbContext.Locations.Single(location => location.Id == locationId);
            Assert.That(savedLocation.Name, Is.EqualTo("New site"));
            Assert.That(new[] { savedLocation.GoogleMapsAddress, savedLocation.Latitude, savedLocation.Longitude },
                Is.EqualTo(new[] { string.Empty, string.Empty, string.Empty }));

            // Populate the retained columns independently of the name-only API before updating.
            _dbContext.Database.ExecuteSqlInterpolated(
                $"UPDATE Locations SET GoogleMapsAddress = {"Existing address"}, Latitude = {"59.3"}, Longitude = {"18.1"} WHERE Id = {locationId}");
            _dbContext.ChangeTracker.Clear();

            var updateResult = _controller.Put(locationId, new LocationDtoForUpdate { Name = "Renamed site" });
            Assert.That(updateResult, Is.TypeOf<OkObjectResult>());
            _dbContext.ChangeTracker.Clear();

            savedLocation = _dbContext.Locations.Single(location => location.Id == locationId);
            Assert.That(savedLocation.Name, Is.EqualTo("Renamed site"));
            Assert.That(new[] { savedLocation.GoogleMapsAddress, savedLocation.Latitude, savedLocation.Longitude },
                Is.EqualTo(new[] { "Existing address", "59.3", "18.1" }));
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
        private void SeedUser(int userId = 1)
        {
            _dbContext.Users.Add(new AppUser
            {
                Id = userId,
                Email = $"user{userId}@example.com",
                NormalizedEmail = $"USER{userId}@EXAMPLE.COM",
                Username = $"user{userId}",
                NormalizedUsername = $"USER{userId}",
                FullName = "Test User",
                PasswordHash = "hash",
                CreatedUtc = DateTime.UtcNow
            });
            _dbContext.SaveChanges();
        }

        // Adds one user-owned location and returns its generated id.
        private int SeedLocation(string name, int userId = 1)
        {
            var location = new Location
            {
                UserId = userId,
                Name = name
            };
            _dbContext.Locations.Add(location);
            _dbContext.SaveChanges();
            return location.Id;
        }

        // Adds one session referencing the supplied location id.
        private void SeedObsSession(int locationId, DateTime date, int userId = 1)
        {
            _dbContext.ObsSessions.Add(new ObsSession
            {
                UserId = userId,
                LocationId = locationId,
                Date = date,
                Title = "Session",
                ReportText = ""
            });
            _dbContext.SaveChanges();
        }
    }
}
