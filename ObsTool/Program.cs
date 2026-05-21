using NLog.Web;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ObsTool.Database;
using ObsTool.Utils;

namespace ObsTool
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();
            if (DatabaseBootstrapCommand.IsBootstrapCommand(args))
            {
                DatabaseBootstrapCommand.Run(host.Services, args);
                return;
            }
            if (PasswordHashCommand.IsHashPasswordCommand(args))
            {
                PasswordHashCommand.Run(args);
                return;
            }

            host.Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureLogging(logging =>
                {
                    // Avoid Windows Event Log writes when running the published app as a normal user.
                    logging.ClearProviders();
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureAppConfiguration((hostingContext, config) =>
                    {
                        var env = hostingContext.HostingEnvironment;

                        // Read configuration from appsettings.json
                        config
                            //.SetBasePath(env.ContentRootPath) //??
                            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                            .AddJsonFile($"appsettings.{env.EnvironmentName}.json",
                                        optional: true, reloadOnChange: true);
                        // Local production runs use Production settings but still need machine-local secrets.
                        config.AddUserSecrets<Program>(optional: true);
                        // Add environment variables to config
                        config.AddEnvironmentVariables();

                        // Read NLog configuration from the nlog config file
                        //env.ConfigureNLog($"nlog.{env.EnvironmentName}.config");
                    });
                })
                .UseNLog();
    }
}
