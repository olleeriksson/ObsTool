using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ObsTool.Models;

namespace ObsTool.Controllers
{
    [Route("api/authentication")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthenticationController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginDto requestDto)
        {
            var providedUsername = requestDto.Username;
            var providedPassword = requestDto.Password;

            foreach (var configuredUser in GetConfiguredUsers())
            {
                if (providedUsername == configuredUser.Username)
                {
                    var passwordHasher = new PasswordHasher<string>();
                    if (passwordHasher.VerifyHashedPassword(null, configuredUser.HashedPassword, providedPassword) == PasswordVerificationResult.Success)
                    {
                        var claims = new List<Claim>
                        {
                            new Claim(ClaimTypes.Name, providedUsername)
                        };
                        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity));
                        return Ok();
                    }
                }
            }
            return Unauthorized();
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task LogoutAsync()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }

        [HttpGet("loggedin")]
        public IActionResult LoggedIn()
        {
            // If the user can access this endpoint, which is in some cases protected
            // by authorization, then they are logged in.
            return Ok("Yes you are logged in");
            //return Unauthorized("You are not logged in");
        }

        private IEnumerable<ConfiguredLoginUser> GetConfiguredUsers()
        {
            var configuredUsers = _configuration.GetSection("Authentication:Users").Get<List<ConfiguredLoginUser>>();
            if (configuredUsers?.Count > 0)
            {
                return configuredUsers.Where(u => !string.IsNullOrWhiteSpace(u.Username) && !string.IsNullOrWhiteSpace(u.HashedPassword));
            }

            // Preserve the old single-user config path so existing local appsettings keep working.
            var legacyUser = new ConfiguredLoginUser
            {
                Username = _configuration.GetSection("AdminUser:Username").Get<string>(),
                HashedPassword = _configuration.GetSection("AdminUser:HashedPassword").Get<string>()
            };
            return string.IsNullOrWhiteSpace(legacyUser.Username) || string.IsNullOrWhiteSpace(legacyUser.HashedPassword)
                ? Enumerable.Empty<ConfiguredLoginUser>()
                : new[] { legacyUser };
        }

        private class ConfiguredLoginUser
        {
            public string Username { get; set; }
            public string HashedPassword { get; set; }
        }
    }
}
