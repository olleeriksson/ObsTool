using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
    public class UsersControllerTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private UserAccountService _userAccountService;

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
            _userAccountService = CreateUserAccountService();
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void GetAdminList_AllowsDatabaseUserOne()
        {
            AddUser(1, "owner@example.com", "owner", "Owner User");
            var controller = CreateController(userId: 1, isSuperAdmin: false);

            var result = controller.GetAdminList();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public void GetAdminList_ForbidsOtherDatabaseUsers()
        {
            AddUser(2, "user@example.com", "user", "Normal User");
            var controller = CreateController(userId: 2, isSuperAdmin: false);

            var result = controller.GetAdminList();

            Assert.That(result, Is.TypeOf<ForbidResult>());
        }

        [Test]
        public void GetAdminList_AllowsConfiguredSuperAdmins()
        {
            var controller = CreateController(userId: null, isSuperAdmin: true);

            var result = controller.GetAdminList();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public void CreateUser_AllowsDatabaseUserOne()
        {
            var controller = CreateController(userId: 1, isSuperAdmin: false);

            var result = controller.CreateUser(new AdminCreateUserDto
            {
                Email = "created@example.com",
                Username = "created",
                FullName = "Created User",
                EmailConfirmed = true,
                Password = "Strong12345",
                ConfirmPassword = "Strong12345"
            });

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            Assert.That(_dbContext.Users.Any(user => user.Email == "created@example.com"), Is.True);
        }

        [Test]
        public void UpdateUser_ForbidsOtherDatabaseUsers()
        {
            AddUser(2, "user@example.com", "user", "Normal User");
            var controller = CreateController(userId: 2, isSuperAdmin: false);

            var result = controller.UpdateUser(2, new AdminUpdateUserDto
            {
                Email = "updated@example.com",
                Username = "updated",
                FullName = "Updated User",
                EmailConfirmed = true
            });

            Assert.That(result, Is.TypeOf<ForbidResult>());
        }

        /// <summary>
        /// Adds a database-backed account for user-management list tests.
        /// </summary>
        private void AddUser(int userId, string email, string username, string fullName)
        {
            _dbContext.Users.Add(new AppUser
            {
                Id = userId,
                Email = email,
                NormalizedEmail = email.ToUpperInvariant(),
                Username = username,
                NormalizedUsername = username.ToUpperInvariant(),
                FullName = fullName,
                PasswordHash = "hash",
                EmailConfirmed = true,
                CreatedUtc = DateTime.UtcNow
            });
            _dbContext.SaveChanges();
        }

        /// <summary>
        /// Creates a Users controller with the requested identity claims for authorization tests.
        /// </summary>
        private UsersController CreateController(int? userId, bool isSuperAdmin)
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

            return new UsersController(_userAccountService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = httpContext
                }
            };
        }

        /// <summary>
        /// Builds the account service with a quiet event/mail dependency set for controller tests.
        /// </summary>
        private UserAccountService CreateUserAccountService()
        {
            var systemEventService = new SystemEventService(
                _dbContext,
                new FakeMailService(),
                Options.Create(new AdminNotificationOptions()),
                new Mock<ILogger<SystemEventService>>().Object);

            return new UserAccountService(_dbContext, new ConfigurationBuilder().Build(), new FakeMailService(), systemEventService);
        }

        private class FakeMailService : IMailService
        {
            public EmailTestSettingsDto GetSettings()
            {
                return new EmailTestSettingsDto();
            }

            public Task<EmailTestResultDto> SendTestEmailAsync(EmailTestRequestDto request, string triggeredBy)
            {
                return Task.FromResult(new EmailTestResultDto());
            }

            public Task SendEmailConfirmationAsync(string recipient, string fullName, string confirmationUrl)
            {
                return Task.CompletedTask;
            }

            public Task SendPasswordResetAsync(string recipient, string fullName)
            {
                return Task.CompletedTask;
            }

            public Task SendPasswordResetAsync(string recipient, string fullName, string resetUrl)
            {
                return Task.CompletedTask;
            }

            public Task SendAdminNotificationAsync(string recipient, string subject, string body)
            {
                return Task.CompletedTask;
            }
        }
    }
}
