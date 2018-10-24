using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class DsoObservationDto
    {
        // Must be populated manually becayse Observation has been removed from the entity
        //public ObservationDto Observation { get; set; }

        public int ObservationId { get; set; }

        public DsoDto Dso { get; set; }

        public int DsoId { get; set; }
    }
}
