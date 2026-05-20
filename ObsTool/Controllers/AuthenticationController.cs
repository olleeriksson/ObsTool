using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [Route("api/authentication")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly UserAccountService _userAccountService;
        private readonly AppOptions _appOptions;

        public AuthenticationController(UserAccountService userAccountService, IOptions<AppOptions> appOptions)
        {
            _userAccountService = userAccountService;
            _appOptions = appOptions.Value;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginDto requestDto)
        {
            var loginResult = _userAccountService.ValidateLogin(requestDto?.Username, requestDto?.Password);
            if (!loginResult.Success)
            {
                return Unauthorized();
            }

            await SignInAsync(loginResult);
            return Ok(ToAuthenticationStatus(loginResult));
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> LogoutAsync()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new AuthenticationStatusDto { IsLoggedIn = false });
        }

        [AllowAnonymous]
        [HttpGet("loggedin")]
        public IActionResult LoggedIn()
        {
            // The SPA uses this as its page-level auth gate before rendering database-backed views.
            return Ok(GetAuthenticationStatusFromClaims());
        }

        [AllowAnonymous]
        [HttpPost("signup")]
        public IActionResult Signup([FromBody] SignupDto requestDto)
        {
            try
            {
                _userAccountService.Signup(requestDto, GetPublicBaseUrl());
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ToErrorDetails(ex.Message));
            }
        }

        [AllowAnonymous]
        [HttpPost("confirm-email")]
        public IActionResult ConfirmEmail([FromBody] ConfirmEmailDto requestDto)
        {
            try
            {
                var email = _userAccountService.ConfirmEmail(requestDto?.UserId ?? 0, requestDto?.Token);
                return Ok(new ConfirmEmailResultDto { Email = email });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ToErrorDetails(ex.Message));
            }
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword([FromBody] ForgotPasswordDto requestDto)
        {
            try
            {
                _userAccountService.RequestPasswordReset(requestDto?.Email, GetPublicBaseUrl());
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ToErrorDetails(ex.Message));
            }
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordDto requestDto)
        {
            try
            {
                var loginResult = _userAccountService.ResetPassword(requestDto);
                await SignInAsync(loginResult);
                return Ok(ToAuthenticationStatus(loginResult));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ToErrorDetails(ex.Message));
            }
        }

        [HttpPost("change-password")]
        public IActionResult ChangePassword([FromBody] ChangePasswordDto requestDto)
        {
            try
            {
                var userId = GetDatabaseUserId();
                if (userId == null)
                {
                    return BadRequest(ToErrorDetails("Configured superadmin users do not have a database password to change here."));
                }

                _userAccountService.ChangeOwnPassword(userId.Value, requestDto);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ToErrorDetails(ex.Message));
            }
        }

        private async Task SignInAsync(LoginResult loginResult)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, loginResult.DisplayName),
                new Claim(AuthClaimTypes.AuthSource, loginResult.IsSuperAdmin ? "Environment" : "Database"),
                new Claim(AuthClaimTypes.IsSuperAdmin, loginResult.IsSuperAdmin.ToString())
            };

            AddClaimIfValue(claims, AuthClaimTypes.UserId, loginResult.UserId?.ToString());
            AddClaimIfValue(claims, AuthClaimTypes.Username, loginResult.Username);
            AddClaimIfValue(claims, ClaimTypes.Email, loginResult.Email);
            AddClaimIfValue(claims, AuthClaimTypes.FullName, loginResult.FullName);

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity));
        }

        private AuthenticationStatusDto GetAuthenticationStatusFromClaims()
        {
            var isLoggedIn = User.Identity?.IsAuthenticated ?? false;
            return new AuthenticationStatusDto
            {
                IsLoggedIn = isLoggedIn,
                Username = isLoggedIn ? User.FindFirstValue(AuthClaimTypes.Username) : null,
                Email = isLoggedIn ? User.FindFirstValue(ClaimTypes.Email) : null,
                FullName = isLoggedIn ? User.FindFirstValue(AuthClaimTypes.FullName) : null,
                IsSuperAdmin = isLoggedIn && string.Equals(User.FindFirstValue(AuthClaimTypes.IsSuperAdmin), bool.TrueString, StringComparison.OrdinalIgnoreCase)
            };
        }

        private static AuthenticationStatusDto ToAuthenticationStatus(LoginResult loginResult)
        {
            return new AuthenticationStatusDto
            {
                IsLoggedIn = true,
                Username = loginResult.Username,
                Email = loginResult.Email,
                FullName = loginResult.FullName,
                IsSuperAdmin = loginResult.IsSuperAdmin
            };
        }

        private int? GetDatabaseUserId()
        {
            var userIdClaim = User.FindFirstValue(AuthClaimTypes.UserId);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private string GetPublicBaseUrl()
        {
            if (!string.IsNullOrWhiteSpace(_appOptions.PublicBaseUrl))
            {
                return _appOptions.PublicBaseUrl.TrimEnd('/');
            }

            var origin = Request.Headers["Origin"].ToString();
            if (!string.IsNullOrWhiteSpace(origin))
            {
                return $"{origin.TrimEnd('/')}{Request.PathBase}".TrimEnd('/');
            }

            return $"{Request.Scheme}://{Request.Host}{Request.PathBase}".TrimEnd('/');
        }

        private static void AddClaimIfValue(List<Claim> claims, string type, string value)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                claims.Add(new Claim(type, value));
            }
        }

        private static ErrorDetails ToErrorDetails(string message)
        {
            return new ErrorDetails
            {
                StatusCode = 400,
                Message = message
            };
        }
    }
}
