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
        public Observation Observation { get; set; }

        [MaxLength(200)]
        public string CustomObjectName { get; set; } = "";

        //[ForeignKey("ObservationId")]
        public int ObservationId { get; set; }

        public Dso Dso { get; set; }

        //[ForeignKey("DsoId")]
        public int DsoId { get; set; }

        public int DisplayOrder { get; set; }

        public override bool Equals(object obj)
        {
            var observation = obj as DsoObservation;
            return observation != null &&
                   CustomObjectName == observation.CustomObjectName &&
                   ObservationId == observation.ObservationId &&
                   DsoId == observation.DsoId;
        }

        public override int GetHashCode()
        {
            var hashCode = 301107886;
            hashCode = hashCode * -1521134295 + EqualityComparer<string>.Default.GetHashCode(CustomObjectName);
            hashCode = hashCode * -1521134295 + ObservationId.GetHashCode();
            hashCode = hashCode * -1521134295 + DsoId.GetHashCode();
            return hashCode;
        }
    }
}
