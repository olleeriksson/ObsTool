using AutoMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ObsTool.Services;
using ObsTool.Database;
using ObsTool.Utils;
using System;

namespace ObsTool
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IHostEnvironment env)
        {
            Configuration = configuration;
        }

        public static IConfiguration Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            //services.AddMvc();
            services.AddControllers()
                .SetCompatibilityVersion(CompatibilityVersion.Version_3_0);

            services.AddCors(options =>
            {
                options.AddPolicy("MyCorsPolicy",
                builder =>
                {
                    builder.WithOrigins(Configuration["CorsAllowedOrigins"])
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();  // for CORS with cookies, only development;
                });
            });

            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

            // Sqlite
            services.AddDbContext<MainDbContext>(o => o.UseSqlite(Configuration["Db:ConnectionString"]));

            services.AddScoped<ObsSessionsRepo>();
            services.AddScoped<LocationsRepo>();
            services.AddScoped<IDsoRepo, DsoRepo>();
            services.AddScoped<ObservationsRepo>();
            services.AddScoped<ReportTextManager>();
            services.AddScoped<ObservationsService>();
            services.AddScoped<ObsResourcesRepo>();
            services.AddScoped<DsoObservationsRepo>();

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ObsToolClient/build";
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostEnvironment env, ILoggerFactory loggerFactory)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // New in 2.1
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

            app.UseCors("MyCorsPolicy");

            //app.UseAuthentication();
            //app.UseAuthorization();

            app.ConfigureCustomExceptionMiddleware();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                //endpoints.MapFallbackToFile("index.html");
            });

            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "./ObsToolClient";

                // Disabled, I run npm start from VS Code for development
                //if (env.IsDevelopment())
                //{
                //    spa.UseReactDevelopmentServer(npmScript: "start");
                //}
            });
        }
    }
}
