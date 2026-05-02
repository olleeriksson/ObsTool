using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class H2500Repo : IH2500Repo
    {
        private MainDbContext _dbContext;

        public H2500Repo(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public H2500 GetH2500Object(int herschelId)
        {
            return BaseQuery().FirstOrDefault(h => h.HerschelId == herschelId);
        }

        public H2500 GetH2500ObjectByCatalog(string catalog, int catalogNumber)
        {
            return BaseQuery().FirstOrDefault(h => h.Cat == catalog && h.CatNo == catalogNumber);
        }

        public IEnumerable<H2500> GetH2500Objects()
        {
            return BaseQuery()
                .OrderBy(h => h.HerschelId)
                .ToList();
        }

        public IEnumerable<H2500> GetH2500ObjectsByDsoId(int dsoId)
        {
            return BaseQuery()
                .Where(h => h.SacDeepSkyObjectsId == dsoId)
                .OrderBy(h => h.HerschelId)
                .ToList();
        }

        public IEnumerable<H2500> GetObservedH2500Objects(bool includeNonDetections = true)
        {
            return ObservedQuery(includeNonDetections)
                .OrderBy(h => h.HerschelId)
                .ToList();
        }

        public int GetNumH2500Objects()
        {
            return _dbContext.H2500.Count();
        }

        public int GetNumObservedH2500Objects(bool includeNonDetections = true)
        {
            // Count Herschel list rows, not SAC objects; multiple H2500 rows can point to the same DSO.
            return ObservedQuery(includeNonDetections)
                .Select(h => h.HerschelId)
                .Distinct()
                .Count();
        }

        private IQueryable<H2500> BaseQuery()
        {
            return _dbContext.H2500
                .AsNoTracking()
                .Include(h => h.Dso);
        }

        private IQueryable<H2500> ObservedQuery(bool includeNonDetections)
        {
            return BaseQuery()
                .Where(h => h.SacDeepSkyObjectsId != null &&
                    _dbContext.DsoObservations.Any(dsoObservation =>
                        dsoObservation.DsoId == h.SacDeepSkyObjectsId &&
                        (includeNonDetections || !dsoObservation.NonDetection)));
        }
    }
}
