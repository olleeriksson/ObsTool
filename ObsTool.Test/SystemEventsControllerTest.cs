using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
    public class SystemEventsControllerTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;

        [SetUp]
        public void Setup()
        {
            // MainDbContext reads Startup.Configuration in its constructor.
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
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void GetSystemEvents_AllowsDatabaseUserOne()
        {
            var controller = CreateController(userId: 1, isSuperAdmin: false);

            var result = controller.GetSystemEvents();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public void GetSystemEvents_ForbidsOtherDatabaseUsers()
        {
            var controller = CreateController(userId: 2, isSuperAdmin: false);

            var result = controller.GetSystemEvents();

            Assert.That(result, Is.TypeOf<ForbidResult>());
        }

        [Test]
        public void GetSystemEvents_AllowsConfiguredSuperAdmins()
        {
            var controller = CreateController(userId: null, isSuperAdmin: true);

            var result = controller.GetSystemEvents();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public void GetSystemEvents_ReturnsNewestEventsFirstAndPagesResults()
        {
            AddSystemEvent("old", new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
            AddSystemEvent("newer", new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc));
            AddSystemEvent("newest", new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc));
            var controller = CreateController(userId: 1, isSuperAdmin: false);

            var result = controller.GetSystemEvents(page: 1, pageSize: 2);

            var okResult = result as OkObjectResult;
            var pagedResult = okResult?.Value as PagedResultDto<SystemEventDto>;
            Assert.That(pagedResult, Is.Not.Null);
            Assert.That(pagedResult.Total, Is.EqualTo(3));
            Assert.That(pagedResult.Count, Is.EqualTo(2));
            Assert.That(pagedResult.More, Is.EqualTo(1));
            Assert.That(pagedResult.Data.Select(systemEvent => systemEvent.EventKey), Is.EqualTo(new[] { "newest", "newer" }));
        }

        [Test]
        public void GetSystemEvents_AppliesExactColumnFiltersBeforePaging()
        {
            AddSystemEvent("UserLoggedIn", new DateTime(2026, 1, 2, 10, 0, 0, DateTimeKind.Utc), userId: 2, eventName: "User logged in");
            AddSystemEvent("UserLoggedIn", new DateTime(2026, 1, 2, 11, 0, 0, DateTimeKind.Utc), userId: 3, eventName: "User logged in");
            AddSystemEvent("ObsSessionUpdated:12", new DateTime(2026, 1, 2, 12, 0, 0, DateTimeKind.Utc), userId: 2, eventName: "User updated an obs session");
            AddSystemEvent("UserLoggedIn", new DateTime(2026, 1, 3, 10, 0, 0, DateTimeKind.Utc), userId: 2, eventName: "User logged in");
            var controller = CreateController(userId: 1, isSuperAdmin: false);

            var result = controller.GetSystemEvents(
                date: "2026-01-02",
                userId: 2,
                eventName: "User logged in",
                eventKey: "UserLoggedIn");

            var pagedResult = GetPagedResult(result);
            Assert.That(pagedResult.Total, Is.EqualTo(1));
            Assert.That(pagedResult.Data.Single().UserId, Is.EqualTo(2));
            Assert.That(pagedResult.Data.Single().EventKey, Is.EqualTo("UserLoggedIn"));
        }

        [Test]
        public void GetSystemEvents_SearchesTextDateAndUserIdBeforePaging()
        {
            AddSystemEvent("MatchDetails", new DateTime(2026, 2, 1, 10, 0, 0, DateTimeKind.Utc), details: "Globular cluster update");
            AddSystemEvent("MatchDate", new DateTime(2026, 2, 2, 10, 0, 0, DateTimeKind.Utc), details: "Different text");
            AddSystemEvent("MatchUser", new DateTime(2026, 2, 3, 10, 0, 0, DateTimeKind.Utc), userId: 77, details: "Different text");
            AddSystemEvent("MatchTime", new DateTime(2026, 2, 5, 12, 34, 56, DateTimeKind.Utc), details: "Different text");
            AddSystemEvent("MatchAdminNotificationDate", new DateTime(2026, 2, 6, 10, 0, 0, DateTimeKind.Utc), details: "Different text", adminNotificationSentUtc: new DateTime(2026, 2, 7, 10, 0, 0, DateTimeKind.Utc));
            AddSystemEvent("NoMatch", new DateTime(2026, 2, 4, 10, 0, 0, DateTimeKind.Utc), userId: 1, details: "Different text");
            var controller = CreateController(userId: 1, isSuperAdmin: false);

            var detailsResult = GetPagedResult(controller.GetSystemEvents(search: "globular"));
            var dateResult = GetPagedResult(controller.GetSystemEvents(search: "2026-02-02"));
            var userIdResult = GetPagedResult(controller.GetSystemEvents(search: "77"));
            var timeResult = GetPagedResult(controller.GetSystemEvents(search: "12:34"));
            var adminNotificationDateResult = GetPagedResult(controller.GetSystemEvents(search: "2026-02-07"));

            Assert.That(detailsResult.Data.Select(systemEvent => systemEvent.EventKey), Is.EqualTo(new[] { "MatchDetails" }));
            Assert.That(dateResult.Data.Select(systemEvent => systemEvent.EventKey), Is.EqualTo(new[] { "MatchDate" }));
            Assert.That(userIdResult.Data.Select(systemEvent => systemEvent.EventKey), Is.EqualTo(new[] { "MatchUser" }));
            Assert.That(timeResult.Data.Select(systemEvent => systemEvent.EventKey), Is.EqualTo(new[] { "MatchTime" }));
            Assert.That(adminNotificationDateResult.Data.Select(systemEvent => systemEvent.EventKey), Is.EqualTo(new[] { "MatchAdminNotificationDate" }));
        }

        /// <summary>
        /// Adds a detached audit event row so the event-log controller can be tested without user-account setup.
        /// </summary>
        private void AddSystemEvent(
            string eventKey,
            DateTime occurredUtc,
            int? userId = null,
            string eventName = null,
            string details = null,
            string fullName = null,
            DateTime? adminNotificationSentUtc = null)
        {
            if (userId.HasValue)
            {
                EnsureUser(userId.Value);
            }

            _dbContext.Events.Add(new SystemEvent
            {
                UserId = userId,
                FullName = fullName,
                EventKey = eventKey,
                EventName = eventName ?? $"Event {eventKey}",
                Details = details ?? $"Details {eventKey}",
                OccurredUtc = occurredUtc,
                AdminNotificationSentUtc = adminNotificationSentUtc
            });
            _dbContext.SaveChanges();
        }

        /// <summary>
        /// Seeds the minimal account row needed by the nullable Events.UserId foreign key.
        /// </summary>
        private void EnsureUser(int userId)
        {
            if (_dbContext.Users.Any(user => user.Id == userId))
            {
                return;
            }

            _dbContext.Users.Add(new AppUser
            {
                Id = userId,
                Email = $"user{userId}@example.com",
                NormalizedEmail = $"USER{userId}@EXAMPLE.COM",
                FullName = $"User {userId}",
                PasswordHash = "hash",
                CreatedUtc = DateTime.UtcNow
            });
            _dbContext.SaveChanges();
        }

        /// <summary>
        /// Extracts the typed paged result from a successful controller response.
        /// </summary>
        private static PagedResultDto<SystemEventDto> GetPagedResult(IActionResult result)
        {
            var okResult = result as OkObjectResult;
            return okResult?.Value as PagedResultDto<SystemEventDto>;
        }

        /// <summary>
        /// Creates a SystemEvents controller with the requested identity claims for authorization tests.
        /// </summary>
        private SystemEventsController CreateController(int? userId, bool isSuperAdmin)
        {
            var claims = new List<Claim>
            {
                new Claim(AuthClaimTypes.IsSuperAdmin, isSuperAdmin.ToString())
            };
            if (userId.HasValue)
            {
                claims.Add(new Claim(AuthClaimTypes.UserId, userId.Value.ToString()));
            }

            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims))
            };

            return new SystemEventsController(_dbContext)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = httpContext
                }
            };
        }
    }
}
