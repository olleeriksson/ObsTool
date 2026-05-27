using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace ObsTool.Services
{
    public class CurrentUserService
    { 
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int GetRequiredUserId()
        {
            var userId = GetUserId();
            if (userId.HasValue)
            {
                return userId.Value;
            }

            throw new ObsToolException(403, "This endpoint requires a database-backed user.");
        }

        /// <summary>
        /// Returns the database user id claim when the current login has one.
        /// </summary>
        public int? GetUserId()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(AuthClaimTypes.UserId);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
