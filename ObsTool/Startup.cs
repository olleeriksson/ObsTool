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
using MySql.EntityFrameworkCore.Extensions;

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
                if (Configuration.GetValue<bool>("EnableAuthentication"))
                {
                    var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
                    config.Filters.Add(new AuthorizeFilter(policy));
                }
            });

            services.AddCors(options =>
            {
                options.AddPolicy("MyCorsPolicy",
                builder =>
                {
                    var origins = Configuration["CorsAllowedOrigins"]?.Split(" ") ?? Array.Empty<string>();
                    if (origins.Length > 0)
                    {
                        builder.WithOrigins(origins)
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();  // for CORS with cookies, only development;
                    }
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
                    var pathBase = GetConfiguredPathBase();
                    // Avoid localhost cookie collisions between development root and integrated /obstool runs.
                    cookieOptions.Cookie.Name = BuildAuthenticationCookieName(pathBase);
                    if (!string.IsNullOrWhiteSpace(pathBase))
                    {
                        cookieOptions.Cookie.Path = pathBase;
                    }

                    // A user gets logged out after three hours of API inactivity.
                    cookieOptions.ExpireTimeSpan = TimeSpan.FromHours(3);
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

            services.AddAutoMapper(cfg => cfg.AddProfile<AutoMapperProfile>());

            services.Configure<AppOptions>(Configuration.GetSection(AppOptions.SectionName));
            services.Configure<MailServiceOptions>(Configuration.GetSection(MailServiceOptions.SectionName));
            services.Configure<AdminNotificationOptions>(Configuration.GetSection(AdminNotificationOptions.SectionName));

            services.AddDbContext<MainDbContext>(ConfigureDatabaseProvider);

            services.AddHttpContextAccessor();
            services.AddSingleton<DsoCatalogSearchIndex>();
            services.AddScoped<ObsSessionsRepo>();
            services.AddScoped<LocationsRepo>();
            services.AddScoped<IInstrumentsRepo, InstrumentsRepo>();
            services.AddScoped<EyepiecesRepo>();
            services.AddScoped<IDsoRepo, DsoRepo>();
            services.AddScoped<IH2500Repo, H2500Repo>();
            services.AddScoped<ObservationsRepo>();
            services.AddScoped<StatisticsService>();
            services.AddScoped<ReportTextManager>();
            services.AddScoped<ObservationsService>();
            services.AddScoped<ObsResourcesRepo>();
            services.AddScoped<DsoObservationsRepo>();
            services.AddScoped<UserDataExportService>();
            services.AddScoped<IMailService, MailService>();
            services.AddScoped<SystemEventService>();
            services.AddScoped<UserAccountService>();
            services.AddScoped<CurrentUserService>();

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ObsToolClient/build";
            });
        }

        private static void ConfigureDatabaseProvider(DbContextOptionsBuilder options)
        {
            var provider = Configuration["Db:Provider"] ?? "Sqlite";
            var connectionString = Configuration["Db:ConnectionString"];

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("Db:ConnectionString must be configured.");
            }

            switch (provider.Trim().ToLowerInvariant())
            {
                case "sqlite":
                    options.UseSqlite(connectionString);
                    break;
                case "mysql":
                    options.UseMySQL(connectionString);
                    break;
                default:
                    throw new InvalidOperationException($"Unsupported Db:Provider '{provider}'. Use 'Sqlite' or 'MySql'.");
            }
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostEnvironment env, ILoggerFactory loggerFactory)
        {
            var pathBase = Configuration["PathBase"] ?? Configuration["ASPNETCORE_PATHBASE"];
            pathBase = NormalizePathBase(pathBase);
            if (!string.IsNullOrWhiteSpace(pathBase))
            {
                // Supports production deployments and local production checks below /obstool.
                app.UsePathBase(pathBase);
            }

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

            app.UseRouting();

            app.UseCors("MyCorsPolicy");

            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseAuthorization();

            app.ConfigureCustomExceptionMiddleware();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            // In production, serve the React SPA files alongside the API
            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
                app.UseSpa(spa =>
                {
                    spa.Options.SourcePath = "./ObsToolClient";
                });
            }
        }

        private static string GetConfiguredPathBase()
        {
            return NormalizePathBase(Configuration["PathBase"] ?? Configuration["ASPNETCORE_PATHBASE"]);
        }

        private static string NormalizePathBase(string pathBase)
        {
            if (string.IsNullOrWhiteSpace(pathBase))
            {
                return null;
            }

            pathBase = pathBase.Trim();
            return pathBase.StartsWith("/") ? pathBase : "/" + pathBase;
        }

        private static string BuildAuthenticationCookieName(string pathBase)
        {
            var environmentName = string.IsNullOrWhiteSpace(Env?.EnvironmentName)
                ? "App"
                : Env.EnvironmentName;
            var pathPart = string.IsNullOrWhiteSpace(pathBase)
                ? "root"
                : pathBase.Trim('/');

            return $".ObsTool.{SanitizeCookieNamePart(environmentName)}.{SanitizeCookieNamePart(pathPart)}.Auth";
        }

        private static string SanitizeCookieNamePart(string value)
        {
            var result = string.Empty;
            foreach (var c in value)
            {
                result += char.IsLetterOrDigit(c) ? c : '_';
            }

            return string.IsNullOrWhiteSpace(result) ? "default" : result;
        }
    }
}
