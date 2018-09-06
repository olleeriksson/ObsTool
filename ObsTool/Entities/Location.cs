using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ObsTool.Entities
{
    public class Location
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(250)]
        public string Name { get; set; }

        public float? Longitude { get; set; } = null;

        public float? Latitude { get; set; } = null;

        public string GoogleMapsAddress { get; set; }
    }
}
