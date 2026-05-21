using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Database
{
    public class MainDbContext : DbContext
    {
        //public static readonly ILoggerFactory ConsoleLoggerFactory = LoggerFactory.Create(builder => builder.AddConsole());

        private ILogger<MainDbContext> _logger;

        public MainDbContext(DbContextOptions<MainDbContext> options, ILogger<MainDbContext> logger) : base(options)
        {
            _logger = logger;
            //Database.EnsureCreated();

            bool migrate = bool.TryParse(Startup.Configuration["Db:Migrate"], out var configuredMigrate) && configuredMigrate;
            _logger.LogInformation("Migrate DB: " + migrate);

            if (migrate)
            {
                _logger.LogInformation("Starting migration");
                Database.Migrate();
                _logger.LogInformation("Migration finished");
            }
        }
        public DbSet<Location> Locations { get; set; }

        public DbSet<Instrument> Instruments { get; set; }

        public DbSet<Eyepiece> Eyepieces { get; set; }

        public DbSet<Article> Articles { get; set; }

        public DbSet<Constellation> Constellations { get; set; }

        public DbSet<Dso> Dso { get; set; }

        public DbSet<DsoExtra> DsoExtra { get; set; }

        public DbSet<ObsSession> ObsSessions { get; set; }

        public DbSet<Observation> Observations { get; set; }

        public DbSet<ArticleConstellations> ArticleConstellations { get; set; }

        public DbSet<ArticleDsoObjects> ArticleDsoObjects { get; set; }

        public DbSet<DsoObservation> DsoObservations { get; set; }

        public DbSet<H2500> H2500 { get; set; }

        public DbSet<ObsResource> ObsResources { get; set; }

        public DbSet<AppUser> Users { get; set; }

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

            modelBuilder.Entity<AppUser>()
                .HasIndex(user => user.NormalizedEmail)
                .IsUnique();

            modelBuilder.Entity<AppUser>()
                .HasIndex(user => user.NormalizedUsername)
                .IsUnique();

            modelBuilder.Entity<ObsSession>()
                .HasAlternateKey(obsSession => new { obsSession.Id, obsSession.UserId });

            modelBuilder.Entity<Observation>()
                .HasAlternateKey(observation => new { observation.Id, observation.UserId });

            modelBuilder.Entity<Location>()
                .HasAlternateKey(location => new { location.Id, location.UserId });

            modelBuilder.Entity<Instrument>()
                .HasAlternateKey(instrument => new { instrument.Id, instrument.UserId });

            modelBuilder.Entity<ObsSession>()
                .HasOne(obsSession => obsSession.User)
                .WithMany()
                .HasForeignKey(obsSession => obsSession.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Observation>()
                .HasOne(observation => observation.User)
                .WithMany()
                .HasForeignKey(observation => observation.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DsoExtra>()
                .HasOne(dsoExtra => dsoExtra.User)
                .WithMany()
                .HasForeignKey(dsoExtra => dsoExtra.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ObsResource>()
                .HasOne(obsResource => obsResource.User)
                .WithMany()
                .HasForeignKey(obsResource => obsResource.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Location>()
                .HasOne(location => location.User)
                .WithMany()
                .HasForeignKey(location => location.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Instrument>()
                .HasOne(instrument => instrument.User)
                .WithMany()
                .HasForeignKey(instrument => instrument.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Eyepiece>()
                .HasOne(eyepiece => eyepiece.User)
                .WithMany()
                .HasForeignKey(eyepiece => eyepiece.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ObsSession>()
                .HasOne(obsSession => obsSession.Location)
                .WithMany()
                .HasPrincipalKey(location => new { location.Id, location.UserId })
                .HasForeignKey(obsSession => new { obsSession.LocationId, obsSession.UserId })
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ObsSession>()
                .HasOne(obsSession => obsSession.Instrument)
                .WithMany()
                .HasPrincipalKey(instrument => new { instrument.Id, instrument.UserId })
                .HasForeignKey(obsSession => new { obsSession.InstrumentId, obsSession.UserId })
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Observation>()
                .HasOne(observation => observation.Instrument)
                .WithMany()
                .HasPrincipalKey(instrument => new { instrument.Id, instrument.UserId })
                .HasForeignKey(observation => new { observation.InstrumentId, observation.UserId })
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Observation>()
                .HasOne<ObsSession>()
                .WithMany(obsSession => obsSession.Observations)
                .HasPrincipalKey(obsSession => new { obsSession.Id, obsSession.UserId })
                .HasForeignKey(observation => new { observation.ObsSessionId, observation.UserId })
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ObsResource>()
                .HasOne<Observation>()
                .WithMany(observation => observation.ObsResources)
                .HasPrincipalKey(observation => new { observation.Id, observation.UserId })
                .HasForeignKey(obsResource => new { obsResource.ObservationId, obsResource.UserId })
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DsoObservation>()
                .HasOne(dsoObs => dsoObs.Observation)
                .WithMany(obs => obs.DsoObservations)
                .HasForeignKey(dsoObs => dsoObs.ObservationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DsoObservation>()
                .HasOne(dsoObs => dsoObs.Dso)
                .WithMany(dso => dso.DsoObservations)
                .HasForeignKey(dsoObs => dsoObs.DsoId);

            modelBuilder.Entity<DsoExtra>()
                .HasIndex(dsoExtra => new { dsoExtra.UserId, dsoExtra.DsoId })
                .IsUnique();

            modelBuilder.Entity<DsoExtra>()
                .HasOne(dsoExtra => dsoExtra.Dso)
                .WithMany(dso => dso.DsoExtras)
                .HasForeignKey(dsoExtra => dsoExtra.DsoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DsoExtra>()
                .HasOne(dsoExtra => dsoExtra.ObsSession)
                .WithMany(obsSession => obsSession.DsoExtras)
                .HasPrincipalKey(obsSession => new { obsSession.Id, obsSession.UserId })
                .HasForeignKey(dsoExtra => new { dsoExtra.ObsSessionId, dsoExtra.UserId })
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<H2500>()
                .HasOne(h2500 => h2500.Dso)
                .WithMany(dso => dso.H2500Objects)
                .HasForeignKey(h2500 => h2500.SacDeepSkyObjectsId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
