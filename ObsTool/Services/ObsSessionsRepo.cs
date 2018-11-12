using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;

namespace ObsTool.Services
{
    public class ObsSessionsRepo
    {
        private Entities.MainDbContext _dbContext;

        public ObsSessionsRepo(Entities.MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public ObsSession AddObsSession(ObsSession obsSession)
        {

            var addedObsSession = _dbContext.ObsSessions.Add(obsSession);
            _dbContext.SaveChanges();

            return addedObsSession.Entity;
        }

        public bool DeleteObsSession(ObsSession obsSession)
        {
            // Load all observations
            _dbContext.Entry(obsSession).Collection("Observations").Load();

            foreach (Observation observation in obsSession.Observations)
            {
                // Load each observations' DsoObservations and then remove them
                _dbContext.Entry(observation).Collection("DsoObservations").Load();
                //observation.DsoObservations.RemoveAll(dsoObs => true);  // doesn't seem needed, just loading them
            }

            // Then delete the Observations themselves
            //obsSession.Observations.RemoveAll(obs => true);  // doesn't seem needed, just loading them

            // Finally delete the ObsSession itself
            _dbContext.ObsSessions.Remove(obsSession);
            return (_dbContext.SaveChanges() > 0);
        }

        public int GetNumObsSessions()
        {
            return _dbContext.ObsSessions.Count();
        }

        public ObsSession GetObsSession(int id)
        {
            return _dbContext.ObsSessions.FirstOrDefault(s => s.Id == id);
        }

        public ObsSession GetObsSession(int id, bool includeLocation = false, bool includeObservations = false,
            bool includeDso = false)
        {
            var query = _dbContext.ObsSessions.Where(s => s.Id == id);
            if (includeLocation)
            {
                query = query.Include(s => s.Location);
            }
            if (includeObservations && includeDso)
            {
                query = query
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                    .Include(s => s.Observations).ThenInclude(o => o.ObsResources);
            }
            else if (includeObservations)
            {
                query = query
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.Dso)
                    .Include(s => s.Observations).ThenInclude(o => o.ObsResources);
            }

            ObsSession obsSession = query.FirstOrDefault();
            return obsSession;

            //if (includeLocation)
            //{
            //    return _dbContext.ObsSessions.Include(s => s.Location)
            //        .Where(s => s.Id == id).FirstOrDefault();
            //}
            //return _dbContext.ObsSessions.FirstOrDefault(s => s.Id == id);
        }

        public IEnumerable<ObsSession> GetObsSessions(bool includeLocation = false, bool includeReportText = false)
        {
            var query = _dbContext.ObsSessions.AsQueryable();

            if (includeLocation)
            {
                query = query.Include(s => s.Location);
            }
            // TODO: Would be great if we could exclude the ReportText column from the query.
            //       DOesn't seem to exist any way to do that.

            return query.OrderBy(s => s.Date);
        }

        public ICollection<ObsSession> GetObsSessionsByMultipleIds(IList<int> ids)
        {
            // With LINQ
            //IEnumerable<ObsSession> obsSessions = from s in _dbContext.ObsSessions
            //                                        where ids.Any(id => id == s.Id)
            //                                        select s;
            //return obsSessions.ToList();

            List<ObsSession> list = _dbContext.ObsSessions
                .Where(s => ids.Contains(s.Id))
                .Include(s => s.Location)
                .ToList();
            return list;
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
