namespace ObsTool.Services
{
    public class AppOptions
    {
        public const string SectionName = "App";

        public string PublicBaseUrl { get; set; }

        public int? DevelopmentAutoLoginUserId { get; set; }
    }
}
