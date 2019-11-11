using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class ObservationDto
    {
        public int Id { get; set; }

        //public DsoDto Dso { get; set; }

        //public int DsoId { get; set; }

        // We'll have to do with this one, so we can look up the ObsSession separately
        public int ObsSessionId { get; set; }

        public string Identifier { get; set; }

        public List<DsoObservationDto> DsoObservations { get; set; }

        //public string CustomObjectName { get; set; }

        public string Text { get; set; }

        // Can not have this on the corresponding entity because it creates a self referencing loop between ObsSession and Observation
        public ObsSessionDto ObsSession { get; set; }

        public int? DisplayOrder { get; set; }

        public List<ObservationDto> OtherObservations { get; set; } = null;

        public List<ObsResourceDto> ObsResources { get; set; } = null;

        public bool NonDetection { get; set; } = false;
    }
}
