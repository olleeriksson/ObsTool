using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class ObsResource
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("ObservationId")]
        public int ObservationId { get; set; }

        [MaxLength(20)]
        public string Type { get; set; }

        [MaxLength(250)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string Url { get; set; }

        public int Rotation { get; set; } = 0;

        public bool Inverted { get; set; } = false;

        public int BackgroundColor { get; set; } = 0;
    }
}
