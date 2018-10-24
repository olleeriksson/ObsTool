using Microsoft.EntityFrameworkCore;
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

        public DbSet<ObsSession> ObsSessions { get; set; }

        public DbSet<Observation> Observations { get; set; }

        public DbSet<ArticleConstellations> ArticleConstellations { get; set; }

        public DbSet<ArticleDsoObjects> ArticleDsoObjects { get; set; }

        public DbSet<DsoObservation> DsoObservations { get; set; }

        public DbSet<ObsResource> ObsResources { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ArticleConstellations>().HasKey(ac => new { ac.ArticleId, ac.ConstellationId });
            modelBuilder.Entity<ArticleDsoObjects>().HasKey(ad => new { ad.ArticleId, ad.DsoId});
            modelBuilder.Entity<DsoObservation>().HasKey(ad => new { ad.ObservationId, ad.DsoId });
        }

        //protected override OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        //{
        //    string connectionString = "";
        //    optionsBuilder.UseSqlServer(connectionString);
        //    base.OnConfiguring(optionsBuilder);
        //}
    }
}
