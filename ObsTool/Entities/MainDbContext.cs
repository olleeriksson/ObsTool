using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class MainDbContext : DbContext
    {
        public MainDbContext(DbContextOptions<MainDbContext> options) : base(options)
        {
            //Database.EnsureCreated();
            //Database.Migrate();
        }
        public DbSet<Location> Locations { get; set; }

        public DbSet<Article> Articles { get; set; }

        public DbSet<Constellation> Constellations { get; set; }

        public DbSet<Dso> Dso { get; set; }

        public DbSet<ObsSession> ObsSessions { get; set; }

        public DbSet<Observation> Observations { get; set; }

        public DbSet<ArticleConstellations> ArticleConstellations { get; set; }

        public DbSet<ArticleDsoObjects> ArticleDsoObjects { get; set; }

        public DbSet<ObsResource> ObsResources { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ArticleConstellations>().HasKey(ac => new { ac.ArticleId, ac.ConstellationId });
            modelBuilder.Entity<ArticleDsoObjects>().HasKey(ad => new { ad.ArticleId, ad.DsoId});
        }

        //protected override OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        //{
        //    string connectionString = "";
        //    optionsBuilder.UseSqlServer(connectionString);
        //    base.OnConfiguring(optionsBuilder);
        //}
    }
}
