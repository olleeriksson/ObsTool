using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class LocationsRepository : ILocationsRepository
    {
        private MainDbContext _dbContext;

        public LocationsRepository(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Location AddLocation(Location location)
        {
            var addedLocation = _dbContext.Locations.Add(location);
            _dbContext.SaveChanges();

            return addedLocation.Entity;
        }

        public bool DeleteLocation(Location location)
        {
            _dbContext.Locations.Remove(location);
            return (_dbContext.SaveChanges() > 0);
        }

        public Location GetLocation(int id)
        {
            return _dbContext.Locations.FirstOrDefault(l => l.Id == id);
        }

        public IEnumerable<Location> GetLocations()
        {
            return _dbContext.Locations.ToList();
        }

        public int GetNumLocations()
        {
            return _dbContext.Locations.Count();
        }

        public bool SaveChanges()
        {
            return (_dbContext.SaveChanges() > 0);
        }
    }
}
