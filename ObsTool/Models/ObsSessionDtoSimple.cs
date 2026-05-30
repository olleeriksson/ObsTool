using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class ObsSessionDtoSimple
    {
        public int Id { get; set; }
        private DateTime? _date;
        public String Date
        {
            get
            {
                return _date?.ToString("yyyy-MM-dd");
            }
            set
            {
                _date = DateTime.Parse(value);
            }
        }
        public LocationDto Location { get; set; }
        public InstrumentDto Instrument { get; set; }
        public int? InstrumentId { get; set; }
        public string Title { get; set; }
        public string Summary { get; set; }
        public string Conditions { get; set; }
        public int? Seeing { get; set; }
        public int? Transparency { get; set; }
        public decimal? LimitingMagnitude { get; set; }
        public ObsSessionObjectStatsDto ObjectStats { get; set; }
    }

    public class ObsSessionObjectStatsDto
    {
        public int Total { get; set; }
        public int Galaxies { get; set; }
        public int Nebulae { get; set; }
        public int Clusters { get; set; }
        public int Other { get; set; }

        /// <summary>
        /// Builds broad object-count buckets from the parsed object links on one observation session.
        /// </summary>
        public static ObsSessionObjectStatsDto FromObsSession(ObsSession obsSession)
        {
            var objectTypesByKey = obsSession.Observations?
                .SelectMany(observation => observation.DsoObservations)
                .Select(dsoObservation => new
                {
                    Key = dsoObservation.GetObjectKey(),
                    Type = GetObjectType(dsoObservation)
                })
                .Where(observedObject => !string.IsNullOrWhiteSpace(observedObject.Key))
                .GroupBy(observedObject => observedObject.Key)
                .Select(group => group.First().Type)
                .ToList() ?? new List<string>();

            var stats = new ObsSessionObjectStatsDto
            {
                Total = objectTypesByKey.Count
            };

            foreach (var objectType in objectTypesByKey)
            {
                switch (GetObjectTypeBucket(objectType))
                {
                    case "galaxy":
                        stats.Galaxies += 1;
                        break;
                    case "nebula":
                        stats.Nebulae += 1;
                        break;
                    case "cluster":
                        stats.Clusters += 1;
                        break;
                    default:
                        stats.Other += 1;
                        break;
                }
            }

            return stats;
        }

        /// <summary>
        /// Reads the catalog or user-object type from the concrete object reference on a parsed observation link.
        /// </summary>
        private static string GetObjectType(DsoObservation dsoObservation)
        {
            if (dsoObservation.Dso != null)
            {
                return dsoObservation.Dso.Type;
            }

            if (dsoObservation.OtherObject != null)
            {
                return dsoObservation.OtherObject.Type;
            }

            return dsoObservation.UserObject?.Type;
        }

        /// <summary>
        /// Collapses detailed SAC/object type codes into the broad buckets used by the session-list card.
        /// </summary>
        private static string GetObjectTypeBucket(string objectType)
        {
            if (string.IsNullOrWhiteSpace(objectType))
            {
                return "other";
            }

            if (objectType.Contains("GAL", StringComparison.OrdinalIgnoreCase) ||
                objectType.Contains("GX", StringComparison.OrdinalIgnoreCase))
            {
                return "galaxy";
            }

            if (objectType.Contains("NB", StringComparison.OrdinalIgnoreCase) ||
                objectType.Contains("NEB", StringComparison.OrdinalIgnoreCase))
            {
                return "nebula";
            }

            if (objectType.Contains("CL", StringComparison.OrdinalIgnoreCase))
            {
                return "cluster";
            }

            return "other";
        }
    }
}
