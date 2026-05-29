namespace ObsTool.Models
{
    public class AuthenticationStatusDto
    {
        public bool IsLoggedIn { get; set; }
        public int? UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public bool IsSuperAdmin { get; set; }
        public bool CanManageUsers { get; set; }
    }
}
