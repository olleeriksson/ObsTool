using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class MainDbContext : DbContext
    {
        //public static readonly ILoggerFactory ConsoleLoggerFactory = LoggerFactory.Create(builder => builder.AddConsole());

        private ILogger<MainDbContext> _logger;

        public MainDbContext(DbContextOptions<MainDbContext> options, ILogger<MainDbContext> logger) : base(options)
        {
            _logger = logger;
            //Database.EnsureCreated();

            bool migrate = bool.Parse(Startup.Configuration["Db:Migrate"]);
            _logger.LogInformation("Migrate DB: " + migrate);

            if (migrate)
            {
                _logger.LogInformation("Starting migration");
                Database.Migrate();
                _logger.LogInformation("Migration finished");
            }
        }
        public DbSet<Location> Locations { get; set; }

        public DbSet<Article> Articles { get; set; }

        public DbSet<Constellation> Constellations { get; set; }

        public DbSet<Dso> Dso { get; set; }

        public DbSet<DsoExtra> DsoExtra { get; set; }

        public DbSet<ObsSession> ObsSessions { get; set; }

        public DbSet<Observation> Observations { get; set; }

        public DbSet<ArticleConstellations> ArticleConstellations { get; set; }

        public DbSet<ArticleDsoObjects> ArticleDsoObjects { get; set; }

        public DbSet<DsoObservation> DsoObservations { get; set; }

        public DbSet<ObsResource> ObsResources { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder
                .EnableSensitiveDataLogging()
                //.UseLoggerFactory(ConsoleLoggerFactory);  // together with line at the top of the file

                // Configure EF Core logging.
                // This makes SQL queries being logged at Debug level. Change to info to see the SQL queries.
                .ConfigureWarnings(c => c.Log((RelationalEventId.CommandExecuting, LogLevel.Debug)));
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ArticleConstellations>().HasKey(ac => new { ac.ArticleId, ac.ConstellationId });
            modelBuilder.Entity<ArticleDsoObjects>().HasKey(ad => new { ad.ArticleId, ad.DsoId});
            modelBuilder.Entity<DsoObservation>().HasKey(ad => new { ad.ObservationId, ad.DsoId, ad.CustomObjectName });

            modelBuilder.Entity<DsoObservation>()
                .HasOne(dsoObs => dsoObs.Observation)
                .WithMany(obs => obs.DsoObservations)
                .HasForeignKey(dsoObs => dsoObs.ObservationId);

            modelBuilder.Entity<DsoObservation>()
                .HasOne(dsoObs => dsoObs.Dso)
                .WithMany(dso => dso.DsoObservations)
                .HasForeignKey(dsoObs => dsoObs.DsoId);

            modelBuilder.Entity<DsoExtra>()
                .HasOne(dsoExtra => dsoExtra.Dso)
                .WithOne(dso => dso.DsoExtra)
                .HasForeignKey<DsoExtra>(dsoExtra => dsoExtra.DsoId);

            modelBuilder.Entity<DsoExtra>()
                .HasOne(dsoExtra => dsoExtra.ObsSession)
                .WithMany(obsSession => obsSession.DsoExtras)
                .HasForeignKey(dsoExtra => dsoExtra.ObsSessionId);
        }
    }
}
