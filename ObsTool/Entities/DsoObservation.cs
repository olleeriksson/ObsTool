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
        //public Observation Observation { get; set; }

        [ForeignKey("ObservationId")]
        public int ObservationId { get; set; }

        public Dso Dso { get; set; }

        [ForeignKey("DsoId")]
        public int DsoId { get; set; }
    }
}
