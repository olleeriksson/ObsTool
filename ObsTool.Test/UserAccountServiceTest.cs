using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
    public class UserAccountServiceTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private UserAccountService _service;

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
            _service = CreateService();
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void GetLoginResultForUserId_ReturnsDatabaseBackedLoginForExistingUser()
        {
            AddUser(1, "owner@example.com", "owner", "Owner User");

            var loginResult = _service.GetLoginResultForUserId(1);

            Assert.That(loginResult.Success, Is.True);
            Assert.That(loginResult.IsSuperAdmin, Is.False);
            Assert.That(loginResult.UserId, Is.EqualTo(1));
            Assert.That(loginResult.Email, Is.EqualTo("owner@example.com"));
            Assert.That(loginResult.Username, Is.EqualTo("owner"));
            Assert.That(loginResult.FullName, Is.EqualTo("Owner User"));
        }

        [Test]
        public void GetLoginResultForUserId_ReturnsFailedLoginForMissingUser()
        {
            var loginResult = _service.GetLoginResultForUserId(1);

            Assert.That(loginResult.Success, Is.False);
            Assert.That(loginResult.UserId, Is.Null);
        }

        [Test]
        public void AdminCreateUser_CreatesConfirmedDatabaseUserWithPassword()
        {
            var createdUser = _service.AdminCreateUser(new AdminCreateUserDto
            {
                Email = " new-user@example.com ",
                Username = " newuser ",
                FullName = " New User ",
                EmailConfirmed = true,
                Password = "Strong12345",
                ConfirmPassword = "Strong12345"
            });

            var loginResult = _service.ValidateLogin("new-user@example.com", "Strong12345");

            Assert.That(createdUser.Email, Is.EqualTo("new-user@example.com"));
            Assert.That(createdUser.Username, Is.EqualTo("newuser"));
            Assert.That(createdUser.FullName, Is.EqualTo("New User"));
            Assert.That(createdUser.EmailConfirmed, Is.True);
            Assert.That(loginResult.Success, Is.True);
            Assert.That(loginResult.UserId, Is.EqualTo(createdUser.Id));
        }

        [Test]
        public void AdminCreateUser_AllowsPasswordOutsidePublicSignupRules()
        {
            var createdUser = _service.AdminCreateUser(new AdminCreateUserDto
            {
                Email = "weak-password@example.com",
                Username = "weak-password",
                FullName = "Weak Password",
                EmailConfirmed = true,
                Password = "test",
                ConfirmPassword = "test"
            });

            var loginResult = _service.ValidateLogin("weak-password@example.com", "test");

            Assert.That(createdUser.Email, Is.EqualTo("weak-password@example.com"));
            Assert.That(loginResult.Success, Is.True);
            Assert.That(loginResult.UserId, Is.EqualTo(createdUser.Id));
        }

        [Test]
        public void AdminUpdateUser_ChangesProfileAndConfirmationState()
        {
            AddUser(1, "owner@example.com", "owner", "Owner User");

            var updatedUser = _service.AdminUpdateUser(1, new AdminUpdateUserDto
            {
                Email = " updated@example.com ",
                Username = " updated-owner ",
                FullName = " Updated Owner ",
                EmailConfirmed = false
            });

            var savedUser = _dbContext.Users.Single(u => u.Id == 1);
            Assert.That(updatedUser.Email, Is.EqualTo("updated@example.com"));
            Assert.That(updatedUser.Username, Is.EqualTo("updated-owner"));
            Assert.That(updatedUser.FullName, Is.EqualTo("Updated Owner"));
            Assert.That(updatedUser.EmailConfirmed, Is.False);
            Assert.That(savedUser.NormalizedEmail, Is.EqualTo("UPDATED@EXAMPLE.COM"));
            Assert.That(savedUser.NormalizedUsername, Is.EqualTo("UPDATED-OWNER"));
            Assert.That(savedUser.UpdatedUtc, Is.Not.Null);
        }

        private void AddUser(int userId, string email, string username, string fullName)
        {
            // The auto-login path needs the same database account fields that a normal login would put into claims.
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

        private UserAccountService CreateService()
        {
            // UserAccountService requires the event service, but these tests do not send mail or record login events.
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
