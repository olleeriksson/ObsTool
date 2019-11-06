﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NLog.Extensions.Logging;

namespace ObsTool
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Old 2.0
            //BuildWebHost(args).Run();

            // 2.1
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .ConfigureLogging(logging =>  // new in 2.2
                {
                    logging.AddConsole();
                    logging.AddNLog();
                })
            ;
    }
}
