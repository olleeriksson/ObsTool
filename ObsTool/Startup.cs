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

namespace ObsTool
{
    public class Startup
    {
        public Startup(IHostingEnvironment env) // IConfiguration configuration) // old
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

            Configuration = builder.Build();

            //Configuration = configuration; // old
        }

        public static IConfiguration Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
            services.AddCors();

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

            AutoMapper.Mapper.Initialize(cfg =>
            {
                // disabling because the full ObsSession object gives a recursive problem when asking for a dso's observations
                cfg.CreateMap<Entities.DsoObservation, Models.DsoObservationDto>();
                cfg.CreateMap<Entities.ObsSession, Models.ObsSessionDto>();
                cfg.CreateMap<Entities.ObsSession, Models.ObsSessionDtoSimple>();
                cfg.CreateMap<Models.ObsSessionDto, Entities.ObsSession>();
                cfg.CreateMap<Models.ObsSessionDtoForUpdate, Entities.ObsSession>();
                cfg.CreateMap<Models.ObsSessionDtoForCreation, Entities.ObsSession>();
                cfg.CreateMap<Entities.Location, Models.LocationDto>();
                cfg.CreateMap<Models.LocationDto, Entities.Location>();
                cfg.CreateMap<Models.LocationDtoForCreation, Entities.Location>();
                cfg.CreateMap<Models.LocationDtoForUpdate, Entities.Location>();
                cfg.CreateMap<Entities.Dso, Models.DsoDto>();
                cfg.CreateMap<Entities.Observation, Models.ObservationDto>();
                cfg.CreateMap<Models.ObservationDto, Entities.Observation>();
                cfg.CreateMap<Entities.ObsResource, Models.ObsResourceDto>();
                cfg.CreateMap<Models.ObsResourceDto, Entities.ObsResource>();
                cfg.CreateMap<Models.ObsResourceDtoForCreationAndUpdate, Entities.ObsResource>();
                cfg.CreateMap<Entities.DsoExtra, Models.DsoExtraDto>();
                cfg.CreateMap<Models.DsoExtraDto, Entities.DsoExtra>();
            });
            //AutoMapper.Mapper.AssertConfigurationIsValid();

            loggerFactory.AddNLog();

            app.UseCors(options => options.WithOrigins(Configuration["CorsAllowedOrigins"])
                .AllowAnyMethod()
                .AllowAnyHeader());

            app.ConfigureCustomExceptionMiddleware();

            app.UseMvc();
        }
    }
}
