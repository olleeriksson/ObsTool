using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Services
{
    public class LocalMailService : ILocalMailService
    {
        public string MailTo { get; set; } = Startup.Configuration["MailService:MailTo"];
        public string MailFrom { get; set; } = Startup.Configuration["MailService:MailFrom"];

        public void SendMail(string subject, string message) {
            Debug.WriteLine($"Sending mail to {MailTo}: \"{subject}\"");
        }
    }
}
