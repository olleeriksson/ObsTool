using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
    public class AuthenticationControllerTest
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
        public async Task LoggedInAsync_InDevelopmentAutoLogsInConfiguredDatabaseUser()
        {
            AddUser(1, "owner@example.com", "owner", "Owner User");
            var authenticationService = new FakeAuthenticationService();
            var controller = CreateController(authenticationService);

            var result = (OkObjectResult)await controller.LoggedInAsync();
            var status = (AuthenticationStatusDto)result.Value;

            Assert.That(status.IsLoggedIn, Is.True);
            Assert.That(status.Email, Is.EqualTo("owner@example.com"));
            Assert.That(status.IsSuperAdmin, Is.False);
            Assert.That(status.CanManageUsers, Is.True);
            Assert.That(authenticationService.SignedInPrincipal.FindFirstValue(AuthClaimTypes.UserId), Is.EqualTo("1"));
        }

        [Test]
        public async Task LoggedInAsync_AfterDevelopmentLogoutDoesNotAutoLogin()
        {
            AddUser(1, "owner@example.com", "owner", "Owner User");
            var authenticationService = new FakeAuthenticationService();
            var controller = CreateController(authenticationService, "obstool-dev-auto-login-suppressed=true");

            var result = (OkObjectResult)await controller.LoggedInAsync();
            var status = (AuthenticationStatusDto)result.Value;

            Assert.That(status.IsLoggedIn, Is.False);
            Assert.That(status.CanManageUsers, Is.False);
            Assert.That(authenticationService.SignedInPrincipal, Is.Null);
        }

        [Test]
        public async Task LoggedInAsync_OnNonLocalHostDoesNotAutoLogin()
        {
            AddUser(1, "owner@example.com", "owner", "Owner User");
            var authenticationService = new FakeAuthenticationService();
            var controller = CreateController(authenticationService, host: "www.olle-eriksson.com");

            var result = (OkObjectResult)await controller.LoggedInAsync();
            var status = (AuthenticationStatusDto)result.Value;

            Assert.That(status.IsLoggedIn, Is.False);
            Assert.That(status.CanManageUsers, Is.False);
            Assert.That(authenticationService.SignedInPrincipal, Is.Null);
        }

        private AuthenticationController CreateController(FakeAuthenticationService authenticationService, string cookieHeader = null, string host = "localhost")
        {
            // The controller uses HttpContext.SignInAsync, so tests provide a small auth-service double.
            var services = new ServiceCollection()
                .AddSingleton<IAuthenticationService>(authenticationService)
                .BuildServiceProvider();

            var httpContext = new DefaultHttpContext
            {
                RequestServices = services
            };
            httpContext.Request.PathBase = "/obstool";
            httpContext.Request.Host = new HostString(host);
            if (!string.IsNullOrWhiteSpace(cookieHeader))
            {
                httpContext.Request.Headers.Cookie = cookieHeader;
            }

            var environmentMock = new Mock<IWebHostEnvironment>();
            environmentMock.SetupGet(e => e.EnvironmentName).Returns("Development");

            return new AuthenticationController(
                _userAccountService,
                Options.Create(new AppOptions { DevelopmentAutoLoginUserId = 1 }),
                environmentMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = httpContext
                }
            };
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

        private UserAccountService CreateUserAccountService()
        {
            // UserAccountService requires the event service, but these tests do not send mail or record login events.
            var systemEventService = new SystemEventService(
                _dbContext,
                new FakeMailService(),
                Options.Create(new AdminNotificationOptions()),
                new Mock<ILogger<SystemEventService>>().Object);

            return new UserAccountService(_dbContext, new ConfigurationBuilder().Build(), new FakeMailService(), systemEventService);
        }

        private class FakeAuthenticationService : IAuthenticationService
        {
            public ClaimsPrincipal SignedInPrincipal { get; private set; }

            public Task<AuthenticateResult> AuthenticateAsync(HttpContext context, string scheme)
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            public Task ChallengeAsync(HttpContext context, string scheme, AuthenticationProperties properties)
            {
                return Task.CompletedTask;
            }

            public Task ForbidAsync(HttpContext context, string scheme, AuthenticationProperties properties)
            {
                return Task.CompletedTask;
            }

            public Task SignInAsync(HttpContext context, string scheme, ClaimsPrincipal principal, AuthenticationProperties properties)
            {
                SignedInPrincipal = principal;
                return Task.CompletedTask;
            }

            public Task SignOutAsync(HttpContext context, string scheme, AuthenticationProperties properties)
            {
                SignedInPrincipal = null;
                return Task.CompletedTask;
            }
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
