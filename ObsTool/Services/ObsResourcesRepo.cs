using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ObsTool.Entities;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;

namespace ObsTool.Services
{
    public class ObsResourcesRepo
    {
        private MainDbContext _dbContext;

        public ObsResourcesRepo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public int GetNumSketches()
        {
            return _dbContext.ObsResources
                .Where(r => r.Type == "sketch")
                .Count();
        }

        public ICollection<ObsResource> GetAllResources()
        {
            return _dbContext.ObsResources.ToList();
        }

        public ObsResource GetOneResource(int id)
        {
            return _dbContext.ObsResources.FirstOrDefault(r => r.Id == id);
        }

        public ICollection<ObsResource> GetObsResourceByObservationId(int observationId)
        {
            return _dbContext.ObsResources.Where(r => r.ObservationId == observationId).ToList();
        }

        public ObsResource AddObsResource(ObsResource ObsResource)
        {
            var addedObsResource = _dbContext.ObsResources.Add(ObsResource);
            _dbContext.SaveChanges();

            return addedObsResource.Entity;
        }

        public bool DeleteObsResource(ObsResource ObsResource)
        {
            _dbContext.ObsResources.Remove(ObsResource);
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
