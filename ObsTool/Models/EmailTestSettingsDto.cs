namespace ObsTool.Models
{
    public class EmailTestSettingsDto
    {
        public bool IsConfigured { get; set; }
        public string MailTo { get; set; }
        public string MailFrom { get; set; }
        public string SmtpHost { get; set; }
        public int SmtpPort { get; set; }
        public string SecureSocketOption { get; set; }
        public bool HasUsername { get; set; }
        public bool HasPassword { get; set; }
    }
}
