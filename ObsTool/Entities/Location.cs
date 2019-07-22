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

        [MaxLength(250)]
        public string Longitude { get; set; }

        [MaxLength(250)]
        public string Latitude { get; set; }

        public string GoogleMapsAddress { get; set; }
    }
}
