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

        public StatisticsDto GetStatistics()
        {
            var catalogProgressStatistics = GetCatalogProgressStatistics();
            return new StatisticsDto
            {
                NumObsSessions = _dbContext.ObsSessions.Count(),
                NumObservations = GetNumObservations(),
                NumObservedObjects = GetNumObservedObjects(),
                NumObservedGalaxies = GetNumObservedGalaxies(),
                NumObservedBrightNebulae = GetNumObservedBrightNebulae(),
                NumObservedDarkNebulae = GetNumObservedDarkNebulae(),
                NumObservedOpenClusters = GetNumObservedOpenClusters(),
                NumObservedPlanetaryNebulae = GetNumObservedPlanetaryNebulae(),
                NumObservedGlobularClusters = GetNumObservedGlobularClusters(),
                NumObservedMessierObjects = GetNumObservedMessierObjects(),
                NumObservedNGCObjects = GetNumObservedNGCObjects(),
                NumLocations = _dbContext.Locations.Count(),
                NumDsoInDatabase = _dbContext.Dso.Count(),
                NumSketches = _dbContext.ObsResources.Count(r => r.Type == "sketch"),
                NumDetections = GetNumDetections(),
                NumNonDetections = GetNumNonDetections(),
                H2500 = catalogProgressStatistics.H2500,
                H400 = catalogProgressStatistics.H400,
                Constellations = catalogProgressStatistics.Constellations
            };
        }

        public int GetNumObservations()
        {
            return _dbContext.Observations.Count();
        }

        public int GetNumDetections()
        {
            return DetectedDsoObservations()
                .Select(d => d.DsoId)
                .Distinct()
                .Count();
        }

        public int GetNumNonDetections()
        {
            var detectedDsoIds = DetectedDsoObservations()
                .Select(d => d.DsoId)
                .Distinct();

            return _dbContext.DsoObservations
                .Where(d => d.NonDetection || d.Observation.NonDetection)
                .Where(d => !detectedDsoIds.Contains(d.DsoId))
                .Select(d => d.DsoId)
                .Distinct()
                .Count();
        }

        public int GetNumObservedObjects()
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        public int GetNumObservedGalaxies()
        {
            return GetNumObservedObjectsByType("GALXY");
        }

        public int GetNumObservedBrightNebulae()
        {
            return GetNumObservedObjectsByType("BRTNB");
        }

        public int GetNumObservedDarkNebulae()
        {
            return GetNumObservedObjectsByType("DRKNB");
        }

        public int GetNumObservedPlanetaryNebulae()
        {
            return GetNumObservedObjectsByType("PLNNB");
        }

        public int GetNumObservedOpenClusters()
        {
            return GetNumObservedObjectsByType("OPNCL");
        }

        public int GetNumObservedGlobularClusters()
        {
            return GetNumObservedObjectsByType("GLOCL");
        }

        public int GetNumObservedMessierObjects()
        {
            return GetNumObservedObjectsByCatalog("M");
        }

        public int GetNumObservedNGCObjects()
        {
            return GetNumObservedObjectsByCatalog("NGC");
        }

        public int GetNumH2500Objects()
        {
            return _dbContext.H2500.Count();
        }

        public int GetNumObservedH2500Objects(bool includeNonDetections = true)
        {
            // Count Herschel list rows, not SAC objects; multiple H2500 rows can point to the same DSO.
            return ObservedH2500Query(includeNonDetections)
                .Select(h => h.HerschelId)
                .Distinct()
                .Count();
        }

        public (ObsGroupStatisticsDto H2500, ObsGroupStatisticsDto H400, IEnumerable<ConstellationStatisticsDto> Constellations) GetCatalogProgressStatistics()
        {
            var h2500Objects = _dbContext.H2500
                .AsNoTracking()
                .ToList();

            var observedDsoIds = DetectedDsoObservations()
                .AsNoTracking()
                .Select(dsoObservation => dsoObservation.DsoId)
                .Distinct()
                .ToHashSet();

            var nonDetectionDsoIds = _dbContext.DsoObservations
                .AsNoTracking()
                .Where(dsoObservation => dsoObservation.NonDetection || dsoObservation.Observation.NonDetection)
                .Select(dsoObservation => dsoObservation.DsoId)
                .Distinct()
                .ToHashSet();

            var observedObjectsByConstellation = DetectedDsoObservations()
                .AsNoTracking()
                .Select(dsoObservation => new
                {
                    dsoObservation.DsoId,
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
                // Use the abbreviation as the durable join key; H2500.Constellation is only display text from the source list.
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

        private IQueryable<DsoObservation> DetectedDsoObservations()
        {
            // Detection counts must honor both the current per-DSO flag and the legacy parent section flag.
            return _dbContext.DsoObservations
                .Where(d => !d.NonDetection && !d.Observation.NonDetection);
        }

        private int GetNumObservedObjectsByType(string type)
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Type == type)
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        private int GetNumObservedObjectsByCatalog(string catalog)
        {
            return _dbContext.Observations
                .SelectMany(o => o.DsoObservations)
                .Where(dsoObs => dsoObs.Dso.Catalog == catalog)
                .Select(dsoObs => dsoObs.Dso.Id)
                .Distinct()
                .Count();
        }

        private IQueryable<H2500> ObservedH2500Query(bool includeNonDetections)
        {
            return _dbContext.H2500
                .AsNoTracking()
                .Where(h => h.SacDeepSkyObjectsId != null &&
                    _dbContext.DsoObservations.Any(dsoObservation =>
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

        private static string NormalizeConstellationKey(string constellation)
        {
            return string.IsNullOrWhiteSpace(constellation) ? "UNKNOWN" : constellation.Trim().ToUpperInvariant();
        }
    }
}
