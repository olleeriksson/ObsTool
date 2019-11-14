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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace ObsTool
{
    public class Startup
    {
        public static IConfiguration Configuration { get; set; }
        public static IHostEnvironment Env { get; set; }

        public Startup(IConfiguration configuration, IHostEnvironment env)
        {
            Configuration = configuration;
            Env = env;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            //services.AddMvc();
            services.AddControllers(config =>
            {
                // For default lock-down and then opt out with AllowAnonymous annotations
                if (bool.Parse(Configuration["EnableAuthentication"]))
                {
                    var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
                    config.Filters.Add(new AuthorizeFilter(policy));
                }
            })
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

            services.Configure<CookiePolicyOptions>(options =>
            {
                // This lambda determines whether user consent for non-essential cookies is needed for a given request.
                options.CheckConsentNeeded = context => false;
                //options.Secure = Env.IsDevelopment() ? CookieSecurePolicy.None : CookieSecurePolicy.Always;
                //options.Secure = CookieSecurePolicy.None;
                //options.MinimumSameSitePolicy = SameSiteMode.None;
            });

            services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(cookieOptions =>
                {
                    // A user gets locked out after 10 minutes of API inactivity
                    cookieOptions.ExpireTimeSpan = TimeSpan.FromMinutes(30);
                    cookieOptions.SlidingExpiration = true;
                    // The following is needed because with cookie authentication the default is 
                    // to redirect to a login page, and we want a 401 to be returned from an api request.
                    cookieOptions.Events.OnRedirectToLogin = (context) =>
                    {
                        context.Response.StatusCode = 401;
                        return Task.CompletedTask;
                    };
                }
            );
            services.AddAuthorization();

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

            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseAuthorization();

            app.ConfigureCustomExceptionMiddleware();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                //endpoints.MapFallbackToFile("index.html");
            });

            // There is a little bit of magic in here that serves the front end files from GET /.
            // The .csproj file contains commands to build the frontend.
            // Then a combination of AddSpaStaticFiles(), UseSpa(), UseStaticFiles(), UseSpaStaticFiles()
            // serves the frontend app from that directory while also serving the API controllers.
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
