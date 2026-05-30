using System;
using System.Collections.Generic;
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
    public class SystemEventServiceTest
    {
        private SqliteConnection _connection;
        private MainDbContext _dbContext;
        private FakeMailService _mailService;

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
            _mailService = new FakeMailService();
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Test]
        public void RecordObsSessionCreated_LogsEventAndSendsAdminNotification()
        {
            AddUser(2);
            var service = CreateService(new AdminNotificationOptions { Enabled = true, AdminEmail = "admin@example.com" });

            service.RecordObsSessionCreated(2, new ObsSession { Id = 10, Title = "Clear night", Date = new DateTime(2026, 5, 23) });

            var systemEvent = _dbContext.Events.Single();
            Assert.That(systemEvent.UserId, Is.EqualTo(2));
            Assert.That(systemEvent.FullName, Is.EqualTo("User 2"));
            Assert.That(systemEvent.EventKey, Is.EqualTo("ObsSessionCreated:10"));
            Assert.That(systemEvent.AdminNotificationSentUtc, Is.Not.Null);
            Assert.That(_mailService.AdminNotifications, Has.Count.EqualTo(1));
            Assert.That(_mailService.AdminNotifications[0].Recipient, Is.EqualTo("admin@example.com"));
            Assert.That(_mailService.AdminNotifications[0].Body, Does.Contain("User: Id 2, user2@example.com, User 2"));
        }

        [Test]
        public void RecordObsSessionUpdated_SuppressedUserStillLogsEventWithoutSendingMail()
        {
            AddUser(1);
            var service = CreateService(new AdminNotificationOptions { Enabled = true, AdminEmail = "admin@example.com", SuppressedUserIds = new[] { 1 } });

            service.RecordObsSessionUpdated(1, new ObsSession { Id = 10, Title = "Clear night", Date = new DateTime(2026, 5, 23) });

            var systemEvent = _dbContext.Events.Single();
            Assert.That(systemEvent.EventKey, Is.EqualTo("ObsSessionUpdated:10"));
            Assert.That(systemEvent.AdminNotificationSentUtc, Is.Null);
            Assert.That(_mailService.AdminNotifications, Is.Empty);
        }

        [Test]
        public void RecordObsSessionUpdated_SuppressesAnyConfiguredUserId()
        {
            AddUser(3);
            var service = CreateService(new AdminNotificationOptions { Enabled = true, AdminEmail = "admin@example.com", SuppressedUserIds = new[] { 1, 2, 3 } });

            service.RecordObsSessionUpdated(3, new ObsSession { Id = 11, Title = "Demo night", Date = new DateTime(2026, 5, 24) });

            var systemEvent = _dbContext.Events.Single();
            Assert.That(systemEvent.UserId, Is.EqualTo(3));
            Assert.That(systemEvent.FullName, Is.EqualTo("User 3"));
            Assert.That(systemEvent.AdminNotificationSentUtc, Is.Null);
            Assert.That(_mailService.AdminNotifications, Is.Empty);
        }

        [Test]
        public void RecordUserLoggedIn_StoresNotificationErrorWhenMailFails()
        {
            AddUser(2);
            _mailService.AdminNotificationException = new InvalidOperationException("SMTP unavailable");
            var service = CreateService(new AdminNotificationOptions { Enabled = true, AdminEmail = "admin@example.com" });

            service.RecordUserLoggedIn(CreateUser(2));

            var systemEvent = _dbContext.Events.Single();
            Assert.That(systemEvent.EventKey, Is.EqualTo("UserLoggedIn"));
            Assert.That(systemEvent.AdminNotificationSentUtc, Is.Null);
            Assert.That(systemEvent.AdminNotificationError, Is.EqualTo("SMTP unavailable"));
        }

        private void AddUser(int userId)
        {
            // Events are user-scoped, so tests seed the minimal account row needed by the FK.
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

        private SystemEventService CreateService(AdminNotificationOptions options)
        {
            // The service writes real EF rows, while the fake mailer keeps the tests independent of SMTP.
            return new SystemEventService(
                _dbContext,
                _mailService,
                Options.Create(options),
                new Mock<ILogger<SystemEventService>>().Object);
        }

        private static AppUser CreateUser(int userId)
        {
            return new AppUser
            {
                Id = userId,
                Email = $"user{userId}@example.com",
                FullName = $"User {userId}",
                Username = $"user{userId}"
            };
        }

        private class FakeMailService : IMailService
        {
            public List<AdminNotificationMessage> AdminNotifications { get; } = new List<AdminNotificationMessage>();

            public Exception AdminNotificationException { get; set; }

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

            public Task SendPasswordResetAsync(string recipient, string fullName, string resetUrl)
            {
                return Task.CompletedTask;
            }

            public Task SendAdminNotificationAsync(string recipient, string subject, string body)
            {
                // Preserve the outgoing message so tests can verify routing without opening an SMTP connection.
                if (AdminNotificationException != null)
                {
                    throw AdminNotificationException;
                }

                AdminNotifications.Add(new AdminNotificationMessage
                {
                    Recipient = recipient,
                    Subject = subject,
                    Body = body
                });
                return Task.CompletedTask;
            }
        }

        private class AdminNotificationMessage
        {
            public string Recipient { get; set; }
            public string Subject { get; set; }
            public string Body { get; set; }
        }
    }
}
