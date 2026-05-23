namespace ObsTool.Services
{
    public class AdminNotificationOptions
    {
        public const string SectionName = "AdminNotifications";

        public bool Enabled { get; set; }

        public string AdminEmail { get; set; } = "mail@olle-eriksson.com";

        public int? SuppressedUserId { get; set; } = 1;
    }
}
