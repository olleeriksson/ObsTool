using ObsTool.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class StatisticsDto
    {
        public int NumObsSessions { get; set; }
        public int NumObservedObjects { get; set; }
        public int NumObservations { get; set; }
        public int NumLocations { get; set; }
        public int NumDsoInDatabase { get; set; }
        public int NumSketches { get; set; }
        public int NumDetections { get; set; }
        public int NumNonDetections { get; set; }
    }
}
