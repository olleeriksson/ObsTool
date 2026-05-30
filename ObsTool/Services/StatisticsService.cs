using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using ObsTool.Database;
using ObsTool.Entities;
using ObsTool.Models;

namespace ObsTool.Services
{
    public class StatisticsService
    {
        private readonly MainDbContext _dbContext;

        public StatisticsService(MainDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public StatisticsDto GetStatistics(int userId, int statsExcludeLastSessions = 0)
        {
            var excludedObsSessionIds = GetExcludedObsSessionIds(userId, statsExcludeLastSessions);
            var includedObsSessions = IncludedObsSessions(userId, excludedObsSessionIds);
            var catalogProgressStatistics = GetCatalogProgressStatistics(userId, excludedObsSessionIds);
            return new StatisticsDto
            {
                NumObsSessions = includedObsSessions.Count(),
                NumObservations = GetNumObservations(userId, excludedObsSessionIds),
                NumObservedObjects = GetNumObservedObjects(userId, excludedObsSessionIds),
                NumObservedGalaxies = GetNumObservedObjectsByType("GALXY", userId, excludedObsSessionIds),
                NumObservedBrightNebulae = GetNumObservedObjectsByType("BRTNB", userId, excludedObsSessionIds),
                NumObservedDarkNebulae = GetNumObservedObjectsByType("DRKNB", userId, excludedObsSessionIds),
                NumObservedOpenClusters = GetNumObservedObjectsByType("OPNCL", userId, excludedObsSessionIds),
                NumObservedPlanetaryNebulae = GetNumObservedObjectsByType("PLNNB", userId, excludedObsSessionIds),
                NumObservedGlobularClusters = GetNumObservedObjectsByType("GLOCL", userId, excludedObsSessionIds),
                NumObservedMessierObjects = GetNumObservedObjectsByCatalog("M", userId, excludedObsSessionIds),
                NumObservedNGCObjects = GetNumObservedObjectsByCatalog("NGC", userId, excludedObsSessionIds),
                NumLocations = includedObsSessions.Where(obsSession => obsSession.LocationId.HasValue).Select(obsSession => obsSession.LocationId.Value).Distinct().Count(),
                NumDsoInDatabase = _dbContext.Dso.Count(),
                NumSketches = GetNumSketches(userId, excludedObsSessionIds),
                NumDetections = GetNumDetections(userId, excludedObsSessionIds),
                NumNonDetections = GetNumNonDetections(userId, excludedObsSessionIds),
                H2500 = catalogProgressStatistics.H2500,
                H400 = catalogProgressStatistics.H400,
                Constellations = catalogProgressStatistics.Constellations
            };
        }

        public int GetNumObservations(int userId)
        {
            return GetNumObservations(userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumDetections(int userId)
        {
            return GetNumDetections(userId, GetExcludedObsSessionIds(userId, 0));
        }

        private int GetNumObservations(int userId, List<int> excludedObsSessionIds)
        {
            return ObservationsInIncludedSessions(userId, excludedObsSessionIds).Count();
        }

        private int GetNumDetections(int userId, List<int> excludedObsSessionIds)
        {
            return DetectedDsoObservations(userId, excludedObsSessionIds)
                .AsEnumerable()
                .Select(d => d.GetObjectKey())
                .Where(objectKey => !string.IsNullOrWhiteSpace(objectKey))
                .Distinct()
                .Count();
        }

        public int GetNumNonDetections(int userId)
        {
            return GetNumNonDetections(userId, GetExcludedObsSessionIds(userId, 0));
        }

        private int GetNumNonDetections(int userId, List<int> excludedObsSessionIds)
        {
            var detectedDsoIds = DetectedDsoObservations(userId, excludedObsSessionIds)
                .AsEnumerable()
                .Select(d => d.GetObjectKey())
                .Where(objectKey => !string.IsNullOrWhiteSpace(objectKey))
                .Distinct()
                .ToHashSet();

            return _dbContext.DsoObservations
                .Where(d => d.Observation.UserId == userId)
                .Where(d => !excludedObsSessionIds.Contains(d.Observation.ObsSessionId))
                .Where(d => d.NonDetection || d.Observation.NonDetection)
                .AsEnumerable()
                .Where(d => !detectedDsoIds.Contains(d.GetObjectKey()))
                .Select(d => d.GetObjectKey())
                .Where(objectKey => !string.IsNullOrWhiteSpace(objectKey))
                .Distinct()
                .Count();
        }

        public int GetNumObservedObjects(int userId)
        {
            return GetNumObservedObjects(userId, GetExcludedObsSessionIds(userId, 0));
        }

        private int GetNumObservedObjects(int userId, List<int> excludedObsSessionIds)
        {
            return ObservationsInIncludedSessions(userId, excludedObsSessionIds)
                .SelectMany(o => o.DsoObservations)
                .AsEnumerable()
                .Select(dsoObs => dsoObs.GetObjectKey())
                .Where(objectKey => !string.IsNullOrWhiteSpace(objectKey))
                .Distinct()
                .Count();
        }

        public int GetNumObservedGalaxies(int userId)
        {
            return GetNumObservedObjectsByType("GALXY", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumObservedBrightNebulae(int userId)
        {
            return GetNumObservedObjectsByType("BRTNB", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumObservedDarkNebulae(int userId)
        {
            return GetNumObservedObjectsByType("DRKNB", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumObservedPlanetaryNebulae(int userId)
        {
            return GetNumObservedObjectsByType("PLNNB", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumObservedOpenClusters(int userId)
        {
            return GetNumObservedObjectsByType("OPNCL", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumObservedGlobularClusters(int userId)
        {
            return GetNumObservedObjectsByType("GLOCL", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumObservedMessierObjects(int userId)
        {
            return GetNumObservedObjectsByCatalog("M", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumObservedNGCObjects(int userId)
        {
            return GetNumObservedObjectsByCatalog("NGC", userId, GetExcludedObsSessionIds(userId, 0));
        }

        public int GetNumH2500Objects()
        {
            return _dbContext.H2500.Count();
        }

        public int GetNumObservedH2500Objects(int userId, bool includeNonDetections = true)
        {
            // Count Herschel list rows, not SAC objects; multiple H2500 rows can point to the same DSO.
            return ObservedH2500Query(includeNonDetections, userId)
                .Select(h => h.HerschelId)
                .Distinct()
                .Count();
        }

        public IEnumerable<ConstellationMapObjectDto> GetH2500ObjectsForConstellationMap(string constellation, int userId)
        {
            var constellationKey = ResolveConstellationKey(constellation);
            if (constellationKey == null)
            {
                return Enumerable.Empty<ConstellationMapObjectDto>();
            }

            var observedDsoIds = DetectedDsoObservations(userId, GetExcludedObsSessionIds(userId, 0))
                .AsNoTracking()
                .Where(dsoObservation => dsoObservation.DsoId.HasValue)
                .Select(dsoObservation => dsoObservation.DsoId.Value)
                .Distinct()
                .ToHashSet();

            return _dbContext.H2500
                .AsNoTracking()
                .Include(h => h.Dso)
                .Where(h => h.Dso != null)
                .Where(h => h.Const != null && h.Const.Trim().ToUpper() == constellationKey)
                .OrderBy(h => h.HerschelId)
                .ToList()
                .Select(h => new ConstellationMapObjectDto
                {
                    HerschelId = h.HerschelId,
                    HerschelNo = h.HerschelNo,
                    H400 = h.H400,
                    DsoId = h.Dso.Id,
                    Name = h.Dso.Name,
                    Catalog = h.Dso.Catalog,
                    CatalogNumber = h.Dso.CatalogNumber,
                    Constellation = h.Dso.Con,
                    RA = h.Dso.RA,
                    DEC = h.Dso.DEC,
                    IsObserved = h.SacDeepSkyObjectsId != null && observedDsoIds.Contains(h.SacDeepSkyObjectsId.Value)
                })
                .ToList();
        }

        public (ObsGroupStatisticsDto H2500, ObsGroupStatisticsDto H400, IEnumerable<ConstellationStatisticsDto> Constellations) GetCatalogProgressStatistics(int userId, int statsExcludeLastSessions = 0)
        {
            return GetCatalogProgressStatistics(userId, GetExcludedObsSessionIds(userId, statsExcludeLastSessions));
        }

        private (ObsGroupStatisticsDto H2500, ObsGroupStatisticsDto H400, IEnumerable<ConstellationStatisticsDto> Constellations) GetCatalogProgressStatistics(int userId, List<int> excludedObsSessionIds)
        {
            var h2500Objects = _dbContext.H2500
                .AsNoTracking()
                .ToList();

            var observedDsoIds = DetectedDsoObservations(userId, excludedObsSessionIds)
                .AsNoTracking()
                .Where(dsoObservation => dsoObservation.DsoId.HasValue)
                .Select(dsoObservation => dsoObservation.DsoId.Value)
                .Distinct()
                .ToHashSet();

            var nonDetectionDsoIds = _dbContext.DsoObservations
                .AsNoTracking()
                .Where(dsoObservation => dsoObservation.Observation.UserId == userId)
                .Where(dsoObservation => !excludedObsSessionIds.Contains(dsoObservation.Observation.ObsSessionId))
                .Where(dsoObservation => dsoObservation.NonDetection || dsoObservation.Observation.NonDetection)
                .Where(dsoObservation => dsoObservation.DsoId.HasValue)
                .Select(dsoObservation => dsoObservation.DsoId.Value)
                .Distinct()
                .ToHashSet();

            var observedObjectsByConstellation = DetectedDsoObservations(userId, excludedObsSessionIds)
                .AsNoTracking()
                .Where(dsoObservation => dsoObservation.DsoId.HasValue)
                .Select(dsoObservation => new
                {
                    DsoId = dsoObservation.DsoId.Value,
                    Constellation = dsoObservation.Dso.Con
                })
                .ToList()
                .GroupBy(dsoObservation => NormalizeConstellationKey(dsoObservation.Constellation))
                .Select(g => new
                {
                    Constellation = g.Key,
                    Observed = g.Select(dsoObservation => dsoObservation.DsoId).Distinct().Count()
                })
                .ToDictionary(s => s.Constellation, s => s.Observed);

            var constellationNames = _dbContext.Constellations
                .AsNoTracking()
                .ToDictionary(c => NormalizeConstellationKey(c.Abbreviation), c => c.Name);

            var h2500ObjectsByConstellation = h2500Objects
                .GroupBy(h => NormalizeConstellationKey(h.Const))
                .ToDictionary(g => g.Key, g => g.ToList());

            var constellationKeys = h2500ObjectsByConstellation.Keys
                .Union(observedObjectsByConstellation.Keys)
                .ToList();

            var constellationStats = constellationKeys
                .Select(constellationKey =>
                {
                    var objects = h2500ObjectsByConstellation.ContainsKey(constellationKey)
                        ? h2500ObjectsByConstellation[constellationKey]
                        : new List<H2500>();

                    return new ConstellationStatisticsDto
                    {
                        Constellation = constellationNames.ContainsKey(constellationKey)
                            ? constellationNames[constellationKey]
                            : constellationKey,
                        ConstellationAbbrv = constellationKey,
                        Observed = observedObjectsByConstellation.ContainsKey(constellationKey)
                            ? observedObjectsByConstellation[constellationKey]
                            : 0,
                        H2500 = CreateCatalogStatistics(objects, nonDetectionDsoIds, observedDsoIds),
                        H400 = CreateCatalogStatistics(objects.Where(h => h.H400), nonDetectionDsoIds, observedDsoIds)
                    };
                })
                .OrderByDescending(s => s.H2500.Total - s.H2500.Observed)
                .ThenBy(s => s.Constellation)
                .ToList();

            return (
                CreateCatalogStatistics(h2500Objects, nonDetectionDsoIds, observedDsoIds),
                CreateCatalogStatistics(h2500Objects.Where(h => h.H400), nonDetectionDsoIds, observedDsoIds),
                constellationStats);
        }

        // Applies the already-resolved session exclusion list to the user's observation sessions.
        private IQueryable<ObsSession> IncludedObsSessions(int userId, List<int> excludedObsSessionIds)
        {
            // Session-scoped statistics share this predicate so every table reflects the same date cutoff.
            return _dbContext.ObsSessions
                .Where(obsSession => obsSession.UserId == userId)
                .Where(obsSession => !excludedObsSessionIds.Contains(obsSession.Id));
        }

        // Applies the already-resolved session exclusion list to the user's observations.
        private IQueryable<Observation> ObservationsInIncludedSessions(int userId, List<int> excludedObsSessionIds)
        {
            // Observations are the common base for object, catalog, detection, and resource statistics.
            return _dbContext.Observations
                .Where(observation => observation.UserId == userId)
                .Where(observation => !excludedObsSessionIds.Contains(observation.ObsSessionId));
        }

        // Finds the newest user sessions to remove from a scoped statistics request.
        private List<int> GetExcludedObsSessionIds(int userId, int statsExcludeLastSessions)
        {
            // "Last sessions" means the user's newest sessions by observation date, then by id for stable ties.
            var sessionsToExclude = statsExcludeLastSessions < 0 ? 0 : statsExcludeLastSessions;
            if (sessionsToExclude == 0)
            {
                return new List<int>();
            }

            return _dbContext.ObsSessions
                .AsNoTracking()
                .Where(obsSession => obsSession.UserId == userId)
                .OrderByDescending(obsSession => obsSession.Date)
                .ThenByDescending(obsSession => obsSession.Id)
                .Take(sessionsToExclude)
                .Select(obsSession => obsSession.Id)
                .ToList();
        }

        // Returns detected DSO-observation rows after applying the session scope.
        private IQueryable<DsoObservation> DetectedDsoObservations(int userId, List<int> excludedObsSessionIds)
        {
            // Detection counts must honor both the current per-DSO flag and the legacy parent section flag.
            return _dbContext.DsoObservations
                .Where(d => d.Observation.UserId == userId)
                .Where(d => !excludedObsSessionIds.Contains(d.Observation.ObsSessionId))
                .Where(d => !d.NonDetection && !d.Observation.NonDetection);
        }

        // Counts distinct observed catalog objects of one SAC object type inside the session scope.
        private int GetNumObservedObjectsByType(string type, int userId, List<int> excludedObsSessionIds)
        {
            return ObservationsInIncludedSessions(userId, excludedObsSessionIds)
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.DsoId.HasValue && dsoObs.Dso.Type == type)
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        // Counts distinct observed objects from one catalog inside the session scope.
        private int GetNumObservedObjectsByCatalog(string catalog, int userId, List<int> excludedObsSessionIds)
        {
            return ObservationsInIncludedSessions(userId, excludedObsSessionIds)
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.DsoId.HasValue && dsoObs.Dso.Catalog == catalog)
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        // Counts sketch resources attached to observations inside the session scope.
        private int GetNumSketches(int userId, List<int> excludedObsSessionIds)
        {
            // Sketch resources hang off observations, so they are included only when their parent observation is included.
            var includedObservationIds = ObservationsInIncludedSessions(userId, excludedObsSessionIds)
                .Select(observation => observation.Id);

            return _dbContext.ObsResources
                .Count(resource =>
                    resource.UserId == userId &&
                    resource.Type == "sketch" &&
                    includedObservationIds.Contains(resource.ObservationId));
        }

        private IQueryable<H2500> ObservedH2500Query(bool includeNonDetections, int userId)
        {
            return _dbContext.H2500
                .AsNoTracking()
                .Where(h => h.SacDeepSkyObjectsId != null &&
                    _dbContext.DsoObservations.Any(dsoObservation =>
                        dsoObservation.Observation.UserId == userId &&
                        dsoObservation.DsoId.HasValue &&
                        dsoObservation.DsoId == h.SacDeepSkyObjectsId &&
                        (includeNonDetections || (!dsoObservation.NonDetection && !dsoObservation.Observation.NonDetection))));
        }

        private static ObsGroupStatisticsDto CreateCatalogStatistics(
            IEnumerable<H2500> objects,
            HashSet<int> nonDetectionDsoIds,
            HashSet<int> observedDsoIds)
        {
            var objectList = objects.ToList();
            var total = objectList.Count;
            var observed = objectList.Count(h => h.SacDeepSkyObjectsId != null && observedDsoIds.Contains(h.SacDeepSkyObjectsId.Value));
            var nonDetections = objectList.Count(h =>
                h.SacDeepSkyObjectsId != null &&
                nonDetectionDsoIds.Contains(h.SacDeepSkyObjectsId.Value) &&
                !observedDsoIds.Contains(h.SacDeepSkyObjectsId.Value));

            return new ObsGroupStatisticsDto
            {
                Total = total,
                Observed = observed,
                NonDetections = nonDetections
            };
        }

        private string ResolveConstellationKey(string constellation)
        {
            if (string.IsNullOrWhiteSpace(constellation))
            {
                return null;
            }

            var requested = constellation.Trim();
            var matchedConstellation = _dbContext.Constellations
                .AsNoTracking()
                .ToList()
                .FirstOrDefault(c =>
                    string.Equals(c.Name, requested, System.StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(c.Abbreviation, requested, System.StringComparison.OrdinalIgnoreCase));

            return matchedConstellation == null
                ? NormalizeConstellationKey(requested)
                : NormalizeConstellationKey(matchedConstellation.Abbreviation);
        }

        private static string NormalizeConstellationKey(string constellation)
        {
            return string.IsNullOrWhiteSpace(constellation) ? "UNKNOWN" : constellation.Trim().ToUpperInvariant();
        }
    }
}
