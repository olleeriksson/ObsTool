using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class DsoObservation
    {
        [Key]
        public int Id { get; set; }

        public Observation Observation { get; set; }

        //[ForeignKey("ObservationId")]
        public int ObservationId { get; set; }

        public Dso Dso { get; set; }

        //[ForeignKey("DsoId")]
        public int? DsoId { get; set; }

        public OtherObject OtherObject { get; set; }

        public int? OtherObjectId { get; set; }

        public UserObject UserObject { get; set; }

        public int? UserObjectId { get; set; }

        public int DisplayOrder { get; set; }

        public bool NonDetection { get; set; } = false;

        /// <summary>
        /// Builds a stable key for comparing object links before a database row id exists.
        /// </summary>
        public string GetObjectKey()
        {
            if (DsoId.HasValue)
            {
                return $"Sac:{DsoId.Value}";
            }

            if (OtherObjectId.HasValue)
            {
                return $"Other:{OtherObjectId.Value}";
            }

            return UserObjectId.HasValue ? $"User:{UserObjectId.Value}" : string.Empty;
        }

        public override bool Equals(object obj)
        {
            var observation = obj as DsoObservation;
            return observation != null &&
                   ObservationId == observation.ObservationId &&
                   DsoId == observation.DsoId &&
                   OtherObjectId == observation.OtherObjectId &&
                   UserObjectId == observation.UserObjectId;
        }

        public override int GetHashCode()
        {
            var hashCode = 301107886;
            hashCode = hashCode * -1521134295 + ObservationId.GetHashCode();
            hashCode = hashCode * -1521134295 + DsoId.GetHashCode();
            hashCode = hashCode * -1521134295 + OtherObjectId.GetHashCode();
            hashCode = hashCode * -1521134295 + UserObjectId.GetHashCode();
            return hashCode;
        }
    }
}
