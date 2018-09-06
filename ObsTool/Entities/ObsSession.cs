using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class ObsSession
    {
        [Key]
        public int Id { get; set; }

        public DateTime? Date { get; set; }

        [ForeignKey("LocationId")]
        public Location Location { get; set; }

        public int? LocationId { get; set; }

        [MaxLength(500)]
        public string Title { get; set; }

        [MaxLength(4000)]
        public string Summary { get; set; }

        [MaxLength(4000)]
        public string Conditions { get; set; }

        public int? Seeing { get; set; }

        public int? Transparency { get; set; }

        public decimal? LimitingMagnitude { get; set; }

        public List<Observation> Observations { get; set; } = new List<Observation>();

        public string ReportText { get; set; }
    }
}
