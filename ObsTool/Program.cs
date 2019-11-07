using NLog.Web;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ObsTool
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Old 2.0
            //BuildWebHost(args).Run();

            // 2.1
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureAppConfiguration((hostingContext, config) =>
                    {
                        var env = hostingContext.HostingEnvironment;

                        //Read configuration from appsettings.json
                        config
                            //.SetBasePath(env.ContentRootPath) //??
                            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                            .AddJsonFile($"appsettings.{env.EnvironmentName}.json",
                                        optional: true, reloadOnChange: true);
                        //Add environment variables to config
                        config.AddEnvironmentVariables();

                        //Read NLog configuration from the nlog config file
                        //env.ConfigureNLog($"nlog.{env.EnvironmentName}.config");
                    });
                })
                .UseNLog();

        //public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
        //    WebHost.CreateDefaultBuilder(args)
        //        .UseStartup<Startup>()
        //        .ConfigureLogging(logging =>  // new in 2.2
        //        {
        //            logging.AddConsole();
        //            logging.AddNLog();
        //        })
        //    ;
    }
}
