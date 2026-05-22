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
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(AuthClaimTypes.UserId);
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            throw new ObsToolException(403, "This endpoint requires a database-backed user.");
        }
    }
}
