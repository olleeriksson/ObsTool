using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;

namespace ObsTool.Services
{
    public sealed class DsoCatalogSearchIndex
    {
        private readonly object _lock = new object();
        private readonly Dictionary<string, DsoCatalogSearchSnapshot> _snapshotsByDatabase = new Dictionary<string, DsoCatalogSearchSnapshot>();

        /// <summary>
        /// Searches the cached SAC catalog projection and returns matching DSO ids in catalog order.
        /// </summary>
        public IReadOnlyList<int> Search(MainDbContext dbContext, string queryString, bool normalize)
        {
            IReadOnlyCollection<string> queryKeys = normalize
                ? DsoDesignationNormalizer.BuildSearchKeys(queryString)
                : BuildPlainSearchKeys(queryString);
            if (queryKeys.Count == 0)
            {
                return Array.Empty<int>();
            }

            DsoCatalogSearchSnapshot snapshot = GetSnapshot(dbContext);
            return snapshot.Entries
                .Where(entry => entry.MatchesSearch(queryKeys))
                .Select(entry => entry.Id)
                .ToList();
        }

        /// <summary>
        /// Finds one exact object-name or alias match from the cached SAC catalog projection.
        /// </summary>
        public int? FindExactId(MainDbContext dbContext, string nameString)
        {
            IReadOnlyCollection<string> queryKeys = DsoDesignationNormalizer.BuildExactKeys(nameString);
            if (queryKeys.Count == 0)
            {
                return null;
            }

            DsoCatalogSearchSnapshot snapshot = GetSnapshot(dbContext);
            return snapshot.Entries.FirstOrDefault(entry => entry.MatchesExact(queryKeys))?.Id;
        }

        /// <summary>
        /// Returns a cached search snapshot for the current configured database, building it on first use.
        /// </summary>
        private DsoCatalogSearchSnapshot GetSnapshot(MainDbContext dbContext)
        {
            string cacheKey = BuildCacheKey(dbContext);
            lock (_lock)
            {
                if (_snapshotsByDatabase.TryGetValue(cacheKey, out DsoCatalogSearchSnapshot existingSnapshot))
                {
                    return existingSnapshot;
                }
            }

            DsoCatalogSearchSnapshot newSnapshot = BuildSnapshot(dbContext);
            lock (_lock)
            {
                if (_snapshotsByDatabase.TryGetValue(cacheKey, out DsoCatalogSearchSnapshot existingSnapshot))
                {
                    return existingSnapshot;
                }

                _snapshotsByDatabase[cacheKey] = newSnapshot;
                return newSnapshot;
            }
        }

        /// <summary>
        /// Builds a stable database key while avoiding cross-test reuse for in-memory SQLite connections.
        /// </summary>
        private static string BuildCacheKey(MainDbContext dbContext)
        {
            var connection = dbContext.Database.GetDbConnection();
            string provider = dbContext.Database.ProviderName ?? string.Empty;
            string dataSource = connection.DataSource ?? string.Empty;
            string database = connection.Database ?? string.Empty;

            if (string.Equals(dataSource, ":memory:", StringComparison.OrdinalIgnoreCase)
                || connection.ConnectionString.IndexOf("DataSource=:memory:", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return $"{provider}|memory|{RuntimeHelpers.GetHashCode(connection)}";
            }

            return $"{provider}|{dataSource}|{database}";
        }

        /// <summary>
        /// Reads the DSO catalog once as a no-tracking projection and precomputes search keys.
        /// </summary>
        private static DsoCatalogSearchSnapshot BuildSnapshot(MainDbContext dbContext)
        {
            var entries = dbContext.Dso
                .AsNoTracking()
                .Select(dso => new
                {
                    dso.Id,
                    dso.Name,
                    dso.OtherNames,
                    dso.CommonName,
                    dso.AllCommonNames
                })
                .AsEnumerable()
                .Select(row => DsoSearchEntry.Create(
                    row.Id,
                    row.Name,
                    row.OtherNames,
                    row.CommonName,
                    row.AllCommonNames))
                .ToList();

            return new DsoCatalogSearchSnapshot(entries);
        }

        /// <summary>
        /// Builds the non-normalized search key set used only when callers explicitly disable normalization.
        /// </summary>
        private static IReadOnlyCollection<string> BuildPlainSearchKeys(string queryString)
        {
            string key = DsoDesignationNormalizer.NormalizeFreeText(queryString);
            return string.IsNullOrWhiteSpace(key)
                ? Array.Empty<string>()
                : new[] { key };
        }

        private sealed class DsoCatalogSearchSnapshot
        {
            public DsoCatalogSearchSnapshot(IReadOnlyList<DsoSearchEntry> entries)
            {
                Entries = entries;
            }

            public IReadOnlyList<DsoSearchEntry> Entries { get; }
        }

        private sealed class DsoSearchEntry
        {
            private DsoSearchEntry(int id, IReadOnlyCollection<string> searchKeys, IReadOnlyCollection<string> exactKeys)
            {
                Id = id;
                SearchKeys = searchKeys;
                ExactKeys = exactKeys;
            }

            public int Id { get; }
            private IReadOnlyCollection<string> SearchKeys { get; }
            private IReadOnlyCollection<string> ExactKeys { get; }

            /// <summary>
            /// Creates one indexed catalog entry from the fields users can search by.
            /// </summary>
            public static DsoSearchEntry Create(int id, string name, string otherNames, string commonName, string allCommonNames)
            {
                var searchKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var exactKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                AddKeys(searchKeys, DsoDesignationNormalizer.BuildSearchKeys(name));
                AddKeys(searchKeys, DsoDesignationNormalizer.BuildSearchKeys(otherNames));
                AddKeys(searchKeys, DsoDesignationNormalizer.BuildSearchKeys(commonName));
                AddKeys(searchKeys, DsoDesignationNormalizer.BuildSearchKeys(allCommonNames));
                AddKeys(exactKeys, DsoDesignationNormalizer.BuildExactKeys(name));
                AddKeys(exactKeys, DsoDesignationNormalizer.BuildExactKeys(otherNames));
                AddKeys(exactKeys, DsoDesignationNormalizer.BuildExactKeys(commonName));
                AddKeys(exactKeys, DsoDesignationNormalizer.BuildExactKeys(allCommonNames));
                return new DsoSearchEntry(id, searchKeys, exactKeys);
            }

            /// <summary>
            /// Checks whether any query key is contained inside any indexed search key.
            /// </summary>
            public bool MatchesSearch(IReadOnlyCollection<string> queryKeys)
            {
                return queryKeys.Any(queryKey =>
                    SearchKeys.Any(searchKey => searchKey.Contains(queryKey, StringComparison.OrdinalIgnoreCase)));
            }

            /// <summary>
            /// Checks whether any query key exactly equals an indexed name or alias key.
            /// </summary>
            public bool MatchesExact(IReadOnlyCollection<string> queryKeys)
            {
                return queryKeys.Any(queryKey => ExactKeys.Contains(queryKey));
            }

            /// <summary>
            /// Copies source keys into a target set.
            /// </summary>
            private static void AddKeys(ISet<string> target, IEnumerable<string> source)
            {
                foreach (string key in source)
                {
                    target.Add(key);
                }
            }
        }
    }
}
