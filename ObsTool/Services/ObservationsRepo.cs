
using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Services
{
    public class ObservationsRepo
    {
        private Entities.MainDbContext _dbContext;

        public ObservationsRepo(Entities.MainDbContext dbContext)
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

        public ICollection<Observation> GetObservationsByMultipleDsoIds(ICollection<int> dsoIds)
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

        public int GetNumObservedObjects()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Select(dsoObs => dsoObs.Dso)
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
