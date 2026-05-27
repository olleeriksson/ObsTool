
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
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.Instrument)
                .ToList();
        }

        public ICollection<Observation> GetAllObservations(int userId)
        {
            return _dbContext.Observations
                .Where(o => o.UserId == userId)
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.Instrument)
                .ToList();
        }

        public Observation GetObservationById(int id)
        {
            return _dbContext.Observations.Where(o => o.Id == id)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.ObsResources)
                .Include(o => o.Instrument)
                .FirstOrDefault();
        }

        public Observation GetObservationById(int id, int userId)
        {
            return _dbContext.Observations.Where(o => o.Id == id && o.UserId == userId)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.ObsResources)
                .Include(o => o.Instrument)
                .FirstOrDefault();
        }

        public ICollection<Observation> GetObservationsByDsoId(int dsoId)
        {
            return _dbContext.Observations
                .Where(o => o.DsoObservations.Any(obs => obs.DsoId == dsoId))
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.Instrument)
                .ToList();
        }

        public ICollection<Observation> GetObservationsByDsoId(int dsoId, int userId)
        {
            return _dbContext.Observations
                .Where(o => o.UserId == userId)
                .Where(o => o.DsoObservations.Any(obs => obs.DsoId == dsoId))
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.Instrument)
                .ToList();
        }

        // Note!! Changed from ICollection to List because of a bug in .NET Core 3.0 (https://github.com/aspnet/EntityFrameworkCore/issues/17342)

        public ICollection<Observation> GetObservationsByMultipleDsoIds(List<int> dsoIds)
        {
            return _dbContext.Observations
                .Where(o => o.DsoObservations.Any(obs => obs.DsoId.HasValue && dsoIds.Contains(obs.DsoId.Value)))
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.Instrument)
                .ToList();
        }

        public ICollection<Observation> GetObservationsByMultipleDsoIds(List<int> dsoIds, int userId)
        {
            return _dbContext.Observations
                .Where(o => o.UserId == userId)
                .Where(o => o.DsoObservations.Any(obs => obs.DsoId.HasValue && dsoIds.Contains(obs.DsoId.Value)))
                .Include(o => o.ObsResources)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                .Include(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                .Include(o => o.Instrument)
                .ToList();
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
