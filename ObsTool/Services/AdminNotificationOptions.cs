namespace ObsTool.Services
{
    public class AdminNotificationOptions
    {
        public const string SectionName = "AdminNotifications";

        public bool Enabled { get; set; }

        public string AdminEmail { get; set; } = "mail@olle-eriksson.com";

        public int[] SuppressedUserIds { get; set; } = new[] { 1 };
    }
}
