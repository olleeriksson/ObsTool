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

namespace ObsTool
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public static IConfiguration Configuration { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
            services.AddCors();

            //services.AddDbContext<MainDbContext>(o => o.UseSqlServer(Configuration["Db:ConnectionStringLocaldb"]));
            services.AddDbContext<MainDbContext>(o => o.UseSqlServer(Configuration["Db:ConnectionStringSqlExpress"]));
#if DEBUG
            services.AddTransient<ILocalMailService, LocalMailServiceTest>();
#else
            services.AddTransient<ILocalMailService, LocalMailService>();
#endif
            services.AddScoped<IObsSessionsRepository, ObsSessionsRepository>();
            services.AddScoped<ILocationsRepository, LocationsRepository>();
            services.AddScoped<DsoRepo, DsoRepo>();
            services.AddScoped<ObservationsRepo>();
            services.AddScoped<ReportTextManager>();
            services.AddScoped<ObservationsService>();
            services.AddScoped<ObsResourcesRepo>();
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
            });

            loggerFactory.AddNLog();

            app.UseCors(options => options.WithOrigins(Configuration["CorsAllowedOrigins"])
                .AllowAnyMethod()
                .AllowAnyHeader());

            app.UseMvc();
        }
    }
}
