using System;
using Microsoft.AspNetCore.Mvc;
using ObsTool.Models;
using ObsTool.Services;

namespace ObsTool.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly UserAccountService _userAccountService;

        public UsersController(UserAccountService userAccountService)
        {
            _userAccountService = userAccountService;
        }

        [HttpGet("admin")]
        public IActionResult GetAdminList()
        {
            if (!UserManagementAuthorization.CanManageUsers(User))
            {
                return Forbid();
            }

            return Ok(_userAccountService.GetAdminList());
        }

        [HttpPut("{userId}/password")]
        public IActionResult ChangeUserPassword(int userId, [FromBody] AdminChangeUserPasswordDto requestDto)
        {
            if (!UserManagementAuthorization.CanManageUsers(User))
            {
                return Forbid();
            }

            try
            {
                _userAccountService.AdminChangePassword(userId, requestDto);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ToErrorDetails(ex.Message));
            }
        }

        [HttpDelete("{userId}")]
        public IActionResult DeleteUser(int userId)
        {
            if (!UserManagementAuthorization.CanManageUsers(User))
            {
                return Forbid();
            }

            try
            {
                _userAccountService.AdminDeleteUser(userId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ToErrorDetails(ex.Message));
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
