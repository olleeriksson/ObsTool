using System;

namespace ObsTool.Models
{
    public class EmailTestResultDto
    {
        public string Message { get; set; }
        public string To { get; set; }
        public string From { get; set; }
        public string SmtpHost { get; set; }
        public int SmtpPort { get; set; }
        public DateTime SentAtUtc { get; set; }
    }
}
