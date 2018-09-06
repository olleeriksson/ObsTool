namespace ObsTool.Services
{
    public interface ILocalMailService
    {
        void SendMail(string subject, string message);
    }
}