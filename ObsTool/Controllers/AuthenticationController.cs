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
using TestWebAppNoAuth.Models;

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

            var cfgUsername = _configuration.GetSection("AdminUser:Username").Get<string>();
            var cfgHashedPassword = _configuration.GetSection("AdminUser:HashedPassword").Get<string>();

            if (providedUsername == cfgUsername)
            {
                var passwordHasher = new PasswordHasher<string>();
                if (passwordHasher.VerifyHashedPassword(null, cfgHashedPassword, providedPassword) == PasswordVerificationResult.Success)
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
    }
}