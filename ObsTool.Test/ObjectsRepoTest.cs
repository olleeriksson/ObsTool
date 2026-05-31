using System;
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
    public class ObjectsRepoTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private ObjectsRepo _repo;

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
            _repo = new ObjectsRepo(_dbContext);
            SeedUserAndSacObject();
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void AddUserObject_RejectsExactSacObjectName()
        {
            var exception = Assert.Throws<ObsToolException>(() =>
                _repo.AddUserObject(new UserObject { Name = "NGC 102" }, 1));

            Assert.That(exception.Message, Is.EqualTo("A SAC object named 'NGC 102' already exists."));
        }

        [Test]
        public void AddUserObject_RejectsNormalizedSacIdentityName()
        {
            var exception = Assert.Throws<ObsToolException>(() =>
                _repo.AddUserObject(new UserObject { Name = "NGC102" }, 1));

            Assert.That(exception.Message, Is.EqualTo("A SAC object named 'NGC 102' already exists."));
        }

        [Test]
        public void AddOtherObject_RejectsNormalizedSacOtherName()
        {
            var exception = Assert.Throws<ObsToolException>(() =>
                _repo.AddOtherObject(new OtherObject { Name = "PK2+5.1" }));

            Assert.That(exception.Message, Is.EqualTo("A SAC object named 'NGC 102' already exists."));
        }

        [Test]
        public void AddUserObject_AllowsSacCommonNameSubstring()
        {
            Assert.DoesNotThrow(() =>
                _repo.AddUserObject(new UserObject { Name = "Mars" }, 1));

            Assert.That(_dbContext.UserObjects.Single().Name, Is.EqualTo("Mars"));
        }

        [Test]
        public void AddUserObject_StoresModifiedDate()
        {
            _repo.AddUserObject(new UserObject { Name = "Mars" }, 1);

            Assert.That(_dbContext.UserObjects.Single().ModifiedDate, Is.Not.Null);
        }

        [Test]
        public void AddOtherObject_StoresModifiedDate()
        {
            _repo.AddOtherObject(new OtherObject { Name = "Mars" });

            Assert.That(_dbContext.OtherObjects.Single().ModifiedDate, Is.Not.Null);
        }

        [Test]
        public void AddUserObject_RejectsExistingOtherObjectName()
        {
            _dbContext.OtherObjects.Add(new OtherObject { Name = "Mars" });
            _dbContext.SaveChanges();

            var exception = Assert.Throws<ObsToolException>(() =>
                _repo.AddUserObject(new UserObject { Name = " mars " }, 1));

            Assert.That(exception.Message, Is.EqualTo("An other object named 'Mars' already exists."));
        }

        [Test]
        public void PostOtherObject_ForbidsNormalUsersExceptUserOne()
        {
            var controller = CreateObjectsController(userId: 2, isSuperAdmin: false);

            var result = controller.PostOtherObject(new OtherObjectDtoForCreation { Name = "Saturn" });

            Assert.That(result, Is.TypeOf<ForbidResult>());
        }

        [Test]
        public void PostOtherObject_AllowsDatabaseUserOne()
        {
            var controller = CreateObjectsController(userId: 1, isSuperAdmin: false);

            var result = controller.PostOtherObject(new OtherObjectDtoForCreation { Name = "Saturn", Const = "" });

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var otherObject = _dbContext.OtherObjects.Single();
            Assert.That(otherObject.Name, Is.EqualTo("Saturn"));
            Assert.That(otherObject.Const, Is.Null);
        }

        [Test]
        public void PutOtherObject_ForbidsNormalUsersExceptUserOne()
        {
            _dbContext.OtherObjects.Add(new OtherObject { Id = 5, Name = "Saturn", Notes = "Old" });
            _dbContext.SaveChanges();
            var controller = CreateObjectsController(userId: 2, isSuperAdmin: false);

            var result = controller.PutOtherObject(5, new UserObjectDtoForUpdate { Notes = "New" });

            Assert.That(result, Is.TypeOf<ForbidResult>());
            Assert.That(_dbContext.OtherObjects.Single(o => o.Id == 5).Notes, Is.EqualTo("Old"));
        }

        [Test]
        public void PutOtherObject_AllowsDatabaseUserOne()
        {
            _dbContext.OtherObjects.Add(new OtherObject { Id = 5, Name = "Saturn", Notes = "Old" });
            _dbContext.SaveChanges();
            var controller = CreateObjectsController(userId: 1, isSuperAdmin: false);

            var result = controller.PutOtherObject(5, new UserObjectDtoForUpdate { Notes = "New", Const = "" });

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            var otherObject = _dbContext.OtherObjects.Single(o => o.Id == 5);
            Assert.That(otherObject.Name, Is.EqualTo("Saturn"));
            Assert.That(otherObject.Notes, Is.EqualTo("New"));
            Assert.That(otherObject.Const, Is.Null);
        }

        [Test]
        public void Get_SetsOtherObjectDeleteFlagOnlyForPrivilegedUnreferencedObjects()
        {
            _dbContext.Users.Add(new AppUser
            {
                Id = 2,
                Email = "other@example.test",
                NormalizedEmail = "OTHER@EXAMPLE.TEST",
                Username = "other",
                NormalizedUsername = "OTHER",
                FullName = "Other User",
                PasswordHash = "hash",
                CreatedUtc = DateTime.UtcNow
            });
            _dbContext.OtherObjects.AddRange(
                new OtherObject { Id = 5, Name = "Referenced" },
                new OtherObject { Id = 6, Name = "Unreferenced" });
            _dbContext.ObsSessions.Add(new ObsSession { Id = 11, UserId = 2, Date = new DateTime(2026, 5, 24) });
            _dbContext.Observations.Add(new Observation { Id = 101, UserId = 2, ObsSessionId = 11, Text = "Referenced" });
            _dbContext.DsoObservations.Add(new DsoObservation { Id = 1001, ObservationId = 101, OtherObjectId = 5 });
            _dbContext.SaveChanges();
            var controller = CreateObjectsController(userId: 1, isSuperAdmin: false);

            var result = (OkObjectResult)controller.Get();

            var objectList = (ObjectListDto)result.Value;
            Assert.That(objectList.OtherObjects.Single(o => o.Name == "Referenced").CanDelete, Is.False);
            Assert.That(objectList.OtherObjects.Single(o => o.Name == "Unreferenced").CanDelete, Is.True);
        }

        [Test]
        public void DeleteOtherObject_ForbidsNormalUsersExceptUserOne()
        {
            _dbContext.OtherObjects.Add(new OtherObject { Id = 5, Name = "Saturn" });
            _dbContext.SaveChanges();
            var controller = CreateObjectsController(userId: 2, isSuperAdmin: false);

            var result = controller.DeleteOtherObject(5);

            Assert.That(result, Is.TypeOf<ForbidResult>());
            Assert.That(_dbContext.OtherObjects.Single(o => o.Id == 5).Name, Is.EqualTo("Saturn"));
        }

        [Test]
        public void DeleteOtherObject_AllowsDatabaseUserOneWhenUnreferenced()
        {
            _dbContext.OtherObjects.Add(new OtherObject { Id = 5, Name = "Saturn" });
            _dbContext.SaveChanges();
            var controller = CreateObjectsController(userId: 1, isSuperAdmin: false);

            var result = controller.DeleteOtherObject(5);

            Assert.That(result, Is.TypeOf<OkResult>());
            Assert.That(_dbContext.OtherObjects.Any(o => o.Id == 5), Is.False);
        }

        [Test]
        public void DeleteOtherObject_AllowsSuperAdminWhenUnreferenced()
        {
            _dbContext.OtherObjects.Add(new OtherObject { Id = 5, Name = "Saturn" });
            _dbContext.SaveChanges();
            var controller = CreateObjectsController(userId: 2, isSuperAdmin: true);

            var result = controller.DeleteOtherObject(5);

            Assert.That(result, Is.TypeOf<OkResult>());
            Assert.That(_dbContext.OtherObjects.Any(o => o.Id == 5), Is.False);
        }

        [Test]
        public void DeleteOtherObject_RejectsReferencedObjects()
        {
            _dbContext.OtherObjects.Add(new OtherObject { Id = 5, Name = "Saturn" });
            _dbContext.ObsSessions.Add(new ObsSession { Id = 11, UserId = 1, Date = new DateTime(2026, 5, 24) });
            _dbContext.Observations.Add(new Observation { Id = 101, UserId = 1, ObsSessionId = 11, Text = "Saturn" });
            _dbContext.DsoObservations.Add(new DsoObservation { Id = 1001, ObservationId = 101, OtherObjectId = 5 });
            _dbContext.SaveChanges();
            var controller = CreateObjectsController(userId: 1, isSuperAdmin: false);

            var result = controller.DeleteOtherObject(5);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
            Assert.That(_dbContext.OtherObjects.Single(o => o.Id == 5).Name, Is.EqualTo("Saturn"));
        }

        [Test]
        public void UpdateEditableFields_StoresModifiedDate()
        {
            var userObject = new UserObject { Name = "Saturn" };

            _repo.UpdateEditableFields(userObject, new UserObjectDtoForUpdate { Notes = "New" });

            Assert.That(userObject.ModifiedDate, Is.Not.Null);
        }

        [Test]
        public void GetUserObjectReferenceSummaries_ReturnsSessionLinksInDateOrder()
        {
            _dbContext.UserObjects.Add(new UserObject { Id = 30, UserId = 1, Name = "Mars" });
            _dbContext.ObsSessions.AddRange(
                new ObsSession { Id = 11, UserId = 1, Date = new DateTime(2026, 5, 24), Title = "Older" },
                new ObsSession { Id = 12, UserId = 1, Date = new DateTime(2026, 5, 26), Title = "Latest" });
            _dbContext.Observations.AddRange(
                new Observation { Id = 101, UserId = 1, ObsSessionId = 11, Text = "Mars" },
                new Observation { Id = 102, UserId = 1, ObsSessionId = 12, Text = "Mars" });
            _dbContext.DsoObservations.AddRange(
                new DsoObservation { ObservationId = 101, UserObjectId = 30 },
                new DsoObservation { ObservationId = 102, UserObjectId = 30 });
            _dbContext.SaveChanges();

            var summary = _repo.GetUserObjectReferenceSummaries(1)[30];

            Assert.That(summary.NumReferences, Is.EqualTo(2));
            Assert.That(summary.Sessions.Select(session => session.ObsSessionId), Is.EqualTo(new[] { 12, 11 }));
            Assert.That(summary.Sessions.Select(session => session.Date), Is.EqualTo(new[] { "2026-05-26", "2026-05-24" }));
        }

        /// <summary>
        /// Seeds the minimum rows needed to exercise user-object validation against SAC names.
        /// </summary>
        private void SeedUserAndSacObject()
        {
            _dbContext.Users.Add(new AppUser
            {
                Id = 1,
                Email = "user@example.test",
                NormalizedEmail = "USER@EXAMPLE.TEST",
                Username = "user",
                NormalizedUsername = "USER",
                FullName = "Test User",
                PasswordHash = "hash",
                CreatedUtc = DateTime.UtcNow
            });
            _dbContext.Dso.Add(new Dso
            {
                Id = 102,
                Catalog = "NGC",
                CatalogNumber = "102",
                Name = "NGC 102",
                OtherNames = "PK 2+5.1;H IV 11",
                AllCommonNames = "Ghost of Mars Nebula",
                Type = "GALXY",
                Con = "CAS",
                RA = "00 24",
                DEC = "+56 18",
                Mag = "13",
                SB = "13",
                U2K = 1,
                TI = 1
            });
            _dbContext.SaveChanges();
        }

        /// <summary>
        /// Creates an Objects controller with the requested identity claims for authorization tests.
        /// </summary>
        private ObjectsController CreateObjectsController(int? userId, bool isSuperAdmin)
        {
            var claims = new System.Collections.Generic.List<Claim>
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
            var currentUserService = new CurrentUserService(new HttpContextAccessor { HttpContext = httpContext });
            var controller = new ObjectsController(_repo, currentUserService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = httpContext
                }
            };
            return controller;
        }
    }
}
