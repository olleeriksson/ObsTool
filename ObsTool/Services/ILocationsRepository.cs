using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Services
{
    public interface ILocationsRepository
    {
        IEnumerable<Location> GetLocations();
        Location GetLocation(int id);
        int GetNumLocations();
        Location AddLocation(Location location);
        bool DeleteLocation(Location location);
        bool SaveChanges();
    }
}
