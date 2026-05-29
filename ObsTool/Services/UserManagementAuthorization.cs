using System;
using System.Security.Claims;

namespace ObsTool.Services
{
    public static class UserManagementAuthorization
    {
        private const int DatabaseOwnerUserId = 1;

        /// <summary>
        /// Allows configured superadmins and the original database owner account to manage database users.
        /// </summary>
        public static bool CanManageUsers(ClaimsPrincipal user)
        {
            return IsSuperAdmin(user) || GetDatabaseUserId(user) == DatabaseOwnerUserId;
        }

        /// <summary>
        /// Reads the configured-superadmin marker from the authenticated user's claims.
        /// </summary>
        private static bool IsSuperAdmin(ClaimsPrincipal user)
        {
            return string.Equals(user?.FindFirstValue(AuthClaimTypes.IsSuperAdmin), bool.TrueString, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Reads the database user id from claims when the current login came from the Users table.
        /// </summary>
        private static int? GetDatabaseUserId(ClaimsPrincipal user)
        {
            var userIdClaim = user?.FindFirstValue(AuthClaimTypes.UserId);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
