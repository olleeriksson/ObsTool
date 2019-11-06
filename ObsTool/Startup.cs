using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Entities;
using ObsTool.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NLog.Extensions.Logging;
using ObsTool.Utils;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;

namespace ObsTool
{
    public class Startup
    {
        // Old old:
        //public Startup(IHostingEnvironment env)
        public Startup(IConfiguration configuration, IHostingEnvironment env)
        {
            string environment = env.EnvironmentName;
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json")
#if DEBUG
                .AddJsonFile("appsettings.Development.json")
#else
                .AddJsonFile("appsettings.Production.json")
#endif
                //.AddJsonFile("appsettings." + environment + ".json")
                .AddEnvironmentVariables();

            // Old old:
            //Configuration = configuration; // old

            // Old 2.0
            //Configuration = builder.Build();

            Configuration = configuration;
        }

        public static IConfiguration Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc()
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);
            services.AddCors();
            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

            // SQL Server
            //services.AddDbContext<Entities.MainDbContext>(o => o.UseSqlServer(Configuration["Db:ConnectionString"]));

            // Sqlite
            services.AddDbContext<Entities.MainDbContext>(o => o.UseSqlite(Configuration["Db:ConnectionString"]));

            services.AddScoped<ObsSessionsRepo>();
            services.AddScoped<LocationsRepo>();
            services.AddScoped<IDsoRepo, DsoRepo>();
            services.AddScoped<ObservationsRepo>();
            services.AddScoped<ReportTextManager>();
            services.AddScoped<ObservationsService>();
            services.AddScoped<ObsResourcesRepo>();
            services.AddScoped<DsoObservationsRepo>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // New in 2.1 but I disabled it
                app.UseHsts();
            }

            // Removed for 2.1
            //loggerFactory.AddNLog();

            // New in 2.1 but I disabled it
            //app.UseHttpsRedirection();

            app.UseCors(options => options.WithOrigins(Configuration["CorsAllowedOrigins"])
                .AllowAnyMethod()
                .AllowAnyHeader());

            app.ConfigureCustomExceptionMiddleware();

            app.UseMvc();
        }
    }
}
