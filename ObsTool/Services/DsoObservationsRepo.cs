
using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Diagnostics;
using ObsTool.Database;

namespace ObsTool.Services
{
    public class DsoObservationsRepo
    {
        private MainDbContext _dbContext;

        public DsoObservationsRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public DsoObservation GetDsoObservation(int observationId, int dsoId)
        {
            DsoObservation dsoObservation = _dbContext.DsoObservations
                .Single(dsoObs => dsoObs.CustomObjectName == "" && dsoObs.ObservationId == observationId
                    && dsoObs.DsoId == dsoId);
            return dsoObservation;
        }

        public bool DeleteDsoObservation(DsoObservation dsoObservation)
        {
            var state = _dbContext.Entry(dsoObservation).State;

            dsoObservation.Observation = null;
            dsoObservation.Dso = null;
            _dbContext.DsoObservations.Remove(dsoObservation);

            return (_dbContext.SaveChanges() > 0);
        }
    }
}
