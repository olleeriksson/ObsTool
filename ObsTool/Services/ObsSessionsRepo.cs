using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;

namespace ObsTool.Services
{
    public class ObsSessionsRepo
    {
        private MainDbContext _dbContext;

        public ObsSessionsRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public ObsSession AddObsSession(ObsSession obsSession, int userId)
        {
            obsSession.UserId = userId;
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

        public int GetNumObsSessions(int userId)
        {
            return _dbContext.ObsSessions.Count(obsSession => obsSession.UserId == userId);
        }

        // Counts how many sessions owned by the user currently reference a single location.
        public int GetNumObsSessionsForLocation(int userId, int locationId)
        {
            return _dbContext.ObsSessions.Count(obsSession => obsSession.UserId == userId && obsSession.LocationId == locationId);
        }

        public ObsSession GetObsSession(int id)
        {
            return _dbContext.ObsSessions.FirstOrDefault(s => s.Id == id);
        }

        public ObsSession GetObsSession(int id, int userId)
        {
            return _dbContext.ObsSessions.FirstOrDefault(s => s.Id == id && s.UserId == userId);
        }

        public ObsSession GetObsSession(int id, bool includeLocation = false, bool includeObservations = false,
            bool includeDso = false)
        {
            return GetObsSession(id, null, includeLocation, includeObservations, includeDso);
        }

        public ObsSession GetObsSession(int id, int userId, bool includeLocation = false, bool includeObservations = false,
            bool includeDso = false)
        {
            return GetObsSession(id, (int?)userId, includeLocation, includeObservations, includeDso);
        }

        private ObsSession GetObsSession(int id, int? userId, bool includeLocation = false, bool includeObservations = false,
            bool includeDso = false)
        {
            var query = _dbContext.ObsSessions.Where(s => s.Id == id);
            if (userId.HasValue)
            {
                query = query.Where(s => s.UserId == userId.Value);
            }
            if (includeLocation)
            {
                query = query.Include(s => s.Location);
            }
            query = query.Include(s => s.Instrument);
            if (includeObservations && includeDso)
            {
                query = query
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.Dso).ThenInclude(dso => dso.DsoExtras)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                    .Include(s => s.Observations).ThenInclude(o => o.ObsResources)
                    .Include(s => s.Observations).ThenInclude(o => o.Instrument);
            }
            else if (includeObservations)
            {
                query = query
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.Dso).ThenInclude(dso => dso.DsoExtras)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.OtherObject)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(obs => obs.UserObject)
                    .Include(s => s.Observations).ThenInclude(o => o.ObsResources)
                    .Include(s => s.Observations).ThenInclude(o => o.Instrument);
            }

            ObsSession obsSession = query.FirstOrDefault();
            if (userId.HasValue)
            {
                PopulateUserDsoExtras(obsSession, userId.Value);
            }
            return obsSession;

            //if (includeLocation)
            //{
            //    return _dbContext.ObsSessions.Include(s => s.Location)
            //        .Where(s => s.Id == id).FirstOrDefault();
            //}
            //return _dbContext.ObsSessions.FirstOrDefault(s => s.Id == id);
        }

        public IEnumerable<ObsSession> GetObsSessions(bool includeLocation = false, bool includeReportText = false, bool includeObjectStats = false)
        {
            var query = _dbContext.ObsSessions.AsQueryable();

            if (includeLocation)
            {
                query = query.Include(s => s.Location);
            }
            query = query.Include(s => s.Instrument);
            if (includeObjectStats)
            {
                query = query
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(dsoObservation => dsoObservation.Dso)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(dsoObservation => dsoObservation.OtherObject)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(dsoObservation => dsoObservation.UserObject);
            }
            // TODO: Would be great if we could exclude the ReportText column from the query.
            //       DOesn't seem to exist any way to do that.

            return query.OrderBy(s => s.Date);
        }

        public IEnumerable<ObsSession> GetObsSessions(int userId, bool includeLocation = false, bool includeReportText = false, bool includeObjectStats = false)
        {
            var query = _dbContext.ObsSessions.Where(s => s.UserId == userId);

            if (includeLocation)
            {
                query = query.Include(s => s.Location);
            }
            query = query.Include(s => s.Instrument);
            if (includeObjectStats)
            {
                query = query
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(dsoObservation => dsoObservation.Dso)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(dsoObservation => dsoObservation.OtherObject)
                    .Include(s => s.Observations).ThenInclude(o => o.DsoObservations).ThenInclude(dsoObservation => dsoObservation.UserObject);
            }

            return query.OrderBy(s => s.Date);
        }

        // Note!! Changed from IList to List because of a bug in .NET Core 3.0 (https://github.com/aspnet/EntityFrameworkCore/issues/17342)
        public ICollection<ObsSession> GetObsSessionsByMultipleIds(List<int> ids, bool includeObservations = false)
        {
            // With LINQ
            //IEnumerable<ObsSession> obsSessions = from s in _dbContext.ObsSessions
            //                                        where ids.Any(id => id == s.Id)
            //                                        select s;
            //return obsSessions.ToList();

            var query = _dbContext.ObsSessions
                .Where(s => ids.Contains(s.Id));

            query = query.Include(s => s.Location);
            query = query.Include(s => s.Instrument);

            if (includeObservations)
            {
                query = query.Include(s => s.Observations).ThenInclude(o => o.Instrument);
            }
            return query.ToList();
        }

        public ICollection<ObsSession> GetObsSessionsByMultipleIds(List<int> ids, int userId, bool includeObservations = false)
        {
            var query = _dbContext.ObsSessions
                .Where(s => ids.Contains(s.Id) && s.UserId == userId);

            query = query.Include(s => s.Location);
            query = query.Include(s => s.Instrument);

            if (includeObservations)
            {
                query = query.Include(s => s.Observations).ThenInclude(o => o.Instrument);
            }
            return query.ToList();
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

        private static void PopulateUserDsoExtras(ObsSession obsSession, int userId)
        {
            if (obsSession?.Observations == null)
            {
                return;
            }

            foreach (var dso in obsSession.Observations
                .SelectMany(observation => observation.DsoObservations)
                .Select(dsoObservation => dsoObservation.Dso)
                .Where(dso => dso != null))
            {
                dso.DsoExtra = dso.DsoExtras?.FirstOrDefault(dsoExtra => dsoExtra.UserId == userId);
            }
        }
    }
}
