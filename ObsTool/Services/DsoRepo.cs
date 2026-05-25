using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;
using ObsTool.Entities;

namespace ObsTool.Services
{
    public class DsoRepo : IDsoRepo
    {
        private MainDbContext _dbContext;
        private readonly DsoCatalogSearchIndex _searchIndex;
        private readonly Dictionary<int, Dso> _dsoByIdCache = new Dictionary<int, Dso>();

        public DsoRepo(MainDbContext dbContext)
            : this(dbContext, new DsoCatalogSearchIndex())
        {
        }

        public DsoRepo(MainDbContext dbContext, DsoCatalogSearchIndex searchIndex)
        {
            _dbContext = dbContext;
            _searchIndex = searchIndex;
        }

        // Note!! Changed from ICollection to List because of a bug in .NET Core 3.0 (https://github.com/aspnet/EntityFrameworkCore/issues/17342)
        public ICollection<Dso> GetMultipleDsoByIds(List<int> dsoIds)
        {
            return _dbContext.Dso
                .Where(dso => dsoIds.Contains(dso.Id))
                .ToList();
        }

        public ICollection<Dso> GetMultipleDsoByIds(List<int> dsoIds, int userId)
        {
            ICollection<Dso> foundDso = null;

            // Look for the normalized name in Name and OtherNames
            foundDso = AddUserDsoExtra(_dbContext.Dso, userId)
                .Where(dso => dsoIds.Contains(dso.Id))
                .ToList();
            PopulateUserDsoExtra(foundDso, userId);

            return foundDso;
        }

        public ICollection<Dso> GetMultipleDsoByQueryString(string queryString, bool normalize = true)
        {
            // Search the cached catalog projection, then load only the matching EF rows for this context.
            IReadOnlyList<int> matchedIds = _searchIndex.Search(_dbContext, queryString, normalize);
            return LoadDsoByIdsPreservingOrder(matchedIds);
        }

        public ICollection<Dso> GetMultipleDsoByQueryString(string queryString, bool normalize, int userId)
        {
            // Search the cached catalog projection, then load only the matching EF rows with user extras.
            IReadOnlyList<int> matchedIds = _searchIndex.Search(_dbContext, queryString, normalize);
            ICollection<Dso> foundDso = LoadDsoByIdsPreservingOrder(AddUserDsoExtra(_dbContext.Dso, userId), matchedIds);
            PopulateUserDsoExtra(foundDso, userId);

            return foundDso;
        }

        public Dso GetDsoById(int id)
        {
            return _dbContext.Dso.FirstOrDefault(dso => dso.Id == id); 
        }

        public Dso GetDsoById(int id, int userId)
        {
            return PopulateUserDsoExtra(AddUserDsoExtra(_dbContext.Dso, userId).FirstOrDefault(dso => dso.Id == id), userId);
        }

        public Dso GetDsoByName(string nameString, bool normalize = true)
        {
            int? matchedId = _searchIndex.FindExactId(_dbContext, nameString);
            return matchedId.HasValue ? GetDsoByIdCached(matchedId.Value) : null;
        }

        public Dso GetDsoByName(string nameString, bool normalize, int userId)
        {
            // Match the object id from the cached projection, then reload it through the user-aware query.
            int? matchedId = _searchIndex.FindExactId(_dbContext, nameString);
            if (!matchedId.HasValue)
            {
                return null;
            }

            Dso foundDso = AddUserDsoExtra(_dbContext.Dso, userId).FirstOrDefault(dso => dso.Id == matchedId.Value);
            return PopulateUserDsoExtra(foundDso, userId);
        }

        public Dso GetDsoByNumber(string catalogNo)
        {
            return _dbContext.Dso.FirstOrDefault(dso => dso.CatalogNumber == catalogNo);
        }

        public Dso GetDsoByNumber(string catalogNo, int userId)
        {
            return PopulateUserDsoExtra(AddUserDsoExtra(_dbContext.Dso, userId).FirstOrDefault(dso => dso.CatalogNumber == catalogNo), userId);
        }

        public int GetNumDsoInDatabase()
        {
            return _dbContext.Dso.Count();
        }

        public DsoExtra GetDsoExtraById(int id)
        {
            return _dbContext.DsoExtra.FirstOrDefault(dsoExtra => dsoExtra.Id == id);
        }

        public DsoExtra GetDsoExtraById(int id, int userId)
        {
            return _dbContext.DsoExtra.FirstOrDefault(dsoExtra => dsoExtra.Id == id && dsoExtra.UserId == userId);
        }

        /// <summary>
        /// Loads matched DSO rows and restores the order produced by the search index.
        /// </summary>
        private List<Dso> LoadDsoByIdsPreservingOrder(IReadOnlyList<int> dsoIds)
        {
            return LoadDsoByIdsPreservingOrder(_dbContext.Dso, dsoIds);
        }

        /// <summary>
        /// Loads matched DSO rows from the supplied query and restores the order produced by the search index.
        /// </summary>
        private List<Dso> LoadDsoByIdsPreservingOrder(IQueryable<Dso> query, IReadOnlyList<int> dsoIds)
        {
            if (dsoIds.Count == 0)
            {
                return new List<Dso>();
            }

            var matchedOrder = dsoIds
                .Select((id, index) => new { id, index })
                .ToDictionary(item => item.id, item => item.index);

            return query
                .Where(dso => dsoIds.Contains(dso.Id))
                .AsEnumerable()
                .OrderBy(dso => matchedOrder[dso.Id])
                .ToList();
        }

        /// <summary>
        /// Loads one tracked DSO row for this repository scope and keeps it available for repeated parser lookups.
        /// </summary>
        private Dso GetDsoByIdCached(int dsoId)
        {
            if (!_dsoByIdCache.TryGetValue(dsoId, out Dso dso))
            {
                dso = _dbContext.Dso.FirstOrDefault(row => row.Id == dsoId);
                _dsoByIdCache[dsoId] = dso;
            }

            return dso;
        }

        public ICollection<string> GetAllCatalogs()
        {
            return _dbContext.Dso
                .Where(dso => dso.Catalog != "")  // had to be added after I added the custom object with empty catalog
                .Select(dso => dso.Catalog)
                .Distinct()
                .ToList();
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

        private IQueryable<Dso> AddUserDsoExtra(IQueryable<Dso> query, int userId)
        {
            return query.Include(dso => dso.DsoExtras.Where(dsoExtra => dsoExtra.UserId == userId))
                .ThenInclude(dsoExtra => dsoExtra.ObsSession);
        }

        private static void PopulateUserDsoExtra(IEnumerable<Dso> dsos, int userId)
        {
            foreach (var dso in dsos)
            {
                PopulateUserDsoExtra(dso, userId);
            }
        }

        private static Dso PopulateUserDsoExtra(Dso dso, int userId)
        {
            if (dso != null)
            {
                dso.DsoExtra = dso.DsoExtras?.FirstOrDefault(dsoExtra => dsoExtra.UserId == userId);
            }

            return dso;
        }
    }
}
