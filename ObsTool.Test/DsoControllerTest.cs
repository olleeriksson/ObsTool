using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using ObsTool;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;
using ObsTool.Services;

namespace TestProject
{
    [TestFixture]
    public class DsoControllerTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private DsoController _controller;

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

            var mapper = new MapperConfiguration(c => c.AddProfile<AutoMapperProfile>(), NullLoggerFactory.Instance).CreateMapper();
            var obsSessionsRepo = new ObsSessionsRepo(_dbContext);
            var observationsRepo = new ObservationsRepo(_dbContext);
            var observationsService = new ObservationsService(observationsRepo, obsSessionsRepo, _dbContext, mapper);
            var httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(AuthClaimTypes.UserId, "1") }))
                }
            };
            _controller = new DsoController(new DsoRepo(_dbContext), new H2500Repo(_dbContext), observationsService, new ObjectsRepo(_dbContext), new CurrentUserService(httpContextAccessor), mapper);
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void GetDso_IncludesCompactHerschelDataOnlyWhenRequested()
        {
            SeedDsoWithHerschelObjects();

            var withoutHerschel = (OkObjectResult)_controller.GetDso(query: null, name: "NGC 1", includeHerschel: false);
            var withoutHerschelDto = ((IEnumerable<DsoDto>)withoutHerschel.Value).Single();

            var withHerschel = (OkObjectResult)_controller.GetDso(query: null, name: "NGC 1", includeHerschel: true);
            var withHerschelDto = ((IEnumerable<DsoDto>)withHerschel.Value).Single();

            Assert.That(withoutHerschelDto.HerschelObjects, Is.Null);
            Assert.That(withHerschelDto.HerschelObjects, Has.Length.EqualTo(2));
            Assert.That(withHerschelDto.HerschelObjects[0].HerschelNo, Is.EqualTo("H I-1"));
            Assert.That(withHerschelDto.HerschelObjects[0].H400, Is.True);
        }

        [Test]
        public void GetDso_QueryIncludesUserAndOtherObjectMatches()
        {
            SeedUserAndOtherObjectObservations();

            var result = (OkObjectResult)_controller.GetDso(query: "solar", name: null, includeHerschel: true);
            var pagedResult = (PagedResultDto<DsoDto>)result.Value;

            Assert.That(pagedResult.Total, Is.EqualTo(2));
            Assert.That(pagedResult.Data.Select(dso => dso.ObjectKey), Is.EquivalentTo(new[] { "User:10", "Other:20" }));
            Assert.That(pagedResult.Data.Single(dso => dso.ObjectKind == ObservedObjectKind.User).Observations, Has.Length.EqualTo(1));
            Assert.That(pagedResult.Data.Single(dso => dso.ObjectKind == ObservedObjectKind.Other).Observations, Has.Length.EqualTo(1));
            Assert.That(pagedResult.Data.All(dso => dso.HerschelObjects == null), Is.True);
        }

        [Test]
        public void GetDso_ObjectKeyReturnsOnlyTheSelectedMixedObject()
        {
            SeedUserAndOtherObjectObservations();

            var result = (OkObjectResult)_controller.GetDso(
                query: null,
                name: null,
                includeHerschel: true,
                objectKey: "Other:20");
            var pagedResult = (PagedResultDto<DsoDto>)result.Value;

            Assert.That(pagedResult.Total, Is.EqualTo(1));
            Assert.That(pagedResult.More, Is.Zero);
            Assert.That(pagedResult.Data.Single().ObjectKey, Is.EqualTo("Other:20"));
            Assert.That(pagedResult.Data.Single().Observations, Has.Length.EqualTo(1));
        }

        [Test]
        public void GetAllObservedDso_IncludesUserAndOtherObjects()
        {
            SeedUserAndOtherObjectObservations();

            var result = (OkObjectResult)_controller.GetAllObservedDso(includeHerschel: true);
            var pagedResult = (PagedResultDto<DsoDto>)result.Value;

            Assert.That(pagedResult.Total, Is.EqualTo(2));
            Assert.That(pagedResult.Data.Select(dso => dso.ObjectKey), Is.EquivalentTo(new[] { "User:10", "Other:20" }));
            Assert.That(pagedResult.Data.All(dso => dso.NumObservations == 1), Is.True);
            Assert.That(pagedResult.Data.All(dso => dso.HerschelObjects == null), Is.True);
        }

        private void SeedDsoWithHerschelObjects()
        {
            _dbContext.Dso.Add(CreateDso(1));
            _dbContext.H2500.AddRange(
                CreateH2500Object(1, "H I-1", true),
                CreateH2500Object(2, "H II-2", false)
            );
            _dbContext.SaveChanges();
        }

        private void SeedUserAndOtherObjectObservations()
        {
            _dbContext.Users.Add(new AppUser
            {
                Id = 1,
                Email = "observer@example.com",
                NormalizedEmail = "OBSERVER@EXAMPLE.COM",
                Username = "observer",
                NormalizedUsername = "OBSERVER",
                FullName = "Test Observer",
                PasswordHash = "hash",
                CreatedUtc = new DateTime(2024, 1, 1)
            });
            _dbContext.UserObjects.Add(new UserObject
            {
                Id = 10,
                UserId = 1,
                Name = "Mars",
                OtherNames = "Solar System Object"
            });
            _dbContext.OtherObjects.Add(new OtherObject
            {
                Id = 20,
                Name = "Moon",
                CommonName = "Solar System Object"
            });
            _dbContext.ObsSessions.Add(new ObsSession
            {
                Id = 100,
                UserId = 1,
                Date = new DateTime(2024, 1, 2),
                Title = "Solar system night"
            });
            _dbContext.Observations.AddRange(
                new Observation
                {
                    Id = 1000,
                    UserId = 1,
                    ObsSessionId = 100,
                    Text = "Mars was bright.",
                    Identifier = "100-{Mars}",
                    DisplayOrder = 0,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { UserObjectId = 10, DisplayOrder = 0 }
                    }
                },
                new Observation
                {
                    Id = 1001,
                    UserId = 1,
                    ObsSessionId = 100,
                    Text = "Moon showed good terminator contrast.",
                    Identifier = "100-[Moon]",
                    DisplayOrder = 1,
                    DsoObservations = new List<DsoObservation>
                    {
                        new DsoObservation { OtherObjectId = 20, DisplayOrder = 0 }
                    }
                });
            _dbContext.SaveChanges();
        }

        private static Dso CreateDso(int id)
        {
            return new Dso
            {
                Id = id,
                Catalog = "NGC",
                CatalogNumber = id.ToString(),
                Name = $"NGC {id}",
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

        private static H2500 CreateH2500Object(int herschelId, string herschelNo, bool h400)
        {
            return new H2500
            {
                HerschelId = herschelId,
                HerschelNo = herschelNo,
                Cat = "NGC",
                CatNo = herschelId,
                H400 = h400,
                SacDeepSkyObjectsId = 1
            };
        }
    }
}
