using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;

namespace ObsTool.Services
{
    public static class AuthClaimTypes
    {
        public const string AuthSource = "obstool:auth-source";
        public const string UserId = "obstool:user-id";
        public const string IsSuperAdmin = "obstool:is-superadmin";
        public const string Username = "obstool:username";
        public const string FullName = "obstool:full-name";
    }

    public class LoginResult
    {
        public bool Success { get; set; }
        public bool IsSuperAdmin { get; set; }
        public int? UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }

        public string DisplayName => !string.IsNullOrWhiteSpace(Username)
            ? Username
            : !string.IsNullOrWhiteSpace(FullName)
                ? FullName
                : Email;
    }

    public class UserAccountService
    {
        private const int ConfirmationTokenHours = 24 * 7;
        private const int PasswordResetTokenHours = 2;

        private readonly MainDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IMailService _mailService;
        private readonly SystemEventService _systemEventService;

        public UserAccountService(MainDbContext dbContext, IConfiguration configuration, IMailService mailService, SystemEventService systemEventService)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _mailService = mailService;
            _systemEventService = systemEventService;
        }

        public LoginResult ValidateLogin(string identifier, string password)
        {
            identifier = identifier?.Trim();
            password = password ?? string.Empty;

            if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(password))
            {
                return new LoginResult();
            }

            var passwordHasher = new PasswordHasher<string>();
            foreach (var configuredUser in GetConfiguredUsers())
            {
                var isConfiguredIdentifier = identifier == configuredUser.Username ||
                    (!string.IsNullOrWhiteSpace(configuredUser.Email) && Normalize(identifier) == Normalize(configuredUser.Email));

                if (isConfiguredIdentifier &&
                    passwordHasher.VerifyHashedPassword(null, configuredUser.HashedPassword, password) == PasswordVerificationResult.Success)
                {
                    return new LoginResult
                    {
                        Success = true,
                        IsSuperAdmin = true,
                        Username = configuredUser.Username,
                        Email = configuredUser.Email,
                        FullName = configuredUser.FullName
                    };
                }
            }

            var normalizedIdentifier = Normalize(identifier);
            var user = _dbContext.Users.FirstOrDefault(u =>
                u.NormalizedEmail == normalizedIdentifier ||
                (!string.IsNullOrWhiteSpace(u.NormalizedUsername) && u.NormalizedUsername == normalizedIdentifier));

            if (user == null || !user.EmailConfirmed)
            {
                return new LoginResult();
            }

            if (passwordHasher.VerifyHashedPassword(null, user.PasswordHash, password) != PasswordVerificationResult.Success)
            {
                return new LoginResult();
            }

            user.LastLoginUtc = DateTime.UtcNow;
            _dbContext.SaveChanges();
            _systemEventService.RecordUserLoggedIn(user);

            return ToLoginResult(user);
        }

        public LoginResult GetLoginResultForUserId(int userId)
        {
            // Development auto-login needs the same claim data as a password login, without changing login timestamps.
            var user = _dbContext.Users.FirstOrDefault(u => u.Id == userId);
            return user == null
                ? new LoginResult()
                : ToLoginResult(user);
        }

        public void Signup(SignupDto request, string publicBaseUrl)
        {
            var normalizedEmail = NormalizeEmail(request?.Email);
            var username = NormalizeOptionalText(request?.Username);
            var normalizedUsername = string.IsNullOrWhiteSpace(username) ? null : Normalize(username);
            var fullName = NormalizeRequiredText(request?.FullName, "Full name");
            var password = request?.Password ?? string.Empty;

            ValidateEmail(normalizedEmail);
            ValidatePassword(password, normalizedEmail, username);

            if (_dbContext.Users.Any(u => u.NormalizedEmail == Normalize(normalizedEmail)))
            {
                throw new InvalidOperationException("A user with this email address already exists.");
            }

            if (GetConfiguredUsers().Any(u => !string.IsNullOrWhiteSpace(u.Email) && Normalize(u.Email) == Normalize(normalizedEmail)))
            {
                throw new InvalidOperationException("A configured superadmin user already uses this email address.");
            }

            if (!string.IsNullOrWhiteSpace(normalizedUsername) &&
                _dbContext.Users.Any(u => u.NormalizedUsername == normalizedUsername))
            {
                throw new InvalidOperationException("A user with this username already exists.");
            }

            if (!string.IsNullOrWhiteSpace(normalizedUsername) &&
                GetConfiguredUsers().Any(u => Normalize(u.Username) == normalizedUsername))
            {
                throw new InvalidOperationException("A configured superadmin user already uses this username.");
            }

            var token = GenerateToken();
            var now = DateTime.UtcNow;
            var user = new AppUser
            {
                Email = normalizedEmail,
                NormalizedEmail = Normalize(normalizedEmail),
                Username = username,
                NormalizedUsername = normalizedUsername,
                FullName = fullName,
                PasswordHash = new PasswordHasher<string>().HashPassword(null, password),
                EmailConfirmed = false,
                EmailConfirmationTokenHash = HashToken(token),
                EmailConfirmationTokenExpiresUtc = now.AddHours(ConfirmationTokenHours),
                CreatedUtc = now
            };

            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();

            var confirmationUrl = BuildUrl(publicBaseUrl, "/confirm-email", $"userId={user.Id}&token={Uri.EscapeDataString(token)}");
            try
            {
                _mailService.SendEmailConfirmationAsync(user.Email, user.FullName, confirmationUrl).GetAwaiter().GetResult();
            }
            catch
            {
                _dbContext.Users.Remove(user);
                _dbContext.SaveChanges();
                throw;
            }

            _systemEventService.RecordUserRegistered(user);
        }

        public string ConfirmEmail(int userId, string token)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null || string.IsNullOrWhiteSpace(token))
            {
                throw new InvalidOperationException("The confirmation link is invalid.");
            }

            if (!user.EmailConfirmed)
            {
                if (user.EmailConfirmationTokenExpiresUtc < DateTime.UtcNow ||
                    user.EmailConfirmationTokenHash != HashToken(token))
                {
                    throw new InvalidOperationException("The confirmation link is invalid or has expired.");
                }

                user.EmailConfirmed = true;
                user.EmailConfirmationTokenHash = null;
                user.EmailConfirmationTokenExpiresUtc = null;
                user.UpdatedUtc = DateTime.UtcNow;
                _dbContext.SaveChanges();
                _systemEventService.RecordUserEmailConfirmed(user);
            }

            return user.Email;
        }

        public void RequestPasswordReset(string email, string publicBaseUrl)
        {
            var normalizedEmail = NormalizeEmail(email);
            var user = _dbContext.Users.FirstOrDefault(u => u.NormalizedEmail == Normalize(normalizedEmail));
            if (user == null || !user.EmailConfirmed)
            {
                return;
            }

            var token = GenerateToken();
            user.PasswordResetTokenHash = HashToken(token);
            user.PasswordResetTokenExpiresUtc = DateTime.UtcNow.AddHours(PasswordResetTokenHours);
            user.UpdatedUtc = DateTime.UtcNow;
            _dbContext.SaveChanges();

            var resetUrl = BuildUrl(publicBaseUrl, "/reset-password", $"userId={user.Id}&token={Uri.EscapeDataString(token)}");
            _mailService.SendPasswordResetAsync(user.Email, user.FullName, resetUrl).GetAwaiter().GetResult();
        }

        public LoginResult ResetPassword(ResetPasswordDto request)
        {
            if (request == null)
            {
                throw new InvalidOperationException("The reset link is invalid.");
            }

            var user = _dbContext.Users.FirstOrDefault(u => u.Id == request.UserId);
            if (user == null || string.IsNullOrWhiteSpace(request.Token))
            {
                throw new InvalidOperationException("The reset link is invalid.");
            }

            ValidatePasswordPair(request.Password, request.ConfirmPassword, user.Email, user.Username);

            if (user.PasswordResetTokenExpiresUtc < DateTime.UtcNow ||
                user.PasswordResetTokenHash != HashToken(request.Token))
            {
                throw new InvalidOperationException("The reset link is invalid or has expired.");
            }

            user.PasswordHash = new PasswordHasher<string>().HashPassword(null, request.Password);
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresUtc = null;
            user.LastLoginUtc = DateTime.UtcNow;
            user.UpdatedUtc = DateTime.UtcNow;
            _dbContext.SaveChanges();

            return ToLoginResult(user);
        }

        public void ChangeOwnPassword(int userId, ChangePasswordDto request)
        {
            if (request == null)
            {
                throw new InvalidOperationException("Password change details are required.");
            }

            var user = _dbContext.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            if (new PasswordHasher<string>().VerifyHashedPassword(null, user.PasswordHash, request.CurrentPassword ?? string.Empty) != PasswordVerificationResult.Success)
            {
                throw new InvalidOperationException("The current password is incorrect.");
            }

            ValidatePasswordPair(request.Password, request.ConfirmPassword, user.Email, user.Username);
            user.PasswordHash = new PasswordHasher<string>().HashPassword(null, request.Password);
            user.UpdatedUtc = DateTime.UtcNow;
            _dbContext.SaveChanges();
        }

        public UserAdminListDto GetAdminList()
        {
            return new UserAdminListDto
            {
                Users = _dbContext.Users
                    .OrderBy(u => u.Email)
                    .Select(u => new UserAdminDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        Username = u.Username,
                        FullName = u.FullName,
                        EmailConfirmed = u.EmailConfirmed,
                        CreatedUtc = u.CreatedUtc.ToString("O"),
                        LastLoginUtc = u.LastLoginUtc == null ? null : u.LastLoginUtc.Value.ToString("O")
                    })
                    .ToList(),
                SuperAdmins = GetConfiguredUsers()
                    .Select(u => new SuperAdminUserDto
                    {
                        Username = u.Username,
                        Email = u.Email,
                        FullName = u.FullName
                    })
                    .ToList()
            };
        }

        public void AdminChangePassword(int userId, AdminChangeUserPasswordDto request)
        {
            if (request == null)
            {
                throw new InvalidOperationException("Password change details are required.");
            }

            var user = _dbContext.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            ValidatePasswordPair(request.Password, request.ConfirmPassword, user.Email, user.Username);
            user.PasswordHash = new PasswordHasher<string>().HashPassword(null, request.Password);
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresUtc = null;
            user.UpdatedUtc = DateTime.UtcNow;
            _dbContext.SaveChanges();
        }

        public void AdminDeleteUser(int userId)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            var ownedData = new[]
            {
                ("observation sessions", _dbContext.ObsSessions.Any(s => s.UserId == userId)),
                ("observations", _dbContext.Observations.Any(o => o.UserId == userId)),
                ("DSO extras", _dbContext.DsoExtra.Any(e => e.UserId == userId)),
                ("observation resources", _dbContext.ObsResources.Any(r => r.UserId == userId)),
                ("locations", _dbContext.Locations.Any(l => l.UserId == userId)),
                ("instruments", _dbContext.Instruments.Any(i => i.UserId == userId)),
                ("eyepieces", _dbContext.Eyepieces.Any(e => e.UserId == userId))
            }
            .Where(item => item.Item2)
            .Select(item => item.Item1)
            .ToList();

            if (ownedData.Count > 0)
            {
                throw new InvalidOperationException("Cannot delete this user because they still own " + string.Join(", ", ownedData) + ".");
            }

            _dbContext.Users.Remove(user);
            _dbContext.SaveChanges();
        }

        public IEnumerable<ConfiguredLoginUser> GetConfiguredUsers()
        {
            var configuredUsers = _configuration.GetSection("Authentication:Users").Get<List<ConfiguredLoginUser>>();
            if (configuredUsers?.Count > 0)
            {
                return configuredUsers.Where(u => !string.IsNullOrWhiteSpace(u.Username) && !string.IsNullOrWhiteSpace(u.HashedPassword));
            }

            var legacyUser = new ConfiguredLoginUser
            {
                Username = _configuration.GetSection("AdminUser:Username").Get<string>(),
                HashedPassword = _configuration.GetSection("AdminUser:HashedPassword").Get<string>(),
                Email = _configuration.GetSection("AdminUser:Email").Get<string>(),
                FullName = _configuration.GetSection("AdminUser:FullName").Get<string>()
            };
            return string.IsNullOrWhiteSpace(legacyUser.Username) || string.IsNullOrWhiteSpace(legacyUser.HashedPassword)
                ? Enumerable.Empty<ConfiguredLoginUser>()
                : new[] { legacyUser };
        }

        private static LoginResult ToLoginResult(AppUser user)
        {
            return new LoginResult
            {
                Success = true,
                IsSuperAdmin = false,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName
            };
        }

        private static void ValidatePasswordPair(string password, string confirmPassword, string email, string username)
        {
            if (password != confirmPassword)
            {
                throw new InvalidOperationException("The two password fields must match.");
            }

            ValidatePassword(password, email, username);
        }

        private static void ValidatePassword(string password, string email, string username)
        {
            if (password == null || password.Length < 10)
            {
                throw new InvalidOperationException("Password must be at least 10 characters long.");
            }

            if (password.Trim() != password)
            {
                throw new InvalidOperationException("Password must not start or end with whitespace.");
            }

            if (!password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            {
                throw new InvalidOperationException("Password must contain at least one letter and one number.");
            }

            if (!string.IsNullOrWhiteSpace(email) && string.Equals(password, email, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Password must not equal the email address.");
            }

            if (!string.IsNullOrWhiteSpace(username) && string.Equals(password, username, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Password must not equal the username.");
            }
        }

        private static string NormalizeEmail(string email)
        {
            return NormalizeRequiredText(email, "Email");
        }

        private static void ValidateEmail(string email)
        {
            try
            {
                _ = new MailAddress(email);
            }
            catch
            {
                throw new InvalidOperationException("Email address is invalid.");
            }
        }

        private static string NormalizeRequiredText(string value, string fieldName)
        {
            var normalized = value?.Trim();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new InvalidOperationException(fieldName + " is required.");
            }

            return normalized;
        }

        private static string NormalizeOptionalText(string value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string Normalize(string value)
        {
            return value?.Trim().ToUpperInvariant();
        }

        private static string GenerateToken()
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }

            return Convert.ToBase64String(bytes);
        }

        private static string HashToken(string token)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
                return Convert.ToBase64String(hash);
            }
        }

        private static string BuildUrl(string publicBaseUrl, string path, string query)
        {
            var baseUrl = publicBaseUrl.TrimEnd('/');
            return $"{baseUrl}{path}?{query}";
        }
    }

    public class ConfiguredLoginUser
    {
        public string Username { get; set; }
        public string HashedPassword { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
    }
}
