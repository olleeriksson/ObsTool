using System;
using System.Data;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ObsTool.Database;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class SystemEventService
    {
        private readonly MainDbContext _dbContext;
        private readonly IMailService _mailService;
        private readonly AdminNotificationOptions _options;
        private readonly ILogger<SystemEventService> _logger;

        public SystemEventService(
            MainDbContext dbContext,
            IMailService mailService,
            IOptions<AdminNotificationOptions> options,
            ILogger<SystemEventService> logger)
        {
            _dbContext = dbContext;
            _mailService = mailService;
            _options = options.Value;
            _logger = logger;
        }

        public void RecordUserRegistered(AppUser user)
        {
            // Registration is user-scoped and can be throttled later by EventKey + UserId.
            RecordEvent(user.Id, "UserRegistered", "User registered", FormatUserDetails(user));
        }

        public void RecordUserEmailConfirmed(AppUser user)
        {
            // E-mail confirmation is a separate lifecycle event from registration.
            RecordEvent(user.Id, "UserEmailConfirmed", "User confirmed e-mail address", FormatUserDetails(user));
        }

        public void RecordUserLoggedIn(AppUser user)
        {
            // Logins are intentionally persisted even if admin notifications are disabled.
            RecordEvent(user.Id, "UserLoggedIn", "User logged in", FormatUserDetails(user));
        }

        public void RecordObsSessionCreated(int userId, ObsSession obsSession)
        {
            // Include the session id in the key so future throttling can group repeated work per session.
            RecordEvent(userId, $"ObsSessionCreated:{obsSession.Id}", "User created an obs session", FormatObsSessionDetails(obsSession));
        }

        public void RecordObsSessionUpdated(int userId, ObsSession obsSession)
        {
            // Updates to the same session share a key, but each update still gets its own row.
            RecordEvent(userId, $"ObsSessionUpdated:{obsSession.Id}", "User updated an obs session", FormatObsSessionDetails(obsSession));
        }

        private void RecordEvent(int userId, string eventKey, string eventName, string details)
        {
            EnsureEventsTableExists();
            var user = GetEventUser(userId);

            var systemEvent = new SystemEvent
            {
                UserId = userId,
                FullName = user?.FullName,
                EventKey = eventKey,
                EventName = eventName,
                Details = details,
                OccurredUtc = DateTime.UtcNow
            };

            _dbContext.Events.Add(systemEvent);
            _dbContext.SaveChanges();

            SendAdminNotificationIfEnabled(systemEvent);
        }

        private void SendAdminNotificationIfEnabled(SystemEvent systemEvent)
        {
            if (!ShouldSendAdminNotification(systemEvent.UserId))
            {
                return;
            }

            try
            {
                var subject = $"ObsTool event: {systemEvent.EventName}";
                var body = BuildAdminNotificationBody(systemEvent);

                _mailService.SendAdminNotificationAsync(_options.AdminEmail, subject, body).GetAwaiter().GetResult();
                systemEvent.AdminNotificationSentUtc = DateTime.UtcNow;
                systemEvent.AdminNotificationError = null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send admin notification for system event {EventId}.", systemEvent.Id);
                systemEvent.AdminNotificationError = ex.Message;
            }

            _dbContext.SaveChanges();
        }

        private bool ShouldSendAdminNotification(int? userId)
        {
            if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.AdminEmail))
            {
                return false;
            }

            return userId == null || !_options.SuppressedUserIds.Contains(userId.Value);
        }

        private string BuildAdminNotificationBody(SystemEvent systemEvent)
        {
            // Add account identity to every admin e-mail, even when the stored event details focus on another object.
            var user = GetEventUser(systemEvent.UserId);
            return
                $"Event: {systemEvent.EventName}" + Environment.NewLine +
                $"Key: {systemEvent.EventKey}" + Environment.NewLine +
                FormatUserDetails(systemEvent.UserId, systemEvent.FullName, user) + Environment.NewLine +
                $"UTC: {systemEvent.OccurredUtc:O}" + Environment.NewLine +
                Environment.NewLine +
                systemEvent.Details;
        }

        private AppUser GetEventUser(int? userId)
        {
            // System events should still send if the user was deleted or cannot be resolved.
            return userId == null
                ? null
                : _dbContext.Users.AsNoTracking().FirstOrDefault(user => user.Id == userId.Value);
        }

        private void EnsureEventsTableExists()
        {
            var provider = _dbContext.Database.ProviderName ?? string.Empty;
            if (provider.IndexOf("Sqlite", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                _dbContext.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS ""Events"" (
    ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Events"" PRIMARY KEY AUTOINCREMENT,
    ""UserId"" INTEGER NULL,
    ""FullName"" TEXT NULL,
    ""EventKey"" TEXT NOT NULL,
    ""EventName"" TEXT NOT NULL,
    ""Details"" TEXT NULL,
    ""OccurredUtc"" TEXT NOT NULL,
    ""AdminNotificationSentUtc"" TEXT NULL,
    ""AdminNotificationError"" TEXT NULL,
    CONSTRAINT ""FK_Events_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT
);");
                EnsureSqliteColumnExists("FullName", @"ALTER TABLE ""Events"" ADD COLUMN ""FullName"" TEXT NULL;");
                return;
            }

            if (provider.IndexOf("MySql", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                _dbContext.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS `Events` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NULL,
    `FullName` varchar(200) NULL,
    `EventKey` varchar(200) NOT NULL,
    `EventName` varchar(100) NOT NULL,
    `Details` varchar(1000) NULL,
    `OccurredUtc` datetime(6) NOT NULL,
    `AdminNotificationSentUtc` datetime(6) NULL,
    `AdminNotificationError` text NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Events_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
);");
                EnsureMySqlColumnExists("FullName", "ALTER TABLE `Events` ADD COLUMN `FullName` varchar(200) NULL;");
            }
        }

        private void EnsureSqliteColumnExists(string columnName, string alterTableSql)
        {
            // Direct schema setup is used for the Events table, so add new columns without EF migrations.
            if (!ColumnExists("SELECT 1 FROM pragma_table_info('Events') WHERE name = @columnName LIMIT 1;", columnName))
            {
                _dbContext.Database.ExecuteSqlRaw(alterTableSql);
            }
        }

        private void EnsureMySqlColumnExists(string columnName, string alterTableSql)
        {
            // MySQL production uses the same direct Events table setup as SQLite development.
            if (!ColumnExists("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Events' AND COLUMN_NAME = @columnName LIMIT 1;", columnName))
            {
                _dbContext.Database.ExecuteSqlRaw(alterTableSql);
            }
        }

        private bool ColumnExists(string sql, string columnName)
        {
            // Provider metadata queries are simpler and more portable here than EF scalar projections.
            var connection = _dbContext.Database.GetDbConnection();
            var wasClosed = connection.State == ConnectionState.Closed;
            if (wasClosed)
            {
                connection.Open();
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = sql;
                var parameter = command.CreateParameter();
                parameter.ParameterName = "@columnName";
                parameter.Value = columnName;
                command.Parameters.Add(parameter);
                return command.ExecuteScalar() != null;
            }
            finally
            {
                if (wasClosed)
                {
                    connection.Close();
                }
            }
        }

        private static string FormatUserDetails(AppUser user)
        {
            return
                $"Email: {user.Email}" + Environment.NewLine +
                $"Username: {user.Username}" + Environment.NewLine +
                $"Full name: {user.FullName}";
        }

        private static string FormatUserDetails(int? userId, string storedFullName, AppUser user)
        {
            var email = string.IsNullOrWhiteSpace(user?.Email) ? "unknown e-mail" : user.Email;
            var fullName = string.IsNullOrWhiteSpace(storedFullName)
                ? string.IsNullOrWhiteSpace(user?.FullName) ? "unknown name" : user.FullName
                : storedFullName;
            return $"User: Id {userId}, {email}, {fullName}";
        }

        private static string FormatObsSessionDetails(ObsSession obsSession)
        {
            return
                $"SessionId: {obsSession.Id}" + Environment.NewLine +
                $"Title: {obsSession.Title}" + Environment.NewLine +
                $"Date: {obsSession.Date}";
        }
    }
}
