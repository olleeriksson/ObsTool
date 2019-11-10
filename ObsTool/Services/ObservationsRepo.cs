
using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Database;

namespace ObsTool.Services
{
    public class ObservationsRepo
    {
        private MainDbContext _dbContext;

        public ObservationsRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public ICollection<Observation> GetAllObservations()
        {
            return _dbContext.Observations
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations)
                .ToList();
        }

        public Observation GetObservationById(int id)
        {
            return _dbContext.Observations.Where(o => o.Id == id)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.ObsResources)
                .FirstOrDefault();
        }

        public ICollection<Observation> GetObservationsByDsoId(int dsoId)
        {
            return _dbContext.Observations
                .Where(o => o.DsoObservations.Any(obs => obs.DsoId == dsoId))
                .Include(o => o.ObsResources)
                .ToList();
        }

        // Note!! Changed from ICollection to List because of a bug in .NET Core 3.0 (https://github.com/aspnet/EntityFrameworkCore/issues/17342)

        public ICollection<Observation> GetObservationsByMultipleDsoIds(List<int> dsoIds)
        {
            return _dbContext.Observations
                .Where(o => o.DsoObservations.Any(obs => dsoIds.Contains(obs.DsoId)))
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations)
                .ToList();
        }

        public int GetNumObservations()
        {
            return _dbContext.Observations.Count();
        }

        public int GetNumDetections()
        {
            return _dbContext.Observations
                .Where(o => !o.NonDetection)
                .Count();
        }

        public int GetNumNonDetections()
        {
            return _dbContext.Observations
                .Where(o => o.NonDetection)
                .Count();
        }

        public int GetNumObservedObjects()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedGalaxies()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Type == "GALXY")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedBrightNebulae()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Type == "BRTNB")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedDarkNebulae()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Type == "DRKNB")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedPlanetaryNebulae()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Type == "PLNNB")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedOpenClusters()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Type == "OPNCL")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedGlobularClusters()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Type == "GLOCL")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedMessierObjects()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Catalog == "M")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedNGCObjects()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Catalog == "NGC")
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public Observation AddObservation(Observation observation)
        {
            var addedObservation = _dbContext.Observations.Add(observation);
            _dbContext.SaveChanges();

            return addedObservation.Entity;
        }

        public bool DeleteObservation(Observation observation)
        {
            _dbContext.Observations.Remove(observation);
            return (_dbContext.SaveChanges() > 0);
        }

        public bool SaveChanges()
        {
            bool success = true;
            try
            {
                _dbContext.SaveChanges();
            }
            catch (DbUpdateException)
            {
                throw;
            }
            return success;
        }
    }
}
