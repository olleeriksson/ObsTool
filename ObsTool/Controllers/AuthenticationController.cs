using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [Route("api/authentication")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private const string DevelopmentAutoLoginSuppressedCookieName = "obstool-dev-auto-login-suppressed";

        private readonly UserAccountService _userAccountService;
        private readonly AppOptions _appOptions;
        private readonly IHostEnvironment _environment;

        public AuthenticationController(UserAccountService userAccountService, IOptions<AppOptions> appOptions, IHostEnvironment environment)
        {
            _userAccountService = userAccountService;
            _appOptions = appOptions.Value;
            _environment = environment;
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
            ClearDevelopmentAutoLoginSuppression();
            return Ok(ToAuthenticationStatus(loginResult));
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> LogoutAsync()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            SuppressDevelopmentAutoLogin();
            return Ok(new AuthenticationStatusDto { IsLoggedIn = false });
        }

        [AllowAnonymous]
        [HttpGet("loggedin")]
        public async Task<IActionResult> LoggedInAsync()
        {
            // The SPA uses this as its page-level auth gate before rendering database-backed views.
            return Ok(await GetAuthenticationStatusForCurrentRequestAsync());
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
                ClearDevelopmentAutoLoginSuppression();
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

        private async Task<AuthenticationStatusDto> GetAuthenticationStatusForCurrentRequestAsync()
        {
            // Development auto-login signs user 1 into the normal cookie flow unless this browser explicitly logged out.
            if (User.Identity?.IsAuthenticated ?? false)
            {
                return GetAuthenticationStatusFromClaims();
            }

            if (!ShouldUseDevelopmentAutoLogin())
            {
                return GetAuthenticationStatusFromClaims();
            }

            var loginResult = _userAccountService.GetLoginResultForUserId(_appOptions.DevelopmentAutoLoginUserId.Value);
            if (!loginResult.Success)
            {
                return GetAuthenticationStatusFromClaims();
            }

            await SignInAsync(loginResult);
            return ToAuthenticationStatus(loginResult);
        }

        private AuthenticationStatusDto GetAuthenticationStatusFromClaims()
        {
            var isLoggedIn = User.Identity?.IsAuthenticated ?? false;
            return new AuthenticationStatusDto
            {
                IsLoggedIn = isLoggedIn,
                UserId = isLoggedIn ? GetDatabaseUserId() : null,
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
                UserId = loginResult.UserId,
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

        private bool ShouldUseDevelopmentAutoLogin()
        {
            // ***********************************************************************
            // Very important part!!
            // Only local Development can opt into the automatic starting identity.
            // ***********************************************************************
            return _environment.IsDevelopment() &&
                _appOptions.DevelopmentAutoLoginUserId.HasValue &&
                IsDevelopmentAutoLoginHost() &&
                !Request.Cookies.ContainsKey(DevelopmentAutoLoginSuppressedCookieName);
        }

        private bool IsDevelopmentAutoLoginHost()
        {
            // Keep the development shortcut tied to loopback hosts, even if a hosted app is misconfigured as Development.
            var host = Request.Host.Host;
            return string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(host, "127.0.0.1", StringComparison.OrdinalIgnoreCase);
        }

        private void SuppressDevelopmentAutoLogin()
        {
            if (!_environment.IsDevelopment() || !_appOptions.DevelopmentAutoLoginUserId.HasValue)
            {
                return;
            }

            Response.Cookies.Append(DevelopmentAutoLoginSuppressedCookieName, "true", BuildDevelopmentAutoLoginCookieOptions());
        }

        private void ClearDevelopmentAutoLoginSuppression()
        {
            if (!_environment.IsDevelopment() || !_appOptions.DevelopmentAutoLoginUserId.HasValue)
            {
                return;
            }

            Response.Cookies.Delete(DevelopmentAutoLoginSuppressedCookieName, BuildDevelopmentAutoLoginCookieOptions());
        }

        private CookieOptions BuildDevelopmentAutoLoginCookieOptions()
        {
            // Match the auth cookie path so suppression applies only to this local app path.
            return new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
                Path = Request.PathBase.HasValue ? Request.PathBase.Value : "/"
            };
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
