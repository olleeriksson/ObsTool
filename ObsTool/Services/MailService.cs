using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using ObsTool.Models;

namespace ObsTool.Services
{
    public interface IMailService
    {
        EmailTestSettingsDto GetSettings();
        Task<EmailTestResultDto> SendTestEmailAsync(EmailTestRequestDto request, string triggeredBy);
    }

    public class MailService : IMailService
    {
        private readonly MailServiceOptions _options;

        public MailService(IOptions<MailServiceOptions> options)
        {
            _options = options.Value;
        }

        public EmailTestSettingsDto GetSettings()
        {
            // This endpoint is diagnostic-only; expose readiness without returning secrets.
            return new EmailTestSettingsDto
            {
                IsConfigured = GetMissingSettings().Count == 0,
                MailTo = _options.MailTo,
                MailFrom = _options.MailFrom,
                SmtpHost = _options.SmtpHost,
                SmtpPort = _options.SmtpPort,
                SecureSocketOption = _options.SecureSocketOption,
                HasUsername = !string.IsNullOrWhiteSpace(_options.SmtpUsername),
                HasPassword = !string.IsNullOrWhiteSpace(_options.SmtpPassword)
            };
        }

        public async Task<EmailTestResultDto> SendTestEmailAsync(EmailTestRequestDto request, string triggeredBy)
        {
            var missingSettings = GetMissingSettings();
            if (missingSettings.Count > 0)
            {
                throw new InvalidOperationException("MailService is missing required settings: " + string.Join(", ", missingSettings));
            }

            var recipient = string.IsNullOrWhiteSpace(request?.To) ? _options.MailTo : request.To.Trim();
            var subject = string.IsNullOrWhiteSpace(request?.Subject) ? "ObsTool test email" : request.Subject.Trim();
            var body = string.IsNullOrWhiteSpace(request?.Body)
                ? "This is a test email from the ObsTool backend."
                : request.Body.Trim();

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_options.SenderName, _options.MailFrom));
            message.To.Add(MailboxAddress.Parse(recipient));
            message.Subject = subject;
            message.Body = new TextPart("plain")
            {
                Text = body + Environment.NewLine + Environment.NewLine + $"Triggered by: {triggeredBy ?? "unknown"}" + Environment.NewLine + $"UTC: {DateTime.UtcNow:O}"
            };

            using (var client = new SmtpClient())
            {
                await client.ConnectAsync(_options.SmtpHost, _options.SmtpPort, ParseSecureSocketOption(_options.SecureSocketOption));
                await client.AuthenticateAsync(_options.SmtpUsername, _options.SmtpPassword);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }

            return new EmailTestResultDto
            {
                Message = "Test email sent.",
                To = recipient,
                From = _options.MailFrom,
                SmtpHost = _options.SmtpHost,
                SmtpPort = _options.SmtpPort,
                SentAtUtc = DateTime.UtcNow
            };
        }

        private List<string> GetMissingSettings()
        {
            var missingSettings = new List<string>();

            if (string.IsNullOrWhiteSpace(_options.MailTo))
            {
                missingSettings.Add("MailTo");
            }

            if (string.IsNullOrWhiteSpace(_options.MailFrom))
            {
                missingSettings.Add("MailFrom");
            }

            if (string.IsNullOrWhiteSpace(_options.SmtpHost))
            {
                missingSettings.Add("SmtpHost");
            }

            if (_options.SmtpPort <= 0)
            {
                missingSettings.Add("SmtpPort");
            }

            if (string.IsNullOrWhiteSpace(_options.SmtpUsername))
            {
                missingSettings.Add("SmtpUsername");
            }

            if (string.IsNullOrWhiteSpace(_options.SmtpPassword))
            {
                missingSettings.Add("SmtpPassword");
            }

            return missingSettings;
        }

        private static SecureSocketOptions ParseSecureSocketOption(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return SecureSocketOptions.StartTls;
            }

            switch (value.Trim().ToLowerInvariant())
            {
                case "none":
                    return SecureSocketOptions.None;
                case "auto":
                    return SecureSocketOptions.Auto;
                case "ssl":
                case "sslonconnect":
                    return SecureSocketOptions.SslOnConnect;
                case "starttlswhenavailable":
                    return SecureSocketOptions.StartTlsWhenAvailable;
                case "starttls":
                default:
                    return SecureSocketOptions.StartTls;
            }
        }
    }
}
