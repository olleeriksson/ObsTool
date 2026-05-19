using MailKit.Security;

namespace ObsTool.Services
{
    public class MailServiceOptions
    {
        public const string SectionName = "MailService";

        public string MailTo { get; set; }
        public string MailFrom { get; set; }
        public string SenderName { get; set; } = "ObsTool";
        public string SmtpHost { get; set; }
        public int SmtpPort { get; set; } = 587;
        public string SmtpUsername { get; set; }
        public string SmtpPassword { get; set; }
        public string SecureSocketOption { get; set; } = nameof(SecureSocketOptions.StartTls);
    }
}
