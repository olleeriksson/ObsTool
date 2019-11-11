using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Models
{
    public class ObsSessionDtoForCreation
    {
        public DateTime? Date { get; set; }
        public int? LocationId { get; set; }
        public string Title { get; set; }
        public string Summary { get; set; }
        public string Conditions { get; set; }
        public int? Seeing { get; set; }
        public int? Transparency { get; set; }
        public decimal? LimitingMagnitude { get; set; }
        public string ReportText { get; set; }
    }
}
