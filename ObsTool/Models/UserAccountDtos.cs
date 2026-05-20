using System.Collections.Generic;

namespace ObsTool.Models
{
    public class SignupDto
    {
        public string Email { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
        public string Password { get; set; }
    }

    public class ConfirmEmailDto
    {
        public int UserId { get; set; }
        public string Token { get; set; }
    }

    public class ConfirmEmailResultDto
    {
        public string Email { get; set; }
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; }
    }

    public class ResetPasswordDto
    {
        public int UserId { get; set; }
        public string Token { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class AdminChangeUserPasswordDto
    {
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class UserAdminDto
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
        public bool EmailConfirmed { get; set; }
        public string CreatedUtc { get; set; }
        public string LastLoginUtc { get; set; }
    }

    public class SuperAdminUserDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
    }

    public class UserAdminListDto
    {
        public IEnumerable<UserAdminDto> Users { get; set; }
        public IEnumerable<SuperAdminUserDto> SuperAdmins { get; set; }
    }
}
