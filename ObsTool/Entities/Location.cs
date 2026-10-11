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

        public int UserId { get; set; }

        public AppUser User { get; set; }

        [Required]
        [MaxLength(250)]
        public string Name { get; set; }

        // Supply the retained required database columns on inserts; location DTOs remain name-only.
        [Required]
        public string GoogleMapsAddress { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Latitude { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Longitude { get; set; } = string.Empty;
    }
}
