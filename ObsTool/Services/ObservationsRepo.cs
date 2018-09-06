﻿
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
        private MainDbContext _dbContext;

        public ObservationsRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Observation GetObservationById(int id)
        {
            return _dbContext.Observations.Where(o => o.Id == id)
                .Include(o => o.Dso)
                .Include(o => o.ObsResources)
                .FirstOrDefault();
        }

        public ICollection<Observation> GetObservationsByDsoId(int dsoId)
        {
            return _dbContext.Observations
                .Where(o => o.DsoId == dsoId)
                .Include(o => o.ObsResources)
                .ToList();
        }

        public ICollection<Observation> GetObservationsByMultipleDsoIds(ICollection<int> dsoIds)
        {
            return _dbContext.Observations
                .Where(o => dsoIds.Contains(o.DsoId))
                .Include(o => o.ObsResources)
                .ToList();
        }

        public int GetNumObservations()
        {
            return _dbContext.Observations.Count();
        }

        public int GetNumObservedObjects()
        {
            /*
             * TO BE IMPLEMENTED!!!!!!!!
             */
            // return _dbContext.Observations.Select<Dso>(o => o.Dso).Distinct();
            return _dbContext.Observations.Count();
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
